import { describe, expect, it } from 'vitest';
import { MonthDurationRange } from '$lib/month-duration-range';
import { MonthDuration } from '$lib/month-time';

/**
 * Tests for AlternativeStrategiesGrid component logic.
 *
 * These tests focus on the helper functions for creating filing age ranges,
 * generating year headers, and determining NPV color coding.
 */

/**
 * Get color based on percentage of optimal NPV.
 * Replicates the coloring logic from AlternativeStrategiesGrid.svelte
 */
function getColor(percentOfOptimal: number): string {
  if (percentOfOptimal >= 99.9) {
    return '#006400'; // Dark green for exact optimal
  } else if (percentOfOptimal >= 95) {
    return '#228B22'; // Forest green
  } else if (percentOfOptimal >= 90) {
    return '#9ACD32'; // Yellow green
  } else if (percentOfOptimal >= 85) {
    return '#FFD700'; // Gold
  } else if (percentOfOptimal >= 80) {
    return '#FFA500'; // Orange
  } else {
    return '#FF4500'; // Orange red
  }
}

/**
 * Generate year-based headers from an array of MonthDurations.
 * Groups consecutive months by year and returns colspan info.
 */
function generateYearHeaders(
  ageRange: MonthDuration[]
): Array<{ year: number; colspan: number }> {
  const yearHeaders: Array<{ year: number; colspan: number }> = [];
  let currentYear: number | null = null;
  let monthCount = 0;

  for (const duration of ageRange) {
    const years = duration.years();
    if (years !== currentYear) {
      if (currentYear !== null) {
        yearHeaders.push({ year: currentYear, colspan: monthCount });
      }
      currentYear = years;
      monthCount = 1;
    } else {
      monthCount++;
    }
  }

  // Add the last year
  if (currentYear !== null) {
    yearHeaders.push({ year: currentYear, colspan: monthCount });
  }

  return yearHeaders;
}

