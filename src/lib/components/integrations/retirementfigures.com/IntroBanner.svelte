<script lang="ts">
import IntegrationBanner from '../IntegrationBanner.svelte';
import logo from './favicon.png';

export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="Retirement Figures"
  {isReportView}
  integrationName="Retirement Figures"
>
  You're using this calculator with <strong>Retirement Figures</strong>. When
  your report is ready, we'll link you back to its Social Security calculator
  with your benefits filled in.
</IntegrationBanner>
