<script lang="ts">
  import IntegrationBanner from "../IntegrationBanner.svelte";
  import logo from "./rachel-camp.png";

  export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="Rachael Camp Wealth"
  {isReportView}
  integrationName="Rachael Camp Wealth"
  externalLink="https://rachaelcampwealth.com"
>
  You're using this calculator via <strong>Rachael Camp Wealth</strong>.
</IntegrationBanner>
