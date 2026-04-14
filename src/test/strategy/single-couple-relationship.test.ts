import { describe, expect, it } from 'vitest';
import { eligibleForSpousalBenefit } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  type BenefitPeriod,
  BenefitType,
  optimalStrategySingle,
  strategySumCentsCouple,
  strategySumCentsSingle,
  strategySumPeriodsCouple,
} from '$lib/strategy/calculations';
import { optimalStrategyCoupleOptimized } from '$lib/strategy/calculations/strategy-calc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRecipient(
  piaDollars: number,
  birthYear: number,
  birthMonth: number,
  birthDay: number
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(birthYear, birthMonth, birthDay);
  r.setPia(Money.from(piaDollars));
  return r;
}

/** Shorthand for a Dec 15 birthdate -- NRA = 67y0m for 1960+ births. */
function makeRecipientDec15(piaDollars: number, birthYear: number): Recipient {
  return makeRecipient(piaDollars, birthYear, 11, 15);
}

/**
 * Computes the final date (death date) for a recipient, set to December
 * of the calendar year in which they reach the given lay age.
 */
function deathDateAtAge(recipient: Recipient, ageYears: number): MonthDate {
  const raw = recipient.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({ years: ageYears, months: 0 })
  );
  return raw.addDuration(new MonthDuration(11 - raw.monthIndex()));
}

/** Filing age as MonthDuration. */
function filingAge(years: number, months: number = 0): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

/** Counts the number of months in a period (inclusive on both sides). */
function periodMonths(p: BenefitPeriod): number {
  return p.endDate.subtractDate(p.startDate).asMonths() + 1;
}

/** Manually sums period amounts * month counts to get total cents. */
function manualSumCents(periods: BenefitPeriod[]): number {
  let total = 0;
  for (const p of periods) {
    total += p.amount.cents() * periodMonths(p);
  }
  return total;
}

/** Filter helpers. */
function personalPeriods(periods: BenefitPeriod[]): BenefitPeriod[] {
  return periods.filter((p) => p.benefitType === BenefitType.Personal);
}
function spousalPeriods(periods: BenefitPeriod[]): BenefitPeriod[] {
  return periods.filter((p) => p.benefitType === BenefitType.Spousal);
}
function survivorPeriods(periods: BenefitPeriod[]): BenefitPeriod[] {
  return periods.filter((p) => p.benefitType === BenefitType.Survivor);
}
function periodsForIndex(
  periods: BenefitPeriod[],
  idx: number
): BenefitPeriod[] {
  return periods.filter((p) => p.recipientIndex === idx);
}

// A currentDate far in the past so filing ages are not clipped.
const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

// ==========================================================================
// 1. Equal PIAs: couple NPV = 2x single NPV
// ==========================================================================
describe('Equal PIAs: couple NPV = 2x single NPV', () => {
  // When both spouses have equal PIA, neither qualifies for spousal benefits
  // (PIA/2 is not > PIA). With same birthdate, death age, and filing age,
  // the couple NPV should exactly equal 2 * single NPV.

  it.each([
    { pia: 500, label: '$500' },
    { pia: 1000, label: '$1000' },
    { pia: 2000, label: '$2000' },
    { pia: 3000, label: '$3000' },
  ])('PIA=$label, both file at NRA, die at 85', ({ pia }) => {
    const r1 = makeRecipientDec15(pia, 1960);
    const r2 = makeRecipientDec15(pia, 1960);
    const strat = filingAge(67);

    // Verify no spousal eligibility
    expect(eligibleForSpousalBenefit(r1, r2)).toBe(false);
    expect(eligibleForSpousalBenefit(r2, r1)).toBe(false);

    const finalDate1 = deathDateAtAge(r1, 85);
    const finalDate2 = deathDateAtAge(r2, 85);

    const singleNpv = strategySumCentsSingle(
      r1,
      finalDate1,
      FAR_PAST,
      0,
      strat
    );
    const coupleNpv = strategySumCentsCouple(
      [r1, r2],
      [finalDate1, finalDate2],
      FAR_PAST,
      0,
      [strat, strat]
    );

    expect(coupleNpv).toBe(2 * singleNpv);
  });
});

