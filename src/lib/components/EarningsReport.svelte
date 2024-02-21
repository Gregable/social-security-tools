<script lang="ts">
  import EarningsTable from "./EarningsTable.svelte";
  import FutureEarningsSliders from "./FutureEarningsSliders.svelte";
  import RecipientName from "./RecipientName.svelte";
  import { Recipient } from "$lib/recipient";
  import Expando from "./Expando.svelte";

  export let recipient: Recipient = new Recipient();

  function records(recipient: Recipient): number {
    return (
      recipient.earningsRecords.length + recipient.futureEarningsRecords.length
    );
  }
  let totalRecords: number = 0;
  $: totalRecords = records($recipient);
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
  </div>

  <FutureEarningsSliders recipient={$recipient} />
  <EarningsTable earningsRecords={$recipient.futureEarningsRecords} />
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
</style>
