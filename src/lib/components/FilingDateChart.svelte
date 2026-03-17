<script lang="ts">
import { onMount } from 'svelte';

import type { Birthdate } from '$lib/birthday';
import { benefitOnDate } from '$lib/benefit-calculator';
import {
  type ChartLayout,
  type TickItem,
  translateSliderLabel,
} from '$lib/components/chart-utils';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import RecipientName from './RecipientName.svelte';
import Slider from './Slider.svelte';
import {
  dateX,
  maxRenderedYDollars,
} from './filing-date-chart-math';
import {
  renderBenefit,
  renderHorizontalLines,
  renderSelectedDateVerticalLine,
  renderYearVerticalLines,
} from './filing-date-chart-renderer';

export let recipient: Recipient = new Recipient();

let mounted_: boolean = false;
$: $recipient && render();

let sliderEl_: Slider;
let canvasEl_: HTMLCanvasElement;
let ctx_: CanvasRenderingContext2D;

// Determine which filing date store to use based on whether this is the first or second recipient
$: filingDateStore = $recipient.first ? recipientFilingDate : spouseFilingDate;
$: filingDateValue = $recipient.first
  ? $recipientFilingDate
  : $spouseFilingDate;

// sliderMonths_ is bound to the value of the slider, in months.
// This is set once in onMount to the user's NRA, typically 66 * 12.
// It is not set again, even if the users's birthday/NRA changes so that
// we don't override the user's selection should they have changed it
// manually.
let sliderMonths_: number = 62 * 12;
$: sliderMonths_ && render();

// Update store when slider value changes.
// The deduplicating store in context.ts prevents notifications when
// the epoch hasn't changed, breaking the circular update cycle between
// CombinedChart and FilingDateChart.
$: {
  if (sliderMonths_ && $recipient && mounted_) {
    filingDateStore.set(userSelectedDate());
  }
}

// Sync slider position when store changes from an external source.
// Compare store value against what our current slider would produce -
// if they match, the store change came from us and we skip the sync.
$: {
  if (filingDateValue && $recipient && mounted_) {
    const currentEpoch = userSelectedDate().monthsSinceEpoch();
    if (filingDateValue.monthsSinceEpoch() !== currentEpoch) {
      const ageAtFiling = $recipient.birthdate.ageAtSsaDate(filingDateValue);
      sliderMonths_ = ageAtFiling.asMonths();
    }
  }
}

// userFloor_ is the minimum age that the user can select. This may be
// 62 years or 62 years and one month, depending on their birthdate.
let userFloor_: number = 62 * 12;

// These indicate the number of pixels in the canvas that are reserved and
// thus outside the bounds of the chart data (x / y points).
const reservedLeft_: number = 70;
const reservedTop_: number = 120;
const reservedBottom_: number = 8;

// This is reserved for the right of the slider, but does not limit the chart
// data. We use this so that the chart extends beyond the edge of the slider
// to age 71, to allow the user to see beyond their maximum delayed filing
// date.
let reservedRight_: number = 0;

let blueish_ = '#337ab7';

function layout(): ChartLayout {
  return {
    canvasWidth: canvasEl_.width,
    canvasHeight: canvasEl_.height,
    reservedLeft: reservedLeft_,
    reservedTop: reservedTop_,
    reservedBottom: reservedBottom_,
  };
}

onMount(() => {
  sliderMonths_ = recipient.normalRetirementAge().asMonths();

  // Set store to match initialized slider position
  filingDateStore.set(userSelectedDate());

  mounted_ = true;
  updateCanvas();

  printMediaQuery = window.matchMedia('print');
  printMediaQuery.addEventListener('change', updateCanvas);
  return () => {
    removeMediaQueryListener();
  };
});

function updateCanvas() {
  if (!canvasEl_) return;
  canvasEl_.setAttribute('width', getComputedStyle(canvasEl_).width);
  canvasEl_.setAttribute('height', getComputedStyle(canvasEl_).height);

  // The slider represents 8 years of duration, but we want to render 9
  // years of data. So we reserve the rightmost 1/9th of the canvas after the
  // slider stops.
  reservedRight_ = (canvasEl_.width - reservedLeft_) / 9.0;

  ctx_ = canvasEl_.getContext('2d');
  ctx_.font = 'bold 14px Helvetica';

  render();
}

