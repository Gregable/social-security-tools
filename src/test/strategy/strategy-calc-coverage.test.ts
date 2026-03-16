import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  BenefitType,
  optimalStrategyCouple,
  optimalStrategySingle,
  strategySumCentsCouple,
  strategySumCentsSingle,
  strategySumPeriodsCouple,
  strategySumPeriodsSingle,
} from '$lib/strategy/calculations';
import {
  createOptimizationContext,
  earliestFiling,
  optimalStrategyCoupleOptimized,
  strategySumPeriodsOptimized,
} from '$lib/strategy/calculations/strategy-calc';

/** Creates a Recipient with PIA only (no earnings records). */
function makeRecipient(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  piaDollars: number
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(birthYear, birthMonth, birthDay);
  r.setPia(Money.from(piaDollars));
  return r;
}

/**
 * Computes the final date (death date) for a recipient, set to December of
 * the calendar year in which they reach the given lay age.
 */
function finalDateAtAge(recipient: Recipient, ageYears: number): MonthDate {
  const raw = recipient.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({ years: ageYears, months: 0 })
  );
  return raw.addDuration(new MonthDuration(11 - raw.monthIndex()));
}

// A currentDate far in the past (year 200 AD), so no filing ages are
// clipped by current-date constraints.
const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

// ---------------------------------------------------------------------------
// 1. NPV / Discount Rate Tests
// ---------------------------------------------------------------------------
describe('NPV / discount rate for couples', () => {
  function coupleSumCents(
    discountRate: number,
    currentDate: MonthDate = FAR_PAST
  ): number {
    const r1 = makeRecipient(1960, 0, 15, 1000);
    const r2 = makeRecipient(1960, 0, 15, 1000);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 }),
    ];
    return strategySumCentsCouple(
      [r1, r2],
      finalDates,
      currentDate,
      discountRate,
      strategies
    );
  }

  it('with zero discount matches known undiscounted value', () => {
    // Two recipients each receive $1240/mo * 192 months (age 70 to 85,
    // Dec 2030 to Dec 2045) = $238,080 each, $476,160 total = 47,616,000 cents.
    expect(coupleSumCents(0)).toBe(47616000);
  });

  it('positive discount rate produces smaller NPV than undiscounted', () => {
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2029,
      months: 0,
    });
    const undiscounted = coupleSumCents(0, currentDate);
    const discounted = coupleSumCents(0.03, currentDate);
    expect(discounted).toBeLessThan(undiscounted);
    expect(discounted).toBeGreaterThan(0);
  });

  it('higher discount rate produces smaller NPV', () => {
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2029,
      months: 0,
    });
    const low = coupleSumCents(0.02, currentDate);
    const high = coupleSumCents(0.05, currentDate);
    expect(high).toBeLessThan(low);
  });

  it('computes correct NPV for single-payment case', () => {
    // Two recipients, PIA $1000 each, born Dec 15 1960, file at 70, die at 70.
    // Each gets $1240/mo for 1 month (Dec 2030). Payment arrives Jan 2031.
    // currentDate = Dec 2030. monthsToFirstPayment = 1.
    // NPV uses PVFactor(N=1) * discountFactor(k=1) = 1/(1+r) * 1/(1+r) = (1+r)^(-2).
    // So NPV per person = 124000 * (1+r)^(-2) where r = monthly rate.
    const r1 = makeRecipient(1960, 11, 15, 1000);
    const r2 = makeRecipient(1960, 11, 15, 1000);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 70),
      finalDateAtAge(r2, 70),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 }),
    ];
    const annualRate = 0.12;
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2030,
      months: 11,
    });

    const result = strategySumCentsCouple(
      [r1, r2],
      finalDates,
      currentDate,
      annualRate,
      strategies
    );

    const monthlyRate = (1 + annualRate) ** (1 / 12) - 1;
    const expectedPerPerson = 124000 * (1 + monthlyRate) ** -2;
    const expectedTotal = expectedPerPerson * 2;

    expect(result).toBeCloseTo(expectedTotal, 0);
  });
});

