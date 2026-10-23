import { describe, expect, it } from 'vitest';
import { MAX_YEAR } from '$lib/constants';
import { MonthDuration } from '$lib/month-time';
import {
  costFreeMonths,
  EXAMPLE_PIA,
  exampleRetiree,
  MAX_RETROACTIVE_MONTHS,
  maxRetroactiveMonths,
  paybackRows,
  retroactiveChoice,
} from '$lib/retroactive-retirement-example';

const age = (years: number, months = 0) =>
  MonthDuration.initFromYearsMonths({ years, months });
const ym = (d: MonthDuration | null) =>
  d === null ? null : [d.years(), d.modMonths()];

describe('exampleRetiree', () => {
  it('reaches full retirement age in the latest year the constants cover', () => {
    expect(exampleRetiree().birthdate.yearTurningSsaAge(67)).toBe(MAX_YEAR);
  });

  it('has a full retirement age of exactly 67', () => {
    expect(ym(exampleRetiree().normalRetirementAge())).toEqual([67, 0]);
  });

  it('carries the example PIA unchanged', () => {
    expect(
      exampleRetiree().pia().primaryInsuranceAmount().equals(EXAMPLE_PIA)
    ).toBe(true);
  });
});

describe('maxRetroactiveMonths', () => {
  it('is zero at full retirement age', () => {
    expect(maxRetroactiveMonths(exampleRetiree(), age(67))).toBe(0);
  });

  it('stops at the full retirement age month inside the first six months', () => {
    expect(maxRetroactiveMonths(exampleRetiree(), age(67, 3))).toBe(3);
  });

  it('is six months from six months past full retirement age on', () => {
    expect(maxRetroactiveMonths(exampleRetiree(), age(67, 6))).toBe(6);
    expect(maxRetroactiveMonths(exampleRetiree(), age(69))).toBe(6);
    expect(maxRetroactiveMonths(exampleRetiree(), age(72))).toBe(6);
    expect(MAX_RETROACTIVE_MONTHS).toBe(6);
  });

  it('rejects a filing age before full retirement age', () => {
    expect(() => maxRetroactiveMonths(exampleRetiree(), age(66, 11))).toThrow(
      /full retirement age/
    );
  });
});

/**
 * The guide renders these exact figures and writes prose around them. When
 * a constants update moves them, update this table and re-read the prose in
 * retroactive-retirement-benefits/+page.svelte together.
 */
