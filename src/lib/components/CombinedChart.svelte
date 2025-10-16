<script lang="ts">
import { onMount, tick } from 'svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import { activeIntegration } from '$lib/integrations/context';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import RecipientName from './RecipientName.svelte';
import Slider from './Slider.svelte';

export let recipient: Recipient = new Recipient();
export let spouse: Recipient = new Recipient();

class RecipientContext {
  r: Recipient;
  // sliderMonths is bound to the value of the slider, in months.
  // This is set once in onMount to the user's NRA, typically 66 * 12.
  // It is not set by code, even if the users's birthday / NRA changes, so
  // that we don't override the user's selection should they have changed it
  // manually.
  sliderMonths: number = 62 * 12;
  // userFloor is the minimum age that the user can select. This may be
  // 62 years or 62 years and one month, depending on their birthdate.
  userFloor: number = 62 * 12;
  // Tick marks for the slider, including NRA labels.
  ticks: Array<{
    value: number;
    label?: string;
    legend?: string;
    color?: string;
  }> = [];

  startDate(): MonthDate {
    return this.r.birthdate.dateAtSsaAge(new MonthDuration(this.userFloor));
  }
  endDate(): MonthDate {
    return this.r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
    );
  }
}

let ctxA_ = new RecipientContext();
$: ctxA_.r = $recipient;
let ctxB_ = new RecipientContext();
$: ctxB_.r = $spouse;

let mounted_: boolean = false;
$: $recipient &&
  $spouse &&
  mounted_ &&
  ctxA_.sliderMonths &&
  ctxB_.sliderMonths &&
  render();

let sliderEl_: Slider;
let canvasEl_: HTMLCanvasElement;
let ctx_: CanvasRenderingContext2D;

// These indicate the number of pixels in the canvas that are reserved and
// thus outside the bounds of the chart data (x / y points).
const reservedLeft_: number = 70;
const reservedTop_: number = 240;
const reservedBottom_: number = 20;

// This is reserved for the right of the slider, but down not limit the chart
// data. We use this so that the chart extends beyond the edge of the slider
// to age 71, to allow the user to see beyond their maximum delayed filing
// date.
let reservedRight_: number = 0;

// The actual values for each of recipient and spouse depend on their relative
// birthdates. These will be recalculated in render().
let reservedLeftRecipient_: number = reservedLeft_;
let reservedLeftSpouse_: number = reservedLeft_;
let reservedRightRecipient_: number = reservedRight_;
let reservedRightSpouse_: number = reservedRight_;

let blueish_ = '#337ab7';

$: onMount(async () => {
  if (!canvasEl_) return;

  ctx_ = canvasEl_.getContext('2d');
  ctx_.font = 'bold 14px Helvetica';

  // Set guard flags during initialization to prevent circular updates
  updatingFromStoreA_ = true;
  updatingFromStoreB_ = true;

  ctxA_.sliderMonths = $recipient.normalRetirementAge().asMonths();
  ctxB_.sliderMonths = $spouse.normalRetirementAge().asMonths();

  // Now set stores to match initialized slider positions
  recipientFilingDate.set(userSelectedDate(ctxA_));
  spouseFilingDate.set(userSelectedDate(ctxB_));

  // Wait for one tick to ensure store updates propagate
  await tick();

  // Enable sync and render
  updatingFromStoreA_ = false;
  updatingFromStoreB_ = false;
  mounted_ = true;
  render();
});

let mouseToggle_: boolean = true;
let lastMouseX_: number = -1;
let lastMouseDate_: MonthDate = new MonthDate(0);

// Track if we're currently updating from stores to prevent circular updates
let updatingFromStoreA_: boolean = false;
let updatingFromStoreB_: boolean = false;

// Update stores when slider values change
// Only export after mount to ensure we start with NRA, not the default 62*12
$: {
  if (ctxA_.sliderMonths && $recipient && mounted_ && !updatingFromStoreA_) {
    recipientFilingDate.set(userSelectedDate(ctxA_));
  }
}
$: {
  if (ctxB_.sliderMonths && $spouse && mounted_ && !updatingFromStoreB_) {
    spouseFilingDate.set(userSelectedDate(ctxB_));
  }
}

// Sync slider positions when stores change (e.g., from individual charts or SurvivorReport)
$: {
  if ($recipientFilingDate && $recipient && mounted_) {
    const ageAtFiling = $recipient.birthdate.ageAtSsaDate($recipientFilingDate);
    const newSliderMonths = ageAtFiling.asMonths();
    // Only update if significantly different to avoid infinite loops
    if (Math.abs(newSliderMonths - ctxA_.sliderMonths) > 0.5) {
      syncSliderAFromStore(newSliderMonths);
    }
  }
}
$: {
  if ($spouseFilingDate && $spouse && mounted_) {
    const ageAtFiling = $spouse.birthdate.ageAtSsaDate($spouseFilingDate);
    const newSliderMonths = ageAtFiling.asMonths();
    // Only update if significantly different to avoid infinite loops
    if (Math.abs(newSliderMonths - ctxB_.sliderMonths) > 0.5) {
      syncSliderBFromStore(newSliderMonths);
    }
  }
}

async function syncSliderAFromStore(newSliderMonths: number) {
  updatingFromStoreA_ = true;
  await tick(); // Ensure flag update happens before slider change
  ctxA_.sliderMonths = newSliderMonths;
  await tick(); // Ensure slider change completes before unsetting flag
  updatingFromStoreA_ = false;
}

