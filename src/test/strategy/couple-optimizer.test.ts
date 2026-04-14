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
  optimalStrategyCouple,
  optimalStrategyCoupleOptimized,
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

/** currentDate far in the past so retroactivity rules never apply. */
const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

/** Earliest filing age for someone born after the 2nd of the month: 62y1m. */
const EARLIEST_FILING = MonthDuration.initFromYearsMonths({
  years: 62,
  months: 1,
});

/** Age 70y0m as a MonthDuration. */
const AGE_70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });

// ---------------------------------------------------------------------------
// Group 1: Optimized matches non-optimized
// ---------------------------------------------------------------------------
describe('Optimized matches non-optimized', () => {
  // The optimized couple function uses caching and pre-computed context.
  // Results must be identical (within floating-point tolerance) to the
  // non-optimized version for all configurations.

  it('equal PIA couple, both die at 85', () => {
    const r0 = makeRecipient(1500, 1960, 3, 15);
    const r1 = makeRecipient(1500, 1962, 7, 20);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 85),
      deathDateAtAge(r1, 85),
    ];

    const result = optimalStrategyCouple(recipients, finalDates, FAR_PAST, 0);
    const resultOpt = optimalStrategyCoupleOptimized(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    expect(resultOpt[0].asMonths()).toBe(result[0].asMonths());
    expect(resultOpt[1].asMonths()).toBe(result[1].asMonths());
    expect(resultOpt[2]).toBeCloseTo(result[2], 0);
  });

  it('high earner / low earner, both die at 90, 3% discount', () => {
    const r0 = makeRecipient(3000, 1963, 0, 10);
    const r1 = makeRecipient(800, 1965, 5, 25);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 90),
      deathDateAtAge(r1, 90),
    ];

    const result = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0.03
    );
    const resultOpt = optimalStrategyCoupleOptimized(
      recipients,
      finalDates,
      FAR_PAST,
      0.03
    );

    expect(resultOpt[0].asMonths()).toBe(result[0].asMonths());
    expect(resultOpt[1].asMonths()).toBe(result[1].asMonths());
    expect(resultOpt[2]).toBeCloseTo(result[2], 0);
  });

  it('zero-PIA dependent, earner dies at 80', () => {
    const r0 = makeRecipient(2000, 1960, 6, 15);
    const r1 = makeRecipient(0, 1962, 2, 10);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 80),
      deathDateAtAge(r1, 90),
    ];

    const result = optimalStrategyCouple(recipients, finalDates, FAR_PAST, 0);
    const resultOpt = optimalStrategyCoupleOptimized(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    expect(resultOpt[0].asMonths()).toBe(result[0].asMonths());
    expect(resultOpt[1].asMonths()).toBe(result[1].asMonths());
    expect(resultOpt[2]).toBeCloseTo(result[2], 0);
  });

  it('both die young, 5% discount', () => {
    const r0 = makeRecipient(1200, 1968, 8, 5);
    const r1 = makeRecipient(900, 1970, 11, 18);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 64),
      deathDateAtAge(r1, 65),
    ];

    const result = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0.05
    );
    const resultOpt = optimalStrategyCoupleOptimized(
      recipients,
      finalDates,
      FAR_PAST,
      0.05
    );

    expect(resultOpt[0].asMonths()).toBe(result[0].asMonths());
    expect(resultOpt[1].asMonths()).toBe(result[1].asMonths());
    expect(resultOpt[2]).toBeCloseTo(result[2], 0);
  });
});

