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
import { wageIndexRatio } from './pia';

/**
 * The three dollar thresholds of the family maximum formula, in ascending
 * order. Produced by familyMaximumBendPoints; not meant to be built by hand.
 */
export interface FamilyMaximumBendPoints {
  readonly first: Money;
  readonly second: Money;
  readonly third: Money;
}

export function familyMaximumBendPoints(
  indexingYear: number
): FamilyMaximumBendPoints {
  const ratio = wageIndexRatio(indexingYear);
  const bends = {
    first: constants.FAMILY_MAX_BENDPOINT1_IN_1977.times(ratio).roundToDollar(),
    second:
      constants.FAMILY_MAX_BENDPOINT2_IN_1977.times(ratio).roundToDollar(),
    third: constants.FAMILY_MAX_BENDPOINT3_IN_1977.times(ratio).roundToDollar(),
  };
  // familyMaximum slices the PIA by these in order; a constants edit that
  // reordered them would silently produce negative slices.
  if (
    !bends.first.lessThan(bends.second) ||
    !bends.second.lessThan(bends.third)
  ) {
    throw new Error(
      `family maximum bend points must ascend, got ${bends.first.string()}, ` +
        `${bends.second.string()}, ${bends.third.string()}`
    );
  }
  return bends;
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
  // Each slice is the part of the PIA inside one bracket. Capping at the
  // bend point and subtracting the lower slices leaves zero, never a
  // negative, for brackets the PIA does not reach.
  const inFirst = Money.min(pia, bends.first);
  const inSecond = Money.min(pia, bends.second).sub(inFirst);
  const inThird = Money.min(pia, bends.third).sub(inFirst).sub(inSecond);
  const aboveThird = pia.sub(inFirst).sub(inSecond).sub(inThird);
  return inFirst
    .times(constants.FAMILY_MAX_MULTIPLIER_BRACKET1)
    .plus(inSecond.times(constants.FAMILY_MAX_MULTIPLIER_BRACKET2))
    .plus(inThird.times(constants.FAMILY_MAX_MULTIPLIER_BRACKET3))
    .plus(aboveThird.times(constants.FAMILY_MAX_MULTIPLIER_BRACKET4))
    .floorToDime();
}
