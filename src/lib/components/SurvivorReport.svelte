<script lang="ts">
import { onMount, tick } from 'svelte';
import {
  higherEarnerFilingDate,
  setHigherEarnerFilingDate,
} from '$lib/context';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import Expando from './Expando.svelte';
import RName from './RecipientName.svelte';
import Slider from './Slider.svelte';

export let recipient: Recipient = new Recipient();
export let spouse: Recipient = new Recipient();

let higherEarner: Recipient;
let lowerEarner: Recipient;
$: higherEarner = $recipient.higherEarningsThan($spouse) ? $recipient : $spouse;
$: lowerEarner = $recipient.higherEarningsThan($spouse) ? $spouse : $recipient;

// If the deceased higher earner filed before this age, the survivor benefit
// would become the larger 82.5% of the higher earner's PIA. After this age,
// the survivor benefit would be the amount the higher earner was receiving.
let breakEvenAge: MonthDuration;
$: breakEvenAge = higherEarner
  .normalRetirementAge()
  .subtract(new MonthDuration(31));
let breakEvenDate: MonthDate;
$: breakEvenDate = higherEarner.birthdate.dateAtLayAge(breakEvenAge);

let adjustedNormalRetirementAge: boolean;
$: adjustedNormalRetirementAge =
  lowerEarner.survivorNormalRetirementAge().asMonths() !==
  lowerEarner.normalRetirementAge().asMonths();

let fileVsDeath: string = 'fileBeforeDeath';

// sliderMonths_ is bound to the value of the slider, in months.
// This is set once in onMount to the user's NRA, typically 67 * 12.
// It is not set again, even if the users's birthday / NRA changes so that
// we don't override the user's selection should they have changed it
// manually.
let beforeDeathSliderMonths_: number = 67 * 12;
let afterDeathSliderMonths_: number = 68 * 12;
let survivorSliderMonths_: number = 60 * 12;
let survivorActualFilingDate: MonthDate = new MonthDate(3000 * 12);

// Component sync state machine:
// - 'initializing': During mount, before bidirectional sync is enabled
// - 'syncing': Temporarily set while updating slider from store (prevents circular updates)
// - 'ready': Normal operation, bidirectional sync enabled
type SyncState = 'initializing' | 'syncing' | 'ready';
let syncState_: SyncState = 'initializing';

/**
 * Gets the death age in months based on the current filing scenario.
 * Returns 0 if death age shouldn't restrict survivor filing (e.g., "<=66" scenario).
 */
function getDeathAgeMonths(): number {
  if (fileVsDeath === 'fileBeforeDeath') {
    // When filing before death, death happens 1 month after filing
    return beforeDeathSliderMonths_ + 1;
  } else if (fileVsDeath === 'fileAfterDeath') {
    // When dying before filing, the death date is the slider value.
    // But if slider is at floor (<=66), don't restrict survivor filing age
    // since "<=66" means death could have occurred earlier.
    if (afterDeathSliderMonths_ === 66 * 12) {
      return 0;
    }
    return afterDeathSliderMonths_;
  }
  return 0;
}

/**
 * Calculates the minimum age (in months) at which the survivor can file,
 * based on when the higher earner dies.
 */
function calculateSurvivorFloor(): number {
  if (!higherEarner || !lowerEarner) return 60 * 12;

  const deathAgeMonths = getDeathAgeMonths();
  if (deathAgeMonths === 0) return 60 * 12;

  const deathDate = higherEarner.birthdate.dateAtSsaAge(
    new MonthDuration(deathAgeMonths)
  );
  const survivorAgeAtDeath = lowerEarner.birthdate.ageAtSsaDate(deathDate);
  // Add 1 month since filing must be AFTER death
  return Math.max(60 * 12, survivorAgeAtDeath.asMonths() + 1);
}

