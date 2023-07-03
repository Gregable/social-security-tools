<script lang="ts">
  import "../global.css";
  import { context } from "../lib/context";
  import EarningsTable from "./EarningsTable.svelte";
  import FutureEarningsSliders from "./FutureEarningsSliders.svelte";
</script>

<div>
  <a id="nav-earnings" class="nav" />
  <h2 class="earningsRecordHeader">Earnings Record</h2>
  <EarningsTable isSpouse={false} futureTable={false} />
  <FutureEarningsSliders recipient={context.recipient} />
  <EarningsTable isSpouse={false} futureTable={true} />
</div>

<style>
  a.nav {
    position: relative;
    visibility: hidden;
    display: block;
  }
</style>
