<script lang="ts">
  import { onMount } from "svelte";
  import Expando from "./Expando.svelte";
  import { Recipient } from "$lib/recipient";
  import RName from "./RecipientName.svelte";
  import { MonthDate, MonthDuration } from "$lib/month-time";
  import Slider from "./Slider.svelte";

  export let recipient: Recipient = new Recipient();
  export let spouse: Recipient = new Recipient();

  let higherEarner: Recipient;
  let lowerEarner: Recipient;
  $: higherEarner = $recipient.higherEarningsThan($spouse)
    ? $recipient
    : $spouse;
  $: lowerEarner = $recipient.higherEarningsThan($spouse)
    ? $spouse
    : $recipient;

  // If the deceased higher earner filed before this age, the survivor benefit
  // would become the larget 82.5% of the higher earner's PIA. After this age,
  // the survivor benefit would be the amount the higher earner was receiving.
  let breakEvenAge: MonthDuration;
  $: breakEvenAge = $higherEarner
    .normalRetirementAge()
    .subtract(new MonthDuration(31));
  let breakEvenDate: MonthDate;
  $: breakEvenDate = $higherEarner.birthdate.dateAtLayAge(breakEvenAge);

  let adjustedNormalRetirementAge: boolean;
  $: adjustedNormalRetirementAge =
    $lowerEarner.survivorNormalRetirementAge().asMonths() !=
    $lowerEarner.normalRetirementAge().asMonths();

  let fileVsDeath: string = "fileBeforeDeath";

  // sliderMonths_ is bound to the value of the slider, in months.
  // This is set once in onMount to the user's NRA, typically 67 * 12.
  // It is not set again, even if the users's birthday / NRA changes so that
  // we don't override the user's selection should they have changed it
  // manually.
  let beforeDeathSliderMonths_: number = 67 * 12;
  let afterDeathSliderMonths_: number = 68 * 12;
  let survivorSliderMonths_: number = 60 * 12;
  let survivorActualFilingDate: MonthDate = new MonthDate(3000 * 12);

  /**
   * Translation function for slider labels to map months to ages.
   */
  function translateSliderLabel(
    extendRangeLow: number | null,
    extendRangeHigh: number | null
  ) {
    return (value: number, label: string): string => {
      const age = new MonthDuration(value);
      if (label === "value" || label === "tick-value") {
        let out = age.years() + " " + age.modMonths() + " mo";
        if (age.modMonths() === 0) {
          // Special case for no months.
          out = age.years().toString(10);
        }
        if (extendRangeHigh != null && value == extendRangeHigh) {
          out = ">= " + out;
        }
        if (extendRangeLow != null && value == extendRangeLow) {
          out = "<= " + out;
        }
        return out;
      }
      return "";
    };
  }

  let beforeDeathTicks_: Array<{
    value: number;
    label?: string;
    legend?: string;
    color?: string;
  }> = [];
  let afterDeathTicks_: Array<{
    value: number;
    label?: string;
    legend?: string;
    color?: string;
  }> = [];
  let survivorTicks_: Array<{
    value: number;
    label?: string;
    legend?: string;
    color?: string;
  }> = [];
  function generateTicks(
    startAge: MonthDuration,
    endAge: MonthDuration,
    extendRangeLow: boolean,
    extendRangeHigh: boolean
  ) {
    let ticks = [];
    let extendLow = null;
    if (extendRangeLow) extendLow = startAge.asMonths();
    let extendHigh = null;
    if (extendRangeHigh) extendHigh = endAge.asMonths();

    for (
      let age = MonthDuration.copyFrom(startAge);
      age.lessThanOrEqual(endAge);
      age = age.add(MonthDuration.initFromYearsMonths({ years: 1, months: 0 }))
    ) {
      ticks.push({
        value: age.asMonths(),
        label: translateSliderLabel(extendLow, extendHigh)(
          age.asMonths(),
          "tick-value"
        ),
      });
    }
    return ticks;
  }

  onMount(() => {
    beforeDeathTicks_ = generateTicks(
      MonthDuration.initFromYearsMonths({
        years: 62,
        months: 0,
      }),
      MonthDuration.initFromYearsMonths({
        years: 70,
        months: 0,
      }),
      false,
      false
    );
    afterDeathTicks_ = generateTicks(
      MonthDuration.initFromYearsMonths({
        years: 62,
        months: 0,
      }),
      MonthDuration.initFromYearsMonths({
        years: 70,
        months: 0,
      }),
      true,
      true
    );
    survivorTicks_ = generateTicks(
      MonthDuration.initFromYearsMonths({
        years: 60,
        months: 0,
      }),
      MonthDuration.initFromYearsMonths({
        years: 67,
        months: 0,
      }),
      false,
      true
    );
  });

  function minCapSlider() {
    // beforeDeath is the slider for the higher earner estimating the age they
    // filed for primary benefits *before* they died.
    // afterDeath is the slider for the higher earner estimating the age they
    // filed for primary benefits *after* they died.
    // Only one of these sliders is shown at a time, depending on fileVsDeath

    let earnerMonths = 0;
    if (fileVsDeath == "fileBeforeDeath") {
      earnerMonths = beforeDeathSliderMonths_;
    } else if (fileVsDeath == "fileAfterDeath") {
      earnerMonths = afterDeathSliderMonths_;
    } else {
      throw new Error("fileVsDeath toggle unexpected value: " + fileVsDeath);
    }

    let startMonth: MonthDuration = new MonthDuration(survivorSliderMonths_);

    // There's an issue if the survivor tries to file for survivor benefits
    // before the higher earner dies. In this case, we increase the survivor's
    // slider value.
    if (
      lowerEarner.birthdate
        .dateAtSsaAge(new MonthDuration(survivorSliderMonths_))
        .lessThanOrEqual(
          higherEarner.birthdate.dateAtSsaAge(new MonthDuration(earnerMonths))
        )
    ) {
      startMonth = lowerEarner.birthdate
        .ageAtSsaDate(
          higherEarner.birthdate.dateAtSsaAge(new MonthDuration(earnerMonths))
        )
        .add(new MonthDuration(1));
    }

    // Compute the actual filing date for survivor benefits:
    survivorActualFilingDate = lowerEarner.birthdate.dateAtSsaAge(startMonth);

    // But the slider shouldn't be greater than the normal retirement age:
    if (startMonth.greaterThan(lowerEarner.survivorNormalRetirementAge()))
      startMonth = lowerEarner.survivorNormalRetirementAge();

    // Update the slider:
    survivorSliderMonths_ = startMonth.asMonths();
  }

  $: fileVsDeath &&
    beforeDeathSliderMonths_ &&
    afterDeathSliderMonths_ &&
    survivorSliderMonths_ &&
    minCapSlider();
