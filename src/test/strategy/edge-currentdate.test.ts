import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  optimalStrategySingle,
  strategySumCentsCouple,
  strategySumCentsSingle,
} from '$lib/strategy/calculations';
import {
  earliestFiling,
  optimalStrategyCouple,
} from '$lib/strategy/calculations/strategy-calc';

/**
 * Creates a Recipient with a given PIA and birthdate.
 * Uses setPia to bypass earnings records.
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
 * Computes the final (death) date for a recipient at a given age.
 * Adjusts to the end of the calendar year (December), matching
 * the convention used in the existing tests.
 */
function deathDateAtAge(
  recipient: Recipient,
  ageYears: number,
  ageMonths: number = 0
): MonthDate {
  const rawDate = recipient.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({ years: ageYears, months: ageMonths })
  );
  return rawDate.addDuration(new MonthDuration(11 - rawDate.monthIndex()));
}

/** Helper to create a MonthDate from calendar year and 0-indexed month. */
function monthDate(year: number, month: number): MonthDate {
  return MonthDate.initFromYearsMonths({ years: year, months: month });
}

/** Helper to create a MonthDuration from years and months. */
function ageDuration(years: number, months: number): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

// ===========================================================================
// Group 1: earliestFiling - not yet 62
// ===========================================================================
describe('earliestFiling - not yet 62', () => {
  // When the recipient has not yet turned 62, earliestFiling should return
  // the base earliest filing age (62y1m for day > 2, 62y0m for day <= 2).

  it('born Jan 15 1970, currentDate Jan 2025 (~age 55): earliest = 62y1m', () => {
    const r = makeRecipient(1000, 1970, 0, 15);
    const currentDate = monthDate(2025, 0);
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(62, 1).asMonths());
  });

  it('born Jan 2 1970, currentDate Jan 2025: earliest = 62y0m (born on 2nd)', () => {
    const r = makeRecipient(1000, 1970, 0, 2);
    const currentDate = monthDate(2025, 0);
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(62, 0).asMonths());
  });

  it('born Jan 1 1970, currentDate Jan 2025: earliest = 62y0m (born on 1st)', () => {
    const r = makeRecipient(1000, 1970, 0, 1);
    const currentDate = monthDate(2025, 0);
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(62, 0).asMonths());
  });

  it('born Dec 15 1970, currentDate Jan 2025 (~age 54): earliest = 62y1m', () => {
    const r = makeRecipient(1000, 1970, 11, 15);
    const currentDate = monthDate(2025, 0);
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(62, 1).asMonths());
  });
});

// ===========================================================================
// Group 2: earliestFiling - between 62 and NRA
// ===========================================================================
describe('earliestFiling - between 62 and NRA', () => {
  // Born Jan 15, 1960. NRA = 67y0m. SSA birth month = Jan 1960.
  // When the recipient is past 62 but not yet at NRA, they cannot
  // retroactively file before NRA -- so earliest = currentAge.

  it('currentDate Feb 2023 (age ~63y1m): earliest = 63y1m', () => {
    // SSA birth: Jan 14, 1960 -> SSA month: Jan 1960.
    // currentAge = Feb 2023 - Jan 1960 = 63y1m.
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2023, 1); // Feb 2023
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(63, 1).asMonths());
  });

  it('currentDate Jan 2024 (age 64y0m): earliest = 64y0m', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2024, 0); // Jan 2024
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(64, 0).asMonths());
  });

  it('currentDate Jan 2025 (age 65y0m): earliest = 65y0m', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2025, 0); // Jan 2025
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(65, 0).asMonths());
  });

  it('currentDate Jan 2026 (age 66y0m): earliest = 66y0m', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2026, 0); // Jan 2026
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(66, 0).asMonths());
  });
});