// ==========================================================================
// 2. Ineligible couple: NPV = sum of two singles
// ==========================================================================
describe('Ineligible couple: NPV = sum of two singles', () => {
  // When neither spouse qualifies for spousal benefits (i.e., PIA1/2 not > PIA2
  // AND PIA2/2 not > PIA1), the couple NPV should equal the sum of two single
  // NPVs at the same filing ages. This holds when the earner outlives the
  // dependent (no survivor benefit applicable), or when the dependent's own
  // benefit exceeds any potential survivor benefit.

  it('$1000/$800, same birthdate, both file at NRA, both die at 85', () => {
    const r1 = makeRecipientDec15(1000, 1960);
    const r2 = makeRecipientDec15(800, 1960);
    const strat1 = filingAge(67);
    const strat2 = filingAge(67);

    // Verify no spousal eligibility
    expect(eligibleForSpousalBenefit(r1, r2)).toBe(false);
    expect(eligibleForSpousalBenefit(r2, r1)).toBe(false);

    const fd1 = deathDateAtAge(r1, 85);
    const fd2 = deathDateAtAge(r2, 85);

    const single1 = strategySumCentsSingle(r1, fd1, FAR_PAST, 0, strat1);
    const single2 = strategySumCentsSingle(r2, fd2, FAR_PAST, 0, strat2);
    const couple = strategySumCentsCouple([r1, r2], [fd1, fd2], FAR_PAST, 0, [
      strat1,
      strat2,
    ]);

    expect(couple).toBe(single1 + single2);
  });

  it('$1200/$700, different birth years, earner outlives dependent, both file at 62y1m', () => {
    // Use different birth years but ensure the higher earner outlives the
    // dependent so no survivor benefit applies. With $1200/$700, the earner
    // is r1. Earner dies at 85, dependent dies at 75.
    const r1 = makeRecipientDec15(1200, 1962);
    const r2 = makeRecipientDec15(700, 1964);
    const strat = filingAge(62, 1);

    expect(eligibleForSpousalBenefit(r1, r2)).toBe(false);
    expect(eligibleForSpousalBenefit(r2, r1)).toBe(false);

    const fd1 = deathDateAtAge(r1, 85);
    const fd2 = deathDateAtAge(r2, 75);

    const single1 = strategySumCentsSingle(r1, fd1, FAR_PAST, 0, strat);
    const single2 = strategySumCentsSingle(r2, fd2, FAR_PAST, 0, strat);
    const couple = strategySumCentsCouple([r1, r2], [fd1, fd2], FAR_PAST, 0, [
      strat,
      strat,
    ]);

    expect(couple).toBe(single1 + single2);
  });

  it('$900/$600, file at 70, die at 90', () => {
    const r1 = makeRecipientDec15(900, 1961);
    const r2 = makeRecipientDec15(600, 1961);
    const strat = filingAge(70);

    expect(eligibleForSpousalBenefit(r1, r2)).toBe(false);
    expect(eligibleForSpousalBenefit(r2, r1)).toBe(false);

    const fd1 = deathDateAtAge(r1, 90);
    const fd2 = deathDateAtAge(r2, 90);

    const single1 = strategySumCentsSingle(r1, fd1, FAR_PAST, 0, strat);
    const single2 = strategySumCentsSingle(r2, fd2, FAR_PAST, 0, strat);
    const couple = strategySumCentsCouple([r1, r2], [fd1, fd2], FAR_PAST, 0, [
      strat,
      strat,
    ]);

    expect(couple).toBe(single1 + single2);
  });

  it('$1500/$1100, different filing ages, earner dies second', () => {
    const r1 = makeRecipientDec15(1500, 1960);
    const r2 = makeRecipientDec15(1100, 1960);
    const strat1 = filingAge(70);
    const strat2 = filingAge(67);

    expect(eligibleForSpousalBenefit(r1, r2)).toBe(false);
    expect(eligibleForSpousalBenefit(r2, r1)).toBe(false);

    // Earner (r1, higher PIA) dies at 92, dependent (r2) dies at 78.
    // Since dependent dies first, no survivor benefit applies.
    const fd1 = deathDateAtAge(r1, 92);
    const fd2 = deathDateAtAge(r2, 78);

    const single1 = strategySumCentsSingle(r1, fd1, FAR_PAST, 0, strat1);
    const single2 = strategySumCentsSingle(r2, fd2, FAR_PAST, 0, strat2);
    const couple = strategySumCentsCouple([r1, r2], [fd1, fd2], FAR_PAST, 0, [
      strat1,
      strat2,
    ]);

    expect(couple).toBe(single1 + single2);
  });
});

