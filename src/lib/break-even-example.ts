/**
 * Worked examples for the break-even age guide.
 *
 * The guide follows one retiree who turns 62 in the latest year the
 * constants cover, with a round Primary Insurance Amount, and asks at what
 * age the larger check from claiming later has paid back the months of
 * benefits given up by waiting. Every figure is derived from constants.ts
 * and the benefit calculator, so the guide's tables follow the annual
 * update. The example PIA and any sentence in the guide naming a
 * percentage are hand-written and still need a read each year.
 *
 * The comparison is nominal: cost-of-living adjustments scale both choices
 * by the same factor, so they move the dollar figures without moving the
 * break-even age. It also ignores the time value of money and mortality;
 * the strategy page handles those.
 *
 * The result records are plain readonly interfaces produced only by the
 * functions beside them; they are not meant to be constructed by hand.
 */

import { benefitAtAge, survivorBenefit } from './benefit-calculator';
import { Birthdate } from './birthday';
import * as constants from './constants';
import { Money } from './money';
import { MonthDuration } from './month-time';
import { Recipient } from './recipient';

/** A round Primary Insurance Amount the guide can reason about aloud. */
export const EXAMPLE_PIA: Money = Money.from(2500);

/** Age of the example retiree in the guide's year. */
const EXAMPLE_RETIREE_AGE = 62;

const EARLIEST_CLAIM_AGE = MonthDuration.initFromYearsMonths({
  years: 62,
  months: 0,
});

/** Delayed credits stop at 70, so no later claim changes the benefit. */
const LATEST_CLAIM_AGE = MonthDuration.initFromYearsMonths({
  years: 70,
  months: 0,
});

/**
 * An age at which the example retiree has died, used only to place the
 * death after every claiming age compared and the spouse past survivor
 * full retirement age, so the survivor figure is the unreduced base amount.
 */
const SURVIVOR_EXAMPLE_DEATH_AGE = MonthDuration.initFromYearsMonths({
  years: 75,
  months: 0,
});

/**
 * A retiree who turns 62 in the latest year the constants cover, so no
 * cost-of-living adjustment has yet applied. Born on the 2nd of the month:
 * only someone born on the 1st or 2nd is 62 for their whole birth month,
 * which a claim at exactly 62 requires. The birth year gives a full
 * retirement age of 67, which the guide states in prose.
 */
export function exampleRetiree(): Recipient {
  const retiree = new Recipient();
  retiree.birthdate = Birthdate.FromYMD(
    constants.MAX_YEAR - EXAMPLE_RETIREE_AGE,
    0,
    2
  );
  retiree.setPia(EXAMPLE_PIA);
  return retiree;
}

export interface BreakEven {
  readonly earlierAge: MonthDuration;
  readonly laterAge: MonthDuration;
  readonly earlierBenefit: Money;
  readonly laterBenefit: Money;
  /** What the earlier claim has collected by the time the later one starts. */
  readonly headStart: Money;
  /** How much more the later claim pays each month from then on. */
  readonly monthlyGain: Money;
  /** Time after the later claim starts for the gain to repay the head start. */
  readonly timeToBreakEven: MonthDuration;
  /** The first month in which the later claim has collected at least as much. */
  readonly breakEvenAge: MonthDuration;
  /** The base survivor benefit a spouse would inherit under each choice. */
  readonly survivorIfEarlier: Money;
  readonly survivorIfLater: Money;
}

function validateClaimAges(earlier: MonthDuration, later: MonthDuration): void {
  if (earlier.lessThan(EARLIEST_CLAIM_AGE)) {
    throw new Error(
      `benefits cannot start before 62, got ${earlier.toYearsAndMonthsString()}`
    );
  }
  if (later.greaterThan(LATEST_CLAIM_AGE)) {
    throw new Error(
      `waiting past 70 adds nothing, got ${later.toYearsAndMonthsString()}`
    );
  }
  if (!earlier.lessThan(later)) {
    throw new Error(
      `the earlier age must come before the later one, got ${earlier.toYearsAndMonthsString()} and ${later.toYearsAndMonthsString()}`
    );
  }
}

/**
 * The base survivor benefit a same-age spouse would receive if the retiree
 * claimed at `claimAge` and died at SURVIVOR_EXAMPLE_DEATH_AGE.
 */
function survivorAfterClaimAt(
  retiree: Recipient,
  claimAge: MonthDuration
): Money {
  const spouse = new Recipient();
  spouse.birthdate = retiree.birthdate;
  const filingDate = retiree.birthdate.dateAtSsaAge(claimAge);
  const deathDate = retiree.birthdate.dateAtSsaAge(SURVIVOR_EXAMPLE_DEATH_AGE);
  const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));
  return survivorBenefit(
    spouse,
    retiree,
    filingDate,
    deathDate,
    survivorFilingDate
  );
}

/**
 * When a claim at `later` has collected as much in total as a claim at
 * `earlier`, counting nominal dollars from the earlier claim onward.
 */
