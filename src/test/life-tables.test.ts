import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DataNotFoundError,
  getCurrentAge,
  getDeathProbabilityDistribution,
  getLifeTableData,
  isLifeTableDataAvailable,
  LifeTableError,
} from '$lib/life-tables';

// Helper to build a minimal recipient-like object without importing Recipient (avoids potential circular deps in unit tests)
function makeRecipient(
  gender: 'male' | 'female' | 'blended',
  birthYear: number,
  healthMultiplier = 1.0
) {
  return {
    gender,
    healthMultiplier,
    birthdate: { layBirthYear: () => birthYear },
  } as const;
}

// Mock fetch globally
global.fetch = vi.fn();

describe('Life Tables', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Input Validation', () => {
    it('throws error for invalid gender', async () => {
      await expect(getLifeTableData('invalid' as any, 1980)).rejects.toThrow(
        LifeTableError
      );
    });

    it('throws error for invalid birth year', async () => {
      await expect(getLifeTableData('male', 1800)).rejects.toThrow(
        LifeTableError
      );
    });

    it('throws error for future birth year beyond reasonable bounds', async () => {
      await expect(getLifeTableData('female', 2200)).rejects.toThrow(
        LifeTableError
      );
    });
  });

  describe('Data Fetching', () => {
    it('fetches male data successfully', async () => {
      const mockData = [
        { x: 0, q_x: 0.01 },
        { x: 1, q_x: 0.02 },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await getLifeTableData('male', 1980);

      expect(result).toEqual([
        { age: 0, mortalityRate: 0.01 },
        { age: 1, mortalityRate: 0.02 },
      ]);
    });

    it('throws DataNotFoundError when data is not available', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(getLifeTableData('male', 1980)).rejects.toThrow(
        DataNotFoundError
      );
    });

    it('blends male and female data correctly', async () => {
      const maleData = [{ x: 25, q_x: 0.1 }];
      const femaleData = [{ x: 25, q_x: 0.2 }];

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(maleData),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(femaleData),
        } as Response);

      const result = await getLifeTableData('blended', 1980);

      expect(result).toEqual([
        expect.objectContaining({
          age: 25,
          mortalityRate: expect.closeTo(0.15),
        }), // Average of 0.1 and 0.2
      ]);
    });
  });

  describe('Death Probability Distribution', () => {
    it('calculates probabilities correctly', async () => {
      const mockData = [
        { x: 25, q_x: 0.1 },
        { x: 26, q_x: 0.2 },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await getDeathProbabilityDistribution(
        makeRecipient('male', 2000),
        2025
      );

      expect(result).toHaveLength(3); // Ages 25, 26, plus age 120
      expect(result[0]).toEqual({ age: 25, probability: expect.closeTo(0.1) });
      expect(result[1]).toEqual({ age: 26, probability: expect.closeTo(0.18) }); // 0.9 * 0.2
      expect(result[2]).toEqual({
        age: 120,
        probability: expect.closeTo(0.72),
      }); // 0.9 * 0.8

      // Verify probabilities sum to 1
      const total = result.reduce((sum, entry) => sum + entry.probability, 0);
      expect(total).toBeCloseTo(1.0);
    });

    it('throws error for negative current age', async () => {
      await expect(
        getDeathProbabilityDistribution(makeRecipient('male', 2030), 2025) // Born in future
      ).rejects.toThrow(LifeTableError);
    });

    it('throws error when life table data is not available', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(
        getDeathProbabilityDistribution(makeRecipient('male', 1980), 2025)
      ).rejects.toThrow(DataNotFoundError);
    });
  });

  describe('Utility Functions', () => {
    it('calculates current age correctly', () => {
      expect(getCurrentAge(1980, 2025)).toBe(45);
      expect(getCurrentAge(2000)).toBe(25); // Uses current year
    });

    it('checks data availability', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      const available = await isLifeTableDataAvailable('male', 1980);
      expect(available).toBe(true);
    });

    it('returns false for unavailable data', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const available = await isLifeTableDataAvailable('male', 1980);
      expect(available).toBe(false);
    });
  });
});