describe('NPV / discount rate for single recipient', () => {
  it('positive discount rate reduces single-recipient NPV', () => {
    const r = makeRecipient(1960, 0, 2, 1000);
    const finalDate = finalDateAtAge(r, 85);
    const strat = MonthDuration.initFromYearsMonths({ years: 67, months: 0 });
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2026,
      months: 0,
    });
    const undiscounted = strategySumCentsSingle(
      r,
      finalDate,
      currentDate,
      0,
      strat
    );
    const discounted = strategySumCentsSingle(
      r,
      finalDate,
      currentDate,
      0.03,
      strat
    );

    expect(discounted).toBeLessThan(undiscounted);
    expect(discounted).toBeGreaterThan(0);
  });

  it('computes correct single-payment NPV', () => {
    // PIA $1000, file at 70, die at 70, born Dec 15 1960.
    // Benefit = $1240/mo for 1 month. Payment in Jan 2031.
    // currentDate = Dec 2030. monthsToFirstPayment = 1.
    // NPV uses PVFactor(N=1) * discountFactor(k=1) = (1+r)^(-2).
    const r = makeRecipient(1960, 11, 15, 1000);
    const finalDate = finalDateAtAge(r, 70);
    const strat = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2030,
      months: 11,
    });

    const annualRate = 0.06;
    const result = strategySumCentsSingle(
      r,
      finalDate,
      currentDate,
      annualRate,
      strat
    );

    const monthlyRate = (1 + annualRate) ** (1 / 12) - 1;
    const expected = 124000 * (1 + monthlyRate) ** -2;
    expect(result).toBeCloseTo(expected, 0);
  });
});

