<script lang="ts">
  import IntegrationBanner from "../IntegrationBanner.svelte";
  import logo from "./icon-logo.png";

  export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="ProjectionLab"
  {isReportView}
  integrationName="ProjectionLab"
  externalLink="https://projectionlab.com"
>
  You're using this calculator via <strong>ProjectionLab</strong>.
</IntegrationBanner>