// ===========================================================================
// Group 3: earliestFiling - at or just past NRA
// ===========================================================================
describe('earliestFiling - at or just past NRA', () => {
  // Born Jan 15, 1960. NRA = 67y0m. SSA birth Jan 1960.
  // After NRA is reached, retroactive filing back to NRA is allowed
  // (within the 6-month limit). So earliest = NRA.

  it('currentDate Feb 2027 (age 67y1m, NRA+1m): earliest = NRA (67y0m)', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2027, 1); // Feb 2027
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(67, 0).asMonths());
  });

  it('currentDate Apr 2027 (age 67y3m, NRA+3m): earliest = NRA (67y0m)', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2027, 3); // Apr 2027
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(67, 0).asMonths());
  });

  it('currentDate Jun 2027 (age 67y5m, NRA+5m): earliest = NRA (67y0m)', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2027, 5); // Jun 2027
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(67, 0).asMonths());
  });

  it('currentDate Jul 2027 (age 67y6m, NRA+6m): earliest = NRA (67y0m)', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2027, 6); // Jul 2027
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(67, 0).asMonths());
  });
});

// ===========================================================================
// Group 4: earliestFiling - well past NRA (6-month limit)
// ===========================================================================
describe('earliestFiling - well past NRA (6-month limit)', () => {
  // Born Jan 15, 1960. NRA = 67y0m. SSA birth Jan 1960.
  // More than 6 months past NRA: the 6-month retroactive limit applies.
  // earliest = currentAge - 6 months.

  it('currentDate Jan 2028 (age 68y0m, NRA+12m): earliest = 67y6m', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2028, 0); // Jan 2028
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(67, 6).asMonths());
  });

  it('currentDate Jan 2029 (age 69y0m, NRA+24m): earliest = 68y6m', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2029, 0); // Jan 2029
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(68, 6).asMonths());
  });

  it('currentDate Jul 2029 (age 69y6m, NRA+30m): earliest = 69y0m', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2029, 6); // Jul 2029
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(69, 0).asMonths());
  });

  it('6-month limit tightens as age increases', () => {
    // Born Jun 15, 1958. NRA = 66y8m. SSA birth Jun 1958.
    // At age 70 (Jun 2028): earliest = 69y6m.
    const r = makeRecipient(1000, 1958, 5, 15);
    const currentDate = monthDate(2028, 5); // Jun 2028 -> age 70y0m
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(69, 6).asMonths());
  });
});

// ===========================================================================
// Group 5: earliestFiling - at or past 70
// ===========================================================================
describe('earliestFiling - at or past 70', () => {
  // When the recipient is at or past age 70, the 6-month retroactive rule
  // still applies, so earliest = currentAge - 6 months.
  // The optimizer loop runs for i = earliest to i <= 70*12, so if earliest
  // exceeds 70y0m the loop has an empty range.

  it('currentDate Jan 2030 (age 70y0m): earliest = 69y6m', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2030, 0); // Jan 2030
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(69, 6).asMonths());
  });

  it('currentDate Jul 2030 (age 70y6m): earliest = 70y0m', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2030, 6); // Jul 2030
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(70, 0).asMonths());
  });

  it('currentDate Jan 2032 (age 72y0m): earliest = 71y6m (past 70, empty optimizer range)', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const currentDate = monthDate(2032, 0); // Jan 2032
    const earliest = earliestFiling(r, currentDate);
    // 6-month rule gives 72y0m - 6m = 71y6m, which exceeds 70y0m.
    // The optimizer loop (i = 71y6m .. i <= 70y0m) is empty.
    expect(earliest.asMonths()).toBe(ageDuration(71, 6).asMonths());
    // Verify that the optimizer range would be empty:
    expect(earliest.asMonths()).toBeGreaterThan(ageDuration(70, 0).asMonths());
  });
});