// Dynamic floor for survivor slider based on death date.
// Survivor can't file until after the higher earner dies.
let survivorUserFloor_: number = 60 * 12;
// Explicitly reference dependencies so Svelte tracks them for reactivity.
// Without this, changes to beforeDeathSliderMonths_ or afterDeathSliderMonths_
// don't trigger recalculation because they're accessed through function calls.
$: {
  // Touch these variables to ensure Svelte tracks them as dependencies
  void fileVsDeath;
  void beforeDeathSliderMonths_;
  void afterDeathSliderMonths_;
  void higherEarner;
  void lowerEarner;
  survivorUserFloor_ = calculateSurvivorFloor();
}

// Update store when beforeDeath slider changes
// Only sync after initialization and when not already syncing from store
$: {
  if (
    beforeDeathSliderMonths_ &&
    higherEarner &&
    syncState_ === 'ready'
  ) {
    setHigherEarnerFilingDate(
      higherEarner.birthdate.dateAtSsaAge(
        new MonthDuration(beforeDeathSliderMonths_)
      )
    );
  }
}

// Sync slider position when store changes (e.g., from individual or combined charts)
$: {
  if ($higherEarnerFilingDate && higherEarner && syncState_ === 'ready') {
    const ageAtFiling = higherEarner.birthdate.ageAtSsaDate(
      $higherEarnerFilingDate
    );
    const newSliderMonths = ageAtFiling.asMonths();
    // Only update if significantly different to avoid infinite loops
    if (Math.abs(newSliderMonths - beforeDeathSliderMonths_) > 0.5) {
      syncSliderFromStore(newSliderMonths);
    }
  }
}

function syncSliderFromStore(newSliderMonths: number) {
  syncState_ = 'syncing'; // Prevent circular updates
  beforeDeathSliderMonths_ = newSliderMonths;
  // Return to ready state after Svelte's microtask queue processes reactive updates
  setTimeout(() => {
    syncState_ = 'ready';
  }, 0);
}

/**
 * Translation function for slider labels to map months to ages.
 */
function translateSliderLabel(
  extendRangeLow: number | null,
  extendRangeHigh: number | null
) {
  return (value: number, label: string): string => {
    const age = new MonthDuration(value);
    if (label === 'value' || label === 'tick-value') {
      let out = `${age.years()} ${age.modMonths()} mo`;
      if (age.modMonths() === 0) {
        // Special case for no months.
        out = age.years().toString(10);
      }
      if (extendRangeHigh != null && value === extendRangeHigh) {
        out = `>= ${out}`;
      }
      if (extendRangeLow != null && value === extendRangeLow) {
        out = `<= ${out}`;
      }
      return out;
    }
    return '';
  };
}

type TickItem = {
  value: number;
  label?: string;
  legend?: string;
  color?: string;
  legendColor?: string;
};

// beforeDeathTicks_ and afterDeathTicks_ use fixed ranges (62-70), initialized once
let beforeDeathTicks_: Array<TickItem> = [];
let afterDeathTicks_: Array<TickItem> = [];

// survivorTicks_ is reactive based on lowerEarner's survivor NRA and survivorUserFloor_
let survivorTicks_: Array<TickItem> = [];
$: {
  if (lowerEarner) {
    const baseTicks = generateTicks(
      MonthDuration.initFromYearsMonths({ years: 60, months: 0 }),
      lowerEarner.survivorNormalRetirementAge(),
      false,
      true
    );
    // Add "FRA" legend to the survivor Full Retirement Age tick
    const survivorFraMonths = lowerEarner.survivorNormalRetirementAge().asMonths();
    baseTicks.push({
      value: survivorFraMonths,
      legend: 'FRA',
      color: lowerEarner.colors().dark,
      legendColor: lowerEarner.colors().dark,
    });
    // Add "Earliest" indicator when floor is above age 60
    // Uses higher earner's color since the constraint comes from their death date
    if (survivorUserFloor_ > 60 * 12) {
      baseTicks.push({
        value: survivorUserFloor_,
        legend: 'Earliest',
        color: higherEarner.colors().dark,
        legendColor: higherEarner.colors().dark,
      });
    }
    survivorTicks_ = baseTicks;
  } else {
    survivorTicks_ = [];
  }
}