export function breakEven(
  retiree: Recipient,
  earlier: MonthDuration,
  later: MonthDuration
): BreakEven {
  validateClaimAges(earlier, later);
  const earlierBenefit = benefitAtAge(retiree, earlier);
  const laterBenefit = benefitAtAge(retiree, later);
  const monthlyGain = laterBenefit.sub(earlierBenefit);
  if (!monthlyGain.greaterThan(Money.from(0))) {
    throw new Error(
      `claiming at ${later.toYearsAndMonthsString()} pays no more than at ${earlier.toYearsAndMonthsString()}`
    );
  }
  const headStart = earlierBenefit.times(later.subtract(earlier).asMonths());
  const timeToBreakEven = new MonthDuration(
    Math.ceil(headStart.div$(monthlyGain))
  );
  return {
    earlierAge: earlier,
    laterAge: later,
    earlierBenefit,
    laterBenefit,
    headStart,
    monthlyGain,
    timeToBreakEven,
    breakEvenAge: later.add(timeToBreakEven),
    survivorIfEarlier: survivorAfterClaimAt(retiree, earlier),
    survivorIfLater: survivorAfterClaimAt(retiree, later),
  };
}

export interface ClaimAgeRow {
  readonly age: MonthDuration;
  readonly benefit: Money;
  /**
   * The break-even against claiming at full retirement age: for an earlier
   * age, when the FRA claim catches up; for a later age, when this claim
   * catches up with the FRA claim. Null for full retirement age itself.
   */
  readonly versusFra: BreakEven | null;
}

/** One row per whole year of claiming age from 62 to 70. */
export function claimAgeRows(retiree: Recipient): ClaimAgeRow[] {
  const fra = retiree.normalRetirementAge();
  const rows: ClaimAgeRow[] = [];
  for (
    let years = EARLIEST_CLAIM_AGE.years();
    years <= LATEST_CLAIM_AGE.years();
    years++
  ) {
    const at = MonthDuration.initFromYearsMonths({ years, months: 0 });
    let versusFra: BreakEven | null = null;
    if (at.lessThan(fra)) {
      versusFra = breakEven(retiree, at, fra);
    } else if (at.greaterThan(fra)) {
      versusFra = breakEven(retiree, fra, at);
    }
    rows.push({ age: at, benefit: benefitAtAge(retiree, at), versusFra });
  }
  return rows;
}

/**
 * Annual real discount rates the guide tabulates. Zero reproduces the
 * nominal break-even; the others stand in for what the early checks could
 * earn, or what savings they let the retiree leave invested.
 */
export const DISCOUNT_RATES: readonly number[] = [0, 0.02, 0.04, 0.06];

/**
 * Beyond this age a break-even is not worth reporting: almost no one
 * collects that long, so the later claim never pays back in practice.
 */
export const BREAK_EVEN_HORIZON = MonthDuration.initFromYearsMonths({
  years: 100,
  months: 0,
});

/**
 * The first age at which the present value of the later claim's checks,
 * discounted to the earlier claim at `annualRate`, matches the present
 * value of the earlier claim's. Null when that does not happen before
 * BREAK_EVEN_HORIZON. At a zero rate this equals breakEven().breakEvenAge.
 */
export function discountedBreakEvenAge(
  retiree: Recipient,
  earlier: MonthDuration,
  later: MonthDuration,
  annualRate: number
): MonthDuration | null {
  validateClaimAges(earlier, later);
  if (!(annualRate >= 0)) {
    throw new Error(
      `the discount rate must be non-negative, got ${annualRate}`
    );
  }
  const earlierBenefit = benefitAtAge(retiree, earlier);
  const laterBenefit = benefitAtAge(retiree, later);
  const monthlyFactor = (1 + annualRate) ** (-1 / 12);
  const laterStartsAfter = later.subtract(earlier).asMonths();
  const horizon = BREAK_EVEN_HORIZON.subtract(earlier).asMonths();

  let earlierValue = Money.from(0);
  let laterValue = Money.from(0);
  let discount = 1;
  // `paid` counts checks received since the earlier claim; after `paid`
  // months both totals are compared, matching breakEven's convention that
  // the break-even age is when the running totals are equal.
  for (let paid = 1; paid <= horizon; paid++) {
    earlierValue = earlierValue.plus(earlierBenefit.times(discount));
    if (paid > laterStartsAfter) {
      laterValue = laterValue.plus(laterBenefit.times(discount));
      if (laterValue.greaterThanOrEqual(earlierValue)) {
        return earlier.add(new MonthDuration(paid));
      }
    }
    discount *= monthlyFactor;
  }
  return null;
}

export interface DiscountedBreakEvenRow {
  readonly earlier: MonthDuration;
  readonly later: MonthDuration;
  /** One entry per DISCOUNT_RATES, in order; null past the horizon. */
  readonly byRate: readonly (MonthDuration | null)[];
}

/** The three headline comparisons at every published discount rate. */
export function discountedBreakEvens(
  retiree: Recipient
): DiscountedBreakEvenRow[] {
  const fra = retiree.normalRetirementAge();
  const pairs: [MonthDuration, MonthDuration][] = [
    [EARLIEST_CLAIM_AGE, fra],
    [EARLIEST_CLAIM_AGE, LATEST_CLAIM_AGE],
    [fra, LATEST_CLAIM_AGE],
  ];
  return pairs.map(([earlier, later]) => ({
    earlier,
    later,
    byRate: DISCOUNT_RATES.map((rate) =>
      discountedBreakEvenAge(retiree, earlier, later, rate)
    ),
  }));
}
