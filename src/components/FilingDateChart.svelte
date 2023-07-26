<script lang="ts">
  import { onMount } from "svelte";
  import "../global.css";
  import { Birthdate } from "../lib/birthday";
  import { Recipient } from "../lib/recipient";
  import { Money } from "../lib/money";
  import Slider from "./Slider.svelte";
  import { MonthDate, MonthDuration } from "../lib/month-time";

  export let recipient: Recipient = new Recipient();

  let mounted: boolean = false;
  $: $recipient && render();

  let sliderEl: Slider;
  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  // sliderMonths is bound to the value of the slider, in months.
  // This is set once in onMount to the user's NRA, typically 66 * 12.
  // It is not set again, even if the users's birthday/NRA changes so that
  // we don't override the user's selection should they have changed it
  // manually.
  let sliderMonths: number = 62 * 12;
  // userFloor is the minimum age that the user can select. This may be
  // 62 years or 62 years and one month, depending on their birthdate.
  let userFloor: number = 62 * 12;

  // These indicate the number of pixels in the canvas that are reserved and
  // thus outside the bounds of the chart data (x / y points).
  const reservedLeft: number = 70;
  const reservedTop: number = 120;
  const reservedBottom: number = 8;

  // This is reserved for the right of the slider, but down not limit the chart
  // data. We use this so that the chart extends beyond the edge of the slider
  // to age 71, to allow the user to see beyond their maximum delayed filing
  // date.
  let reservedRight: number = 0;

  let darkOrange = "#8d6100";
  let mediumOrange = "#e69f00";
  let lightOrange = "#f6dfad";
  let blueish = "#337ab7";

  $: onMount(() => {
    mounted = true;

    // The slider represents 8 years of duration, but we want to render 9
    // years of data. So we reserve the rightmost 1/9th of the canvas after the
    // slider stops.
    reservedRight = (canvasEl.width - reservedLeft) / 9.0;

    ctx = canvasEl.getContext("2d");
    ctx.font = "bold 14px Helvetica";

    sliderMonths = $recipient.normalRetirementAge().asMonths();

    render();
  });

  let mouseToggle: boolean = true;
  let lastMouseX: number = -1;
  let lastMouseDate: MonthDate = new MonthDate(0);
  function onClick(event: MouseEvent) {
    if (mouseToggle) {
      mouseToggle = false;
    } else {
      mouseToggle = true;
      lastMouseX = event.clientX - canvasEl.getBoundingClientRect().left;
    }
    render();
  }

  function onMove(event: MouseEvent) {
    if (!mouseToggle) return;
    lastMouseX = event.clientX - canvasEl.getBoundingClientRect().left;
    // Avoid redrawing if the mouse hasn't moved to a new month.
    const mouseDate = dateX(lastMouseX);
    if (mouseDate.monthsSinceEpoch() == lastMouseDate.monthsSinceEpoch())
      return;
    lastMouseDate = mouseDate;

    render();
  }

  function onOut(event: MouseEvent) {
    if (!mouseToggle) return;
    lastMouseX = -1;
    render();
  }

  /**
   * Returns the maximum dollars that will be displayed on this chart. This is
   * the maximum benefit for both lower and higher earner summed.
   */
  function maxRenderedYDollars(): Money {
    const maxAge = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    return $recipient.benefitAtAge(maxAge);
  }

  /**
   * Compute the canvas x-coordinate for a date.
   */
  function canvasX(date: MonthDate): number {
    const startDate: MonthDate = $recipient.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
    );
    // Allow the canvas to show all of the way to age 71, so that there is
    // some rendered space if the user slides the slider all of the way to 70.
    const endDate = $recipient.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
    );
    const xValue =
      (date.subtractDate(startDate).asMonths() /
        endDate.subtractDate(startDate).asMonths()) *
      (canvasEl.width - reservedLeft);
    return reservedLeft + Math.round(xValue);
  }

  /**
   * Inverse of canvasX, computes a date from a canvas x-coordinate.
   * @param x The x-coordinate in canvas pixels.
   */
  function dateX(x: number): MonthDate {
    const startDate: MonthDate = $recipient.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
    );
    const endDate = $recipient.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
    );

    // Clip x to a range of [reservedLeft, canvasEl.width] to ensure that
    // the date is within the chart bounds.
    x = Math.max(reservedLeft, Math.min(canvasEl.width, x));

    const percent = (x - reservedLeft) / (canvasEl.width - reservedLeft);

    let numMonths = Math.round(
      endDate.subtractDate(startDate).asMonths() * percent
    );
    return startDate.addDuration(new MonthDuration(numMonths));
  }

  /**
   * Compute the canvas y-coordinate for a benefit dollars value
   */
  function canvasY(benefitY: Money): number {
    const chartHeight = canvasEl.height - reservedTop - reservedBottom;
    // canvasYValue is the absolute number canvas pixels that this point
    // represents above 0.
    const canvasYValue = Math.floor(
      benefitY.div$(maxRenderedYDollars()) * chartHeight
    );

    // The zeroLineY is the pixel position (counted from top) of the $0 line.
    const zeroLineY = canvasEl.height - reservedBottom;
    return zeroLineY - canvasYValue;
  }

  function renderTextInWhiteBox(text: string, x: number, y: number) {
    let textWidth = ctx.measureText(text).width;

    // First, draw the white box.
    ctx.save();
    ctx.fillStyle = "#FFF";
    ctx.fillRect(x - 7, y - 14, textWidth + 14, 18);
    ctx.restore();

    // Then draw the text.
    ctx.fillText(text, x, y);
  }

  function renderHorizontalLine(dollarY: Money, canvasY: number) {
    ctx.beginPath();
    ctx.moveTo(0, canvasY);
    ctx.lineTo(canvasEl.width, canvasY);
    ctx.stroke();

    let text = dollarY.wholeDollars();

    ctx.save();
    ctx.fillStyle = "#AAA";
    renderTextInWhiteBox(text, 6, canvasY + 5);
    ctx.restore();
  }

  /**
   * Render a series of horizontal lines representing the dollar amounts at
   * each y-level.
   */
  function renderHorizontalLines() {
    ctx.save();
    // Grey dashed lines.
    ctx.strokeStyle = "#BBB";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Render the $0 line.
    renderHorizontalLine(Money.from(0), canvasY(Money.from(0)));

    if (maxRenderedYDollars().value() < 500) {
      ctx.restore();
      return;
    }

    // Work out a reasonable increment to show dollar lines.
    let increment = Money.from(100);
    if (maxRenderedYDollars().value() > 1000) increment = Money.from(250);
    if (maxRenderedYDollars().value() > 1500) increment = Money.from(500);
    if (maxRenderedYDollars().value() > 3000) increment = Money.from(1000);

    const maxAge = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });

    for (
      let i = increment;
      i.value() < $recipient.benefitAtAge(maxAge).value();
      i = i.plus(increment)
    ) {
      renderHorizontalLine(i, canvasY(i));
    }

    ctx.restore();
  }

  function renderYearVerticalLines() {
    ctx.save();
    // Grey dashed lines.
    ctx.strokeStyle = "#666";
    ctx.setLineDash([2, 2]);

    let startDate: MonthDate = $recipient.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
    );
    let endDate = $recipient.birthdate.dateAtSsaAge(
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
      // Draw vertical line.
      ctx.beginPath();
      ctx.moveTo(canvasX(date), 0);
      ctx.lineTo(canvasX(date), canvasY(Money.from(0)));
      ctx.stroke();

      // Print the year vertically atop the line, with a white rectangle behind
      // the text, so that the line isn't going through the text.
      const text = "" + date.year();
      let textWidth = ctx.measureText(text).width;
      let ypos = reservedTop - textWidth - 5;
      {
        ctx.save();
        ctx.translate(canvasX(date) + 5, ypos);
        ctx.rotate((-90 * Math.PI) / 180);
        ctx.fillStyle = "#999";
        renderTextInWhiteBox(text, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  let customTicks: Array<{
    value: number;
    label?: string;
    legend?: string;
    color?: string;
  }> = [];
  function updateSlider() {
    // We don't want users to select a start date earlier than is allowed.
    // For those born on the 1st/2nd, that's 62y0m. For everyone else, it's
    // 62y1m.
    if ($recipient.birthdate.layBirthDayOfMonth() <= 2) {
      userFloor = 62 * 12;
    } else {
      userFloor = 62 * 12 + 1;
    }

    customTicks = [];

    let startAge = MonthDuration.initFromYearsMonths({ years: 62, months: 0 });
    let endAge = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    for (
      let age = MonthDuration.copyFrom(startAge);
      age.lessThanOrEqual(endAge);
      age = age.add(MonthDuration.initFromYearsMonths({ years: 1, months: 0 }))
    ) {
      const monthsUntilNRA: number = $recipient
        .normalRetirementAge()
        .subtract(age)
        .asMonths();
      if (monthsUntilNRA == 0) {
        // This tick is the NRA, indicate it with a special legend.
        customTicks.push({
          value: age.asMonths(),
          label: translateSliderLabel(age.asMonths(), "tick-value"),
          legend: "NRA",
          color: darkOrange,
        });
      } else {
        // Not an NRA tick, so just add it normally.
        customTicks.push({
          value: age.asMonths(),
          label: translateSliderLabel(age.asMonths(), "tick-value"),
        });
      }

      if (monthsUntilNRA > 0 && monthsUntilNRA < 12) {
        // The NRA is between this and the next tick: add a special tick for it.
        customTicks.push({
          value: $recipient.normalRetirementAge().asMonths(),
          label: "",
          legend: "NRA",
          color: darkOrange,
        });
      }
    }
    customTicks = customTicks;
  }

  function userSelectedDate() {
    let selectedAge = new MonthDuration(sliderMonths);
    let selectedDate = $recipient.birthdate.dateAtSsaAge(selectedAge);
    return selectedDate;
  }

  /**
   * Calculates the set of visualized boxes showing the benefit amounts given
   * the currently selected start date.
   *
   * Returns the top left coordinates of each box, and the benefit value
   * associated with the y-coordinate of the box.
   *
   * There should be exactly one or two boxes.
   *
   * @returns {Array<[number, number, Money]>} The set of boxes to render. Each
   *    box is a tuple of [x, y, benefit].
   */
  function benefitBoxes() {
    let selectedDate = userSelectedDate();

    let boxes = [];
    let benefit = $recipient.benefitOnDate(selectedDate, selectedDate);
    boxes.push([canvasX(selectedDate), canvasY(benefit), benefit]);

    for (
      let i = selectedDate;
      i.lessThanOrEqual(dateX(canvasEl.width));
      i = i.addDuration(new MonthDuration(1))
    ) {
      if (
        $recipient.benefitOnDate(selectedDate, i).value() != benefit.value()
      ) {
        benefit = $recipient.benefitOnDate(selectedDate, i);
        boxes.push([canvasX(i), canvasY(benefit), benefit]);
      }
    }
    return boxes;
  }

  /**
   * Renders the boxes showing the benefit amounts at different actual dates
   * given the currently selected start date.
   */
  function renderFilingDateBenefitBoxes(boxes: Array<[number, number, Money]>) {
    ctx.save();

    ctx.strokeStyle = mediumOrange;
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Horizontal line from full right to starting date,
    // along the bottom ($0 axis).
    ctx.moveTo(canvasEl.width, canvasY(Money.from(0)));
    ctx.lineTo(boxes[0][0], canvasY(Money.from(0)));
    for (let i = 0; i < boxes.length; i++) {
      let [x, y, _] = boxes[i];
      // First draw horizontally to the same date but the previous benefit.
      // This avoids a diagonal line when the benefit changes.
      if (i != 0) {
        let [x0, y0, _] = boxes[i - 1];
        ctx.lineTo(x, y0);
      }
      ctx.lineTo(x, y);
    }
    // Draw all of the way to the right edge of the chart.
    ctx.lineTo(canvasEl.width, canvasY(boxes[boxes.length - 1][2]));

    ctx.fillStyle = lightOrange;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
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
  function renderBenefitLabels(boxes: Array<[number, number, Money]>) {
    ctx.save();
    ctx.fillStyle = darkOrange;
    ctx.font = "14px Helvetica";
    let font_height = 12;

    for (let boxIt = 0; boxIt < boxes.length; ++boxIt) {
      let [boxX, boxY, benefit] = boxes[boxIt];

      let horizSpace = canvasEl.width - boxX;
      if (boxes.length - 1 > boxIt) horizSpace = boxes[boxIt + 1][0] - boxX;
      let vertSpace = 100; // typically have plenty to top of chart.
      if (boxes.length - 1 > boxIt) vertSpace = boxY - boxes[boxIt + 1][1];

      // Prefer to fix text above, rather than left.
      let text = benefit.wholeDollars() + " / mo";
      let textBox = ctx.measureText(text);
      if (textBox.width + 10 < horizSpace && font_height + 10 < vertSpace) {
        renderTextInWhiteBox(text, boxX + 5, boxY - 5);
        continue;
      }

      // Again above, using shorter text.
      text = benefit.wholeDollars();
      textBox = ctx.measureText(text);
      if (textBox.width + 10 < horizSpace && font_height + 10 < vertSpace) {
        renderTextInWhiteBox(text, boxX + 5, boxY - 5);
        continue;
      }

      // Attempt to fix box 0 to the left of the text
      let boxMinX = boxIt == 0 ? 1 : boxes[boxIt - 1][0];
      let boxMaxY = boxIt == 0 ? canvasY(Money.from(0)) : boxes[boxIt - 1][1];
      horizSpace = boxX - boxMinX;
      vertSpace = boxMaxY - boxY;

      text = benefit.wholeDollars() + " / mo";
      textBox = ctx.measureText(text);
      if (textBox.width + 15 < horizSpace && font_height + 15 < vertSpace) {
        renderTextInWhiteBox(
          text,
          boxX - 8 - textBox.width,
          boxMaxY - (vertSpace - font_height) / 2 - font_height
        );
        continue;
      }

      // Try again with shorter text, removing ' / mo';
      text = benefit.wholeDollars();
      textBox = ctx.measureText(text);
      if (textBox.width + 15 < horizSpace && font_height + 15 < vertSpace) {
        renderTextInWhiteBox(
          text,
          boxX - 8 - textBox.width,
          boxMaxY - (vertSpace - font_height) / 2 - font_height
        );
        continue;
      }
      // Give up and move to next box.
    }
    ctx.restore();
  }

  /**
   * Render a thin line showing the trendline of the benefit matching the user
   * dragging the slider across the page.
   */
  function renderTrendline() {
    ctx.save();
    ctx.strokeStyle = mediumOrange;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();

    const startDate: MonthDate = $recipient.birthdate.dateAtSsaAge(
      new MonthDuration(userFloor)
    );
    const endDate = $recipient.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
    );

    for (
      let i = startDate;
      i.lessThanOrEqual(endDate);
      i = i.addDuration(new MonthDuration(1))
    ) {
      let thisX = canvasX(i);
      // Determine the maximum eventual benefit for a filing date of i.
      let yDollars = $recipient.benefitOnDate(
        i,
        // Add a year to ensure that we're picking up the eventual benefit.
        endDate.addDuration(new MonthDuration(12))
      );
      let thisY = canvasY(yDollars);
      if (i.monthsSinceEpoch() == startDate.monthsSinceEpoch()) {
        ctx.moveTo(thisX, thisY);
      } else {
        ctx.lineTo(thisX, thisY);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Render the benefit of the recipient.
   */
  function renderBenefit() {
    let boxes = benefitBoxes();
    renderFilingDateBenefitBoxes(boxes);
    renderTrendline();
    renderBenefitLabels(boxes);
  }

  /**
   * Renders a single vertical line at the user's selected date.
   * @param canvasX x-coordinate of vertical line we should render.
   */
  function renderSelectedDateVerticalLine(canvasX: number) {
    if (canvasX <= 0 || canvasX >= canvasEl.width) return;
    ctx.save();

    let date = dateX(canvasX);
    let text = date.monthName() + " " + date.year();
    let textWidth = ctx.measureText(text).width;
    // This seems to position the year to line up with the vertical year lines.
    // Why 67?  I don't know and didn't bother to figure it out.
    let xpos = reservedTop + textWidth - 67;

    // Blueish dashed line:
    ctx.strokeStyle = blueish;
    ctx.setLineDash([6, 4]);
    ctx.lineCap = "butt";
    ctx.lineWidth = 2;

    // Draw vertical line.
    ctx.beginPath();
    ctx.moveTo(canvasX, 0);
    ctx.lineTo(canvasX, 420);
    ctx.stroke();

    // Print the year vertically atop the line, with a white rectangle behind
    // the text, so that the line isn't going through the text.
    {
      ctx.save();
      ctx.translate(canvasX + 5, xpos);
      ctx.rotate((-90 * Math.PI) / 180);
      ctx.fillStyle = "#337ab7";
      renderTextInWhiteBox(text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   *  Render the chart.
   */
  function render() {
    if (!mounted) return;

    updateSlider();

    ctx.save();
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    renderHorizontalLines();
    renderYearVerticalLines();
    renderBenefit();

    if (lastMouseX > 0) {
      renderSelectedDateVerticalLine(lastMouseX);
    }

    ctx.restore();
  }

  /**
   * Translation function for slider labels to map months to ages.
   */
  function translateSliderLabel(value: number, label: string): string {
    const age = new MonthDuration(value);
    if (label === "value" || label == "ceiling" || label == "floor") {
      if (age.modMonths() === 0) return age.years().toString(10);
      let out = age.years() + " " + age.modMonths() + " mo";
      return out;
    }
    // tick-value is the text above each tick mark
    if (label === "tick-value") {
      return age.years().toString(10);
    }
    return "";
  }

  function updateFilingDateString(
    birthdate: Birthdate,
    sliderMonths: number
  ): string {
    let filingDate = birthdate.dateAtLayAge(new MonthDuration(sliderMonths));
    return filingDate.monthName() + " " + filingDate.year();
  }
  let filingDateString: string = "";
  $: filingDateString = updateFilingDateString(
    $recipient.birthdate,
    sliderMonths
  );
</script>

<div class="chart-container">
  <p>File for benefits at age:</p>
  <div
    class="slider-box"
    style:--reserved-left="{reservedLeft}px"
    style:--reserved-right="{reservedRight}px"
  >
    <Slider
      bind:value={sliderMonths}
      bind:this={sliderEl}
      floor={62 * 12}
      userFloor={62 * 12 + 1}
      ceiling={70 * 12}
      step={1}
      translate={translateSliderLabel}
      showTicks={true}
      ticksArray={customTicks}
      barLeftColor={lightOrange}
      barRightColor={mediumOrange}
      tickLeftColor={lightOrange}
      tickRightColor={mediumOrange}
      handleColor={mediumOrange}
      handleSelectedColor={darkOrange}
      tickLegendColor={darkOrange}
    />
  </div>
  <canvas
    width="620"
    height="420"
    bind:this={canvasEl}
    on:pointerdown={onClick}
    on:pointermove={onMove}
    on:pointerout={onOut}
  />
  <div style="height: 404px" />
  <div
    class="selectedDateBox"
    style:--selected-date-border-color={blueish}
    style:--selected-date-text-color={blueish}
    style:--filing-date-text-color={darkOrange}
    class:hidden={lastMouseX <= 0}
  >
    {#if lastMouseX > 0}
      If filing for benefits in <span class="filingDate"
        >{filingDateString}</span
      >,
      <br />
      In
      <span class="selectedDate"
        >{dateX(lastMouseX).monthName()}
        {dateX(lastMouseX).year()}</span
      >, your benefit will be:

      <b>
        {$recipient
          .benefitOnDate(userSelectedDate(), dateX(lastMouseX))
          .wholeDollars()}</b
      >
    {:else}
      <!-- This text shouldn't ever be visible,
           it is here to ensure the div doesn't collapse
           and thus takes up space.-->
      Select a date<br />
      to see your benefit
    {/if}
  </div>
</div>

<style>
  .chart-container {
    position: relative;
    width: 620px;
    margin: 2em 1em 1em 1em;
  }
  p {
    font-weight: bold;
    font-size: 0.9em;
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
    margin-top: -16px;
  }
  .selectedDateBox {
    border: 1px solid;
    border-color: var(--selected-date-border-color);
    border-style: dashed;
    border-width: 2px;
    margin-bottom: 6px;
    padding: 8px;
    text-align: center;
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
</style>
