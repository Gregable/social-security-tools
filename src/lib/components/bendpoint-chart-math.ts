import * as constants from '$lib/constants';
import { Money } from '$lib/money';
import type { Recipient } from '$lib/recipient';

/**
 * Mutable bounds state for the bendpoint chart viewport.
 * Tracks the rendered x/y dollar ranges and adjusts them to avoid
 * excessive viewport jitter as the user changes earnings.
 */
export interface BendpointBounds {
  maxRenderedXDollars: Money;
  maxRenderedYDollars: Money;
  lastRenderedXDollars: Money;
}

export function initBounds(): BendpointBounds {
  return {
    maxRenderedXDollars: Money.from(-1),
    maxRenderedYDollars: Money.from(-1),
    lastRenderedXDollars: Money.from(-1),
  };
}

/**
 * Calculates usable chart width after reserving space for labels.
 */
export function calcChartWidth(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number
): number {
  // A 6-digit social security payment would be about the highest we
  // would imagine someone receiving, so we reserve space on the right
  // to display such a value with a little added padding.
  const reservedWidth = Math.ceil(ctx.measureText('$999,999').width) + 10;
  return canvasWidth - reservedWidth;
}

/**
 * Calculates usable chart height after reserving space for labels.
 */
export function calcChartHeight(canvasHeight: number): number {
  // A 12pt font is 16 pixels high. We reserve a little extra for padding.
  const reservedHeight = 16 + 10;
  return canvasHeight - reservedHeight;
}

/**
 * Compute the canvas x-coordinate for an earnings dollars value.
 */
export function canvasX(
  earningsX: Money,
  maxRenderedXDollars: Money,
  chartWidth: number
): number {
  const xValue = Math.floor(earningsX.div$(maxRenderedXDollars) * chartWidth);
  return Math.min(xValue, chartWidth);
}

/**
 * Compute the canvas y-coordinate for a benefit dollars value.
 */
export function canvasY(
  benefitY: Money,
  maxRenderedYDollars: Money,
  chartHeight: number
): number {
  const yValue =
    chartHeight - Math.floor(benefitY.div$(maxRenderedYDollars) * chartHeight);
  return Math.min(yValue, chartHeight);
}

/**
 * Compute the earnings dollars for a canvas x-coordinate value.
 * Used for computations involving mouse interactions.
 */
export function earningsX(
  x: number,
  maxRenderedXDollars: Money,
  chartWidth: number
): Money {
  const clampedX = Math.max(0, Math.min(x, chartWidth));
  return maxRenderedXDollars.times(clampedX / chartWidth);
}

/**
 * Selects appropriate x and y-coordinate dollar ranges for the viewport.
 * Aims to show breakpoints, user earnings, and avoid excessive jitter.
 */
export function recomputeBounds(
  recipient: Recipient,
  bounds: BendpointBounds
): BendpointBounds {
  // There are a few goals here when selecting this value:
  // 1) Show all of the breakpoints so the user can get a feel visually
  //    for how these breakpoints affect the computation.
  const breakpoint_min = recipient.pia().secondBendPoint().times(1.25);
  // 2) Show the user's current earnings with some space on either side
  //    so that they can explore the graph to either direction.
  const user_min = recipient.monthlyIndexedEarnings().times(2);
  // 3) Don't show values beyond the maximum achievable AIME.
  // https://github.com/Gregable/social-security-tools/issues/167
  const absolute_max =
    constants.MAXIMUM_EARNINGS[constants.MAX_MAXIMUM_EARNINGS_YEAR].div(12);

  const computed = Money.min(Money.max(breakpoint_min, user_min), absolute_max);

  // We would prefer to keep the viewport fixed as the user changes
  // the benefit, so that it's easier to see what is going on. However
  // we will adjust if the value gets too close to the edges.
  let lastRenderedXDollars = bounds.lastRenderedXDollars;
  if (
    lastRenderedXDollars.value() < 0 ||
    lastRenderedXDollars.value() > computed.times(1.3).value() ||
    lastRenderedXDollars.value() < computed.div(1.3).value()
  )
    lastRenderedXDollars = computed;

  return {
    maxRenderedXDollars: lastRenderedXDollars,
    maxRenderedYDollars: recipient.pia().piaFromAIME(lastRenderedXDollars),
    lastRenderedXDollars,
  };
}
