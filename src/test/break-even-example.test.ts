import { describe, expect, it } from 'vitest';
import {
  breakEven,
  claimAgeRows,
  DISCOUNT_RATES,
  discountedBreakEvenAge,
  discountedBreakEvens,
  EXAMPLE_PIA,
  exampleRetiree,
} from '$lib/break-even-example';
import { MAX_YEAR } from '$lib/constants';
import { MonthDuration } from '$lib/month-time';

const age = (years: number) =>
  MonthDuration.initFromYearsMonths({ years, months: 0 });

describe('exampleRetiree', () => {
  it('turns 62 in the latest year the constants cover', () => {
    expect(exampleRetiree().birthdate.yearTurningSsaAge(62)).toBe(MAX_YEAR);
  });

  it('has a full retirement age of exactly 67', () => {
    const fra = exampleRetiree().normalRetirementAge();
    expect(fra.years()).toBe(67);
    expect(fra.modMonths()).toBe(0);
  });

  it('can file in the month they turn 62', () => {
    const earliest = exampleRetiree().birthdate.earliestFilingMonth();
    expect(earliest.years()).toBe(62);
    expect(earliest.modMonths()).toBe(0);
  });

  it('carries the example PIA unchanged', () => {
    expect(
      exampleRetiree().pia().primaryInsuranceAmount().equals(EXAMPLE_PIA)
    ).toBe(true);
  });
});

/**
 * The guide renders these exact figures and writes prose around them. When
 * a constants update moves them, update this table and re-read the prose in
 * break-even-age/+page.svelte together.
 */
describe('breakEven', () => {
  it('finds 78 and 8 months for 62 against 67', () => {
    const b = breakEven(exampleRetiree(), age(62), age(67));
    expect(b.earlierBenefit.string()).toBe('$1,750.00');
    expect(b.laterBenefit.string()).toBe('$2,500.00');
    expect(b.headStart.string()).toBe('$105,000.00');
    expect(b.monthlyGain.string()).toBe('$750.00');
    expect(b.breakEvenAge.years()).toBe(78);
    expect(b.breakEvenAge.modMonths()).toBe(8);
  });

  it('finds 80 and 5 months for 62 against 70', () => {
    const b = breakEven(exampleRetiree(), age(62), age(70));
    expect(b.laterBenefit.string()).toBe('$3,100.00');
    expect(b.headStart.string()).toBe('$168,000.00');
    expect(b.breakEvenAge.years()).toBe(80);
    expect(b.breakEvenAge.modMonths()).toBe(5);
  });

  it('finds 82 and 6 months for 67 against 70', () => {
    const b = breakEven(exampleRetiree(), age(67), age(70));
    expect(b.headStart.string()).toBe('$90,000.00');
    expect(b.monthlyGain.string()).toBe('$600.00');
    expect(b.breakEvenAge.years()).toBe(82);
    expect(b.breakEvenAge.modMonths()).toBe(6);
  });

  it('reports what a surviving spouse would inherit under each choice', () => {
    const b = breakEven(exampleRetiree(), age(62), age(70));
    // Claimed at 62: the larger of the reduced check and 82.5% of the PIA.
    expect(b.survivorIfEarlier.string()).toBe('$2,062.00');
    expect(b.survivorIfLater.string()).toBe('$3,100.00');
  });

  it('rejects ages that are not in claiming order or range', () => {
    const r = exampleRetiree();
    expect(() => breakEven(r, age(67), age(62))).toThrow(/before/);
    expect(() => breakEven(r, age(62), age(62))).toThrow(/before/);
    expect(() => breakEven(r, age(61), age(67))).toThrow(/62/);
    expect(() => breakEven(r, age(62), age(71))).toThrow(/70/);
  });
});

describe('discountedBreakEvenAge', () => {
  const r = exampleRetiree();

  it('reproduces the nominal break-even at a zero discount rate', () => {
    const nominal = breakEven(r, age(62), age(67)).breakEvenAge;
    const discounted = discountedBreakEvenAge(r, age(62), age(67), 0);
    expect(discounted?.asMonths()).toBe(nominal.asMonths());
  });

  const ym = (d: MonthDuration | null) =>
    d === null ? null : [d.years(), d.modMonths()];

  it('moves the 62 vs 67 break-even later as the rate rises', () => {
    // Closed form: d^n = (2500 d^60 - 1750) / 750 with d = (1 + rate)^(-1/12).
    expect(ym(discountedBreakEvenAge(r, age(62), age(67), 0.02))).toEqual([
      81, 1,
    ]);
    expect(ym(discountedBreakEvenAge(r, age(62), age(67), 0.04))).toEqual([
      85, 0,
    ]);
    expect(ym(discountedBreakEvenAge(r, age(62), age(67), 0.06))).toEqual([
      93, 9,
    ]);
  });

  it('moves the 67 vs 70 break-even later as the rate rises', () => {
    expect(ym(discountedBreakEvenAge(r, age(67), age(70), 0.02))).toEqual([
      84, 11,
    ]);
    expect(ym(discountedBreakEvenAge(r, age(67), age(70), 0.06))).toEqual([
      97, 4,
    ]);
  });

  it('reports no break-even when it would fall past the horizon', () => {
    expect(discountedBreakEvenAge(r, age(67), age(70), 0.08)).toBeNull();
  });

  it('rejects a negative rate', () => {
    expect(() => discountedBreakEvenAge(r, age(62), age(67), -0.01)).toThrow(
      /rate/
    );
  });
});

describe('discountedBreakEvens', () => {
  it('covers the three headline comparisons at each published rate', () => {
    const table = discountedBreakEvens(exampleRetiree());
    expect(table.map((t) => [t.earlier.years(), t.later.years()])).toEqual([
      [62, 67],
      [62, 70],
      [67, 70],
    ]);
    for (const row of table) {
      expect(row.byRate.length).toBe(DISCOUNT_RATES.length);
    }
    expect(table[1].byRate[0]?.years()).toBe(80);
    expect(table[1].byRate[0]?.modMonths()).toBe(5);
  });
});

describe('claimAgeRows', () => {
  const rows = claimAgeRows(exampleRetiree());

  it('covers every whole year from 62 to 70', () => {
    expect(rows.map((r) => r.age.years())).toEqual([
      62, 63, 64, 65, 66, 67, 68, 69, 70,
    ]);
  });

  it('pins the monthly benefit at each age', () => {
    expect(rows.map((r) => r.benefit.string())).toEqual([
      '$1,750.00',
      '$1,875.00',
      '$2,000.00',
      '$2,166.00',
      '$2,333.00',
      '$2,500.00',
      '$2,700.00',
      '$2,900.00',
      '$3,100.00',
    ]);
  });

  it('compares each age with full retirement age, which has no comparison', () => {
    const fra = rows[5];
    expect(fra.age.years()).toBe(67);
    expect(fra.versusFra).toBeNull();
    expect(rows[0].versusFra?.breakEvenAge.years()).toBe(78);
    expect(rows[8].versusFra?.breakEvenAge.years()).toBe(82);
  });
});
