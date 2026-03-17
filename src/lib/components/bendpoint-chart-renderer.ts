import { Money } from '$lib/money';
import type { Recipient } from '$lib/recipient';
import { type BendpointBounds, canvasX, canvasY } from './bendpoint-chart-math';

/**
 * Utility: calls ctx.lineTo after transforming dollar values to canvas
 * coordinates.
 */
function lineTo(
  ctx: CanvasRenderingContext2D,
  dollarX: Money,
  dollarY: Money,
  bounds: BendpointBounds,
  chartWidth: number,
  chartHeight: number
): void {
  ctx.lineTo(
    canvasX(dollarX, bounds.maxRenderedXDollars, chartWidth),
    canvasY(dollarY, bounds.maxRenderedYDollars, chartHeight)
  );
}

/**
 * Utility: calls ctx.moveTo after transforming dollar values to canvas
 * coordinates.
 */
function moveTo(
  ctx: CanvasRenderingContext2D,
  dollarX: Money,
  dollarY: Money,
  bounds: BendpointBounds,
  chartWidth: number,
  chartHeight: number
): void {
  ctx.moveTo(
    canvasX(dollarX, bounds.maxRenderedXDollars, chartWidth),
    canvasY(dollarY, bounds.maxRenderedYDollars, chartHeight)
  );
}

/**
 * Render the bounding box for the chart.
 */
export function renderBoundingBox(
  ctx: CanvasRenderingContext2D,
  bounds: BendpointBounds,
  chartWidth: number,
  chartHeight: number
): void {
  ctx.save();
  ctx.lineWidth = 1;

  ctx.beginPath();
  moveTo(ctx, Money.from(0), Money.from(0), bounds, chartWidth, chartHeight);
  lineTo(
    ctx,
    Money.from(0),
    bounds.maxRenderedYDollars,
    bounds,
    chartWidth,
    chartHeight
  );
  lineTo(
    ctx,
    bounds.maxRenderedXDollars,
    bounds.maxRenderedYDollars,
    bounds,
    chartWidth,
    chartHeight
  );
  lineTo(
    ctx,
    bounds.maxRenderedXDollars,
    Money.from(0),
    bounds,
    chartWidth,
    chartHeight
  );
  lineTo(ctx, Money.from(0), Money.from(0), bounds, chartWidth, chartHeight);
  ctx.stroke();

  ctx.restore();
}

/**
 * Render the breakpoint curves and slope labels.
 */
