<script lang="ts">
  import "../global.css";
  import EarningsTable from "./EarningsTable.svelte";
  import FutureEarningsSliders from "./FutureEarningsSliders.svelte";
  import RecipientName from "./RecipientName.svelte";
  import { Recipient } from "../lib/recipient";

  export let recipient: Recipient = new Recipient();
</script>

<div>
  <h2><RecipientName r={$recipient} apos noColor /> Earnings Record</h2>

  <EarningsTable earningsRecords={$recipient.earningsRecords} />
  <FutureEarningsSliders recipient={$recipient} />
  <EarningsTable earningsRecords={$recipient.futureEarningsRecords} />
</div>

<style>
  /**
   * This ensures that the <div> does not become a scrollable container which
   * prevents the earnings sliders from being sticky at a higher level element.
   * I'm a bit confused about why this is necessary, but it works.
   */
  div {
    display: unset;
  }
</style>
