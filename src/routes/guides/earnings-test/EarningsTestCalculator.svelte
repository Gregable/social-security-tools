<!--
  @component
  @name EarningsTestCalculator
  @description
    Applies the retirement earnings test to a reader's own numbers: the year,
    whether they reach full retirement age that year, expected earnings from
    work, and their monthly benefit. Shows the limit that applies, how much
    is withheld, how that plays out as whole checks, and the net for the
    year. All arithmetic is in $lib/earnings-test; the props only seed the
    fields, so the prerendered page shows the guide's example.

    Reports "Guide Widget: Used" once, on the first change, with no values.

  @example
    <EarningsTestCalculator earnings={35560} monthlyBenefit={1500} />
-->

<script lang="ts">
import { EARNINGS_TEST_LIMITS, MAX_EARNINGS_TEST_YEAR } from '$lib/constants';
import { type EarningsTestPeriod, earningsTest } from '$lib/earnings-test';
import { Money } from '$lib/money';
import { onceWidgetUsed } from '../widget-usage';

interface Props {
  year?: number;
  period?: EarningsTestPeriod;
  /** Expected earnings from work, in whole dollars. */
  earnings?: number;
  /** Monthly benefit, in whole dollars. */
  monthlyBenefit?: number;
}

let {
  year = MAX_EARNINGS_TEST_YEAR,
  period = 'underFra',
  earnings = 35560,
  monthlyBenefit = 1500,
}: Props = $props();

// The props seed the fields. A derived can be reassigned, so the reader's
// edits stick until a parent changes the prop, which the guides never do.
let yearChoice = $derived(year);
let periodChoice = $derived(period);
// Number inputs report null when emptied; treat that as zero.
let earningsValue: number | null = $derived(earnings);
let benefitValue: number | null = $derived(monthlyBenefit);

const years = Object.keys(EARNINGS_TEST_LIMITS)
  .map(Number)
  .sort((a, b) => b - a);

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const used = onceWidgetUsed('earnings-test');

function dollars(value: number | null): Money {
  if (value === null || Number.isNaN(value) || value < 0) return Money.zero();
  return Money.from(value);
}

const result = $derived(
  earningsTest({
    year: yearChoice,
    period: periodChoice,
    earnings: dollars(earningsValue),
    monthlyBenefit: dollars(benefitValue),
  })
);

const checksText = $derived(
  result.checksWithheld === 1 ? '1 check' : `${result.checksWithheld} checks`
);

const checksHeld = $derived(dollars(benefitValue).times(result.checksWithheld));

const firstPaidMonth = $derived(
  result.checksWithheld < MONTHS.length ? MONTHS[result.checksWithheld] : null
);
</script>

<div class="guide-widget">
  <h3>Estimate your own withholding</h3>
  <p class="widget-intro">
    Enter what you expect to earn from work and your monthly benefit. Only
    wages and self-employment income count.
  </p>
  <div class="widget-inputs">
    <label class="widget-field">
      <span>Year</span>
      <select name="year" bind:value={yearChoice} onchange={used}>
        {#each years as y}
          <option value={y}>{y}</option>
        {/each}
      </select>
    </label>
    <div class="widget-choices" role="radiogroup" aria-label="Your age that year">
      <span>Your age that year</span>
      <label class="widget-choice">
        <input
          type="radio"
          name="period"
          value="underFra"
          bind:group={periodChoice}
          onchange={used}
        />
        Under full retirement age all year
      </label>
      <label class="widget-choice">
        <input
          type="radio"
          name="period"
          value="fraYear"
          bind:group={periodChoice}
          onchange={used}
        />
        Reach full retirement age during the year
      </label>
    </div>
    <label class="widget-field">
      <span>
        {periodChoice === 'fraYear'
          ? 'Earnings before your birthday month'
          : 'Expected earnings from work'}
      </span>
      <input
        type="number"
        name="earnings"
        min="0"
        step="1000"
        inputmode="numeric"
        bind:value={earningsValue}
        oninput={used}
      />
    </label>
    <label class="widget-field">
      <span>Monthly benefit</span>
      <input
        type="number"
        name="monthlyBenefit"
        min="0"
        step="100"
        inputmode="numeric"
        bind:value={benefitValue}
        oninput={used}
      />
    </label>
  </div>
  <dl class="widget-results" aria-live="polite">
    <dt>{yearChoice} limit</dt>
    <dd>{result.limit.wholeDollars()}</dd>
    {#if result.excess.equals(Money.zero())}
      <dt>Withheld</dt>
      <dd class="widget-headline">$0, you are under the limit</dd>
      <dt>Benefits for the year</dt>
      <dd>{result.annualBenefit.wholeDollars()}</dd>
    {:else}
      <dt>Over the limit by</dt>
      <dd>{result.excess.wholeDollars()}</dd>
      <dt>Withheld ($1 of every ${result.dollarsPerDollar})</dt>
      <dd class="widget-headline">{result.withheld.wholeDollars()}</dd>
      <dt>How it is collected</dt>
      <dd>
        {#if result.checksWithheld === 0}
          Nothing to collect, since there is no benefit to withhold
        {:else if firstPaidMonth === null}
          Every check for the year is held back
        {:else}
          {checksText} held back, January through
          {MONTHS[result.checksWithheld - 1]}, worth
          {checksHeld.wholeDollars()}; full checks resume in {firstPaidMonth}
        {/if}
      </dd>
      {#if result.overWithheld.greaterThan(Money.zero())}
        <dt>Refunded after the year ends</dt>
        <dd>{result.overWithheld.wholeDollars()}</dd>
      {/if}
      <dt>Benefits kept for the year</dt>
      <dd>
        {result.netBenefit.wholeDollars()} of
        {result.annualBenefit.wholeDollars()}
      </dd>
    {/if}
  </dl>
  <p class="widget-note">
    Withheld benefits are not lost: at full retirement age your benefit is
    recalculated to credit the months withheld. In your first year of
    benefits the monthly test below may apply instead.
  </p>
</div>
