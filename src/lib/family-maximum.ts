/**
 * The family maximum: the most Social Security pays each month on one
 * worker's record to the worker and everyone collecting on it together.
 *
 * Like the PIA formula, the maximum is a piecewise-linear function of the
 * PIA whose bend points are fixed dollar amounts from 1979, scaled by the
 * growth in the average wage index between 1977 and the worker's indexing
 * year (the year they turn 60). Social Security describes the formula at
 * https://www.ssa.gov/oact/cola/familymax.html.
 *
 * Both the PIA and the maximum are set when the worker turns 62 and then
 * rise together with each cost-of-living adjustment, so the ratio between
 * them is fixed from then on. This module computes the maximum for a given
 * PIA and indexing year; it does not apply later COLAs.
 */

import * as constants from './constants';
import { Money } from './money';

export interface FamilyMaximumBendPoints {
  readonly first: Money;
  readonly second: Money;
  readonly third: Money;
}

/**
 * The ratio of the average wage in the indexing year to the average wage in
 * 1977. Mirrors the private helper in pia.ts, including its clamp to the
 * latest year of wage index data for workers whose indexing year is still in
 * the future.
 */
function wageRatio(indexingYear: number): number {
  const effectiveIndexingYear = Math.min(
    indexingYear,
    constants.MAX_WAGE_INDEX_YEAR
  );
  return constants.WAGE_INDICES[effectiveIndexingYear].div$(
    constants.WAGE_INDICES[1977]
  );
}

/** The three dollar thresholds of the family maximum formula. */
export function familyMaximumBendPoints(
  indexingYear: number
): FamilyMaximumBendPoints {
  const ratio = wageRatio(indexingYear);
  return {
    first: constants.FAMILY_MAX_BENDPOINT1_IN_1977.times(ratio).roundToDollar(),
    second:
      constants.FAMILY_MAX_BENDPOINT2_IN_1977.times(ratio).roundToDollar(),
    third: constants.FAMILY_MAX_BENDPOINT3_IN_1977.times(ratio).roundToDollar(),
  };
}

/**
 * The family maximum for a worker with the given PIA, before any
 * cost-of-living adjustment. Rounded down to the dime, as the PIA is.
 */
export function familyMaximum(pia: Money, indexingYear: number): Money {
  if (!pia.greaterThan(Money.from(0))) {
    throw new Error(`PIA must be positive, got ${pia.string()}`);
  }
  const bends = familyMaximumBendPoints(indexingYear);
  const inFirst = Money.min(pia, bends.first);
  const inSecond = Money.min(pia, bends.second).sub(inFirst);
  const inThird = Money.min(pia, bends.third).sub(inFirst).sub(inSecond);
  const aboveThird = pia.sub(inFirst).sub(inSecond).sub(inThird);
  // Nothing below zero: each slice is the part of the PIA inside one bracket.
  return inFirst
    .times(constants.FAMILY_MAX_MULTIPLIER_BRACKET1)
    .plus(inSecond.times(constants.FAMILY_MAX_MULTIPLIER_BRACKET2))
    .plus(inThird.times(constants.FAMILY_MAX_MULTIPLIER_BRACKET3))
    .plus(aboveThird.times(constants.FAMILY_MAX_MULTIPLIER_BRACKET4))
    .floorToDime();
}