// ==========================================================================
// 3. Spousal adds value: couple NPV > sum of singles
// ==========================================================================
describe('Spousal adds value: couple NPV > sum of singles', () => {
  // When the dependent is eligible for spousal benefits (earner PIA/2 > dependent PIA),
  // the couple NPV should exceed the sum of two independent single NPVs.

  it('$2000/$500, both file at NRA, earner outlives dependent', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const strat = filingAge(67);

    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);

    // Earner dies at 90, dependent dies at 78 -- no survivor benefit.
    const fdEarner = deathDateAtAge(earner, 90);
    const fdDependent = deathDateAtAge(dependent, 78);

    const singleEarner = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const singleDependent = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );
    const couple = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    expect(couple).toBeGreaterThan(singleEarner + singleDependent);

    // The difference should exactly equal the spousal benefit contribution.
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      [strat, strat]
    );
    const spousalContribution = manualSumCents(spousalPeriods(periods));
    expect(couple - (singleEarner + singleDependent)).toBe(spousalContribution);
  });

  it('$3000/$800, both file at 62y1m, earner outlives dependent', () => {
    const earner = makeRecipientDec15(3000, 1962);
    const dependent = makeRecipientDec15(800, 1962);
    const strat = filingAge(62, 1);

    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);

    const fdEarner = deathDateAtAge(earner, 88);
    const fdDependent = deathDateAtAge(dependent, 75);

    const singleEarner = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const singleDependent = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );
    const couple = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    expect(couple).toBeGreaterThan(singleEarner + singleDependent);
  });

  it('$2500/$400, file at NRA, both die at 85', () => {
    const earner = makeRecipientDec15(2500, 1963);
    const dependent = makeRecipientDec15(400, 1963);
    const strat = filingAge(67);

    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);

    const fdEarner = deathDateAtAge(earner, 85);
    const fdDependent = deathDateAtAge(dependent, 85);

    const singleEarner = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const singleDependent = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );
    const couple = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    expect(couple).toBeGreaterThan(singleEarner + singleDependent);
  });

  it('$1800/$300, file at 70, earner outlives dependent', () => {
    const earner = makeRecipientDec15(1800, 1961);
    const dependent = makeRecipientDec15(300, 1961);
    const strat = filingAge(70);

    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);

    const fdEarner = deathDateAtAge(earner, 92);
    const fdDependent = deathDateAtAge(dependent, 80);

    const singleEarner = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const singleDependent = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );
    const couple = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    expect(couple).toBeGreaterThan(singleEarner + singleDependent);
  });
});

// ==========================================================================
// 4. Survivor adds value when earner dies first
// ==========================================================================
describe('Survivor adds value when earner dies first', () => {
  // When the earner dies first and the dependent survives, the dependent
  // may receive survivor benefits. The couple NPV should exceed the sum
  // of singles because of these survivor benefits.

  it('$2000/$500, earner dies at 70, dependent dies at 90, both file at NRA', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const strat = filingAge(67);

    const fdEarner = deathDateAtAge(earner, 70);
    const fdDependent = deathDateAtAge(dependent, 90);

    const singleEarner = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const singleDependent = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );
    const couple = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    // Couple should be greater because of survivor benefits.
    expect(couple).toBeGreaterThan(singleEarner + singleDependent);

    // Verify survivor periods exist and contribute the difference.
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      [strat, strat]
    );
    const survivors = survivorPeriods(periods);
    expect(survivors.length).toBeGreaterThan(0);
    const survivorContribution = manualSumCents(survivors);
    expect(survivorContribution).toBeGreaterThan(0);
  });

  it('$2500/$600, earner dies at 72, dependent dies at 88, file at 62y1m', () => {
    const earner = makeRecipientDec15(2500, 1962);
    const dependent = makeRecipientDec15(600, 1962);
    const strat = filingAge(62, 1);

    const fdEarner = deathDateAtAge(earner, 72);
    const fdDependent = deathDateAtAge(dependent, 88);

    const singleEarner = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const singleDependent = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );
    const couple = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    expect(couple).toBeGreaterThan(singleEarner + singleDependent);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      [strat, strat]
    );
    expect(survivorPeriods(periods).length).toBeGreaterThan(0);
  });

  it('$3000/$400, earner dies at 68, dependent dies at 95, both file at NRA', () => {
    const earner = makeRecipientDec15(3000, 1963);
    const dependent = makeRecipientDec15(400, 1963);
    const strat = filingAge(67);

    const fdEarner = deathDateAtAge(earner, 68);
    const fdDependent = deathDateAtAge(dependent, 95);

    const singleEarner = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const singleDependent = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );
    const couple = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    expect(couple).toBeGreaterThan(singleEarner + singleDependent);
  });
});

