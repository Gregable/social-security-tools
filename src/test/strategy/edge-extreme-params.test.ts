import { describe, expect, it } from 'vitest';
import { benefitAtAge } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  BenefitType,
  strategySumCentsCouple,
  strategySumCentsSingle,
  strategySumPeriodsCouple,
} from '$lib/strategy/calculations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Helper to create a Recipient with a given PIA and birthdate.
 * Month is 0-based (0 = Jan, 11 = Dec).
 */
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

/**
 * A currentDate far in the past so that all filing dates are in the future
 * from currentDate's perspective, avoiding retroactive filing constraints.
 */
const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

const NO_DISCOUNT = 0;

// ---------------------------------------------------------------------------
// 1. Extreme discount rates - single filer
// ---------------------------------------------------------------------------
describe('Extreme discount rates - single filer', () => {
  // PIA $1000, born March 15, 1965 (month=2), file at NRA (67y0m), die at 85.
  const r = makeRecipient(1000, 1965, 2, 15);
  const nra = r.normalRetirementAge(); // 67y0m for 1960+ births
  const deathAge = MonthDuration.initFromYearsMonths({
    years: 85,
    months: 0,
  });
  const finalDate = r.birthdate.dateAtSsaAge(deathAge);

  it('0% discount: NPV = simple sum of monthly payments', () => {
    const npv = strategySumCentsSingle(r, finalDate, FAR_PAST, 0, nra);
    // 85y0m - 67y0m = 216 month difference, inclusive = 217 months of $1000
    expect(npv).toBe(217 * 1000 * 100);
  });

  it('1% discount: NPV slightly reduced vs 0%', () => {
    const npv0 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0, nra);
    const npv1 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.01, nra);
    expect(npv1).toBeGreaterThan(0);
    expect(npv1).toBeLessThan(npv0);
  });

  it('5% discount: noticeably reduced vs 1%', () => {
    const npv1 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.01, nra);
    const npv5 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.05, nra);
    expect(npv5).toBeGreaterThan(0);
    expect(npv5).toBeLessThan(npv1);
  });

  it('10% discount: heavily discounted vs 5%', () => {
    const npv5 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.05, nra);
    const npv10 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.1, nra);
    expect(npv10).toBeGreaterThan(0);
    expect(npv10).toBeLessThan(npv5);
  });

  it('20% discount: extremely discounted, far future payments nearly worthless', () => {
    const npv10 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.1, nra);
    const npv20 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.2, nra);
    expect(npv20).toBeGreaterThan(0);
    expect(npv20).toBeLessThan(npv10);
  });

  it('50% discount: absurdly high but should not crash or produce negative', () => {
    const npv20 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.2, nra);
    const npv50 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.5, nra);
    expect(npv50).toBeGreaterThan(0);
    expect(npv50).toBeLessThan(npv20);
  });
});

// ---------------------------------------------------------------------------
// 2. Extreme discount rates - couple
// ---------------------------------------------------------------------------
describe('Extreme discount rates - couple', () => {
  // Earner: PIA $2000, born Jan 15 1960. Dependent: PIA $800, born Jun 15 1962.
  // Both file at NRA, die at 85.
  const earner = makeRecipient(2000, 1960, 0, 15);
  const dependent = makeRecipient(800, 1962, 5, 15);
  const earnerNra = earner.normalRetirementAge();
  const dependentNra = dependent.normalRetirementAge();
  const earnerDeath = earner.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
  );
  const dependentDeath = dependent.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
  );

  it('0% discount: positive NPV', () => {
    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0,
      [earnerNra, dependentNra]
    );
    expect(npv).toBeGreaterThan(0);
  });

  it('5% discount: reduced vs 0%', () => {
    const npv0 = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0,
      [earnerNra, dependentNra]
    );
    const npv5 = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0.05,
      [earnerNra, dependentNra]
    );
    expect(npv5).toBeGreaterThan(0);
    expect(npv5).toBeLessThan(npv0);
  });

  it('10% discount: reduced vs 5%', () => {
    const npv5 = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0.05,
      [earnerNra, dependentNra]
    );
    const npv10 = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0.1,
      [earnerNra, dependentNra]
    );
    expect(npv10).toBeGreaterThan(0);
    expect(npv10).toBeLessThan(npv5);
  });

  it('20% discount: reduced vs 10%, still positive', () => {
    const npv10 = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0.1,
      [earnerNra, dependentNra]
    );
    const npv20 = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0.2,
      [earnerNra, dependentNra]
    );
    expect(npv20).toBeGreaterThan(0);
    expect(npv20).toBeLessThan(npv10);
  });
});

