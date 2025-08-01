<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import type { Money } from "$lib/money";
  import AlternativeStrategiesGrid from "./AlternativeStrategiesGrid.svelte";

  // Props
  export let recipients: [Recipient, Recipient];
  export let selectedCellData: {
    deathAge1: number;
    deathAge2: number;
    filingAge1Years: number;
    filingAge1Months: number;
    filingAge2Years: number;
    filingAge2Months: number;
    netPresentValue: Money;
  } | null;
  export let discountRate: number;
</script>

{#if selectedCellData}
  <div class="alternative-strategies-section">
    <AlternativeStrategiesGrid
      {recipients}
      deathAge1={selectedCellData.deathAge1}
      deathAge2={selectedCellData.deathAge2}
      {discountRate}
      optimalNPV={selectedCellData.netPresentValue}
    />
  </div>
{/if}

<style>
  .alternative-strategies-section {
    margin-top: 2rem;
  }
</style>
