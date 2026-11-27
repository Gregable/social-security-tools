import type { ChartLayout } from '$lib/components/chart-utils';
import type { MonthDate } from '$lib/month-time';

/**
 * Placement rules for the labels that explain the filing date chart: the
 * label on the hover line and the label on the filing date line. The longer
 * forms are drawn only when they fit, so this module is pure geometry: it
 * decides where a label goes and whether it has room.
 */

/** Axis-aligned rectangle in canvas pixels. */
export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * A label drawn rotated a quarter turn counter-clockwise, so it reads from
 * the bottom up, like the year labels on the chart.
 */
export interface RotatedLabel {
  /** Canvas point where the text baseline starts: the label's bottom end. */
  anchorX: number;
  anchorY: number;
  /** The area the label occupies, including its padding. */
  bounds: Rect;
}

/** Where the hovered month falls relative to the selected filing date. */
export type HoverPhase = 'before-filing' | 'filing-month' | 'after-filing';

export function hoverPhase(
  filingDate: MonthDate,
  hoverDate: MonthDate
): HoverPhase {
  if (hoverDate.lessThan(filingDate)) return 'before-filing';
  if (hoverDate.greaterThan(filingDate)) return 'after-filing';
  return 'filing-month';
}

// These match the box that renderTextInWhiteBox paints behind 14px text:
// 14px above the baseline, 4px below it, and 7px beyond each end.
const ABOVE_BASELINE = 14;
const BELOW_BASELINE = 4;
const END_PADDING = 7;

// Clear space kept between the labels of two neighboring lines.
const MARGIN = 3;
// Clear space kept below a line label, enough for the benefit amount that is
// printed just above the shaded area.
const CLEARANCE_BELOW = 24;
// A line label is centered this far right of its line, and its text ends this
// far above the top of the chart area. Both match the hover line's label.
const LINE_LABEL_OFFSET_X = 5;
const LINE_LABEL_TOP = 67;

export function rotatedLabelAt(
  anchorX: number,
  anchorY: number,
  textWidth: number
): RotatedLabel {
  return {
    anchorX,
    anchorY,
    bounds: {
      left: anchorX - ABOVE_BASELINE,
      right: anchorX + BELOW_BASELINE,
      top: anchorY - textWidth - END_PADDING,
      bottom: anchorY + END_PADDING,
    },
  };
}

export function zeroLineY(layout: ChartLayout): number {
  return layout.canvasHeight - layout.reservedBottom;
}

export function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
  );
}

/**
 * Places a label on a vertical line. The text ends at a fixed height under
 * the slider and hangs down from there, so a longer text reaches further down
 * into the chart.
 */
export function lineLabel(
  lineX: number,
  textWidth: number,
  layout: ChartLayout
): RotatedLabel {
  return rotatedLabelAt(
    lineX + LINE_LABEL_OFFSET_X,
    layout.reservedTop - LINE_LABEL_TOP + textWidth,
    textWidth
  );
}

/**
 * @returns true if the label ends far enough above clearY, the top of
 *     whatever is drawn beneath it.
 */
export function fitsAbove(label: RotatedLabel, clearY: number): boolean {
  return label.bounds.bottom <= clearY - CLEARANCE_BELOW;
}

/**
 * @returns true if the labels of two vertical lines would overlap, which
 *     depends only on how close the lines are.
 */
export function lineLabelsCollide(lineXA: number, lineXB: number): boolean {
  return Math.abs(lineXA - lineXB) < ABOVE_BASELINE + BELOW_BASELINE + MARGIN;
}
