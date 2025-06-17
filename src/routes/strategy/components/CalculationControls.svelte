<script lang="ts">
  // Props
  export let isCalculationRunning: boolean;
  export let calculationProgress: number;
  export let totalCalculations: number;

  // Events
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  function triggerCalculation() {
    // Dispatch a custom event to trigger calculation in the parent component
    dispatch("calculate");
  }
</script>

<div class="calculation-controls">
  <button
    on:click={triggerCalculation}
    disabled={isCalculationRunning}
    class="calculate-button"
  >
    {isCalculationRunning
      ? "Calculating..."
      : "Calculate Optimal Filing Strategies"}
  </button>

  {#if isCalculationRunning}
    <div class="loading">
      <span class="spinner"></span> Processing {calculationProgress} of {totalCalculations}
      combinations...
    </div>
    <div class="progress-bar">
      <div
        class="progress-fill"
        style="width: {totalCalculations > 0
          ? (calculationProgress / totalCalculations) * 100
          : 0}%"
      ></div>
    </div>
  {/if}
</div>

<style>
  .calculation-controls {
    margin-bottom: 1rem;
  }

  .calculate-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .calculate-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .loading {
    margin: 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progress-bar {
    width: 100%;
    height: 20px;
    background-color: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
    margin: 1rem 0;
  }

  .progress-fill {
    height: 100%;
    background-color: #007bff;
    transition: width 0.3s ease;
  }

  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