async function syncSliderBFromStore(newSliderMonths: number) {
  updatingFromStoreB_ = true;
  await tick(); // Ensure flag update happens before slider change
  ctxB_.sliderMonths = newSliderMonths;
  await tick(); // Ensure slider change completes before unsetting flag
  updatingFromStoreB_ = false;
}

function onClick(event: MouseEvent) {
  if (!canvasEl_) return;
  if (mouseToggle_) {
    mouseToggle_ = false;
  } else {
    mouseToggle_ = true;
    lastMouseX_ = event.clientX - canvasEl_.getBoundingClientRect().left;
  }
  render();
}

function onMove(event: MouseEvent) {
  if (!mouseToggle_) return;
  if (!canvasEl_) return;
  let mouseY = event.clientY - canvasEl_.getBoundingClientRect().top;
  // 150 pixels is the height of the slider portion of the chart. Having the
  // mouse move when the user wants to drag sliders is distracting, so we
  // ignore movement in this area:
  if (mouseY < 150) return;

  lastMouseX_ = event.clientX - canvasEl_.getBoundingClientRect().left;
  // Avoid redrawing if the mouse hasn't moved to a new month.
  const mouseDate = dateX(lastMouseX_);
  if (mouseDate.monthsSinceEpoch() === lastMouseDate_.monthsSinceEpoch())
    return;
  lastMouseDate_ = mouseDate;

  render();
}

function onOut(_event: MouseEvent) {
  if (!mouseToggle_) return;
  lastMouseX_ = -1;
  render();
}

function onBlur(_event: FocusEvent) {
  if (!mouseToggle_) return;
  lastMouseX_ = -1;
  render();
}

// Returns all benefits on a given date, including spousal benefits.
// Pulls the filing dates automatically from the sliders. If selfFilingDate
// is specified, uses that instead of the slider value.
function allBenefitsOnDate(
  ctxR: RecipientContext,
  atDate: MonthDate,
  selfFilingDate: MonthDate = new MonthDate(0)
): Money {
  let spouseFilingDate: MonthDate;
  let spouse: Recipient;
  if (ctxR.r.first) {
    if (selfFilingDate.monthsSinceEpoch() === 0)
      selfFilingDate = userSelectedDate(ctxA_);
    spouseFilingDate = userSelectedDate(ctxB_);
    spouse = ctxB_.r;
  } else {
    if (selfFilingDate.monthsSinceEpoch() === 0)
      selfFilingDate = userSelectedDate(ctxB_);
    spouseFilingDate = userSelectedDate(ctxA_);
    spouse = ctxA_.r;
  }

  return ctxR.r.allBenefitsOnDate(
    spouse,
    spouseFilingDate,
    selfFilingDate,
    atDate
  );
}

/**
 * Returns the maximum dollars that will be displayed on the upper portion of
 * the chart. This is the maximum benefit the first recipient.
 */
function maxRenderedYDollars(): Money {
  const [youngerRecipient, _olderRecipient] = YoungerOlder();
  let endDate = youngerRecipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
  );
  return ctxA_.r.allBenefitsOnDate(ctxB_.r, endDate, endDate, endDate);
}

/**
 * Returns the maximum dollars that will be displayed on the lower portion of
 * the chart. This is the maximum benefit the secont recipient.
 */
function minRenderedYDollars(): Money {
  const [youngerRecipient, _olderRecipient_] = YoungerOlder();
  let endDate = youngerRecipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
  );
  return ctxB_.r.allBenefitsOnDate(ctxA_.r, endDate, endDate, endDate);
}

/**
 * Compute the canvas x-coordinate for a date.
 */
function canvasX(date: MonthDate): number {
  const [startDate, endDate] = DateRange();
  const xValue =
    (date.subtractDate(startDate).asMonths() /
      endDate.subtractDate(startDate).asMonths()) *
    (canvasEl_.width - reservedLeft_);
  return reservedLeft_ + Math.round(xValue);
}

/**
 * Inverse of canvasX, computes a date from a canvas x-coordinate.
 * @param x The x-coordinate in canvas pixels.
 */
function dateX(x: number): MonthDate {
  const [startDate, endDate] = DateRange();

  // Clip x to a range of [reservedLeft_, canvasEl_.width] to ensure that
  // the date is within the chart bounds.
  x = Math.max(reservedLeft_, Math.min(canvasEl_.width, x));

  const percent = (x - reservedLeft_) / (canvasEl_.width - reservedLeft_);

  let numMonths = Math.round(
    endDate.subtractDate(startDate).asMonths() * percent
  );
  return startDate.addDuration(new MonthDuration(numMonths));
}

/**
 * Compute the canvas y-coordinate for a benefit dollars value
 */
function canvasY(ctxR: RecipientContext, benefitY: Money): number {
  // chartHeight is the number of vertical pixels dedicated to showing
  // charted data about monthly benefits.
  const chartHeight = canvasEl_.height - reservedTop_ - reservedBottom_;
  // dollarsHeight is the number of dollars to be rendered on the chart, which
  // is the sum of dollars from both recipients.
  const dollarsHeight = maxRenderedYDollars().plus(minRenderedYDollars());

  const pixelsPerDollar = chartHeight / dollarsHeight.value();

  const zeroHeight = minRenderedYDollars().value() * pixelsPerDollar;

  // Determine the y-coordinate of benefitY in canvas pixels. The 0 value is
  // the visually lowest point in the chart correspongind to the maximum
  // benefit for the second recipient.
  let chartY: number = 0;
  if (ctxR.r.first) {
    chartY = zeroHeight + benefitY.value() * pixelsPerDollar;
  } else {
    // Subtract 1 pixel so that the two zero lines aren't drawn on top of
    // each other. Technically this makes the chart slightly out of scale, but
    // it's not noticeable.
    chartY = zeroHeight - benefitY.value() * pixelsPerDollar - 1;
  }

  return Math.floor(canvasEl_.height - reservedBottom_ - chartY);
}

