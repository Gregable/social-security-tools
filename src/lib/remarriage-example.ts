/**
 * Worked examples for the remarriage guide.
 *
 * Two people face the two remarriage rules that cost money. A widow of 58
 * is deciding whether to marry now or after 60: a marriage before 60 bars
 * the survivor benefit on her late spouse for as long as it lasts (20 CFR
 * 404.335(e)). A divorced retiree at full retirement age is paid on a
 * living former spouse's record, which ends when she marries (20 CFR
 * 404.332(b)(3)).
 *
 * Every Primary Insurance Amount is set directly, and a set PIA never has
 * cost-of-living adjustments applied, so the figures are in today's
 * dollars. The benefit amounts come from the same calculator the rest of
 * the site uses; the PIAs, the ages, and the legal ages and waiting periods
 * in the guide's prose (60, 62, 50, one year, nine months) are hand-written
 * and need a read each year.
 *
 * The result records are plain readonly interfaces produced only by the
 * functions beside them; they are not meant to be constructed by hand.
 */

import {
  benefitAtAge,
  spousalBenefitOnDate,
  survivorBenefit,
} from './benefit-calculator';
import { Birthdate } from './birthday';
import * as constants from './constants';
import { Money } from './money';
import { MonthDate, MonthDuration } from './month-time';
import { Recipient } from './recipient';

/**
 * A widow(er)'s remarriage at or after this age is disregarded (20 CFR
 * 404.335(e)(1)). It is also the earliest age for an aged widow(er)'s
 * benefit.
 */
export const REMARRIAGE_SAFE_AGE = 60;

/** The earliest age for a retirement benefit. */
const EARLIEST_RETIREMENT_AGE = 62;

const years = (n: number): MonthDuration =>
  MonthDuration.initFromYearsMonths({ years: n, months: 0 });

/** A person of `age` in the guide's year with a round PIA. */
function person(age: number, pia: Money): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(constants.MAX_YEAR - age, 0, 2);
  r.setPia(pia);
  return r;
}

/**
 * What `claimant` is paid as a spouse on `worker`'s record when both start
 * at their own full retirement age: half the worker's PIA less the
 * claimant's own PIA, never below zero. The same amount applies to a
 * current spouse and to a divorced spouse.
 */
function spousalTopUpAtFra(claimant: Recipient, worker: Recipient): Money {
  const claimantFra = claimant.normalRetirementDate();
  const workerFra = worker.normalRetirementDate();
  const bothStarted = MonthDate.max(claimantFra, workerFra);
  return spousalBenefitOnDate(
    claimant,
    worker,
    workerFra,
    claimantFra,
    bothStarted.addDuration(MonthDuration.OneYear())
  );
}

/**
 * The survivor benefit `survivor` is paid at `claimAge` on a spouse who
 * died before full retirement age without having claimed, so that the full
 * benefit is 100% of the PIA.
 */
function survivorAtAge(
  survivor: Recipient,
  deceased: Recipient,
  claimAge: MonthDuration
): Money {
  const claimDate = survivor.birthdate.dateAtSsaAge(claimAge);
  // Any month before the deceased's full retirement age and before the
  // claim gives the same result; the month the deceased turned 50 is both.
  const deathDate = deceased.birthdate.dateAtSsaAge(years(50));
  return survivorBenefit(survivor, deceased, deathDate, deathDate, claimDate);
}

export const WIDOW_EXAMPLE = {
  ageNow: 58,
  ownPia: Money.from(1100),
  lateSpousePia: Money.from(2800),
  newSpousePia: Money.from(2600),
} as const;

export interface WidowRemarriage {
  readonly ageNow: number;
  readonly birthYear: number;
  readonly fullRetirementAge: MonthDuration;
  readonly survivorFullRetirementAge: MonthDuration;
  /** Survivor benefit on the late spouse, claimed at 60. */
  readonly survivorAtSixty: Money;
  /** Survivor benefit on the late spouse, claimed at survivor FRA. */
  readonly survivorAtFra: Money;
  /** Her own retirement benefit claimed at 62. */
  readonly ownAtSixtyTwo: Money;
  /** Her own retirement benefit claimed at full retirement age. */
  readonly ownAtFra: Money;
  /** What the new spouse's record adds to her own benefit at FRA. */
  readonly newSpouseTopUpAtFra: Money;
  /** Everything payable at FRA if she married before 60. */
  readonly marriedEarlyTotalAtFra: Money;
  /** How much less a month she is paid at FRA for marrying before 60. */
  readonly monthlyCostAtFra: Money;
  readonly annualCostAtFra: Money;
  /** Months from 60 until her own retirement benefit can first be paid. */
  readonly monthsBeforeOwnBenefit: number;
  /** Survivor benefits from 60 to 62 that marrying before 60 gives up. */
  readonly survivorForgoneBeforeSixtyTwo: Money;
}

