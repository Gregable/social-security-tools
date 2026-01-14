import { describe, expect, it } from 'vitest';

/**
 * Tests for DiscountRateInput component logic.
 *
 * These tests focus on the validation function used in the component.
 */

/**
 * Validates a discount rate value and returns validation status.
 * Replicates the logic from DiscountRateInput.svelte
 */
function validateDiscountRate(value: number): {
  isValid: boolean;
  errorMessage: string;
} {
  if (Number.isNaN(value)) {
    return { isValid: false, errorMessage: 'Please enter a valid number' };
  } else if (value < 0) {
    return {
      isValid: false,
      errorMessage: 'Discount rate cannot be less than 0%',
    };
  } else if (value > 50) {
    return {
      isValid: false,
      errorMessage: 'Discount rate cannot exceed 50%',
    };
  }
  return { isValid: true, errorMessage: '' };
}

describe('DiscountRateInput', () => {
  describe('Discount rate validation', () => {
    it('accepts zero discount rate', () => {
      const result = validateDiscountRate(0);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBe('');
    });

    it('accepts typical treasury rate values', () => {
      expect(validateDiscountRate(2.5).isValid).toBe(true);
      expect(validateDiscountRate(3.0).isValid).toBe(true);
      expect(validateDiscountRate(4.5).isValid).toBe(true);
    });

    it('accepts stock expected return rate (3.5%)', () => {
      const result = validateDiscountRate(3.5);
      expect(result.isValid).toBe(true);
    });

    it('accepts stock historical return rate (7%)', () => {
      const result = validateDiscountRate(7);
      expect(result.isValid).toBe(true);
    });

    it('accepts maximum valid rate (50%)', () => {
      const result = validateDiscountRate(50);
      expect(result.isValid).toBe(true);
    });

    it('rejects negative rates', () => {
      const result = validateDiscountRate(-1);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Discount rate cannot be less than 0%');
    });

    it('rejects rates exceeding 50%', () => {
      const result = validateDiscountRate(51);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Discount rate cannot exceed 50%');
    });

    it('rejects extremely high rates', () => {
      const result = validateDiscountRate(100);
      expect(result.isValid).toBe(false);
    });

    it('rejects NaN values', () => {
      const result = validateDiscountRate(Number.NaN);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Please enter a valid number');
    });

    it('accepts decimal values with precision', () => {
      expect(validateDiscountRate(Math.PI).isValid).toBe(true);
      expect(validateDiscountRate(0.001).isValid).toBe(true);
      expect(validateDiscountRate(49.99).isValid).toBe(true);
    });
  });

  describe('Preset rate matching', () => {
    const presetRates = [
      { label: '20-year Treasury rate (2.5%)', value: 2.5 },
      { label: 'US Stock 10y expected (3.5%)', value: 3.5 },
      { label: 'US Stock historical (7%)', value: 7 },
    ];

    /**
     * Checks if a rate matches any preset value.
     */
    function matchesPreset(rate: number): boolean {
      return presetRates.some((preset) => preset.value === rate);
    }

    it('matches Treasury rate preset', () => {
      expect(matchesPreset(2.5)).toBe(true);
    });

    it('matches Stock 10y expected preset', () => {
      expect(matchesPreset(3.5)).toBe(true);
    });

    it('matches Stock historical preset', () => {
      expect(matchesPreset(7)).toBe(true);
    });

    it('does not match non-preset values', () => {
      expect(matchesPreset(5.0)).toBe(false);
      expect(matchesPreset(3.4)).toBe(false);
      expect(matchesPreset(7.1)).toBe(false);
    });

    it('requires exact match', () => {
      // Close but not exact
      expect(matchesPreset(2.50001)).toBe(false);
      expect(matchesPreset(3.49)).toBe(false);
    });
  });

  describe('Input parsing', () => {
    /**
     * Simulates the input parsing behavior from the component.
     */
    function parseInputValue(input: string): number {
      return Number.parseFloat(input) || 0;
    }

    it('parses valid numeric strings', () => {
      expect(parseInputValue('3.5')).toBe(3.5);
      expect(parseInputValue('7')).toBe(7);
      expect(parseInputValue('0.5')).toBe(0.5);
    });

    it('returns 0 for empty string', () => {
      expect(parseInputValue('')).toBe(0);
    });

    it('returns 0 for non-numeric strings', () => {
      expect(parseInputValue('abc')).toBe(0);
      expect(parseInputValue('--')).toBe(0);
    });

    it('parses leading decimal values', () => {
      expect(parseInputValue('.5')).toBe(0.5);
    });

    it('ignores trailing non-numeric characters', () => {
      expect(parseInputValue('3.5%')).toBe(3.5);
      expect(parseInputValue('7 percent')).toBe(7);
    });
  });
});
