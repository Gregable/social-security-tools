<script lang="ts">
  import { type ChartLayout, translateSliderLabel } from "$lib/components/chart-utils";
  import { recipientFilingDate, spouseFilingDate } from "$lib/context";
  import { activeIntegration } from "$lib/integrations/context";
  import { MonthDate, MonthDuration } from "$lib/month-time";
  import { Recipient } from "$lib/recipient";
  import { onMount, tick } from "svelte";
  import RecipientName from "./RecipientName.svelte";
  import Slider from "./Slider.svelte";
  import {
    RecipientContext,
    minCapSlider,
    updateSlider,
    userSelectedDate,
  } from "./combined-chart-context";
  import {
    allBenefitsOnDate,
    canvasX,
    dateX,
    youngerOlder,
  } from "./combined-chart-math";
  import {
    renderBenefit,
    renderHorizontalLines,
    renderSelectedDateVerticalLine,
    renderYearVerticalLines,
  } from "./combined-chart-renderer";

  export let recipient: Recipient = new Recipient();
  export let spouse: Recipient = new Recipient();

  let recipientCtx_ = new RecipientContext($recipient);
  $: recipientCtx_.r = $recipient;
  let spouseCtx_ = new RecipientContext($spouse);
  $: spouseCtx_.r = $spouse;

  let mounted_: boolean = false;
  $: $recipient &&
    $spouse &&
    mounted_ &&
    recipientCtx_.sliderMonths &&
    spouseCtx_.sliderMonths &&
    render();

  let sliderEl_: Slider;
  let canvasEl_: HTMLCanvasElement;
  let ctx_: CanvasRenderingContext2D;

  // These indicate the number of pixels in the canvas that are reserved and
  // thus outside the bounds of the chart data (x / y points).
  const reservedLeft_: number = 70;
  const reservedTop_: number = 240;
  const reservedBottom_: number = 20;

  let reservedRight_: number = 0;

  // The actual values for each of recipient and spouse depend on their relative
  // birthdates. These will be recalculated in render().
  let reservedLeftRecipient_: number = reservedLeft_;
  let reservedLeftSpouse_: number = reservedLeft_;
  let reservedRightRecipient_: number = reservedRight_;
  let reservedRightSpouse_: number = reservedRight_;

  function layout(): ChartLayout {
    return {
      canvasWidth: canvasEl_.width,
      canvasHeight: canvasEl_.height,
      reservedLeft: reservedLeft_,
      reservedTop: reservedTop_,
      reservedBottom: reservedBottom_,
    };
  }

  $: onMount(async () => {
    if (!canvasEl_) return;

    ctx_ = canvasEl_.getContext("2d");
    ctx_.font = "bold 14px Helvetica";

    // Set guard flags during initialization to prevent circular updates
    updatingRecipientFromStore_ = true;
    updatingSpouseFromStore_ = true;

    recipientCtx_.sliderMonths = $recipient.normalRetirementAge().asMonths();
    spouseCtx_.sliderMonths = $spouse.normalRetirementAge().asMonths();

    // Now set stores to match initialized slider positions
    recipientFilingDate.set(userSelectedDate(recipientCtx_));
    spouseFilingDate.set(userSelectedDate(spouseCtx_));

    // Wait for one tick to ensure store updates propagate
    await tick();

    // Enable sync and render
    updatingRecipientFromStore_ = false;
    updatingSpouseFromStore_ = false;
    mounted_ = true;
    render();
  });

  let mouseToggle_: boolean = true;
  let lastMouseX_: number = -1;
  let lastMouseDate_: MonthDate = new MonthDate(0);

  // Track if we're currently updating from stores to prevent circular updates
  let updatingRecipientFromStore_: boolean = false;
  let updatingSpouseFromStore_: boolean = false;

  // Update stores when slider values change
  $: {
    if (recipientCtx_.sliderMonths && $recipient && mounted_ && !updatingRecipientFromStore_) {
      recipientFilingDate.set(userSelectedDate(recipientCtx_));
    }
  }
  $: {
    if (spouseCtx_.sliderMonths && $spouse && mounted_ && !updatingSpouseFromStore_) {
      spouseFilingDate.set(userSelectedDate(spouseCtx_));
    }
  }

  // Sync slider positions when stores change
  $: {
    if ($recipientFilingDate && $recipient && mounted_) {
      const ageAtFiling =
        $recipient.birthdate.ageAtSsaDate($recipientFilingDate);
      const newSliderMonths = ageAtFiling.asMonths();
      if (Math.abs(newSliderMonths - recipientCtx_.sliderMonths) > 0.5) {
        syncRecipientSliderFromStore(newSliderMonths);
      }
    }
  }
  $: {
    if ($spouseFilingDate && $spouse && mounted_) {
      const ageAtFiling = $spouse.birthdate.ageAtSsaDate($spouseFilingDate);
      const newSliderMonths = ageAtFiling.asMonths();
      if (Math.abs(newSliderMonths - spouseCtx_.sliderMonths) > 0.5) {
        syncSpouseSliderFromStore(newSliderMonths);
      }
    }
  }

  async function syncRecipientSliderFromStore(newSliderMonths: number) {
    updatingRecipientFromStore_ = true;
    await tick();
    recipientCtx_.sliderMonths = newSliderMonths;
    await tick();
    updatingRecipientFromStore_ = false;
  }

  async function syncSpouseSliderFromStore(newSliderMonths: number) {
    updatingSpouseFromStore_ = true;
    await tick();
    spouseCtx_.sliderMonths = newSliderMonths;
    await tick();
    updatingSpouseFromStore_ = false;
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
    const l = layout();
    const mouseDate = dateX(lastMouseX_, recipient, spouse, l);
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

  function layoutMonths() {
    const [youngerRecipient] = youngerOlder(recipient, spouse);
    const l = layout();

    const recipientAge62 = recipient.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
    );
    const recipientAge70 = recipient.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
    );
    const spouseAge62 = spouse.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
    );
    const spouseAge70 = spouse.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
    );

    const youngerAge70 = youngerRecipient.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
    );
    reservedRight_ = canvasEl_.width - canvasX(youngerAge70, recipient, spouse, l);

    reservedLeftRecipient_ = canvasX(recipientAge62, recipient, spouse, l);
    reservedRightRecipient_ = canvasEl_.width - canvasX(recipientAge70, recipient, spouse, l);
    reservedLeftSpouse_ = canvasX(spouseAge62, recipient, spouse, l);
    reservedRightSpouse_ = canvasEl_.width - canvasX(spouseAge70, recipient, spouse, l);
  }

  function render() {
    if (!mounted_) return;
    if (!canvasEl_) return;

    layoutMonths();
    updateSlider(recipientCtx_);
    updateSlider(spouseCtx_);
    minCapSlider(recipientCtx_, spouseCtx_);
    minCapSlider(spouseCtx_, recipientCtx_);

    // Trigger Svelte reactivity by re-assigning the context objects
    // eslint-disable-next-line no-self-assign
    recipientCtx_ = recipientCtx_;
    // eslint-disable-next-line no-self-assign
    spouseCtx_ = spouseCtx_;

    const l = layout();
    ctx_.save();
    ctx_.clearRect(0, 0, canvasEl_.width, canvasEl_.height);

    renderHorizontalLines(ctx_, recipientCtx_, spouseCtx_, l);
    renderYearVerticalLines(ctx_, recipient, spouse, l);
    renderBenefit(ctx_, recipientCtx_, recipientCtx_, spouseCtx_, recipient, spouse, l);
    renderBenefit(ctx_, spouseCtx_, recipientCtx_, spouseCtx_, recipient, spouse, l);

    if (lastMouseX_ > 0) {
      renderSelectedDateVerticalLine(ctx_, lastMouseX_, recipient, spouse, l);
    }

    ctx_.restore();
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
        bind:value={recipientCtx_.sliderMonths}
        bind:this={sliderEl_}
        floor={62 * 12}
        userFloor={recipientCtx_.userFloor}
        ceiling={70 * 12}
        step={1}
        translate={translateSliderLabel}
        showTicks={true}
        ticksArray={recipientCtx_.ticks}
        barLeftColor={recipientCtx_.r.colors().light}
        barRightColor={recipientCtx_.r.colors().medium}
        tickLeftColor={recipientCtx_.r.colors().light}
        tickRightColor={recipientCtx_.r.colors().medium}
        handleColor={recipientCtx_.r.colors().medium}
        handleSelectedColor={recipientCtx_.r.colors().dark}
        tickLegendColor={recipientCtx_.r.colors().dark}
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
        bind:value={spouseCtx_.sliderMonths}
        bind:this={sliderEl_}
        floor={62 * 12}
        userFloor={spouseCtx_.userFloor}
        ceiling={70 * 12}
        step={1}
        translate={translateSliderLabel}
        showTicks={true}
        ticksArray={spouseCtx_.ticks}
        barLeftColor={spouseCtx_.r.colors().light}
        barRightColor={spouseCtx_.r.colors().medium}
        tickLeftColor={spouseCtx_.r.colors().light}
        tickRightColor={spouseCtx_.r.colors().medium}
        handleColor={spouseCtx_.r.colors().medium}
        handleSelectedColor={spouseCtx_.r.colors().dark}
        tickLegendColor={spouseCtx_.r.colors().dark}
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
      style:--selected-date-border-color="#337ab7"
      style:--selected-date-text-color="#337ab7"
      style:--filing-date-text-color="#337ab7"
      class:hidden={lastMouseX_ <= 0}
    >
      {#if lastMouseX_ > 0}
        <table class="combinedBenefit">
          <tbody>
            <tr>
              <td colspan="3" class="date">
                In <span class="selectedDate"
                  >{dateX(lastMouseX_, recipient, spouse, layout()).monthName()}
                  {dateX(lastMouseX_, recipient, spouse, layout()).year()}</span
                >,
              </td>
            </tr>
            <tr>
              <td class="indent"></td>
              <td class="label">
                <RecipientName r={recipientCtx_.r} apos shortenTo={50} /> Benefit:
              </td>
              <td class="value">
                {allBenefitsOnDate(recipientCtx_, recipientCtx_, spouseCtx_, dateX(lastMouseX_, recipient, spouse, layout())).wholeDollars()}
              </td>
            </tr>
            <tr>
              <td class="indent"></td>
              <td class="label">
                <RecipientName r={spouseCtx_.r} apos shortenTo={50} /> Benefit:
              </td>
              <td class="value">
                {allBenefitsOnDate(spouseCtx_, recipientCtx_, spouseCtx_, dateX(lastMouseX_, recipient, spouse, layout())).wholeDollars()}
              </td>
            </tr>
            <tr>
              <td class="indent"></td>
              <td class="label">
                <b>Total</b> Benefit:
              </td>
              <td class="value sum"
                >{allBenefitsOnDate(recipientCtx_, recipientCtx_, spouseCtx_, dateX(lastMouseX_, recipient, spouse, layout()))
                  .roundToDollar()
                  .plus(
                    allBenefitsOnDate(spouseCtx_, recipientCtx_, spouseCtx_, dateX(lastMouseX_, recipient, spouse, layout())).roundToDollar()
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
        href="https://opensocialsecurity.com/?marital=married&aDOBm={recipientCtx_.r.birthdate.layBirthMonth() +
          1}&aDOBd={recipientCtx_.r.birthdate.layBirthDayOfMonth()}&aDOBy={recipientCtx_.r.birthdate.layBirthYear()}&aPIA={recipientCtx_.r
          .pia()
          .primaryInsuranceAmount()
          .roundToDollar()
          .value()}&bPIA={spouseCtx_.r
          .pia()
          .primaryInsuranceAmount()
          .roundToDollar()
          .value()}&bDOBm={spouseCtx_.r.birthdate.layBirthMonth() +
          1}&bDOBd={spouseCtx_.r.birthdate.layBirthDayOfMonth()}&bDOBy={spouseCtx_.r.birthdate.layBirthYear()}
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
