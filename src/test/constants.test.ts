import {COLA, EARNINGS_PER_CREDIT, MAX_WAGE_INDEX_YEAR, MAX_YEAR, MAXIMUM_EARNINGS, TAX_RATES, WAGE_INDICES} from '$lib/constants'
import {describe, expect, it} from 'vitest'

describe('constants.ts', () => {
  // The first year for earnings_per_credit is 1978.
  for (let year = 1978; year <= MAX_YEAR; year++) {
    it(`has earnings per credit for year ${year}`, () => {
      expect(EARNINGS_PER_CREDIT[year]).toBeDefined();
    });
  }

  // The first year for maximum_earnings is 1956.
  for (let year = 1956; year <= MAX_YEAR; year++) {
    it(`has maximum earnings for year ${year}`, () => {
      expect(MAXIMUM_EARNINGS[year]).toBeDefined();
    });
  }

  // The first year for tax rates is 1956.
  for (let year = 1956; year <= MAX_YEAR; year++) {
    it(`has tax rates for year ${year}`, () => {
      expect(TAX_RATES[year]).toBeDefined();
    });
  }

  // The first year for wage indices is 1951.
  // Wage indices only go up to MAX_WAGE_INDEX_YEAR (roughly MAX_YEAR - 2).
  for (let year = 1952; year <= MAX_WAGE_INDEX_YEAR; year++) {
    it(`has wage indices for year ${year}`, () => {
      expect(WAGE_INDICES[year]).toBeDefined();
    });
  }

  // The first year for COLA adjustment is 1975. COLA adjustments may be
  // available for the current year, typically late October. However, we
  // only test for it being available for the previous year.
  for (let year = 1975; year <= MAX_YEAR - 1; year++) {
    it(`has COLA adjustment for year ${year}`, () => {
      expect(COLA[year]).toBeDefined();
    });
  }

  it(`computes MAX_WAGE_INDEX_YEAR correctly`, () => {
    expect(WAGE_INDICES[MAX_WAGE_INDEX_YEAR]).toBeDefined();
    expect(WAGE_INDICES[MAX_WAGE_INDEX_YEAR + 1]).not.toBeDefined();
  });
});
