import { describe, expect, it } from 'vitest';
import { MAX_YEAR } from '$lib/constants';
import type { MonthDuration } from '$lib/month-time';
import {
  DIVORCED_EXAMPLE,
  divorcedRemarriage,
  REMARRIAGE_SAFE_AGE,
  WIDOW_EXAMPLE,
  widowRemarriage,
} from '$lib/remarriage-example';

const ym = (d: MonthDuration) => [d.years(), d.modMonths()];

/**
 * The guide renders these exact figures and writes prose around them. When
 * a constants update moves them, update the expectations and re-read the
 * prose in src/routes/guides/remarriage/+page.svelte together.
 */
describe('widowRemarriage', () => {
  const w = widowRemarriage();

  it('follows a widow who is 58 in the latest year the constants cover', () => {
    expect(w.ageNow).toBe(58);
    expect(w.birthYear).toBe(MAX_YEAR - 58);
    expect(REMARRIAGE_SAFE_AGE).toBe(60);
  });

  it('has full retirement ages of 67 for both retirement and survivor benefits', () => {
    expect(ym(w.fullRetirementAge)).toEqual([67, 0]);
    expect(ym(w.survivorFullRetirementAge)).toEqual([67, 0]);
  });

  it('pays 71.5% of the late spouse PIA at 60 and all of it at survivor FRA', () => {
    expect(WIDOW_EXAMPLE.lateSpousePia.string()).toBe('$2,800.00');
    expect(w.survivorAtSixty.string()).toBe('$2,002.00');
    expect(w.survivorAtFra.string()).toBe('$2,800.00');
  });

  it('pays her own benefit of $770 at 62 or $1,100 at full retirement age', () => {
    expect(WIDOW_EXAMPLE.ownPia.string()).toBe('$1,100.00');
    expect(w.ownAtSixtyTwo.string()).toBe('$770.00');
    expect(w.ownAtFra.string()).toBe('$1,100.00');
  });

  it('adds a $200 spousal top-up on the new spouse, for $1,300 in all', () => {
    expect(WIDOW_EXAMPLE.newSpousePia.string()).toBe('$2,600.00');
    expect(w.newSpouseTopUpAtFra.string()).toBe('$200.00');
    expect(w.marriedEarlyTotalAtFra.string()).toBe('$1,300.00');
  });

  it('costs $1,500 a month, $18,000 a year, to marry before 60', () => {
    expect(w.monthlyCostAtFra.string()).toBe('$1,500.00');
    expect(w.annualCostAtFra.string()).toBe('$18,000.00');
  });

  it('forgoes $48,048 between 60 and 62, when nothing else is payable', () => {
    expect(w.monthsBeforeOwnBenefit).toBe(24);
    expect(w.survivorForgoneBeforeSixtyTwo.string()).toBe('$48,048.00');
  });

  /**
   * The guide says in prose that marrying at 60 or later leaves the survivor
   * benefit as the larger of the two, so the new marriage adds nothing while
   * both spouses live.
   */
  it('survivor benefit exceeds everything the new marriage can pay', () => {
    expect(w.survivorAtFra.greaterThan(w.marriedEarlyTotalAtFra)).toBe(true);
    expect(w.survivorAtSixty.greaterThan(w.marriedEarlyTotalAtFra)).toBe(true);
  });
});

describe('divorcedRemarriage', () => {
  const d = divorcedRemarriage();

  it('pays $1,600 in all on the former spouse record while unmarried', () => {
    expect(DIVORCED_EXAMPLE.ownPia.string()).toBe('$900.00');
    expect(DIVORCED_EXAMPLE.formerSpousePia.string()).toBe('$3,200.00');
    expect(d.own.string()).toBe('$900.00');
    expect(d.formerSpouseTopUp.string()).toBe('$700.00');
    expect(d.totalUnmarried.string()).toBe('$1,600.00');
  });

  it('pays $1,000 in all on the new spouse record', () => {
    expect(DIVORCED_EXAMPLE.newSpousePia.string()).toBe('$2,000.00');
    expect(d.newSpouseTopUp.string()).toBe('$100.00');
    expect(d.totalRemarried.string()).toBe('$1,000.00');
  });

  it('costs $600 a month to remarry', () => {
    expect(d.monthlyCost.string()).toBe('$600.00');
  });

  it('would pay $3,200 as a surviving divorced spouse', () => {
    expect(d.survivorOnFormerSpouse.string()).toBe('$3,200.00');
  });
});
