import {
  dollarLineIncrement,
  renderHorizontalLine,
  renderTextInWhiteBox,
} from '$lib/components/chart-utils';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import type { RecipientContext } from './combined-chart-context';
import { userSelectedDate } from './combined-chart-context';
import {
  allBenefitsOnDate,
  type CombinedChartLayout,
  canvasX,
  canvasY,
  dateRange,
  dateX,
  type GapInfo,
  getGapInfo,
  maxRenderedYDollars,
  minRenderedYDollars,
} from './combined-chart-math';

/**
 * Render horizontal dollar-amount grid lines for both recipient and spouse.
 */
export function renderHorizontalLines(
  ctx: CanvasRenderingContext2D,
  recipientCtx: RecipientContext,
  spouseCtx: RecipientContext,
  layout: CombinedChartLayout
): void {
  const maxY = maxRenderedYDollars(recipientCtx, spouseCtx);
  const minY = minRenderedYDollars(recipientCtx, spouseCtx);

  ctx.save();
  ctx.strokeStyle = '#BBB';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);

  // Render the $0 line.
  renderHorizontalLine(
    ctx,
    Money.from(0),
    canvasY(recipientCtx, Money.from(0), maxY, minY, layout),
    layout.canvasWidth
  );

  const maxDollars = Money.max(maxY, minY);

  if (maxDollars.value() < 500) {
    ctx.restore();
    return;
  }

  const increment = dollarLineIncrement(maxDollars);

  for (let i = increment; i.value() < maxY.value(); i = i.plus(increment)) {
    renderHorizontalLine(
      ctx,
      i,
      canvasY(recipientCtx, i, maxY, minY, layout),
      layout.canvasWidth
    );
  }

  for (let i = increment; i.value() < minY.value(); i = i.plus(increment)) {
    renderHorizontalLine(
      ctx,
      i,
      canvasY(spouseCtx, i, maxY, minY, layout),
      layout.canvasWidth
    );
  }

  ctx.restore();
}

/**
 * Render visual zigzag indicator for the compressed gap region.
 */
function renderGapIndicator(
  ctx: CanvasRenderingContext2D,
  gap: GapInfo,
  recipient: Recipient,
  spouse: Recipient,
  layout: CombinedChartLayout
): void {
  const gapStartX = canvasX(gap.gapStartDate, recipient, spouse, layout);
  const gapEndX = canvasX(gap.gapEndDate, recipient, spouse, layout);
  const gapCenterX = (gapStartX + gapEndX) / 2;

  ctx.save();
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);

  const sampleTextWidth = ctx.measureText('2020').width;
  const yearLabelYPos = layout.reservedTop - sampleTextWidth - 25;
  const baseY = yearLabelYPos - sampleTextWidth / 2 + 3;

  const zigzagHeight = 5;
  const zigzagWidth = 3;
  const numZigs = 2;
  const totalZigWidth = numZigs * zigzagWidth * 2;
  const startX = gapCenterX - totalZigWidth / 2 - 2;

  ctx.beginPath();
  ctx.moveTo(startX, baseY);
  for (let i = 0; i < numZigs; i++) {
    ctx.lineTo(startX + zigzagWidth * (i * 2 + 1), baseY - zigzagHeight);
    ctx.lineTo(startX + zigzagWidth * (i * 2 + 2), baseY);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Render vertical year grid lines with gap-aware skipping and must-show years.
 */
export function renderYearVerticalLines(
  ctx: CanvasRenderingContext2D,
  recipient: Recipient,
  spouse: Recipient,
  layout: CombinedChartLayout
): void {
  ctx.save();
  ctx.strokeStyle = '#666';
  ctx.setLineDash([2, 2]);

  let [startDate, endDate] = dateRange(recipient, spouse);
  const gap = getGapInfo(recipient, spouse);

  // Collect years that must be shown: the year each recipient turns 62
  const mustShowYears = new Set<number>();
  const recipientAge62 = recipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
  );
  const spouseAge62 = spouse.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
  );
  mustShowYears.add(recipientAge62.year());
  mustShowYears.add(spouseAge62.year());

  const renderYearLine = (year: number) => {
    const date = MonthDate.initFromYearsMonths({ years: year, months: 0 });
    const x = canvasX(date, recipient, spouse, layout);

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, layout.canvasHeight);
    ctx.stroke();

    const text = `${date.year()}`;
    const textWidth = ctx.measureText(text).width;
    const ypos = layout.reservedTop - textWidth - 25;
    ctx.save();
    ctx.translate(x + 5, ypos);
    ctx.rotate((-90 * Math.PI) / 180);
    ctx.fillStyle = '#999';
    renderTextInWhiteBox(ctx, text, 0, 0);
    ctx.restore();
  };

  const renderedYears = new Set<number>();

  if (startDate.monthIndex() !== 0)
    startDate = MonthDate.initFromYearsMonths({
      years: startDate.year() + 1,
      months: 0,
    });

  for (
    let date = MonthDate.copyFrom(startDate);
    date.lessThanOrEqual(endDate);
    date = date.addDuration(
      MonthDuration.initFromYearsMonths({ years: 1, months: 0 })
    )
  ) {
    const year = date.year();

    // Skip years inside the gap (unless they're must-show years)
    if (
      gap.hasGap &&
      date.greaterThan(gap.gapStartDate) &&
      date.lessThan(gap.gapEndDate) &&
      !mustShowYears.has(year)
    ) {
      continue;
    }

    renderYearLine(year);
    renderedYears.add(year);
  }

  for (const year of mustShowYears) {
    if (!renderedYears.has(year)) {
      renderYearLine(year);
    }
  }

  if (gap.hasGap) {
    renderGapIndicator(ctx, gap, recipient, spouse, layout);
  }

  ctx.restore();
}

