import { describe, expect, it } from 'vitest';

/**
 * Tests for RecipientInputs component logic.
 *
 * These tests focus on the validation and conversion functions used in the
 * RecipientInputs component. The actual functions are replicated here since
 * they're defined inline in the Svelte component.
 */

/**
 * Validates a PIA value and returns validation status.
 * Replicates the logic from RecipientInputs.svelte
 */
function validatePia(value: number): {
  isValid: boolean;
  errorMessage: string;
} {
  if (value < 0) {
    return {
      isValid: false,
      errorMessage: 'PIA must be a non-negative number',
    };
  } else if (value > 10000) {
    return {
      isValid: false,
      errorMessage:
        'PIA seems unusually high (max typical value is around $4,000)',
    };
  }
  return { isValid: true, errorMessage: '' };
}

/**
 * Converts health multiplier to slider value.
 * Slider goes from 0.7 (worse health) to 2.5 (better health on right).
 * Multiplier: 0.7 = best health, 2.5 = worst health.
 * Replicates the logic from RecipientInputs.svelte
 */
function healthMultiplierToSliderValue(healthMultiplier: number): number {
  return 3.2 - healthMultiplier;
}

/**
 * Converts slider value back to health multiplier.
 * Replicates the inverse of the slider-to-multiplier logic.
 */
function sliderValueToHealthMultiplier(sliderValue: number): number {
  const healthMultiplier = 3.2 - sliderValue;
  return Math.max(0.7, Math.min(2.5, healthMultiplier));
}

/**
 * Returns the health category label for a given health multiplier.
 * Replicates the logic from RecipientInputs.svelte
 */
function getHealthCategory(multiplier: number): string {
  const anchors: { value: number; label: string }[] = [
    { value: 0.7, label: 'Exceptional Health' },
    { value: 0.8, label: 'Excellent Health' },
    { value: 0.9, label: 'Good Health' },
    { value: 1.0, label: 'Average Health' },
    { value: 1.3, label: 'Fair Health' },
    { value: 1.7, label: 'Poor Health' },
    { value: 2.5, label: 'Very Poor Health' },
  ];
  let best = anchors[0];
  for (const a of anchors) {
    if (Math.abs(a.value - multiplier) < Math.abs(best.value - multiplier)) {
      best = a;
    }
  }
  return best.label;
}