// ===========================================================================
// Group 6: Optimizer with constrained currentDate
// ===========================================================================
describe('Optimizer with constrained currentDate', () => {
  // Born Jan 15, 1960. NRA = 67y0m. PIA = $1000. Death at age 90.
  // The optimizer must pick a filing age within the constrained window.

  const AGE_70 = ageDuration(70, 0);

  it('currentDate Jan 2025 (age 65): optimal >= 65y0m', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const finalDate = deathDateAtAge(r, 90);
    const currentDate = monthDate(2025, 0);
    const earliest = earliestFiling(r, currentDate);
    const [optAge] = optimalStrategySingle(r, finalDate, currentDate, 0);
    expect(optAge.asMonths()).toBeGreaterThanOrEqual(earliest.asMonths());
    expect(optAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
  });

  it('currentDate Jul 2027 (age 67y6m): can retroactively file at NRA', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const finalDate = deathDateAtAge(r, 90);
    const currentDate = monthDate(2027, 6);
    const earliest = earliestFiling(r, currentDate);
    // earliest should be NRA = 67y0m (within 6-month retroactive window)
    expect(earliest.asMonths()).toBe(ageDuration(67, 0).asMonths());
    const [optAge] = optimalStrategySingle(r, finalDate, currentDate, 0);
    expect(optAge.asMonths()).toBeGreaterThanOrEqual(earliest.asMonths());
    expect(optAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
  });

  it('currentDate Jan 2029 (age 69): window is ~68y6m to 70y0m', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    const finalDate = deathDateAtAge(r, 90);
    const currentDate = monthDate(2029, 0);
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(68, 6).asMonths());
    const [optAge] = optimalStrategySingle(r, finalDate, currentDate, 0);
    expect(optAge.asMonths()).toBeGreaterThanOrEqual(earliest.asMonths());
    expect(optAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
  });

  it('optimal NPV is maximum within constrained window', () => {
    // Verify exhaustively that the optimizer picks the best within the window.
    const r = makeRecipient(1000, 1960, 0, 15);
    const finalDate = deathDateAtAge(r, 90);
    const currentDate = monthDate(2027, 6); // age 67y6m
    const earliest = earliestFiling(r, currentDate);
    const [optAge, optNpv] = optimalStrategySingle(
      r,
      finalDate,
      currentDate,
      0
    );

    // Check every possible filing age in the window.
    for (let m = earliest.asMonths(); m <= AGE_70.asMonths(); m++) {
      const strat = new MonthDuration(m);
      const npv = strategySumCentsSingle(r, finalDate, currentDate, 0, strat);
      expect(optNpv).toBeGreaterThanOrEqual(npv);
    }
    // Also verify the optimal is within the window.
    expect(optAge.asMonths()).toBeGreaterThanOrEqual(earliest.asMonths());
  });

  it('currentDate far in the past: full window available', () => {
    // When currentDate is far in the past, the full 62-70 window is available.
    const r = makeRecipient(1000, 1960, 0, 15);
    const finalDate = deathDateAtAge(r, 90);
    const farPast = monthDate(200, 0);
    const earliest = earliestFiling(r, farPast);
    expect(earliest.asMonths()).toBe(ageDuration(62, 1).asMonths());
    const [optAge] = optimalStrategySingle(r, finalDate, farPast, 0);
    // For death at 90 with 0% discount, filing at 70 is optimal.
    expect(optAge.asMonths()).toBe(AGE_70.asMonths());
  });
});

