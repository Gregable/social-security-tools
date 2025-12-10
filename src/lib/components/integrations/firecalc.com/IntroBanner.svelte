<script lang="ts">
  // Intro banner shown when the FIRECalc integration is active
  import IntegrationBanner from "../IntegrationBanner.svelte";
  import logo from "./firecalc-icon.svg";

  export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="FIRECalc"
  {isReportView}
  integrationName="FIRECalc"
>
  You're using this calculator via <strong>FIRECalc</strong>. At the end of your
  report, you'll see how to enter your Social Security calculations back into
  FIRECalc.
</IntegrationBanner>