describe('RecipientInputs', () => {
  describe('PIA validation', () => {
    it('accepts valid PIA of $0', () => {
      const result = validatePia(0);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBe('');
    });

    it('accepts typical PIA values in the range $500-$4000', () => {
      expect(validatePia(500).isValid).toBe(true);
      expect(validatePia(1500).isValid).toBe(true);
      expect(validatePia(2500).isValid).toBe(true);
      expect(validatePia(4000).isValid).toBe(true);
    });

    it('accepts maximum typical PIA value of $10000', () => {
      const result = validatePia(10000);
      expect(result.isValid).toBe(true);
    });

    it('rejects negative PIA values', () => {
      const result = validatePia(-100);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('PIA must be a non-negative number');
    });

    it('rejects PIA values above $10000', () => {
      const result = validatePia(10001);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('unusually high');
    });

    it('rejects extremely high PIA values', () => {
      const result = validatePia(50000);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Health multiplier to slider value conversion', () => {
    it('converts exceptional health (0.7) to rightmost slider position (2.5)', () => {
      // 3.2 - 0.7 = 2.5 (slider value, representing "better health")
      expect(healthMultiplierToSliderValue(0.7)).toBe(2.5);
    });

    it('converts average health (1.0) to middle-right slider position (2.2)', () => {
      expect(healthMultiplierToSliderValue(1.0)).toBe(2.2);
    });

    it('converts poor health (1.7) to middle-left slider position (1.5)', () => {
      expect(healthMultiplierToSliderValue(1.7)).toBeCloseTo(1.5);
    });

    it('converts very poor health (2.5) to leftmost slider position (0.7)', () => {
      expect(healthMultiplierToSliderValue(2.5)).toBeCloseTo(0.7);
    });

    it('is reversible (round-trip conversion)', () => {
      const originalMultiplier = 1.3;
      const sliderValue = healthMultiplierToSliderValue(originalMultiplier);
      const recovered = sliderValueToHealthMultiplier(sliderValue);
      expect(recovered).toBeCloseTo(originalMultiplier);
    });
  });

  describe('Slider value to health multiplier conversion', () => {
    it('clamps result to minimum of 0.7', () => {
      // If slider value is 3.0, multiplier would be 0.2, but clamped to 0.7
      expect(sliderValueToHealthMultiplier(3.0)).toBe(0.7);
    });

    it('clamps result to maximum of 2.5', () => {
      // If slider value is 0.5, multiplier would be 2.7, but clamped to 2.5
      expect(sliderValueToHealthMultiplier(0.5)).toBe(2.5);
    });

    it('handles valid slider values without clamping', () => {
      expect(sliderValueToHealthMultiplier(2.2)).toBeCloseTo(1.0);
      expect(sliderValueToHealthMultiplier(1.5)).toBeCloseTo(1.7);
    });
  });

  describe('Health category labels', () => {
    it('returns "Exceptional Health" for 0.7 multiplier', () => {
      expect(getHealthCategory(0.7)).toBe('Exceptional Health');
    });

    it('returns "Excellent Health" for 0.8 multiplier', () => {
      expect(getHealthCategory(0.8)).toBe('Excellent Health');
    });

    it('returns "Good Health" for 0.9 multiplier', () => {
      expect(getHealthCategory(0.9)).toBe('Good Health');
    });

    it('returns "Average Health" for 1.0 multiplier', () => {
      expect(getHealthCategory(1.0)).toBe('Average Health');
    });

    it('returns "Fair Health" for 1.3 multiplier', () => {
      expect(getHealthCategory(1.3)).toBe('Fair Health');
    });

    it('returns "Poor Health" for 1.7 multiplier', () => {
      expect(getHealthCategory(1.7)).toBe('Poor Health');
    });

    it('returns "Very Poor Health" for 2.5 multiplier', () => {
      expect(getHealthCategory(2.5)).toBe('Very Poor Health');
    });

    it('finds closest category for intermediate values', () => {
      // 0.75 is closer to 0.7 than 0.8
      expect(getHealthCategory(0.75)).toBe('Exceptional Health');
      // 0.85 is equidistant from 0.8 and 0.9, picks first (Excellent Health)
      expect(getHealthCategory(0.85)).toBe('Excellent Health');
      // 1.15 is closer to 1.0 than 1.3
      expect(getHealthCategory(1.15)).toBe('Average Health');
      // 1.5 is closer to 1.3 than 1.7
      expect(getHealthCategory(1.5)).toBe('Fair Health');
      // 2.0 is closer to 1.7 than 2.5
      expect(getHealthCategory(2.0)).toBe('Poor Health');
    });
  });

  describe('Overall form validity', () => {
    /**
     * Replicates the isValid reactive calculation from the component.
     */
    function calculateFormValidity(
      isSingle: boolean,
      birthdateValidity: boolean[],
      piaValidity: boolean[]
    ): boolean {
      if (isSingle) {
        return birthdateValidity[0] && piaValidity[0];
      }
      return (
        birthdateValidity[0] &&
        birthdateValidity[1] &&
        piaValidity[0] &&
        piaValidity[1]
      );
    }

    it('is valid when all fields are valid in couple mode', () => {
      expect(calculateFormValidity(false, [true, true], [true, true])).toBe(
        true
      );
    });

    it('is invalid when any birthdate is invalid in couple mode', () => {
      expect(calculateFormValidity(false, [false, true], [true, true])).toBe(
        false
      );
      expect(calculateFormValidity(false, [true, false], [true, true])).toBe(
        false
      );
    });

    it('is invalid when any PIA is invalid in couple mode', () => {
      expect(calculateFormValidity(false, [true, true], [false, true])).toBe(
        false
      );
      expect(calculateFormValidity(false, [true, true], [true, false])).toBe(
        false
      );
    });

    it('only checks first recipient in single mode', () => {
      // Second recipient invalid but isSingle=true, so form is still valid
      expect(calculateFormValidity(true, [true, false], [true, false])).toBe(
        true
      );
    });

    it('is invalid when first recipient is invalid in single mode', () => {
      expect(calculateFormValidity(true, [false, true], [true, true])).toBe(
        false
      );
      expect(calculateFormValidity(true, [true, true], [false, true])).toBe(
        false
      );
    });
  });
});