// ---------------------------------------------------------------------------
// 3. Death at filing month - single filer
// ---------------------------------------------------------------------------
describe('Death at filing month - single filer', () => {
  it('die in exact filing month: 1 month of benefits', () => {
    // Born March 15, 1965. File at NRA (67y0m). Die same month.
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const filingDate = r.birthdate.dateAtSsaAge(nra);
    // finalDate = filingDate means 1 month of benefits
    const npv = strategySumCentsSingle(
      r,
      filingDate,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBe(1000 * 100);
  });

  it('die 1 month after filing: 2 months of benefits', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const filingDate = r.birthdate.dateAtSsaAge(nra);
    const deathDate = filingDate.addDuration(new MonthDuration(1));
    const npv = strategySumCentsSingle(
      r,
      deathDate,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBe(2 * 1000 * 100);
  });

  it('die 1 month before filing: 0 months of benefits', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const filingDate = r.birthdate.dateAtSsaAge(nra);
    const deathDate = filingDate.subtractDuration(new MonthDuration(1));
    const npv = strategySumCentsSingle(
      r,
      deathDate,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBe(0);
  });

  it('die 6 months after filing: 7 months of benefits', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const filingDate = r.birthdate.dateAtSsaAge(nra);
    const deathDate = filingDate.addDuration(new MonthDuration(6));
    const npv = strategySumCentsSingle(
      r,
      deathDate,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBe(7 * 1000 * 100);
  });
});

// ---------------------------------------------------------------------------
// 4. Death at filing month - couple
// ---------------------------------------------------------------------------
describe('Death at filing month - couple', () => {
  it('earner dies at filing month: earner gets 1 month, dependent gets survivor', () => {
    // Earner: PIA $2000, born Jan 15 1960. Dependent: PIA $500, born Jun 15 1962.
    // Earner files at NRA then dies same month. Dependent files at NRA, lives to 85.
    const earner = makeRecipient(2000, 1960, 0, 15);
    const dependent = makeRecipient(500, 1962, 5, 15);
    const earnerNra = earner.normalRetirementAge();
    const dependentNra = dependent.normalRetirementAge();
    const earnerFilingDate = earner.birthdate.dateAtSsaAge(earnerNra);
    // Earner dies at filing month
    const earnerDeath = earnerFilingDate;
    const dependentDeath = dependent.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [earnerNra, dependentNra]
    );
    // Earner gets 1 month of personal benefit. Dependent gets personal + survivor.
    // Total should be positive and greater than just 1 month of earner's benefit.
    expect(npv).toBeGreaterThan(2000 * 100);
  });

  it('both die at filing month: minimal benefits for both', () => {
    const earner = makeRecipient(2000, 1960, 0, 15);
    const dependent = makeRecipient(500, 1960, 0, 15);
    const nra = earner.normalRetirementAge();
    const filingDate = earner.birthdate.dateAtSsaAge(nra);

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [filingDate, filingDate],
      FAR_PAST,
      NO_DISCOUNT,
      [nra, nra]
    );
    // Both die at filing month. Each gets at most 1 month of personal benefit.
    // No survivor benefits since both die simultaneously.
    expect(npv).toBeGreaterThan(0);
    // Should be small: at most 1 month of earner ($2000) + 1 month of dependent ($500)
    // plus possibly spousal for 1 month.
    expect(npv).toBeLessThanOrEqual((2000 + 500 + 1000) * 100);
  });

  it('earner dies 1 month before filing: no earner benefit', () => {
    const earner = makeRecipient(2000, 1960, 0, 15);
    const dependent = makeRecipient(500, 1962, 5, 15);
    const earnerNra = earner.normalRetirementAge();
    const dependentNra = dependent.normalRetirementAge();
    const earnerFilingDate = earner.birthdate.dateAtSsaAge(earnerNra);
    const earnerDeath = earnerFilingDate.subtractDuration(new MonthDuration(1));
    const dependentDeath = dependent.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [earnerNra, dependentNra]
    );
    // Earner gets 0 months of personal benefit.
    // Dependent should still get personal benefits and possibly survivor.
    expect(npv).toBeGreaterThan(0);
  });

  it('dependent dies at filing month, earner lives to 90: no survivor', () => {
    const earner = makeRecipient(2000, 1960, 0, 15);
    const dependent = makeRecipient(500, 1962, 5, 15);
    const earnerNra = earner.normalRetirementAge();
    const dependentNra = dependent.normalRetirementAge();
    const dependentFilingDate = dependent.birthdate.dateAtSsaAge(dependentNra);

    const earnerDeath = earner.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 90, months: 0 })
    );
    // Dependent dies at their filing month
    const dependentDeath = dependentFilingDate;

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [earnerNra, dependentNra]
    );
    // Dependent gets only 1 month of personal. Earner gets full benefits.
    // Earner lives to 90 so gets 23 years (276 months) of $2000 = $552,000.
    expect(npv).toBeGreaterThan(0);
    // Compare with earner-only single NPV: couple NPV should be close but slightly more.
    const earnerSingleNpv = strategySumCentsSingle(
      earner,
      earnerDeath,
      FAR_PAST,
      NO_DISCOUNT,
      earnerNra
    );
    expect(npv).toBeGreaterThanOrEqual(earnerSingleNpv);
  });
});

