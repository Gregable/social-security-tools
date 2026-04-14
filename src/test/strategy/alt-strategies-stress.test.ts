import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  optimalStrategySingle,
  strategySumCentsSingle,
} from '$lib/strategy/calculations';
import {
  type AlternativeResult,
  calculateAlternativeStrategies,
  getStrategyColor,
  type YearGroup,
} from '$lib/strategy/calculations/alternative-strategies';

/**
 * Helper: create a Recipient with a given birthdate and PIA.
 */
function createRecipient(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  piaAmount: number
): Recipient {
  const recipient = new Recipient();
  recipient.birthdate = Birthdate.FromYMD(birthYear, birthMonth, birthDay);
  recipient.setPia(Money.from(piaAmount));
  return recipient;
}

/**
 * Helper: flatten all non-placeholder results from year groups.
 */
function flatResults(groups: YearGroup[]): AlternativeResult[] {
  return groups.flatMap((g) => g.results).filter((r) => !r.isPlaceholder);
}

/**
 * Helper: flatten ALL results (including placeholders) from year groups.
 */
function allResults(groups: YearGroup[]): AlternativeResult[] {
  return groups.flatMap((g) => g.results);
}

// ---------------------------------------------------------------------------
// 1. Alternative strategies cover full filing range
// ---------------------------------------------------------------------------
describe('Alternative strategies cover full filing range', () => {
  it('covers 62y0m to 70y0m for a born-on-2nd recipient', () => {
    // Born on the 2nd: earliest filing is 62y0m (no extra month needed).
    const recipient = createRecipient(2000, 0, 2, 2000);
    const deathAge = new MonthDuration(85 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      0
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    const results = allResults(groups);
    const earliest = recipient.birthdate.earliestFilingMonth().asMonths();
    const latest = 70 * 12;
    const expectedCount = latest - earliest + 1;
    expect(results.length).toBe(expectedCount);
  });

  it('covers 62y1m to 70y0m for a mid-month birthday recipient', () => {
    // Born on the 15th: earliest filing is 62y1m.
    const recipient = createRecipient(2000, 5, 15, 1500);
    const deathAge = new MonthDuration(90 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      0
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    // Should include "Not yet eligible" placeholders for months before 62y1m
    // plus actual results through 70y0m.
    const earliest = recipient.birthdate.earliestFilingMonth().asMonths();
    const latest = 70 * 12;
    const expectedRealCount = latest - earliest + 1;
    const _nonPlaceholderOrEligPlaceholder = allResults(groups).filter(
      (r) => !r.isPlaceholder || r.placeholderReason === 'Not yet eligible'
    );
    // Real results count
    const real = flatResults(groups);
    expect(real.length).toBe(expectedRealCount);
  });

  it('truncates at death age when death occurs before 70', () => {
    const recipient = createRecipient(2000, 0, 2, 2000);
    const deathAge = new MonthDuration(66 * 12 + 6);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      0
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    const results = allResults(groups);
    const earliest = recipient.birthdate.earliestFilingMonth().asMonths();
    const expectedCount = deathAge.asMonths() - earliest + 1;
    expect(results.length).toBe(expectedCount);

    // No filing age should exceed death age.
    for (const r of results) {
      expect(r.filingAge.asMonths()).toBeLessThanOrEqual(deathAge.asMonths());
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Optimal strategy is marked correctly
// ---------------------------------------------------------------------------
describe('Optimal strategy is marked correctly', () => {
  it('marks exactly one result as optimal for a typical recipient', () => {
    const recipient = createRecipient(2000, 0, 2, 2500);
    const deathAge = new MonthDuration(85 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      0
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    const real = flatResults(groups);
    const optimals = real.filter((r) => r.isOptimal);
    expect(optimals.length).toBe(1);
  });

  it('optimal result has the highest NPV among all results', () => {
    const recipient = createRecipient(2000, 3, 2, 1800);
    const deathAge = new MonthDuration(82 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      0
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    const real = flatResults(groups);
    const optimal = real.find((r) => r.isOptimal);
    expect(optimal).toBeDefined();

    for (const r of real) {
      expect(r.npv.cents()).toBeLessThanOrEqual(optimal!.npv.cents());
    }
  });

  it('optimal result has the highest NPV with a discount rate', () => {
    const recipient = createRecipient(2000, 6, 2, 2200);
    const deathAge = new MonthDuration(88 * 12);
    const discountRate = 0.03;
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      discountRate
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      discountRate,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    const real = flatResults(groups);
    const optimal = real.find((r) => r.isOptimal);
    expect(optimal).toBeDefined();

    for (const r of real) {
      expect(r.npv.cents()).toBeLessThanOrEqual(optimal!.npv.cents());
    }
  });
});

// ---------------------------------------------------------------------------
// 3. percentOfOptimal is correct
// ---------------------------------------------------------------------------
describe('percentOfOptimal is correct', () => {
  function setupScenario(
    birthYear: number,
    birthMonth: number,
    birthDay: number,
    pia: number,
    deathYears: number,
    discountRate: number
  ) {
    const recipient = createRecipient(birthYear, birthMonth, birthDay, pia);
    const deathAge = new MonthDuration(deathYears * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });
    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      discountRate
    );
    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      discountRate,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );
    return { groups, optCents };
  }

  it('percentOfOptimal equals npv/optimalNPV*100 for each result (no discount)', () => {
    const { groups, optCents } = setupScenario(2000, 0, 2, 2000, 85, 0);
    const real = flatResults(groups);

    for (const r of real) {
      const expected = (r.npv.cents() / optCents) * 100;
      expect(r.percentOfOptimal).toBeCloseTo(expected, 5);
    }
  });

  it('percentOfOptimal equals npv/optimalNPV*100 for each result (3% discount)', () => {
    const { groups, optCents } = setupScenario(2000, 0, 2, 2000, 85, 0.03);
    const real = flatResults(groups);

    for (const r of real) {
      const expected = (r.npv.cents() / optCents) * 100;
      expect(r.percentOfOptimal).toBeCloseTo(expected, 5);
    }
  });

  it('optimal result has ~100% percentOfOptimal', () => {
    const { groups } = setupScenario(2000, 5, 15, 1500, 90, 0);
    const real = flatResults(groups);
    const optimal = real.find((r) => r.isOptimal);
    expect(optimal).toBeDefined();
    expect(optimal!.percentOfOptimal).toBeCloseTo(100, 0);
  });
});

// ---------------------------------------------------------------------------
// 4. Alternative strategies agree with strategySumCentsSingle
// ---------------------------------------------------------------------------
describe('Alternative strategies agree with strategySumCentsSingle', () => {
  function verifyAgreement(
    birthYear: number,
    birthMonth: number,
    birthDay: number,
    pia: number,
    deathYears: number,
    discountRate: number,
    checkFilingAgeMonths: number
  ) {
    const recipient = createRecipient(birthYear, birthMonth, birthDay, pia);
    const deathAge = new MonthDuration(deathYears * 12);
    const finalDate = recipient.birthdate.dateAtLayAge(deathAge);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      finalDate,
      currentDate,
      discountRate
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      discountRate,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    const real = flatResults(groups);
    const target = real.find(
      (r) => r.filingAge.asMonths() === checkFilingAgeMonths
    );
    expect(target).toBeDefined();

    const directCents = strategySumCentsSingle(
      recipient,
      finalDate,
      currentDate,
      discountRate,
      new MonthDuration(checkFilingAgeMonths)
    );

    expect(target!.npv.cents()).toBe(directCents);
  }

  it('agrees at filing age 62y0m', () => {
    verifyAgreement(2000, 0, 2, 2000, 85, 0, 62 * 12);
  });

  it('agrees at filing age 67y0m with discount rate', () => {
    verifyAgreement(2000, 0, 2, 2000, 85, 0.03, 67 * 12);
  });

  it('agrees at filing age 70y0m', () => {
    verifyAgreement(2000, 0, 2, 1800, 90, 0, 70 * 12);
  });
});

// ---------------------------------------------------------------------------
// 5. Optimal from alternatives matches optimalStrategySingle
// ---------------------------------------------------------------------------
describe('Optimal from alternatives matches optimalStrategySingle', () => {
  function verifyOptimalMatch(
    birthYear: number,
    birthMonth: number,
    birthDay: number,
    pia: number,
    deathYears: number,
    discountRate: number
  ) {
    const recipient = createRecipient(birthYear, birthMonth, birthDay, pia);
    const deathAge = new MonthDuration(deathYears * 12);
    const finalDate = recipient.birthdate.dateAtLayAge(deathAge);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      finalDate,
      currentDate,
      discountRate
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      discountRate,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    const real = flatResults(groups);
    const optimal = real.find((r) => r.isOptimal);
    expect(optimal).toBeDefined();
    expect(optimal!.filingAge.asMonths()).toBe(optAge.asMonths());
  }

  it('matches for death at 85 with no discount', () => {
    verifyOptimalMatch(2000, 0, 2, 2000, 85, 0);
  });

  it('matches for death at 75 with 3% discount', () => {
    verifyOptimalMatch(2000, 0, 2, 2000, 75, 0.03);
  });

  it('matches for death at 95 with no discount', () => {
    verifyOptimalMatch(2000, 6, 2, 1200, 95, 0);
  });
});

// ---------------------------------------------------------------------------
// 6. Color coding thresholds
// ---------------------------------------------------------------------------
describe('Color coding thresholds', () => {
  it('returns dark green for optimal (isOptimal=true)', () => {
    expect(getStrategyColor(100, true)).toBe('rgb(0, 100, 0)');
    // isOptimal flag should take precedence regardless of percentage.
    expect(getStrategyColor(70, true)).toBe('rgb(0, 100, 0)');
  });

  it('returns forest green for 99%+ (not flagged optimal)', () => {
    expect(getStrategyColor(99, false)).toBe('rgb(34, 139, 34)');
    expect(getStrategyColor(99.5, false)).toBe('rgb(34, 139, 34)');
    // 100% but not flagged as optimal uses the 99%+ bucket.
    expect(getStrategyColor(100, false)).toBe('rgb(34, 139, 34)');
  });

  it('returns lime green at exactly 95% and yellow-green at exactly 90%', () => {
    expect(getStrategyColor(95, false)).toBe('rgb(100, 170, 50)');
    expect(getStrategyColor(98.9, false)).toBe('rgb(100, 170, 50)');
    expect(getStrategyColor(90, false)).toBe('rgb(190, 210, 50)');
    expect(getStrategyColor(94.9, false)).toBe('rgb(190, 210, 50)');
  });

  it('returns correct colors at 85% and 80% boundaries', () => {
    // 85%+ -> gold
    expect(getStrategyColor(85, false)).toBe('rgb(255, 215, 0)');
    expect(getStrategyColor(89.9, false)).toBe('rgb(255, 215, 0)');
    // 80%+ -> orange
    expect(getStrategyColor(80, false)).toBe('rgb(255, 165, 0)');
    expect(getStrategyColor(84.9, false)).toBe('rgb(255, 165, 0)');
    // Below 80% -> red
    expect(getStrategyColor(79.9, false)).toBe('rgb(220, 20, 60)');
    expect(getStrategyColor(50, false)).toBe('rgb(220, 20, 60)');
    expect(getStrategyColor(0, false)).toBe('rgb(220, 20, 60)');
  });
});

// ---------------------------------------------------------------------------
// 7. Past filing ages are marked as placeholders
// ---------------------------------------------------------------------------
describe('Past filing ages are marked as placeholders', () => {
  it('marks all ages before current age as "Already passed"', () => {
    // Born Jan 2, 1960 => earliest filing 62y0m.
    // Current date: mid-2025 => recipient is ~65y6m.
    const recipient = createRecipient(1960, 0, 2, 2000);
    const deathAge = new MonthDuration(85 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2025,
      months: 6,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      0
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    const currentAgeMonths = recipient.birthdate
      .ageAtSsaDate(currentDate)
      .asMonths();

    const allR = allResults(groups);
    for (const r of allR) {
      if (r.filingAge.asMonths() < currentAgeMonths) {
        expect(r.isPlaceholder).toBe(true);
        expect(r.placeholderReason).toBe('Already passed');
        expect(r.npv.cents()).toBe(0);
      }
    }
  });

  it('does not mark future ages as "Already passed"', () => {
    const recipient = createRecipient(1960, 0, 2, 2000);
    const deathAge = new MonthDuration(85 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2025,
      months: 6,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      0
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    const currentAgeMonths = recipient.birthdate
      .ageAtSsaDate(currentDate)
      .asMonths();

    const real = flatResults(groups);
    for (const r of real) {
      expect(r.filingAge.asMonths()).toBeGreaterThanOrEqual(currentAgeMonths);
      expect(r.isPlaceholder).toBeFalsy();
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Results grouped by year
// ---------------------------------------------------------------------------
describe('Results grouped by year', () => {
  it('each group has the correct year and results within that year', () => {
    const recipient = createRecipient(2000, 0, 2, 2000);
    const deathAge = new MonthDuration(85 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      0
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    for (const group of groups) {
      for (const r of group.results) {
        expect(r.filingAge.years()).toBe(group.year);
      }
    }
  });

  it('groups are sorted by year in ascending order', () => {
    const recipient = createRecipient(2000, 3, 15, 1800);
    const deathAge = new MonthDuration(85 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      0
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    for (let i = 1; i < groups.length; i++) {
      expect(groups[i].year).toBeGreaterThan(groups[i - 1].year);
    }
  });
});

// ---------------------------------------------------------------------------
// 9. NPV monotonicity within alternative strategies
// ---------------------------------------------------------------------------
describe('NPV monotonicity within alternative strategies', () => {
  it('for long lifespan (90), later filing generally yields higher NPV', () => {
    // With a long lifespan and no discount, filing later should generally
    // produce higher NPV due to delayed retirement credits.
    const recipient = createRecipient(2000, 0, 2, 2000);
    const deathAge = new MonthDuration(90 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      0
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    const real = flatResults(groups);
    // Check broad monotonicity: NPV at age 70 should be higher than at age 62.
    const age62 = real.find((r) => r.filingAge.asMonths() === 62 * 12);
    const age70 = real.find((r) => r.filingAge.asMonths() === 70 * 12);
    expect(age62).toBeDefined();
    expect(age70).toBeDefined();
    expect(age70!.npv.cents()).toBeGreaterThan(age62!.npv.cents());
  });

  it('for short lifespan (64), earlier filing yields higher NPV', () => {
    // With a very short lifespan, earlier filing should be optimal because
    // there is little time to benefit from delayed retirement credits.
    const recipient = createRecipient(2000, 0, 2, 2000);
    const deathAge = new MonthDuration(64 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const [optAge, optCents] = optimalStrategySingle(
      recipient,
      recipient.birthdate.dateAtLayAge(deathAge),
      currentDate,
      0
    );

    const groups = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      Money.fromCents(optCents),
      optAge,
      currentDate
    );

    const real = flatResults(groups);
    // Filing at earliest age should yield more than the latest available age.
    const earliest = real[0];
    const latest = real[real.length - 1];
    expect(earliest.npv.cents()).toBeGreaterThan(latest.npv.cents());

    // Optimal should be the earliest filing age.
    const optimal = real.find((r) => r.isOptimal);
    expect(optimal).toBeDefined();
    expect(optimal!.filingAge.asMonths()).toBe(earliest.filingAge.asMonths());
  });
});