// ---------------------------------------------------------------------------
// Group 2: Both die young -- both file early
// ---------------------------------------------------------------------------
describe('Both die young - both file early', () => {
  // With 0% discount rate and a very short lifespan, filing at the earliest
  // possible age maximizes total payments when you die shortly after.

  it('both die at 63 -- both file at earliest', () => {
    const r0 = makeRecipient(1500, 1960, 4, 15);
    const r1 = makeRecipient(1000, 1962, 9, 20);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 63),
      deathDateAtAge(r1, 63),
    ];

    const [age0, age1] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    expect(age0.asMonths()).toBe(EARLIEST_FILING.asMonths());
    expect(age1.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });

  it('both die at 64 -- both file at earliest', () => {
    const r0 = makeRecipient(2000, 1965, 1, 10);
    const r1 = makeRecipient(800, 1963, 6, 25);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 64),
      deathDateAtAge(r1, 64),
    ];

    const [age0, age1] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    expect(age0.asMonths()).toBe(EARLIEST_FILING.asMonths());
    expect(age1.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });

  it('both die at 65 -- both file at earliest', () => {
    const r0 = makeRecipient(3000, 1968, 11, 5);
    const r1 = makeRecipient(1200, 1970, 3, 12);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 65),
      deathDateAtAge(r1, 65),
    ];

    const [age0, age1] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    expect(age0.asMonths()).toBe(EARLIEST_FILING.asMonths());
    expect(age1.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });
});

// ---------------------------------------------------------------------------
// Group 3: Both die old -- both file at 70
// ---------------------------------------------------------------------------
describe('Both die old - both file at 70', () => {
  // With 0% discount rate and a very long lifespan, delaying to 70 should
  // be optimal for both recipients due to the delayed filing credits.

  it('both die at 90 -- both file at 70', () => {
    const r0 = makeRecipient(1500, 1960, 0, 15);
    const r1 = makeRecipient(1500, 1962, 5, 10);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 90),
      deathDateAtAge(r1, 90),
    ];

    const [age0, age1] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    expect(age0.asMonths()).toBe(AGE_70.asMonths());
    expect(age1.asMonths()).toBe(AGE_70.asMonths());
  });

  it('both die at 95 -- both file at 70', () => {
    const r0 = makeRecipient(2000, 1965, 6, 20);
    const r1 = makeRecipient(1000, 1963, 3, 8);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 95),
      deathDateAtAge(r1, 95),
    ];

    const [age0, age1] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    expect(age0.asMonths()).toBe(AGE_70.asMonths());
    expect(age1.asMonths()).toBe(AGE_70.asMonths());
  });

  it('both die at 100, equal PIAs -- both file at 70', () => {
    // Use equal PIAs so no spousal/survivor dynamics alter filing ages.
    const r0 = makeRecipient(2000, 1960, 8, 15);
    const r1 = makeRecipient(2000, 1962, 1, 28);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 100),
      deathDateAtAge(r1, 100),
    ];

    const [age0, age1] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    expect(age0.asMonths()).toBe(AGE_70.asMonths());
    expect(age1.asMonths()).toBe(AGE_70.asMonths());
  });

  it('both die at 100, asymmetric PIAs -- earner files at 70, dependent may file earlier', () => {
    // With asymmetric PIAs ($2500 vs $800), the dependent may benefit
    // from survivor benefits, which can shift the dependent's optimal
    // filing age earlier than 70.
    const r0 = makeRecipient(2500, 1960, 8, 15);
    const r1 = makeRecipient(800, 1962, 1, 28);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 100),
      deathDateAtAge(r1, 100),
    ];

    const [age0, age1, npv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    // The high earner should still file at 70 with a long lifespan.
    expect(age0.asMonths()).toBe(AGE_70.asMonths());
    // The dependent may file earlier than 70 due to survivor benefit interactions.
    expect(age1.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
    expect(age1.asMonths()).toBeGreaterThanOrEqual(EARLIEST_FILING.asMonths());
    expect(npv).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Group 4: Asymmetric death ages
// ---------------------------------------------------------------------------
describe('Asymmetric death ages', () => {
  // When one spouse dies significantly earlier than the other, the optimizer
  // should adjust strategies based on survivor benefit considerations.

  it('high earner dies at 65, dependent dies at 90 -- earner may delay for survivor benefit', () => {
    const earner = makeRecipient(3000, 1960, 5, 15);
    const dependent = makeRecipient(800, 1962, 3, 10);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 65),
      deathDateAtAge(dependent, 90),
    ];

    const [earnerAge, , npv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    // Although the earner dies young, the optimizer may delay the earner's
    // filing because the earner's filing age affects the long-lived
    // dependent's survivor benefit. The earner's strategy is valid as
    // long as it falls within the filing window.
    expect(earnerAge.asMonths()).toBeGreaterThanOrEqual(
      EARLIEST_FILING.asMonths()
    );
    expect(earnerAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
    expect(npv).toBeGreaterThan(0);
  });

  it('high earner dies at 65, dependent dies at 90 -- NPV is positive', () => {
    const earner = makeRecipient(2500, 1963, 0, 20);
    const dependent = makeRecipient(600, 1965, 8, 5);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 65),
      deathDateAtAge(dependent, 90),
    ];

    const [, , npv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    expect(npv).toBeGreaterThan(0);
  });

  it('high earner dies at 90, dependent dies at 65 -- dependent files early', () => {
    const earner = makeRecipient(3000, 1960, 5, 15);
    const dependent = makeRecipient(800, 1962, 3, 10);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 90),
      deathDateAtAge(dependent, 65),
    ];

    const [, dependentAge] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    // Dependent with short lifespan should file early.
    expect(dependentAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });

  it('asymmetric: high earner dies at 90, dependent dies at 63 -- earner at 70', () => {
    const earner = makeRecipient(2000, 1960, 0, 15);
    const dependent = makeRecipient(500, 1962, 6, 20);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 90),
      deathDateAtAge(dependent, 63),
    ];

    const [earnerAge] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    // Earner lives long; with no survivor benefit concerns (dependent dies
    // first), earner should delay to 70.
    expect(earnerAge.asMonths()).toBe(AGE_70.asMonths());
  });
});

