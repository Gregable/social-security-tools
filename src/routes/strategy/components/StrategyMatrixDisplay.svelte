<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import type { MonthDate } from "$lib/month-time";
  import type { Money } from "$lib/money";
  import StrategyMatrix from "./StrategyMatrix.svelte";
  import { createEventDispatcher } from "svelte";

  // Props
  export let recipients: [Recipient, Recipient];

  const dispatch = createEventDispatcher();
  export let deathAgeRange1: number[];
  export let deathAgeRange2: number[];
  export let calculationResults: any[][];
  export let deathProbDistribution1: { age: number; probability: number }[];
  export let deathProbDistribution2: { age: number; probability: number }[];
  export let timeElapsed: number;
  export let isCalculationComplete: boolean;
  export let minMonthsSinceEpoch: number | null;
  export let maxMonthsSinceEpoch: number | null;
  export let selectedCellData: {
    deathAge1: number;
    deathAge2: number;
    filingAge1Years: number;
    filingAge1Months: number;
    filingDate1: MonthDate;
    filingAge2Years: number;
    filingAge2Months: number;
    filingDate2: MonthDate;
    netPresentValue: Money;
  } | null;

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

  {#if isCalculationComplete}
    <div class="matrices-container">
      {#each [0, 1] as recipientIndex}
        <StrategyMatrix
          {recipientIndex}
          {recipients}
          {deathAgeRange1}
          {deathAgeRange2}
          {calculationResults}
          {deathProbDistribution1}
          {deathProbDistribution2}
          {hoveredCell}
          {minMonthsSinceEpoch}
          {maxMonthsSinceEpoch}
          {selectedCellData}
          on:hovercell={handleHoverCell}
          on:selectcell={(event) => dispatch("selectcell", event.detail)}
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

  @media (max-width: 768px) {
    .matrices-container {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }
</style>
