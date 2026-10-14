/**
 * Example AIME values for the AIME and PIA guides.
 *
 * The second bend point moves with the wage index every year, so anything
 * the guides place relative to it has to be computed rather than written at a
 * fixed position. A fixed $8,000 example stopped being "above the second bend
 * point" once that bend point reached $8,077 for 2027.
 */

import { Money } from './money';

const ROUNDING_STEP_DOLLARS = 1000;

/**
 * Rows for an AIME-to-PIA table, in whole dollars, ascending and without
 * duplicates. Callers mix round reference values with ones that move every
 * year, such as the bend points, and cannot know their order in advance.
 */
export function aimeTableRows(aimes: readonly Money[]): number[] {
  const wholeDollars = aimes.map((aime) => Math.round(aime.value()));
  return [...new Set(wholeDollars)].sort((a, b) => a - b);
}

/**
 * A round AIME strictly above the second bend point, for an example where
 * every extra dollar of AIME is replaced at the top bracket's rate.
 */
export function aboveSecondBendExampleAime(secondBendPoint: Money): Money {
  const steps = Math.floor(secondBendPoint.value() / ROUNDING_STEP_DOLLARS) + 1;
  return Money.from(steps * ROUNDING_STEP_DOLLARS);
}