// ===========================================================================
// Group 7: Couple optimizer with mixed currentDate constraints
// ===========================================================================
describe('Couple optimizer with mixed currentDate constraints', () => {
  const AGE_70 = ageDuration(70, 0);

  it('R1 past NRA, R2 not yet 62: both within their valid ranges', () => {
    // R1 born Jan 15, 1958. NRA = 66y8m. At Jan 2025: age ~67y0m.
    // SSA birth: Jan 14, 1958 -> SSA month: Jan 1958.
    // currentAge = Jan 2025 - Jan 1958 = 67y0m.
    // NRA = 66y8m < 67y0m, so NRA is in the past.
    // 6-month rule: 67y0m - 6m = 66y6m. NRA (66y8m) > 66y6m, so earliest = NRA = 66y8m.
    const r1 = makeRecipient(1500, 1958, 0, 15);
    // R2 born Jan 15, 1970. At Jan 2025: age ~55. Not yet 62.
    const r2 = makeRecipient(1000, 1970, 0, 15);
    const currentDate = monthDate(2025, 0);
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r1, 90),
      deathDateAtAge(r2, 90),
    ];

    const earliest1 = earliestFiling(r1, currentDate);
    const earliest2 = earliestFiling(r2, currentDate);

    const [optAge1, optAge2] = optimalStrategyCouple(
      [r1, r2],
      finalDates,
      currentDate,
      0
    );

    expect(optAge1.asMonths()).toBeGreaterThanOrEqual(earliest1.asMonths());
    expect(optAge1.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
    expect(optAge2.asMonths()).toBeGreaterThanOrEqual(earliest2.asMonths());
    expect(optAge2.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
  });

  it('both past NRA with different birth years: both constrained', () => {
    // R1 born Mar 15, 1958. NRA = 66y8m.
    // R2 born Sep 15, 1959. NRA = 66y10m.
    // currentDate = Jan 2027.
    // R1 age: Jan 2027 - Mar 1958 = 68y10m. Well past NRA. 6-month: 68y4m.
    // R2 age: Jan 2027 - Sep 1959 = 67y4m. Past NRA. 6-month: 66y10m = NRA.
    const r1 = makeRecipient(1500, 1958, 2, 15);
    const r2 = makeRecipient(1200, 1959, 8, 15);
    const currentDate = monthDate(2027, 0);
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r1, 85),
      deathDateAtAge(r2, 85),
    ];

    const earliest1 = earliestFiling(r1, currentDate);
    const earliest2 = earliestFiling(r2, currentDate);

    const [optAge1, optAge2] = optimalStrategyCouple(
      [r1, r2],
      finalDates,
      currentDate,
      0
    );

    expect(optAge1.asMonths()).toBeGreaterThanOrEqual(earliest1.asMonths());
    expect(optAge1.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
    expect(optAge2.asMonths()).toBeGreaterThanOrEqual(earliest2.asMonths());
    expect(optAge2.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
  });

  it('one recipient at age 70, other at 62: extreme asymmetry', () => {
    // R1 born Jan 15, 1955. At Jan 2025: age 70. NRA = 66y2m.
    // R2 born Jan 15, 1963. At Jan 2025: age 62. NRA = 67y0m.
    const r1 = makeRecipient(2000, 1955, 0, 15);
    const r2 = makeRecipient(800, 1963, 0, 15);
    const currentDate = monthDate(2025, 0);
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r1, 90),
      deathDateAtAge(r2, 90),
    ];

    const earliest1 = earliestFiling(r1, currentDate);
    const earliest2 = earliestFiling(r2, currentDate);

    // R1 at age 70: earliest should be 69y6m.
    expect(earliest1.asMonths()).toBe(ageDuration(69, 6).asMonths());
    // R2 at age 62: earliest should be 62y1m (born on 15th).
    expect(earliest2.asMonths()).toBe(ageDuration(62, 1).asMonths());

    const [optAge1, optAge2] = optimalStrategyCouple(
      [r1, r2],
      finalDates,
      currentDate,
      0
    );

    expect(optAge1.asMonths()).toBeGreaterThanOrEqual(earliest1.asMonths());
    expect(optAge1.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
    expect(optAge2.asMonths()).toBeGreaterThanOrEqual(earliest2.asMonths());
    expect(optAge2.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
  });
});