// ---------------------------------------------------------------------------
// 5. Extreme PIA values
// ---------------------------------------------------------------------------
describe('Extreme PIA values', () => {
  it('PIA $1: very small but positive NPV', () => {
    const r = makeRecipient(1, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    // 85y0m - 67y0m = 216 month diff, inclusive = 217 months of $1 = 21,700 cents
    expect(npv).toBe(217 * 100);
    expect(npv).toBeGreaterThan(0);

    // benefitAtAge should still work
    const benefit = benefitAtAge(r, nra);
    expect(benefit.cents()).toBe(100);
  });

  it('PIA $5000: above SSA maximum but code should handle it', () => {
    const r = makeRecipient(5000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    // 217 inclusive months of $5000 = $1,085,000 = 108,500,000 cents
    expect(npv).toBe(217 * 5000 * 100);
    expect(Number.isFinite(npv)).toBe(true);
  });

  it('PIA $10000: well above maximum, verify no overflow', () => {
    const r = makeRecipient(10000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    // 217 inclusive months of $10,000 = $2,170,000 = 217,000,000 cents
    expect(npv).toBe(217 * 10000 * 100);
    expect(Number.isFinite(npv)).toBe(true);
    // Ensure no overflow: 217,000,000 is well within Number.MAX_SAFE_INTEGER
    expect(npv).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it('PIA $0: no benefits, NPV = 0', () => {
    const r = makeRecipient(0, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Very long lifespans
// ---------------------------------------------------------------------------
describe('Very long lifespans', () => {
  it('die at 100 (single): verify large NPV, no overflow', () => {
    const r = makeRecipient(2000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 100, months: 0 })
    );
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    // 100y0m - 67y0m = 396 month diff, inclusive = 397 months of $2000
    expect(npv).toBe(397 * 2000 * 100);
    expect(Number.isFinite(npv)).toBe(true);
  });

  it('die at 110 (single): verify still computes correctly', () => {
    const r = makeRecipient(2000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 110, months: 0 })
    );
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    // 110y0m - 67y0m = 516 month diff, inclusive = 517 months of $2000
    expect(npv).toBe(517 * 2000 * 100);
    expect(Number.isFinite(npv)).toBe(true);
  });

  it('die at 120 (couple): both very old, verify no issues', () => {
    const earner = makeRecipient(3000, 1960, 0, 15);
    const dependent = makeRecipient(1000, 1962, 5, 15);
    const earnerNra = earner.normalRetirementAge();
    const dependentNra = dependent.normalRetirementAge();
    const earnerDeath = earner.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 120, months: 0 })
    );
    const dependentDeath = dependent.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 120, months: 0 })
    );

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [earnerNra, dependentNra]
    );
    expect(npv).toBeGreaterThan(0);
    expect(Number.isFinite(npv)).toBe(true);
    // Earner alone: 120 - 67 = 53 years = 636 months of $3000 = $1,908,000
    // Total for couple should be greater than earner single NPV
    const earnerSingleNpv = strategySumCentsSingle(
      earner,
      earnerDeath,
      FAR_PAST,
      NO_DISCOUNT,
      earnerNra
    );
    expect(npv).toBeGreaterThan(earnerSingleNpv);
  });
});