// ---------------------------------------------------------------------------
// 2. earliestFiling Tests
// ---------------------------------------------------------------------------
describe('earliestFiling', () => {
  it('returns 62y1m for person born on 15th who has not reached 62', () => {
    const r = makeRecipient(2000, 2, 15, 1000);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });
    const result = earliestFiling(r, currentDate);
    // Born on 15th (> 2nd), earliest = 62y1m.
    expect(result.asMonths()).toBe(62 * 12 + 1);
  });

  it('returns 62y0m for person born on 1st or 2nd', () => {
    const r = makeRecipient(2000, 2, 2, 1000);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });
    const result = earliestFiling(r, currentDate);
    expect(result.asMonths()).toBe(62 * 12);
  });

  it('returns current age when between earliest filing and NRA', () => {
    // Born Jan 2, 1960. NRA = 67. Currently age 64 (Jan 2024).
    // 62y0m is in the past, but NRA hasn't been reached, so earliest = current age.
    const r = makeRecipient(1960, 0, 2, 1000);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2024,
      months: 0,
    });
    const result = earliestFiling(r, currentDate);
    const currentAge = r.birthdate.ageAtSsaDate(currentDate);
    expect(result.asMonths()).toBe(currentAge.asMonths());
  });

  it('returns NRA for person just past NRA (within 6-month window)', () => {
    // Born Jan 2, 1960. NRA = 67y0m. Currently 67y3m (Apr 2027).
    // Can retroactively file at NRA since it's within 6 months.
    const r = makeRecipient(1960, 0, 2, 1000);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2027,
      months: 3,
    });
    const result = earliestFiling(r, currentDate);
    expect(result.asMonths()).toBe(r.normalRetirementAge().asMonths());
  });

  it('applies 6-month retroactive limit for person well past NRA', () => {
    // Born Jan 2, 1960. NRA = 67y0m. Currently 69y0m (Jan 2029).
    // NRA is 24 months ago, but can only go back 6 months.
    // Earliest = current age - 6 = 68y6m.
    const r = makeRecipient(1960, 0, 2, 1000);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2029,
      months: 0,
    });
    const result = earliestFiling(r, currentDate);
    const expected = r.birthdate.ageAtSsaDate(currentDate).asMonths() - 6;
    expect(result.asMonths()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 3. Optimized vs Non-Optimized (Deterministic)
// ---------------------------------------------------------------------------
describe('optimized vs non-optimized couple strategy', () => {
  it('produces identical results with a non-zero discount rate', () => {
    const r1 = makeRecipient(1962, 5, 10, 1500);
    const r2 = makeRecipient(1963, 8, 20, 1200);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 83),
    ];
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2025,
      months: 0,
    });
    const discountRate = 0.03;

    const [s0, s1, val] = optimalStrategyCouple(
      [r1, r2],
      finalDates,
      currentDate,
      discountRate
    );
    const [s0o, s1o, valO] = optimalStrategyCoupleOptimized(
      [r1, r2],
      finalDates,
      currentDate,
      discountRate
    );

    expect(s0.asMonths()).toBe(s0o.asMonths());
    expect(s1.asMonths()).toBe(s1o.asMonths());
    expect(val).toBeCloseTo(valO, 0);
  });

  it('produces identical results with discount rate = 0', () => {
    const r1 = makeRecipient(1960, 11, 15, 1000);
    const r2 = makeRecipient(1960, 11, 15, 500);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 90),
      finalDateAtAge(r2, 85),
    ];
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2025,
      months: 6,
    });

    const [s0, s1, val] = optimalStrategyCouple(
      [r1, r2],
      finalDates,
      currentDate,
      0
    );
    const [s0o, s1o, valO] = optimalStrategyCoupleOptimized(
      [r1, r2],
      finalDates,
      currentDate,
      0
    );

    expect(s0.asMonths()).toBe(s0o.asMonths());
    expect(s1.asMonths()).toBe(s1o.asMonths());
    expect(val).toBe(valO);
  });

  it('produces structurally identical periods (types, amounts, dates)', () => {
    // Directly compare the period arrays from both code paths to guard
    // against future divergence (e.g., missing benefitType fields).
    const r1 = makeRecipient(1960, 11, 15, 2000);
    const r2 = makeRecipient(1960, 11, 15, 600);
    const recipients: [Recipient, Recipient] = [r1, r2];
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 75),
      finalDateAtAge(r2, 80),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
    ];
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2025,
      months: 0,
    });

    // Non-optimized path
    const nonOptPeriods = strategySumPeriodsCouple(
      recipients,
      finalDates,
      strategies
    );

    // Optimized path
    const context = createOptimizationContext(
      recipients,
      finalDates,
      currentDate,
      0
    );
    const earnerStratDate = context.earner.birthdate.dateAtSsaAge(
      strategies[context.earnerIndex]
    );
    const dependentStratDate = context.dependent.birthdate.dateAtSsaAge(
      strategies[context.dependentIndex]
    );
    const optPeriods = strategySumPeriodsOptimized(
      context,
      earnerStratDate,
      dependentStratDate
    );

    expect(optPeriods).toHaveLength(nonOptPeriods.length);

    // Sort both arrays by (startDate, recipientIndex, benefitType) for
    // stable comparison.
    const sortKey = (p: (typeof nonOptPeriods)[0]) =>
      `${p.startDate.monthsSinceEpoch()}-${p.recipientIndex}-${p.benefitType}`;
    const sortedNonOpt = [...nonOptPeriods].sort((a, b) =>
      sortKey(a).localeCompare(sortKey(b))
    );
    const sortedOpt = [...optPeriods].sort((a, b) =>
      sortKey(a).localeCompare(sortKey(b))
    );

    for (let i = 0; i < sortedNonOpt.length; i++) {
      const np = sortedNonOpt[i];
      const op = sortedOpt[i];
      expect(op.benefitType).toBe(np.benefitType);
      expect(op.amount.cents()).toBe(np.amount.cents());
      expect(op.startDate.monthsSinceEpoch()).toBe(
        np.startDate.monthsSinceEpoch()
      );
      expect(op.endDate.monthsSinceEpoch()).toBe(np.endDate.monthsSinceEpoch());
      expect(op.recipientIndex).toBe(np.recipientIndex);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Single-Recipient Strategy Functions
// ---------------------------------------------------------------------------
describe('single-recipient strategy functions', () => {
  it('computes correct undiscounted benefit for NRA filing', () => {
    // Born Jan 2, 1960. SSA birth = Jan 1960. NRA = 67y0m = Jan 2027.
    // Benefit at NRA = $1000/mo. Die at 67 → finalDate = Dec 2027.
    // Period: Jan 2027 to Dec 2027 = 12 months.
    // Total = $1000 * 12 = 1,200,000 cents.
    const r = makeRecipient(1960, 0, 2, 1000);
    const finalDate = finalDateAtAge(r, 67);
    const strat = MonthDuration.initFromYearsMonths({ years: 67, months: 0 });

    const result = strategySumCentsSingle(r, finalDate, FAR_PAST, 0, strat);
    expect(result).toBe(1200000);
  });

  it('computes correct undiscounted benefit for age 70 filing', () => {
    // Born Jan 2, 1960. File at 70y0m = Jan 2030.
    // DRC: 3 years * 8%/year = 24%. Benefit = $1240/mo.
    // Die at 71 → finalDate = Dec 2031.
    // Period: Jan 2030 to Dec 2031 = 24 months.
    // Total = $1240 * 24 = 2,976,000 cents.
    const r = makeRecipient(1960, 0, 2, 1000);
    const finalDate = finalDateAtAge(r, 71);
    const strat = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });

    const result = strategySumCentsSingle(r, finalDate, FAR_PAST, 0, strat);
    expect(result).toBe(2976000);
  });

  it('optimalStrategySingle selects 70 for long-lived recipient', () => {
    const r = makeRecipient(1970, 0, 2, 1500);
    const finalDate = finalDateAtAge(r, 95);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2025,
      months: 0,
    });
    const [optAge, optValue] = optimalStrategySingle(
      r,
      finalDate,
      currentDate,
      0
    );
    expect(optAge.years()).toBe(70);
    expect(optValue).toBeGreaterThan(0);
  });

  it('optimalStrategySingle selects earliest for short-lived recipient', () => {
    // Dies at 65 — filing early dominates because more months of collection.
    const r = makeRecipient(1970, 0, 2, 1500);
    const finalDate = finalDateAtAge(r, 65);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2025,
      months: 0,
    });
    const [optAge] = optimalStrategySingle(r, finalDate, currentDate, 0);
    // Born on 2nd → earliest = 62y0m.
    expect(optAge.asMonths()).toBe(62 * 12);
  });
});