// ===========================================================================
// Group 8: NPV with currentDate clipping past payments
// ===========================================================================
describe('NPV with currentDate clipping past payments', () => {
  // When currentDate is after the filing date, past payments are not counted
  // in the NPV. A later currentDate should produce a lower (or equal) NPV
  // because fewer future payments remain.

  it('NPV with currentDate at NRA vs currentDate 3 years later', () => {
    // Born Jan 15, 1960. NRA = 67y0m. Filing at NRA. Death at 90.
    const r = makeRecipient(1000, 1960, 0, 15);
    const finalDate = deathDateAtAge(r, 90);
    const nra = r.normalRetirementAge();

    // currentDate at NRA: Jan 2027.
    const currentAtNra = monthDate(2027, 0);
    // currentDate 3 years later: Jan 2030.
    const currentLater = monthDate(2030, 0);

    const npvAtNra = strategySumCentsSingle(r, finalDate, currentAtNra, 0, nra);
    const npvLater = strategySumCentsSingle(r, finalDate, currentLater, 0, nra);

    // Later currentDate clips 3 years of payments, so NPV should be lower.
    expect(npvLater).toBeLessThan(npvAtNra);
    // The difference should be approximately 36 months * $1000 = $36,000 = 3,600,000 cents.
    const diff = npvAtNra - npvLater;
    expect(diff).toBeGreaterThan(0);
    // At $1000/mo PIA at NRA, 36 months of clipped payments = $36,000 = 3,600,000 cents.
    expect(diff).toBe(36 * 1000 * 100);
  });

  it('NPV with currentDate before filing vs at filing', () => {
    // Born Jan 15, 1960. Filing at 70y0m (Jan 2030). Death at 90.
    const r = makeRecipient(1000, 1960, 0, 15);
    const finalDate = deathDateAtAge(r, 90);
    const age70 = ageDuration(70, 0);

    // currentDate well before filing.
    const currentBefore = monthDate(2025, 0);
    // currentDate at filing.
    const currentAtFiling = monthDate(2030, 0);

    const npvBefore = strategySumCentsSingle(
      r,
      finalDate,
      currentBefore,
      0,
      age70
    );
    const npvAtFiling = strategySumCentsSingle(
      r,
      finalDate,
      currentAtFiling,
      0,
      age70
    );

    // Both should be equal because no payments occur before the filing date.
    // The currentDate only clips payments that have already been collected.
    // Since all payments start at filing (age 70), moving currentDate from
    // before filing to exactly at filing should not clip any payments.
    expect(npvBefore).toBe(npvAtFiling);
  });

  it('NPV decreases monotonically as currentDate advances past filing', () => {
    // Born Jan 15, 1960. Filing at NRA (67y0m). Death at 85.
    const r = makeRecipient(1500, 1960, 0, 15);
    const finalDate = deathDateAtAge(r, 85);
    const nra = r.normalRetirementAge();

    const npvValues: number[] = [];
    // Test currentDate from Jan 2027 (NRA) to Jan 2035 (8 years later).
    for (let year = 2027; year <= 2035; year++) {
      const currentDate = monthDate(year, 0);
      const npv = strategySumCentsSingle(r, finalDate, currentDate, 0, nra);
      npvValues.push(npv);
    }

    // Each successive NPV should be less than or equal to the previous.
    for (let i = 1; i < npvValues.length; i++) {
      expect(npvValues[i]).toBeLessThanOrEqual(npvValues[i - 1]);
    }
    // Last value should be strictly less than first.
    expect(npvValues[npvValues.length - 1]).toBeLessThan(npvValues[0]);
  });
});

// ===========================================================================
// Group 9: currentDate exactly at filing date
// ===========================================================================
describe('currentDate exactly at filing date', () => {
  // Born Jan 2, 1960. SSA birth = Jan 1, 1960. NRA = 67y0m.
  // NRA date = Jan 1960 + 67y0m = Jan 2027.
  // earliestFilingMonth = 62y0m (born on 2nd).

  it('currentDate at NRA filing date: NPV includes all payments', () => {
    const r = makeRecipient(1000, 1960, 0, 2);
    const finalDate = deathDateAtAge(r, 80);
    const nra = r.normalRetirementAge(); // 67y0m

    // currentDate = Jan 2027 = NRA date
    const currentAtNra = monthDate(2027, 0);
    const npvAtNra = strategySumCentsSingle(r, finalDate, currentAtNra, 0, nra);

    // All payments from NRA to death should be included, so NPV > 0
    expect(npvAtNra).toBeGreaterThan(0);

    // NRA date = Jan 2027. Death = Dec 2040 (deathDateAtAge adjusts to Dec).
    // Months from Jan 2027 to Dec 2040 inclusive = 168 months at $1000/mo.
    const expectedCents = 168 * 1000 * 100;
    expect(npvAtNra).toBe(expectedCents);
  });

  it('currentDate 1 month before NRA: NPV same at 0% discount', () => {
    const r = makeRecipient(1000, 1960, 0, 2);
    const finalDate = deathDateAtAge(r, 80);
    const nra = r.normalRetirementAge(); // 67y0m

    // currentDate = Jan 2027 = NRA date
    const currentAtNra = monthDate(2027, 0);
    // currentDate = Dec 2026 = 1 month before NRA
    const currentBefore = monthDate(2026, 11);

    const npvAtNra = strategySumCentsSingle(r, finalDate, currentAtNra, 0, nra);
    const npvBefore = strategySumCentsSingle(
      r,
      finalDate,
      currentBefore,
      0,
      nra
    );

    // At 0% discount, moving currentDate from before filing to at filing
    // should not change NPV since no payments are clipped.
    expect(npvBefore).toBe(npvAtNra);
  });
});