/**
 * Calculates benefit boxes for a single recipient in the combined chart.
 */
export function benefitBoxes(
  personCtx: RecipientContext,
  recipientCtx: RecipientContext,
  spouseCtx: RecipientContext,
  recipient: Recipient,
  spouse: Recipient,
  layout: CombinedChartLayout
): Array<[number, number, Money]> {
  const maxY = maxRenderedYDollars(recipientCtx, spouseCtx);
  const minY = minRenderedYDollars(recipientCtx, spouseCtx);
  const selectedDate = userSelectedDate(personCtx);

  const boxes: Array<[number, number, Money]> = [];
  let benefit = allBenefitsOnDate(
    personCtx,
    recipientCtx,
    spouseCtx,
    selectedDate
  );
  boxes.push([
    canvasX(selectedDate, recipient, spouse, layout),
    canvasY(personCtx, benefit, maxY, minY, layout),
    benefit,
  ]);

  const endDate = dateX(layout.canvasWidth, recipient, spouse, layout);
  for (
    let i = selectedDate;
    i.lessThanOrEqual(endDate);
    i = i.addDuration(new MonthDuration(1))
  ) {
    const all = allBenefitsOnDate(
      personCtx,
      recipientCtx,
      spouseCtx,
      i,
      selectedDate
    );
    if (all.value() !== benefit.value()) {
      benefit = all;
      boxes.push([
        canvasX(i, recipient, spouse, layout),
        canvasY(personCtx, benefit, maxY, minY, layout),
        benefit,
      ]);
    }
  }
  return boxes;
}

/**
 * Returns the index of the box with the largest minimum dimension (best for name placement).
 */
function bestBoxForName(
  boxes: Array<[number, number, Money]>,
  zeroLineY: number,
  canvasWidth: number
): number {
  let bestBox = 0;
  let bestDimen = 0;
  for (let i = 1; i < boxes.length; i++) {
    const [boxX, boxY, _benefit] = boxes[i];
    const yDim = Math.abs(boxY - zeroLineY);
    let xDim: number;
    if (boxes.length > i + 1) {
      xDim = Math.abs(boxes[i + 1][0] - boxX);
    } else {
      xDim = Math.abs(canvasWidth - boxX);
    }
    const minDimension = Math.min(xDim, yDim);
    if (minDimension > bestDimen) {
      bestDimen = minDimension;
      bestBox = i;
    }
  }
  return bestBox;
}

/**
 * Renders the recipient's name inside their largest benefit box.
 */
function renderName(
  ctx: CanvasRenderingContext2D,
  boxes: Array<[number, number, Money]>,
  personCtx: RecipientContext,
  recipientCtx: RecipientContext,
  spouseCtx: RecipientContext,
  layout: CombinedChartLayout
): void {
  const maxY = maxRenderedYDollars(recipientCtx, spouseCtx);
  const minY = minRenderedYDollars(recipientCtx, spouseCtx);
  const zeroLineY = canvasY(personCtx, Money.from(0), maxY, minY, layout);

  const nameBox = bestBoxForName(boxes, zeroLineY, layout.canvasWidth);
  if (boxes.length <= nameBox) return;

  const xMin = boxes[nameBox][0];
  let xMax: number;
  if (boxes.length > nameBox + 1) {
    xMax = boxes[nameBox + 1][0];
  } else {
    xMax = layout.canvasWidth;
  }

  let yMin = zeroLineY;
  let yMax = boxes[nameBox][1];
  if (yMax < yMin) {
    [yMin, yMax] = [yMax, yMin];
  }

  const regionWidth = xMax - xMin;
  const regionHeight = yMax - yMin;
  const centerX = xMin + regionWidth / 2;
  const centerY = yMin + regionHeight / 2;

  ctx.save();
  ctx.fillStyle = personCtx.r.colors().dark;
  for (let fontHeight = 24; fontHeight >= 10; fontHeight--) {
    ctx.font = `${fontHeight}px Helvetica`;
    const textBox = ctx.measureText(personCtx.r.name);
    if (textBox.width + 20 < regionWidth && fontHeight + 20 < regionHeight) {
      ctx.fillText(
        personCtx.r.name,
        centerX - textBox.width / 2,
        centerY + fontHeight * 0.4
      );
      break;
    }
  }
  ctx.restore();
}