describe('retroactiveChoice', () => {
  it('filing six months past FRA: $15,000 now costs $100 a month, repaid at 80', () => {
    const c = retroactiveChoice(exampleRetiree(), age(67, 6), 6);
    expect(c.monthsBack).toBe(6);
    expect(ym(c.startAge)).toEqual([67, 0]);
    expect(c.benefitWithoutBackPay.string()).toBe('$2,600.00');
    expect(c.benefitWithBackPay.string()).toBe('$2,500.00');
    expect(c.lumpSum.string()).toBe('$15,000.00');
    expect(c.monthlyCost.string()).toBe('$100.00');
    expect(c.payback?.time.asMonths()).toBe(150);
    expect(ym(c.payback?.age ?? null)).toEqual([80, 0]);
  });

  it('filing at 69: a larger lump sum, the same monthly cost, and a later payback', () => {
    const c = retroactiveChoice(exampleRetiree(), age(69), 6);
    expect(ym(c.startAge)).toEqual([68, 6]);
    expect(c.benefitWithoutBackPay.string()).toBe('$2,900.00');
    expect(c.benefitWithBackPay.string()).toBe('$2,800.00');
    expect(c.lumpSum.string()).toBe('$16,800.00');
    expect(c.monthlyCost.string()).toBe('$100.00');
    expect(c.payback?.time.asMonths()).toBe(168);
    expect(ym(c.payback?.age ?? null)).toEqual([83, 0]);
  });

  it('filing three months past FRA can only reach back to FRA', () => {
    const c = retroactiveChoice(exampleRetiree(), age(67, 3), 6);
    expect(c.monthsBack).toBe(3);
    expect(ym(c.startAge)).toEqual([67, 0]);
    expect(c.benefitWithoutBackPay.string()).toBe('$2,550.00');
    expect(c.lumpSum.string()).toBe('$7,500.00');
    expect(c.monthlyCost.string()).toBe('$50.00');
    expect(ym(c.payback?.age ?? null)).toEqual([79, 9]);
  });

  it('filing at 70 and 4 months: the four months back to 70 are free', () => {
    expect(costFreeMonths(exampleRetiree(), age(70, 4))).toBe(4);
    const c = retroactiveChoice(exampleRetiree(), age(70, 4), 4);
    expect(c.monthsBack).toBe(4);
    expect(ym(c.startAge)).toEqual([70, 0]);
    expect(c.benefitWithoutBackPay.string()).toBe('$3,100.00');
    expect(c.benefitWithBackPay.string()).toBe('$3,100.00');
    expect(c.lumpSum.string()).toBe('$12,400.00');
    expect(c.monthlyCost.string()).toBe('$0.00');
    expect(c.payback).toBeNull();
  });

  it('reaching back past 70 from 70 and 4 months costs credits again', () => {
    const c = retroactiveChoice(exampleRetiree(), age(70, 4), 6);
    expect(c.monthsBack).toBe(6);
    expect(ym(c.startAge)).toEqual([69, 10]);
    expect(c.benefitWithBackPay.string()).toBe('$3,066.00');
    expect(c.monthlyCost.string()).toBe('$34.00');
  });

  it('filing at 70 and 8 months: only six of the eight months are paid, all free', () => {
    expect(costFreeMonths(exampleRetiree(), age(70, 8))).toBe(6);
    const c = retroactiveChoice(exampleRetiree(), age(70, 8), 6);
    expect(c.monthsBack).toBe(6);
    expect(ym(c.startAge)).toEqual([70, 2]);
    expect(c.lumpSum.string()).toBe('$18,600.00');
    expect(c.monthlyCost.string()).toBe('$0.00');
  });

  it('filing at FRA, or asking for zero months, is a no-op choice', () => {
    for (const c of [
      retroactiveChoice(exampleRetiree(), age(67), 6),
      retroactiveChoice(exampleRetiree(), age(69), 0),
    ]) {
      expect(c.monthsBack).toBe(0);
      expect(c.startAge.asMonths()).toBe(c.filingAge.asMonths());
      expect(c.lumpSum.string()).toBe('$0.00');
      expect(c.monthlyCost.string()).toBe('$0.00');
      expect(c.payback).toBeNull();
    }
  });

  /**
   * The guide prose names these percentages by hand: two-thirds of 1% a
   * month, 8% a year, 4% for six months.
   */
  it('matches the hand-written credit percentages', () => {
    const six = retroactiveChoice(exampleRetiree(), age(67, 6), 6);
    expect(six.monthlyCost.div$(EXAMPLE_PIA)).toBeCloseTo(0.04, 6);
    expect(six.monthlyCost.div$(EXAMPLE_PIA) / 6).toBeCloseTo(2 / 300, 6);
    const year = retroactiveChoice(exampleRetiree(), age(68), 6);
    expect(
      year.benefitWithoutBackPay.sub(EXAMPLE_PIA).div$(EXAMPLE_PIA)
    ).toBeCloseTo(0.08, 6);
  });

  it('honors a request for fewer months than the maximum', () => {
    const c = retroactiveChoice(exampleRetiree(), age(69), 2);
    expect(c.monthsBack).toBe(2);
    expect(ym(c.startAge)).toEqual([68, 10]);
    // Two months at 68 and 10 months: 22 months of credits, 14.67%, which
    // truncates to $2,866 a month.
    expect(c.benefitWithBackPay.string()).toBe('$2,866.00');
    expect(c.lumpSum.string()).toBe('$5,732.00');
  });

  it('rejects filing before full retirement age', () => {
    expect(() => retroactiveChoice(exampleRetiree(), age(66), 6)).toThrow(
      /full retirement age/
    );
  });

  it('rejects a request outside zero to six months', () => {
    expect(() => retroactiveChoice(exampleRetiree(), age(69), 7)).toThrow(
      /six/
    );
    expect(() => retroactiveChoice(exampleRetiree(), age(69), -1)).toThrow(
      /six/
    );
    expect(() => retroactiveChoice(exampleRetiree(), age(69), 2.5)).toThrow(
      /six/
    );
  });
});

describe('costFreeMonths', () => {
  it('is zero at or before 70', () => {
    expect(costFreeMonths(exampleRetiree(), age(68))).toBe(0);
    expect(costFreeMonths(exampleRetiree(), age(70))).toBe(0);
  });

  it('rejects a filing age before full retirement age', () => {
    expect(() => costFreeMonths(exampleRetiree(), age(66))).toThrow(
      /full retirement age/
    );
  });
});

describe('paybackRows', () => {
  it('lists the filing ages the guide tabulates, in order', () => {
    const rows = paybackRows(exampleRetiree());
    expect(rows.map((r) => ym(r.filingAge))).toEqual([
      [67, 6],
      [68, 0],
      [69, 0],
      [70, 0],
      [70, 4],
    ]);
  });

  it('shows the payback moving later as the filing age moves later', () => {
    const rows = paybackRows(exampleRetiree());
    // The payback takes 150 months plus however far past full retirement
    // age the backdated start falls. Delaying the filing a month moves the
    // start a month too, so the payback age moves two months.
    expect(rows.map((r) => ym(r.payback?.age ?? null))).toEqual([
      [80, 0],
      [81, 0],
      [83, 0],
      [85, 0],
      null,
    ]);
    expect(rows.map((r) => ym(r.startAge))).toEqual([
      [67, 0],
      [67, 6],
      [68, 6],
      [69, 6],
      [70, 0],
    ]);
    expect(rows.map((r) => r.benefitWithoutBackPay.string())).toEqual([
      '$2,600.00',
      '$2,700.00',
      '$2,900.00',
      '$3,100.00',
      '$3,100.00',
    ]);
    expect(rows.map((r) => r.benefitWithBackPay.string())).toEqual([
      '$2,500.00',
      '$2,600.00',
      '$2,800.00',
      '$3,000.00',
      '$3,100.00',
    ]);
    expect(rows.map((r) => r.lumpSum.string())).toEqual([
      '$15,000.00',
      '$15,600.00',
      '$16,800.00',
      '$18,000.00',
      '$12,400.00',
    ]);
  });
});
