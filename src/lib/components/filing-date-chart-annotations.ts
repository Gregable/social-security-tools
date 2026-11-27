import { benefitOnDateNominal } from '$lib/benefit-calculator';
import {
  type ChartLayout,
  renderTextInWhiteBox,
} from '$lib/components/chart-utils';
import type { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import {
  fitsAbove,
  hoverPhase,
  LINE_DASH,
  LINE_LABEL_FONT,
  lineLabel,
  lineLabelsCollide,
  type RotatedLabel,
  zeroLineY,
} from './filing-date-chart-labels';
import {
  canvasX,
  canvasY,
  maxRenderedYDollars,
} from './filing-date-chart-math';

/**
 * The parts of the filing date chart that explain what the reader is looking
 * at: the dashed line from the slider to the shaded area and its label, which
 * are drawn here, and the choice of text for the hover line's label, which
 * renderSelectedDateVerticalLine draws.
 */

const FILING_DATE_TEXT = 'Filing date';
const MONTH_SHOWN_TEXT = 'Month shown';

/** A label together with the text chosen for it. */
export interface PlacedText {
  text: string;
  label: RotatedLabel;
}

/**
 * Which part of the filing date line to draw. The two parts are drawn at
 * different points in the render order: the part under the slider goes behind
 * the year labels, and the part inside the chart goes on top of the benefit
 * label, whose white backing would otherwise cut the line short.
 */
export type FilingDateLinePart = 'below-slider' | 'inside-chart';

function monthYear(date: MonthDate): string {
  return `${date.monthName()} ${date.year()}`;
}

/** Canvas point of the shaded area's top-left corner. */
function filingCorner(
  recipient: Recipient,
  filingDate: MonthDate,
  layout: ChartLayout
): { x: number; y: number } {
  return {
    x: canvasX(filingDate, recipient.birthdate, layout),
    y: canvasY(
      benefitOnDateNominal(recipient, filingDate, filingDate),
      maxRenderedYDollars(recipient),
      layout
    ),
  };
}

function measure(ctx: CanvasRenderingContext2D, text: string): number {
  ctx.save();
  ctx.font = LINE_LABEL_FONT;
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}

/**
 * Chooses the text for the hover line's label: the month, preceded by "Month
 * shown" when the longer text fits above whatever is beneath it. That is the
 * shaded area if the label is over it, and otherwise the $0 line.
 */
export function selectedDateLabelText(
  ctx: CanvasRenderingContext2D,
  recipient: Recipient,
  filingDate: MonthDate,
  hoverDate: MonthDate,
  layout: ChartLayout
): string {
  const dateText = monthYear(hoverDate);
  const fullText = `${MONTH_SHOWN_TEXT}: ${dateText}`;
  const lineX = canvasX(hoverDate, recipient.birthdate, layout);
  const label = lineLabel(lineX, measure(ctx, fullText), layout);

  // A label on a line just before the filing date can still reach over the
  // shaded area's corner, because the label is wider than the line.
  const corner = filingCorner(recipient, filingDate, layout);
  const overShadedArea = label.bounds.right >= corner.x;
  const shadedTopY =
    hoverPhase(filingDate, hoverDate) === 'before-filing'
      ? corner.y
      : canvasY(
          benefitOnDateNominal(recipient, filingDate, hoverDate),
          maxRenderedYDollars(recipient),
          layout
        );
  const clearY = overShadedArea ? shadedTopY : zeroLineY(layout);

  return fitsAbove(label, clearY) ? fullText : dateText;
}

/**
 * Decides what the filing date line's label says: "Filing date" and the date
 * if both fit above the shaded area, or else the date alone.
 *
 * @returns null when not even the date fits, or when the hover line is close
 *     enough that its label takes the space.
 */
export function placeFilingDateLabel(
  ctx: CanvasRenderingContext2D,
  recipient: Recipient,
  filingDate: MonthDate,
  hoverDate: MonthDate | null,
  layout: ChartLayout
): PlacedText | null {
  const corner = filingCorner(recipient, filingDate, layout);
  if (hoverDate !== null) {
    const hoverLineX = canvasX(hoverDate, recipient.birthdate, layout);
    if (lineLabelsCollide(corner.x, hoverLineX)) return null;
  }

  const dateText = monthYear(filingDate);
  for (const text of [`${FILING_DATE_TEXT}: ${dateText}`, dateText]) {
    const label = lineLabel(corner.x, measure(ctx, text), layout);
    if (fitsAbove(label, corner.y)) return { text, label };
  }
  return null;
}

/**
 * Renders one part of the dashed line that runs from the slider handle down
 * to the top-left corner of the shaded area, tying the selected filing age to
 * the date benefits start. See FilingDateLinePart for why there are two.
 */
export function renderFilingDateLine(
  ctx: CanvasRenderingContext2D,
  recipient: Recipient,
  filingDate: MonthDate,
  part: FilingDateLinePart,
  layout: ChartLayout
): void {
  const corner = filingCorner(recipient, filingDate, layout);
  const fromY = part === 'below-slider' ? 0 : layout.reservedTop;
  const toY = part === 'below-slider' ? layout.reservedTop : corner.y;
  if (toY <= fromY) return;

  ctx.save();
  ctx.strokeStyle = recipient.colors().medium;
  ctx.lineWidth = 2;
  ctx.lineCap = 'butt';
  ctx.setLineDash(LINE_DASH);
  // Keep the dashes of the two parts in step with each other.
  ctx.lineDashOffset = fromY;
  ctx.beginPath();
  ctx.moveTo(corner.x, fromY);
  ctx.lineTo(corner.x, toY);
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders the label chosen by placeFilingDateLabel.
 */
export function renderFilingDateLabel(
  ctx: CanvasRenderingContext2D,
  recipient: Recipient,
  placed: PlacedText
): void {
  ctx.save();
  ctx.fillStyle = recipient.colors().dark;
  ctx.font = LINE_LABEL_FONT;
  ctx.translate(placed.label.anchorX, placed.label.anchorY);
  ctx.rotate((-90 * Math.PI) / 180);
  renderTextInWhiteBox(ctx, placed.text, 0, 0);
  ctx.restore();
}
