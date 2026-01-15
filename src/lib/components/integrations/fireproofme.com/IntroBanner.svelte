<script lang="ts">
import IntegrationBanner from '../IntegrationBanner.svelte';
import logo from './favicon.ico';

export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="FIREProof"
  {isReportView}
  integrationName="FIREProof"
>
  You're using this calculator via <strong>FIREProof</strong>. At the end of
  your report, you'll see how to enter your Social Security calculations back
  into FIREProof.
</IntegrationBanner>
