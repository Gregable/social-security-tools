<script lang="ts">
  import IntegrationBanner from "../IntegrationBanner.svelte";
  import logo from "./owl.png";

  export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="Owl Retirement Planner"
  {isReportView}
  integrationName="Owl Retirement Planner"
>
  You're using this calculator via <strong>Owl Retirement Planner</strong>. At
  the end of your report, you'll see your Primary Insurance Amount information.
</IntegrationBanner>
