<script lang="ts">
  import type { Recipient } from '$lib/recipient';
  import type { StrategyResult } from '$lib/strategy/ui';
  import AlternativeStrategiesGrid from './AlternativeStrategiesGrid.svelte';

  // Props
  export let recipients: [Recipient, Recipient];
  export let result: StrategyResult | null = null;
  export let discountRate: number;
  export let displayAsAges: boolean = false;
</script>

{#if result}
  <div class="alternative-strategies-section">
    <div class="header-section">
      <div class="header-content">
        <h3>
          Alternative Filing Strategies: Filing <span
            class:active={!displayAsAges}
            class:inactive={displayAsAges}>Date</span
          ><label class="toggle-label">
            <input
              type="checkbox"
              bind:checked={displayAsAges}
              class="toggle-checkbox"
            />
            <span class="toggle-slider"></span>
          </label><span
            class:active={displayAsAges}
            class:inactive={!displayAsAges}>Age</span
          >
        </h3>
      </div>
    </div>
    <AlternativeStrategiesGrid
      {recipients}
      deathAge1={result.bucket1.expectedAge}
      deathAge2={result.bucket2.expectedAge}
      {discountRate}
      optimalNPV={result.totalBenefit}
      {displayAsAges}
    />
  </div>
{/if}

<style>
  .alternative-strategies-section {
    margin-top: 2rem;
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

  @media (max-width: 768px) {
    .header-content h3 {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
