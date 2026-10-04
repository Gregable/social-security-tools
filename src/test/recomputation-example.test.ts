import { describe, expect, it } from 'vitest';
import { MAX_YEAR, MAXIMUM_EARNINGS, SSA_EARNINGS_YEARS } from '$lib/constants';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import {
  exampleWorker,
  recomputationExample,
} from '$lib/recomputation-example';

const wage = Money.from(60_000);
const zero = Money.from(0);

describe('exampleWorker', () => {
  it('reached full retirement age before the extra year began', () => {
    const january = MonthDate.initFromYearsMonths({
      years: MAX_YEAR,
      months: 0,
    });
    // Strictly before, not on: the guide's prose says the worker reached
    // full retirement age in an earlier year.
    expect(exampleWorker().normalRetirementDate().lessThan(january)).toBe(true);
  });

  it('is still under 70 in the extra year, so credits are still growing', () => {
    expect(MAX_YEAR - exampleWorker().birthdate.ssaBirthYear()).toBeLessThan(
      70
    );
  });
});

/**
 * The guide renders these exact figures and writes prose around them. When
 * a constants update moves them, update this table and re-read the prose in
 * working-past-full-retirement-age/+page.svelte together: sentences like
 * "keeps only 32 cents of each extra dollar" and "roughly twice as large"
 * are hand-written and can go stale silently otherwise.
 */
describe('the figures the guide publishes', () => {
  it('computes the full 35-year career', () => {
    const e = recomputationExample({ careerYears: 35, wage });
    expect(e.piaBefore.string()).toBe('$2,227.40');
    expect(e.piaAfter.string()).toBe('$2,256.20');
    expect(e.monthlyIncrease.string()).toBe('$28.80');
    expect(e.displacedYear?.string()).toBe('$30,000.00');
    expect(e.increaseIfClaimedAt62.string()).toBe('$20.00');
    expect(e.increaseIfClaimedAt70.string()).toBe('$37.00');
  });

  it('computes the 22-year career', () => {
    const e = recomputationExample({ careerYears: 22, wage });
    expect(e.piaBefore.string()).toBe('$1,662.10');
    expect(e.piaAfter.string()).toBe('$1,720.20');
    expect(e.monthlyIncrease.string()).toBe('$58.10');
    expect(e.displacedYear).toBeNull();
  });

  it('computes the maximum-earnings career', () => {
    const e = recomputationExample({
      careerYears: 35,
      wage: MAXIMUM_EARNINGS[MAX_YEAR],
      shape: 'flat',
    });
    expect(e.piaBefore.string()).toBe('$4,068.80');
    expect(e.piaAfter.string()).toBe('$4,096.30');
    expect(e.monthlyIncrease.string()).toBe('$27.50');
  });

  it('computes the low extra year', () => {
    const e = recomputationExample({
      careerYears: 35,
      wage,
      extraYearWage: Money.from(15_000),
    });
    expect(e.monthlyIncrease.equals(zero)).toBe(true);
  });

  it('keeps the $60,000 career inside the 32-cent bracket', () => {
    // The guide states the 32% figure in prose. If wage growth moves this
    // career into the 15% bracket, that sentence becomes wrong.
    expect(
      recomputationExample({ careerYears: 35, wage }).aimeWithinSecondBracket
    ).toBe(true);
  });

  it('gains about twice as much from the short career as the full one', () => {
    // The guide says "roughly twice as large as for someone with a full
    // record".
    const full = recomputationExample({ careerYears: 35, wage });
    const short = recomputationExample({ careerYears: 22, wage });
    const ratio = short.monthlyIncrease.div$(full.monthlyIncrease);
    expect(ratio).toBeGreaterThan(1.7);
    expect(ratio).toBeLessThan(2.3);
  });
});

