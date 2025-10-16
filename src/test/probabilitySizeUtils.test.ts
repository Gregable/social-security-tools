import { describe, expect, it } from 'vitest';
import { calculateGridTemplates } from '$lib/strategy/ui';

describe('calculateGridTemplates', () => {
  const testCases = [
    {
      deathAgeRange: [70, 72, 74, 76],
      probDistribution: [
        // Give equal probability to the first 4 segments (70-71, 72-73, 74-75, 76-77)
        { age: 70, probability: 0.1 },
        { age: 71, probability: 0.1 },
        { age: 72, probability: 0.1 },
        { age: 73, probability: 0.1 },
        { age: 74, probability: 0.1 },
        { age: 75, probability: 0.1 },
        { age: 76, probability: 0.1 },
        { age: 77, probability: 0.1 },
        // No probability for remaining ages
        ...Array.from({ length: 43 }, (_, i) => ({
          age: i + 78,
          probability: 0,
        })),
      ],
      expected: '25.00% 25.00% 25.00% 25.00%',
    },
    {
      deathAgeRange: [80, 82],
      probDistribution: [
        // All probability in first segment (80-81)
        { age: 80, probability: 1.0 },
        { age: 81, probability: 0.0 },
        // No probability for remaining ages
        ...Array.from({ length: 39 }, (_, i) => ({
          age: i + 82,
          probability: 0,
        })),
      ],
      expected: '100.00% 0.00%',
    },
    {
      deathAgeRange: [62, 64, 66, 68, 70],
      probDistribution: [
        { age: 62, probability: 0.1 },
        { age: 63, probability: 0.1 },
        { age: 64, probability: 0.1 },
        { age: 65, probability: 0.1 },
        { age: 66, probability: 0.1 },
        { age: 67, probability: 0.1 },
        { age: 68, probability: 0.1 },
        { age: 69, probability: 0.1 },
        { age: 70, probability: 0.2 },
      ],
      expected: '20.00% 20.00% 20.00% 20.00% 20.00%',
    },
  ];

  testCases.forEach(({ deathAgeRange, probDistribution, expected }) => {
    it(`should return "${expected}" for deathAgeRange ${deathAgeRange}`, () => {
      const result = calculateGridTemplates(deathAgeRange, probDistribution);
      expect(result).toBe(expected);
    });
  });
});
