<script lang="ts">
  export let discountRatePercent: number;
</script>

<div class="global-input-group">
  <label for="discountRate">Discount Rate (%):</label>
  <input
    id="discountRate"
    type="number"
    step="0.1"
    min="0"
    bind:value={discountRatePercent}
  />
</div>

<style>
  .global-input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .global-input-group label {
    font-weight: bold;
  }

  .global-input-group input {
    font-size: 1.2em;
    line-height: 1.3;
    height: 2.5em;
    padding: 5px;
    border: 2px solid #0b0c0c;
    border-radius: 0;
    appearance: none;
  }

  .global-input-group input:focus {
    outline: 3px solid #fd0;
    outline-offset: 0;
    box-shadow: inset 0 0 0 2px;
  }
</style>