// Slider alignment variables - to align sliders so same calendar dates line up vertically
// Separate values for "files before death" (62-70) and "dies before filing" (66-70) scenarios
let reservedLeftBeforeDeath_: number = 0;
let reservedRightBeforeDeath_: number = 0;
let reservedLeftSurvivorBeforeDeath_: number = 0;
let reservedRightSurvivorBeforeDeath_: number = 0;

let reservedLeftAfterDeath_: number = 0;
let reservedRightAfterDeath_: number = 0;
let reservedLeftSurvivorAfterDeath_: number = 0;
let reservedRightSurvivorAfterDeath_: number = 0;

// Helper function to calculate alignment for a given pair of slider ranges
function calculateAlignment(
  higherStartAge: MonthDuration,
  higherEndAge: MonthDuration,
  survivorStartAge: MonthDuration,
  survivorEndAge: MonthDuration
): { higherLeft: number; higherRight: number; survivorLeft: number; survivorRight: number } {
  const higherStartDate = higherEarner.birthdate.dateAtSsaAge(higherStartAge);
  const higherEndDate = higherEarner.birthdate.dateAtSsaAge(higherEndAge);
  const survivorStartDate = lowerEarner.birthdate.dateAtSsaAge(survivorStartAge);
  const survivorEndDate = lowerEarner.birthdate.dateAtSsaAge(survivorEndAge);

  // Find the overall date range that encompasses both sliders
  const overallStartDate = higherStartDate.lessThan(survivorStartDate)
    ? higherStartDate
    : survivorStartDate;
  const overallEndDate = higherEndDate.greaterThan(survivorEndDate)
    ? higherEndDate
    : survivorEndDate;

  const totalMonths = overallEndDate.subtractDate(overallStartDate).asMonths();

  // Guard against division by zero (theoretically possible with identical date ranges)
  if (totalMonths === 0) {
    return { higherLeft: 0, higherRight: 0, survivorLeft: 0, survivorRight: 0 };
  }

  // Calculate margins for each slider based on where their range falls in the overall range
  return {
    higherLeft:
      (higherStartDate.subtractDate(overallStartDate).asMonths() / totalMonths) * 100,
    higherRight:
      (overallEndDate.subtractDate(higherEndDate).asMonths() / totalMonths) * 100,
    survivorLeft:
      (survivorStartDate.subtractDate(overallStartDate).asMonths() / totalMonths) * 100,
    survivorRight:
      (overallEndDate.subtractDate(survivorEndDate).asMonths() / totalMonths) * 100,
  };
}

// Calculate alignment margins for both scenarios
$: {
  if (higherEarner && lowerEarner) {
    const survivorStartAge = MonthDuration.initFromYearsMonths({ years: 60, months: 0 });
    const survivorEndAge = lowerEarner.survivorNormalRetirementAge();

    // "Files before death" scenario: higher earner 62-70
    const beforeDeathAlign = calculateAlignment(
      MonthDuration.initFromYearsMonths({ years: 62, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 }),
      survivorStartAge,
      survivorEndAge
    );
    reservedLeftBeforeDeath_ = beforeDeathAlign.higherLeft;
    reservedRightBeforeDeath_ = beforeDeathAlign.higherRight;
    reservedLeftSurvivorBeforeDeath_ = beforeDeathAlign.survivorLeft;
    reservedRightSurvivorBeforeDeath_ = beforeDeathAlign.survivorRight;

    // "Dies before filing" scenario: higher earner 66-70
    const afterDeathAlign = calculateAlignment(
      MonthDuration.initFromYearsMonths({ years: 66, months: 0 }),
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 }),
      survivorStartAge,
      survivorEndAge
    );
    reservedLeftAfterDeath_ = afterDeathAlign.higherLeft;
    reservedRightAfterDeath_ = afterDeathAlign.higherRight;
    reservedLeftSurvivorAfterDeath_ = afterDeathAlign.survivorLeft;
    reservedRightSurvivorAfterDeath_ = afterDeathAlign.survivorRight;
  }
}

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
        'tick-value'
      ),
    });
  }
  return ticks;
}

