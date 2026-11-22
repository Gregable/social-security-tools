<script lang="ts">
import IntegrationBanner from '../IntegrationBanner.svelte';
import logo from './favicon.svg';

export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="Retirement Scenario Explorer"
  {isReportView}
  integrationName="Retirement Scenario"
>
  You're using this calculator with <strong>Retirement Scenario Explorer</strong>.
  When your report is ready, we'll link you back with your Social Security
  benefits filled in, and list them for entering by hand.
</IntegrationBanner>