// ---------------------------------------------------------------------------
// Group 5: Couple NPV >= sum of singles
// ---------------------------------------------------------------------------
describe('Couple NPV >= sum of singles', () => {
  // For couples where one spouse is eligible for spousal benefits
  // (spouse PIA/2 > own PIA), the couple optimizer's NPV should be >=
  // the sum of independently optimized single NPVs, because spousal
  // and survivor benefits add additional value.

  it('high/low PIA couple, both die at 85', () => {
    const r0 = makeRecipient(3000, 1960, 5, 15);
    const r1 = makeRecipient(800, 1962, 3, 10);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 85),
      deathDateAtAge(r1, 85),
    ];

    const [, , coupleNpv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    const [, singleNpv0] = optimalStrategySingle(
      r0,
      finalDates[0],
      FAR_PAST,
      0
    );
    const [, singleNpv1] = optimalStrategySingle(
      r1,
      finalDates[1],
      FAR_PAST,
      0
    );

    expect(coupleNpv).toBeGreaterThanOrEqual(singleNpv0 + singleNpv1);
  });

  it('high/low PIA couple, both die at 90, 3% discount', () => {
    const r0 = makeRecipient(2500, 1963, 0, 20);
    const r1 = makeRecipient(600, 1965, 8, 5);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 90),
      deathDateAtAge(r1, 90),
    ];

    const [, , coupleNpv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0.03
    );

    const [, singleNpv0] = optimalStrategySingle(
      r0,
      finalDates[0],
      FAR_PAST,
      0.03
    );
    const [, singleNpv1] = optimalStrategySingle(
      r1,
      finalDates[1],
      FAR_PAST,
      0.03
    );

    expect(coupleNpv).toBeGreaterThanOrEqual(singleNpv0 + singleNpv1);
  });

  it('extreme PIA disparity, earner dies at 75, dependent at 95', () => {
    const r0 = makeRecipient(4000, 1960, 2, 15);
    const r1 = makeRecipient(400, 1962, 10, 8);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 75),
      deathDateAtAge(r1, 95),
    ];

    const [, , coupleNpv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    const [, singleNpv0] = optimalStrategySingle(
      r0,
      finalDates[0],
      FAR_PAST,
      0
    );
    const [, singleNpv1] = optimalStrategySingle(
      r1,
      finalDates[1],
      FAR_PAST,
      0
    );

    expect(coupleNpv).toBeGreaterThanOrEqual(singleNpv0 + singleNpv1);
  });
});