describe('recomputationExample', () => {
  it('adds the extra year in the last year the constants cover', () => {
    expect(recomputationExample({ careerYears: 35, wage }).extraYear).toBe(
      MAX_YEAR
    );
  });

  it('echoes the inputs so a caller can label the figures', () => {
    const e = recomputationExample({ careerYears: 22, wage });
    expect(e.careerYears).toBe(22);
    expect(e.shape).toBe('rising');
    expect(
      recomputationExample({ careerYears: 35, wage, shape: 'flat' }).shape
    ).toBe('flat');
  });

  it('never lowers the benefit', () => {
    for (const careerYears of [10, 22, 35, 40]) {
      expect(
        recomputationExample({
          careerYears,
          wage,
        }).monthlyIncrease.greaterThanOrEqual(zero)
      ).toBe(true);
    }
  });

  it('gains from a maximum-earnings career, which the guide asserts', () => {
    // Years from the age-60 year on are not indexed, while earlier maximums
    // are indexed only up to that year's wage level, so a current maximum
    // year still displaces an old one. The guide says this row "surprises
    // people" and names a gain, so $0 would make that prose wrong.
    const e = recomputationExample({
      careerYears: 35,
      wage: MAXIMUM_EARNINGS[MAX_YEAR],
      shape: 'flat',
    });
    expect(e.monthlyIncrease.greaterThan(zero)).toBe(true);
  });

  it('gains nothing from repeating a flat career wage', () => {
    expect(
      recomputationExample({
        careerYears: 35,
        wage,
        shape: 'flat',
      }).monthlyIncrease.equals(zero)
    ).toBe(true);
  });

  it('gains nothing from a year below the year it would displace', () => {
    expect(
      recomputationExample({
        careerYears: 35,
        wage,
        extraYearWage: wage.div(4),
      }).monthlyIncrease.equals(zero)
    ).toBe(true);
  });

  it('gains more from a higher extra year', () => {
    const typical = recomputationExample({ careerYears: 35, wage });
    const higher = recomputationExample({
      careerYears: 35,
      wage,
      extraYearWage: wage.times(1.5),
    });
    expect(higher.monthlyIncrease.greaterThan(typical.monthlyIncrease)).toBe(
      true
    );
  });

  it('reports the extra year capped at the taxable maximum', () => {
    // Otherwise the guide could print a salary the calculation never used.
    const max = MAXIMUM_EARNINGS[MAX_YEAR];
    const e = recomputationExample({
      careerYears: 35,
      wage,
      extraYearWage: max.times(2),
    });
    expect(e.extraYearWage.equals(max)).toBe(true);
  });

  it('distinguishes a displaced year from a career with empty slots', () => {
    expect(
      recomputationExample({ careerYears: SSA_EARNINGS_YEARS, wage })
        .displacedYear
    ).not.toBeNull();
    expect(
      recomputationExample({ careerYears: SSA_EARNINGS_YEARS - 1, wage })
        .displacedYear
    ).toBeNull();
  });

  it('scales the raise to the age the benefit was claimed at', () => {
    const e = recomputationExample({ careerYears: 35, wage });
    // Claiming early shrinks the raise, delaying enlarges it.
    expect(e.increaseIfClaimedAt62.lessThan(e.monthlyIncrease)).toBe(true);
    expect(e.increaseIfClaimedAt70.greaterThan(e.monthlyIncrease)).toBe(true);
  });
});

describe('rejecting inputs that would publish a wrong number', () => {
  it('refuses a career that leaves the worker uninsured', () => {
    // Nine years crosses the 40-credit threshold, so the difference would be
    // the whole benefit becoming payable, not a recomputation raise.
    expect(() => recomputationExample({ careerYears: 9, wage })).toThrow(
      /uninsured/
    );
  });

  it.each([0, -3, 35.5, Number.NaN])(
    'refuses a careerYears of %s',
    (careerYears) => {
      expect(() => recomputationExample({ careerYears, wage })).toThrow(
        /positive integer/
      );
    }
  );

  it('refuses a career reaching past the example worker s birth', () => {
    expect(() => recomputationExample({ careerYears: 70, wage })).toThrow();
  });

  it('refuses a non-positive wage', () => {
    expect(() => recomputationExample({ careerYears: 35, wage: zero })).toThrow(
      /wage must be positive/
    );
  });
});
