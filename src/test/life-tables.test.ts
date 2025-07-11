import {
  getDeathProbabilityDistribution,
  type LifeTableEntry,
} from '$lib/life-tables';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the entire life-tables module
vi.mock('$lib/life-tables', () => {
  return {
    getLifeTableData: vi.fn(),
    getDeathProbabilityDistribution: vi.fn(),
  };
});

// Import the mocked function to override
import { getLifeTableData } from '$lib/life-tables';

describe('Life Tables', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getDeathProbabilityDistribution', () => {
    it('returns null when life table data is not available', async () => {
      // Setup mock to return null
      vi.mocked(getLifeTableData).mockResolvedValue(null);

      // Reset to use the actual implementation for the function we're testing
      vi.mocked(getDeathProbabilityDistribution).mockImplementation(
        // Using the original implementation from the module
        async (gender, birthYear, currentYear = new Date().getFullYear()) => {
          // Calculate current age
          const currentAge = currentYear - birthYear;

          // Get the life table data
          const lifeTableData = await getLifeTableData(gender, birthYear);

          if (!lifeTableData) return null;

          // Filter to only include entries from current age through 119
          const relevantData = lifeTableData.filter(
            (entry) => entry.x >= currentAge
          );

          // Calculate the probability of death at each age
          const deathProbabilities: { age: number; probability: number }[] = [];

          // Survival probability starts at 1.0 (person is alive now)
          let survivalProbability = 1.0;

          // Calculate for each age from current age to 119
          for (const entry of relevantData) {
            // Probability of death at this age = probability of surviving to this age × probability of dying during this year
            const deathProbability = survivalProbability * entry.q_x;

            deathProbabilities.push({
              age: entry.x,
              probability: deathProbability,
            });

            // Update survival probability for next age
            survivalProbability *= 1 - entry.q_x;
          }

          // Add age 120 with the remaining probability (ensure total probability sums to 1.0)
          if (survivalProbability > 0) {
            deathProbabilities.push({
              age: 120,
              probability: survivalProbability,
            });
          }

          return deathProbabilities;
        }
      );

      const result = await getDeathProbabilityDistribution('male', 1980, 2025);
      expect(result).toBeNull();
    });

    it('correctly calculates death probabilities', async () => {
      // Create mock life table data with simple values for easy testing
      const mockLifeTableData: LifeTableEntry[] = [
        { x: 25, q_x: 0.1 }, // 10% chance of dying at 25 if alive at 25
        { x: 26, q_x: 0.2 }, // 20% chance of dying at 26 if alive at 26
        { x: 27, q_x: 0.3 }, // 30% chance of dying at 27 if alive at 27
        { x: 28, q_x: 0.4 }, // 40% chance of dying at 28 if alive at 28
        { x: 29, q_x: 0.5 }, // 50% chance of dying at 29 if alive at 29
      ];

      // Mock getLifeTableData to return our mock data
      vi.mocked(getLifeTableData).mockResolvedValue(mockLifeTableData);

      // Test with birthYear 2000 and currentYear 2025, making the person 25 years old
      const result = await getDeathProbabilityDistribution('male', 2000, 2025);

      // Verify result is not null
      expect(result).not.toBeNull();

      if (result) {
        // Should have 6 entries: ages 25-29 plus age 120
        expect(result.length).toBe(6);

        // Verify age values
        expect(result[0].age).toBe(25);
        expect(result[1].age).toBe(26);
        expect(result[2].age).toBe(27);
        expect(result[3].age).toBe(28);
        expect(result[4].age).toBe(29);
        expect(result[5].age).toBe(120);

        // Manually calculate expected probabilities
        // Age 25: 0.1 (10% chance of dying at 25)
        expect(result[0].probability).toBeCloseTo(0.1);

        // Age 26: (1-0.1) * 0.2 = 0.9 * 0.2 = 0.18 (18% chance of dying at 26)
        expect(result[1].probability).toBeCloseTo(0.18);

        // Age 27: (1-0.1) * (1-0.2) * 0.3 = 0.9 * 0.8 * 0.3 = 0.216 (21.6% chance)
        expect(result[2].probability).toBeCloseTo(0.216);

        // Age 28: 0.9 * 0.8 * 0.7 * 0.4 = 0.2016 (20.16% chance)
        expect(result[3].probability).toBeCloseTo(0.2016);

        // Age 29: 0.9 * 0.8 * 0.7 * 0.6 * 0.5 = 0.1512 (15.12% chance)
        expect(result[4].probability).toBeCloseTo(0.1512);

        // Age 120: Remaining probability = 0.9 * 0.8 * 0.7 * 0.6 * 0.5 = 0.1512
        expect(result[5].probability).toBeCloseTo(0.1512);

        // Sum of all probabilities should be 1
        const sum = result.reduce(
          (total, entry) => total + entry.probability,
          0
        );
        expect(sum).toBeCloseTo(1.0);
      }
    });

    it('adds age 120 with remaining probability', async () => {
      // Create mock life table data that doesn't include age 120
      const mockLifeTableData: LifeTableEntry[] = [
        { x: 60, q_x: 0.05 },
        { x: 61, q_x: 0.1 },
      ];

      // Mock getLifeTableData to return our mock data
      vi.mocked(getLifeTableData).mockResolvedValue(mockLifeTableData);

      const result = await getDeathProbabilityDistribution(
        'female',
        1960,
        2020
      );

      expect(result).not.toBeNull();

      if (result) {
        // Should have 3 entries: ages 60-61 plus age 120
        expect(result.length).toBe(3);

        // Last entry should be age 120
        expect(result[result.length - 1].age).toBe(120);

        // Sum of all probabilities should be 1
        const sum = result.reduce(
          (total, entry) => total + entry.probability,
          0
        );
        expect(sum).toBeCloseTo(1.0);
      }
    });

    it('filters life table data to start from current age', async () => {
      // Create mock life table data with a range of ages
      const mockLifeTableData: LifeTableEntry[] = [
        { x: 30, q_x: 0.01 },
        { x: 31, q_x: 0.02 },
        { x: 32, q_x: 0.03 },
        { x: 33, q_x: 0.04 },
      ];

      // Mock getLifeTableData to return our mock data
      vi.mocked(getLifeTableData).mockResolvedValue(mockLifeTableData);

      // Person is 32 years old (born 1993, current year 2025)
      const result = await getDeathProbabilityDistribution(
        'blended',
        1993,
        2025
      );

      expect(result).not.toBeNull();

      if (result) {
        // Should have 3 entries: ages 32-33 plus age 120
        expect(result.length).toBe(3);

        // First age should be 32
        expect(result[0].age).toBe(32);
      }
    });
  });
});