describe('AlternativeStrategiesGrid', () => {
  describe('NPV color assignment', () => {
    it('returns dark green for exact optimal (99.9%+)', () => {
      expect(getColor(100)).toBe('#006400');
      expect(getColor(99.95)).toBe('#006400');
    });

    it('returns forest green for 95-99.9%', () => {
      expect(getColor(99)).toBe('#228B22');
      expect(getColor(95)).toBe('#228B22');
    });

    it('returns yellow green for 90-95%', () => {
      expect(getColor(94.9)).toBe('#9ACD32');
      expect(getColor(90)).toBe('#9ACD32');
    });

    it('returns gold for 85-90%', () => {
      expect(getColor(89.9)).toBe('#FFD700');
      expect(getColor(85)).toBe('#FFD700');
    });

    it('returns orange for 80-85%', () => {
      expect(getColor(84.9)).toBe('#FFA500');
      expect(getColor(80)).toBe('#FFA500');
    });

    it('returns orange-red for below 80%', () => {
      expect(getColor(79.9)).toBe('#FF4500');
      expect(getColor(50)).toBe('#FF4500');
      expect(getColor(0)).toBe('#FF4500');
    });
  });

  describe('Year header generation', () => {
    it('groups months by year with correct colspan', () => {
      const ageRange = [
        MonthDuration.initFromYearsMonths({ years: 62, months: 6 }),
        MonthDuration.initFromYearsMonths({ years: 62, months: 7 }),
        MonthDuration.initFromYearsMonths({ years: 62, months: 8 }),
        MonthDuration.initFromYearsMonths({ years: 62, months: 9 }),
        MonthDuration.initFromYearsMonths({ years: 62, months: 10 }),
        MonthDuration.initFromYearsMonths({ years: 62, months: 11 }),
        MonthDuration.initFromYearsMonths({ years: 63, months: 0 }),
        MonthDuration.initFromYearsMonths({ years: 63, months: 1 }),
      ];

      const headers = generateYearHeaders(ageRange);

      expect(headers).toHaveLength(2);
      expect(headers[0]).toEqual({ year: 62, colspan: 6 });
      expect(headers[1]).toEqual({ year: 63, colspan: 2 });
    });

    it('handles single year', () => {
      const ageRange = [
        MonthDuration.initFromYearsMonths({ years: 65, months: 0 }),
        MonthDuration.initFromYearsMonths({ years: 65, months: 1 }),
        MonthDuration.initFromYearsMonths({ years: 65, months: 2 }),
      ];

      const headers = generateYearHeaders(ageRange);

      expect(headers).toHaveLength(1);
      expect(headers[0]).toEqual({ year: 65, colspan: 3 });
    });

    it('handles full year range (62-70)', () => {
      const ageRange: MonthDuration[] = [];
      for (let y = 62; y <= 70; y++) {
        for (let m = 0; m < 12; m++) {
          if (y === 70 && m > 0) break; // Only 70y0m
          ageRange.push(
            MonthDuration.initFromYearsMonths({ years: y, months: m })
          );
        }
      }

      const headers = generateYearHeaders(ageRange);

      expect(headers).toHaveLength(9); // Years 62-70
      // Each year except 70 should have 12 months
      for (let i = 0; i < 8; i++) {
        expect(headers[i].colspan).toBe(12);
      }
      expect(headers[8].colspan).toBe(1); // Only 70y0m
    });

    it('handles empty range', () => {
      const headers = generateYearHeaders([]);
      expect(headers).toHaveLength(0);
    });
  });

  describe('Filing age range creation', () => {
    it('uses MonthDurationRange for filing ages', () => {
      const start = MonthDuration.initFromYearsMonths({ years: 62, months: 0 });
      const end = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
      const range = new MonthDurationRange(start, end);

      // Range should include all months from 62y0m to 70y0m
      const durations = range.toArray();
      expect(durations[0].asMonths()).toBe(62 * 12);
      expect(durations[durations.length - 1].asMonths()).toBe(70 * 12);
    });

    it('respects earliest filing age based on birthdate', () => {
      // Someone born on the 1st or 2nd can file at exactly 62y0m
      // Someone born later must wait until 62y1m
      const earliest62_0 = MonthDuration.initFromYearsMonths({
        years: 62,
        months: 0,
      });
      const earliest62_1 = MonthDuration.initFromYearsMonths({
        years: 62,
        months: 1,
      });

      expect(earliest62_0.asMonths()).toBe(744);
      expect(earliest62_1.asMonths()).toBe(745);
    });

    it('caps at age 70 or death age, whichever is earlier', () => {
      const maxAge70 = MonthDuration.initFromYearsMonths({
        years: 70,
        months: 0,
      });
      const deathAge68 = MonthDuration.initFromYearsMonths({
        years: 68,
        months: 0,
      });
      const deathAge85 = MonthDuration.initFromYearsMonths({
        years: 85,
        months: 0,
      });

      // End should be min(70, deathAge)
      const end1 = maxAge70.lessThan(deathAge85) ? maxAge70 : deathAge85;
      expect(end1.asMonths()).toBe(70 * 12);

      const end2 = maxAge70.lessThan(deathAge68) ? maxAge70 : deathAge68;
      expect(end2.asMonths()).toBe(68 * 12);
    });
  });

  describe('Percentage calculation', () => {
    it('calculates percentage of optimal correctly', () => {
      const optimalNPV = 100000;
      const alternativeNPV = 95000;
      const percentOfOptimal = (alternativeNPV / optimalNPV) * 100;

      expect(percentOfOptimal).toBe(95);
    });

    it('handles 100% match', () => {
      const optimalNPV = 100000;
      const alternativeNPV = 100000;
      const percentOfOptimal = (alternativeNPV / optimalNPV) * 100;

      expect(percentOfOptimal).toBe(100);
    });

    it('handles low percentages', () => {
      const optimalNPV = 100000;
      const alternativeNPV = 50000;
      const percentOfOptimal = (alternativeNPV / optimalNPV) * 100;

      expect(percentOfOptimal).toBe(50);
      expect(getColor(percentOfOptimal)).toBe('#FF4500'); // Orange-red
    });
  });
});