function renderTextInWhiteBox(text: string, x: number, y: number) {
  let textWidth = ctx_.measureText(text).width;

  // First, draw the white box.
  ctx_.save();
  ctx_.fillStyle = '#FFF';
  ctx_.fillRect(x - 7, y - 14, textWidth + 14, 18);
  ctx_.restore();

  // Then draw the text.
  ctx_.fillText(text, x, y);
}

function renderHorizontalLine(dollarY: Money, canvasY: number) {
  ctx_.beginPath();
  ctx_.moveTo(0, canvasY);
  ctx_.lineTo(canvasEl_.width, canvasY);
  ctx_.stroke();

  let text = dollarY.wholeDollars();

  ctx_.save();
  ctx_.fillStyle = '#AAA';
  renderTextInWhiteBox(text, 6, canvasY + 5);
  ctx_.restore();
}

/**
 * Render a series of horizontal lines representing the dollar amounts at
 * each y-level.
 */
function renderHorizontalLines() {
  ctx_.save();
  // Grey dashed lines.
  ctx_.strokeStyle = '#BBB';
  ctx_.lineWidth = 1;
  ctx_.setLineDash([2, 2]);

  // Render the $0 line.
  renderHorizontalLine(Money.from(0), canvasY(ctxA_, Money.from(0)));

  const maxDollars = Money.max(maxRenderedYDollars(), minRenderedYDollars());

  if (maxDollars.value() < 500) {
    ctx_.restore();
    return;
  }

  // Work out a reasonable increment to show dollar lines.
  let increment = Money.from(100);
  if (maxDollars.value() > 1000) increment = Money.from(250);
  if (maxDollars.value() > 1500) increment = Money.from(500);
  if (maxDollars.value() > 3000) increment = Money.from(1000);

  for (
    let i = increment;
    i.value() < maxRenderedYDollars().value();
    i = i.plus(increment)
  ) {
    renderHorizontalLine(i, canvasY(ctxA_, i));
  }

  for (
    let i = increment;
    i.value() < minRenderedYDollars().value();
    i = i.plus(increment)
  ) {
    renderHorizontalLine(i, canvasY(ctxB_, i));
  }

  ctx_.restore();
}

function renderYearVerticalLines() {
  ctx_.save();
  // Grey dashed lines.
  ctx_.strokeStyle = '#666';
  ctx_.setLineDash([2, 2]);

  let [startDate, endDate] = DateRange();

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
    // Draw vertical line.
    ctx_.beginPath();
    ctx_.moveTo(canvasX(date), 0);
    ctx_.lineTo(canvasX(date), canvasEl_.height);
    ctx_.stroke();

    // Print the year vertically atop the line, with a white rectangle behind
    // the text, so that the line isn't going through the text.
    const text = `${date.year()}`;
    let textWidth = ctx_.measureText(text).width;
    let ypos = reservedTop_ - textWidth - 25;
    ctx_.save();
    ctx_.translate(canvasX(date) + 5, ypos);
    ctx_.rotate((-90 * Math.PI) / 180);
    ctx_.fillStyle = '#999';
    renderTextInWhiteBox(text, 0, 0);
    ctx_.restore();
  }
  ctx_.restore();
}

function updateSlider(ctxR: RecipientContext) {
  // We don't want users to select a start date earlier than is allowed.
  // For those born on the 1st/2nd, that's 62y0m. For everyone else, it's
  // 62y1m.
  if (ctxR.r.birthdate.layBirthDayOfMonth() <= 2) {
    ctxR.userFloor = 62 * 12;
  } else {
    ctxR.userFloor = 62 * 12 + 1;
  }

  ctxR.ticks = [];

  let startAge = MonthDuration.initFromYearsMonths({ years: 62, months: 0 });
  let endAge = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
  for (
    let age = MonthDuration.copyFrom(startAge);
    age.lessThanOrEqual(endAge);
    age = age.add(MonthDuration.initFromYearsMonths({ years: 1, months: 0 }))
  ) {
    const monthsUntilNRA: number = ctxR.r
      .normalRetirementAge()
      .subtract(age)
      .asMonths();
    if (monthsUntilNRA === 0) {
      // This tick is the NRA, indicate it with a special legend.
      ctxR.ticks.push({
        value: age.asMonths(),
        label: translateSliderLabel(age.asMonths(), 'tick-value'),
        legend: 'NRA',
        color: ctxR.r.colors().dark,
      });
    } else {
      // Not an NRA tick, so just add it normally.
      ctxR.ticks.push({
        value: age.asMonths(),
        label: translateSliderLabel(age.asMonths(), 'tick-value'),
      });
    }

    if (monthsUntilNRA > 0 && monthsUntilNRA < 12) {
      // The NRA is between this and the next tick: add a special tick for it.
      ctxR.ticks.push({
        value: ctxR.r.normalRetirementAge().asMonths(),
        label: '',
        legend: 'NRA',
        color: ctxR.r.colors().dark,
      });
    }
  }
  // eslint-disable-next-line no-self-assign
  ctxR.ticks = ctxR.ticks;
}