/**
 * Renders the filled step-function boxes showing benefit amounts.
 */
export function renderFilingDateBenefitBoxes(
  ctx: CanvasRenderingContext2D,
  boxes: Array<[number, number, Money]>,
  personCtx: RecipientContext,
  recipientCtx: RecipientContext,
  spouseCtx: RecipientContext,
  layout: CombinedChartLayout
): void {
  const maxY = maxRenderedYDollars(recipientCtx, spouseCtx);
  const minY = minRenderedYDollars(recipientCtx, spouseCtx);

  ctx.save();
  ctx.strokeStyle = personCtx.r.colors().medium;
  ctx.lineWidth = 2;
  ctx.beginPath();

  const zeroY = canvasY(personCtx, Money.from(0), maxY, minY, layout);
  ctx.moveTo(layout.canvasWidth, zeroY);
  ctx.lineTo(boxes[0][0], zeroY);
  for (let i = 0; i < boxes.length; i++) {
    const [x, y, _] = boxes[i];
    if (i !== 0) {
      const [_x0, y0, _benefit] = boxes[i - 1];
      ctx.lineTo(x, y0);
    }
    ctx.lineTo(x, y);
  }
  ctx.lineTo(layout.canvasWidth, boxes[boxes.length - 1][1]);

  ctx.fillStyle = personCtx.r.colors().light;
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  renderName(ctx, boxes, personCtx, recipientCtx, spouseCtx, layout);
}

/**
 * Renders text labels (dollars) for benefits along the edges of the boxes.
 * Handles first/second recipient label positioning (above vs below).
 */
