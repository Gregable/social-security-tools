/**
 * Worked examples for the child benefits guide.
 *
 * The guide follows one parent who turns 62 in the latest year the
 * constants cover, with a round Primary Insurance Amount and children of
 * given ages. From that it shows how the family maximum splits a fixed pool
 * among however many people collect on the record, and what the family
 * gives up or gains if the parent claims at 62 instead of waiting for full
 * retirement age.
 *
 * Every figure here is derived from constants.ts and the benefit
 * calculator, so the guide's tables follow the annual update. The children's
 * ages, the example PIA, and any sentence in the guide naming a percentage
 * or a ratio between rows are hand-written and still need a read each year.
 *
 * The result records below are plain readonly interfaces produced only by
 * the functions beside them; they are not meant to be constructed by hand.
 */

import { benefitAtAge, survivorBenefit } from './benefit-calculator';
import { Birthdate } from './birthday';
import * as constants from './constants';
import {
  type FamilyMaximumBendPoints,
  familyMaximum,
  familyMaximumBendPoints,
} from './family-maximum';
import { Money } from './money';
import { MonthDuration } from './month-time';
import { Recipient } from './recipient';

/** A round Primary Insurance Amount the guide can reason about aloud. */
export const EXAMPLE_PIA: Money = Money.from(2500);

/** Age of the example parent in the guide's year. */
const EXAMPLE_PARENT_AGE = 62;

/** A child's benefit is half the parent's PIA before the family maximum. */
const CHILD_BENEFIT_FRACTION = 0.5;

/** Child benefits end at 18 for a child who is not a student or disabled. */
const CHILD_BENEFIT_END_AGE = MonthDuration.initFromYearsMonths({
  years: 18,
  months: 0,
});

/** The claiming age the comparison tests against full retirement age. */
const EARLY_CLAIM_AGE = MonthDuration.initFromYearsMonths({
  years: EXAMPLE_PARENT_AGE,
  months: 0,
});

/**
 * An age at which the example parent has died, used only to place the death
 * after both filing ages compared and the spouse past survivor full
 * retirement age, so the survivor figure is the unreduced base amount.
 */
const SURVIVOR_EXAMPLE_DEATH_AGE = MonthDuration.initFromYearsMonths({
  years: 75,
  months: 0,
});

/**
 * A parent who turns 62 in the latest year the constants cover, so the
 * family maximum is computed from the latest wage index (this relies on
 * WAGE_INDICES covering MAX_YEAR - 2) and no cost-of-living adjustment has
 * yet applied. Born on the 2nd of the month: only someone born on the 1st
 * or 2nd is 62 for their whole birth month, which the comparison's claim
 * at exactly 62 requires. The birth year gives a full retirement age of 67,
 * which the guide states in prose.
 */
export function exampleParent(): Recipient {
  const parent = new Recipient();
  parent.birthdate = Birthdate.FromYMD(
    constants.MAX_YEAR - EXAMPLE_PARENT_AGE,
    0,
    2
  );
  parent.setPia(EXAMPLE_PIA);
  return parent;
}

export interface FamilyPayout {
  readonly pia: Money;
  readonly bendPoints: FamilyMaximumBendPoints;
  readonly familyMaximum: Money;
  /** What the maximum leaves for everyone other than the worker. */
  readonly auxiliaryPool: Money;
  /** People sharing the pool: children, plus a spouse with a child in care. */
  readonly beneficiaries: number;
  /** Each person's benefit if the maximum did not bind: half the PIA. */
  readonly eachUnlimited: Money;
  /** Each person's benefit after the maximum, rounded down to the dime. */
  readonly each: Money;
  /**
   * The worker's unreduced PIA plus everyone collecting on the record. The
   * worker's own early-claim reduction is not applied here; the guide's
   * table note says so.
   */
  readonly familyTotal: Money;
  /** Whether the maximum bound, i.e. `each` is below `eachUnlimited`. */
  readonly capped: boolean;
}