function minCapSlider(ctx0: RecipientContext, ctx1: RecipientContext) {
  // If one of the users has a zero PIA, we don't allow them to file before
  // the other user:
  if (ctx0.r.pia().primaryInsuranceAmount().value() === 0) {
    ctx0.userFloor = ctx0.r.birthdate
      .ageAtSsaDate(
        ctx1.r.birthdate.dateAtSsaAge(new MonthDuration(ctx1.sliderMonths))
      )
      .asMonths();
    // Similarly min cap the actual slider value:
    if (ctx0.sliderMonths < ctx0.userFloor) {
      ctx0.sliderMonths = ctx0.userFloor;
    }
  }
}

function userSelectedDate(ctxR: RecipientContext) {
  let selectedAge = new MonthDuration(ctxR.sliderMonths);
  let selectedDate = ctxR.r.birthdate.dateAtSsaAge(selectedAge);
  return selectedDate;
}

/**
 * Calculates the set of visualized boxes showing the benefit amounts given
 * the currently selected start date.
 *
 * Returns the top left coordinates of each box, and the benefit value
 * associated with the y-coordinate of the box.
 *
 * @returns {Array<[number, number, Money]>} The set of boxes to render. Each
 *    box is a tuple of [x, y, benefit].
 */
function benefitBoxes(ctxR: RecipientContext) {
  const selectedDate = userSelectedDate(ctxR);

  let boxes = [];
  let benefit = allBenefitsOnDate(ctxR, selectedDate);
  boxes.push([canvasX(selectedDate), canvasY(ctxR, benefit), benefit]);

  for (
    let i = selectedDate;
    i.lessThanOrEqual(dateX(canvasEl_.width));
    i = i.addDuration(new MonthDuration(1))
  ) {
    let all = allBenefitsOnDate(ctxR, i, selectedDate);
    if (all.value() !== benefit.value()) {
      benefit = all;
      boxes.push([canvasX(i), canvasY(ctxR, benefit), benefit]);
    }
  }
  return boxes;
}

/**
 * Renders the boxes showing the benefit amounts at different actual dates
 * given the currently selected start date.
 */
function renderFilingDateBenefitBoxes(
  boxes: Array<[number, number, Money]>,
  ctxR: RecipientContext
) {
  ctx_.save();

  ctx_.strokeStyle = ctxR.r.colors().medium;
  ctx_.lineWidth = 2;
  ctx_.beginPath();

  // Horizontal line from full right to starting date,
  // along the bottom ($0 axis).
  ctx_.moveTo(canvasEl_.width, canvasY(ctxR, Money.from(0)));
  ctx_.lineTo(boxes[0][0], canvasY(ctxR, Money.from(0)));
  for (let i = 0; i < boxes.length; i++) {
    let [x, y, _] = boxes[i];
    // First draw horizontally to the same date but the previous benefit.
    // This avoids a diagonal line when the benefit changes.
    if (i !== 0) {
      let [_x0, y0, _benefit] = boxes[i - 1];
      ctx_.lineTo(x, y0);
    }
    ctx_.lineTo(x, y);
  }
  // Draw all of the way to the right edge of the chart.
  ctx_.lineTo(canvasEl_.width, boxes[boxes.length - 1][1]);

  ctx_.fillStyle = ctxR.r.colors().light;
  ctx_.fill();
  ctx_.stroke();
  ctx_.restore();

  renderName(boxes, ctxR);
}

// Return the box with the largest minimum dimension.
function bestBoxForName(
  boxes: Array<[number, number, Money]>,
  ctxR: RecipientContext
) {
  const zeroLineY = canvasY(ctxR, Money.from(0));

  // Find the box that is closest to the middle of the chart.
  let bestBox = 0;
  let bestDimen = 0;
  for (let i = 1; i < boxes.length; i++) {
    let [boxX, boxY, _benefit] = boxes[i];
    const yDim = Math.abs(boxY - zeroLineY);
    let xDim = 0;
    if (boxes.length > i + 1) {
      xDim = Math.abs(boxes[i + 1][0] - boxX);
    } else {
      xDim = Math.abs(canvasEl_.width - boxX);
    }
    const minDimension = Math.min(xDim, yDim);
    if (minDimension > bestDimen) {
      bestDimen = minDimension;
      bestBox = i;
    }
  }
  return bestBox;
}

function renderName(
  boxes: Array<[number, number, Money]>,
  ctxR: RecipientContext
) {
  const nameBox: number = bestBoxForName(boxes, ctxR);
  if (boxes.length <= nameBox) return;

  let xMin: number = boxes[nameBox][0];
  let xMax: number;
  if (boxes.length > nameBox + 1) {
    xMax = boxes[nameBox + 1][0];
  } else {
    xMax = canvasEl_.width;
  }

  let yMin: number = canvasY(ctxR, Money.from(0));
  let yMax: number = boxes[nameBox][1];
  if (yMax < yMin) {
    [yMin, yMax] = [yMax, yMin];
  }

  let regionWidth = xMax - xMin;
  let regionHeight = yMax - yMin;
  let centerX = xMin + regionWidth / 2;
  let centerY = yMin + regionHeight / 2;

  ctx_.save();
  ctx_.fillStyle = ctxR.r.colors().dark;
  for (let font_height = 24; font_height >= 10; font_height--) {
    ctx_.font = `${font_height}px Helvetica`;
    let textBox = ctx_.measureText(ctxR.r.name);
    // If there is enough space at this font size, draw the user's name,
    // else try a smaller font.
    if (textBox.width + 20 < regionWidth && font_height + 20 < regionHeight) {
      ctx_.fillText(
        ctxR.r.name,
        centerX - textBox.width / 2,
        centerY + font_height * 0.4
      );
      break;
    }
  }
  ctx_.restore();
}

