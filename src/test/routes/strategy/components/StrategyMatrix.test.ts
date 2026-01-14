import { describe, expect, it } from 'vitest';
import { MonthDuration } from '$lib/month-time';
import type { DeathAgeBucket } from '$lib/strategy/ui/grid-sizing';

/**
 * Tests for StrategyMatrix component logic.
 *
 * These tests focus on the data transformation and calculation logic
 * used to build the probability-weighted grid templates.
 */

/**
 * Helper to create a death age bucket.
 */
function createBucket(
  startAge: number,
  endAgeInclusive: number | null,
  label?: string
): DeathAgeBucket {
  return {
    label: label ?? startAge.toString(),
    midAge: endAgeInclusive === null ? startAge : startAge + 1,
    startAge,
    endAgeInclusive,
    probability: 0.1,
    expectedAge: new MonthDuration(startAge * 12 + 6),
  };
}

/**
 * Calculate bucket probability by summing distribution values in range.
 * Replicates the logic from StrategyMatrix.svelte
 */
function bucketProbability(
  bucket: DeathAgeBucket,
  distribution: { age: number; probability: number }[]
): number {
  if (!bucket) return 0;
  const start = bucket.startAge;
  const end = bucket.endAgeInclusive;
  if (end === null) {
    return distribution
      .filter((d) => d.age >= start)
      .reduce((s, d) => s + d.probability, 0);
  }
  return distribution
    .filter((d) => d.age >= start && d.age <= end)
    .reduce((s, d) => s + d.probability, 0);
}

/**
 * Build grid template from buckets with probability-weighted sizing.
 * Replicates the logic from StrategyMatrix.svelte
 */
function buildTemplateFromBuckets(
  buckets: DeathAgeBucket[],
  distribution: { age: number; probability: number }[]
): { template: string; percentages: number[] } {
  const masses = buckets.map((b) => bucketProbability(b, distribution));
  const total = masses.reduce((s, v) => s + v, 0) || 1;

  const fractions = masses.map((m) => m / total);
  const percentages: number[] = [];
  let sum = 0;
  for (let i = 0; i < fractions.length; i++) {
    if (i === fractions.length - 1) {
      const remaining = 1 - sum;
      percentages.push(remaining);
    } else {
      const rounded = parseFloat(fractions[i].toFixed(4));
      percentages.push(rounded);
      sum += rounded;
    }
  }

  const template = percentages
    .map((p, i) => {
      if (i === percentages.length - 1) {
        const used = percentages.slice(0, -1).reduce((s, v) => s + v, 0);
        const lastPct = 100 - parseFloat((used * 100).toFixed(2));
        return `${lastPct.toFixed(2)}%`;
      }
      return `${(p * 100).toFixed(2)}%`;
    })
    .join(' ');
  return { template, percentages };
}