onMount(async () => {
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
      years: 66,
      months: 0,
    }),
    MonthDuration.initFromYearsMonths({
      years: 70,
      months: 0,
    }),
    true,
    true
  );
  // survivorTicks_ is now reactive (see reactive statement above)

  // Initialize slider to higher earner's NRA
  // syncState_ is 'initializing' by default, preventing reactive sync during setup
  beforeDeathSliderMonths_ = higherEarner.normalRetirementAge().asMonths();

  // Set store to match initialized slider position
  setHigherEarnerFilingDate(
    higherEarner.birthdate.dateAtSsaAge(
      new MonthDuration(beforeDeathSliderMonths_)
    )
  );

  // Wait for one tick to ensure store updates propagate
  await tick();

  // Enable bidirectional sync
  syncState_ = 'ready';
});

function minCapSlider() {
  // Ensures the survivor slider value respects the death date constraint
  // and updates survivorActualFilingDate accordingly.

  const deathAgeMonths = getDeathAgeMonths();
  let startMonth: MonthDuration = new MonthDuration(survivorSliderMonths_);

  // If the survivor would file before the higher earner dies, bump up to after death
  if (deathAgeMonths > 0) {
    const deathDate = higherEarner.birthdate.dateAtSsaAge(
      new MonthDuration(deathAgeMonths)
    );
    const survivorFilingDate = lowerEarner.birthdate.dateAtSsaAge(
      new MonthDuration(survivorSliderMonths_)
    );

    if (survivorFilingDate.lessThanOrEqual(deathDate)) {
      startMonth = lowerEarner.birthdate
        .ageAtSsaDate(deathDate)
        .add(new MonthDuration(1));
    }
  }

  // Compute the actual filing date for survivor benefits:
  survivorActualFilingDate = lowerEarner.birthdate.dateAtSsaAge(startMonth);

  // But the slider shouldn't be greater than the normal retirement age:
  if (startMonth.greaterThan(lowerEarner.survivorNormalRetirementAge()))
    startMonth = lowerEarner.survivorNormalRetirementAge();

  // Update the slider:
  survivorSliderMonths_ = startMonth.asMonths();
}

$: if (
  fileVsDeath !== undefined &&
  beforeDeathSliderMonths_ !== undefined &&
  afterDeathSliderMonths_ !== undefined &&
  survivorSliderMonths_ !== undefined &&
  higherEarner &&
  lowerEarner
) {
  minCapSlider();
}

