<script lang="ts">
import IntegrationBanner from '../IntegrationBanner.svelte';
import logo from './favicon.ico';

export let isReportView: boolean = false;
</script>

<IntegrationBanner
  {logo}
  logoAlt="TPAW Planner"
  {isReportView}
  integrationName="TPAW Planner"
>
  You're using this calculator with <strong>TPAW Planner</strong>. When your
  report is ready, we'll list the Social Security entries to add to TPAW's
  <strong>Income During Retirement</strong> section.
</IntegrationBanner>