/**
 * Renders text labels (dollars) for benefits along the edges of the boxes,
 * if possible.
 *
 * The strategy is to in this order:
 * 1) Try to place the text above and to the left hand side of the box.
 * 2) Do the same, but with shorter text, dropping the " / mo" suffix.
 * 3) Try to place the text to the left vertically centered.
 * 4) Do the same, but with shorter text, dropping the " / mo" suffix.
 * 5) Give up.
 *
 * At each point, if the text won't fit comfortably, we try the next strategy.
 */
function renderBenefitLabels(
  boxes: Array<[number, number, Money]>,
  ctxR: RecipientContext
) {
  ctx_.save();
  ctx_.fillStyle = ctxR.r.colors().dark;
  ctx_.font = '14px Helvetica';
  let font_height = 12;

  for (let boxIt = 0; boxIt < boxes.length; ++boxIt) {
    let [boxX, boxY, benefit] = boxes[boxIt];

    let horizSpace = canvasEl_.width - boxX;
    if (boxes.length - 1 > boxIt) horizSpace = boxes[boxIt + 1][0] - boxX;
    // typically have plenty of vertical space to chart edges
    let vertSpace = 100;
    if (boxes.length - 1 > boxIt) vertSpace = boxY - boxes[boxIt + 1][1];

    // Prefer to fix text above, rather than left.
    let text = `${benefit.wholeDollars()} / mo`;
    let textBox = ctx_.measureText(text);
    if (textBox.width + 5 < horizSpace && font_height + 10 < vertSpace) {
      if (ctxR.r.first) {
        renderTextInWhiteBox(text, boxX + 5, boxY - 5);
      } else {
        renderTextInWhiteBox(text, boxX + 5, boxY + 5 + 12);
      }
      continue;
    }

    // Again above, using shorter text.
    text = benefit.wholeDollars();
    textBox = ctx_.measureText(text);
    if (textBox.width + 10 < horizSpace && font_height + 10 < vertSpace) {
      if (ctxR.r.first) {
        renderTextInWhiteBox(text, boxX + 5, boxY - 5);
      } else {
        renderTextInWhiteBox(text, boxX + 5, boxY + 5 + 12);
      }
      continue;
    }

    // Attempt to fix box 0 to the left of the text
    let boxMinX = boxIt === 0 ? reservedLeft_ : boxes[boxIt - 1][0];
    let boxMaxY: number;
    boxMaxY = boxIt === 0 ? canvasY(ctxA_, Money.from(0)) : boxes[boxIt - 1][1];

    horizSpace = boxX - boxMinX;
    vertSpace = Math.abs(boxMaxY - boxY);

    text = `${benefit.wholeDollars()} / mo`;
    textBox = ctx_.measureText(text);
    if (textBox.width + 15 < horizSpace && font_height + 15 < vertSpace) {
      if (ctxR.r.first) {
        renderTextInWhiteBox(
          text,
          boxX - 8 - textBox.width,
          boxMaxY - (vertSpace - font_height) / 2 - font_height
        );
      } else {
        renderTextInWhiteBox(
          text,
          boxX - 8 - textBox.width,
          boxMaxY + (vertSpace - font_height) / 2 + font_height
        );
      }
      continue;
    }

    // Try again with shorter text, removing ' / mo';
    text = benefit.wholeDollars();
    textBox = ctx_.measureText(text);
    if (textBox.width + 15 < horizSpace && font_height + 15 < vertSpace) {
      if (ctxR.r.first) {
        renderTextInWhiteBox(
          text,
          boxX - 8 - textBox.width,
          boxMaxY - (vertSpace - font_height) / 2 - font_height
        );
      } else {
        renderTextInWhiteBox(
          text,
          boxX - 8 - textBox.width,
          boxMaxY + (vertSpace - font_height) / 2 + font_height
        );
      }
    }
    // Give up and move to next box.
  }
  ctx_.restore();
}

/**
 * Render a thin line showing the trendline of the benefit matching the user
 * dragging the slider across the page.
 */
function renderTrendline(ctxR: RecipientContext) {
  ctx_.save();
  ctx_.strokeStyle = ctxR.r.colors().medium;
  ctx_.lineWidth = 2;
  ctx_.globalAlpha = 0.4;
  ctx_.beginPath();

  for (
    let i = ctxR.startDate();
    i.lessThanOrEqual(ctxR.endDate());
    i = i.addDuration(new MonthDuration(1))
  ) {
    let thisX = canvasX(i);
    let yDollars = allBenefitsOnDate(ctxR, i, i);
    let thisY = canvasY(ctxR, yDollars);
    if (i.monthsSinceEpoch() === ctxR.startDate().monthsSinceEpoch()) {
      ctx_.moveTo(thisX, thisY);
    } else {
      ctx_.lineTo(thisX, thisY);
    }
  }
  ctx_.stroke();
  ctx_.restore();
}

/**
 * Render the benefit of the recipient.
 */
