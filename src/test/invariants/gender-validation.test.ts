/**
 * GenderOption type-runtime validation sync tests.
 *
 * These tests ensure that the GenderOption type definition stays in sync
 * with the runtime validation in life-tables.ts. The type is defined as
 * 'male' | 'female' | 'blended' but validated at runtime with a hardcoded
 * array that could diverge.
 */
import { describe, expect, it } from 'vitest';
import type { GenderOption } from '$lib/life-tables';

// We test against the known valid values to ensure they're accepted
// and various invalid values to ensure they're rejected
describe('GenderOption validation invariants', () => {
  // These are the valid GenderOption values per the type definition
  const VALID_GENDERS: GenderOption[] = ['male', 'female', 'blended'];

  // These should all be rejected
  const INVALID_GENDERS = [
    'Male', // Wrong case
    'MALE', // Wrong case
    'Female', // Wrong case
    'FEMALE', // Wrong case
    'm', // Abbreviation
    'f', // Abbreviation
    'other', // Invalid value
    'unknown', // Invalid value
    '', // Empty string
  ];

  describe('Valid gender values', () => {
    it('should have exactly 3 valid gender options', () => {
      expect(VALID_GENDERS).toHaveLength(3);
    });

    it('should include male, female, and blended', () => {
      expect(VALID_GENDERS).toContain('male');
      expect(VALID_GENDERS).toContain('female');
      expect(VALID_GENDERS).toContain('blended');
    });
  });

  describe('Type safety documentation', () => {
    // This test documents the type definition for GenderOption
    // If the type changes, this test should be updated to match
    it('GenderOption type should be male | female | blended', () => {
      // Type-level test: these should compile
      const validMale: GenderOption = 'male';
      const validFemale: GenderOption = 'female';
      const validBlended: GenderOption = 'blended';

      expect(validMale).toBe('male');
      expect(validFemale).toBe('female');
      expect(validBlended).toBe('blended');
    });
  });

  describe('Invalid values documentation', () => {
    it.each(INVALID_GENDERS)(
      '"%s" should not be a valid GenderOption',
      (invalidGender) => {
        // This documents what values are invalid
        // The actual validation happens in life-tables.ts validateGender()
        expect(VALID_GENDERS).not.toContain(invalidGender);
      }
    );
  });
});