</script>

<div class="pageBreakAvoid">
  <h2>Survivor Benefits</h2>

  <div class="text">
    <p>
      As the spouse with the higher earnings, should <RName r={higherEarner} /> die
      before <RName r={lowerEarner} />,
      <RName r={lowerEarner} /> may be eligible for <u>survivor</u> benefits on <RName
        r={higherEarner}
        apos
      /> earnings record. Survivor benefits would replace <RName
        r={lowerEarner}
        apos
      /> benefits with a value that can be as high as
      <RName r={higherEarner} apos /> personal benefit.
    </p>
    <p>
      Survivor benefits are also sometimes known as widow or widower benefits.
    </p>

    <Expando
      collapsedText="Expand for a detailed look at the survivor benefit"
      expandedText="Show Less"
    >
      <div class="expando">
        <p>There are a eligibility rules that must be met:</p>
        <ol>
          <li>
            <RName r={lowerEarner} /> must have been married to <RName
              r={higherEarner}
            /> for at least 9 months.
          </li>
          <li>
            <RName r={lowerEarner} /> can't have remarried before age 60.
          </li>
          <li>
            <RName r={higherEarner} /> must have earned enough Social Security Credits
            at the time of death, by meeting one of:
            <ul>
              <li>Earned at least 40 credits.</li>
              <li>
                Earned at least <RName r={higherEarner} apos /> age at the time of
                death minus 22 credits.
              </li>
              <li>
                <RName r={higherEarner} /> died prior to age 28 and earned at least
                6 credits.
              </li>
            </ul>
          </li>
        </ol>
        <p>
          The benefit calculation starts with a consideration of <RName
            r={higherEarner}
            apos
          /> age at death and the age <RName r={higherEarner} /> filed for benefits
          while alive. There are four different scenarios:
        </p>
        <ul>
          <li>
            <RName r={higherEarner} /> files for benefits before the time of death
            and ...
          </li>
          <ul>
            <li>
              <RName r={higherEarner} /> filed <b>on or after</b>
              {breakEvenAge.years()} years, {breakEvenAge.modMonths()}
              months (<b>{breakEvenDate.monthName()}, {breakEvenDate.year()}</b
              >):
              <p>
                The survivor benefit will be based on <RName
                  r={higherEarner}
                  apos
                /> personal benefit at the time of death.
              </p>
            </li>
            <li>
              <RName r={higherEarner} /> filed <b>earlier</b> than
              {breakEvenAge.years()} years, {breakEvenAge.modMonths()}
              months (<b>{breakEvenDate.monthName()}, {breakEvenDate.year()}</b
              >):
              <p>
                The survivor benefit will be based on the minimum of 82.5% <RName
                  r={higherEarner}
                  apos
                /> Primary Insurance Amount: {higherEarner
                  .pia()
                  .primaryInsuranceAmount()
                  .string()} x 82.5% = {higherEarner
                  .pia()
                  .primaryInsuranceAmount()
                  .times(0.825)
                  .wholeDollars()}
              </p>
            </li>
          </ul>
          <li>
            <RName r={higherEarner} /> died before filing for benefits and ...
          </li>
          <ul>
            <li>
              <RName r={higherEarner} /> died <b>after</b> reaching normal
              retirement age of {$higherEarner.normalRetirementAge().years()}
              years
              {#if $higherEarner.normalRetirementAge().modMonths() > 0}
                {$higherEarner.normalRetirementAge().modMonths()}, months
              {/if}(<b
                >{$higherEarner.normalRetirementDate().monthName()}, {$higherEarner
                  .normalRetirementDate()
                  .year()}</b
              >):
              <p>
                The survivor benefit will be based on <RName
                  r={higherEarner}
                  apos
                /> personal benefit <RName r={higherEarner} /> would have received
                if filing at the time of death.
              </p>
            </li>
            <li>
              <RName r={higherEarner} /> died <b>on or before</b> reaching
              normal retirement age of {$higherEarner
                .normalRetirementAge()
                .years()}
              years
              {#if $higherEarner.normalRetirementAge().modMonths() > 0}
                {$higherEarner.normalRetirementAge().modMonths()}, months
              {/if}(<b
                >{$higherEarner.normalRetirementDate().monthName()}, {$higherEarner
                  .normalRetirementDate()
                  .year()}</b
              >):
              <p>
                The survivor benefit will be based on
                <RName r={higherEarner} apos /> Primary Insurance Amount:
                {higherEarner.pia().primaryInsuranceAmount().wholeDollars()}
              </p>
            </li>
          </ul>
        </ul>
        <p>
          The survivor benefit is then subject to reductions if <RName
            r={lowerEarner}
          /> claims them before <RName r={lowerEarner} apos /> normal {#if adjustedNormalRetirementAge}survivor
          {/if}retirement age{#if !adjustedNormalRetirementAge}&nbsp; of {lowerEarner
              .survivorNormalRetirementAge()
              .years()} years {#if lowerEarner
              .survivorNormalRetirementAge()
              .modMonths() > 0},
              {lowerEarner.survivorNormalRetirementAge().modMonths()} months
            {/if} (<b
              >{lowerEarner.survivorNormalRetirementDate().monthName()}, {lowerEarner
                .survivorNormalRetirementDate()
                .year()}</b
            >){/if}. The earliest that <RName r={lowerEarner} /> can claim is age
          60.
        </p>
        {#if adjustedNormalRetirementAge}
          <p>
            The normal survivor retirement age is slightly different than the
            normal retirement age. <RName r={lowerEarner} apos /> normal survivor
            retirement age is:
            {lowerEarner.survivorNormalRetirementAge().years()} years, {lowerEarner
              .survivorNormalRetirementAge()
              .modMonths()} months (<b
              >{lowerEarner.survivorNormalRetirementDate().monthName()}, {lowerEarner
                .survivorNormalRetirementDate()
                .year()}</b
            >).
          </p>
        {/if}
        <p>
          If <RName r={lowerEarner} /> claims the survivor benefit at age 60, the
          benefit is reduced by 28.5%. If <RName r={lowerEarner} /> claims the survivor
          benefit at <RName r={lowerEarner} apos /> normal {#if adjustedNormalRetirementAge}survivor
          {/if}retirement age, the benefit is not reduced. Between those two
          ages, the benefit is reduced between 28.5% and 0% proportionally to
          the filing time between age 60 and the normal {#if adjustedNormalRetirementAge}survivor
          {/if}retirement age.
        </p>
      </div>
    </Expando>

    <p>
      Adjust the following settings to see how they affect the survivor benefit:
    </p>
    <div class="indent">
      <div>
        1. <RName r={higherEarner} />
        <fieldset>
          <div class="toggle">
            <input
              type="radio"
              name="fileVsDeath"
              value="fileBeforeDeath"
              id="beforeDeath"
              bind:group={fileVsDeath}
            />
            <label for="beforeDeath">files for benefits before death</label>
            <input
              type="radio"
              name="fileVsDeath"
              value="fileAfterDeath"
              id="afterDeath"
              bind:group={fileVsDeath}
            />
            <label for="afterDeath">dies before filing for benefits</label>
          </div>
        </fieldset>
      </div>

      {#if fileVsDeath == "fileBeforeDeath"}
        <p>
          2. Estimate the age that <RName r={higherEarner} /> files for benefits:
        </p>
        <div class="slider-box">
          <Slider
            bind:value={beforeDeathSliderMonths_}
            floor={62 * 12}
            userFloor={62 * 12}
            ceiling={70 * 12}
            step={1}
            translate={translateSliderLabel(null, null)}
            showTicks={true}
            ticksArray={beforeDeathTicks_}
            barLeftColor={higherEarner.colors().light}
            barRightColor={higherEarner.colors().medium}
            tickLeftColor={higherEarner.colors().light}
            tickRightColor={higherEarner.colors().medium}
            handleColor={higherEarner.colors().medium}
            handleSelectedColor={higherEarner.colors().dark}
            tickLegendColor={higherEarner.colors().dark}
          />
        </div>
        <p class="maximum-benefit">
          The maximum surivor benefit is
          <b>
            {lowerEarner
              .survivorBenefit(
                higherEarner,
                /* deceasedFilingDate */
                higherEarner.birthdate.dateAtSsaAge(
                  new MonthDuration(beforeDeathSliderMonths_)
                ),
                /* deceasedDeathDate = 70 */
                higherEarner.birthdate.dateAtSsaAge(
                  MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
                ),
                /* survivorFilingDate = 200 */
                lowerEarner.birthdate.dateAtSsaAge(
                  MonthDuration.initFromYearsMonths({ years: 200, months: 0 })
                )
              )
              .wholeDollars()}</b
          >.
        </p>
      {:else}
        <p>
          2. Estimate the age that <RName r={higherEarner} /> dies:
        </p>
        <div class="slider-box">
          <Slider
            bind:value={afterDeathSliderMonths_}
            floor={66 * 12}
            userFloor={66 * 12}
            ceiling={70 * 12}
            step={1}
            translate={translateSliderLabel(66 * 12, 70 * 12)}
            showTicks={true}
            ticksArray={afterDeathTicks_}
            barLeftColor={higherEarner.colors().light}
            barRightColor={higherEarner.colors().medium}
            tickLeftColor={higherEarner.colors().light}
            tickRightColor={higherEarner.colors().medium}
            handleColor={higherEarner.colors().medium}
            handleSelectedColor={higherEarner.colors().dark}
            tickLegendColor={higherEarner.colors().dark}
          />
        </div>
        <p class="maximum-benefit">
          The maximum surivor benefit is
          <b>
            {lowerEarner
              .survivorBenefit(
                higherEarner,
                /* deceasedFilingDate */
                higherEarner.birthdate.dateAtSsaAge(
                  new MonthDuration(afterDeathSliderMonths_)
                ),
                /* deceasedDeathDate */
                higherEarner.birthdate.dateAtSsaAge(
                  new MonthDuration(afterDeathSliderMonths_)
                ),
                /* survivorFilingDate = 200 */
                lowerEarner.birthdate.dateAtSsaAge(
                  MonthDuration.initFromYearsMonths({ years: 200, months: 0 })
                )
              )
              .wholeDollars()}</b
          >.
        </p>
      {/if}
      <p>
        3. Estimate the age that <RName r={lowerEarner} /> files for survivor benefits:
      </p>
      <div class="slider-box">
        <Slider
          bind:value={survivorSliderMonths_}
          floor={60 * 12}
          userFloor={60 * 12}
          ceiling={lowerEarner.survivorNormalRetirementAge().asMonths()}
          step={1}
          translate={translateSliderLabel(
            null,
            lowerEarner.survivorNormalRetirementAge().asMonths()
          )}
          showTicks={true}
          ticksArray={survivorTicks_}
          barLeftColor={lowerEarner.colors().light}
          barRightColor={lowerEarner.colors().medium}
          tickLeftColor={lowerEarner.colors().light}
          tickRightColor={lowerEarner.colors().medium}
          handleColor={lowerEarner.colors().medium}
          handleSelectedColor={lowerEarner.colors().dark}
          tickLegendColor={lowerEarner.colors().dark}
        />
      </div>
      <div class="survivor-banner">
        Survivor Benefit Amount:
        {#if fileVsDeath == "fileBeforeDeath"}
          {lowerEarner
            .survivorBenefit(
              higherEarner,
              /* deceasedFilingDate */
              higherEarner.birthdate.dateAtSsaAge(
                new MonthDuration(beforeDeathSliderMonths_)
              ),
              /* deceasedDeathDate = 70 */
              higherEarner.birthdate.dateAtSsaAge(
                MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
              ),
              /* survivorFilingDate */
              survivorActualFilingDate
            )
            .wholeDollars()}
        {:else}
          {lowerEarner
            .survivorBenefit(
              higherEarner,
              /* deceasedFilingDate */
              higherEarner.birthdate.dateAtSsaAge(
                new MonthDuration(afterDeathSliderMonths_)
              ),
              /* deceasedDeathDate */
              higherEarner.birthdate.dateAtSsaAge(
                new MonthDuration(afterDeathSliderMonths_)
              ),
              /* survivorFilingDate */
              survivorActualFilingDate
            )
            .wholeDollars()}
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }
  .expando > p {
    padding: 1em 0 0 1em;
  }
  .beta {
    background-color: #f09090;
    padding: 0.25em 0.5em;
    border-radius: 0.25em;
    font-size: 0.9em;
    font-weight: 700;
    color: #333;
  }
  .indent {
    padding-left: 2em;
  }
  li p {
    padding: 0 0 0 1em;
    margin: 0.75em 0;
  }
  li {
    margin-bottom: 0.5em;
  }
  li ul {
    margin-top: 0.5em;
  }
  fieldset {
    margin: 0;
    padding: 4px 16px 8px 8px;
    display: inline;
    min-width: 0;
    background-color: #fff;
    border: 0;
    margin-right: 16px;
  }
  label {
    white-space: nowrap;
  }
  .toggle {
    margin: 0 0 0 0;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: stretch;
  }
  .toggle input {
    width: 0;
    height: 0;
    position: absolute;
    left: -9999px;
  }
  .toggle input:checked + label {
    background-color: #4b9dea;
    color: #fff;
    box-shadow: 0 0 10px rgba(102, 179, 251, 0.5);
    border-color: #4b9dea;
    z-index: 1;
    font-weight: 600;
  }
  .toggle input + label:first-of-type {
    border-radius: 6px 0 0 6px;
    border-right: none;
  }
  .toggle input + label:last-of-type {
    border-radius: 0 6px 6px 0;
    border-left: none;
  }
  .toggle input + label {
    margin: 0;
    padding: 0.5em 0.25em;
    position: relative;
    border: solid 1px #ddd;
    background-color: #fff;
    font-size: 1em;
    line-height: 140%;
    text-align: center;
    transition:
      border-color 0.15s ease-out,
      color 0.25s ease-out,
      background-color 0.15s ease-out box-shadow 0.15s ease-out;
    flex: 0 0 50%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .slider-box {
    padding-left: 2em;
    margin: 1em;
    max-width: 600px;
  }
  p.maximum-benefit {
    padding-left: 2em;
  }
  .survivor-banner {
    margin: 1em 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.04rem;
    color: #443378;
  }
</style>
