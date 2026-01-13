import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  calculateAlternativeStrategies,
  formatFilingAgeDisplay,
  getStrategyColor,
} from '$lib/strategy/calculations/alternative-strategies';

describe('getStrategyColor', () => {
  it('returns dark green for optimal', () => {
    expect(getStrategyColor(100, true)).toBe('rgb(0, 100, 0)');
  });

  it('returns dark green for optimal even with lower percentage', () => {
    // The optimal flag takes precedence
    expect(getStrategyColor(50, true)).toBe('rgb(0, 100, 0)');
  });

  it('returns forest green for 99%+ non-optimal', () => {
    expect(getStrategyColor(99, false)).toBe('rgb(34, 139, 34)');
    expect(getStrategyColor(99.5, false)).toBe('rgb(34, 139, 34)');
    expect(getStrategyColor(100, false)).toBe('rgb(34, 139, 34)');
  });

  it('returns lime green for 95-99%', () => {
    expect(getStrategyColor(95, false)).toBe('rgb(100, 170, 50)');
    expect(getStrategyColor(97, false)).toBe('rgb(100, 170, 50)');
    expect(getStrategyColor(98.9, false)).toBe('rgb(100, 170, 50)');
  });

  it('returns yellow-green for 90-95%', () => {
    expect(getStrategyColor(90, false)).toBe('rgb(190, 210, 50)');
    expect(getStrategyColor(92, false)).toBe('rgb(190, 210, 50)');
    expect(getStrategyColor(94.9, false)).toBe('rgb(190, 210, 50)');
  });

  it('returns gold for 85-90%', () => {
    expect(getStrategyColor(85, false)).toBe('rgb(255, 215, 0)');
    expect(getStrategyColor(87, false)).toBe('rgb(255, 215, 0)');
    expect(getStrategyColor(89.9, false)).toBe('rgb(255, 215, 0)');
  });

  it('returns orange for 80-85%', () => {
    expect(getStrategyColor(80, false)).toBe('rgb(255, 165, 0)');
    expect(getStrategyColor(82, false)).toBe('rgb(255, 165, 0)');
    expect(getStrategyColor(84.9, false)).toBe('rgb(255, 165, 0)');
  });

  it('returns red for below 80%', () => {
    expect(getStrategyColor(79.9, false)).toBe('rgb(220, 20, 60)');
    expect(getStrategyColor(50, false)).toBe('rgb(220, 20, 60)');
    expect(getStrategyColor(0, false)).toBe('rgb(220, 20, 60)');
  });
});

describe('formatFilingAgeDisplay', () => {
  it('formats age with just years when months is 0', () => {
    const age = new MonthDuration(62 * 12);
    expect(formatFilingAgeDisplay(age, true)).toBe('62y');
  });

  it('formats age with years and months', () => {
    const age = new MonthDuration(62 * 12 + 3);
    expect(formatFilingAgeDisplay(age, true)).toBe('62y3m');
  });

  it('formats age 70', () => {
    const age = new MonthDuration(70 * 12);
    expect(formatFilingAgeDisplay(age, true)).toBe('70y');
  });

  it('formats age 67 and 6 months', () => {
    const age = new MonthDuration(67 * 12 + 6);
    expect(formatFilingAgeDisplay(age, true)).toBe('67y6m');
  });

  it('throws error when displayAsAges is false and no birthdate', () => {
    const age = new MonthDuration(62 * 12);
    expect(() => formatFilingAgeDisplay(age, false)).toThrow(
      'birthdate required when displayAsAges is false'
    );
  });

  it('formats as date when displayAsAges is false', () => {
    const age = new MonthDuration(62 * 12);
    const birthdate = Birthdate.FromYMD(1962, 0, 15); // Jan 15, 1962
    const result = formatFilingAgeDisplay(age, false, birthdate);
    // Age 62 for Jan 1962 birthday means filing in Jan 2024
    // Date format may vary by locale, just check it contains Jan and 24
    expect(result).toContain('Jan');
    expect(result).toContain('24');
  });
});