// ---------------------------------------------------------------------------
// 5. Spousal Top-Up With Two Earners
// ---------------------------------------------------------------------------
describe('spousal top-up with two earners', () => {
  it('includes spousal benefit when dependent PIA < half earner PIA', () => {
    // R1: PIA $2000, R2: PIA $600. Both born Dec 15, 1960. NRA = 67y0m.
    // Both file at NRA. Both die at 68 (finalDate = Dec 2028).
    //
    // R2 eligible: $2000/2 = $1000 > $600 → yes. Spousal = $400/mo.
    //
    // R1 personal: $2000 * 13 months = 2,600,000 cents
    // R2 personal: $600 * 13 months = 780,000 cents
    // R2 spousal: $400 * 13 months = 520,000 cents
    // Total = 3,900,000 cents.
    const r1 = makeRecipient(1960, 11, 15, 2000);
    const r2 = makeRecipient(1960, 11, 15, 600);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 68),
      finalDateAtAge(r2, 68),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
    ];

    const result = strategySumCentsCouple(
      [r1, r2],
      finalDates,
      FAR_PAST,
      0,
      strategies
    );
    expect(result).toBe(3900000);
  });

  it('no spousal benefit when dependent PIA >= half earner PIA', () => {
    // R1: PIA $1000, R2: PIA $800. $1000/2 = $500 not > $800 → ineligible.
    // Both born Dec 15, 1960. Both file at NRA. Both die at 68 (13 months).
    // Total = ($1000 + $800) * 13 * 100 = 2,340,000 cents.
    const r1 = makeRecipient(1960, 11, 15, 1000);
    const r2 = makeRecipient(1960, 11, 15, 800);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 68),
      finalDateAtAge(r2, 68),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
    ];

    const result = strategySumCentsCouple(
      [r1, r2],
      finalDates,
      FAR_PAST,
      0,
      strategies
    );
    expect(result).toBe(2340000);
  });

  it('reduces spousal benefit for early filing (before NRA)', () => {
    // R1: PIA $2000, R2: PIA $600. Both born Dec 15, 1960.
    // Both file at 64y0m (36 months before NRA of 67).
    // Both die at 68 (Dec 2028). Filing date = Dec 2024.
    //
    // Early reduction: 36 months before NRA → 20% reduction on personal.
    // R1 personal: $2000 * 0.8 = $1600/mo * 49 months = 7,840,000 cents
    // R2 personal: $600 * 0.8 = $480/mo * 49 months = 2,352,000 cents
    //
    // Spousal: startDate (Dec 2024) is before NRA (Dec 2027).
    // 36 months early → spousal reduced by 25%.
    // Base spousal = $2000/2 - $600 = $400. Reduced: $400 * 0.75 = $300/mo.
    // R2 spousal: $300/mo * 49 months = 1,470,000 cents
    //
    // Total = 7,840,000 + 2,352,000 + 1,470,000 = 11,662,000 cents.
    const r1 = makeRecipient(1960, 11, 15, 2000);
    const r2 = makeRecipient(1960, 11, 15, 600);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 68),
      finalDateAtAge(r2, 68),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 64, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 64, months: 0 }),
    ];

    const result = strategySumCentsCouple(
      [r1, r2],
      finalDates,
      FAR_PAST,
      0,
      strategies
    );
    expect(result).toBe(11662000);
  });
});