// ---------------------------------------------------------------------------
// 7. Minimal filing window
// ---------------------------------------------------------------------------
describe('Minimal filing window', () => {
  it('die at 62y1m (earliest filing and dying same month): 1 month of reduced benefit', () => {
    // Born March 15, 1965. Earliest filing = 62y1m.
    // Die same month as filing.
    const r = makeRecipient(1000, 1965, 2, 15);
    const earliest = r.birthdate.earliestFilingMonth(); // 62y1m
    const filingDate = r.birthdate.dateAtSsaAge(earliest);

    const npv = strategySumCentsSingle(
      r,
      filingDate,
      FAR_PAST,
      NO_DISCOUNT,
      earliest
    );
    // 1 month of reduced benefit. 59 months early reduction.
    const expectedBenefit = benefitAtAge(r, earliest);
    expect(npv).toBe(expectedBenefit.cents());
    expect(npv).toBeGreaterThan(0);
  });

  it('file at 70y0m and die at 70y0m: 1 month of max benefit', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(age70);

    const npv = strategySumCentsSingle(
      r,
      filingDate,
      FAR_PAST,
      NO_DISCOUNT,
      age70
    );
    // 3 years of delayed credits: 24% increase. floor($1000 * 1.24) = $1240
    const expectedBenefit = benefitAtAge(r, age70);
    expect(expectedBenefit.value()).toBe(1240);
    expect(npv).toBe(expectedBenefit.cents());
  });

  it('couple: both file at NRA, both die at NRA: 1 month each', () => {
    // Same birthdate, same PIA so no spousal benefits.
    const r1 = makeRecipient(1500, 1960, 0, 15);
    const r2 = makeRecipient(1500, 1960, 0, 15);
    const nra = r1.normalRetirementAge();
    const filingDate = r1.birthdate.dateAtSsaAge(nra);

    const npv = strategySumCentsCouple(
      [r1, r2],
      [filingDate, filingDate],
      FAR_PAST,
      NO_DISCOUNT,
      [nra, nra]
    );
    // Each gets 1 month of $1500 = 2 * $1500 = $3000 = 300,000 cents
    expect(npv).toBe(2 * 1500 * 100);
  });
});

// ---------------------------------------------------------------------------
// 8. Negative NPV edge cases
// ---------------------------------------------------------------------------
describe('Negative NPV edge cases', () => {
  it('very high discount rate: NPV stays >= 0', () => {
    // With extreme discount rate, verify NPV never goes negative.
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );

    // Test a range of extreme discount rates
    for (const rate of [0.5, 1.0, 2.0, 5.0, 10.0]) {
      const npv = strategySumCentsSingle(r, finalDate, FAR_PAST, rate, nra);
      expect(npv).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(npv)).toBe(true);
    }
  });

  it('currentDate far in the future (after death): NPV = 0', () => {
    // If currentDate is after the recipient's death, all benefit periods are
    // in the past and should not contribute to NPV.
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );
    // currentDate = year 2100, well after death around 2050
    const futureCurrentDate = MonthDate.initFromYearsMonths({
      years: 2100,
      months: 0,
    });
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      futureCurrentDate,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 9. Floating-point precision at high discount rates
// ---------------------------------------------------------------------------
describe('Floating-point precision at high discount rates', () => {
  // PIA $1000, die at 100. Verify NPV is finite and non-negative at extreme
  // discount rates.
  const r = makeRecipient(1000, 1965, 2, 15);
  const nra = r.normalRetirementAge();
  const finalDate = r.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 100, months: 0 })
  );

  it('20% discount: NPV is finite and non-negative', () => {
    const npv = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.2, nra);
    expect(Number.isFinite(npv)).toBe(true);
    expect(npv).toBeGreaterThanOrEqual(0);
  });

  it('30% discount: NPV is finite and non-negative', () => {
    const npv = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.3, nra);
    expect(Number.isFinite(npv)).toBe(true);
    expect(npv).toBeGreaterThanOrEqual(0);
  });

  it('50% discount: NPV is finite and non-negative', () => {
    const npv = strategySumCentsSingle(r, finalDate, FAR_PAST, 0.5, nra);
    expect(Number.isFinite(npv)).toBe(true);
    expect(npv).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// 10. Maximum possible NPV
// ---------------------------------------------------------------------------
describe('Maximum possible NPV', () => {
  // PIA $5000, file at 70 ($6200/mo delayed credits), live to 120 (53 years
  // = 636 months from 67, or 600 months from 70). 0% discount.

  it('PIA $5000 filed at 70, live to 120: NPV = 601 * 6200 * 100 cents', () => {
    const r = makeRecipient(5000, 1965, 2, 15);
    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 120, months: 0 })
    );
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      NO_DISCOUNT,
      age70
    );
    // 120y0m - 70y0m = 600 month diff, inclusive = 601 months of $6200
    // benefit at 70 = floor(5000 * 1.24) = $6200
    expect(npv).toBe(601 * 6200 * 100);
    expect(Number.isFinite(npv)).toBe(true);
  });

  it('maximum NPV is within safe integer range', () => {
    const r = makeRecipient(5000, 1965, 2, 15);
    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 120, months: 0 })
    );
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      NO_DISCOUNT,
      age70
    );
    expect(npv).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });
});

