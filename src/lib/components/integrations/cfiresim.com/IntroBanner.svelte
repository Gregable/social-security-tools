<script lang="ts">
  import IntegrationBanner from "../IntegrationBanner.svelte";
  import logo from "./cfiresim-logo.svg";

  export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="cFIREsim"
  {isReportView}
  integrationName="cFIREsim"
>
  You're using this calculator with <strong>cFIREsim</strong>. When your report
  is ready, we'll show you how to enter your Social Security figures and any
  spousal adjustment into cFIREsim's form.
</IntegrationBanner>