export function renderBreakPoints(
  ctx: CanvasRenderingContext2D,
  recipient: Recipient,
  bounds: BendpointBounds,
  chartWidth: number,
  chartHeight: number
): void {
  // Show the lines between the breakpoints. These are always the same.
  ctx.save();
  ctx.lineWidth = 4;

  ctx.beginPath();
  moveTo(ctx, Money.from(0), Money.from(0), bounds, chartWidth, chartHeight);

  const firstBend: Money = recipient.pia().firstBendPoint();
  const secondBend: Money = recipient.pia().secondBendPoint();

  let dollarX: Money;
  let dollarY: Money;

  // Origin to first bend point
  dollarX = firstBend;
  dollarY = recipient.pia().piaFromAIME(dollarX);
  lineTo(ctx, dollarX, dollarY, bounds, chartWidth, chartHeight);

  // First to second bend point
  dollarX = secondBend;
  dollarY = recipient.pia().piaFromAIME(dollarX);
  lineTo(ctx, dollarX, dollarY, bounds, chartWidth, chartHeight);

  // Second to third bend point
  dollarX = bounds.maxRenderedXDollars;
  dollarY = recipient.pia().piaFromAIME(dollarX);
  lineTo(ctx, dollarX, dollarY, bounds, chartWidth, chartHeight);

  ctx.stroke();
  ctx.restore();

  // Now lets show vertical bars indicating where the breakpoints live.
  ctx.save();

  // Line between 1st and 2nd breakpoints:
  ctx.beginPath();
  ctx.lineWidth = 0.5;
  dollarX = firstBend;
  dollarY = recipient.pia().piaFromAIME(dollarX);
  moveTo(
    ctx,
    dollarX,
    dollarY.sub(Money.from(200)),
    bounds,
    chartWidth,
    chartHeight
  );
  lineTo(
    ctx,
    dollarX,
    dollarY.plus(Money.from(200)),
    bounds,
    chartWidth,
    chartHeight
  );
  ctx.stroke();

  // Line between 2nd and 3rd breakpoints:
  ctx.beginPath();
  ctx.lineWidth = 0.5;
  dollarX = secondBend;
  dollarY = recipient.pia().piaFromAIME(dollarX);
  moveTo(
    ctx,
    dollarX,
    dollarY.sub(Money.from(200)),
    bounds,
    chartWidth,
    chartHeight
  );
  lineTo(
    ctx,
    dollarX,
    dollarY.plus(Money.from(200)),
    bounds,
    chartWidth,
    chartHeight
  );
  ctx.stroke();

  // Some text indicating the slope of the curve along each section delineated
  // by the vertical bars above.
  const textWidth = ctx.measureText('XX%').width / 2;
  ctx.fillStyle = '#78B';

  // Compute the angle at which the chart dimensions are distoring slopes.
  const chartAngle =
    (chartHeight / chartWidth) *
    bounds.maxRenderedXDollars.div$(bounds.maxRenderedYDollars);
  ctx.fillText('32%', 0, 0);

  ctx.save();
  dollarX = recipient.pia().firstBendPoint().div(2);
  dollarY = recipient.pia().piaFromAIME(dollarX);
  ctx.translate(
    canvasX(dollarX, bounds.maxRenderedXDollars, chartWidth) - textWidth,
    canvasY(dollarY, bounds.maxRenderedYDollars, chartHeight)
  );
  // For very high earners, the space for this text can get pretty cramped,
  // so we simply don't show it in this case.
  if (
    canvasX(dollarX, bounds.maxRenderedXDollars, chartWidth) -
      canvasX(Money.from(0), bounds.maxRenderedXDollars, chartWidth) >
    textWidth + 5
  ) {
    ctx.rotate(-1 * Math.atan(0.9 * chartAngle));
    ctx.fillText('90%', 0, 0);
  }
  ctx.restore();

  ctx.save();
  dollarX = secondBend.sub(firstBend).div(2).plus(firstBend);
  dollarY = recipient.pia().piaFromAIME(dollarX);
  ctx.translate(
    canvasX(dollarX, bounds.maxRenderedXDollars, chartWidth) - textWidth,
    canvasY(dollarY, bounds.maxRenderedYDollars, chartHeight)
  );
  ctx.rotate(-1 * Math.atan(0.32 * chartAngle));
  ctx.fillText('32%', 0, 0);
  ctx.restore();

  ctx.save();
  dollarX = bounds.maxRenderedXDollars.sub(secondBend).div(2).plus(secondBend);
  dollarY = recipient.pia().piaFromAIME(dollarX);
  let pixelY = canvasY(dollarY, bounds.maxRenderedYDollars, chartHeight);
  // If this is too close to the top of the chart, flip it to below the line.
  if (pixelY < 100)
    // This just happens to work pretty well for positioning below the line.
    pixelY += 10 + 5 * chartAngle;

  ctx.translate(
    canvasX(dollarX, bounds.maxRenderedXDollars, chartWidth) - textWidth,
    pixelY
  );
  ctx.rotate(-1 * Math.atan(0.15 * chartAngle));
  ctx.fillText('15%', 0, 0);
  ctx.restore();

  ctx.restore();
}

/**
 * Renders a rectangle with three rounded corners and one squared corner.
 * @param squaredCorner (1 = upper left, then clockwise)
 */
