import { describe, it, expect } from "vitest";
import { calculateGridTemplates } from "../routes/strategy/utils/probabilitySizeUtils";

describe("calculateGridTemplates", () => {
  const testCases = [
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
      expected: "20.000% 20.000% 20.000% 20.000% 20.000%",
    },
    {
      deathAgeRange: [65, 70, 80, 90],
      probDistribution: Array.from({ length: 60 }, (_, i) => ({
        age: i + 62,
        probability: i * 0.01,
      })),
      expected: "1.415% 7.074% 12.733% 78.778%",
    },
    {
      deathAgeRange: [62, 65, 70, 90],
      probDistribution: [
        { age: 62, probability: 0.1 },
        { age: 63, probability: 0.2 },
        { age: 64, probability: 0.3 },
        { age: 65, probability: 0.4 },
        { age: 66, probability: 0.5 },
        { age: 67, probability: 0.6 },
        { age: 68, probability: 0.7 },
        { age: 69, probability: 0.8 },
        ...Array.from({ length: 81 }, (_, i) => ({
          age: i + 70,
          probability: 1,
        })),
      ],
      expected: "0.709% 3.546% 23.641% 72.104%",
    },
  ];

  testCases.forEach(({ deathAgeRange, probDistribution, expected }) => {
    it(`should return "${expected}" for deathAgeRange ${deathAgeRange}`, () => {
      const result = calculateGridTemplates(deathAgeRange, probDistribution);
      expect(result).toBe(expected);
    });
  });
});
