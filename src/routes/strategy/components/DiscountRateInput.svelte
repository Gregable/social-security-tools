<script lang="ts">
  import { onMount } from "svelte";
  import { getRecommendedDiscountRate } from "$lib/strategy/data";

  export let discountRatePercent: number;
  export let onDiscountRateChange: ((discountRatePercent: number) => void) | undefined = undefined;
  export let onValidityChange: ((isValid: boolean) => void) | undefined = undefined;
  
  let highlightInput = false;
  let treasuryRate: number = 2.5; // Default value
  let isValid = true;
  let errorMessage = "";

  let presetRates = [
    { label: `20-year Treasury rate (${treasuryRate}%)`, value: treasuryRate },
    { label: "US Stock 10y expected (3.5%)", value: 3.5 },
    { label: "US Stock historical (7%)", value: 7 },
  ];

  function triggerHighlight() {
    highlightInput = true;
    setTimeout(() => {
      highlightInput = false;
    }, 500); // Match this duration to the CSS animation duration
  }

  onMount(async () => {
    try {
      // getRecommendedDiscountRate returns the rate as a decimal (e.g., 0.038 for 3.8%)
      const rate = await getRecommendedDiscountRate();

      // Convert to percentage value by multiplying by 100
      treasuryRate = parseFloat((rate * 100).toFixed(2));

      console.log(
        `Fetched treasury rate: ${rate} (decimal) -> ${treasuryRate}% (percentage)`
      );

      // Update the presetRates array with the new treasury rate
      presetRates = [
        {
          label: `20-year Treasury rate (${treasuryRate}%)`,
          value: treasuryRate,
        },
        { label: "US Stock 10y expected (3.5%)", value: 3.5 },
        { label: "US Stock historical (7%)", value: 7 },
      ];

      // Update the discountRatePercent if it's currently set to our default treasury rate (2.5%)
      if (discountRatePercent === 2.5) {
        handleDiscountRateChange(treasuryRate);
      }
    } catch (error) {
      console.error("Failed to fetch recommended discount rate:", error);
      // Keep default 2.5% if fetch fails
    }
  });

  // Handle discount rate changes
  function handleDiscountRateChange(newValue: number) {
    validateDiscountRate(newValue);
    onDiscountRateChange?.(newValue);
  }

  // Validate discount rate
  function validateDiscountRate(value: number) {
    if (isNaN(value)) {
      isValid = false;
      errorMessage = "Please enter a valid number";
    } else if (value < -10) {
      isValid = false;
      errorMessage = "Discount rate cannot be less than -10%";
    } else if (value > 50) {
      isValid = false;
      errorMessage = "Discount rate cannot exceed 50%";
    } else {
      isValid = true;
      errorMessage = "";
    }
    onValidityChange?.(isValid);
  }

  // Validate on mount
  $: validateDiscountRate(discountRatePercent);
</script>

<div class="global-input-group">
  <label for="discountRate">Discount Rate (Real %):</label>
  <div class="preset-buttons">
    {#each presetRates as preset}
      <button
        type="button"
        class="preset-button"
        class:active={discountRatePercent === preset.value}
        on:click={() => {
          handleDiscountRateChange(preset.value);
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
    min="-10"
    max="50"
    value={discountRatePercent}
    on:input={(event) => {
      const value = parseFloat(event.currentTarget.value) || 0;
      handleDiscountRateChange(value);
    }}
    class:highlight={highlightInput}
    class:invalid={!isValid}
  />
  {#if !isValid && errorMessage}
    <span class="error-message">{errorMessage}</span>
  {/if}
</div>

<style>
  .global-input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
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

  .global-input-group input.highlight {
    animation: highlight-flash 0.5s ease-out;
  }

  .global-input-group input.invalid {
    border-color: #d4351c;
    background-color: #fee;
  }

  .error-message {
    color: #d4351c;
    font-size: 0.9em;
    margin-top: 0.25rem;
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
