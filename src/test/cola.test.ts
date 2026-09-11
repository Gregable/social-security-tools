import { describe, expect, it } from 'vitest';
import { averageCola, colaHistory, latestAnnouncedCola } from '$lib/cola';
import {
  COLA,
  CURRENT_YEAR,
  MAX_COLA_YEAR,
  MEDICARE_PART_B_PREMIUM,
} from '$lib/constants';

describe('colaHistory', () => {
  const history = colaHistory();

  it('has one entry per COLA on record', () => {
    expect(history.length).toBe(Object.keys(COLA).length);
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

  it('runs oldest first with no year paid twice', () => {
    const paymentYears = history.map((c) => c.paymentYear);
    for (let i = 1; i < paymentYears.length; ++i) {
      expect(paymentYears[i]).toBeGreaterThan(paymentYears[i - 1]);
    }
  });

  it('skips exactly one calendar year, 1983, when the timing changed', () => {
    const paymentYears = history.map((c) => c.paymentYear);
    const first = paymentYears[0];
    const last = paymentYears[paymentYears.length - 1];
    const missing: number[] = [];
    for (let year = first; year <= last; ++year) {
      if (!paymentYears.includes(year)) missing.push(year);
    }
    expect(missing).toEqual([1983]);
  });

  it('records the years with no increase', () => {
    const zeroPaymentYears = history
      .filter((c) => c.percent === 0)
      .map((c) => c.paymentYear);
    expect(zeroPaymentYears).toEqual([2010, 2011, 2016]);
  });
});

describe('latestAnnouncedCola', () => {
  it('is the newest adjustment on record', () => {
    const latest = latestAnnouncedCola();
    expect(latest.announcementYear).toBe(MAX_COLA_YEAR);
    expect(latest.percent).toBe(COLA[MAX_COLA_YEAR]);
  });

  it('is the last entry in the history', () => {
    const history = colaHistory();
    expect(latestAnnouncedCola()).toEqual(history[history.length - 1]);
  });

  it('is either being paid now or takes effect next January', () => {
    const latest = latestAnnouncedCola();
    expect([CURRENT_YEAR, CURRENT_YEAR + 1]).toContain(latest.paymentYear);
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

describe('MEDICARE_PART_B_PREMIUM', () => {
  // The COLA guide reports the Part B premium alongside the COLA. These keep
  // the two tables updated together.
  it('covers the year currently being paid', () => {
    expect(MEDICARE_PART_B_PREMIUM[CURRENT_YEAR]).toBeDefined();
  });

  it('covers the prior year so an increase can be shown', () => {
    expect(MEDICARE_PART_B_PREMIUM[CURRENT_YEAR - 1]).toBeDefined();
  });
});
