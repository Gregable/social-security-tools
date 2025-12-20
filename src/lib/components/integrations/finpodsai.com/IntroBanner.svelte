<script lang="ts">
  import IntegrationBanner from "../IntegrationBanner.svelte";
  import logo from "./favicon.ico";

  export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="Fin Pods AI"
  {isReportView}
  integrationName="Fin Pods AI"
  externalLink="https://finpodsai.com"
>
  You're using this calculator via <strong>Fin Pods AI</strong>.
</IntegrationBanner>