// ---------------------------------------------------------------------------
// 6. Survivor Benefit With Non-Zero Dependent PIA
// ---------------------------------------------------------------------------
describe('survivor benefit with non-zero dependent PIA', () => {
  it('applies survivor benefit when it exceeds dependent personal benefit', () => {
    // R1: PIA $2000, R2: PIA $600. Both born Dec 15, 1960.
    // Both file at NRA (67y0m = Dec 2027).
    // R1 dies at 68 (Dec 2028). R2 dies at 75 (Dec 2035).
    //
    // R1 filed before death → baseSurvivor = max($2000*0.825, $2000) = $2000.
    // R2 personal $600 < $2000 → survivor applies.
    //
    // R1 personal: $2000 * 13 months = 2,600,000 cents
    // R2 personal: $600 * 13 months = 780,000 cents (ends at survivor start - 1)
    // R2 spousal: $400 * 13 months = 520,000 cents
    // R2 survivor: $2000 * 84 months (Jan 2029 - Dec 2035) = 16,800,000 cents
    // Total = 20,700,000 cents.
    const r1 = makeRecipient(1960, 11, 15, 2000);
    const r2 = makeRecipient(1960, 11, 15, 600);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 68),
      finalDateAtAge(r2, 75),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
    ];

    const result = strategySumCentsCouple(
      [r1, r2],
      finalDates,
      FAR_PAST,
      0,
      strategies
    );
    expect(result).toBe(20700000);
  });

  it('skips survivor benefit when dependent personal exceeds survivor amount', () => {
    // R1: PIA $1000, R2: PIA $900. Born Dec 15, 1960.
    // R1 files at NRA (67y0m). R2 files at 70 → DRC 24% → $1116/mo.
    // R1 dies at 68 (Dec 2028). R2 dies at 75 (Dec 2035).
    //
    // baseSurvivor = max($1000*0.825, $1000) = $1000.
    // R2 personal at 70 = $1116 > $1000 → survivor does NOT apply.
    const r1 = makeRecipient(1960, 11, 15, 1000);
    const r2 = makeRecipient(1960, 11, 15, 900);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 68),
      finalDateAtAge(r2, 75),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 }),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strategies);
    const survivorPeriods = periods.filter(
      (p) => p.benefitType === BenefitType.Survivor
    );
    expect(survivorPeriods).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Period Structure Verification