function renderBenefit(ctxR: RecipientContext) {
  let boxes = benefitBoxes(ctxR);
  renderFilingDateBenefitBoxes(boxes, ctxR);
  renderTrendline(ctxR);
  renderBenefitLabels(boxes, ctxR);
}

/**
 * Renders a single vertical line at the user's selected date.
 * @param canvasX x-coordinate of vertical line we should render.
 */
function renderSelectedDateVerticalLine(canvasX: number) {
  if (canvasX <= 0 || canvasX >= canvasEl_.width) return;
  ctx_.save();

  let date = dateX(canvasX);
  let text = `${date.monthName()} ${date.year()}`;
  let textWidth = ctx_.measureText(text).width;

  // blueish_ dashed line:
  ctx_.strokeStyle = blueish_;
  ctx_.setLineDash([6, 4]);
  ctx_.lineCap = 'butt';
  ctx_.lineWidth = 2;

  // Draw vertical line.
  ctx_.beginPath();
  ctx_.moveTo(canvasX, 0);
  ctx_.lineTo(canvasX, canvasEl_.height);
  ctx_.stroke();

  // Print the year vertically atop the line, with a white rectangle behind
  // the text, so that the line isn't going through the text.
  {
    ctx_.save();
    // This positions the year to line up with the vertical year lines.
    // Why 87?  I don't know and didn't bother to figure it out.
    let xpos = reservedTop_ + textWidth - 87;
    ctx_.translate(canvasX + 5, xpos);
    ctx_.rotate((-90 * Math.PI) / 180);
    ctx_.fillStyle = '#337ab7';
    renderTextInWhiteBox(text, 0, 0);
    ctx_.restore();
  }

  ctx_.restore();
}

// Returns the Recipient who is younger and who is older in that order.
function YoungerOlder(): [Recipient, Recipient] {
  // If the recipients are the same age, arbitrarily pick the recipient
  // as the younger one.
  if (recipient.birthdate.ssaBirthdate() === spouse.birthdate.ssaBirthdate()) {
    return [recipient, spouse];
  }

  // Determine which recipient is older / younger.
  // Slight point of confusion: The younger recipient is the
  // one who has the *higher* birthdate.
  const youngerRecipient: Recipient =
    recipient.birthdate.ssaBirthdate() < spouse.birthdate.ssaBirthdate()
      ? spouse
      : recipient;
  const olderRecipient: Recipient =
    recipient.birthdate.ssaBirthdate() < spouse.birthdate.ssaBirthdate()
      ? recipient
      : spouse;

  return [youngerRecipient, olderRecipient];
}

// Returns the range of dates to show on the canvas.
function DateRange(): [MonthDate, MonthDate] {
  const [youngerRecipient, olderRecipient] = YoungerOlder();
  let startDate: MonthDate = olderRecipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
  );
  // Allow the canvas to show all of the way to age 71, so that there is
  // some rendered space if the user slides the slider all of the way to 70.
  let endDate = youngerRecipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
  );
  return [startDate, endDate];
}

// Computes the difference in months between the birthdates of two recipients.
function AgeDiff(recipientA: Recipient, recipientB: Recipient): number {
  return Math.abs(
    recipientA.birthdate
      .ssaBirthMonthDate()
      .subtractDate(recipientB.birthdate.ssaBirthMonthDate())
      .asMonths()
  );
}

function layoutMonths() {
  // Determine which recipient is older / younger. If they are the same age
  // to the date, it won't matter for this calculation that we assign the same
  // person twice. Slight point of confusion: The younger recipient is the
  // one who has the higher birthdate.
  const [youngerRecipient, olderRecipient] = YoungerOlder();
  // We need to first determine the span of time that we want to render,
  // starting with the date that the older recipient turns 62 and ending with
  // the date that the younger recipient turns 70.
  const numMonths = AgeDiff(youngerRecipient, olderRecipient) + 12 * 8;

  // We want enough space to show enough to the right of the date range so
  // that it's clear that the benefit continues past age 70. Add one more year
  // to the range to reserve this.
  const numMonthsWithBuffer = numMonths + 12;
  const pixelsPerMonth =
    (canvasEl_.width - reservedLeft_) / numMonthsWithBuffer;

  // Reserve 12 months on the right:
  reservedRight_ = Math.round(pixelsPerMonth * 12);

  // Determine the reserved right for each recipient:
  reservedRightRecipient_ = Math.round(
    AgeDiff(youngerRecipient, recipient) * pixelsPerMonth + reservedRight_
  );
  reservedRightSpouse_ = Math.round(
    AgeDiff(youngerRecipient, spouse) * pixelsPerMonth + reservedRight_
  );
  reservedLeftRecipient_ = Math.round(
    AgeDiff(olderRecipient, recipient) * pixelsPerMonth + reservedLeft_
  );
  reservedLeftSpouse_ = Math.round(
    AgeDiff(olderRecipient, spouse) * pixelsPerMonth + reservedLeft_
  );
}

/**
 *  Render the chart.
 */
function render() {
  if (!mounted_) return;
  if (!canvasEl_) return;

  layoutMonths();
  updateSlider(ctxA_);
  updateSlider(ctxB_);
  minCapSlider(ctxA_, ctxB_);
  minCapSlider(ctxB_, ctxA_);

  // Trigger Svelte reactivity by re-assigning the context objects
  // This ensures the Slider components see the updated ticks
  // eslint-disable-next-line no-self-assign
  ctxA_ = ctxA_;
  // eslint-disable-next-line no-self-assign
  ctxB_ = ctxB_;

  ctx_.save();
  ctx_.clearRect(0, 0, canvasEl_.width, canvasEl_.height);

  renderHorizontalLines();
  renderYearVerticalLines();
  renderBenefit(ctxA_);
  renderBenefit(ctxB_);

  if (lastMouseX_ > 0) {
    renderSelectedDateVerticalLine(lastMouseX_);
  }

  ctx_.restore();
}