// ---------------------------------------------------------------------------
// 11. Couple with extreme PIA asymmetry
// ---------------------------------------------------------------------------
describe('Couple with extreme PIA asymmetry', () => {
  // Earner PIA $5000, dependent PIA $1. Spousal = floor($5000/2) - $1 = $2499.

  it('spousal benefit = floor(earner/2) - dependent PIA = $2499', () => {
    const earner = makeRecipient(5000, 1965, 2, 15);
    const dependent = makeRecipient(1, 1965, 2, 15);
    const nra = earner.normalRetirementAge();
    const earnerDeath = earner.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );
    const depDeath = dependent.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [nra, nra]
    );

    const spousal = periods.filter(
      (p) => p.benefitType === BenefitType.Spousal
    );
    expect(spousal.length).toBeGreaterThan(0);
    // Spousal = floor(500000 / 2) / 100 - 1 = $2500 - $1 = $2499
    expect(spousal[0].amount.value()).toBe(2499);
  });

  it('total NPV is positive and dominated by earner personal benefit', () => {
    const earner = makeRecipient(5000, 1965, 2, 15);
    const dependent = makeRecipient(1, 1965, 2, 15);
    const nra = earner.normalRetirementAge();
    const earnerDeath = earner.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );
    const depDeath = dependent.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [nra, nra]
    );
    expect(npv).toBeGreaterThan(0);
    // Earner alone at NRA for 217 months = 217 * 5000 * 100 = 108,500,000
    // Total couple NPV should be greater than earner-only.
    expect(npv).toBeGreaterThan(217 * 5000 * 100);
  });
});

// ---------------------------------------------------------------------------
// 12. Simultaneous death of both spouses
// ---------------------------------------------------------------------------
describe('Simultaneous death of both spouses', () => {
  it('no survivor periods when both die in the same month', () => {
    const earner = makeRecipient(2000, 1965, 2, 15);
    const dependent = makeRecipient(500, 1965, 2, 15);
    const nra = earner.normalRetirementAge();
    const sameDeathDate = earner.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 80, months: 0 })
    );

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [sameDeathDate, sameDeathDate],
      [nra, nra]
    );

    const survivor = periods.filter(
      (p) => p.benefitType === BenefitType.Survivor
    );
    expect(survivor.length).toBe(0);
  });

  it('NPV is sum of personal + spousal only (no survivor)', () => {
    const earner = makeRecipient(2000, 1965, 2, 15);
    const dependent = makeRecipient(500, 1965, 2, 15);
    const nra = earner.normalRetirementAge();
    const sameDeathDate = earner.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 80, months: 0 })
    );

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [sameDeathDate, sameDeathDate],
      FAR_PAST,
      NO_DISCOUNT,
      [nra, nra]
    );

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [sameDeathDate, sameDeathDate],
      [nra, nra]
    );

    // All periods should be Personal or Spousal, no Survivor
    for (const p of periods) {
      expect(p.benefitType).not.toBe(BenefitType.Survivor);
    }

    // Manual sum should match NPV
    let manual = 0;
    for (const p of periods) {
      const months = p.endDate.subtractDate(p.startDate).asMonths() + 1;
      manual += p.amount.cents() * months;
    }
    expect(npv).toBe(manual);
    expect(npv).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 13. Adjacent-month death increments
// ---------------------------------------------------------------------------
describe('Adjacent-month death increments', () => {
  it('NPV increases by exactly PIA*100 cents per additional month at 0% discount', () => {
    // Single filer, PIA $1000, file at NRA. Sweep death month from
    // filing to filing+24. NPV should increase by exactly $1000*100 = 100000
    // cents per additional month at 0% discount.
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const filingDate = r.birthdate.dateAtSsaAge(nra);

    let prevNpv = strategySumCentsSingle(
      r,
      filingDate,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    // At filing month: 1 month = 100000 cents
    expect(prevNpv).toBe(1000 * 100);

    for (let i = 1; i <= 24; i++) {
      const deathDate = filingDate.addDuration(new MonthDuration(i));
      const npv = strategySumCentsSingle(
        r,
        deathDate,
        FAR_PAST,
        NO_DISCOUNT,
        nra
      );
      expect(npv - prevNpv).toBe(1000 * 100);
      prevNpv = npv;
    }
  });
});
