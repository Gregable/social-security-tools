import { describe, expect, it } from 'vitest';
import {
  calculateAgeRangePercentages,
  formatPercentagesToCssGridTemplate,
  generateDeathAgeRange,
  generateOneYearBuckets,
  generateThreeYearBuckets,
} from '$lib/strategy/ui/grid-sizing';

/**
 * Tests for grid sizing utility functions.
 */

describe('grid-sizing', () => {
  describe('calculateAgeRangePercentages', () => {
    it('calculates percentages for evenly distributed probabilities', () => {
      const deathAgeRange = [62, 65, 68];
      const probDistribution = [
        { age: 62, probability: 0.1 },
        { age: 63, probability: 0.1 },
        { age: 64, probability: 0.1 },
        { age: 65, probability: 0.1 },
        { age: 66, probability: 0.1 },
        { age: 67, probability: 0.1 },
        { age: 68, probability: 0.4 }, // Last segment gets remaining
      ];

      const percentages = calculateAgeRangePercentages(
        deathAgeRange,
        probDistribution
      );

      expect(percentages).toHaveLength(3);
      // First segment: ages 62-64 = 0.3 / 1.0 = 0.3
      expect(percentages[0]).toBeCloseTo(0.3, 2);
      // Second segment: ages 65-67 = 0.3 / 1.0 = 0.3
      expect(percentages[1]).toBeCloseTo(0.3, 2);
    });

    it('handles single age range (100%)', () => {
      const deathAgeRange = [70];
      const probDistribution = [
        { age: 70, probability: 0.5 },
        { age: 80, probability: 0.5 },
      ];

      const percentages = calculateAgeRangePercentages(
        deathAgeRange,
        probDistribution
      );

      expect(percentages).toHaveLength(1);
      // Single element returns 100 (the implementation ensures last element makes sum = 100)
      expect(percentages[0]).toBeCloseTo(100, 2);
    });

    it('handles non-uniform probability distribution', () => {
      const deathAgeRange = [62, 70, 80];
      const probDistribution = [
        { age: 62, probability: 0.01 },
        { age: 70, probability: 0.05 },
        { age: 80, probability: 0.94 },
      ];

      const percentages = calculateAgeRangePercentages(
        deathAgeRange,
        probDistribution
      );

      expect(percentages).toHaveLength(3);
      // Very low probability for young ages
      expect(percentages[0]).toBeLessThan(0.1);
    });

    it('ensures percentages sum to approximately 100', () => {
      const deathAgeRange = [62, 65, 70, 80, 90];
      const probDistribution = Array.from({ length: 50 }, (_, i) => ({
        age: 60 + i,
        probability: 0.02,
      }));

      const percentages = calculateAgeRangePercentages(
        deathAgeRange,
        probDistribution
      );

      const sum = percentages.reduce((s, p) => s + p, 0);
      // The implementation adjusts the last element to make sum = 100
      expect(sum).toBeCloseTo(100, 1);
    });
  });

  describe('formatPercentagesToCssGridTemplate', () => {
    it('formats percentages to CSS grid template string', () => {
      const percentages = [0.25, 0.25, 0.25, 0.25];
      const template = formatPercentagesToCssGridTemplate(percentages);

      expect(template).toBe('25.00% 25.00% 25.00% 25.00%');
    });

    it('handles non-uniform percentages', () => {
      const percentages = [0.1, 0.3, 0.6];
      const template = formatPercentagesToCssGridTemplate(percentages);

      expect(template).toBe('10.00% 30.00% 60.00%');
    });

    it('adjusts final percentage to ensure 100% total', () => {
      // Percentages that would cause rounding issues
      const percentages = [0.333333, 0.333333, 0.333334];
      const template = formatPercentagesToCssGridTemplate(percentages);

      // Parse the template and verify sum
      const parts = template.split(' ').map((p) => parseFloat(p));
      const sum = parts.reduce((s, p) => s + p, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('handles single percentage', () => {
      const percentages = [1.0];
      const template = formatPercentagesToCssGridTemplate(percentages);

      expect(template).toBe('100.00%');
    });

    it('handles empty array', () => {
      const percentages: number[] = [];
      const template = formatPercentagesToCssGridTemplate(percentages);

      expect(template).toBe('');
    });
  });

  describe('generateDeathAgeRange', () => {
    it('generates range from start age to 100 with step of 2', () => {
      const range = generateDeathAgeRange(62);

      expect(range[0]).toBe(62);
      expect(range[range.length - 1]).toBe(100);
      // Every other age
      expect(range).toContain(64);
      expect(range).toContain(70);
      expect(range).toContain(80);
      expect(range).toContain(90);
    });

    it('generates correct number of ages', () => {
      const range = generateDeathAgeRange(62);
      // 62, 64, 66, 68, 70, ..., 100 = (100 - 62) / 2 + 1 = 20
      expect(range).toHaveLength(20);
    });

    it('handles starting age above 62', () => {
      const range = generateDeathAgeRange(70);

      expect(range[0]).toBe(70);
      expect(range).toHaveLength(16); // 70, 72, ..., 100
    });

    it('handles odd starting age', () => {
      const range = generateDeathAgeRange(63);

      expect(range[0]).toBe(63);
      expect(range[1]).toBe(65);
    });
  });

  describe('generateThreeYearBuckets', () => {
    const uniformDistribution = Array.from({ length: 50 }, (_, i) => ({
      age: 60 + i,
      probability: 0.02,
    }));

    it('creates buckets with 3-year spans', () => {
      const buckets = generateThreeYearBuckets(62, uniformDistribution);

      // First bucket: 62-64 with label '63'
      expect(buckets[0].startAge).toBe(62);
      expect(buckets[0].endAgeInclusive).toBe(64);
      expect(buckets[0].label).toBe('63');
      expect(buckets[0].midAge).toBe(63);
    });

    it('creates final open-ended bucket', () => {
      const buckets = generateThreeYearBuckets(62, uniformDistribution);
      const lastBucket = buckets[buckets.length - 1];

      expect(lastBucket.endAgeInclusive).toBeNull();
      expect(lastBucket.label).toMatch(/\d+\+$/); // e.g., '101+'
    });

    it('calculates probability for each bucket', () => {
      const buckets = generateThreeYearBuckets(62, uniformDistribution);

      // Each 3-year bucket should have probability of 3 * 0.02 = 0.06
      expect(buckets[0].probability).toBeCloseTo(0.06, 2);
    });

    it('calculates expected age for each bucket', () => {
      const buckets = generateThreeYearBuckets(62, uniformDistribution);

      // Expected age should be midAge + 0.5 in months
      // For bucket 62-64 with midAge 63, expected is ~63.5 * 12 = 762 months
      const expectedMonths = buckets[0].expectedAge.asMonths();
      expect(expectedMonths).toBeCloseTo(63.5 * 12, 0);
    });

    it('generates contiguous buckets', () => {
      const buckets = generateThreeYearBuckets(62, uniformDistribution);

      for (let i = 0; i < buckets.length - 2; i++) {
        // End of bucket i + 1 should equal start of bucket i+1
        expect(buckets[i].endAgeInclusive! + 1).toBe(buckets[i + 1].startAge);
      }
    });
  });

  describe('generateOneYearBuckets', () => {
    const uniformDistribution = Array.from({ length: 50 }, (_, i) => ({
      age: 60 + i,
      probability: 0.02,
    }));

    it('creates buckets with 1-year spans', () => {
      const buckets = generateOneYearBuckets(62, uniformDistribution);

      // First bucket: 62 only with label '62'
      expect(buckets[0].startAge).toBe(62);
      expect(buckets[0].endAgeInclusive).toBe(62);
      expect(buckets[0].label).toBe('62');
    });

    it('creates final open-ended bucket at age 100', () => {
      const buckets = generateOneYearBuckets(62, uniformDistribution);
      const lastBucket = buckets[buckets.length - 1];

      expect(lastBucket.startAge).toBe(100);
      expect(lastBucket.endAgeInclusive).toBeNull();
      expect(lastBucket.label).toBe('100+');
    });

    it('creates correct number of buckets', () => {
      const buckets = generateOneYearBuckets(62, uniformDistribution);

      // 62-99 inclusive = 38 buckets + 1 open-ended = 39
      expect(buckets).toHaveLength(39);
    });

    it('calculates probability for single-year bucket', () => {
      const buckets = generateOneYearBuckets(62, uniformDistribution);

      // Each 1-year bucket should have probability of 0.02
      expect(buckets[0].probability).toBeCloseTo(0.02, 3);
    });
  });

  describe('Integration: bucket to template', () => {
    it('generates valid CSS template from three-year buckets', () => {
      const distribution = Array.from({ length: 50 }, (_, i) => ({
        age: 60 + i,
        probability: 0.02,
      }));

      const buckets = generateThreeYearBuckets(62, distribution);
      const percentages = buckets.map((b) => b.probability);
      const normalized = percentages.map(
        (p) => p / percentages.reduce((s, v) => s + v, 0)
      );
      const template = formatPercentagesToCssGridTemplate(normalized);

      // Should be space-separated percentages
      expect(template).toMatch(/^[\d.]+%(\s[\d.]+%)*$/);

      // Parse and verify sum
      const parts = template.split(' ').map((p) => parseFloat(p));
      const sum = parts.reduce((s, p) => s + p, 0);
      expect(sum).toBeCloseTo(100, 1);
    });
  });
});
