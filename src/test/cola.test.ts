import { describe, expect, it } from 'vitest';
import { averageCola, colaHistory, latestCola } from '$lib/cola';
import { COLA, MAX_COLA_YEAR } from '$lib/constants';

describe('colaHistory', () => {
  const history = colaHistory();

  it('has one entry per COLA on record', () => {
    expect(history.length).toBe(Object.keys(COLA).length);
  });

  it('runs oldest first', () => {
    const years = history.map((c) => c.announcementYear);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it('pays a COLA announced in 1983 or later the following January', () => {
    const cola2026 = history.find((c) => c.paymentYear === 2026);
    expect(cola2026?.announcementYear).toBe(2025);
    expect(cola2026?.percent).toBe(2.8);
  });

  it('pays a COLA announced before 1983 in the same year', () => {
    const first = history[0];
    expect(first.announcementYear).toBe(1975);
    expect(first.paymentYear).toBe(1975);
    expect(first.percent).toBe(8.0);
  });

  it('switches to next-January payment with the 1983 adjustment', () => {
    const of1982 = history.find((c) => c.announcementYear === 1982);
    const of1983 = history.find((c) => c.announcementYear === 1983);
    expect(of1982?.paymentYear).toBe(1982);
    expect(of1983?.paymentYear).toBe(1984);
  });

  it('records the years with no increase', () => {
    const zeroPaymentYears = history
      .filter((c) => c.percent === 0)
      .map((c) => c.paymentYear);
    expect(zeroPaymentYears).toEqual([2010, 2011, 2016]);
  });
});

describe('latestCola', () => {
  it('is the increase currently being paid', () => {
    const latest = latestCola();
    expect(latest.announcementYear).toBe(MAX_COLA_YEAR);
    expect(latest.paymentYear).toBe(MAX_COLA_YEAR + 1);
    expect(latest.percent).toBe(COLA[MAX_COLA_YEAR]);
  });

  it('is the last entry in the history', () => {
    const history = colaHistory();
    expect(latestCola()).toEqual(history[history.length - 1]);
  });
});

describe('averageCola', () => {
  it('averages every COLA on record', () => {
    const percents = Object.values(COLA);
    const expected = percents.reduce((sum, p) => sum + p, 0) / percents.length;
    expect(averageCola()).toBeCloseTo(expected, 10);
  });

  it('falls in a plausible range for the post-1975 era', () => {
    expect(averageCola()).toBeGreaterThan(2);
    expect(averageCola()).toBeLessThan(6);
  });
});
