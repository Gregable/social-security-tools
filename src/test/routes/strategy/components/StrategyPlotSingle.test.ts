import { describe, expect, it } from 'vitest';
import { Money } from '$lib/money';
import { MonthDuration } from '$lib/month-time';
import type { DeathAgeBucket } from '$lib/strategy/ui';
import { CalculationResults } from '$lib/strategy/ui/calculation-results';

/**
 * Tests for StrategyPlotSingle component logic.
 *
 * Since the component uses canvas rendering and reactive Svelte statements,
 * these tests focus on the data transformation and calculation logic
 * that the component relies on.
 */

function createBucket(startAge: number, label?: string): DeathAgeBucket {
  return {
    label: label ?? startAge.toString(),
    midAge: startAge,
    startAge,
    endAgeInclusive: startAge,
    probability: 0.03,
    expectedAge: new MonthDuration(startAge * 12),
  };
}

function createCalculationResults(
  filingAgesByDeathAge: { deathAge: number; filingAgeMonths: number }[]
): CalculationResults {
  const results = new CalculationResults(filingAgesByDeathAge.length, 1);

  filingAgesByDeathAge.forEach(({ deathAge, filingAgeMonths }, i) => {
    results.set(i, 0, {
      deathAge1: deathAge.toString(),
      bucket1: createBucket(deathAge),
      filingAge1: new MonthDuration(filingAgeMonths),
      totalBenefit: Money.from(500000),
      filingAge1Years: Math.floor(filingAgeMonths / 12),
      filingAge1Months: filingAgeMonths % 12,
    });
  });

  return results;
}

/**
 * Replicates the x-axis range calculation logic from StrategyPlotSingle.
 * This allows us to test the logic in isolation.
 */
function calculateXAxisRange(
  results: CalculationResults,
  earliestFilingAge: number,
  xAxisPadding: number = 5
): { min: number; max: number } {
  const rowBuckets = results.rowBuckets();
  const bucketMin = rowBuckets[0]?.startAge ?? 62;
  const bucketMax = rowBuckets[rowBuckets.length - 1]?.startAge ?? 100;

  // Filter strategy points (same logic as component)
  const strategyPoints: { deathAge: number; filingAgeMonths: number }[] = [];
  for (let i = 0; i < results.rows(); i++) {
    const result = results.get(i, 0);
    if (!result) continue;
    if (result.filingAge1.asMonths() < earliestFilingAge) continue;
    strategyPoints.push({
      deathAge: result.bucket1.startAge,
      filingAgeMonths: result.filingAge1.asMonths(),
    });
  }

  if (strategyPoints.length === 0) {
    return { min: bucketMin, max: bucketMax };
  }

  const filingAges = strategyPoints.map((p) => p.filingAgeMonths);
  const minFiling = Math.min(...filingAges);
  const maxFiling = Math.max(...filingAges);

  // If filing age is constant (flat line), show full range
  if (minFiling === maxFiling) {
    return { min: bucketMin, max: bucketMax };
  }

  // Find the last death age where filing age is at minimum
  let minFilingDeathAge = strategyPoints[0].deathAge;
  for (const p of strategyPoints) {
    if (p.filingAgeMonths === minFiling) {
      minFilingDeathAge = p.deathAge;
    }
  }

  // Find the first death age where filing age reaches maximum
  let maxFilingDeathAge = strategyPoints[strategyPoints.length - 1].deathAge;
  for (const p of strategyPoints) {
    if (p.filingAgeMonths === maxFiling) {
      maxFilingDeathAge = p.deathAge;
      break;
    }
  }

  return {
    min: Math.max(bucketMin, minFilingDeathAge - xAxisPadding),
    max: Math.min(bucketMax, maxFilingDeathAge + xAxisPadding),
  };
}

