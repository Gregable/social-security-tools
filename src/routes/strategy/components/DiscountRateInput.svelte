<script lang="ts">
  import { onMount } from "svelte";
  import { getRecommendedDiscountRate } from "$lib/strategy/treasury-yields";

  export let discountRatePercent: number;
  let highlightInput = false;

  const presetRates = [
    { label: "20-year Treasury rate (2.5%)", value: 2.5 },
    { label: "US Stock 10y expected (3.5%)", value: 3.5 },
    { label: "US Stock historical (7%)", value: 7 },
  ];

  function triggerHighlight() {
    highlightInput = true;
    setTimeout(() => {
      highlightInput = false;
    }, 500); // Match this duration to the CSS animation duration
  }
</script>

<div class="global-input-group">
  <label for="discountRate">Discount Rate (%):</label>
  <div class="preset-buttons">
    {#each presetRates as preset}
      <button
        type="button"
        class="preset-button"
        class:active={discountRatePercent === preset.value}
        on:click={() => {
          discountRatePercent = preset.value;
          triggerHighlight();
        }}
      >
        {preset.label}
      </button>
    {/each}
  </div>
  <input
    id="discountRate"
    type="number"
    step="0.1"
    min="0"
    bind:value={discountRatePercent}
    class:highlight={highlightInput}
  />
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

  .global-input-group input.highlight {
    animation: highlight-flash 0.5s ease-out;
  }

  @keyframes highlight-flash {
    0% {
      box-shadow: 0 0 0 0px rgba(0, 94, 165, 0.7);
    }
    50% {
      box-shadow: 0 0 0 5px rgba(0, 94, 165, 0.7);
    }
    100% {
      box-shadow: 0 0 0 0px rgba(0, 94, 165, 0);
    }
  }

  .preset-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.5rem 0;
  }

  .preset-button {
    padding: 0.3rem 0.6rem;
    font-size: 0.8em;
    background-color: #f8f8f8;
    border: 1px solid #ccc;
    border-radius: 4px;
    color: #333;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .preset-button:hover {
    background-color: #e8e8e8;
    border-color: #999;
  }

  .preset-button.active {
    background-color: #005ea5;
    color: #fff;
    border-color: #005ea5;
  }

  .preset-button:focus {
    outline: 3px solid #fd0;
    outline-offset: 0;
  }

  @media (max-width: 600px) {
    .preset-buttons {
      flex-direction: column;
    }

    .preset-button {
      width: 100%;
      text-align: center;
    }
  }
</style>
