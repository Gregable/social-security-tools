<script lang="ts">
  import { onMount } from "svelte";
  import { getRecommendedDiscountRate } from "$lib/strategy/treasury-yields";

  export let discountRatePercent: number;

  let isLoading = false;
  let error: string | null = null;

  // Function to fetch and set the recommended discount rate
  async function fetchRecommendedRate() {
    isLoading = true;
    error = null;

    try {
      const rate = await getRecommendedDiscountRate();
      // Convert from decimal to percentage (e.g., 0.025 to 2.5)
      discountRatePercent = parseFloat((rate * 100).toFixed(2));
    } catch (err) {
      error = "Failed to fetch Treasury yield data. Using default rate.";
      console.error(error, err);
    } finally {
      isLoading = false;
    }
  }

  // Fetch the recommended rate when the component mounts
  onMount(() => {
    fetchRecommendedRate();
  });
</script>

<div class="discount-rate-container">
  <div class="discount-rate-header">
    <h3>Discount Rate</h3>
  </div>

  <div class="global-input-group">
    <label for="discountRate">Discount Rate (%):</label>
    <div class="input-with-status">
      <input
        id="discountRate"
        type="number"
        step="0.1"
        min="0"
        bind:value={discountRatePercent}
        disabled={isLoading}
      />
      {#if isLoading}
        <span class="status-indicator loading">Loading...</span>
      {:else if error}
        <span class="status-indicator error">{error}</span>
      {:else}
        <span class="status-indicator success">Using 20-Year Treasury Rate</span
        >
      {/if}
    </div>
  </div>

  <div class="info-text">
    <p>
      The discount rate is used to calculate the present value of future Social
      Security benefits. The current value is based on the latest 20-Year
      Treasury Real Yield Curve Rate.
    </p>
  </div>
</div>

<style>
  .discount-rate-container {
    margin-top: 1.5rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f9f9f9;
  }

  .discount-rate-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .discount-rate-header h3 {
    margin: 0;
  }

  .toggle-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .toggle-label input {
    margin-right: 0.5rem;
  }

  .last-updated {
    display: flex;
    align-items: center;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: #666;
  }

  .refresh-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    margin-left: 0.5rem;
    color: #0066cc;
  }

  .refresh-button:hover {
    color: #004499;
  }

  .refresh-button:disabled {
    color: #999;
    cursor: not-allowed;
  }

  .global-input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .global-input-group label {
    font-weight: bold;
  }

  .input-with-status {
    position: relative;
  }

  .global-input-group input {
    font-size: 1.2em;
    line-height: 1.3;
    height: 2.5em;
    padding: 5px;
    border: 2px solid #0b0c0c;
    border-radius: 0;
    appearance: none;
    width: 100%;
  }

  .global-input-group input:focus {
    outline: 3px solid #fd0;
    outline-offset: 0;
    box-shadow: inset 0 0 0 2px;
  }

  .global-input-group input[readonly] {
    background-color: #f0f0f0;
    cursor: not-allowed;
  }

  .status-indicator {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.85rem;
  }

  .loading {
    color: #666;
  }

  .error {
    color: #d32f2f;
  }

  .success {
    color: #2e7d32;
  }

  .info-text {
    font-size: 0.9rem;
    color: #555;
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    .discount-rate-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .toggle-container {
      margin-top: 0.5rem;
      align-items: flex-start;
    }
  }
</style>