// ===========================================================================
// Group 10: currentDate sweep - NPV monotonically decreasing
// ===========================================================================
describe('currentDate sweep - NPV monotonically decreasing', () => {
  it('NPV decreases by exactly PIA_cents each month at 0% discount', () => {
    // Born Jan 2, 1960. SSA birth = Jan 1, 1960. NRA = 67y0m = Jan 2027.
    // File at NRA. Die at 80 (Dec 2039 per deathDateAtAge convention).
    const r = makeRecipient(1000, 1960, 0, 2);
    const finalDate = deathDateAtAge(r, 80);
    const nra = r.normalRetirementAge();
    const piaCents = r.pia().primaryInsuranceAmount().cents(); // 100000

    // Sweep from Jan 2027 (NRA) to Dec 2039 (just before death boundary).
    // Each month past filing clips one more $1000 payment.
    const startYear = 2027;
    const startMonth = 0;
    const endYear = 2040;
    const endMonth = 11;

    let prevNpv: number | null = null;
    for (let y = startYear; y <= endYear; y++) {
      const mStart = y === startYear ? startMonth : 0;
      const mEnd = y === endYear ? endMonth : 11;
      for (let m = mStart; m <= mEnd; m++) {
        const currentDate = monthDate(y, m);
        const npv = strategySumCentsSingle(r, finalDate, currentDate, 0, nra);

        if (prevNpv !== null) {
          // NPV should decrease by exactly PIA each month (one payment clipped)
          expect(prevNpv - npv).toBe(piaCents);
        }
        prevNpv = npv;
      }
    }
  });
});

// ===========================================================================
// Group 11: currentDate far in future
// ===========================================================================
describe('currentDate far in future', () => {
  it('single: NPV is 0 when currentDate is year 2100', () => {
    // Born 1960, all payments are long past by 2100.
    const r = makeRecipient(1500, 1960, 0, 2);
    const finalDate = deathDateAtAge(r, 90);
    const nra = r.normalRetirementAge();
    const currentDate = monthDate(2100, 0);

    const npv = strategySumCentsSingle(r, finalDate, currentDate, 0, nra);
    expect(npv).toBe(0);
  });

  it('couple: NPV is 0 when currentDate is year 2100', () => {
    const r1 = makeRecipient(2000, 1960, 0, 2);
    const r2 = makeRecipient(500, 1960, 0, 2);
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r1, 85),
      deathDateAtAge(r2, 90),
    ];
    const currentDate = monthDate(2100, 0);
    const strats: [MonthDuration, MonthDuration] = [
      ageDuration(67, 0),
      ageDuration(67, 0),
    ];

    const npv = strategySumCentsCouple(
      [r1, r2],
      finalDates,
      currentDate,
      0,
      strats
    );
    expect(npv).toBe(0);
  });
});

