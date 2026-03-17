import { benefitOnDate } from '$lib/benefit-calculator';
import {
  dollarLineIncrement,
  renderHorizontalLine,
  renderTextInWhiteBox,
} from '$lib/components/chart-utils';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import {
  canvasX,
  canvasY,
  dateX,
  type FilingDateLayout,
  maxRenderedYDollars,
} from './filing-date-chart-math';

/**
 * Render horizontal dollar-amount grid lines.
 */
export function renderHorizontalLines(
  ctx: CanvasRenderingContext2D,
  recipient: Recipient,
  layout: FilingDateLayout
): void {
  const maxY = maxRenderedYDollars(recipient);

  ctx.save();
  ctx.strokeStyle = '#BBB';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);

  renderHorizontalLine(
    ctx,
    Money.from(0),
    canvasY(Money.from(0), maxY, layout),
    layout.canvasWidth
  );

  if (maxY.value() < 500) {
    ctx.restore();
    return;
  }

  const increment = dollarLineIncrement(maxY);

  for (let i = increment; i.value() < maxY.value(); i = i.plus(increment)) {
    renderHorizontalLine(ctx, i, canvasY(i, maxY, layout), layout.canvasWidth);
  }

  ctx.restore();
}

/**
 * Render vertical year grid lines with rotated year labels.
 */
export function renderYearVerticalLines(
  ctx: CanvasRenderingContext2D,
  recipient: Recipient,
  layout: FilingDateLayout
): void {
  const maxY = maxRenderedYDollars(recipient);
  const birthdate = recipient.birthdate;

  ctx.save();
  ctx.strokeStyle = '#666';
  ctx.setLineDash([2, 2]);

  let startDate = birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
  );
  const endDate = birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
  );

  // If the start date doesn't fall on a year value, move it forward until
  // it does.
  if (startDate.monthIndex() !== 0)
    startDate = MonthDate.initFromYearsMonths({
      years: startDate.year() + 1,
      months: 0,
    });

  // Iterate over each year within the date range.
  for (
    let date = MonthDate.copyFrom(startDate);
    date.lessThanOrEqual(endDate);
    date = date.addDuration(
      MonthDuration.initFromYearsMonths({ years: 1, months: 0 })
    )
  ) {
    const x = canvasX(date, birthdate, layout);

    // Draw vertical line.
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasY(Money.from(0), maxY, layout));
    ctx.stroke();

    // Print the year vertically atop the line, with a white rectangle behind
    // the text, so that the line isn't going through the text.
    const text = `${date.year()}`;
    const textWidth = ctx.measureText(text).width;
    const ypos = layout.reservedTop - textWidth - 5;
    ctx.save();
    ctx.translate(x + 5, ypos);
    ctx.rotate((-90 * Math.PI) / 180);
    ctx.fillStyle = '#999';
    renderTextInWhiteBox(ctx, text, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Calculates benefit boxes: the step-function regions showing benefit at
 * each date given the selected filing date.
 *
 * @returns Array of [x, y, benefit] tuples for each step.
 */
export function benefitBoxes(
  recipient: Recipient,
  selectedDate: MonthDate,
  layout: FilingDateLayout
): Array<[number, number, Money]> {
  const maxY = maxRenderedYDollars(recipient);
  const birthdate = recipient.birthdate;

  const boxes: Array<[number, number, Money]> = [];
  let benefit = benefitOnDate(recipient, selectedDate, selectedDate);
  boxes.push([
    canvasX(selectedDate, birthdate, layout),
    canvasY(benefit, maxY, layout),
    benefit,
  ]);

  const endDate = dateX(layout.canvasWidth, birthdate, layout);
  for (
    let i = selectedDate;
    i.lessThanOrEqual(endDate);
    i = i.addDuration(new MonthDuration(1))
  ) {
    if (benefitOnDate(recipient, selectedDate, i).value() !== benefit.value()) {
      benefit = benefitOnDate(recipient, selectedDate, i);
      boxes.push([
        canvasX(i, birthdate, layout),
        canvasY(benefit, maxY, layout),
        benefit,
      ]);
    }
  }
  return boxes;
}

/**
 * Renders the filled step-function boxes showing benefit amounts.
 */
export function renderFilingDateBenefitBoxes(
  ctx: CanvasRenderingContext2D,
  boxes: Array<[number, number, Money]>,
  recipient: Recipient,
  layout: FilingDateLayout
): void {
  const maxY = maxRenderedYDollars(recipient);

  ctx.save();
  ctx.strokeStyle = recipient.colors().medium;
  ctx.lineWidth = 2;
  ctx.beginPath();

  // Horizontal line from full right to starting date,
  // along the bottom ($0 axis).
  const zeroY = canvasY(Money.from(0), maxY, layout);
  ctx.moveTo(layout.canvasWidth, zeroY);
  ctx.lineTo(boxes[0][0], zeroY);
  for (let i = 0; i < boxes.length; i++) {
    const [x, y, _] = boxes[i];
    // First draw horizontally to the same date but the previous benefit.
    // This avoids a diagonal line when the benefit changes.
    if (i !== 0) {
      const [_x0, y0, _benefit] = boxes[i - 1];
      ctx.lineTo(x, y0);
    }
    ctx.lineTo(x, y);
  }
  // Draw all of the way to the right edge of the chart.
  ctx.lineTo(layout.canvasWidth, boxes[boxes.length - 1][1]);

  ctx.fillStyle = recipient.colors().light;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders text labels (dollars) for benefits along the edges of the boxes.
 *
 * Strategy (in order):
 * 1) Above and to the left of the box
 * 2) Same, but shorter text (no " / mo")
 * 3) To the left, vertically centered
 * 4) Same, but shorter text
 * 5) Give up
 */