/**
 * The widow's choice: marry before 60 and live on her own record and her
 * new spouse's, or marry at 60 or later and keep the survivor benefit on
 * her late spouse as well.
 */
export function widowRemarriage(): WidowRemarriage {
  const { ageNow, ownPia, lateSpousePia, newSpousePia } = WIDOW_EXAMPLE;
  const widow = person(ageNow, ownPia);
  const lateSpouse = person(ageNow, lateSpousePia);
  const newSpouse = person(ageNow, newSpousePia);

  const fullRetirementAge = widow.normalRetirementAge();
  const survivorFullRetirementAge = widow.survivorNormalRetirementAge();
  const survivorAtSixty = survivorAtAge(
    widow,
    lateSpouse,
    years(REMARRIAGE_SAFE_AGE)
  );
  const survivorAtFra = survivorAtAge(
    widow,
    lateSpouse,
    survivorFullRetirementAge
  );
  const ownAtFra = benefitAtAge(widow, fullRetirementAge);
  const newSpouseTopUpAtFra = spousalTopUpAtFra(widow, newSpouse);
  const marriedEarlyTotalAtFra = ownAtFra.plus(newSpouseTopUpAtFra);
  const monthlyCostAtFra = survivorAtFra.sub(marriedEarlyTotalAtFra);
  const monthsBeforeOwnBenefit =
    (EARLIEST_RETIREMENT_AGE - REMARRIAGE_SAFE_AGE) * 12;

  return {
    ageNow,
    birthYear: widow.birthdate.ssaBirthYear(),
    fullRetirementAge,
    survivorFullRetirementAge,
    survivorAtSixty,
    survivorAtFra,
    ownAtSixtyTwo: benefitAtAge(widow, years(EARLIEST_RETIREMENT_AGE)),
    ownAtFra,
    newSpouseTopUpAtFra,
    marriedEarlyTotalAtFra,
    monthlyCostAtFra,
    annualCostAtFra: monthlyCostAtFra.times(12),
    monthsBeforeOwnBenefit,
    survivorForgoneBeforeSixtyTwo: survivorAtSixty.times(
      monthsBeforeOwnBenefit
    ),
  };
}

export const DIVORCED_EXAMPLE = {
  age: 67,
  ownPia: Money.from(900),
  formerSpousePia: Money.from(3200),
  newSpousePia: Money.from(2000),
} as const;

export interface DivorcedRemarriage {
  /** Her own retirement benefit at full retirement age. */
  readonly own: Money;
  /** What the former spouse's record adds while she is unmarried. */
  readonly formerSpouseTopUp: Money;
  readonly totalUnmarried: Money;
  /**
   * What the new spouse's record adds. Someone entitled as a divorced
   * spouse in the month before the wedding does not wait a year for it
   * (20 CFR 404.330(a)(3)).
   */
  readonly newSpouseTopUp: Money;
  readonly totalRemarried: Money;
  /** How much less a month she is paid after the wedding. */
  readonly monthlyCost: Money;
  /** What she would be paid if the former spouse had died instead. */
  readonly survivorOnFormerSpouse: Money;
}

/**
 * A divorced retiree at full retirement age, paid partly on a living
 * former spouse's record, who marries someone with a smaller benefit.
 */
export function divorcedRemarriage(): DivorcedRemarriage {
  const { age, ownPia, formerSpousePia, newSpousePia } = DIVORCED_EXAMPLE;
  const retiree = person(age, ownPia);
  const formerSpouse = person(age, formerSpousePia);
  const newSpouse = person(age, newSpousePia);

  const own = benefitAtAge(retiree, retiree.normalRetirementAge());
  const formerSpouseTopUp = spousalTopUpAtFra(retiree, formerSpouse);
  const newSpouseTopUp = spousalTopUpAtFra(retiree, newSpouse);
  const totalUnmarried = own.plus(formerSpouseTopUp);
  const totalRemarried = own.plus(newSpouseTopUp);

  return {
    own,
    formerSpouseTopUp,
    totalUnmarried,
    newSpouseTopUp,
    totalRemarried,
    monthlyCost: totalUnmarried.sub(totalRemarried),
    survivorOnFormerSpouse: survivorAtAge(
      retiree,
      formerSpouse,
      retiree.survivorNormalRetirementAge()
    ),
  };
}