describe('StrategyMatrix', () => {
  describe('bucketProbability', () => {
    const distribution = [
      { age: 70, probability: 0.05 },
      { age: 71, probability: 0.06 },
      { age: 72, probability: 0.07 },
      { age: 73, probability: 0.08 },
      { age: 74, probability: 0.09 },
      { age: 75, probability: 0.1 },
      { age: 76, probability: 0.1 },
      { age: 77, probability: 0.1 },
      { age: 78, probability: 0.1 },
      { age: 79, probability: 0.1 },
      { age: 80, probability: 0.15 },
    ];

    it('sums probability for a fixed range bucket', () => {
      const bucket = createBucket(70, 72); // 70-72 inclusive
      const prob = bucketProbability(bucket, distribution);
      // 0.05 + 0.06 + 0.07 = 0.18
      expect(prob).toBeCloseTo(0.18);
    });

    it('sums probability for an open-ended bucket', () => {
      const bucket = createBucket(78, null); // 78+ (open-ended)
      const prob = bucketProbability(bucket, distribution);
      // 0.10 + 0.10 + 0.15 = 0.35
      expect(prob).toBeCloseTo(0.35);
    });

    it('returns 0 for empty distribution', () => {
      const bucket = createBucket(70, 72);
      const prob = bucketProbability(bucket, []);
      expect(prob).toBe(0);
    });

    it('returns 0 for bucket outside distribution range', () => {
      const bucket = createBucket(90, 92);
      const prob = bucketProbability(bucket, distribution);
      expect(prob).toBe(0);
    });

    it('handles single-year bucket', () => {
      const bucket = createBucket(75, 75);
      const prob = bucketProbability(bucket, distribution);
      expect(prob).toBeCloseTo(0.1);
    });
  });

  describe('buildTemplateFromBuckets', () => {
    it('generates percentages that sum to 100%', () => {
      const buckets = [
        createBucket(70, 72, '71'),
        createBucket(73, 75, '74'),
        createBucket(76, 78, '77'),
        createBucket(79, null, '79+'),
      ];

      const distribution = [
        { age: 70, probability: 0.1 },
        { age: 71, probability: 0.1 },
        { age: 72, probability: 0.1 },
        { age: 73, probability: 0.1 },
        { age: 74, probability: 0.1 },
        { age: 75, probability: 0.1 },
        { age: 76, probability: 0.1 },
        { age: 77, probability: 0.1 },
        { age: 78, probability: 0.1 },
        { age: 79, probability: 0.1 },
      ];

      const { percentages } = buildTemplateFromBuckets(buckets, distribution);

      const sum = percentages.reduce((s, p) => s + p, 0);
      expect(sum).toBeCloseTo(1.0, 3);
    });

    it('handles single bucket (100%)', () => {
      const buckets = [createBucket(70, null, '70+')];
      const distribution = [
        { age: 70, probability: 0.5 },
        { age: 80, probability: 0.5 },
      ];

      const { percentages } = buildTemplateFromBuckets(buckets, distribution);

      expect(percentages).toHaveLength(1);
      expect(percentages[0]).toBeCloseTo(1.0);
    });

    it('generates valid CSS template string', () => {
      const buckets = [createBucket(70, 72, '71'), createBucket(73, 75, '74')];
      const distribution = [
        { age: 70, probability: 0.3 },
        { age: 71, probability: 0.2 },
        { age: 72, probability: 0.2 },
        { age: 73, probability: 0.1 },
        { age: 74, probability: 0.1 },
        { age: 75, probability: 0.1 },
      ];

      const { template } = buildTemplateFromBuckets(buckets, distribution);

      // Template should be space-separated percentages
      expect(template).toMatch(/^\d+\.\d+% \d+\.\d+%$/);
      // Parse and verify percentages sum to 100
      const parts = template.split(' ').map((p) => parseFloat(p));
      const sum = parts.reduce((s, p) => s + p, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('handles empty buckets array', () => {
      const { template, percentages } = buildTemplateFromBuckets([], []);

      expect(percentages).toHaveLength(0);
      expect(template).toBe('');
    });

    it('adjusts final bucket to ensure exact 100%', () => {
      const buckets = [
        createBucket(70, 72, '71'),
        createBucket(73, 75, '74'),
        createBucket(76, null, '76+'),
      ];

      // Probabilities that might cause rounding issues
      const distribution = [
        { age: 70, probability: 0.333 },
        { age: 71, probability: 0.333 },
        { age: 72, probability: 0.333 },
        { age: 73, probability: 0.0001 },
        { age: 74, probability: 0.0001 },
        { age: 75, probability: 0.0001 },
        { age: 76, probability: 0.0007 },
      ];

      const { template } = buildTemplateFromBuckets(buckets, distribution);

      // Parse percentages from template
      const parts = template.split(' ').map((p) => parseFloat(p));
      const sum = parts.reduce((s, p) => s + p, 0);

      // Should sum to exactly 100%
      expect(sum).toBeCloseTo(100, 2);
    });
  });

  describe('Cell dimensions calculation', () => {
    /**
     * Calculate cell dimensions based on container size and percentages.
     */
    function calculateCellDimensions(
      containerWidth: number,
      containerHeight: number,
      rowPercentages: number[],
      columnPercentages: number[]
    ): { width: number; height: number }[][] {
      return rowPercentages.map((rowPct) =>
        columnPercentages.map((colPct) => ({
          width: containerWidth * colPct,
          height: containerHeight * rowPct,
        }))
      );
    }

    it('calculates cell dimensions from percentages', () => {
      const containerWidth = 1000;
      const containerHeight = 900;
      const rowPercentages = [0.25, 0.25, 0.25, 0.25];
      const columnPercentages = [0.5, 0.5];

      const dimensions = calculateCellDimensions(
        containerWidth,
        containerHeight,
        rowPercentages,
        columnPercentages
      );

      expect(dimensions).toHaveLength(4); // 4 rows
      expect(dimensions[0]).toHaveLength(2); // 2 columns

      // First cell
      expect(dimensions[0][0].width).toBe(500); // 1000 * 0.5
      expect(dimensions[0][0].height).toBe(225); // 900 * 0.25
    });

    it('handles non-uniform percentages', () => {
      const containerWidth = 1000;
      const containerHeight = 900;
      const rowPercentages = [0.1, 0.3, 0.6]; // Different probabilities
      const columnPercentages = [0.2, 0.8];

      const dimensions = calculateCellDimensions(
        containerWidth,
        containerHeight,
        rowPercentages,
        columnPercentages
      );

      // First row, first column
      expect(dimensions[0][0].width).toBe(200);
      expect(dimensions[0][0].height).toBe(90);

      // Third row, second column (largest cell)
      expect(dimensions[2][1].width).toBe(800);
      expect(dimensions[2][1].height).toBe(540);
    });
  });
});
