<script lang="ts">
  import "../global.css";
  import { context } from "../lib/context";
  import EarningsTable from "./EarningsTable.svelte";
  import FutureEarningsSliders from "./FutureEarningsSliders.svelte";
  import { Recipient } from "../lib/recipient";

  export let recipient: Recipient = new Recipient();
</script>

<div>
  <h2>Earnings Record</h2>

  <EarningsTable earningsRecords={$recipient.earningsRecords} />
  <FutureEarningsSliders recipient={context.recipient} />
  <EarningsTable earningsRecords={$recipient.futureEarningsRecords} />
</div>

<style>
</style>