// Computed survivor benefit with error handling as a safety net.
// This prevents the app from crashing if the slider temporarily has an invalid value.
let survivorBenefitDisplay_: string = '--';
$: {
  try {
    if (fileVsDeath === 'fileBeforeDeath') {
      // Death assumed 1 month after filing to trigger "filed before death" logic
      const filingDate = higherEarner.birthdate.dateAtSsaAge(
        new MonthDuration(beforeDeathSliderMonths_)
      );
      const deathDate = higherEarner.birthdate.dateAtSsaAge(
        new MonthDuration(beforeDeathSliderMonths_ + 1)
      );
      survivorBenefitDisplay_ = lowerEarner
        .survivorBenefit(
          higherEarner,
          /* deceasedFilingDate */ filingDate,
          /* deceasedDeathDate */ deathDate,
          survivorActualFilingDate
        )
        .wholeDollars();
    } else {
      // When death slider is at floor (<=66), cap death date at age 66 for benefit
      // calculation purposes. This ensures "died at or before 66" doesn't incorrectly
      // give delayed retirement credits when the survivor files late. However, if
      // survivor files early (before higher earner would have reached 66), use 1 month
      // before survivor filing so the calculation remains valid.
      let deathDate: MonthDate;
      if (afterDeathSliderMonths_ === 66 * 12) {
        const deathAtAge66 = higherEarner.birthdate.dateAtSsaAge(
          new MonthDuration(66 * 12)
        );
        const deathBeforeSurvivorFiling = survivorActualFilingDate.subtractDuration(
          new MonthDuration(1)
        );
        // Use earlier of: age 66 or 1 month before survivor files
        deathDate = deathAtAge66.lessThan(deathBeforeSurvivorFiling)
          ? deathAtAge66
          : deathBeforeSurvivorFiling;
      } else {
        deathDate = higherEarner.birthdate.dateAtSsaAge(
          new MonthDuration(afterDeathSliderMonths_)
        );
      }
      survivorBenefitDisplay_ = lowerEarner
        .survivorBenefit(
          higherEarner,
          /* deceasedFilingDate */ deathDate,
          /* deceasedDeathDate */ deathDate,
          survivorActualFilingDate
        )
        .wholeDollars();
    }
  } catch (e) {
    console.error('Survivor benefit calculation error:', e);
    survivorBenefitDisplay_ = '--';
  }
}
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
        <div class="summary-box">
          <strong>Key Takeaway:</strong> The survivor benefit depends on when
          <RName r={higherEarner} /> files for benefits (or dies without filing) and
          when <RName r={lowerEarner} /> claims. Filing earlier reduces the benefit;
          waiting can maximize it.
        </div>

        <h4>Eligibility Requirements</h4>
        <p><RName r={lowerEarner} /> must:</p>
        <ul class="eligibility-list">
          <li>
            Have been married to <RName r={higherEarner} /> for at least 9 months
          </li>
          <li>
            Not have remarried before age 60
          </li>
        </ul>
        <p><RName r={higherEarner} /> must have earned enough Social Security credits (at least one of):</p>
        <ul class="eligibility-list">
          <li>40 credits</li>
          <li>Age at death minus 22 credits</li>
          <li>6 credits (if died before age 28)</li>
        </ul>

        <h4>Calculating the Benefit Amount</h4>
        <p>
          The benefit amount depends on two factors: whether <RName r={higherEarner} />
          filed for benefits before death, and the timing relative to key age thresholds.
        </p>

        <table class="scenarios-table">
          <thead>
            <tr>
              <th><RName r={higherEarner} /> ...</th>
              <th>Filed Before Death</th>
              <th>Died Before Filing</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-header">
                <strong>Later</strong>
              </td>
              <td>
                <span class="cell-condition"><RName r={higherEarner} /> filed at age {breakEvenAge.years()}y {breakEvenAge.modMonths()}m or later</span>
                <span class="cell-result">Survivor receives <RName r={higherEarner} apos /> actual benefit amount</span>
              </td>
              <td>
                <span class="cell-condition"><RName r={higherEarner} /> died at age {higherEarner.normalRetirementAge().years()}y {#if higherEarner.normalRetirementAge().modMonths() > 0}{higherEarner.normalRetirementAge().modMonths()}m {/if}(FRA) or later</span>
                <span class="cell-result">Survivor receives what <RName r={higherEarner} /> would have gotten</span>
              </td>
            </tr>
            <tr>
              <td class="row-header">
                <strong>Earlier</strong>
              </td>
              <td>
                <span class="cell-condition"><RName r={higherEarner} /> filed before age {breakEvenAge.years()}y {breakEvenAge.modMonths()}m</span>
                <span class="cell-result">Survivor receives 82.5% of PIA = {higherEarner
                  .pia()
                  .primaryInsuranceAmount()
                  .times(0.825)
                  .wholeDollars()}</span>
              </td>
              <td>
                <span class="cell-condition"><RName r={higherEarner} /> died before age {higherEarner.normalRetirementAge().years()}y {#if higherEarner.normalRetirementAge().modMonths() > 0}{higherEarner.normalRetirementAge().modMonths()}m {/if}(FRA)</span>
                <span class="cell-result">Survivor receives 100% of PIA = {higherEarner.pia().primaryInsuranceAmount().wholeDollars()}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="pia-note">
          PIA (Primary Insurance Amount) is <RName r={higherEarner} apos /> base benefit
          at full retirement age: {higherEarner.pia().primaryInsuranceAmount().wholeDollars()}
        </p>
        <p class="pia-note">
          Why age {breakEvenAge.years()}y {breakEvenAge.modMonths()}m? If <RName r={higherEarner} />
          files before this age, the benefit is reduced below 82.5% of PIA.
          The survivor benefit has a floor of 82.5% of PIA, so filing earlier than
          this doesn't further reduce the survivor benefit.
        </p>

        <h4>Early Filing Reductions for <RName r={lowerEarner} /></h4>
        <p>
          <RName r={lowerEarner} /> can claim survivor benefits as early as age 60,
          but claiming before {#if adjustedNormalRetirementAge}survivor{/if} full
          retirement age reduces the benefit:
        </p>
        <ul class="reduction-list">
          <li>
            <strong>At age 60:</strong> 28.5% reduction
          </li>
          <li>
            <strong>At {#if adjustedNormalRetirementAge}survivor{/if} FRA
            ({lowerEarner.survivorNormalRetirementAge().years()}y {#if lowerEarner.survivorNormalRetirementAge().modMonths() > 0}{lowerEarner.survivorNormalRetirementAge().modMonths()}m{/if}):</strong>
            No reduction
          </li>
          <li>
            <strong>Between 60 and {#if adjustedNormalRetirementAge}survivor{/if} FRA:</strong>
            Proportional reduction (28.5% to 0%)
          </li>
        </ul>
        {#if adjustedNormalRetirementAge}
          <p class="fra-note">
            Note: The survivor full retirement age ({lowerEarner.survivorNormalRetirementAge().years()}y {lowerEarner.survivorNormalRetirementAge().modMonths()}m) is slightly
            different from the regular retirement age.
          </p>
        {/if}
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

      <div class="sliders-container">
        {#if fileVsDeath == 'fileBeforeDeath'}
          <p>
            2. Estimate the age that <RName r={higherEarner} /> files for benefits:
          </p>
          <div
            class="slider-box"
            style:--reserved-left="{reservedLeftBeforeDeath_}%"
            style:--reserved-right="{reservedRightBeforeDeath_}%"
          >
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
            The maximum survivor benefit is
            <b>
              {lowerEarner
                .survivorBenefit(
                  higherEarner,
                  /* deceasedFilingDate */
                  higherEarner.birthdate.dateAtSsaAge(
                    new MonthDuration(beforeDeathSliderMonths_)
                  ),
                  /* deceasedDeathDate - 1 month after filing to trigger "filed before death" logic */
                  higherEarner.birthdate.dateAtSsaAge(
                    new MonthDuration(beforeDeathSliderMonths_ + 1)
                  ),
                  /* survivorFilingDate = 200 */
                  lowerEarner.birthdate.dateAtSsaAge(
                    MonthDuration.initFromYearsMonths({ years: 200, months: 0 })
                  )
                )
                .wholeDollars()}</b
            >.
          </p>
          <p>
            3. Estimate the age that <RName r={lowerEarner} /> files for survivor benefits:
          </p>
          <div
            class="slider-box"
            style:--reserved-left="{reservedLeftSurvivorBeforeDeath_}%"
            style:--reserved-right="{reservedRightSurvivorBeforeDeath_}%"
          >
            <Slider
              bind:value={survivorSliderMonths_}
              floor={60 * 12}
              userFloor={survivorUserFloor_}
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
        {:else}
          <p>
            2. Estimate the age that <RName r={higherEarner} /> dies:
          </p>
          <div
            class="slider-box"
            style:--reserved-left="{reservedLeftAfterDeath_}%"
            style:--reserved-right="{reservedRightAfterDeath_}%"
          >
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
            The maximum survivor benefit is
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
          <p>
            3. Estimate the age that <RName r={lowerEarner} /> files for survivor benefits:
          </p>
          <div
            class="slider-box"
            style:--reserved-left="{reservedLeftSurvivorAfterDeath_}%"
            style:--reserved-right="{reservedRightSurvivorAfterDeath_}%"
          >
            <Slider
              bind:value={survivorSliderMonths_}
              floor={60 * 12}
              userFloor={survivorUserFloor_}
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
        {/if}
      </div>
      <div class="survivor-banner">
        Survivor Benefit Amount: {survivorBenefitDisplay_}
      </div>
    </div>
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }
  .expando {
    padding: 0 1em;
  }
  .expando h4 {
    margin: 1.5em 0 0.5em 0;
    color: #333;
    font-size: 1.1em;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.25em;
  }
  .expando h4:first-of-type {
    margin-top: 1em;
  }
  .expando p {
    margin: 0.75em 0;
  }
  .summary-box {
    background: linear-gradient(135deg, #e8f4fd 0%, #f0e8fd 100%);
    border-left: 4px solid #4b9dea;
    padding: 1em;
    margin: 1em 0;
    border-radius: 0 8px 8px 0;
  }
  .eligibility-list li {
    margin-bottom: 0.5em;
  }
  .scenarios-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 0.95em;
  }
  .scenarios-table th,
  .scenarios-table td {
    border: 1px solid #ddd;
    padding: 0.75em;
    text-align: left;
    vertical-align: top;
  }
  .scenarios-table th {
    background-color: #f5f5f5;
    font-weight: 600;
  }
  .scenarios-table .row-header {
    background-color: #fafafa;
    min-width: 70px;
  }
  .scenarios-table td .cell-condition {
    display: block;
    font-size: 0.85em;
    color: #666;
    margin-bottom: 0.5em;
  }
  .scenarios-table td .cell-result {
    display: block;
  }
  .pia-note {
    font-size: 0.9em;
    color: #666;
    font-style: italic;
  }
  .reduction-list {
    list-style: none;
    padding-left: 0;
  }
  .reduction-list li {
    padding: 0.5em 0;
    border-bottom: 1px solid #eee;
  }
  .reduction-list li:last-child {
    border-bottom: none;
  }
  .fra-note {
    font-size: 0.9em;
    color: #666;
    background-color: #f9f9f9;
    padding: 0.5em 1em;
    border-radius: 4px;
  }
  .indent {
    padding-left: 2em;
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

  /* Allow label text to wrap on mobile to prevent overflow */
  @media screen and (max-width: 600px) {
    label {
      white-space: normal;
      word-break: break-word;
    }
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
    font-weight: 400;
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
    min-width: 0; /* Allow flex items to shrink below content size */
  }

  /* Improve mobile layout for toggle buttons */
  @media screen and (max-width: 600px) {
    .toggle {
      flex-direction: column;
    }

    .toggle input + label {
      flex: 1 1 auto;
      padding: 0.75em 0.5em;
      border-radius: 0 !important;
    }

    .toggle input + label:first-of-type {
      border-radius: 6px 6px 0 0 !important;
      border-right: solid 1px #ddd;
      border-bottom: none;
    }

    .toggle input + label:last-of-type {
      border-radius: 0 0 6px 6px !important;
      border-left: solid 1px #ddd;
      border-top: none;
    }
  }
  .sliders-container {
    max-width: 600px;
  }
  .slider-box {
    position: relative;
    margin-left: var(--reserved-left);
    margin-right: var(--reserved-right);
    margin-top: 1em;
    margin-bottom: 1em;
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