/**
 * How the family maximum divides the record among `beneficiaries` people
 * collecting on it besides the worker. The worker's own benefit is never
 * reduced; the others share whatever the maximum leaves, equally.
 */
export function familyPayout(
  parent: Recipient,
  beneficiaries: number
): FamilyPayout {
  if (!Number.isInteger(beneficiaries) || beneficiaries < 1) {
    throw new Error(
      `beneficiaries must be a positive integer, got ${beneficiaries}`
    );
  }
  const pia = parent.pia().primaryInsuranceAmount();
  const indexingYear = parent.indexingYear();
  const maximum = familyMaximum(pia, indexingYear);
  const auxiliaryPool = maximum.sub(pia);
  if (auxiliaryPool.lessThan(Money.from(0))) {
    throw new Error(
      `family maximum ${maximum.string()} is below the PIA ${pia.string()}`
    );
  }
  const eachUnlimited = pia.times(CHILD_BENEFIT_FRACTION).floorToDime();
  const share = auxiliaryPool.div(beneficiaries).floorToDime();
  const capped = share.lessThan(eachUnlimited);
  const each = capped ? share : eachUnlimited;
  return {
    pia,
    bendPoints: familyMaximumBendPoints(indexingYear),
    familyMaximum: maximum,
    auxiliaryPool,
    beneficiaries,
    eachUnlimited,
    each,
    familyTotal: pia.plus(each.times(beneficiaries)),
    capped,
  };
}

export interface ClaimAgeComparison {
  /** The children's ages in whole years at the claim, as given. */
  readonly childAges: readonly number[];
  readonly fra: MonthDuration;
  readonly benefitAt62: Money;
  readonly benefitAtFra: Money;
  /** The permanent monthly cost of claiming at 62 instead of at FRA. */
  readonly monthlyReduction: Money;
  readonly timeToFra: MonthDuration;
  /** From the claim until the youngest child turns 18. */
  readonly childBenefitSpan: MonthDuration;
  /** From the claim until the oldest child turns 18. */
  readonly oldestChildBenefitSpan: MonthDuration;
  readonly parentAgeWhenOldestTurns18: MonthDuration;
  readonly parentAgeWhenYoungestTurns18: MonthDuration;
  /**
   * Everything the children collect if the parent claims at 62, from then
   * until the youngest turns 18. Nominal: no cost-of-living adjustments.
   */
  readonly childrenTotal: Money;
  /** The part of childrenTotal paid before the parent reaches FRA. */
  readonly childrenBeforeFra: Money;
  /** The parent's own reduced checks before FRA. */
  readonly ownBeforeFra: Money;
  /**
   * How far ahead the family is at FRA by having claimed at 62. After FRA
   * the children collect the same amounts either way, so the only
   * difference from then on is the parent's reduced check.
   */
  readonly leadAtFra: Money;
  /** Time after FRA for the larger check to make up the lead. */
  readonly timeToCatchUp: MonthDuration;
  readonly catchUpAge: MonthDuration;
  /** The base survivor benefit a spouse would inherit, by the parent's claim age. */
  readonly survivorIfClaimedAt62: Money;
  readonly survivorIfClaimedAtFra: Money;
}

function validateChildAges(childAges: readonly number[]): void {
  if (childAges.length === 0) {
    throw new Error('at least one child is required');
  }
  for (const age of childAges) {
    if (
      !Number.isInteger(age) ||
      age < 0 ||
      age >= CHILD_BENEFIT_END_AGE.years()
    ) {
      throw new Error(
        `child ages must be whole years under ${CHILD_BENEFIT_END_AGE.years()}, got ${age}`
      );
    }
  }
}

function ageInYears(years: number): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months: 0 });
}

/** How long a child of this age keeps collecting, until they turn 18. */
function benefitSpan(childAge: number): MonthDuration {
  return CHILD_BENEFIT_END_AGE.subtract(ageInYears(childAge));
}

