<script lang="ts">
  import IntegrationBanner from "../IntegrationBanner.svelte";
  import logo from "./favicon.ico";

  export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="FiCalc"
  {isReportView}
  integrationName="FI Calc"
>
  You're using this calculator with <strong>FI Calc</strong>. When your report
  is ready, we'll show you exactly how to enter each Social Security income
  stream into FI Calc's "Add Income" tool.
</IntegrationBanner>