// ==========================================================================
// 5. No survivor when earner outlives dependent
// ==========================================================================
describe('No survivor when earner outlives dependent', () => {
  // When the earner outlives the dependent, no survivor benefits apply.
  // In that case, the couple NPV should equal sum of singles + spousal only.

  it('$2000/$500, earner dies at 90, dependent dies at 70, file at NRA', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const strat = filingAge(67);

    const fdEarner = deathDateAtAge(earner, 90);
    const fdDependent = deathDateAtAge(dependent, 70);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      [strat, strat]
    );

    // No survivor periods should exist.
    expect(survivorPeriods(periods).length).toBe(0);

    // Couple NPV should equal sum of singles + spousal.
    const singleEarner = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const singleDependent = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );
    const couple = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    const spousalContribution = manualSumCents(spousalPeriods(periods));
    expect(couple).toBe(singleEarner + singleDependent + spousalContribution);
  });

  it('$2500/$800, earner dies at 92, dependent dies at 72, file at 62y1m', () => {
    const earner = makeRecipientDec15(2500, 1962);
    const dependent = makeRecipientDec15(800, 1962);
    const strat = filingAge(62, 1);

    const fdEarner = deathDateAtAge(earner, 92);
    const fdDependent = deathDateAtAge(dependent, 72);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      [strat, strat]
    );

    expect(survivorPeriods(periods).length).toBe(0);

    const singleEarner = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const singleDependent = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );
    const couple = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    const spousalContribution = manualSumCents(spousalPeriods(periods));
    expect(couple).toBe(singleEarner + singleDependent + spousalContribution);
  });

  it('$3000/$600, earner dies at 88, dependent dies at 68, file at 70', () => {
    const earner = makeRecipientDec15(3000, 1961);
    const dependent = makeRecipientDec15(600, 1961);
    const strat = filingAge(70);

    const fdEarner = deathDateAtAge(earner, 88);
    const fdDependent = deathDateAtAge(dependent, 68);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      [strat, strat]
    );

    expect(survivorPeriods(periods).length).toBe(0);

    const singleEarner = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const singleDependent = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );
    const couple = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    // Dependent dies before filing at 70, so no personal benefit either.
    // Only earner contributes personal benefit.
    const spousalContribution = manualSumCents(spousalPeriods(periods));
    expect(couple).toBe(singleEarner + singleDependent + spousalContribution);
  });
});

// ==========================================================================
// 6. Couple optimal NPV >= sum of individually optimal singles
// ==========================================================================
describe('Couple optimal NPV >= sum of individually optimal singles', () => {
  // The couple optimizer considers spousal/survivor interactions and explores
  // the full 2D space of filing ages. Its NPV should always be >= the sum
  // of two independently optimized singles, because the couple optimizer
  // can reproduce the single-optimal filing ages (at a minimum).

  it('$2000/$500, both die at 85', () => {
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const fd1 = deathDateAtAge(r1, 85);
    const fd2 = deathDateAtAge(r2, 85);

    const [, singleOptNpv1] = optimalStrategySingle(r1, fd1, FAR_PAST, 0);
    const [, singleOptNpv2] = optimalStrategySingle(r2, fd2, FAR_PAST, 0);

    const [, , coupleOptNpv] = optimalStrategyCoupleOptimized(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      0
    );

    expect(coupleOptNpv).toBeGreaterThanOrEqual(singleOptNpv1 + singleOptNpv2);
  });

  it('$1500/$1500, equal PIAs, both die at 80', () => {
    const r1 = makeRecipientDec15(1500, 1962);
    const r2 = makeRecipientDec15(1500, 1962);
    const fd1 = deathDateAtAge(r1, 80);
    const fd2 = deathDateAtAge(r2, 80);

    const [, singleOptNpv1] = optimalStrategySingle(r1, fd1, FAR_PAST, 0);
    const [, singleOptNpv2] = optimalStrategySingle(r2, fd2, FAR_PAST, 0);

    const [, , coupleOptNpv] = optimalStrategyCoupleOptimized(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      0
    );

    expect(coupleOptNpv).toBeGreaterThanOrEqual(singleOptNpv1 + singleOptNpv2);
  });

  it('$3000/$400, earner dies at 70, dependent dies at 90', () => {
    const r1 = makeRecipientDec15(3000, 1963);
    const r2 = makeRecipientDec15(400, 1963);
    const fd1 = deathDateAtAge(r1, 70);
    const fd2 = deathDateAtAge(r2, 90);

    const [, singleOptNpv1] = optimalStrategySingle(r1, fd1, FAR_PAST, 0);
    const [, singleOptNpv2] = optimalStrategySingle(r2, fd2, FAR_PAST, 0);

    const [, , coupleOptNpv] = optimalStrategyCoupleOptimized(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      0
    );

    expect(coupleOptNpv).toBeGreaterThanOrEqual(singleOptNpv1 + singleOptNpv2);
  });
});