// ---------------------------------------------------------------------------
describe('period structure verification', () => {
  it('generates correct period types for couple with spousal and survivor', () => {
    // R1: PIA $2000, R2: PIA $500. Both born Dec 15, 1960. Both file at NRA.
    // R1 dies at 68, R2 dies at 75.
    // Expect: R1 personal, R2 personal, R2 spousal, R2 survivor.
    const r1 = makeRecipient(1960, 11, 15, 2000);
    const r2 = makeRecipient(1960, 11, 15, 500);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 68),
      finalDateAtAge(r2, 75),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strategies);

    const personal = periods.filter(
      (p) => p.benefitType === BenefitType.Personal
    );
    const spousal = periods.filter(
      (p) => p.benefitType === BenefitType.Spousal
    );
    const survivor = periods.filter(
      (p) => p.benefitType === BenefitType.Survivor
    );

    // One personal period per recipient (both file at NRA, no year-of-election bump).
    expect(personal).toHaveLength(2);
    expect(spousal).toHaveLength(1);
    expect(survivor).toHaveLength(1);

    // Spousal amount: $2000/2 - $500 = $500/mo.
    expect(spousal[0].amount.value()).toBe(500);
    // Survivor amount: earner filed at NRA, benefit = $2000. max($2000*0.825, $2000) = $2000.
    expect(survivor[0].amount.value()).toBe(2000);
  });

  it('generates correct single-recipient periods for NRA filing', () => {
    // Born Jan 2, 1960. File at NRA. No year-of-election bump → single period.
    const r = makeRecipient(1960, 0, 2, 1000);
    const finalDate = finalDateAtAge(r, 68);
    const strat = MonthDuration.initFromYearsMonths({ years: 67, months: 0 });

    const periods = strategySumPeriodsSingle(r, finalDate, strat);

    expect(periods).toHaveLength(1);
    expect(periods[0].benefitType).toBe(BenefitType.Personal);
    expect(periods[0].amount.value()).toBe(1000);
    expect(periods[0].recipientIndex).toBe(0);
  });

  it('generates two periods for mid-year post-NRA filing (year-of-election)', () => {
    // Born Jan 2, 1960. File at 68y6m (Jul 2028).
    // Year-of-election: in the filing year, credits are computed only through
    // the later of NRA or January of that year; full credits start the
    // following January.
    const r = makeRecipient(1960, 0, 2, 1000);
    const finalDate = finalDateAtAge(r, 72);
    const strat = MonthDuration.initFromYearsMonths({ years: 68, months: 6 });

    const periods = strategySumPeriodsSingle(r, finalDate, strat);

    expect(periods).toHaveLength(2);
    expect(periods[0].benefitType).toBe(BenefitType.Personal);
    expect(periods[1].benefitType).toBe(BenefitType.Personal);

    // Second period has full DRC; first has credits only through January.
    expect(periods[1].amount.cents()).toBeGreaterThan(
      periods[0].amount.cents()
    );
  });
});

