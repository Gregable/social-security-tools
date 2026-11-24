<script lang="ts">
import IntegrationBanner from '../IntegrationBanner.svelte';
import logo from './favicon.svg';

export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="Retirement Chartplotter"
  {isReportView}
  integrationName="Retirement Chartplotter"
>
  You're using this calculator with <strong>Retirement Chartplotter</strong>.
  When your report is ready, we'll list the Social Security settings to
  enter in Retirement Chartplotter.
</IntegrationBanner>