// By binding to window.innerWidth, we update positions when the window
// size changes:
let innerWidth: number = 0;
$: innerWidth && mounted_ && updateCanvas();
// Similarly, we want to bind to print events so we resize correctly for those
// too:
let printMediaQuery: MediaQueryList;
function removeMediaQueryListener() {
  if (printMediaQuery) {
    printMediaQuery.removeEventListener('change', updateCanvas);
  }
}

let mouseToggle_: boolean = true;
let lastMouseX_: number = -1;
let lastMouseDate_: MonthDate = new MonthDate(0);
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
  lastMouseX_ = event.clientX - canvasEl_.getBoundingClientRect().left;
  // Avoid redrawing if the mouse hasn't moved to a new month.
  const mouseDate = dateX(lastMouseX_, recipient.birthdate, layout());
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

let customTicks_: TickItem[] = [];
function updateSlider() {
  // We don't want users to select a start date earlier than is allowed.
  // For those born on the 1st/2nd, that's 62y0m. For everyone else, it's
  // 62y1m.
  if (recipient.birthdate.layBirthDayOfMonth() <= 2) {
    userFloor_ = 62 * 12;
  } else {
    userFloor_ = 62 * 12 + 1;
  }

  customTicks_ = [];

  const startAge = MonthDuration.initFromYearsMonths({ years: 62, months: 0 });
  const endAge = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
  for (
    let age = MonthDuration.copyFrom(startAge);
    age.lessThanOrEqual(endAge);
    age = age.add(MonthDuration.initFromYearsMonths({ years: 1, months: 0 }))
  ) {
    const monthsUntilNRA: number = recipient
      .normalRetirementAge()
      .subtract(age)
      .asMonths();
    if (monthsUntilNRA === 0) {
      customTicks_.push({
        value: age.asMonths(),
        label: translateSliderLabel(age.asMonths(), 'tick-value'),
        legend: 'NRA',
        color: recipient.colors().dark,
      });
    } else {
      customTicks_.push({
        value: age.asMonths(),
        label: translateSliderLabel(age.asMonths(), 'tick-value'),
      });
    }

    if (monthsUntilNRA > 0 && monthsUntilNRA < 12) {
      customTicks_.push({
        value: recipient.normalRetirementAge().asMonths(),
        label: '',
        legend: 'NRA',
        color: recipient.colors().dark,
      });
    }
  }
  // eslint-disable-next-line no-self-assign
  customTicks_ = customTicks_;
}

function userSelectedDate() {
  const selectedAge = new MonthDuration(sliderMonths_);
  return recipient.birthdate.dateAtSsaAge(selectedAge);
}

function render() {
  if (!mounted_) return;
  if (!canvasEl_) return;

  updateSlider();

  const l = layout();
  ctx_.save();
  ctx_.clearRect(0, 0, canvasEl_.width, canvasEl_.height);

  renderHorizontalLines(ctx_, recipient, l);
  renderYearVerticalLines(ctx_, recipient, l);
  renderBenefit(ctx_, recipient, userSelectedDate(), userFloor_, l);

  if (lastMouseX_ > 0) {
    renderSelectedDateVerticalLine(ctx_, lastMouseX_, recipient, l);
  }

  ctx_.restore();
}

function updateFilingDateString(
  birthdate: Birthdate,
  sliderMonths_: number
): string {
  const filingDate = birthdate.dateAtLayAge(new MonthDuration(sliderMonths_));
  return `${filingDate.monthName()} ${filingDate.year()}`;
}
let filingDateString_: string = '';
$: filingDateString_ = updateFilingDateString(
  recipient.birthdate,
  sliderMonths_
);
</script>

