import { describe, expect, it } from 'vitest';
import {
  EARNINGS_TEST_LIMITS,
  MAX_EARNINGS_TEST_YEAR,
  MAX_YEAR,
} from '$lib/constants';
import { earningsTest, earningsTestLimit } from '$lib/earnings-test';
import { Money } from '$lib/money';

describe('EARNINGS_TEST_LIMITS', () => {
  it('covers the latest year the constants cover', () => {
    expect(EARNINGS_TEST_LIMITS[MAX_YEAR]).toBeDefined();
    expect(MAX_EARNINGS_TEST_YEAR).toBe(MAX_YEAR);
  });

  it('has a higher limit for the year of full retirement age', () => {
    for (const year of Object.keys(EARNINGS_TEST_LIMITS).map(Number)) {
      const limits = EARNINGS_TEST_LIMITS[year];
      expect(limits.fraYear.greaterThan(limits.underFra)).toBe(true);
    }
  });
});

describe('earningsTestLimit', () => {
  it('returns the 2027 limits the guide quotes', () => {
    expect(earningsTestLimit(2027, 'underFra').string()).toBe('$25,560.00');
    expect(earningsTestLimit(2027, 'fraYear').string()).toBe('$67,920.00');
  });

  it('throws for a year with no published limit', () => {
    expect(() => earningsTestLimit(1990, 'underFra')).toThrow(/1990/);
  });
});

/**
 * The earnings-test guide renders these figures and writes prose around
 * them (Sarah and Tom). When a constants update moves them, update this
 * table and re-read earnings-test/+page.svelte together.
 */
describe('earningsTest', () => {
  it('withholds half of the excess under full retirement age (Sarah)', () => {
    const r = earningsTest({
      year: 2027,
      period: 'underFra',
      earnings: Money.from(35560),
      monthlyBenefit: Money.from(1500),
    });
    expect(r.limit.string()).toBe('$25,560.00');
    expect(r.excess.string()).toBe('$10,000.00');
    expect(r.dollarsPerDollar).toBe(2);
    expect(r.withheld.string()).toBe('$5,000.00');
    expect(r.annualBenefit.string()).toBe('$18,000.00');
    expect(r.checksWithheld).toBe(4);
    expect(r.overWithheld.string()).toBe('$1,000.00');
    expect(r.netBenefit.string()).toBe('$13,000.00');
  });

  it('withholds a third of the excess in the year of full retirement age (Tom)', () => {
    const r = earningsTest({
      year: 2027,
      period: 'fraYear',
      earnings: Money.from(73000),
      monthlyBenefit: Money.from(2000),
    });
    expect(r.limit.string()).toBe('$67,920.00');
    expect(r.excess.string()).toBe('$5,080.00');
    expect(r.dollarsPerDollar).toBe(3);
    expect(r.withheld.string()).toBe('$1,693.33');
    expect(r.checksWithheld).toBe(1);
    expect(r.overWithheld.string()).toBe('$306.67');
    expect(r.netBenefit.string()).toBe('$22,306.67');
  });

  it('withholds nothing at or under the limit', () => {
    const r = earningsTest({
      year: 2027,
      period: 'underFra',
      earnings: Money.from(20000),
      monthlyBenefit: Money.from(1500),
    });
    expect(r.excess.string()).toBe('$0.00');
    expect(r.withheld.string()).toBe('$0.00');
    expect(r.checksWithheld).toBe(0);
    expect(r.overWithheld.string()).toBe('$0.00');
    expect(r.netBenefit.string()).toBe('$18,000.00');
  });

  it('never withholds more than the year of benefits', () => {
    const r = earningsTest({
      year: 2027,
      period: 'underFra',
      earnings: Money.from(100000),
      monthlyBenefit: Money.from(1000),
    });
    expect(r.excess.string()).toBe('$74,440.00');
    expect(r.withheld.string()).toBe('$12,000.00');
    expect(r.checksWithheld).toBe(12);
    expect(r.overWithheld.string()).toBe('$0.00');
    expect(r.netBenefit.string()).toBe('$0.00');
  });

  it('withholds no checks when there is no benefit to withhold', () => {
    const r = earningsTest({
      year: 2027,
      period: 'underFra',
      earnings: Money.from(100000),
      monthlyBenefit: Money.zero(),
    });
    expect(r.withheld.string()).toBe('$0.00');
    expect(r.checksWithheld).toBe(0);
    expect(r.netBenefit.string()).toBe('$0.00');
  });

  it('rejects negative inputs', () => {
    expect(() =>
      earningsTest({
        year: 2027,
        period: 'underFra',
        earnings: Money.from(-1),
        monthlyBenefit: Money.from(1500),
      })
    ).toThrow(/negative/);
    expect(() =>
      earningsTest({
        year: 2027,
        period: 'underFra',
        earnings: Money.from(1),
        monthlyBenefit: Money.from(-1500),
      })
    ).toThrow(/negative/);
  });
});