export function renderBenefitLabels(
  ctx: CanvasRenderingContext2D,
  boxes: Array<[number, number, Money]>,
  personCtx: RecipientContext,
  recipientCtx: RecipientContext,
  spouseCtx: RecipientContext,
  layout: CombinedChartLayout
): void {
  const maxY = maxRenderedYDollars(recipientCtx, spouseCtx);
  const minY = minRenderedYDollars(recipientCtx, spouseCtx);

  ctx.save();
  ctx.fillStyle = personCtx.r.colors().dark;
  ctx.font = '14px Helvetica';
  const fontHeight = 12;

  for (let boxIt = 0; boxIt < boxes.length; ++boxIt) {
    const [boxX, boxY, benefit] = boxes[boxIt];

    let horizSpace = layout.canvasWidth - boxX;
    if (boxes.length - 1 > boxIt) horizSpace = boxes[boxIt + 1][0] - boxX;
    let vertSpace = 100;
    if (boxes.length - 1 > boxIt) vertSpace = boxY - boxes[boxIt + 1][1];

    // Prefer to fix text above, rather than left.
    let text = `${benefit.wholeDollars()} / mo`;
    let textBox = ctx.measureText(text);
    if (textBox.width + 5 < horizSpace && fontHeight + 10 < vertSpace) {
      if (personCtx.r.first) {
        renderTextInWhiteBox(ctx, text, boxX + 5, boxY - 5);
      } else {
        renderTextInWhiteBox(ctx, text, boxX + 5, boxY + 5 + 12);
      }
      continue;
    }

    // Again above, using shorter text.
    text = benefit.wholeDollars();
    textBox = ctx.measureText(text);
    if (textBox.width + 10 < horizSpace && fontHeight + 10 < vertSpace) {
      if (personCtx.r.first) {
        renderTextInWhiteBox(ctx, text, boxX + 5, boxY - 5);
      } else {
        renderTextInWhiteBox(ctx, text, boxX + 5, boxY + 5 + 12);
      }
      continue;
    }

    // Attempt to fix to the left of the box
    const boxMinX = boxIt === 0 ? layout.reservedLeft : boxes[boxIt - 1][0];
    const boxMaxY =
      boxIt === 0
        ? canvasY(recipientCtx, Money.from(0), maxY, minY, layout)
        : boxes[boxIt - 1][1];

    horizSpace = boxX - boxMinX;
    vertSpace = Math.abs(boxMaxY - boxY);

    text = `${benefit.wholeDollars()} / mo`;
    textBox = ctx.measureText(text);
    if (textBox.width + 15 < horizSpace && fontHeight + 15 < vertSpace) {
      if (personCtx.r.first) {
        renderTextInWhiteBox(
          ctx,
          text,
          boxX - 8 - textBox.width,
          boxMaxY - (vertSpace - fontHeight) / 2 - fontHeight
        );
      } else {
        renderTextInWhiteBox(
          ctx,
          text,
          boxX - 8 - textBox.width,
          boxMaxY + (vertSpace - fontHeight) / 2 + fontHeight
        );
      }
      continue;
    }

    // Try again with shorter text
    text = benefit.wholeDollars();
    textBox = ctx.measureText(text);
    if (textBox.width + 15 < horizSpace && fontHeight + 15 < vertSpace) {
      if (personCtx.r.first) {
        renderTextInWhiteBox(
          ctx,
          text,
          boxX - 8 - textBox.width,
          boxMaxY - (vertSpace - fontHeight) / 2 - fontHeight
        );
      } else {
        renderTextInWhiteBox(
          ctx,
          text,
          boxX - 8 - textBox.width,
          boxMaxY + (vertSpace - fontHeight) / 2 + fontHeight
        );
      }
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
  personCtx: RecipientContext,
  recipientCtx: RecipientContext,
  spouseCtx: RecipientContext,
  recipient: Recipient,
  spouse: Recipient,
  layout: CombinedChartLayout
): void {
  const maxY = maxRenderedYDollars(recipientCtx, spouseCtx);
  const minY = minRenderedYDollars(recipientCtx, spouseCtx);

  ctx.save();
  ctx.strokeStyle = personCtx.r.colors().medium;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();

  const startDate = personCtx.startDate();
  for (
    let i = startDate;
    i.lessThanOrEqual(personCtx.endDate());
    i = i.addDuration(new MonthDuration(1))
  ) {
    const thisX = canvasX(i, recipient, spouse, layout);
    const yDollars = allBenefitsOnDate(
      personCtx,
      recipientCtx,
      spouseCtx,
      i,
      i
    );
    const thisY = canvasY(personCtx, yDollars, maxY, minY, layout);
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
 * Renders the complete benefit visualization for one recipient:
 * boxes, trendline, and labels.
 */
export function renderBenefit(
  ctx: CanvasRenderingContext2D,
  personCtx: RecipientContext,
  recipientCtx: RecipientContext,
  spouseCtx: RecipientContext,
  recipient: Recipient,
  spouse: Recipient,
  layout: CombinedChartLayout
): void {
  const boxes = benefitBoxes(
    personCtx,
    recipientCtx,
    spouseCtx,
    recipient,
    spouse,
    layout
  );
  renderFilingDateBenefitBoxes(
    ctx,
    boxes,
    personCtx,
    recipientCtx,
    spouseCtx,
    layout
  );
  renderTrendline(
    ctx,
    personCtx,
    recipientCtx,
    spouseCtx,
    recipient,
    spouse,
    layout
  );
  renderBenefitLabels(ctx, boxes, personCtx, recipientCtx, spouseCtx, layout);
}

/**
 * Renders a vertical dashed line at a mouse position with a date label.
 */
export function renderSelectedDateVerticalLine(
  ctx: CanvasRenderingContext2D,
  mouseX: number,
  recipient: Recipient,
  spouse: Recipient,
  layout: CombinedChartLayout
): void {
  if (mouseX <= 0 || mouseX >= layout.canvasWidth) return;
  ctx.save();

  const date = dateX(mouseX, recipient, spouse, layout);
  const text = `${date.monthName()} ${date.year()}`;
  const textWidth = ctx.measureText(text).width;

  ctx.strokeStyle = '#337ab7';
  ctx.setLineDash([6, 4]);
  ctx.lineCap = 'butt';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(mouseX, 0);
  ctx.lineTo(mouseX, layout.canvasHeight);
  ctx.stroke();

  {
    ctx.save();
    // This positions the year to line up with the vertical year lines.
    // Why 87?  I don't know and didn't bother to figure it out.
    const xpos = layout.reservedTop + textWidth - 87;
    ctx.translate(mouseX + 5, xpos);
    ctx.rotate((-90 * Math.PI) / 180);
    ctx.fillStyle = '#337ab7';
    renderTextInWhiteBox(ctx, text, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}
