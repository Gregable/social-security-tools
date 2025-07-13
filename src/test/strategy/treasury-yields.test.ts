import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchLatest20YearTreasuryYield,
  fetchFredDFII20Yield,
  getRecommendedDiscountRate,
} from '$lib/strategy/data';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock DOMParser
class MockDOMParser {
  parseFromString(text: string, type: string) {
    return {
      getElementsByTagName: (tag: string) => {
        if (tag === 'entry') {
          return [
            {
              getElementsByTagName: (innerTag: string) => {
                if (innerTag === 'm:properties') {
                  return [
                    {
                      getElementsByTagName: (deepTag: string) => {
                        if (deepTag === 'd:NEW_DATE') {
                          return [{ textContent: '2025-06-27' }];
                        } else if (deepTag === 'd:TC_20YEAR') {
                          return [{ textContent: '3.5' }];
                        }
                        return [];
                      },
                    },
                  ];
                }
                return [];
              },
            },
          ];
        }
        return [];
      },
    };
  }
}

global.DOMParser = MockDOMParser as any;

describe('Treasury Yields Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful response
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<xml>Mock XML</xml>'),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchLatest20YearTreasuryYield', () => {
    it('should fetch and parse treasury yield data correctly', async () => {
      const result = await fetchLatest20YearTreasuryYield();

      // Verify fetch was called with the correct URL pattern
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain(
        'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml'
      );
      expect(fetchUrl).toContain('data=daily_treasury_real_yield_curve');

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.date).toBe('2025-06-27');
      expect(result.rate).toBe(0.035); // 3.5% converted to decimal
    });

    it('should handle fetch errors gracefully', async () => {
      // Mock a failed fetch
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await fetchLatest20YearTreasuryYield();

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.rate).toBe(0.025); // Default to 2.5%
    });

    it('should handle API response errors gracefully', async () => {
      // Mock a non-OK response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve(''), // Add mock text() method
      });

      const result = await fetchLatest20YearTreasuryYield();

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch Treasury data: 404 Not Found');
      expect(result.rate).toBe(0.025); // Default to 2.5%
    });
  });

  describe('fetchFredDFII20Yield', () => {
    it('should fetch and parse FRED DFII20 data correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve('DATE,DFII20\n2024-01-01,1.5\n2024-06-27,2.0'),
      });

      const result = await fetchFredDFII20Yield();

      expect(result.success).toBe(true);
      expect(result.date).toBe('2024-06-27');
      expect(result.rate).toBe(0.02); // 2.0 converted to decimal
    });

    it('should handle FRED fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('FRED network error'));

      const result = await fetchFredDFII20Yield();

      expect(result.success).toBe(false);
      expect(result.error).toBe('FRED network error');
      expect(result.rate).toBe(0.025); // Default to 2.5%
    });

    it('should handle FRED data not found gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('DATE,DFII20\n'), // No data lines
      });

      const result = await fetchFredDFII20Yield();

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'FRED DFII20 data not found or is invalid in the response'
      );
      expect(result.rate).toBe(0.025); // Default to 2.5%
    });
  });

  describe('getRecommendedDiscountRate', () => {
    it('should return the treasury yield rate when fetch is successful', async () => {
      const rate = await getRecommendedDiscountRate();

      expect(rate).toBe(0.035); // 3.5% converted to decimal
    });

    it('should fallback to FRED data when treasury fetch fails', async () => {
      // Mock Treasury fetch to fail
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      // Mock FRED fetch to succeed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('DATE,DFII20\n2024-06-27,2.1'),
      });

      const rate = await getRecommendedDiscountRate();

      expect(rate).toBe(0.021); // 2.1% converted to decimal from FRED
    });

    it('should return the default rate when both treasury and FRED fetch fail', async () => {
      // Mock Treasury fetch to fail
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      // Mock FRED fetch to fail
      mockFetch.mockRejectedValueOnce(new Error('FRED network error'));

      const rate = await getRecommendedDiscountRate();

      expect(rate).toBe(0.025); // Default to 2.5%
    });
  });
});