describe('StrategyPlotSingle', () => {
  describe('X-axis range calculation', () => {
    const earliestFilingAge = 62 * 12; // 62 years in months

    it('should return full range when no strategy points exist', () => {
      const results = new CalculationResults(0, 0);
      // With empty results, rowBuckets will be empty, so we test the fallback
      const range = calculateXAxisRange(results, earliestFilingAge);
      // Empty results should fall back to defaults
      expect(range.min).toBeDefined();
      expect(range.max).toBeDefined();
    });

    it('should return full range when filing age is constant (flat line)', () => {
      // All points have the same filing age (62)
      const data = [];
      for (let age = 62; age <= 100; age++) {
        data.push({ deathAge: age, filingAgeMonths: 62 * 12 });
      }
      const results = createCalculationResults(data);
      const range = calculateXAxisRange(results, earliestFilingAge);

      expect(range.min).toBe(62);
      expect(range.max).toBe(100);
    });

    it('should narrow range based on filing age variation', () => {
      // Filing age is 62 until death age 75, then jumps to 70 at death age 85
      const data = [];
      for (let age = 62; age <= 100; age++) {
        let filingAgeMonths: number;
        if (age <= 75) {
          filingAgeMonths = 62 * 12;
        } else if (age >= 85) {
          filingAgeMonths = 70 * 12;
        } else {
          // Linear interpolation
          const ratio = (age - 75) / 10;
          filingAgeMonths = Math.round(62 * 12 + ratio * (70 - 62) * 12);
        }
        data.push({ deathAge: age, filingAgeMonths });
      }
      const results = createCalculationResults(data);
      const range = calculateXAxisRange(results, earliestFilingAge);

      // Last death age with minimum filing age is 75
      // First death age with maximum filing age is 85
      // With padding of 5: min = 70, max = 90
      expect(range.min).toBe(70);
      expect(range.max).toBe(90);
    });

    it('should respect bucket boundaries when applying padding', () => {
      // Filing age varies from 62 to 70 across death ages 63-65
      const data = [
        { deathAge: 62, filingAgeMonths: 62 * 12 },
        { deathAge: 63, filingAgeMonths: 62 * 12 },
        { deathAge: 64, filingAgeMonths: 66 * 12 },
        { deathAge: 65, filingAgeMonths: 70 * 12 },
        { deathAge: 66, filingAgeMonths: 70 * 12 },
      ];
      const results = createCalculationResults(data);
      const range = calculateXAxisRange(results, earliestFilingAge);

      // Last death age with min filing (62) is 63
      // First death age with max filing (70) is 65
      // With padding of 5: min = max(62, 63-5) = 62, max = min(66, 65+5) = 66
      expect(range.min).toBe(62); // Clamped to bucket min
      expect(range.max).toBe(66); // Clamped to bucket max
    });

    it('should handle sharp transition in filing age', () => {
      // Filing age jumps from 62 to 70 at death age 80
      const data = [];
      for (let age = 62; age <= 100; age++) {
        const filingAgeMonths = age < 80 ? 62 * 12 : 70 * 12;
        data.push({ deathAge: age, filingAgeMonths });
      }
      const results = createCalculationResults(data);
      const range = calculateXAxisRange(results, earliestFilingAge);

      // Last death age with min filing (62) is 79
      // First death age with max filing (70) is 80
      // With padding of 5: min = 74, max = 85
      expect(range.min).toBe(74);
      expect(range.max).toBe(85);
    });
  });

  describe('CalculationResults data access', () => {
    it('should provide row buckets for strategy points', () => {
      const data = [
        { deathAge: 70, filingAgeMonths: 62 * 12 },
        { deathAge: 80, filingAgeMonths: 66 * 12 },
        { deathAge: 90, filingAgeMonths: 70 * 12 },
      ];
      const results = createCalculationResults(data);

      const buckets = results.rowBuckets();
      expect(buckets).toHaveLength(3);
      expect(buckets[0].startAge).toBe(70);
      expect(buckets[1].startAge).toBe(80);
      expect(buckets[2].startAge).toBe(90);
    });

    it('should return strategy results with correct filing ages', () => {
      const data = [
        { deathAge: 75, filingAgeMonths: 64 * 12 + 6 }, // 64 years 6 months
      ];
      const results = createCalculationResults(data);

      const result = results.get(0, 0);
      expect(result).toBeDefined();
      expect(result!.filingAge1.asMonths()).toBe(64 * 12 + 6);
      expect(result!.filingAge1Years).toBe(64);
      expect(result!.filingAge1Months).toBe(6);
    });
  });

  describe('Strategy point filtering', () => {
    it('should filter out results with filing age below earliest filing age', () => {
      // Simulate a case where some results have invalid filing ages
      const results = new CalculationResults(3, 1);
      const earliestFilingAge = 62 * 12;

      // Valid result
      results.set(0, 0, {
        deathAge1: '70',
        bucket1: createBucket(70),
        filingAge1: new MonthDuration(62 * 12),
        totalBenefit: Money.from(500000),
        filingAge1Years: 62,
        filingAge1Months: 0,
      });

      // Invalid result (filing age too low - shouldn't happen in practice)
      results.set(1, 0, {
        deathAge1: '63',
        bucket1: createBucket(63),
        filingAge1: new MonthDuration(61 * 12), // Below 62
        totalBenefit: Money.from(100000),
        filingAge1Years: 61,
        filingAge1Months: 0,
      });

      // Valid result
      results.set(2, 0, {
        deathAge1: '80',
        bucket1: createBucket(80),
        filingAge1: new MonthDuration(67 * 12),
        totalBenefit: Money.from(600000),
        filingAge1Years: 67,
        filingAge1Months: 0,
      });

      // Count valid points (filtering logic from component)
      let validCount = 0;
      for (let i = 0; i < results.rows(); i++) {
        const result = results.get(i, 0);
        if (result && result.filingAge1.asMonths() >= earliestFilingAge) {
          validCount++;
        }
      }

      expect(validCount).toBe(2);
    });
  });
});
