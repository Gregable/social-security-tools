<!--
  @component
  @name TaxableBenefitsCalculator
  @description
    Works out how much of a reader's Social Security is subject to federal
    income tax from their filing status, adjusted gross income before
    benefits, tax-exempt interest, and annual benefits. Shows provisional
    income, which band it lands in, the taxable dollars, and a bar of the
    taxable share. All arithmetic is in $lib/benefit-taxation; the props
    only seed the fields, so the prerendered page shows the guide's example.

    Reports "Guide Widget: Used" once, on the first change, with no values.

  @example
    <TaxableBenefitsCalculator agi={30000} benefits={16000} />
-->

<script lang="ts">
import { type FilingStatus, taxableBenefits } from '$lib/benefit-taxation';
import { Money } from '$lib/money';
import { onceWidgetUsed } from '../widget-usage';

interface Props {
  status?: FilingStatus;
  /** Adjusted gross income before Social Security, in whole dollars. */
  agi?: number;
  /** Tax-exempt interest, in whole dollars. */
  taxExemptInterest?: number;
  /** Social Security benefits for the year, in whole dollars. */
  benefits?: number;
}

let {
  status = 'single',
  agi = 30000,
  taxExemptInterest = 1200,
  benefits = 16000,
}: Props = $props();

// The props seed the fields. A derived can be reassigned, so the reader's
// edits stick until a parent changes the prop, which the guides never do.
let statusChoice = $derived(status);
// Number inputs report null when emptied; treat that as zero.
let agiValue: number | null = $derived(agi);
let interestValue: number | null = $derived(taxExemptInterest);
let benefitsValue: number | null = $derived(benefits);

const used = onceWidgetUsed('taxable-benefits');

function dollars(value: number | null): Money {
  if (value === null || Number.isNaN(value) || value < 0) return Money.zero();
  return Money.from(value);
}

const result = $derived(
  taxableBenefits({
    status: statusChoice,
    agi: dollars(agiValue),
    taxExemptInterest: dollars(interestValue),
    benefits: dollars(benefitsValue),
  })
);

const sharePercent = $derived(Math.round(result.taxableShare * 100));
const taxableWidth = $derived(`${(result.taxableShare * 100).toFixed(2)}%`);
const untaxed = $derived(dollars(benefitsValue).sub(result.taxable));
</script>

<div class="guide-widget">
  <h3>How much of your benefit is taxable?</h3>
  <p class="widget-intro">
    Enter the three numbers from your return. The result is the amount that
    goes on line 6b of Form 1040, not the tax you owe on it.
  </p>
  <div class="widget-inputs">
    <div class="widget-choices" role="radiogroup" aria-label="Filing status">
      <span>Filing status</span>
      <label class="widget-choice">
        <input
          type="radio"
          name="status"
          value="single"
          bind:group={statusChoice}
          onchange={used}
        />
        Single, head of household, or qualifying surviving spouse
      </label>
      <label class="widget-choice">
        <input
          type="radio"
          name="status"
          value="joint"
          bind:group={statusChoice}
          onchange={used}
        />
        Married filing jointly
      </label>
    </div>
    <label class="widget-field">
      <span>Adjusted gross income before Social Security</span>
      <input
        type="number"
        name="agi"
        min="0"
        step="1000"
        inputmode="numeric"
        bind:value={agiValue}
        oninput={used}
      />
    </label>
    <label class="widget-field">
      <span>Tax-exempt interest</span>
      <input
        type="number"
        name="taxExemptInterest"
        min="0"
        step="100"
        inputmode="numeric"
        bind:value={interestValue}
        oninput={used}
      />
    </label>
    <label class="widget-field">
      <span>Social Security benefits for the year</span>
      <input
        type="number"
        name="benefits"
        min="0"
        step="1000"
        inputmode="numeric"
        bind:value={benefitsValue}
        oninput={used}
      />
    </label>
  </div>
  <dl class="widget-results" aria-live="polite">
    <dt>Provisional income</dt>
    <dd>{result.provisionalIncome.wholeDollars()}</dd>
    <dt>Thresholds</dt>
    <dd>
      {result.firstThreshold.wholeDollars()} and
      {result.secondThreshold.wholeDollars()}
    </dd>
    <dt>Where you land</dt>
    <dd>
      {#if result.tier === 'none'}
        At or below {result.firstThreshold.wholeDollars()}, so none of your
        benefits are taxable
      {:else if result.tier === 'half'}
        Between the thresholds: half of the amount over
        {result.firstThreshold.wholeDollars()}, up to half of your benefits
      {:else}
        Above {result.secondThreshold.wholeDollars()}: 85% of the amount over
        it, plus the middle band, up to 85% of your benefits
      {/if}
    </dd>
    <dt>Taxable benefits</dt>
    <dd class="widget-headline">
      {result.taxable.wholeDollars()}
      {#if result.taxable.greaterThan(Money.zero())}
        ({sharePercent}% of your benefits)
      {/if}
    </dd>
  </dl>
  <div class="share-bar" aria-hidden="true">
    <div class="share-taxable" style:width={taxableWidth}></div>
  </div>
  <p class="share-legend" aria-hidden="true">
    <span class="share-key share-key-taxable"></span>
    Taxable {result.taxable.wholeDollars()}
    <span class="share-key share-key-untaxed"></span>
    Not taxed {untaxed.wholeDollars()}
  </p>
  <p class="widget-note">
    Taxable benefits are added to your other income and taxed at your
    ordinary rates. Married filing separately while living with your spouse
    has thresholds of $0, so 85% is taxable.
  </p>
</div>

<style>
  .share-bar {
    display: flex;
    height: 14px;
    margin: 1rem 0 0.4rem 0;
    background: #cde2fb;
    border-radius: 4px;
    overflow: hidden;
  }

  .share-taxable {
    background: #2a78d6;
    border-right: 2px solid #f8fafc;
    box-sizing: border-box;
  }

  .share-legend {
    font-size: 0.85em;
    color: #555;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.6rem;
  }

  .share-key {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  .share-key-taxable {
    background: #2a78d6;
  }

  .share-key-untaxed {
    background: #cde2fb;
    margin-left: 0.6rem;
  }
</style>