/**
 * Translation function for slider labels to map months to ages.
 */
function translateSliderLabel(value: number, label: string): string {
  const age = new MonthDuration(value);
  if (label === 'value' || label === 'ceiling' || label === 'floor') {
    if (age.modMonths() === 0) return age.years().toString(10);
    let out = `${age.years()} ${age.modMonths()} mo`;
    return out;
  }
  // tick-value is the text above each tick mark
  if (label === 'tick-value') {
    return age.years().toString(10);
  }
  return '';
}
</script>

<div>
  <h3>Explore Filing Dates</h3>
  {#if $recipient.pia().primaryInsuranceAmount().value() === 0 && $spouse
      .pia()
      .primaryInsuranceAmount()
      .value() === 0}
    <p>
      Neither you nor your spouse have a PIA, so filing dates have no effect.
      Try using the simulated future years of earnings sliders in the "Earnings
      Report" sections to see what would be required to become eligible for
      benefits.
    </p>
  {/if}
  <p>
    The following <i class="noprint">interactive</i> tool visualizes how
    different filing dates for both <RecipientName r={recipient} /> and <RecipientName
      r={spouse}
    /> affect total benefits, including the spousal benefit.
    <span class="noprint"
      >Move the slider to select a filing date for each person and hover over
      the chart to see the benefit amounts for that date.
      <a href="/guides/filing-date-chart" target="_blank"
        >Click for more help.</a
      >
    </span>
  </p>

  <div class="narrowWarningBox noprint">
    <h4>Small Screen Warning</h4>
    <div class="grid">
      <p>
        This chart doesn't fit on a screen this narrow, such as a phone oriented
        vertically.
      </p>
      <p>Rotate your phone to landscape mode or use a larger screen.</p>
    </div>
  </div>

  <div class="chart-container">
    <p class="sliderLabel">
      <span class="noprint">
        Select the age that <RecipientName
          r={recipient}
          suffix="
  files">you file</RecipientName
        > for benefits:
      </span>
      <span class="onlyprint">
        Age that <RecipientName
          r={recipient}
          suffix="
  files">you file</RecipientName
        > for benefits:
      </span>
    </p>
    <div
      class="slider-box"
      style:--reserved-left="{reservedLeftRecipient_}px"
      style:--reserved-right="{reservedRightRecipient_}px"
    >
      <Slider
        bind:value={ctxA_.sliderMonths}
        bind:this={sliderEl_}
        floor={62 * 12}
        userFloor={ctxA_.userFloor}
        ceiling={70 * 12}
        step={1}
        translate={translateSliderLabel}
        showTicks={true}
        ticksArray={ctxA_.ticks}
        barLeftColor={ctxA_.r.colors().light}
        barRightColor={ctxA_.r.colors().medium}
        tickLeftColor={ctxA_.r.colors().light}
        tickRightColor={ctxA_.r.colors().medium}
        handleColor={ctxA_.r.colors().medium}
        handleSelectedColor={ctxA_.r.colors().dark}
        tickLegendColor={ctxA_.r.colors().dark}
      />
    </div>
    <p class="sliderLabel">
      <span class="noprint">
        Select the age that <RecipientName
          r={spouse}
          suffix="
  files">you file</RecipientName
        > for benefits:
      </span>
      <span class="onlyprint">
        Age that <RecipientName
          r={spouse}
          suffix="
  files">you file</RecipientName
        > for benefits:
      </span>
    </p>
    <div
      class="slider-box"
      style:--reserved-left="{reservedLeftSpouse_}px"
      style:--reserved-right="{reservedRightSpouse_}px"
    >
      <Slider
        bind:value={ctxB_.sliderMonths}
        bind:this={sliderEl_}
        floor={62 * 12}
        userFloor={ctxB_.userFloor}
        ceiling={70 * 12}
        step={1}
        translate={translateSliderLabel}
        showTicks={true}
        ticksArray={ctxB_.ticks}
        barLeftColor={ctxB_.r.colors().light}
        barRightColor={ctxB_.r.colors().medium}
        tickLeftColor={ctxB_.r.colors().light}
        tickRightColor={ctxB_.r.colors().medium}
        handleColor={ctxB_.r.colors().medium}
        handleSelectedColor={ctxB_.r.colors().dark}
        tickLegendColor={ctxB_.r.colors().dark}
      />
    </div>
    <canvas
      width="620"
      height="500"
      bind:this={canvasEl_}
      on:mousedown={onClick}
      on:pointermove={onMove}
      on:mouseout={onOut}
      on:blur={onBlur}
    ></canvas>
    <div style:height="362px"></div>
    <div
      class="selectedDateBox"
      style:--selected-date-border-color={blueish_}
      style:--selected-date-text-color={blueish_}
      style:--filing-date-text-color={blueish_}
      class:hidden={lastMouseX_ <= 0}
    >
      {#if lastMouseX_ > 0}
        <table class="combinedBenefit">
          <tbody>
            <tr>
              <td colspan="3" class="date">
                In <span class="selectedDate"
                  >{dateX(lastMouseX_).monthName()}
                  {dateX(lastMouseX_).year()}</span
                >,
              </td>
            </tr>
            <tr>
              <td class="indent"></td>
              <td class="label">
                <RecipientName r={ctxA_.r} apos shortenTo={50} /> Benefit:
              </td>
              <td class="value">
                {allBenefitsOnDate(ctxA_, dateX(lastMouseX_)).wholeDollars()}
              </td>
            </tr>
            <tr>
              <td class="indent"></td>
              <td class="label">
                <RecipientName r={ctxB_.r} apos shortenTo={50} /> Benefit:
              </td>
              <td class="value">
                {allBenefitsOnDate(ctxB_, dateX(lastMouseX_)).wholeDollars()}
              </td>
            </tr>
            <tr>
              <td class="indent"></td>
              <td class="label">
                <b>Total</b> Benefit:
              </td>
              <td class="value sum"
                >{allBenefitsOnDate(ctxA_, dateX(lastMouseX_))
                  .roundToDollar()
                  .plus(
                    allBenefitsOnDate(ctxB_, dateX(lastMouseX_)).roundToDollar()
                  )
                  .wholeDollars()}</td
              >
            </tr>
          </tbody>
        </table>
      {:else}
        <!-- This text shouldn't ever be visible,
           it is here to ensure the div doesn't collapse
           and thus takes up space.-->
        Select a date<br />
        to see the benefit
      {/if}
    </div>
  </div>

  {#if !$activeIntegration}
    <!-- This section is only shown when no integration is active.
         When an integration is active, similar content is shown via
         the integration's ReportEnd component. -->
    <p>
      Choosing a filing date is a complex and personal decision. It often
      depends on your health, your financial situation, and your plans for
      retirement. There can be no one-size-fits-all answer.
    </p>
    <p>
      That said, some prefer to calculate a strategy based on maximizing your
      total actuarial lifetime benefits. A recommended free tool for doing this
      is Open Social Security. The following link will open pre-populated with
      the information you've already entered here:
    </p>
    <p>
      <a
        href="https://opensocialsecurity.com/?marital=married&aDOBm={ctxA_.r.birthdate.layBirthMonth() +
          1}&aDOBd={ctxA_.r.birthdate.layBirthDayOfMonth()}&aDOBy={ctxA_.r.birthdate.layBirthYear()}&aPIA={ctxA_.r
          .pia()
          .primaryInsuranceAmount()
          .roundToDollar()
          .value()}&bPIA={ctxB_.r
          .pia()
          .primaryInsuranceAmount()
          .roundToDollar()
          .value()}&bDOBm={ctxB_.r.birthdate.layBirthMonth() +
          1}&bDOBd={ctxB_.r.birthdate.layBirthDayOfMonth()}&bDOBy={ctxB_.r.birthdate.layBirthYear()}
"
        target="_blank">Open Social Security (populated with my information)</a
      >
    </p>
  {/if}
</div>

<style>
  .chart-container {
    position: relative;
    width: 620px;
    margin: 2em 1em 1em 1em;
  }
  @media screen and (min-width: 700px) {
    .narrowWarningBox {
      display: none;
    }
  }
  @media screen and (max-width: 699px) {
    .chart-container {
      display: none;
    }
  }
  .narrowWarningBox {
    box-shadow:
      inset 0px 0px 10px 0px #ababab,
      5px 5px 5px 1px #dddddd;
    -webkit-box-shadow:
      inset 0px 0px 10px 0px #ababab,
      5px 5px 5px 1px #dddddd;
    -moz-box-shadow:
      inset 0px 0px 10px 0px #ababab,
      5px 5px 5px 1px #dddddd;
    -o-box-shadow:
      inset 0px 0px 10px 0px #ababab,
      5px 5px 5px 1px #dddddd;
    margin: 6px 1em;
    padding: 10px;
  }
  .narrowWarningBox h4 {
    margin: 5px 0 10px 0;
  }
  .narrowWarningBox p {
    margin: 0px 20px 15px 20px;
  }
  p.sliderLabel {
    position: relative;
    font-weight: bold;
    font-size: 0.9em;
    z-index: 2;
  }
  p.sliderLabel span {
    background-color: rgba(255, 255, 255, 0.7);
  }
  .slider-box {
    /* Reserve space on canvas left for the dollar labels */
    position: relative;
    margin-left: var(--reserved-left);
    margin-right: var(--reserved-right);
    margin-bottom: 20px;
    z-index: 2;
  }
  canvas {
    position: absolute;
    z-index: 0;
    margin-top: -138px;
    /* Prevent the browser from hijacking dragging on the canvas. */
    touch-action: none;
  }
  .selectedDateBox {
    border: 1px solid;
    border-color: var(--selected-date-border-color);
    border-style: dashed;
    border-width: 2px;
    margin-bottom: 6px;
    padding: 8px;
    text-align: center;
    height: 112px;
  }
  .selectedDateBox.hidden {
    visibility: hidden;
  }
  .selectedDate {
    color: var(--selected-date-text-color);
  }
  table.combinedBenefit {
    margin: auto;
  }
  table.combinedBenefit td.date {
    text-align: left;
    font-weight: bold;
  }
  table.combinedBenefit td.indent {
    width: 18px;
  }
  table.combinedBenefit td.label {
    text-align: right;
    padding-right: 6px;
  }
  table.combinedBenefit td.value {
    text-align: right;
  }
  table.combinedBenefit td.sum {
    border-top: 1px solid;
  }
</style>