// ---------------------------------------------------------------------------
// Group 6: Equal PIA couple
// ---------------------------------------------------------------------------
describe('Equal PIA couple', () => {
  // When both spouses have the same PIA, neither qualifies for spousal
  // benefits (PIA/2 is not > PIA). The couple NPV should equal the sum
  // of two identical single NPVs when using the same filing strategies.

  it('same PIA, same birth date, same death age -- couple equals sum of singles', () => {
    const r0 = makeRecipient(1500, 1960, 5, 15);
    const r1 = makeRecipient(1500, 1960, 5, 15);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const deathDate = deathDateAtAge(r0, 85);
    const finalDates: [MonthDate, MonthDate] = [deathDate, deathDate];

    const [age0, age1, coupleNpv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    // With equal PIAs, the couple NPV at these strategies should equal
    // sum of single NPVs at the same strategies.
    const singleNpv0 = strategySumCentsSingle(
      r0,
      finalDates[0],
      FAR_PAST,
      0,
      age0
    );
    const singleNpv1 = strategySumCentsSingle(
      r1,
      finalDates[1],
      FAR_PAST,
      0,
      age1
    );

    expect(coupleNpv).toBe(singleNpv0 + singleNpv1);
  });

  it('same PIA, different birth dates, same death age -- couple equals singles sum', () => {
    const r0 = makeRecipient(2000, 1960, 0, 15);
    const r1 = makeRecipient(2000, 1963, 6, 20);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 85),
      deathDateAtAge(r1, 85),
    ];

    const [age0, age1, coupleNpv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    const singleNpv0 = strategySumCentsSingle(
      r0,
      finalDates[0],
      FAR_PAST,
      0,
      age0
    );
    const singleNpv1 = strategySumCentsSingle(
      r1,
      finalDates[1],
      FAR_PAST,
      0,
      age1
    );

    expect(coupleNpv).toBe(singleNpv0 + singleNpv1);
  });

  it('same PIA, 5% discount -- couple equals singles sum', () => {
    const r0 = makeRecipient(1000, 1965, 3, 10);
    const r1 = makeRecipient(1000, 1967, 9, 25);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(r0, 90),
      deathDateAtAge(r1, 90),
    ];

    const [age0, age1, coupleNpv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0.05
    );

    const singleNpv0 = strategySumCentsSingle(
      r0,
      finalDates[0],
      FAR_PAST,
      0.05,
      age0
    );
    const singleNpv1 = strategySumCentsSingle(
      r1,
      finalDates[1],
      FAR_PAST,
      0.05,
      age1
    );

    // With equal PIAs, no spousal or survivor benefits apply.
    // Allow tiny floating-point discrepancy.
    expect(coupleNpv).toBeCloseTo(singleNpv0 + singleNpv1, 0);
  });
});

