<!--
  @component
  Demo wrapper for displaying all ReportEnd integration variants.
  Sets up required recipient stores and filing dates.
  Used only in Storybook stories to show consolidated view of all integrations.
-->
<script lang="ts">
import { onMount } from 'svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import type { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

// ReportEnd components for each integration
import FiCalcReportEnd from '$lib/components/integrations/ficalc.app/ReportEnd.svelte';
import CFireSimReportEnd from '$lib/components/integrations/cfiresim.com/ReportEnd.svelte';
import FireCalcReportEnd from '$lib/components/integrations/firecalc.com/ReportEnd.svelte';
import LinoptReportEnd from '$lib/components/integrations/linopt.com/ReportEnd.svelte';
import OpenSSReportEnd from '$lib/components/integrations/opensocialsecurity.com/ReportEnd.svelte';
import OwlPlannerReportEnd from '$lib/components/integrations/owlplanner.streamlit.app/ReportEnd.svelte';

export let recipientData: Recipient;
export let spouseData: Recipient | null = null;
export let recipientFilingDateValue: MonthDate;
export let spouseFilingDateValue: MonthDate | null = null;

// Create writable stores from the recipient data
const recipient = new Recipient();
const spouse = new Recipient();

// Track if data is ready to avoid rendering before stores are populated
let ready = false;

// Initialize data synchronously before first render
function initializeData() {
  if (recipientData) {
    recipient.name = recipientData.name;
    recipient.earningsRecords = recipientData.earningsRecords;
    recipient.birthdate = recipientData.birthdate;
    if (recipientData.first) {
      recipient.markFirst();
    } else {
      recipient.markSecond();
    }
  }

  if (spouseData) {
    spouse.name = spouseData.name;
    spouse.earningsRecords = spouseData.earningsRecords;
    spouse.birthdate = spouseData.birthdate;
    if (spouseData.first) {
      spouse.markFirst();
    } else {
      spouse.markSecond();
    }
  }

  if (recipientFilingDateValue) {
    recipientFilingDate.set(recipientFilingDateValue);
  }
  if (spouseFilingDateValue) {
    spouseFilingDate.set(spouseFilingDateValue);
  }

  ready = true;
}

// Initialize on mount
onMount(() => {
  initializeData();
});

// Also initialize immediately for SSR/Storybook
$: if (recipientData && !ready) {
  initializeData();
}

$: hasSpouse = spouseData !== null;
</script>

{#if ready}
  <div class="report-end-demo">
    <div class="demo-header">
      <h2>Integration ReportEnd Components</h2>
      <p>
        {#if hasSpouse}
          Showing married couple scenario with spousal benefits
        {:else}
          Showing single recipient scenario
        {/if}
      </p>
    </div>

    <div class="report-list">
      <div class="report-item">
        <h3>FI Calc</h3>
        <FiCalcReportEnd {recipient} spouse={hasSpouse ? spouse : null} />
      </div>

      <div class="report-item">
        <h3>cFIREsim</h3>
        <CFireSimReportEnd {recipient} spouse={hasSpouse ? spouse : null} />
      </div>

      <div class="report-item">
        <h3>FIRECalc</h3>
        <FireCalcReportEnd {recipient} spouse={hasSpouse ? spouse : null} />
      </div>

      <div class="report-item">
        <h3>Linopt</h3>
        <LinoptReportEnd {recipient} spouse={hasSpouse ? spouse : null} />
      </div>

      <div class="report-item">
        <h3>Open Social Security</h3>
        <OpenSSReportEnd {recipient} spouse={hasSpouse ? spouse : null} />
      </div>

      <div class="report-item">
        <h3>Owl Retirement Planner</h3>
        <OwlPlannerReportEnd {recipient} spouse={hasSpouse ? spouse : null} />
      </div>
    </div>
  </div>
{:else}
  <div class="loading">Loading...</div>
{/if}

<style>
  .report-end-demo {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1em;
  }

  .demo-header {
    margin-bottom: 1.5em;
    padding-bottom: 1em;
    border-bottom: 1px solid #dee2e6;
  }

  .demo-header h2 {
    margin: 0 0 0.5em 0;
    color: #212529;
  }

  .demo-header p {
    margin: 0;
    color: #6c757d;
  }

  .report-list {
    display: flex;
    flex-direction: column;
    gap: 2em;
  }

  .report-item {
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
  }

  .report-item > h3 {
    margin: 0;
    padding: 0.75em 1em;
    background: #f8f9fa;
    font-size: 0.95em;
    color: #495057;
    border-bottom: 1px solid #e9ecef;
  }

  .loading {
    padding: 2em;
    text-align: center;
    color: #6c757d;
  }
</style>