<svelte:window bind:innerWidth />
<div class="chart-container">
  <p class="noprint">
    Select the age that <RecipientName
      r={recipient}
      suffix="
  files">you file</RecipientName
    > for benefits:
  </p>
  <p class="onlyprint">
    Age that <RecipientName
      r={recipient}
      suffix="
  files">you file</RecipientName
    > for benefits:
  </p>
  <div
    class="slider-box"
    style:--reserved-left="{reservedLeft_}px"
    style:--reserved-right="{reservedRight_}px"
  >
    <Slider
      bind:value={sliderMonths_}
      bind:this={sliderEl_}
      floor={62 * 12}
      userFloor={userFloor_}
      ceiling={70 * 12}
      step={1}
      translate={translateSliderLabel}
      showTicks={true}
      ticksArray={customTicks_}
      barLeftColor={recipient.colors().light}
      barRightColor={recipient.colors().medium}
      tickLeftColor={recipient.colors().light}
      tickRightColor={recipient.colors().medium}
      handleColor={recipient.colors().medium}
      handleSelectedColor={recipient.colors().dark}
      tickLegendColor={recipient.colors().dark}
    />
  </div>
  <canvas
    width="620"
    height="420"
    bind:this={canvasEl_}
    on:mousedown={onClick}
    on:pointermove={onMove}
    on:mouseout={onOut}
    on:blur={onBlur}
  ></canvas>
  <div
    class="selectedDateBox"
    style:--selected-date-border-color={blueish_}
    style:--selected-date-text-color={blueish_}
    style:--filing-date-text-color={recipient.colors().dark}
    class:hidden={lastMouseX_ <= 0}
  >
    {#if lastMouseX_ > 0}
      If filing for benefits in <span class="filingDate"
        >{filingDateString_}</span
      >,
      <br />
      In
      <span class="selectedDate"
        >{dateX(lastMouseX_, recipient.birthdate, layout()).monthName()}
        {dateX(lastMouseX_, recipient.birthdate, layout()).year()}</span
      >, <RecipientName r={recipient} apos noColor={true} shortenTo={30}
        >your</RecipientName
      > benefit will be:

      <b>
        {benefitOnDate($recipient, userSelectedDate(), dateX(lastMouseX_, recipient.birthdate, layout()))
          .wholeDollars()}</b
      >
    {:else}
      <!-- This text shouldn't ever be visible,
           it is here to ensure the div doesn't collapse
           and thus takes up space.-->
      Select a date<br />
      to see the benefit
    {/if}
  </div>
</div>

<style>
  .chart-container {
    position: relative;
    width: 80vw;
    height: calc(80vw * 0.67 + 105px);
    margin: 2em 1em 1em 0;
  }
  p {
    font-weight: bold;
    font-size: 0.9em;
    margin-left: 1.5em;
  }
  .slider-box {
    /* Reserve space on canvas left for the dollar labels */
    position: relative;
    margin-left: var(--reserved-left);
    margin-right: var(--reserved-right);
    z-index: 2;
  }
  canvas {
    position: absolute;
    z-index: 1;
    margin-top: -18px;
    width: 80vw;
    height: calc(80vw * 0.67);
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
    margin-top: calc(80vw * 0.67 - 18px);
  }
  .selectedDateBox.hidden {
    visibility: hidden;
  }
  .filingDate {
    color: var(--filing-date-text-color);
    font-weight: bold;
  }
  .selectedDate {
    color: var(--selected-date-text-color);
    font-weight: bold;
  }

  /**
   * If the screen is wide, the sidebar is displayed. The sidebar takes
   * up some of the horizontal space, so the chart should be smaller,
   * in vw terms.
  */
  @media screen and (min-width: 1025px) {
    .chart-container {
      width: min(55vw, 740px);
      height: calc(min(55vw, 740px) * 0.67 + 105px);
    }
    canvas {
      width: min(55vw, 740px);
      height: calc(min(55vw, 740px) * 0.67);
    }
    .selectedDateBox {
      margin-top: calc(min(55vw, 740px) * 0.67 - 18px);
    }
  }
  @media screen and (max-width: 1024px) {
    .chart-container {
      width: 80vw;
      height: calc(80vw * 0.67 + 105px);
    }
    canvas {
      width: 80vw;
      height: calc(80vw * 0.67);
    }
    .selectedDateBox {
      margin-top: calc(80vw * 0.67 - 18px);
    }
  }
  @media print {
    .chart-container {
      width: 80vw;
      height: calc(80vw * 0.67 + 105px);
    }
    canvas {
      width: 80vw;
      height: calc(80vw * 0.67);
    }
    .selectedDateBox {
      margin-top: calc(80vw * 0.67 - 18px);
    }
  }
</style>