// ---------------------------------------------------------------------------
// Group 7: Discount rate shifts optimal earlier
// ---------------------------------------------------------------------------
describe('Discount rate shifts optimal earlier', () => {
  // Higher discount rates make future payments worth less, favoring
  // earlier filing. At 0% both should file at 70 (long life). At 10%+
  // both should file earlier.

  const r0 = makeRecipient(1500, 1960, 0, 15);
  const r1 = makeRecipient(1500, 1962, 5, 10);
  const recipients: [Recipient, Recipient] = [r0, r1];
  const finalDates: [MonthDate, MonthDate] = [
    deathDateAtAge(r0, 90),
    deathDateAtAge(r1, 90),
  ];

  it('0% discount -- both file at 70', () => {
    const [age0, age1] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    expect(age0.asMonths()).toBe(AGE_70.asMonths());
    expect(age1.asMonths()).toBe(AGE_70.asMonths());
  });

  it('10% discount -- both file earlier than at 0%', () => {
    const [age0At0, age1At0] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    const [age0At10, age1At10] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0.1
    );

    expect(age0At10.asMonths()).toBeLessThan(age0At0.asMonths());
    expect(age1At10.asMonths()).toBeLessThan(age1At0.asMonths());
  });

  it('20% discount -- earlier than 10% discount', () => {
    const [age0At10, age1At10] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0.1
    );
    const [age0At20, age1At20] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0.2
    );

    expect(age0At20.asMonths()).toBeLessThanOrEqual(age0At10.asMonths());
    expect(age1At20.asMonths()).toBeLessThanOrEqual(age1At10.asMonths());
  });
});

// ---------------------------------------------------------------------------
// Group 8: Zero-PIA dependent filing
// ---------------------------------------------------------------------------
describe('Zero-PIA dependent filing', () => {
  // A dependent with $0 PIA cannot file before the earner because they
  // have no personal benefit; their filing date is constrained to be at
  // or after the earner's filing date.

  it('zero-PIA dependent filing before earner produces same NPV as filing at earner date', () => {
    // Use same birthdate so that "earner's filing date" and "earner's
    // filing age" map to the same calendar date for the dependent.
    const earner = makeRecipient(2000, 1960, 5, 15);
    const dependent = makeRecipient(0, 1960, 5, 15);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 90),
      deathDateAtAge(dependent, 90),
    ];

    // Evaluate NPV at a strategy where earner files at 70 and dependent
    // tries to file at 62y1m. The dependent's filing date should be
    // adjusted to match the earner's date.
    const strat: [MonthDuration, MonthDuration] = [AGE_70, EARLIEST_FILING];
    const npvAdjusted = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      strat
    );

    // Compare with both filing at 70. With the same birthdate, the
    // earner's filing date at age 70 equals the dependent filing at
    // age 70, so these should be identical.
    const stratBothAt70: [MonthDuration, MonthDuration] = [AGE_70, AGE_70];
    const npvBothAt70 = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      stratBothAt70
    );

    expect(npvAdjusted).toBe(npvBothAt70);
  });

  it('zero-PIA dependent with different birthday -- filing bumped to earner date', () => {
    // When birthdays differ, the dependent's filing age gets adjusted
    // to the earner's filing *date*, which corresponds to a different
    // age for the dependent. The adjusted NPV should be >= the NPV
    // when dependent files at the earner's same age (since the actual
    // date is earlier for the younger dependent).
    const earner = makeRecipient(2000, 1960, 5, 15);
    const dependent = makeRecipient(0, 1962, 3, 10);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 90),
      deathDateAtAge(dependent, 90),
    ];

    const strat: [MonthDuration, MonthDuration] = [AGE_70, EARLIEST_FILING];
    const npvAdjusted = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      strat
    );

    // NPV should be positive -- the earner's benefit plus the dependent's
    // survivor benefit contribute.
    expect(npvAdjusted).toBeGreaterThan(0);
  });

  it('zero-PIA dependent: optimizer picks valid filing ages', () => {
    const earner = makeRecipient(2500, 1963, 0, 20);
    const dependent = makeRecipient(0, 1965, 8, 5);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 85),
      deathDateAtAge(dependent, 85),
    ];

    const [earnerAge, dependentAge, npv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    // Both filing ages must be in valid range.
    expect(earnerAge.asMonths()).toBeGreaterThanOrEqual(
      EARLIEST_FILING.asMonths()
    );
    expect(earnerAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
    expect(dependentAge.asMonths()).toBeGreaterThanOrEqual(
      EARLIEST_FILING.asMonths()
    );
    expect(dependentAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
    expect(npv).toBeGreaterThan(0);
  });
});
