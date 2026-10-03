/**
 * Benefits for a widow(er): the survivor benefit on a late spouse's record
 * and their own retirement benefit, each started at its own age.
 *
 * Survivor benefits are exempt from deemed filing (POMS GN 00204.035), so a
 * widow(er) can start one benefit and switch to the other later. Each
 * benefit's reduction depends only on its own start age (RS 00615.150), and
 * once both have started SSA pays the own benefit plus any excess of the
 * survivor benefit over it (RS 00615.020): the larger of the two each month.
 */

import { reducedSurvivorBenefit } from '$lib/benefit-calculator';
import type { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import { BenefitPeriod, BenefitType } from './benefit-period.js';
import {
  earliestSurvivorBenefitDate,
  type LateSpouse,
  lateSpouseSurvivorBasis,
  validateSurvivorFiledMonth,
} from './late-spouse';
import { PersonalBenefitPeriods } from './recipient-personal-benefits.js';
import {
  benefitPeriodsNPVCents,
  calculateMonthlyDiscountRate,
  type FilingAgeRange,
  filingAgeRange,
} from './strategy-calc.js';

/** When a widow(er) starts each of their two benefits. */
export interface WidowedStrategy {
  /** Their SSA age when the survivor benefit starts. */
  readonly survivorStart: MonthDuration;
  /** Their SSA age when their own retirement benefit starts. */
  readonly ownStart: MonthDuration;
}

/** The furthest back SSA pays a new claim (20 CFR 404.621(a)(2)). */
const MAX_RETROACTIVE_MONTHS = 6;

/**
 * The monthly survivor benefit for a claim starting in `startDate`, in
 * today's dollars.
 */
export function widowedSurvivorBenefit(
  survivor: Recipient,
  lateSpouse: LateSpouse,
  startDate: MonthDate
): Money {
  return reducedSurvivorBenefit(
    survivor,
    lateSpouseSurvivorBasis(lateSpouse),
    startDate
  );
}

/**
 * The first age, at or after `fromMonths`, at which the survivor benefit
 * reaches its largest amount. That is survivor full retirement age, or
 * earlier when the widow(er)'s limit caps the benefit first. Starting later
 * only forgoes payments.
 */
function firstMaximumAgeMonths(
  survivor: Recipient,
  lateSpouse: LateSpouse,
  fromMonths: number
): number {
  const fra = survivor.survivorNormalRetirementAge().asMonths();
  if (fromMonths >= fra) return fromMonths;
  const basis = lateSpouseSurvivorBasis(lateSpouse);
  const amountAt = (ageMonths: number): number =>
    reducedSurvivorBenefit(
      survivor,
      basis,
      survivor.birthdate.dateAtSsaAge(new MonthDuration(ageMonths))
    ).cents();
  const maximum = amountAt(fra);
  for (let ageMonths = fromMonths; ageMonths < fra; ageMonths++) {
    if (amountAt(ageMonths) >= maximum) return ageMonths;
  }
  return fra;
}

/**
 * The survivor-benefit start ages still available as of `currentDate`.
 *
 * The range opens at the first month a survivor benefit is possible (see
 * `earliestSurvivorBenefitDate`) and closes where the benefit stops growing.
 * Once the survivor is past that point, the only option left is to claim
 * now, backdated as far as SSA allows (20 CFR 404.621; POMS GN 00204.030):
 * up to six months, but never into a month that would add age reduction.
 * In practice that means no earlier than survivor full retirement age, or
 * than the month the widow(er)'s limit started to cap the benefit. Before
 * that point no backdating is allowed at all.
 *
 * `filedAt`, when given, is the month survivor benefits actually started.
 * It must pass `validateSurvivorFiledMonth`; the form enforces that, so a
 * failure here is a programming error and throws.
 */
export function survivorFilingRange(
  survivor: Recipient,
  lateSpouse: LateSpouse,
  currentDate: MonthDate,
  filedAt: MonthDate | null
): FilingAgeRange {
  const birthdate = survivor.birthdate;
  if (filedAt !== null) {
    const problem = validateSurvivorFiledMonth(
      birthdate,
      filedAt,
      lateSpouse.deathDate,
      currentDate
    );
    if (problem !== null) {
      throw new Error(`invalid survivor start month: ${problem}`);
    }
    const filedAge = birthdate.ageAtSsaDate(filedAt);
    return {
      earliest: filedAge,
      latest: new MonthDuration(filedAge.asMonths()),
      hasChoice: false,
    };
  }

  const firstPossible = birthdate
    .ageAtSsaDate(earliestSurvivorBenefitDate(birthdate, lateSpouse.deathDate))
    .asMonths();
  const maximumFrom = firstMaximumAgeMonths(
    survivor,
    lateSpouse,
    firstPossible
  );
  const current = birthdate.ageAtSsaDate(currentDate).asMonths();

  let earliest: number;
  if (current <= firstPossible) {
    earliest = firstPossible;
  } else if (current >= maximumFrom) {
    earliest = Math.max(maximumFrom, current - MAX_RETROACTIVE_MONTHS);
  } else {
    earliest = current;
  }
  const latest = Math.max(earliest, maximumFrom);
  return {
    earliest: new MonthDuration(earliest),
    latest: new MonthDuration(latest),
    hasChoice: earliest < latest,
  };
}

/**
 * The own-retirement start ages still available as of `currentDate`: the
 * same as `filingAgeRange`, except that someone with no benefit on their
 * own record has nothing to choose.
 */
export function ownFilingRange(
  survivor: Recipient,
  currentDate: MonthDate,
  filedAt: MonthDate | null
): FilingAgeRange {
  const range = filingAgeRange(survivor, currentDate, filedAt);
  if (survivor.pia().primaryInsuranceAmount().cents() > 0) return range;
  return {
    earliest: range.earliest,
    latest: new MonthDuration(range.earliest.asMonths()),
    hasChoice: false,
  };
}

/**
 * The benefit periods for a widow(er) who follows `strategy` and dies in
 * `finalDate`.
 *
 * Each period is labelled by the benefit that pays it: Survivor while the
 * survivor benefit is the larger, Personal while their own is. The own
 * benefit can step up the January after a mid-year claim past full
 * retirement age (see `PersonalBenefitPeriods`), so a switch can happen
 * then rather than at either start date.
 */
export function strategySumPeriodsWidowed(
  survivor: Recipient,
  lateSpouse: LateSpouse,
  finalDate: MonthDate,
  strategy: WidowedStrategy
): BenefitPeriod[] {
  const survivorStartDate = survivor.birthdate.dateAtSsaAge(
    strategy.survivorStart
  );
  const ownStartDate = survivor.birthdate.dateAtSsaAge(strategy.ownStart);
  const survivorAmount = widowedSurvivorBenefit(
    survivor,
    lateSpouse,
    survivorStartDate
  );
  const ownPeriods: BenefitPeriod[] = [];
  PersonalBenefitPeriods(survivor, ownStartDate, finalDate, ownPeriods, 0);

  const ownAmountIn = (date: MonthDate): Money | null =>
    ownPeriods.find(
      (p) => !date.lessThan(p.startDate) && !date.greaterThan(p.endDate)
    )?.amount ?? null;

  // Every month in which either payment can change, through the month after
  // death, in order.
  const afterDeath = finalDate.addDuration(new MonthDuration(1));
  const boundaries = [
    survivorStartDate,
    ...ownPeriods.map((p) => p.startDate),
    afterDeath,
  ]
    .filter((date) => !date.greaterThan(afterDeath))
    .map((date) => date.monthsSinceEpoch());
  const months = [...new Set(boundaries)].sort((a, b) => a - b);

  const periods: BenefitPeriod[] = [];
  for (let i = 0; i + 1 < months.length; i++) {
    const start = new MonthDate(months[i]);
    const end = new MonthDate(months[i + 1] - 1);
    const own = ownAmountIn(start);
    const ownCents = own?.cents() ?? 0;
    const survivorCents = start.lessThan(survivorStartDate)
      ? 0
      : survivorAmount.cents();

    // SSA pays the larger. A tie is the own benefit plus a $0 excess.
    let benefitType: BenefitType;
    let amount: Money;
    if (survivorCents > ownCents) {
      benefitType = BenefitType.Survivor;
      amount = survivorAmount;
    } else if (own !== null && ownCents > 0) {
      benefitType = BenefitType.Personal;
      amount = own;
    } else {
      continue;
    }
    const previous = periods.at(-1);
    if (
      previous !== undefined &&
      previous.benefitType === benefitType &&
      previous.amount.equals(amount) &&
      previous.endDate.monthsSinceEpoch() + 1 === start.monthsSinceEpoch()
    ) {
      previous.endDate = end;
      continue;
    }
    const period = new BenefitPeriod();
    period.startDate = start;
    period.endDate = end;
    period.amount = amount;
    period.recipientIndex = 0;
    period.benefitType = benefitType;
    periods.push(period);
  }
  return periods;
}

/**
 * The net present value in cents of `strategy` for a widow(er) who dies in
 * `finalDate`, as of `currentDate`.
 */
export function strategySumCentsWidowed(
  survivor: Recipient,
  lateSpouse: LateSpouse,
  finalDate: MonthDate,
  currentDate: MonthDate,
  discountRate: number,
  strategy: WidowedStrategy
): number {
  return benefitPeriodsNPVCents(
    strategySumPeriodsWidowed(survivor, lateSpouse, finalDate, strategy),
    currentDate,
    calculateMonthlyDiscountRate(discountRate)
  );
}
