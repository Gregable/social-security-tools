<script lang="ts">
import * as constants from '$lib/constants';
import {
  firstFutureEarningsEditable,
  secondFutureEarningsEditable,
} from '$lib/context';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import EarningsTable from './EarningsTable.svelte';
import Expando from './Expando.svelte';
import FutureEarningsSliders from './FutureEarningsSliders.svelte';

export let recipient: Recipient = new Recipient();

// Get the editable state based on which recipient this is
$: editable = $recipient.first
  ? $firstFutureEarningsEditable
  : $secondFutureEarningsEditable;

function handleEarningsChange(
  event: CustomEvent<{ index: number; year: number; wage: number }>
) {
  const { index, wage } = event.detail;
  // Build new records from existing, with the changed value
  const records = $recipient.futureEarningsRecords.map((r, i) => ({
    year: r.year,
    wage: i === index ? Money.from(wage) : r.taxedEarnings,
  }));
  $recipient.setCustomFutureEarnings(records);
}

function records(recipient: Recipient): number {
  return (
    recipient.earningsRecords.length + recipient.futureEarningsRecords.length
  );
}
let totalRecords: number = 0;
$: totalRecords = records($recipient);

// Check if the prior year has an incomplete record (not yet recorded by SSA)
function hasPriorYearIncomplete(recipient: Recipient): boolean {
  const priorYear = constants.CURRENT_YEAR - 1;
  for (const record of recipient.earningsRecords) {
    if (record.year === priorYear && record.incomplete) {
      return true;
    }
  }
  return false;
}
$: priorYearIncomplete = hasPriorYearIncomplete($recipient);
$: priorYear = constants.CURRENT_YEAR - 1;
</script>

<div class="main pageBreakAvoid">
  <h2>Earnings Report</h2>

  <div class="text">
    <p>
      Every year, the wages you earn are recorded by the Social Security
      Administration. These earnings are used to calculate your Social Security
      benefits.
    </p>

    <div class="earnings-banner">
      Total Years of Social Security Earnings: <b>{totalRecords}</b>
    </div>

    <Expando
      collapsedText="Expand to see your {$recipient.earningsRecords
        .length} earnings records"
      expandedText="Show Less"
      initiallyExpanded={false}
    >
      <div class="expando">
        <p>
          These records are the data you copied from ssa.gov. Taxed Medicare
          Earnings have been removed for clarity as they are not an input into
          the calculation of your retirement benefit. Values are typically
          recorded after taxes are filed for the given year.
        </p>
        <EarningsTable earningsRecords={$recipient.earningsRecords} />
      </div>
    </Expando>

    <p class="noprint">
      This calculator also allows you to estimate future earnings. Every number
      and chart in this report will recalculate as you adjust these sliders:
    </p>

    {#if priorYearIncomplete}
      <p class="noprint incomplete-notice">
        <strong>Note:</strong> Your {priorYear} earnings have not yet been recorded
        by SSA. The first year of the future earnings estimate below will apply to
        {priorYear}, allowing you to include an estimate for that year.
      </p>
    {/if}
  </div>

  <FutureEarningsSliders recipient={$recipient} />
  <EarningsTable
    earningsRecords={$recipient.futureEarningsRecords}
    {editable}
    on:earningsChange={handleEarningsChange}
  />
  {#if editable}
    <p class="cap-note noprint">
      Values are capped at the Social Security maximum for each year
      (currently ${constants.MAXIMUM_EARNINGS[constants.MAX_MAXIMUM_EARNINGS_YEAR].value().toLocaleString()}).
    </p>
  {/if}
</div>

<style>
  /**
   * This ensures that the <div> does not become a scrollable container which
   * prevents the earnings sliders from being sticky at a higher level element.
   * I'm a bit confused about why this is necessary, but it works.
   */
  div.main {
    display: unset;
  }
  .expando {
    margin: 1em 4em 1em 2em;
  }
  .text {
    margin: 0 0.5em;
  }
  @media (max-width: 400px) {
    .text {
      margin: 0 0.2em;
    }
  }
  .earnings-banner {
    margin: 1em 0;
    /* Shrink the font as the window gets smaller so it doesn't wrap */
    font-size: calc(min(3.8vw, 20px));
    font-weight: 700;
    letter-spacing: 0.04rem;
    color: #443378;
  }
  .incomplete-notice {
    background-color: #e7f3fe;
    border-left: 4px solid #2196f3;
    padding: 12px 16px;
    margin: 1em 0;
    border-radius: 0 4px 4px 0;
  }
  .cap-note {
    text-align: center;
    font-size: 13px;
    color: #6c757d;
    margin: 8px 0 0 0;
  }
</style>
