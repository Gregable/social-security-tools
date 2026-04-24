<script lang="ts">
import HowToReadChart from '$lib/components/HowToReadChart.svelte';
import type { Recipient } from '$lib/recipient';
import type {
  CalculationResults,
  CellPosition,
  CellSelectionDetail,
} from '$lib/strategy/ui';
import { CalculationStatus } from '$lib/strategy/ui';
import StrategyMatrix from './StrategyMatrix.svelte';

// Props
export let recipients: [Recipient, Recipient];
export let displayAsAges: boolean;

// Callback props for events
export let onselectcell:
  | ((detail: CellSelectionDetail) => void)
  | undefined = undefined;
export let calculationResults: CalculationResults;
export let deathProbDistribution1: { age: number; probability: number }[];
export let deathProbDistribution2: { age: number; probability: number }[];

// Shared state for matrix hovering
let hoveredCell: CellPosition | null = null;

// Handle hover cell events from child components
function handleHoverCell(detail: CellPosition | null) {
  hoveredCell = detail;
}
</script>

<div class="result-box">
  <div class="header-section">
    <div class="header-content">
      <h3>How death ages shape the strategies</h3>
      <div class="segmented" role="group" aria-label="Display filing as">
        <button
          type="button"
          class="seg"
          class:active={!displayAsAges}
          on:click={() => (displayAsAges = false)}
        >
          Date
        </button>
        <button
          type="button"
          class="seg"
          class:active={displayAsAges}
          on:click={() => (displayAsAges = true)}
        >
          Age
        </button>
      </div>
    </div>
  </div>
  <p class="lede">
    Every combination of lifespans has its own optimal filing strategy. The
    <strong>Recommended Filing Ages</strong> above pick a single strategy
    that works well across all of them; below, see what would be optimal at
    each specific combination.
  </p>
  <p class="caption">
    Each cell shows the optimal filing {displayAsAges ? 'age' : 'date'} for a
    specific Self/Spouse death-age pair. <em>Taller rows</em> and
    <em>wider columns</em> mark more likely death ages.
  </p>
  <HowToReadChart>
    <ul>
      <li>
        <strong>Two matrices:</strong> the left one shows Self's optimal
        filing {displayAsAges ? 'age' : 'date'}; the right one shows Spouse's.
        Both depend on <em>both</em> death ages because of survivor benefits.
      </li>
      <li>
        <strong>Row / column position:</strong> your death age on one axis,
        your spouse's on the other. Each cell is one specific pair.
      </li>
      <li>
        <strong>Row height &amp; column width:</strong> probability of that
        death age. Big cells are likely outcomes; tiny cells are edge cases.
      </li>
      <li>
        <strong>Cell color:</strong> similar strategies share a color, so
        large bands of one color mean the same strategy is optimal across
        many scenarios.
      </li>
      <li>
        <strong>Click a cell</strong> to see the full month-by-month benefit
        breakdown for that death-age pair.
      </li>
    </ul>
    <p>
      <strong>Takeaway:</strong> focus on the large, dense cells. Those are
      the most likely outcomes and they drive the Recommended Filing Ages. A
      single strategy usually covers most of the probability mass, which is
      why one recommendation is useful even across many possible lifespans.
    </p>
  </HowToReadChart>

  {#if calculationResults.status() === CalculationStatus.Complete}
    <div class="matrices-container">
      {#each [0, 1] as recipientIndex}
        <StrategyMatrix
          {recipientIndex}
          {recipients}
          {calculationResults}
          {deathProbDistribution1}
          {deathProbDistribution2}
          {hoveredCell}
          {displayAsAges}
          onhovercell={handleHoverCell}
          {onselectcell}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .result-box {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f8f9fa;
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
    font-size: 1.1rem;
    font-weight: 700;
    color: #060606;
  }

  .lede {
    margin: 0.6rem 0 0;
    font-size: 0.95rem;
    color: #1f2937;
    line-height: 1.5;
  }

  .caption {
    margin: 0.35rem 0 0;
    font-size: 0.85rem;
    color: #6b7280;
    line-height: 1.5;
  }

  .caption em {
    font-style: normal;
    color: #4b5563;
    font-weight: 500;
  }

  .segmented {
    display: inline-flex;
    background: #eef1f5;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 3px;
    flex-shrink: 0;
  }

  .seg {
    font: inherit;
    border: none;
    background: transparent;
    color: #4b5563;
    padding: 0.35rem 0.9rem;
    font-size: 0.88rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .seg:hover:not(.active) {
    color: #081d88;
  }

  .seg.active {
    background: #ffffff;
    color: #081d88;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(11, 17, 48, 0.08);
  }

  .seg:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 2px;
  }

  .matrices-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 1.5rem;
  }

  @media (max-width: 768px) {
    .matrices-container {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .header-content h3 {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
