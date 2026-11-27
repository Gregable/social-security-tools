import type { ChartLayout } from '$lib/components/chart-utils';
import type { MonthDate } from '$lib/month-time';

/**
 * Placement rules for the rotated labels on the filing date chart: the label
 * on the hover line, the label on the filing date line, and the year labels
 * those may cover. Nothing is drawn here. This module decides where a label
 * goes and whether it has room, so that the longer forms of a label can be
 * left out where they do not fit.
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

/** Dash pattern of the hover line and the filing date line. */
export const LINE_DASH = [6, 4];
/** Font of the labels on those two lines. */
export const LINE_LABEL_FONT = 'bold 14px Helvetica';

// These match the box that renderTextInWhiteBox paints behind 14px text:
// 14px above the baseline, 4px below it, and 7px beyond each end.
const ABOVE_BASELINE = 14;
const BELOW_BASELINE = 4;
const END_PADDING = 7;

// Clear space kept between the labels of two neighboring lines.
const LINE_LABEL_GAP = 3;
// Clear space kept below a line label. Above the shaded area this leaves room
// for the benefit amount that is printed there; it is also the gap kept above
// the $0 line where the label runs to the bottom of the chart.
const CLEARANCE_BELOW = 24;
// A line label's baseline sits this far right of its line, which centers its
// box on the line: 14px of the box is left of the baseline and 4px is right.
const LINE_LABEL_BASELINE_OFFSET_X = 5;
// The text of a line label ends this far above the top of the chart area,
// which lines it up with the year labels.
const LINE_LABEL_END_ABOVE_CHART = 67;

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
    lineX + LINE_LABEL_BASELINE_OFFSET_X,
    layout.reservedTop - LINE_LABEL_END_ABOVE_CHART + textWidth,
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
 * @returns true if the labels of two vertical lines would overlap or come
 *     within a few pixels of each other, which depends only on how close the
 *     lines are.
 */
export function lineLabelsCollide(lineXA: number, lineXB: number): boolean {
  const labelThickness = ABOVE_BASELINE + BELOW_BASELINE;
  return Math.abs(lineXA - lineXB) < labelThickness + LINE_LABEL_GAP;
}