export function renderBenefitLabels(
  ctx: CanvasRenderingContext2D,
  boxes: Array<[number, number, Money]>,
  recipient: Recipient,
  layout: FilingDateLayout
): void {
  const maxY = maxRenderedYDollars(recipient);

  ctx.save();
  ctx.fillStyle = recipient.colors().dark;
  ctx.font = '14px Helvetica';
  const fontHeight = 12;

  for (let boxIt = 0; boxIt < boxes.length; ++boxIt) {
    const [boxX, boxY, benefit] = boxes[boxIt];

    let horizSpace = layout.canvasWidth - boxX;
    if (boxes.length - 1 > boxIt) horizSpace = boxes[boxIt + 1][0] - boxX;
    let vertSpace = 100; // typically have plenty to top of chart.
    if (boxes.length - 1 > boxIt) vertSpace = boxY - boxes[boxIt + 1][1];

    // Prefer to fix text above, rather than left.
    let text = `${benefit.wholeDollars()} / mo`;
    let textBox = ctx.measureText(text);
    if (textBox.width + 10 < horizSpace && fontHeight + 10 < vertSpace) {
      renderTextInWhiteBox(ctx, text, boxX + 5, boxY - 5);
      continue;
    }

    // Again above, using shorter text.
    text = benefit.wholeDollars();
    textBox = ctx.measureText(text);
    if (textBox.width + 10 < horizSpace && fontHeight + 10 < vertSpace) {
      renderTextInWhiteBox(ctx, text, boxX + 5, boxY - 5);
      continue;
    }

    // Attempt to fix box 0 to the left of the text
    const boxMinX = boxIt === 0 ? 1 : boxes[boxIt - 1][0];
    const boxMaxY =
      boxIt === 0 ? canvasY(Money.from(0), maxY, layout) : boxes[boxIt - 1][1];
    horizSpace = boxX - boxMinX;
    vertSpace = boxMaxY - boxY;

    text = `${benefit.wholeDollars()} / mo`;
    textBox = ctx.measureText(text);
    if (textBox.width + 15 < horizSpace && fontHeight + 15 < vertSpace) {
      renderTextInWhiteBox(
        ctx,
        text,
        boxX - 8 - textBox.width,
        boxMaxY - (vertSpace - fontHeight) / 2 - fontHeight
      );
      continue;
    }

    // Try again with shorter text, removing ' / mo';
    text = benefit.wholeDollars();
    textBox = ctx.measureText(text);
    if (textBox.width + 15 < horizSpace && fontHeight + 15 < vertSpace) {
      renderTextInWhiteBox(
        ctx,
        text,
        boxX - 8 - textBox.width,
        boxMaxY - (vertSpace - fontHeight) / 2 - fontHeight
      );
    }
    // Give up and move to next box.
  }
  ctx.restore();
}

/**
 * Render the trendline showing benefit at each possible filing date.
 */
export function renderTrendline(
  ctx: CanvasRenderingContext2D,
  recipient: Recipient,
  userFloor: number,
  layout: FilingDateLayout
): void {
  const maxY = maxRenderedYDollars(recipient);
  const birthdate = recipient.birthdate;

  ctx.save();
  ctx.strokeStyle = recipient.colors().medium;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();

  const startDate = birthdate.dateAtSsaAge(new MonthDuration(userFloor));
  const endDate = birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
  );

  for (
    let i = startDate;
    i.lessThanOrEqual(endDate);
    i = i.addDuration(new MonthDuration(1))
  ) {
    const thisX = canvasX(i, birthdate, layout);
    const yDollars = benefitOnDate(recipient, i, i);
    const thisY = canvasY(yDollars, maxY, layout);
    if (i.monthsSinceEpoch() === startDate.monthsSinceEpoch()) {
      ctx.moveTo(thisX, thisY);
    } else {
      ctx.lineTo(thisX, thisY);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders the complete benefit visualization: boxes, trendline, and labels.
 */
export function renderBenefit(
  ctx: CanvasRenderingContext2D,
  recipient: Recipient,
  selectedDate: MonthDate,
  userFloor: number,
  layout: FilingDateLayout
): void {
  const boxes = benefitBoxes(recipient, selectedDate, layout);
  renderFilingDateBenefitBoxes(ctx, boxes, recipient, layout);
  renderTrendline(ctx, recipient, userFloor, layout);
  renderBenefitLabels(ctx, boxes, recipient, layout);
}

/**
 * Renders a vertical dashed line at a mouse position with a date label.
 */
export function renderSelectedDateVerticalLine(
  ctx: CanvasRenderingContext2D,
  mouseX: number,
  recipient: Recipient,
  layout: FilingDateLayout
): void {
  if (mouseX <= 0 || mouseX >= layout.canvasWidth) return;

  ctx.save();

  const date = dateX(mouseX, recipient.birthdate, layout);
  const text = `${date.monthName()} ${date.year()}`;
  const textWidth = ctx.measureText(text).width;
  // This seems to position the year to line up with the vertical year lines.
  // Why 67?  I don't know and didn't bother to figure it out.
  const xpos = layout.reservedTop + textWidth - 67;

  // blueish dashed line:
  ctx.strokeStyle = '#337ab7';
  ctx.setLineDash([6, 4]);
  ctx.lineCap = 'butt';
  ctx.lineWidth = 2;

  // Draw vertical line.
  ctx.beginPath();
  ctx.moveTo(mouseX, 0);
  ctx.lineTo(mouseX, layout.canvasHeight);
  ctx.stroke();
  ctx.save();
  ctx.translate(mouseX + 5, xpos);
  ctx.rotate((-90 * Math.PI) / 180);
  ctx.fillStyle = '#337ab7';
  renderTextInWhiteBox(ctx, text, 0, 0);
  ctx.restore();

  ctx.restore();
}
