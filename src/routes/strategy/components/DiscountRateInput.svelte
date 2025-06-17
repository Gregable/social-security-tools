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
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
</style>