/** The children still under 18 at `elapsed` after the claim. */
function childrenStillEligible(
  childAges: readonly number[],
  elapsed: MonthDuration
): number {
  return childAges.filter((age) => elapsed.lessThan(benefitSpan(age))).length;
}

/**
 * The base survivor benefit a same-age spouse would receive if the parent
 * claimed at `claimAge` and died at SURVIVOR_EXAMPLE_DEATH_AGE.
 */
function survivorAfterClaimAt(
  parent: Recipient,
  claimAge: MonthDuration
): Money {
  const spouse = new Recipient();
  spouse.birthdate = parent.birthdate;
  const filingDate = parent.birthdate.dateAtSsaAge(claimAge);
  const deathDate = parent.birthdate.dateAtSsaAge(SURVIVOR_EXAMPLE_DEATH_AGE);
  const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));
  return survivorBenefit(
    spouse,
    parent,
    filingDate,
    deathDate,
    survivorFilingDate
  );
}

export function claimAgeComparison(
  parent: Recipient,
  childAges: readonly number[]
): ClaimAgeComparison {
  validateChildAges(childAges);
  const ages = [...childAges];
  if (parent.birthdate.earliestFilingMonth().greaterThan(EARLY_CLAIM_AGE)) {
    throw new Error(
      'the comparison claims at exactly 62, which this parent cannot do'
    );
  }
  const fra = parent.normalRetirementAge();
  const benefitAt62 = benefitAtAge(parent, EARLY_CLAIM_AGE);
  const benefitAtFra = benefitAtAge(parent, fra);
  const monthlyReduction = benefitAtFra.sub(benefitAt62);
  if (!monthlyReduction.greaterThan(Money.from(0))) {
    throw new Error(
      'the comparison needs a parent whose benefit is reduced at 62'
    );
  }
  const timeToFra = fra.subtract(EARLY_CLAIM_AGE);

  // Each child's benefit depends on how many children are still under 18,
  // so the family's monthly payment is recomputed as children age out.
  const childBenefitSpan = benefitSpan(Math.min(...ages));
  const oldestChildBenefitSpan = benefitSpan(Math.max(...ages));
  let childrenTotal = Money.from(0);
  let childrenBeforeFra = Money.from(0);
  for (
    const elapsed = new MonthDuration(0);
    elapsed.lessThan(childBenefitSpan);
    elapsed.increment()
  ) {
    const eligible = childrenStillEligible(ages, elapsed);
    const payment = familyPayout(parent, eligible).each.times(eligible);
    childrenTotal = childrenTotal.plus(payment);
    if (elapsed.lessThan(timeToFra)) {
      childrenBeforeFra = childrenBeforeFra.plus(payment);
    }
  }

  const ownBeforeFra = benefitAt62.times(timeToFra.asMonths());
  const leadAtFra = ownBeforeFra.plus(childrenBeforeFra);
  const timeToCatchUp = new MonthDuration(
    Math.ceil(leadAtFra.div$(monthlyReduction))
  );

  return {
    childAges: ages,
    fra,
    benefitAt62,
    benefitAtFra,
    monthlyReduction,
    timeToFra,
    childBenefitSpan,
    oldestChildBenefitSpan,
    parentAgeWhenOldestTurns18: EARLY_CLAIM_AGE.add(oldestChildBenefitSpan),
    parentAgeWhenYoungestTurns18: EARLY_CLAIM_AGE.add(childBenefitSpan),
    childrenTotal,
    childrenBeforeFra,
    ownBeforeFra,
    leadAtFra,
    timeToCatchUp,
    catchUpAge: fra.add(timeToCatchUp),
    survivorIfClaimedAt62: survivorAfterClaimAt(parent, EARLY_CLAIM_AGE),
    survivorIfClaimedAtFra: survivorAfterClaimAt(parent, fra),
  };
}
