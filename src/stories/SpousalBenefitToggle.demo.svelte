<!--
  @component
  Demo wrapper for SpousalBenefitToggle that sets up required context and stores.
  Used only in Storybook stories.
-->
<script lang="ts">
import { onMount } from 'svelte';
import SpousalBenefitToggle from '$lib/components/integrations/SpousalBenefitToggle.svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import { Money } from '$lib/money';
import type { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import { IntegrationContext } from '$lib/components/integrations/integration-context';

export let recipient: Recipient;
export let spouse: Recipient;
export let toolName: string = 'Demo Tool';
export let includeSpousalBenefit: boolean = false;
export let recipientFilingDateValue: MonthDate;
export let spouseFilingDateValue: MonthDate;

// Track if stores are ready to avoid rendering with stale values
let ready = false;

// Initialize stores synchronously before rendering
function initializeStores() {
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
  initializeStores();
});

// Also initialize immediately for SSR/Storybook
$: if (recipientFilingDateValue && spouseFilingDateValue && !ready) {
  initializeStores();
}

$: context = new IntegrationContext(recipient, spouse);

// Bound values from toggle
let recipientBenefitCalculationDate: MonthDate;
let spouseBenefitCalculationDate: MonthDate;
let recipientAnnualBenefit: Money;
let spouseAnnualBenefit: Money;
</script>

{#if ready}
  <div class="demo-container">
    <SpousalBenefitToggle
      {context}
      bind:includeSpousalBenefit
      bind:recipientBenefitCalculationDate
      bind:spouseBenefitCalculationDate
      bind:recipientAnnualBenefit
      bind:spouseAnnualBenefit
      {toolName}
    />

    <div class="demo-output">
      <h4>Current Selection</h4>
      <p>Include Spousal Benefit: <strong>{includeSpousalBenefit ? 'Yes' : 'No'}</strong></p>
      {#if recipientAnnualBenefit}
        <p>{recipient.name} Annual Benefit: <strong>{recipientAnnualBenefit.wholeDollars()}</strong></p>
      {/if}
      {#if spouseAnnualBenefit && spouse}
        <p>{spouse.name} Annual Benefit: <strong>{spouseAnnualBenefit.wholeDollars()}</strong></p>
      {/if}
    </div>
  </div>
{:else}
  <div class="loading">Loading...</div>
{/if}

<style>
  .demo-container {
    max-width: 800px;
    padding: 1em;
  }

  .demo-output {
    margin-top: 1.5em;
    padding: 1em;
    background: #f0f4f8;
    border-radius: 8px;
    border: 1px solid #dee2e6;
  }

  .demo-output h4 {
    margin: 0 0 0.5em 0;
    color: #495057;
  }

  .demo-output p {
    margin: 0.25em 0;
    font-size: 0.95em;
  }

  .demo-output strong {
    color: #1976d2;
  }

  .loading {
    padding: 2em;
    text-align: center;
    color: #6c757d;
  }
</style>
