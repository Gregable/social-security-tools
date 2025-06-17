<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import StrategyMatrix from "./StrategyMatrix.svelte";

  // Props
  export let recipients: [Recipient, Recipient];
  export let deathAgeRange: number[];
  export let calculationResults: any[][];
  export let timeElapsed: number;
  export let isCalculationComplete: boolean;

  // Shared state for matrix hovering
  let hoveredCell: { rowIndex: number; colIndex: number } | null = null;

  // Handle hover cell events from child components
  function handleHoverCell(event: CustomEvent) {
    hoveredCell = event.detail; // event.detail will be null or { rowIndex, colIndex }
  }
</script>

<div class="result-box">
  <h3>Optimal Filing Date Strategies</h3>
  <p>Calculation completed in {timeElapsed.toFixed(2)} seconds</p>
  <p>
    Tables show optimal filing dates for each recipient across different death
    age combinations
  </p>

  {#if calculationResults[0]?.[0]?.error}
    <div class="error">
      <h4>Error:</h4>
      <p>{calculationResults[0][0].error}</p>
    </div>
  {:else if isCalculationComplete && calculationResults.length > 0}
    <div class="matrices-container">
      {#each [0, 1] as recipientIndex}
        <StrategyMatrix
          {recipientIndex}
          {recipients}
          {deathAgeRange}
          {calculationResults}
          {hoveredCell}
          on:hovercell={handleHoverCell}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .result-box {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f8f9fa;
  }

  .matrices-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 1.5rem;
  }

  .error {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    color: #721c24;
  }

  @media (max-width: 768px) {
    .matrices-container {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }
</style>
