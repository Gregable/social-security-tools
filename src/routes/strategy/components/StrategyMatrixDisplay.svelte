<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import type { MonthDate } from "$lib/month-time";
  import type { Money } from "$lib/money";
  import StrategyMatrix from "./StrategyMatrix.svelte";

  // Props
  export let recipients: [Recipient, Recipient];
  export let displayAsAges: boolean = false;

  // Callback props for events
  export let onselectcell: ((detail: any) => void) | undefined = undefined;
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
  function handleHoverCell(detail: { rowIndex: number; colIndex: number } | null) {
    hoveredCell = detail; // detail will be null or { rowIndex, colIndex }
  }
</script>

<div class="result-box">
  <div class="header-section">
    <div class="header-content">
      <h3>Optimal Strategies: Filing <span class:active={!displayAsAges} class:inactive={displayAsAges}>Date</span><label class="toggle-label">
          <input
            type="checkbox"
            bind:checked={displayAsAges}
            class="toggle-checkbox"
          />
          <span class="toggle-slider"></span>
        </label><span class:active={displayAsAges} class:inactive={!displayAsAges}>Age</span>
      </h3>
    </div>
  </div>
  <p>Calculation completed in {timeElapsed.toFixed(2)} seconds</p>
  <p>
    Tables show optimal filing {displayAsAges ? 'ages' : 'dates'} for each recipient across different death
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
          {displayAsAges}
          onhovercell={handleHoverCell}
          onselectcell={(detail) => onselectcell?.(detail)}
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

  .header-section {
    margin-bottom: 1rem;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .header-content h3 {
    margin: 0;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    flex-shrink: 0;
    margin: 0 0.25rem;
  }

  .active {
    font-weight: bold;
    color: #007bff;
  }

  .inactive {
    font-weight: normal;
    color: #999;
    opacity: 0.7;
  }

  .toggle-checkbox {
    display: none;
  }

  .toggle-slider {
    position: relative;
    width: 40px;
    height: 20px;
    background-color: #ccc;
    border-radius: 20px;
    transition: background-color 0.3s ease;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
  }

  .toggle-checkbox:checked + .toggle-slider {
    background-color: #007bff;
  }

  .toggle-checkbox:checked + .toggle-slider::before {
    transform: translateX(20px);
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
    
    .header-content h3 {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