// ==========================================================================
// 7. Decomposing couple NPV into single + spousal + survivor
// ==========================================================================
describe('Decomposing couple NPV into single + spousal + survivor', () => {
  // At 0% discount, couple NPV should decompose as:
  //   couple_NPV = earner_single_NPV + dependent_personal_in_couple
  //              + spousal_contribution + survivor_contribution
  //
  // When survivor benefits apply, the dependent's personal benefit is
  // truncated (cut short) compared to their single NPV. The relationship is:
  //   couple_NPV = earner_single_NPV + dependent_single_NPV
  //              + spousal_contribution + survivor_contribution
  //              - personal_truncation
  //
  // Where personal_truncation is the personal benefit the dependent would
  // have received as a single filer in the months that are now covered by
  // survivor benefits instead.

  it('$2000/$500, both file at NRA, earner dies at 75, dependent dies at 90', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const strat = filingAge(67);

    const fdEarner = deathDateAtAge(earner, 75);
    const fdDependent = deathDateAtAge(dependent, 90);

    // Get couple NPV
    const coupleNpv = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    // Get single NPVs
    const earnerSingleNpv = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const dependentSingleNpv = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );

    // Get couple periods to decompose
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      [strat, strat]
    );

    const spousalContribution = manualSumCents(spousalPeriods(periods));
    const survivorContribution = manualSumCents(survivorPeriods(periods));

    // Determine dependent index based on PIA ordering.
    const dependentIndex = earner
      .pia()
      .primaryInsuranceAmount()
      .greaterThan(dependent.pia().primaryInsuranceAmount())
      ? 1
      : 0;
    const earnerIndex = dependentIndex === 0 ? 1 : 0;

    const dependentPersonalInCouple = manualSumCents(
      personalPeriods(periodsForIndex(periods, dependentIndex))
    );
    const earnerPersonalInCouple = manualSumCents(
      personalPeriods(periodsForIndex(periods, earnerIndex))
    );

    // Personal truncation: dependent's single NPV minus their personal
    // benefit within the couple (which is cut short by survivor benefit).
    const personalTruncation = dependentSingleNpv - dependentPersonalInCouple;

    // Earner's personal benefit should be the same in couple as single.
    expect(earnerPersonalInCouple).toBe(earnerSingleNpv);

    // Verify decomposition:
    // couple = earner_single + dependent_single + spousal + survivor - truncation
    expect(coupleNpv).toBe(
      earnerSingleNpv +
        dependentSingleNpv +
        spousalContribution +
        survivorContribution -
        personalTruncation
    );

    // Spousal, survivor, and truncation should all be positive.
    expect(spousalContribution).toBeGreaterThan(0);
    expect(survivorContribution).toBeGreaterThan(0);
    expect(personalTruncation).toBeGreaterThan(0);
  });

  it('$2500/$400, both file at NRA, earner dies at 72, dependent dies at 88', () => {
    const earner = makeRecipientDec15(2500, 1962);
    const dependent = makeRecipientDec15(400, 1962);
    const strat = filingAge(67);

    const fdEarner = deathDateAtAge(earner, 72);
    const fdDependent = deathDateAtAge(dependent, 88);

    const coupleNpv = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    const earnerSingleNpv = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const dependentSingleNpv = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      [strat, strat]
    );

    const spousalContribution = manualSumCents(spousalPeriods(periods));
    const survivorContribution = manualSumCents(survivorPeriods(periods));

    // Compute personal truncation from the dependent's personal periods.
    // In the couple scenario, the dependent's personal periods are shorter
    // than in the single scenario because survivor benefit replaces them.
    // Get the dependent's personal benefit in the couple scenario.
    const dependentIndex = earner
      .pia()
      .primaryInsuranceAmount()
      .greaterThan(dependent.pia().primaryInsuranceAmount())
      ? 1
      : 0;
    const dependentPersonalInCouple = manualSumCents(
      personalPeriods(periodsForIndex(periods, dependentIndex))
    );

    // The truncation is the difference between what the dependent would have
    // received as a single filer and what they actually receive in the couple.
    const personalTruncation = dependentSingleNpv - dependentPersonalInCouple;

    // Verify decomposition:
    // couple = earner_single + dependent_personal_in_couple + spousal + survivor
    const earnerIndex = dependentIndex === 0 ? 1 : 0;
    const earnerPersonalInCouple = manualSumCents(
      personalPeriods(periodsForIndex(periods, earnerIndex))
    );

    expect(earnerPersonalInCouple).toBe(earnerSingleNpv);
    expect(coupleNpv).toBe(
      earnerPersonalInCouple +
        dependentPersonalInCouple +
        spousalContribution +
        survivorContribution
    );

    // Also verify the equivalent form with truncation:
    expect(coupleNpv).toBe(
      earnerSingleNpv +
        dependentSingleNpv +
        spousalContribution +
        survivorContribution -
        personalTruncation
    );

    expect(personalTruncation).toBeGreaterThan(0);
    expect(spousalContribution).toBeGreaterThan(0);
    expect(survivorContribution).toBeGreaterThan(0);
  });

  it('$1800/$300, file at NRA, earner dies at 68, dependent dies at 92', () => {
    const earner = makeRecipientDec15(1800, 1963);
    const dependent = makeRecipientDec15(300, 1963);
    const strat = filingAge(67);

    const fdEarner = deathDateAtAge(earner, 68);
    const fdDependent = deathDateAtAge(dependent, 92);

    const coupleNpv = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    const earnerSingleNpv = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const dependentSingleNpv = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      [strat, strat]
    );

    const spousalContribution = manualSumCents(spousalPeriods(periods));
    const survivorContribution = manualSumCents(survivorPeriods(periods));

    // Determine dependent index based on PIA ordering.
    const dependentIndex = earner
      .pia()
      .primaryInsuranceAmount()
      .greaterThan(dependent.pia().primaryInsuranceAmount())
      ? 1
      : 0;
    const dependentPersonalInCouple = manualSumCents(
      personalPeriods(periodsForIndex(periods, dependentIndex))
    );
    const personalTruncation = dependentSingleNpv - dependentPersonalInCouple;

    // Verify: couple = earner_single + dependent_single + spousal + survivor - truncation
    expect(coupleNpv).toBe(
      earnerSingleNpv +
        dependentSingleNpv +
        spousalContribution +
        survivorContribution -
        personalTruncation
    );

    expect(personalTruncation).toBeGreaterThan(0);
  });

  it('$2000/$500, file at NRA, earner dies at 90, dependent dies at 78 (no survivor)', () => {
    // When the earner outlives the dependent, there is no survivor benefit
    // and no personal truncation. The decomposition simplifies to:
    // couple = earner_single + dependent_single + spousal
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const strat = filingAge(67);

    const fdEarner = deathDateAtAge(earner, 90);
    const fdDependent = deathDateAtAge(dependent, 78);

    const coupleNpv = strategySumCentsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      FAR_PAST,
      0,
      [strat, strat]
    );

    const earnerSingleNpv = strategySumCentsSingle(
      earner,
      fdEarner,
      FAR_PAST,
      0,
      strat
    );
    const dependentSingleNpv = strategySumCentsSingle(
      dependent,
      fdDependent,
      FAR_PAST,
      0,
      strat
    );

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fdEarner, fdDependent],
      [strat, strat]
    );

    expect(survivorPeriods(periods).length).toBe(0);

    const spousalContribution = manualSumCents(spousalPeriods(periods));
    expect(coupleNpv).toBe(
      earnerSingleNpv + dependentSingleNpv + spousalContribution
    );
  });
});
