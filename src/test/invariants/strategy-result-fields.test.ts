/**
 * StrategyResult dynamic field access safety tests.
 *
 * UI code accesses StrategyResult fields via string interpolation like
 * `filingAge${recipientIndex + 1}Years`. TypeScript cannot catch if field
 * names change, so these tests document and verify the expected field names.
 */
import { describe, expect, it } from 'vitest';
import type { StrategyResult } from '$lib/strategy/ui/calculation-results';

describe('StrategyResult field access invariants', () => {
  // These are the fields accessed via dynamic string interpolation in UI code
  const DYNAMIC_FIELD_NAMES = [
    'filingAge1Years',
    'filingAge1Months',
    'filingAge2Years',
    'filingAge2Months',
    'deathAge1',
    'deathAge2',
    'bucket1',
    'bucket2',
    'deathProb1',
    'deathProb2',
  ] as const;

  describe('Field name pattern verification', () => {
    it('recipientIndex 0 should map to field suffix "1"', () => {
      const recipientIndex = 0;
      const yearsField = `filingAge${recipientIndex + 1}Years`;
      const monthsField = `filingAge${recipientIndex + 1}Months`;

      expect(yearsField).toBe('filingAge1Years');
      expect(monthsField).toBe('filingAge1Months');
      expect(DYNAMIC_FIELD_NAMES).toContain(yearsField);
      expect(DYNAMIC_FIELD_NAMES).toContain(monthsField);
    });

    it('recipientIndex 1 should map to field suffix "2"', () => {
      const recipientIndex = 1;
      const yearsField = `filingAge${recipientIndex + 1}Years`;
      const monthsField = `filingAge${recipientIndex + 1}Months`;

      expect(yearsField).toBe('filingAge2Years');
      expect(monthsField).toBe('filingAge2Months');
      expect(DYNAMIC_FIELD_NAMES).toContain(yearsField);
      expect(DYNAMIC_FIELD_NAMES).toContain(monthsField);
    });
  });

  describe('StrategyResult interface compatibility', () => {
    it('should be able to create a valid StrategyResult with required fields', () => {
      // This verifies the interface shape hasn't changed
      const mockBucket = {
        label: '85',
        midAge: 85,
        startAge: 83,
        endAgeInclusive: 87,
        probability: 0.1,
        expectedAge: { asMonths: () => 1020 } as any,
      };
      const mockResult: StrategyResult = {
        deathAge1: '85',
        bucket1: mockBucket,
        filingAge1: {
          asMonths: () => 804,
          years: () => 67,
          modMonths: () => 0,
        } as any,
        totalBenefit: { value: () => 100000 } as any,
        filingAge1Years: 67,
        filingAge1Months: 0,
      };

      expect(mockResult.filingAge1Years).toBe(67);
      expect(mockResult.filingAge1Months).toBe(0);
      expect(mockResult.deathAge1).toBe('85');
    });

    it('should be able to create a StrategyResult with all optional fields', () => {
      const mockBucket1 = {
        label: '85',
        midAge: 85,
        startAge: 83,
        endAgeInclusive: 87,
        probability: 0.1,
        expectedAge: { asMonths: () => 1020 } as any,
      };
      const mockBucket2 = {
        label: '90',
        midAge: 90,
        startAge: 88,
        endAgeInclusive: 92,
        probability: 0.08,
        expectedAge: { asMonths: () => 1080 } as any,
      };
      const mockResult: StrategyResult = {
        deathAge1: '85',
        deathAge2: '90',
        bucket1: mockBucket1,
        bucket2: mockBucket2,
        filingAge1: {
          asMonths: () => 804,
          years: () => 67,
          modMonths: () => 0,
        } as any,
        filingAge2: {
          asMonths: () => 792,
          years: () => 66,
          modMonths: () => 0,
        } as any,
        totalBenefit: { value: () => 200000 } as any,
        filingAge1Years: 67,
        filingAge1Months: 0,
        filingAge2Years: 66,
        filingAge2Months: 0,
        deathProb1: 0.5,
        deathProb2: 0.4,
      };

      expect(mockResult.filingAge2Years).toBe(66);
      expect(mockResult.filingAge2Months).toBe(0);
      expect(mockResult.deathAge2).toBe('90');
      expect(mockResult.deathProb1).toBe(0.5);
      expect(mockResult.deathProb2).toBe(0.4);
    });
  });

  describe('Dynamic access simulation', () => {
    it('dynamic field access should work with bracket notation', () => {
      const mockResult: Record<string, any> = {
        filingAge1Years: 67,
        filingAge1Months: 0,
        filingAge2Years: 66,
        filingAge2Months: 6,
      };

      // Simulate the UI code's dynamic field access pattern
      for (const recipientIndex of [0, 1]) {
        const yearsField = `filingAge${recipientIndex + 1}Years`;
        const monthsField = `filingAge${recipientIndex + 1}Months`;

        expect(mockResult[yearsField]).toBeDefined();
        expect(mockResult[monthsField]).toBeDefined();
      }
    });
  });
});
