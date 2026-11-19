import { describe, expect, it } from 'vitest';
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

describe('monthlyPayment', () => {
  const benefit = GPO_EXAMPLE.january2024Benefit;

  it('applies each COLA from its December benefit', () => {
    expect(monthlyPayment(benefit, month(2024, 0)).string()).toBe('$1,800.00');
    expect(monthlyPayment(benefit, month(2024, 10)).string()).toBe('$1,800.00');
    expect(monthlyPayment(benefit, month(2024, 11)).string()).toBe('$1,845.00');
    expect(monthlyPayment(benefit, month(2025, 11)).string()).toBe('$1,896.00');
  });

  it('carries the dimes through each COLA, which can change a later dollar', () => {
    // $1,800.90 is paid as $1,800, like $1,800.00. But $1,800.90 x 1.025 =
    // $1,845.9225, kept as $1,845.90, and x 1.028 = $1,897.5852, kept as
    // $1,897.50: a dollar more than $1,800.00 reaches by December 2025.
    const withDimes = Money.from(1800.9);
    expect(monthlyPayment(withDimes, month(2024, 0)).string()).toBe(
      '$1,800.00'
    );
    expect(monthlyPayment(withDimes, month(2024, 11)).string()).toBe(
      '$1,845.00'
    );
    expect(monthlyPayment(withDimes, month(2025, 11)).string()).toBe(
      '$1,897.00'
    );
    expect(monthlyPayment(benefit, month(2025, 11)).string()).toBe('$1,896.00');
  });

  it('refuses months before the repeal and malformed benefits', () => {
    expect(() => monthlyPayment(benefit, month(2023, 11))).toThrow(
      /offset still applies/
    );
    expect(() => monthlyPayment(Money.zero(), month(2024, 0))).toThrow(
      /whole number of dimes/
    );
    expect(() => monthlyPayment(Money.from(1800.05), month(2024, 0))).toThrow(
      /whole number of dimes/
    );
  });

  it('refuses a month whose COLA constants.ts does not have', () => {
    expect(() => monthlyPayment(benefit, month(2099, 11))).toThrow(/COLA/);
  });
});

describe('backPay', () => {
  it('refuses an empty range', () => {
    expect(() =>
      backPay(GPO_EXAMPLE.january2024Benefit, month(2025, 1), month(2025, 0))
    ).toThrow(/at least one month/);
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
 * The guide renders these exact figures and writes prose around them. Only
 * GPO_EXAMPLE, EXAMPLE_CONTACT_MONTH, or the 2024 and 2025 COLAs in
 * constants.ts can move them; if one changes, update the expectations and
 * re-read the prose in src/routes/guides/government-pension-offset/+page.svelte.
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

describe('gpoExample inputs', () => {
  it('refuses a pension whose two-thirds does not exceed the benefit', () => {
    // Two-thirds of $2,700 is exactly $1,800: total GPO, but not "more
    // than" the benefit as the guide's prose says.
    expect(() =>
      gpoExample({
        january2024Benefit: Money.from(1800),
        pension: Money.from(2700),
      })
    ).toThrow(/must be more than/);
    expect(() =>
      gpoExample({
        january2024Benefit: Money.from(1800),
        pension: Money.from(1500),
      })
    ).toThrow(/must be more than/);
  });

  it('refuses a missing pension and a contact month not after January 2024', () => {
    expect(() =>
      gpoExample({
        january2024Benefit: Money.from(1800),
        pension: Money.zero(),
      })
    ).toThrow(/positive amount/);
    expect(() => gpoExample(GPO_EXAMPLE, month(2024, 0))).toThrow(
      /contact month must be after/
    );
  });

  it('never reaches back before January 2024 for the late filer', () => {
    // Contact in March 2024: six months back would be September 2023, but
    // the repeal starts in January 2024, so both are paid January and
    // February 2024 and nothing is lost.
    const early = gpoExample(GPO_EXAMPLE, month(2024, 2));
    expect(early.neverApplied.first.toFullString()).toBe('January 2024');
    expect(early.neverApplied.last.toFullString()).toBe('February 2024');
    expect(early.neverApplied.months).toBe(2);
    expect(early.entitled.months).toBe(2);
    expect(early.monthsLost).toBe(0);
    expect(early.amountLost.string()).toBe('$0.00');
  });
});
