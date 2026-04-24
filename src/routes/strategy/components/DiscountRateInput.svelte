<script lang="ts">
import { onMount } from 'svelte';
import InfoTip from '$lib/components/InfoTip.svelte';
import { getRecommendedDiscountRate } from '$lib/strategy/data';

export let discountRatePercent: number;
export let isStuck: boolean = false;
// Two-way binding now used instead of explicit change callback.
export let onValidityChange: ((isValid: boolean) => void) | undefined =
  undefined;

let highlightInput = false;
let treasuryRate: number = 2.5; // Default value
let isValid = true;
let errorMessage = '';

let presetRates = [
  {
    label: `20-year Treasury rate (${treasuryRate}%)`,
    shortLabel: `${treasuryRate}%`,
    value: treasuryRate,
  },
  { label: 'US Stock 10y expected (3.5%)', shortLabel: '3.5%', value: 3.5 },
  { label: 'US Stock historical (7%)', shortLabel: '7%', value: 7 },
];

onMount(async () => {
  try {
    // getRecommendedDiscountRate returns the rate as a decimal (e.g., 0.038 for 3.8%)
    const rate = await getRecommendedDiscountRate();

    // Convert to percentage value by multiplying by 100
    treasuryRate = parseFloat((rate * 100).toFixed(2));

    // Update the presetRates array with the new treasury rate
    presetRates = [
      {
        label: `20-year Treasury rate (${treasuryRate}%)`,
        shortLabel: `${treasuryRate}%`,
        value: treasuryRate,
      },
      {
        label: 'US Stock 10y expected (3.5%)',
        shortLabel: '3.5%',
        value: 3.5,
      },
      { label: 'US Stock historical (7%)', shortLabel: '7%', value: 7 },
    ];

    // Update the discountRatePercent if it's currently set to our default treasury rate (2.5%)
    handleDiscountRateChange(treasuryRate);
  } catch (error) {
    console.error('Failed to fetch recommended discount rate:', error);
    // Keep default 2.5% if fetch fails
  }
});

// Handle discount rate changes
function handleDiscountRateChange(newValue: number) {
  validateDiscountRate(newValue);
  // Assign to exported prop to trigger two-way binding update in parent.
  discountRatePercent = newValue;
}

// Validate discount rate
function validateDiscountRate(value: number) {
  if (Number.isNaN(value)) {
    isValid = false;
    errorMessage = 'Please enter a valid number';
  } else if (value < 0) {
    isValid = false;
    errorMessage = 'Discount rate cannot be less than 0%';
  } else if (value > 50) {
    isValid = false;
    errorMessage = 'Discount rate cannot exceed 50%';
  } else {
    isValid = true;
    errorMessage = '';
  }
  onValidityChange?.(isValid);
}

// Validate on mount
$: validateDiscountRate(discountRatePercent);
</script>

<div class="discount-rate" class:is-compact={isStuck}>
  <div class="discount-rate-row">
    <label for="discountRate">
      Discount rate (real)
      <InfoTip label="About the discount rate">
        The rate used to convert future benefits into today's dollars. Higher
        rates make earlier filing look relatively better; lower rates favor
        waiting. The Treasury yield is a common conservative choice.
      </InfoTip>
    </label>
    <div class="rate-input-wrap">
      <input
        id="discountRate"
        type="number"
        step="0.1"
        min="0"
        max="50"
        inputmode="decimal"
        value={discountRatePercent}
        on:input={(event) => {
          const value = parseFloat(event.currentTarget.value) || 0;
          handleDiscountRateChange(value);
        }}
        class:highlight={highlightInput}
        class:invalid={!isValid}
      />
      <span class="rate-suffix" aria-hidden="true">%</span>
    </div>
    {#each presetRates as preset}
      <button
        type="button"
        class="preset-button"
        class:active={discountRatePercent === preset.value}
        on:click={() => {
          handleDiscountRateChange(preset.value);
          highlightInput = true;
        }}
      >
        <span class="preset-full">{preset.label}</span>
        <span class="preset-short">{preset.shortLabel}</span>
      </button>
    {/each}
  </div>
  {#if !isValid && errorMessage}
    <span class="error-message">{errorMessage}</span>
  {/if}
</div>

<style>
  .discount-rate {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .discount-rate-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .discount-rate-row .rate-input-wrap {
    margin-right: 0.35rem;
  }

  .discount-rate-row label {
    font-weight: 600;
    font-size: 0.95rem;
    color: #1f2937;
  }

  .rate-input-wrap {
    position: relative;
    width: 100px;
  }

  .rate-input-wrap input {
    width: 100%;
    font-size: 1rem;
    line-height: 1.4;
    padding: 0.6rem 1.75rem 0.6rem 0.75rem;
    border: 1.5px solid #d1d5db;
    border-radius: 6px;
    background-color: white;
    color: #0b0c0c;
    font-family: inherit;
    appearance: none;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .rate-input-wrap input::-webkit-outer-spin-button,
  .rate-input-wrap input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .rate-input-wrap input:focus {
    outline: none;
    border-color: #081d88;
    box-shadow: 0 0 0 3px rgba(8, 29, 136, 0.15);
  }

  .rate-input-wrap input.invalid {
    border-color: #d4351c;
    background-color: #fef5f5;
  }

  .rate-input-wrap input.invalid:focus {
    box-shadow: 0 0 0 3px rgba(212, 53, 28, 0.15);
  }

  .rate-suffix {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    font-weight: 500;
    pointer-events: none;
    user-select: none;
  }

  .error-message {
    color: #d4351c;
    font-size: 0.85rem;
  }

  .preset-button {
    padding: 0.35rem 0.7rem;
    font-size: 0.82rem;
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    color: #4b5563;
    cursor: pointer;
    font-family: inherit;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
  }

  .preset-button:hover {
    border-color: #081d88;
    color: #081d88;
    background-color: #f7f8fd;
  }

  .preset-button.active {
    background-color: #081d88;
    color: #fff;
    border-color: #081d88;
  }

  .preset-button:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 2px;
  }

  .preset-short {
    display: none;
  }

  /* Compact (sticky) variant — shrink everything so the discount row
     matches the height of the compact health cards. */
  .discount-rate.is-compact .discount-rate-row {
    gap: 0.4rem;
  }
  .discount-rate.is-compact .discount-rate-row label {
    display: none;
  }
  .discount-rate.is-compact .rate-input-wrap {
    width: 80px;
  }
  .discount-rate.is-compact .rate-input-wrap input {
    font-size: 0.9rem;
    padding: 0.3rem 1.4rem 0.3rem 0.6rem;
  }
  .discount-rate.is-compact .rate-suffix {
    right: 0.55rem;
    font-size: 0.9rem;
  }
  .discount-rate.is-compact .preset-button {
    padding: 0.3rem 0.55rem;
    font-size: 0.8rem;
  }
  .discount-rate.is-compact .preset-full {
    display: none;
  }
  .discount-rate.is-compact .preset-short {
    display: inline;
  }

  @media (max-width: 600px) {
    .preset-button {
      width: 100%;
      text-align: center;
    }
  }
</style>
