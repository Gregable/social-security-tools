import { Money } from '$lib/money';
import { MonthDuration } from '$lib/month-time';

/**
 * Layout geometry shared by all canvas chart components.
 */
export interface ChartLayout {
  canvasWidth: number;
  canvasHeight: number;
  reservedLeft: number;
  reservedTop: number;
  reservedBottom: number;
}

/**
 * Tick mark configuration for sliders.
 */
export interface TickItem {
  value: number;
  label?: string;
  legend?: string;
  color?: string;
}

/**
 * Renders text with a white background box behind it.
 * Used for labeling chart axes without overlapping grid lines.
 */
export function renderTextInWhiteBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number
): void {
  const textWidth = ctx.measureText(text).width;

  // First, draw the white box.
  ctx.save();
  ctx.fillStyle = '#FFF';
  ctx.fillRect(x - 7, y - 14, textWidth + 14, 18);
  ctx.restore();

  // Then draw the text.
  ctx.fillText(text, x, y);
}

/**
 * Renders a single horizontal dollar-amount line across the chart width,
 * with a dollar label on the left side.
 */
export function renderHorizontalLine(
  ctx: CanvasRenderingContext2D,
  dollarY: Money,
  y: number,
  canvasWidth: number
): void {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvasWidth, y);
  ctx.stroke();

  const text = dollarY.wholeDollars();

  ctx.save();
  ctx.fillStyle = '#AAA';
  renderTextInWhiteBox(ctx, text, 6, y + 5);
  ctx.restore();
}

/**
 * Computes appropriate dollar increments for horizontal grid lines
 * based on the maximum dollar value being displayed.
 */
export function dollarLineIncrement(maxDollars: Money): Money {
  if (maxDollars.value() > 3000) return Money.from(1000);
  if (maxDollars.value() > 1500) return Money.from(500);
  if (maxDollars.value() > 1000) return Money.from(250);
  return Money.from(100);
}

/**
 * Translation function for slider labels to map months to ages.
 * Shared by CombinedChart, FilingDateChart, and combined-chart-context.
 */
export function translateSliderLabel(value: number, label: string): string {
  const age = new MonthDuration(value);
  if (label === 'value' || label === 'ceiling' || label === 'floor') {
    if (age.modMonths() === 0) return age.years().toString(10);
    return `${age.years()} ${age.modMonths()} mo`;
  }
  // tick-value is the text above each tick mark
  if (label === 'tick-value') {
    return age.years().toString(10);
  }
  return '';
}