describe('calculateAlternativeStrategies', () => {
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

  it('groups results by year', () => {
    // Use a birthdate far in the future so no ages are "already passed"
    const recipient = createRecipient(2000, 0, 15, 2000);
    const deathAge = new MonthDuration(85 * 12);
    const optimalNPV = Money.from(500000);
    const optimalFilingAge = new MonthDuration(67 * 12);
    // Use a current date before the recipient turns 62
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const result = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      optimalNPV,
      optimalFilingAge,
      currentDate
    );

    // Should have groups for ages 62 through 70 (9 years)
    expect(result.length).toBe(9);
    expect(result[0].year).toBe(62);
    expect(result[8].year).toBe(70);
  });

  it('adds placeholders for unavailable months at start of first year', () => {
    // Born mid-month, so earliest filing is 62y 1m
    const recipient = createRecipient(2000, 5, 15, 2000); // June 15
    const deathAge = new MonthDuration(85 * 12);
    const optimalNPV = Money.from(500000);
    const optimalFilingAge = new MonthDuration(67 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const result = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      optimalNPV,
      optimalFilingAge,
      currentDate
    );

    // First year should have 12 entries (including placeholder)
    const firstYear = result[0];
    expect(firstYear.year).toBe(62);
    // First entry should be a placeholder
    expect(firstYear.results[0].isPlaceholder).toBe(true);
    expect(firstYear.results[0].placeholderReason).toBe('Not yet eligible');
  });

  it('marks past filing ages as already passed', () => {
    // Born Jan 2, 1960 so they can file at exactly 62y 0m, avoiding "Not yet eligible" placeholders
    const recipient = createRecipient(1960, 0, 2, 2000);
    const deathAge = new MonthDuration(85 * 12);
    const optimalNPV = Money.from(500000);
    const optimalFilingAge = new MonthDuration(67 * 12);
    // Current date when recipient is 64 years old
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2024,
      months: 6,
    });

    const result = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      optimalNPV,
      optimalFilingAge,
      currentDate
    );

    // Ages 62 and 63 should be marked as already passed
    const age62Group = result.find((g) => g.year === 62);
    expect(age62Group).toBeDefined();
    // All entries in age 62 should be "Already passed" (no eligibility placeholders
    // since this recipient can file at exactly 62y 0m)
    for (const r of age62Group!.results) {
      expect(r.isPlaceholder).toBe(true);
      expect(r.placeholderReason).toBe('Already passed');
    }

    const age63Group = result.find((g) => g.year === 63);
    expect(age63Group).toBeDefined();
    for (const r of age63Group!.results) {
      expect(r.isPlaceholder).toBe(true);
      expect(r.placeholderReason).toBe('Already passed');
    }
  });

  it('truncates results at death age', () => {
    const recipient = createRecipient(2000, 0, 2, 2000);
    // Death at age 65 means no filing ages after 65
    const deathAge = new MonthDuration(65 * 12);
    const optimalNPV = Money.from(300000);
    const optimalFilingAge = new MonthDuration(62 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const result = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      optimalNPV,
      optimalFilingAge,
      currentDate
    );

    // Should only have ages 62 through 65 (4 years)
    expect(result.length).toBe(4);
    expect(result[result.length - 1].year).toBe(65);
  });

  it('marks the optimal filing age correctly', () => {
    const recipient = createRecipient(2000, 0, 2, 2000);
    const deathAge = new MonthDuration(85 * 12);
    const optimalNPV = Money.from(500000);
    const optimalFilingAge = new MonthDuration(67 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const result = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      optimalNPV,
      optimalFilingAge,
      currentDate
    );

    // Find the age 67 group and check the first entry (67y 0m)
    const age67Group = result.find((g) => g.year === 67);
    expect(age67Group).toBeDefined();
    const optimalResult = age67Group!.results.find(
      (r) => r.filingAge.asMonths() === 67 * 12
    );
    expect(optimalResult).toBeDefined();
    expect(optimalResult!.isOptimal).toBe(true);

    // Other results should not be marked as optimal
    const age62Group = result.find((g) => g.year === 62);
    for (const r of age62Group!.results) {
      if (!r.isPlaceholder) {
        expect(r.isOptimal).toBe(false);
      }
    }
  });

  it('calculates percentage of optimal correctly', () => {
    const recipient = createRecipient(2000, 0, 2, 2000);
    const deathAge = new MonthDuration(85 * 12);
    const optimalNPV = Money.from(500000);
    const optimalFilingAge = new MonthDuration(67 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    const result = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      optimalNPV,
      optimalFilingAge,
      currentDate
    );

    // All non-placeholder results should have a percentage calculated
    for (const group of result) {
      for (const r of group.results) {
        if (!r.isPlaceholder) {
          // Percentage should be positive and reasonable
          expect(r.percentOfOptimal).toBeGreaterThan(0);
          expect(r.percentOfOptimal).toBeLessThanOrEqual(101); // Allow slight floating point variance
        }
      }
    }
  });

  it('handles zero optimal NPV without division errors', () => {
    const recipient = createRecipient(2000, 0, 2, 0); // Zero PIA
    const deathAge = new MonthDuration(85 * 12);
    const optimalNPV = Money.from(0);
    const optimalFilingAge = new MonthDuration(67 * 12);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2050,
      months: 0,
    });

    // Should not throw
    const result = calculateAlternativeStrategies(
      recipient,
      deathAge,
      0,
      optimalNPV,
      optimalFilingAge,
      currentDate
    );

    // All percentages should be 0 when optimal is 0
    for (const group of result) {
      for (const r of group.results) {
        if (!r.isPlaceholder) {
          expect(r.percentOfOptimal).toBe(0);
        }
      }
    }
  });
});
