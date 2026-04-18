<script lang="ts">
export let disabled: boolean = false;

export let oncalculate: (() => void) | undefined = undefined;

function triggerCalculation() {
  oncalculate?.();
}
</script>

<div class="calculation-controls">
  <button
    on:click={triggerCalculation}
    {disabled}
    class="calculate-button"
    title={disabled ? 'Please fix input errors before calculating' : ''}
  >
    Calculate Optimal Filing Strategies
  </button>
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
</style>
