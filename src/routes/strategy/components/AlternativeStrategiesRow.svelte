<script lang="ts">
  import { Money } from "$lib/money";
  import { MonthDuration } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import {
    calculateAlternativeStrategies,
    formatFilingAgeDisplay,
    getStrategyColor,
    type YearGroup,
  } from "$lib/strategy/calculations/alternative-strategies";

  export let recipient: Recipient;
  export let deathAge: MonthDuration;
  export let discountRate: number;
  export let optimalNPV: Money;
  export let optimalFilingAge: MonthDuration;
  export let displayAsAges: boolean = false;

  let groupedByYear: YearGroup[] = [];

  // Calculate alternatives when inputs change
  $: {
    groupedByYear = calculateAlternativeStrategies(
      recipient,
      deathAge,
      discountRate,
      optimalNPV,
      optimalFilingAge
    );
  }

  function getColor(percentOfOptimal: number, isOptimal: boolean): string {
    return getStrategyColor(percentOfOptimal, isOptimal);
  }

  function formatFilingAge(filingAge: MonthDuration): string {
    return formatFilingAgeDisplay(filingAge, displayAsAges, recipient.birthdate);
  }
</script>

<div class="alternative-strategies-container">
  <h3>
    Alternative Filing {displayAsAges ? "Ages" : "Dates"}
  </h3>
  <p class="description">
    Compare NPV outcomes for different filing ages given the selected death
    scenario.
  </p>

  <div class="strategies-container">
    {#each groupedByYear as yearGroup}
      <div class="year-row">
        <div class="year-label">Age {yearGroup.year}</div>
        <div class="strategies-row">
          {#each yearGroup.results as result}
            {#if result.isPlaceholder}
              <div class="strategy-box placeholder" title={result.placeholderReason}>
                <div class="filing-label">{formatFilingAge(result.filingAge)}</div>
                <div class="placeholder-text">N/A</div>
              </div>
            {:else}
              <div
                class="strategy-box"
                class:optimal={result.isOptimal}
                style="background-color: {getColor(
                  result.percentOfOptimal,
                  result.isOptimal
                )};"
              >
                <div class="filing-label">{formatFilingAge(result.filingAge)}</div>
                <div class="npv-value">{result.npv.wholeDollars()}</div>
                <div class="percent-value">{result.percentOfOptimal.toFixed(1)}%</div>
                {#if result.isOptimal}
                  <div class="optimal-badge">Optimal</div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div class="legend">
    <span class="legend-item">
      <span class="color-box" style="background-color: rgb(0, 100, 0);"></span>
      Optimal
    </span>
    <span class="legend-item">
      <span class="color-box" style="background-color: rgb(34, 139, 34);"></span>
      99%+
    </span>
    <span class="legend-item">
      <span class="color-box" style="background-color: rgb(100, 170, 50);"></span>
      95-99%
    </span>
    <span class="legend-item">
      <span
        class="color-box"
        style="background-color: rgb(190, 210, 50);"
      ></span>
      90-95%
    </span>
    <span class="legend-item">
      <span class="color-box" style="background-color: rgb(255, 215, 0);"></span>
      85-90%
    </span>
    <span class="legend-item">
      <span class="color-box" style="background-color: rgb(255, 165, 0);"></span>
      80-85%
    </span>
    <span class="legend-item">
      <span class="color-box" style="background-color: rgb(220, 20, 60);"></span>
      &lt;80%
    </span>
  </div>
</div>

<style>
  .alternative-strategies-container {
    margin-top: 2rem;
    padding: 1.5rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .alternative-strategies-container h3 {
    color: #333;
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
  }

  .description {
    color: #666;
    font-size: 0.9rem;
    margin: 0 0 1.5rem 0;
  }

  .strategies-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .year-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .year-label {
    min-width: 55px;
    font-weight: 600;
    font-size: 0.85rem;
    color: #555;
  }

  .strategies-row {
    display: grid;
    grid-template-columns: repeat(12, 70px);
    gap: 0.25rem;
  }

  .strategy-box {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.35rem 0.5rem;
    border-radius: 4px;
    width: 70px;
    box-sizing: border-box;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    transition: transform 0.1s ease;
    cursor: default;
  }

  .strategy-box:hover {
    transform: scale(1.1);
    z-index: 1;
  }

  .strategy-box.optimal {
    border: 2px solid #ffd700;
    box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
  }

  .strategy-box.placeholder {
    background-color: #e0e0e0;
    color: #999;
    text-shadow: none;
    cursor: help;
  }

  .strategy-box.placeholder:hover {
    transform: none;
  }

  .placeholder-text {
    font-size: 0.65rem;
    font-style: italic;
  }

  .filing-label {
    font-weight: bold;
    font-size: 0.75rem;
    margin-bottom: 0.1rem;
  }

  .npv-value {
    font-size: 0.7rem;
    margin-bottom: 0.05rem;
  }

  .percent-value {
    font-size: 0.65rem;
    opacity: 0.9;
  }

  .optimal-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background-color: #ffd700;
    color: #333;
    font-size: 0.55rem;
    font-weight: bold;
    padding: 1px 4px;
    border-radius: 8px;
    text-shadow: none;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    font-size: 0.8rem;
    color: #666;
    border-top: 1px solid #eee;
    padding-top: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .color-box {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    .strategies-container {
      gap: 0.4rem;
    }

    .year-row {
      gap: 0.3rem;
    }

    .year-label {
      min-width: 45px;
      font-size: 0.75rem;
    }

    .strategies-row {
      grid-template-columns: repeat(12, 55px);
      gap: 0.2rem;
    }

    .strategy-box {
      width: 55px;
      padding: 0.25rem 0.4rem;
    }

    .filing-label {
      font-size: 0.65rem;
    }

    .npv-value {
      font-size: 0.6rem;
    }

    .percent-value {
      font-size: 0.55rem;
    }

    .legend {
      gap: 0.5rem;
      font-size: 0.7rem;
    }
  }
</style>
