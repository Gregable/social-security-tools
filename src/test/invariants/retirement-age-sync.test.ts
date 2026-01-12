/**
 * Retirement age bracket synchronization tests.
 *
 * These tests ensure that FULL_RETIREMENT_AGE and FULL_RETIREMENT_AGE_SURVIVOR
 * brackets maintain their documented relationship (+2 year birth year offset)
 * and have complete year coverage.
 */
import { describe, expect, it } from 'vitest';
import {
  FULL_RETIREMENT_AGE,
  FULL_RETIREMENT_AGE_SURVIVOR,
} from '$lib/constants';

describe('Retirement age bracket invariants', () => {
  describe('FULL_RETIREMENT_AGE coverage', () => {
    it('should have complete year coverage with no gaps', () => {
      let expectedMinYear = 0;
      for (const bracket of FULL_RETIREMENT_AGE) {
        expect(bracket.minYear).toBe(expectedMinYear);
        expectedMinYear = bracket.maxYear + 1;
      }
    });

    it('should end at year 10000', () => {
      const lastBracket = FULL_RETIREMENT_AGE[FULL_RETIREMENT_AGE.length - 1];
      expect(lastBracket.maxYear).toBe(10000);
    });

    it('should have valid age values (62-70 years)', () => {
      for (const bracket of FULL_RETIREMENT_AGE) {
        expect(bracket.ageYears).toBeGreaterThanOrEqual(62);
        expect(bracket.ageYears).toBeLessThanOrEqual(70);
        expect(bracket.ageMonths).toBeGreaterThanOrEqual(0);
        expect(bracket.ageMonths).toBeLessThan(12);
      }
    });

    it('should have valid delayedIncreaseAnnual values', () => {
      for (const bracket of FULL_RETIREMENT_AGE) {
        expect(bracket.delayedIncreaseAnnual).toBeGreaterThan(0);
        expect(bracket.delayedIncreaseAnnual).toBeLessThanOrEqual(0.1);
      }
    });
  });

  describe('FULL_RETIREMENT_AGE_SURVIVOR coverage', () => {
    it('should have complete year coverage with no gaps', () => {
      let expectedMinYear = 0;
      for (const bracket of FULL_RETIREMENT_AGE_SURVIVOR) {
        expect(bracket.minYear).toBe(expectedMinYear);
        expectedMinYear = bracket.maxYear + 1;
      }
    });

    it('should end at year 10000', () => {
      const lastBracket =
        FULL_RETIREMENT_AGE_SURVIVOR[FULL_RETIREMENT_AGE_SURVIVOR.length - 1];
      expect(lastBracket.maxYear).toBe(10000);
    });

    it('should have valid age values (62-70 years)', () => {
      for (const bracket of FULL_RETIREMENT_AGE_SURVIVOR) {
        expect(bracket.ageYears).toBeGreaterThanOrEqual(62);
        expect(bracket.ageYears).toBeLessThanOrEqual(70);
        expect(bracket.ageMonths).toBeGreaterThanOrEqual(0);
        expect(bracket.ageMonths).toBeLessThan(12);
      }
    });
  });

  describe('Survivor FRA is +2 years birth year offset from personal FRA', () => {
    it('survivor brackets should match personal brackets with +2 year offset', () => {
      // Build a map of birth year -> FRA age for personal benefits
      const personalFraByYear = new Map<
        number,
        { years: number; months: number }
      >();
      for (const bracket of FULL_RETIREMENT_AGE) {
        for (
          let year = bracket.minYear;
          year <= Math.min(bracket.maxYear, 2000);
          year++
        ) {
          personalFraByYear.set(year, {
            years: bracket.ageYears,
            months: bracket.ageMonths,
          });
        }
      }

      // For each survivor bracket, the FRA should match the personal FRA
      // for someone born 2 years earlier
      for (const survivorBracket of FULL_RETIREMENT_AGE_SURVIVOR) {
        // Skip boundary brackets
        if (survivorBracket.minYear === 0 || survivorBracket.maxYear === 10000)
          continue;

        // For a survivor born in survivorBracket.minYear, their FRA should match
        // the personal FRA for someone born (survivorBracket.minYear - 2)
        const correspondingPersonalYear = survivorBracket.minYear - 2;
        const personalFra = personalFraByYear.get(correspondingPersonalYear);

        if (personalFra) {
          expect(
            survivorBracket.ageYears,
            `Survivor FRA for birth year ${survivorBracket.minYear} should match personal FRA for ${correspondingPersonalYear}`
          ).toBe(personalFra.years);
          expect(
            survivorBracket.ageMonths,
            `Survivor FRA months for birth year ${survivorBracket.minYear} should match personal FRA for ${correspondingPersonalYear}`
          ).toBe(personalFra.months);
        }
      }
    });
  });

  describe('Age progression', () => {
    it('FULL_RETIREMENT_AGE ages should increase or stay same over birth years', () => {
      let prevAgeInMonths = 0;
      for (const bracket of FULL_RETIREMENT_AGE) {
        const ageInMonths = bracket.ageYears * 12 + bracket.ageMonths;
        expect(ageInMonths).toBeGreaterThanOrEqual(prevAgeInMonths);
        prevAgeInMonths = ageInMonths;
      }
    });

    it('FULL_RETIREMENT_AGE_SURVIVOR ages should increase or stay same over birth years', () => {
      let prevAgeInMonths = 0;
      for (const bracket of FULL_RETIREMENT_AGE_SURVIVOR) {
        const ageInMonths = bracket.ageYears * 12 + bracket.ageMonths;
        expect(ageInMonths).toBeGreaterThanOrEqual(prevAgeInMonths);
        prevAgeInMonths = ageInMonths;
      }
    });
  });
});
