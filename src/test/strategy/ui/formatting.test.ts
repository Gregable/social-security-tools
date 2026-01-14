import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import {
  createBorderRemovalFunctions,
  getFilingAge,
  getFilingDate,
} from '$lib/strategy/ui/formatting';

/**
 * Tests for formatting utility functions.
 */

describe('formatting', () => {
  describe('getFilingAge', () => {
    it('shows only years when months is 0', () => {
      expect(getFilingAge(67, 0, 100)).toBe('67');
      expect(getFilingAge(62, 0, 50)).toBe('62');
      expect(getFilingAge(70, 0, 30)).toBe('70');
    });

    it('shows abbreviated format for very small cells (<40px)', () => {
      expect(getFilingAge(67, 6, 35)).toBe('67...');
      expect(getFilingAge(62, 3, 30)).toBe('62...');
    });

    it('shows compact format for small cells (40-50px)', () => {
      expect(getFilingAge(67, 6, 45)).toBe('67 6m');
      expect(getFilingAge(62, 11, 42)).toBe('62 11m');
    });

    it('shows medium format for medium cells (50-80px)', () => {
      expect(getFilingAge(67, 6, 60)).toBe('67 6mo');
      expect(getFilingAge(65, 3, 75)).toBe('65 3mo');
    });

    it('shows full format for large cells (>=80px)', () => {
      expect(getFilingAge(67, 6, 100)).toBe('67 6 months');
      expect(getFilingAge(65, 1, 85)).toBe('65 1 month');
      expect(getFilingAge(62, 11, 150)).toBe('62 11 months');
    });

    it('uses singular "month" for 1 month', () => {
      expect(getFilingAge(67, 1, 100)).toBe('67 1 month');
    });

    it('handles edge case of 0 width (uses default formatting)', () => {
      // With 0 width and months > 0, should use years... format
      expect(getFilingAge(67, 6, 0)).toBe('67...');
    });

    it('handles all filing months from 0 to 11', () => {
      for (let m = 0; m <= 11; m++) {
        const result = getFilingAge(67, m, 100);
        if (m === 0) {
          expect(result).toBe('67');
        } else {
          expect(result).toContain('67');
          expect(result).toContain(m.toString());
        }
      }
    });
  });

  describe('getFilingDate', () => {
    // Create test recipients
    function createTestRecipients(): [Recipient, Recipient] {
      const r1 = new Recipient();
      r1.birthdate = Birthdate.FromYMD(1962, 2, 1); // March 1, 1962
      r1.setPia(Money.from(2500));
      r1.name = 'Alex';
      r1.markFirst();

      const r2 = new Recipient();
      r2.birthdate = Birthdate.FromYMD(1964, 6, 15); // July 15, 1964
      r2.setPia(Money.from(1500));
      r2.name = 'Jordan';
      r2.markSecond();

      return [r1, r2];
    }

    const recipients = createTestRecipients();

    it('shows only year for very small cells (<35px)', () => {
      // At 67 years 0 months from March 1962 -> March 2029
      const result = getFilingDate(recipients, 0, 67, 0, 30);
      expect(result).toMatch(/'\d{2}$/); // e.g., '29
    });

    it('shows MM/YY format for small cells (35-50px)', () => {
      const result = getFilingDate(recipients, 0, 67, 0, 40);
      expect(result).toMatch(/^\d{2}\/\d{2}$/); // e.g., 03/29
    });

    it("shows MMM 'YY format for medium cells (50-80px)", () => {
      const result = getFilingDate(recipients, 0, 67, 0, 60);
      expect(result).toMatch(/^[A-Z][a-z]{2} '\d{2}$/); // e.g., Mar '29
    });

    it('shows MMM YYYY format for large cells (>=80px)', () => {
      const result = getFilingDate(recipients, 0, 67, 0, 100);
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{4}$/); // e.g., Mar 2029
    });

    it('calculates correct date from filing age for first recipient', () => {
      // First recipient born March 1, 1962
      // Filing at age 67y 0m = March 2029
      const result = getFilingDate(recipients, 0, 67, 0, 100);
      expect(result).toBe('Mar 2029');
    });

    it('calculates correct date for second recipient', () => {
      // Second recipient born July 15, 1964
      // Filing at age 67y 0m = July 2031
      const result = getFilingDate(recipients, 1, 67, 0, 100);
      expect(result).toBe('Jul 2031');
    });

    it('handles fractional months', () => {
      // First recipient born March 1962
      // Filing at 67y 6m = September 2029
      const result = getFilingDate(recipients, 0, 67, 6, 100);
      expect(result).toBe('Sep 2029');
    });
  });

  describe('createBorderRemovalFunctions', () => {
    const valueExtractor = (result: any) => result?.value ?? '';

    describe('right border removal', () => {
      it('removes right border when adjacent cells have same value', () => {
        const results = [
          [{ value: 'A' }, { value: 'A' }, { value: 'B' }],
          [{ value: 'C' }, { value: 'C' }, { value: 'C' }],
        ];
        const funcs = createBorderRemovalFunctions(valueExtractor, results);

        expect(funcs.right(0, 0)).toBe(true); // A == A
        expect(funcs.right(0, 1)).toBe(false); // A != B
        expect(funcs.right(1, 0)).toBe(true); // C == C
        expect(funcs.right(1, 1)).toBe(true); // C == C
      });

      it('returns false for last column', () => {
        const results = [[{ value: 'A' }, { value: 'A' }]];
        const funcs = createBorderRemovalFunctions(valueExtractor, results);

        expect(funcs.right(0, 1)).toBe(false);
      });

      it('returns false for null cells', () => {
        const results = [[{ value: 'A' }, null]];
        const funcs = createBorderRemovalFunctions(valueExtractor, results);

        expect(funcs.right(0, 0)).toBe(false);
      });
    });

    describe('bottom border removal', () => {
      it('removes bottom border when cells below have same value', () => {
        const results = [
          [{ value: 'A' }, { value: 'B' }],
          [{ value: 'A' }, { value: 'C' }],
          [{ value: 'D' }, { value: 'C' }],
        ];
        const funcs = createBorderRemovalFunctions(valueExtractor, results);

        expect(funcs.bottom(0, 0)).toBe(true); // A == A
        expect(funcs.bottom(0, 1)).toBe(false); // B != C
        expect(funcs.bottom(1, 1)).toBe(true); // C == C
      });

      it('returns false for last row', () => {
        const results = [[{ value: 'A' }], [{ value: 'A' }]];
        const funcs = createBorderRemovalFunctions(valueExtractor, results);

        expect(funcs.bottom(1, 0)).toBe(false);
      });
    });

    describe('left border removal', () => {
      it('removes left border when adjacent cells have same value', () => {
        const results = [[{ value: 'A' }, { value: 'A' }, { value: 'B' }]];
        const funcs = createBorderRemovalFunctions(valueExtractor, results);

        expect(funcs.left(0, 1)).toBe(true); // A == A
        expect(funcs.left(0, 2)).toBe(false); // A != B
      });

      it('returns false for first column', () => {
        const results = [[{ value: 'A' }]];
        const funcs = createBorderRemovalFunctions(valueExtractor, results);

        expect(funcs.left(0, 0)).toBe(false);
      });
    });

    describe('top border removal', () => {
      it('removes top border when cells above have same value', () => {
        const results = [
          [{ value: 'A' }, { value: 'B' }],
          [{ value: 'A' }, { value: 'C' }],
        ];
        const funcs = createBorderRemovalFunctions(valueExtractor, results);

        expect(funcs.top(1, 0)).toBe(true); // A == A
        expect(funcs.top(1, 1)).toBe(false); // B != C
      });

      it('returns false for first row', () => {
        const results = [[{ value: 'A' }]];
        const funcs = createBorderRemovalFunctions(valueExtractor, results);

        expect(funcs.top(0, 0)).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('handles single cell', () => {
        const results = [[{ value: 'A' }]];
        const funcs = createBorderRemovalFunctions(valueExtractor, results);

        expect(funcs.right(0, 0)).toBe(false);
        expect(funcs.bottom(0, 0)).toBe(false);
        expect(funcs.left(0, 0)).toBe(false);
        expect(funcs.top(0, 0)).toBe(false);
      });
    });
  });
});