// ===========================================================================
// Group 12: Retroactive filing at 6-month boundary
// ===========================================================================
describe('Retroactive filing at 6-month boundary', () => {
  // Born Jan 2, 1960. SSA birth = Jan 1, 1960. NRA = 67y0m = Jan 2027.

  it('currentDate Jul 2027 (NRA+6m): earliest is NRA (67y0m)', () => {
    // currentAge = Jul 2027 - Jan 1960 = 67y6m
    // NRA = 67y0m. 67y0m > 62y0m, and NRA <= currentAge.
    // So earliestMonth = NRA = 67y0m.
    // sixMonthsAgo = 67y0m. 67y0m < 67y0m? No. So earliest = 67y0m.
    const r = makeRecipient(1000, 1960, 0, 2);
    const currentDate = monthDate(2027, 6); // Jul 2027
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(67, 0).asMonths());
  });

  it('currentDate Aug 2027 (NRA+7m): earliest is 67y1m (6-month limit)', () => {
    // currentAge = Aug 2027 - Jan 1960 = 67y7m
    // NRA = 67y0m. 67y0m > 62y0m, and NRA <= currentAge.
    // So earliestMonth = NRA = 67y0m.
    // sixMonthsAgo = 67y1m. 67y0m < 67y1m? Yes. So earliest = 67y1m.
    const r = makeRecipient(1000, 1960, 0, 2);
    const currentDate = monthDate(2027, 7); // Aug 2027
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(67, 1).asMonths());
  });
});

// ===========================================================================
// Group 13: Effect of currentDate on optimal
// ===========================================================================
describe('Effect of currentDate on optimal', () => {
  it('unconstrained currentDate vs constrained at age 66: optimal differs', () => {
    // Born Jan 2, 1960. NRA = 67y0m. PIA = $1000. Death at 90.
    // With unconstrained currentDate (far past), full 62-70 window is available.
    // For death at 90 and 0% discount, optimal should be 70y0m (delay pays).
    const r = makeRecipient(1000, 1960, 0, 2);
    const finalDate = deathDateAtAge(r, 90);

    const farPast = monthDate(200, 0);
    const [optUnconstrained] = optimalStrategySingle(r, finalDate, farPast, 0);
    expect(optUnconstrained.asMonths()).toBe(ageDuration(70, 0).asMonths());

    // With currentDate at age 66 (Jan 2026), the recipient is past 62 but
    // before NRA. earliestFiling = currentAge = 66y0m.
    const currentAt66 = monthDate(2026, 0);
    const [optConstrained] = optimalStrategySingle(
      r,
      finalDate,
      currentAt66,
      0
    );
    // Constrained window is 66y0m to 70y0m. The optimal should still be 70y0m
    // for death at 90 since later filing is better with long life.
    expect(optConstrained.asMonths()).toBeGreaterThanOrEqual(
      ageDuration(66, 0).asMonths()
    );
    expect(optConstrained.asMonths()).toBeLessThanOrEqual(
      ageDuration(70, 0).asMonths()
    );
  });

  it('constrained at age 69y8m vs unconstrained: different optimal for short life', () => {
    // Born Jan 2, 1960. PIA = $1000. Death at 73 (short life).
    // With unconstrained currentDate, optimal for short life should be early filing.
    const r = makeRecipient(1000, 1960, 0, 2);
    const finalDate = deathDateAtAge(r, 73);

    const farPast = monthDate(200, 0);
    const [optUnconstrained] = optimalStrategySingle(r, finalDate, farPast, 0);

    // With currentDate at age 69y8m (Sep 2029), the window is 69y2m to 70y0m.
    // This is a narrow window that excludes the early filing option.
    const currentDate = monthDate(2029, 8); // Sep 2029 -> age 69y8m
    const earliest = earliestFiling(r, currentDate);
    expect(earliest.asMonths()).toBe(ageDuration(69, 2).asMonths());

    const [optConstrained] = optimalStrategySingle(
      r,
      finalDate,
      currentDate,
      0
    );

    // For short life, unconstrained optimal would be early filing (62y0m).
    // The constrained optimal must be >= 69y2m, so they differ.
    expect(optUnconstrained.asMonths()).toBeLessThan(optConstrained.asMonths());
  });
});