export function roundedBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number,
  squaredCorner: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.lineCap = 'square';

  if (squaredCorner === 1) {
    ctx.moveTo(x, y);
  } else {
    ctx.moveTo(x + cornerRadius, y);
  }
  if (squaredCorner === 2) {
    ctx.lineTo(x + width, y);
  } else {
    ctx.lineTo(x + width - cornerRadius, y);
    ctx.arcTo(x + width, y, x + width, y + cornerRadius, cornerRadius);
  }
  if (squaredCorner === 3) {
    ctx.lineTo(x + width, y + height);
  } else {
    ctx.lineTo(x + width, y + height - cornerRadius);
    ctx.arcTo(
      x + width,
      y + height,
      x + width - cornerRadius,
      y + height,
      cornerRadius
    );
  }
  if (squaredCorner === 4) {
    ctx.lineTo(x, y + height);
  } else {
    ctx.lineTo(x + cornerRadius, y + height);
    ctx.arcTo(x, y + height, x, y + height - cornerRadius, cornerRadius);
  }
  if (squaredCorner === 1) {
    ctx.lineTo(x, y);
  } else {
    ctx.lineTo(x, y + cornerRadius);
    ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);
  }

  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders a point on the breakpoint curve with dashed lines and label chips.
 */
export function renderEarningsPoint(
  ctx: CanvasRenderingContext2D,
  recipient: Recipient,
  earnings: Money,
  bounds: BendpointBounds,
  chartWidth: number,
  chartHeight: number
): void {
  ctx.save();

  // Where on the breakpoint 'curve' the user's benefit values lie.
  const x = earnings;
  const y = recipient.pia().piaFromAIME(earnings);

  // Thin dashed lines out from the user benefit point
  ctx.lineWidth = 2;
  ctx.lineCap = 'butt';
  ctx.setLineDash([3, 5]);

  // Both lines starting at the point and radiating out makes a nifty
  // animation effect with the dashed lines at the edges of the chart.
  ctx.beginPath();
  moveTo(ctx, x, y, bounds, chartWidth, chartHeight);
  lineTo(ctx, x, Money.from(0), bounds, chartWidth, chartHeight);
  ctx.stroke();

  ctx.beginPath();
  moveTo(ctx, x, y, bounds, chartWidth, chartHeight);
  lineTo(ctx, bounds.maxRenderedXDollars, y, bounds, chartWidth, chartHeight);
  ctx.stroke();

  // White filled circle with black edge showing the user benefit point.
  ctx.setLineDash([]); // Disable the dashed line from above.
  ctx.fillStyle = ctx.strokeStyle;

  ctx.beginPath();
  ctx.arc(
    canvasX(x, bounds.maxRenderedXDollars, chartWidth),
    canvasY(y, bounds.maxRenderedYDollars, chartHeight),
    /*radius=*/ 5,
    /*startAngle=*/ 0,
    /*endAngle=*/ 2 * Math.PI
  );
  ctx.fill();
  ctx.stroke();

  // Text at the edges showing the actual values, white on colored chip.
  const xText = x.wholeDollars();
  const yText = y.wholeDollars();

  // Chip on the bottom edge
  roundedBox(
    ctx,
    canvasX(x, bounds.maxRenderedXDollars, chartWidth),
    canvasY(Money.from(0), bounds.maxRenderedYDollars, chartHeight),
    ctx.measureText(xText).width + 6,
    19,
    5,
    /*squaredCorner=*/ 1
  );
  // Chip on the right edge
  roundedBox(
    ctx,
    canvasX(
      bounds.maxRenderedXDollars,
      bounds.maxRenderedXDollars,
      chartWidth
    ) + 1,
    canvasY(y, bounds.maxRenderedYDollars, chartHeight),
    ctx.measureText(yText).width + 6,
    19,
    5,
    /*squaredCorner=*/ 1
  );

  ctx.fillStyle = 'white';
  ctx.fillText(
    // Text on the bottom edge.
    xText,
    canvasX(x, bounds.maxRenderedXDollars, chartWidth) + 2,
    canvasY(Money.from(0), bounds.maxRenderedYDollars, chartHeight) + 15
  );
  ctx.fillText(
    // Text on the right edge.
    yText,
    canvasX(
      bounds.maxRenderedXDollars,
      bounds.maxRenderedXDollars,
      chartWidth
    ) + 3,
    canvasY(y, bounds.maxRenderedYDollars, chartHeight) + 15
  );

  ctx.restore();
}
