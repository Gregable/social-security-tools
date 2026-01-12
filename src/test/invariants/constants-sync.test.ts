/**
 * Constants synchronization invariant tests.
 *
 * These tests ensure that various constant tables in constants.ts maintain
 * their required relationships and completeness. These invariants are critical
 * for correct Social Security calculations and must be maintained when updating
 * constants for new years.
 */
import { describe, expect, it } from 'vitest';
import {
  COLA,
  EARNINGS_PER_CREDIT,
  MAX_COLA_YEAR,
  MAX_WAGE_INDEX_YEAR,
  MAX_YEAR,
  MAXIMUM_EARNINGS,
  TAX_RATES,
  WAGE_INDICES,
} from '$lib/constants';

describe('Constants synchronization invariants', () => {
  describe('Year range completeness', () => {
    it('MAXIMUM_EARNINGS should start at 1937', () => {
      const years = Object.keys(MAXIMUM_EARNINGS)
        .map(Number)
        .sort((a, b) => a - b);
      expect(years[0]).toBe(1937);
    });

    it('WAGE_INDICES should start at 1951', () => {
      const years = Object.keys(WAGE_INDICES)
        .map(Number)
        .sort((a, b) => a - b);
      expect(years[0]).toBe(1951);
    });

    it('COLA should start at 1975', () => {
      const years = Object.keys(COLA)
        .map(Number)
        .sort((a, b) => a - b);
      expect(years[0]).toBe(1975);
    });
  });

  describe('MAX_YEAR synchronization', () => {
    it('MAX_WAGE_INDEX_YEAR should be within 3 years of MAX_YEAR', () => {
      expect(MAX_WAGE_INDEX_YEAR).toBeGreaterThanOrEqual(MAX_YEAR - 3);
      expect(MAX_WAGE_INDEX_YEAR).toBeLessThanOrEqual(MAX_YEAR);
    });

    it('MAX_COLA_YEAR should be within 2 years of MAX_YEAR', () => {
      expect(MAX_COLA_YEAR).toBeGreaterThanOrEqual(MAX_YEAR - 2);
      expect(MAX_COLA_YEAR).toBeLessThanOrEqual(MAX_YEAR);
    });

    it('all tables should have no gaps in year coverage', () => {
      for (let year = 1978; year <= MAX_YEAR; year++) {
        expect(
          EARNINGS_PER_CREDIT[year],
          `EARNINGS_PER_CREDIT missing year ${year}`
        ).toBeDefined();
      }
      for (let year = 1937; year <= MAX_YEAR; year++) {
        expect(
          MAXIMUM_EARNINGS[year],
          `MAXIMUM_EARNINGS missing year ${year}`
        ).toBeDefined();
      }
      for (let year = 1956; year <= MAX_YEAR; year++) {
        expect(TAX_RATES[year], `TAX_RATES missing year ${year}`).toBeDefined();
      }
      for (let year = 1951; year <= MAX_WAGE_INDEX_YEAR; year++) {
        expect(
          WAGE_INDICES[year],
          `WAGE_INDICES missing year ${year}`
        ).toBeDefined();
      }
      for (let year = 1975; year <= MAX_COLA_YEAR; year++) {
        expect(COLA[year], `COLA missing year ${year}`).toBeDefined();
      }
    });
  });

  describe('Value monotonicity', () => {
    it('EARNINGS_PER_CREDIT values should be monotonically non-decreasing', () => {
      const entries = Object.entries(EARNINGS_PER_CREDIT)
        .map(([y, v]) => [Number(y), v.value()] as const)
        .sort((a, b) => a[0] - b[0]);

      for (let i = 1; i < entries.length; i++) {
        expect(
          entries[i][1],
          `EARNINGS_PER_CREDIT decreased from ${entries[i - 1][0]} to ${entries[i][0]}`
        ).toBeGreaterThanOrEqual(entries[i - 1][1]);
      }
    });

    it('MAXIMUM_EARNINGS values should be monotonically non-decreasing after 1950', () => {
      const entries = Object.entries(MAXIMUM_EARNINGS)
        .map(([y, v]) => [Number(y), v.value()] as const)
        .filter(([y]) => y >= 1950)
        .sort((a, b) => a[0] - b[0]);

      for (let i = 1; i < entries.length; i++) {
        expect(
          entries[i][1],
          `MAXIMUM_EARNINGS decreased from ${entries[i - 1][0]} to ${entries[i][0]}`
        ).toBeGreaterThanOrEqual(entries[i - 1][1]);
      }
    });

    it('WAGE_INDICES values should be monotonically non-decreasing after 2010', () => {
      const entries = Object.entries(WAGE_INDICES)
        .map(([y, v]) => [Number(y), v.value()] as const)
        .filter(([y]) => y >= 2010)
        .sort((a, b) => a[0] - b[0]);

      for (let i = 1; i < entries.length; i++) {
        expect(
          entries[i][1],
          `WAGE_INDICES decreased from ${entries[i - 1][0]} to ${entries[i][0]}`
        ).toBeGreaterThanOrEqual(entries[i - 1][1]);
      }
    });
  });

  describe('Value reasonableness', () => {
    it('TAX_RATES should be between 0 and 0.10 (10%)', () => {
      for (const [year, rate] of Object.entries(TAX_RATES)) {
        expect(rate, `TAX_RATES[${year}] out of range`).toBeGreaterThan(0);
        expect(rate, `TAX_RATES[${year}] out of range`).toBeLessThan(0.1);
      }
    });

    it('COLA values should be between -5 and 20 percent', () => {
      for (const [year, cola] of Object.entries(COLA)) {
        expect(cola, `COLA[${year}] out of range`).toBeGreaterThanOrEqual(-5);
        expect(cola, `COLA[${year}] out of range`).toBeLessThanOrEqual(20);
      }
    });
  });
});
