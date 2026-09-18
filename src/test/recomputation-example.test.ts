import { describe, expect, it } from 'vitest';
import { MAX_YEAR, MAXIMUM_EARNINGS } from '$lib/constants';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import {
  exampleWorker,
  recomputationExample,
} from '$lib/recomputation-example';

const wage = Money.from(60_000);
const zero = Money.from(0);

describe('exampleWorker', () => {
  it('has reached full retirement age before the extra year', () => {
    const worker = exampleWorker();
    const january = MonthDate.initFromYearsMonths({
      years: MAX_YEAR,
      months: 0,
    });
    expect(worker.normalRetirementDate().lessThanOrEqual(january)).toBe(true);
  });

  it('is still under 70 in the extra year, so credits are still growing', () => {
    expect(MAX_YEAR - exampleWorker().birthdate.ssaBirthYear()).toBeLessThan(
      70
    );
  });
});

describe('recomputationExample', () => {
  it('adds the extra year in the last year the constants cover', () => {
    const example = recomputationExample({ careerYears: 35, wage });
    expect(example.extraYear).toBe(MAX_YEAR);
  });

  it('reports piaAfter as piaBefore plus the increase', () => {
    const example = recomputationExample({ careerYears: 35, wage });
    expect(
      example.piaAfter.equals(example.piaBefore.plus(example.monthlyIncrease))
    ).toBe(true);
  });

  it('never lowers the benefit', () => {
    for (const careerYears of [10, 22, 35, 40]) {
      const example = recomputationExample({ careerYears, wage });
      expect(example.monthlyIncrease.greaterThanOrEqual(zero)).toBe(true);
    }
  });

  it('raises a full career a little and a short career a lot more', () => {
    const full = recomputationExample({ careerYears: 35, wage });
    const short = recomputationExample({ careerYears: 22, wage });
    expect(full.monthlyIncrease.greaterThan(zero)).toBe(true);
    expect(short.monthlyIncrease.greaterThan(full.monthlyIncrease)).toBe(true);
  });

  it('caps a career at the taxable maximum without lowering the benefit', () => {
    // Years after 60 are not indexed, so a maximum-wage year in the extra
    // year can still edge out an indexed maximum from decades ago. The
    // guide reports whatever the constants say; the invariant is only that
    // the raise is never negative.
    const max = MAXIMUM_EARNINGS[MAX_YEAR];
    const example = recomputationExample({
      careerYears: 35,
      wage: max,
      shape: 'flat',
    });
    expect(example.piaBefore.greaterThan(zero)).toBe(true);
    expect(example.monthlyIncrease.greaterThanOrEqual(zero)).toBe(true);
  });

  it('gains nothing from repeating a flat career wage', () => {
    const example = recomputationExample({
      careerYears: 35,
      wage,
      shape: 'flat',
    });
    expect(example.monthlyIncrease.equals(zero)).toBe(true);
  });

  it('gains nothing from a year that earns less than the lowest counted year', () => {
    const example = recomputationExample({
      careerYears: 35,
      wage,
      extraYearWage: wage.div(4),
    });
    expect(example.monthlyIncrease.equals(zero)).toBe(true);
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

  it('reports a zero lowest counted year when the career is short', () => {
    const example = recomputationExample({ careerYears: 22, wage });
    expect(example.lowestCountedYear.equals(zero)).toBe(true);
  });

  it('reports the first year of a rising career as the lowest counted year', () => {
    const example = recomputationExample({ careerYears: 35, wage });
    expect(example.lowestCountedYear.roundToDollar().equals(wage.div(2))).toBe(
      true
    );
  });

  it('reports the wage as the lowest counted year when the career is flat', () => {
    const example = recomputationExample({
      careerYears: 35,
      wage,
      shape: 'flat',
    });
    expect(example.lowestCountedYear.roundToDollar().equals(wage)).toBe(true);
  });
});
