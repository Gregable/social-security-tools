import { describe, expect, it } from 'vitest';
import { colaAdjustedDimes } from '$lib/benefit-rounding';
import {
  backPay,
  EXAMPLE_CONTACT_MONTH,
  GPO_EXAMPLE,
  gpoExample,
  MAX_RETROACTIVE_MONTHS,
  monthlyPayment,
  REPEAL_FIRST_MONTH,
} from '$lib/gpo-example';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';

const month = (years: number, months: number) =>
  MonthDate.initFromYearsMonths({ years, months });

describe('colaAdjustedDimes', () => {
  it('applies the COLA as an exact fraction and truncates to the dime', () => {
    // $1,845.00 x 1.028 = $1,896.66, truncated to $1,896.60.
    expect(colaAdjustedDimes(184500, 2.8)).toBe(189660);
    expect(colaAdjustedDimes(180000, 2.5)).toBe(184500);
    expect(colaAdjustedDimes(180000, 0)).toBe(180000);
  });

  it('never rounds up across a dime', () => {
    // $123.45 x 1.028 = $126.9066 and $1,234.95 x 1.032 = $1,274.4684.
    expect(colaAdjustedDimes(12345, 2.8)).toBe(12690);
    expect(colaAdjustedDimes(123495, 3.2)).toBe(127440);
    // $9.99 x 1.001 = $9.99999: rounding to the cent first gives $10.00.
    expect(colaAdjustedDimes(999, 0.1)).toBe(990);
  });

  it('rejects a COLA that is negative or not in tenths of a percent', () => {
    expect(() => colaAdjustedDimes(10000, 2.85)).toThrow();
    expect(() => colaAdjustedDimes(10000, -0.1)).toThrow();
  });
});

describe('monthlyPayment', () => {
  const benefit = GPO_EXAMPLE.january2024Benefit;

  it('applies each COLA from its December benefit', () => {
    expect(monthlyPayment(benefit, month(2024, 0)).string()).toBe('$1,800.00');
    expect(monthlyPayment(benefit, month(2024, 10)).string()).toBe('$1,800.00');
    expect(monthlyPayment(benefit, month(2024, 11)).string()).toBe('$1,845.00');
    expect(monthlyPayment(benefit, month(2025, 11)).string()).toBe('$1,896.00');
  });

  it('truncates the payment to the dollar but carries dimes forward', () => {
    // $1,800.10 x 1.025 = $1,845.1025, kept as $1,845.10; x 1.028 =
    // $1,896.7628, kept as $1,896.70. Each month pays whole dollars.
    const odd = Money.from(1800.1);
    expect(monthlyPayment(odd, month(2024, 0)).string()).toBe('$1,800.00');
    expect(monthlyPayment(odd, month(2025, 0)).string()).toBe('$1,845.00');
    expect(monthlyPayment(odd, month(2026, 0)).string()).toBe('$1,896.00');
  });

  it('refuses months before the repeal and malformed benefits', () => {
    expect(() => monthlyPayment(benefit, month(2023, 11))).toThrow();
    expect(() => monthlyPayment(Money.zero(), month(2024, 0))).toThrow();
    expect(() => monthlyPayment(Money.from(1800.05), month(2024, 0))).toThrow();
  });

  it('refuses a month whose COLA constants.ts does not have', () => {
    expect(() => monthlyPayment(benefit, month(2099, 11))).toThrow(/COLA/);
  });
});

describe('backPay', () => {
  it('refuses an empty range', () => {
    expect(() =>
      backPay(GPO_EXAMPLE.january2024Benefit, month(2025, 1), month(2025, 0))
    ).toThrow();
  });

  it('counts a single month', () => {
    const one = backPay(
      GPO_EXAMPLE.january2024Benefit,
      month(2024, 0),
      month(2024, 0)
    );
    expect(one.months).toBe(1);
    expect(one.total.string()).toBe('$1,800.00');
  });
});

/**
 * The guide renders these exact figures and writes prose around them. When
 * a constants update moves them, update the expectations and re-read the
 * prose in src/routes/guides/government-pension-offset/+page.svelte.
 */
describe('gpoExample', () => {
  const g = gpoExample();

  it('uses the stated inputs and November 2026 as the contact month', () => {
    expect(GPO_EXAMPLE.january2024Benefit.string()).toBe('$1,800.00');
    expect(GPO_EXAMPLE.pension.string()).toBe('$3,000.00');
    expect(EXAMPLE_CONTACT_MONTH.toFullString()).toBe('November 2026');
    expect(g.contactMonth.toFullString()).toBe('November 2026');
    expect(REPEAL_FIRST_MONTH.toFullString()).toBe('January 2024');
    expect(MAX_RETROACTIVE_MONTHS).toBe(6);
  });

  it('offset the whole benefit before 2024', () => {
    expect(g.offsetBeforeRepeal.string()).toBe('$2,000.00');
    expect(
      g.offsetBeforeRepeal.greaterThan(GPO_EXAMPLE.january2024Benefit)
    ).toBe(true);
  });

  it('owes the entitled widow 34 months, $62,796, in three rates', () => {
    expect(g.entitled.first.toFullString()).toBe('January 2024');
    expect(g.entitled.last.toFullString()).toBe('October 2026');
    expect(g.entitled.months).toBe(34);
    expect(
      g.entitled.periods.map((p) => [
        p.first.toFullString(),
        p.last.toFullString(),
        p.months,
        p.monthlyPayment.string(),
        p.subtotal.string(),
      ])
    ).toEqual([
      ['January 2024', 'November 2024', 11, '$1,800.00', '$19,800.00'],
      ['December 2024', 'November 2025', 12, '$1,845.00', '$22,140.00'],
      ['December 2025', 'October 2026', 11, '$1,896.00', '$20,856.00'],
    ]);
    expect(g.entitled.total.string()).toBe('$62,796.00');
  });

  it('pays the widow who never applied six months, $11,376', () => {
    expect(g.neverApplied.first.toFullString()).toBe('May 2026');
    expect(g.neverApplied.last.toFullString()).toBe('October 2026');
    expect(g.neverApplied.months).toBe(6);
    expect(g.neverApplied.periods).toHaveLength(1);
    expect(g.neverApplied.total.string()).toBe('$11,376.00');
  });

  it('loses 28 months, $51,420, to the late application', () => {
    expect(g.monthsLost).toBe(28);
    expect(g.amountLost.string()).toBe('$51,420.00');
  });

  it('pays both $1,896 a month from November 2026', () => {
    expect(g.paymentFromContactMonth.string()).toBe('$1,896.00');
  });
});
