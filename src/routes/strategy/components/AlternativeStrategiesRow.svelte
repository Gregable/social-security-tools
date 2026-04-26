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
    return formatFilingAgeDisplay(
      filingAge,
      displayAsAges,
      recipient.birthdate
    );
  }

  function formatDelta(npv: Money): string {
    const delta = npv.sub(optimalNPV);
    const cents = delta.cents();
    if (cents === 0) return "$0";
    if (cents > 0) return `+${delta.wholeDollars()}`;
    return delta.wholeDollars();
  }
</script>

<div class="alternatives-row">
  <div class="strategies-container">
    {#each groupedByYear as yearGroup}
      <div class="year-row">
        <div class="year-label">Age {yearGroup.year}</div>
        <div class="strategies-row">
          {#each yearGroup.results as result}
            {#if result.isPlaceholder}
              <div
                class="strategy-box placeholder"
                title={result.placeholderReason}
              >
                <div class="filing-label">
                  {formatFilingAge(result.filingAge)}
                </div>
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
                title={result.isOptimal
                  ? `Optimal · ${result.npv.wholeDollars()}`
                  : `${formatDelta(result.npv)} vs optimal · ${result.npv.wholeDollars()} (${result.percentOfOptimal.toFixed(1)}%)`}
              >
                <div class="filing-label">
                  {formatFilingAge(result.filingAge)}
                </div>
                {#if result.isOptimal}
                  <div class="delta-optimal">Optimal</div>
                  <div class="percent-value">
                    {result.npv.wholeDollars()}
                  </div>
                {:else}
                  <div class="delta-value">{formatDelta(result.npv)}</div>
                  <div class="percent-value">
                    {result.percentOfOptimal.toFixed(1)}%
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div class="legend">
    <span class="legend-label">vs optimal:</span>
    <span class="legend-item">
      <span class="swatch" style="background-color: rgb(0, 100, 0);"></span>
      Optimal
    </span>
    <span class="legend-item">
      <span class="swatch" style="background-color: rgb(34, 139, 34);"></span>
      99%+
    </span>
    <span class="legend-item">
      <span class="swatch" style="background-color: rgb(100, 170, 50);"></span>
      95–99%
    </span>
    <span class="legend-item">
      <span class="swatch" style="background-color: rgb(190, 210, 50);"></span>
      90–95%
    </span>
    <span class="legend-item">
      <span class="swatch" style="background-color: rgb(255, 215, 0);"></span>
      85–90%
    </span>
    <span class="legend-item">
      <span class="swatch" style="background-color: rgb(255, 165, 0);"></span>
      80–85%
    </span>
    <span class="legend-item">
      <span class="swatch" style="background-color: rgb(220, 20, 60);"></span>
      &lt;80%
    </span>
  </div>
</div>

<style>
  .alternatives-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .strategies-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
    padding: 0.4rem 0.5rem;
    border-radius: 4px;
    width: 70px;
    box-sizing: border-box;
    color: #fff;
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
    background: #e0e0e0;
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
    font-size: 0.72rem;
    margin-bottom: 0.15rem;
  }

  .delta-value {
    font-size: 0.78rem;
    font-weight: 700;
    margin-bottom: 0.05rem;
  }

  .delta-optimal {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 0.05rem;
  }

  .percent-value {
    font-size: 0.62rem;
    opacity: 0.92;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    gap: 0.4rem 0.85rem;
    font-size: 0.78rem;
    color: #4b5563;
    border-top: 1px solid #eef0f5;
    padding-top: 0.75rem;
  }

  .legend-label {
    font-weight: 600;
    color: #1f2937;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .swatch {
    width: 14px;
    height: 12px;
    border-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    display: inline-block;
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
      padding: 0.3rem 0.4rem;
    }

    .filing-label {
      font-size: 0.62rem;
    }

    .delta-value {
      font-size: 0.68rem;
    }

    .delta-optimal {
      font-size: 0.6rem;
    }

    .percent-value {
      font-size: 0.55rem;
    }

    .legend {
      gap: 0.3rem 0.55rem;
      font-size: 0.7rem;
    }
  }
</style>