// ---------------------------------------------------------------------------
// 8. Couple Edge Cases
// ---------------------------------------------------------------------------
describe('couple edge cases', () => {
  it('adjusts zero-PIA dependent filing date to earner filing date', () => {
    // R1: PIA $1000, files at 70 (Dec 2030). Dies at 71 (Dec 2031).
    // R2: PIA $0, files at 63 (Dec 2023). Dies at 73 (Dec 2033).
    //
    // Since R2 has $0 PIA and files before R1, the code adjusts R2's
    // filing to match R1's (Dec 2030). Verify by checking that no
    // spousal period starts before the earner's filing date.
    const r1 = makeRecipient(1960, 11, 15, 1000);
    const r2 = makeRecipient(1960, 11, 15, 0);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 71),
      finalDateAtAge(r2, 73),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 63, months: 0 }),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strategies);

    const earnerFilingDate = r1.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
    );

    // No period should start before the earner's filing date.
    for (const p of periods) {
      expect(p.startDate.greaterThanOrEqual(earnerFilingDate)).toBe(true);
    }

    // Should have survivor periods (R2 outlives R1).
    const survivor = periods.filter(
      (p) => p.benefitType === BenefitType.Survivor
    );
    expect(survivor.length).toBeGreaterThan(0);
  });

  it('starts survivor at dependent filing date when earner dies first', () => {
    // R1: PIA $2000, files at NRA (Dec 2027). Dies at 68 (Dec 2028).
    // R2: PIA $600, files at 70 (Dec 2030). Dies at 80 (Dec 2040).
    //
    // Earner dies (Dec 2028) before dependent files (Dec 2030).
    // Survivor start = max(earnerDeath+1, dependentFiling) = Dec 2030.
    // The dependent's filing date dominates, not the earner's death.
    const r1 = makeRecipient(1960, 11, 15, 2000);
    const r2 = makeRecipient(1960, 11, 15, 600);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 68),
      finalDateAtAge(r2, 80),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 }),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strategies);

    const survivor = periods.filter(
      (p) => p.benefitType === BenefitType.Survivor
    );
    expect(survivor).toHaveLength(1);

    // Survivor should start at dependent's filing date (Dec 2030),
    // not earner's death + 1 (Jan 2029).
    const dependentFilingDate = r2.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
    );
    expect(survivor[0].startDate.monthsSinceEpoch()).toBe(
      dependentFilingDate.monthsSinceEpoch()
    );
  });

  it('produces no survivor periods when earner outlives dependent', () => {
    // R1: PIA $2000, files at NRA (Dec 2027). Dies at 80 (Dec 2040).
    // R2: PIA $600, files at NRA (Dec 2027). Dies at 68 (Dec 2028).
    //
    // Earner outlives dependent — no survivor benefit applies.
    const r1 = makeRecipient(1960, 11, 15, 2000);
    const r2 = makeRecipient(1960, 11, 15, 600);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 80),
      finalDateAtAge(r2, 68),
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strategies);

    const survivor = periods.filter(
      (p) => p.benefitType === BenefitType.Survivor
    );
    expect(survivor).toHaveLength(0);
  });

  it('spousal benefit ends on dependent death date, not one month later', () => {
    // R1: PIA $2000, files at NRA (67). Dies at 90.
    // R2: PIA $600, files at NRA (67). Dies at 70 (before earner).
    //
    // Spousal benefit should end on R2's death date (inclusive), not
    // one month after.
    const r1 = makeRecipient(1960, 11, 15, 2000);
    const r2 = makeRecipient(1960, 11, 15, 600);
    const dependentFinalDate = finalDateAtAge(r2, 70);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 90),
      dependentFinalDate,
    ];
    const strategies: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strategies);

    const spousal = periods.filter(
      (p) => p.benefitType === BenefitType.Spousal
    );
    expect(spousal).toHaveLength(1);
    expect(spousal[0].endDate.monthsSinceEpoch()).toBe(
      dependentFinalDate.monthsSinceEpoch()
    );
  });
});
