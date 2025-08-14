<script lang="ts">
  // Props
  import { CalculationStatus, CalculationResults } from '$lib/strategy/ui';
  export let calculationResults: CalculationResults;
  export let disabled: boolean = false;

  // Callback prop for events
  export let oncalculate: (() => void) | undefined = undefined;

  // Derived variable for progress bar width
  $: progressWidth = `${calculationResults.totalCalculations() > 0 ? (calculationResults.calculationProgress() / calculationResults.totalCalculations()) * 100 : 0}%`;
  $: isRunning = calculationResults.status() === CalculationStatus.Running;

  function triggerCalculation() {
    // Call the callback function to trigger calculation in the parent component
    oncalculate?.();
  }
</script>

<div class="calculation-controls">
  <button
    on:click={triggerCalculation}
    disabled={isRunning || disabled}
    class="calculate-button"
    title={disabled && !isRunning
      ? 'Please fix input errors before calculating'
      : ''}
  >
    {isRunning ? 'Calculating...' : 'Calculate Optimal Filing Strategies'}
  </button>

  {#if isRunning}
    <div class="loading">
      <span class="spinner"></span> Processing {calculationResults.calculationProgress()}
      of {calculationResults.totalCalculations()}
      combinations...
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style:width={progressWidth}></div>
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
