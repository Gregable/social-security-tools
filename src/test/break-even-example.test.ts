import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
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
import { Recipient } from '$lib/recipient';

const age = (years: number, months = 0) =>
  MonthDuration.initFromYearsMonths({ years, months });
const ym = (d: MonthDuration | null) =>
  d === null ? null : [d.years(), d.modMonths()];

describe('exampleRetiree', () => {
  it('turns 62 in the latest year the constants cover', () => {
    expect(exampleRetiree().birthdate.yearTurningSsaAge(62)).toBe(MAX_YEAR);
  });

  it('has a full retirement age of exactly 67', () => {
    expect(ym(exampleRetiree().normalRetirementAge())).toEqual([67, 0]);
  });

  it('can file in the month they turn 62', () => {
    expect(ym(exampleRetiree().birthdate.earliestFilingMonth())).toEqual([
      62, 0,
    ]);
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
    expect(b.timeToBreakEven.asMonths()).toBe(140);
    expect(ym(b.breakEvenAge)).toEqual([78, 8]);
  });

  it('finds 80 and 5 months for 62 against 70', () => {
    const b = breakEven(exampleRetiree(), age(62), age(70));
    expect(b.laterBenefit.string()).toBe('$3,100.00');
    expect(b.headStart.string()).toBe('$168,000.00');
    expect(ym(b.breakEvenAge)).toEqual([80, 5]);
  });

  it('finds 82 and 6 months for 67 against 70', () => {
    const b = breakEven(exampleRetiree(), age(67), age(70));
    expect(b.headStart.string()).toBe('$90,000.00');
    expect(b.monthlyGain.string()).toBe('$600.00');
    expect(ym(b.breakEvenAge)).toEqual([82, 6]);
  });

  it('prices the delay as an annual payout on the forgone checks', () => {
    // 12 x monthly gain / head start. The guide quotes these in prose.
    expect(
      breakEven(exampleRetiree(), age(67), age(70)).annualPayoutRate
    ).toBeCloseTo(0.08, 4);
    expect(
      breakEven(exampleRetiree(), age(62), age(70)).annualPayoutRate
    ).toBeCloseTo(0.0964, 4);
  });

  it('reports what a surviving spouse would inherit under each choice', () => {
    // Claimed at 62: the larger of the reduced check and 82.5% of the PIA.
    const b = breakEven(exampleRetiree(), age(62), age(70));
    expect(b.survivorIfEarlier.string()).toBe('$2,062.00');
    expect(b.survivorIfLater.string()).toBe('$3,100.00');
    expect(
      breakEven(exampleRetiree(), age(62), age(67)).survivorIfLater.string()
    ).toBe('$2,500.00');
  });

  it('works to the month, not just whole years', () => {
    // 59 months early: 36 x 5/9% + 23 x 5/12% = 29.58% off, $1,760 floored.
    const b = breakEven(exampleRetiree(), age(62, 1), age(67));
    expect(b.earlierBenefit.string()).toBe('$1,760.00');
    expect(b.headStart.string()).toBe('$103,840.00');
  });

  it('rejects ages that are not in claiming order or range', () => {
    const r = exampleRetiree();
    expect(() => breakEven(r, age(67), age(62))).toThrow(/before the later/);
    expect(() => breakEven(r, age(62), age(62))).toThrow(/before the later/);
    expect(() => breakEven(r, age(61, 11), age(67))).toThrow(/before 62/);
    expect(() => breakEven(r, age(62), age(70, 1))).toThrow(/past 70/);
  });
});

describe('discountedBreakEvenAge', () => {
  const r = exampleRetiree();

  it('reproduces the nominal break-even at a zero discount rate', () => {
    const nominal = breakEven(r, age(62), age(67)).breakEvenAge;
    const discounted = discountedBreakEvenAge(r, age(62), age(67), 0);
    expect(discounted?.asMonths()).toBe(nominal.asMonths());
  });

  it('moves the 62 vs 67 break-even later as the rate rises', () => {
    // Closed form, with n the months since the 62 claim and
    // d = (1 + rate)^(-1/12): d^n = (2500 d^60 - 1750) / 750. The loop
    // rounds each discounted check to the cent, which can shift a result
    // that lands within a cent of a month boundary by one month.
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
  const table = discountedBreakEvens(exampleRetiree());

  it('covers the three headline comparisons at each published rate', () => {
    expect(table.map((t) => [t.earlier.years(), t.later.years()])).toEqual([
      [62, 67],
      [62, 70],
      [67, 70],
    ]);
    for (const row of table) {
      expect(row.byRate.map((cell) => cell.rate)).toEqual(DISCOUNT_RATES);
    }
    expect(ym(table[1].byRate[0].age)).toEqual([80, 5]);
  });

  it('never moves a break-even earlier as the rate rises', () => {
    for (const row of table) {
      for (let i = 1; i < row.byRate.length; i++) {
        const previous = row.byRate[i - 1].age;
        const current = row.byRate[i].age;
        if (current === null) continue;
        expect(previous).not.toBeNull();
        expect(current.greaterThanOrEqual(previous as MonthDuration)).toBe(
          true
        );
      }
    }
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
    const fra = rows.find((r) => r.age.years() === 67);
    expect(fra?.versusFra).toBeNull();
    expect(rows.filter((r) => r.versusFra === null).length).toBe(1);
    expect(ym(rows[0].versusFra?.breakEvenAge ?? null)).toEqual([78, 8]);
    expect(ym(rows[8].versusFra?.breakEvenAge ?? null)).toEqual([82, 6]);
  });

  it('compares every row when full retirement age is not a whole year', () => {
    // Born 1958: full retirement age 66 and 8 months, so no row is FRA.
    const retiree = new Recipient();
    retiree.birthdate = Birthdate.FromYMD(1958, 0, 2);
    retiree.setPia(EXAMPLE_PIA);
    const partial = claimAgeRows(retiree);
    expect(partial.every((r) => r.versusFra !== null)).toBe(true);
    expect(ym(partial[4].versusFra?.laterAge ?? null)).toEqual([66, 8]);
    expect(ym(partial[5].versusFra?.earlierAge ?? null)).toEqual([66, 8]);
  });
});
