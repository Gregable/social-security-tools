import { describe, it, expect, beforeEach, vitest } from 'vitest';
import { IntegrationContext } from '$lib/components/integrations/integration-context';
import { Recipient } from '$lib/recipient';
import { MonthDate } from '$lib/month-time';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';

describe('IntegrationContext', () => {
  // Create test recipients with different earnings
  let higherEarningRecipient: Recipient;
  let lowerEarningRecipient: Recipient;

  beforeEach(() => {
    // Create recipients with different PIAs to ensure clear higher/lower earner distinction
    higherEarningRecipient = new Recipient();
    higherEarningRecipient.setPia(Money.from(3000));
    higherEarningRecipient.birthdate = Birthdate.FromYMD(1960, 0, 15); // Jan 15, 1960

    lowerEarningRecipient = new Recipient();
    lowerEarningRecipient.setPia(Money.from(1500));
    lowerEarningRecipient.birthdate = Birthdate.FromYMD(1962, 5, 20); // Jun 20, 1962

    // Reset the global filing date stores
    recipientFilingDate.set(null);
    spouseFilingDate.set(null);
  });

  describe('when no spouse', () => {
    it('should return recipient for higherEarner', () => {
      const context = new IntegrationContext(higherEarningRecipient, null);

      expect(context.higherEarner()).toBe(higherEarningRecipient);
    });

    it('should return null for lowerEarner', () => {
      const context = new IntegrationContext(higherEarningRecipient, null);

      expect(context.lowerEarner()).toBeNull();
    });

    it('should return recipient filing date for higherEarnerFilingDate', () => {
      const filingDate = MonthDate.initFromYearsMonths({
        years: 2027,
        months: 0,
      });
      recipientFilingDate.set(filingDate);

      const context = new IntegrationContext(higherEarningRecipient, null);

      expect(context.higherEarnerFilingDate()).toBe(filingDate);
    });

    it('should return null for lowerEarnerFilingDate', () => {
      const context = new IntegrationContext(higherEarningRecipient, null);

      expect(context.lowerEarnerFilingDate()).toBeNull();
    });

    it('should return true for isRecipientHigherEarner', () => {
      const context = new IntegrationContext(higherEarningRecipient, null);

      expect(context.isRecipientHigherEarner()).toBe(true);
    });

    it('should return false for isRecipientLowerEarner', () => {
      const context = new IntegrationContext(higherEarningRecipient, null);

      expect(context.isRecipientLowerEarner()).toBe(false);
    });
  });

  describe('when recipient is higher earner', () => {
    it('should return recipient for higherEarner', () => {
      const context = new IntegrationContext(
        higherEarningRecipient,
        lowerEarningRecipient
      );

      expect(context.higherEarner()).toBe(higherEarningRecipient);
    });

    it('should return spouse for lowerEarner', () => {
      const context = new IntegrationContext(
        higherEarningRecipient,
        lowerEarningRecipient
      );

      expect(context.lowerEarner()).toBe(lowerEarningRecipient);
    });

    it('should return recipient filing date for higherEarnerFilingDate', () => {
      const filingDate = MonthDate.initFromYearsMonths({
        years: 2027,
        months: 0,
      });
      recipientFilingDate.set(filingDate);

      const context = new IntegrationContext(
        higherEarningRecipient,
        lowerEarningRecipient
      );

      expect(context.higherEarnerFilingDate()).toBe(filingDate);
    });

    it('should return spouse filing date for lowerEarnerFilingDate', () => {
      const filingDate = MonthDate.initFromYearsMonths({
        years: 2029,
        months: 5,
      });
      spouseFilingDate.set(filingDate);

      const context = new IntegrationContext(
        higherEarningRecipient,
        lowerEarningRecipient
      );

      expect(context.lowerEarnerFilingDate()).toBe(filingDate);
    });

    it('should return true for isRecipientHigherEarner', () => {
      const context = new IntegrationContext(
        higherEarningRecipient,
        lowerEarningRecipient
      );

      expect(context.isRecipientHigherEarner()).toBe(true);
    });

    it('should return false for isRecipientLowerEarner', () => {
      const context = new IntegrationContext(
        higherEarningRecipient,
        lowerEarningRecipient
      );

      expect(context.isRecipientLowerEarner()).toBe(false);
    });
  });

  describe('when spouse is higher earner', () => {
    it('should return spouse for higherEarner', () => {
      const context = new IntegrationContext(
        lowerEarningRecipient,
        higherEarningRecipient
      );

      expect(context.higherEarner()).toBe(higherEarningRecipient);
    });

    it('should return recipient for lowerEarner', () => {
      const context = new IntegrationContext(
        lowerEarningRecipient,
        higherEarningRecipient
      );

      expect(context.lowerEarner()).toBe(lowerEarningRecipient);
    });

    it('should return spouse filing date for higherEarnerFilingDate', () => {
      const filingDate = MonthDate.initFromYearsMonths({
        years: 2027,
        months: 0,
      });
      spouseFilingDate.set(filingDate);

      const context = new IntegrationContext(
        lowerEarningRecipient,
        higherEarningRecipient
      );

      expect(context.higherEarnerFilingDate()).toBe(filingDate);
    });

    it('should return recipient filing date for lowerEarnerFilingDate', () => {
      const filingDate = MonthDate.initFromYearsMonths({
        years: 2029,
        months: 5,
      });
      recipientFilingDate.set(filingDate);

      const context = new IntegrationContext(
        lowerEarningRecipient,
        higherEarningRecipient
      );

      expect(context.lowerEarnerFilingDate()).toBe(filingDate);
    });

    it('should return false for isRecipientHigherEarner', () => {
      const context = new IntegrationContext(
        lowerEarningRecipient,
        higherEarningRecipient
      );

      expect(context.isRecipientHigherEarner()).toBe(false);
    });

    it('should return true for isRecipientLowerEarner', () => {
      const context = new IntegrationContext(
        lowerEarningRecipient,
        higherEarningRecipient
      );

      expect(context.isRecipientLowerEarner()).toBe(true);
    });
  });

  describe('reactive updates to filing date stores', () => {
    it('should update higherEarnerFilingDate when store changes', () => {
      const context = new IntegrationContext(
        higherEarningRecipient,
        lowerEarningRecipient
      );

      expect(context.higherEarnerFilingDate()).toBeNull();

      const newDate = MonthDate.initFromYearsMonths({ years: 2027, months: 0 });
      recipientFilingDate.set(newDate);

      // The context should read the updated store value
      expect(context.higherEarnerFilingDate()).toBe(newDate);
    });

    it('should update lowerEarnerFilingDate when store changes', () => {
      const context = new IntegrationContext(
        higherEarningRecipient,
        lowerEarningRecipient
      );

      expect(context.lowerEarnerFilingDate()).toBeNull();

      const newDate = MonthDate.initFromYearsMonths({ years: 2029, months: 5 });
      spouseFilingDate.set(newDate);

      // The context should read the updated store value
      expect(context.lowerEarnerFilingDate()).toBe(newDate);
    });
  });

  describe('static copyToClipboard', () => {
    it('should call navigator.clipboard.writeText with the provided value', () => {
      // Mock the clipboard API
      const writeTextMock = vitest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const testValue = 'test clipboard content';
      IntegrationContext.copyToClipboard(testValue);

      expect(writeTextMock).toHaveBeenCalledWith(testValue);
    });

    it('should handle missing clipboard API gracefully', () => {
      // Remove clipboard API
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Should not throw
      expect(() => {
        IntegrationContext.copyToClipboard('test');
      }).not.toThrow();

      // Restore
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('benefit calculation methods', () => {
    beforeEach(() => {
      // Set up filing dates for tests
      const recipientDate = MonthDate.initFromYearsMonths({
        years: 2027,
        months: 0,
      });
      const spouseDate = MonthDate.initFromYearsMonths({
        years: 2028,
        months: 6,
      });
      recipientFilingDate.set(recipientDate);
      spouseFilingDate.set(spouseDate);
    });

    describe('getLowerEarnerPersonalBenefit', () => {
      it('should return formatted personal benefit for lower earner', () => {
        const context = new IntegrationContext(
          higherEarningRecipient,
          lowerEarningRecipient
        );
        const filingDate = MonthDate.initFromYearsMonths({
          years: 2028,
          months: 6,
        });

        const result = context.getLowerEarnerPersonalBenefit(filingDate);

        // Should return a formatted string starting with $
        expect(result).toMatch(/^\$/);
        // Should not be $0
        expect(result).not.toBe('$0');
      });
    });

    describe('getLowerEarnerCombinedBenefit', () => {
      it('should return formatted combined benefit for lower earner', () => {
        const context = new IntegrationContext(
          higherEarningRecipient,
          lowerEarningRecipient
        );
        const filingDate = MonthDate.initFromYearsMonths({
          years: 2028,
          months: 6,
        });

        const result = context.getLowerEarnerCombinedBenefit(filingDate);

        // Should return a formatted string starting with $
        expect(result).toMatch(/^\$/);
        // Should not be $0
        expect(result).not.toBe('$0');
      });

      it('should return higher amount than personal benefit (includes spousal)', () => {
        const context = new IntegrationContext(
          higherEarningRecipient,
          lowerEarningRecipient
        );
        const filingDate = MonthDate.initFromYearsMonths({
          years: 2028,
          months: 6,
        });

        const personal = context.getLowerEarnerPersonalBenefit(filingDate);
        const combined = context.getLowerEarnerCombinedBenefit(filingDate);

        // Parse dollar amounts for comparison
        const personalAmount = parseFloat(personal.replace(/[$,]/g, ''));
        const combinedAmount = parseFloat(combined.replace(/[$,]/g, ''));

        // Combined benefit should be greater than or equal to personal
        expect(combinedAmount).toBeGreaterThanOrEqual(personalAmount);
      });
    });
  });
});
