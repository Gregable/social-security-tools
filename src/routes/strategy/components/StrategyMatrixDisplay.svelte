<script lang="ts">
import type { ComponentProps } from 'svelte';
import HowToReadChart from '$lib/components/HowToReadChart.svelte';
import RecipientName from '$lib/components/RecipientName.svelte';
import type { Recipient } from '$lib/recipient';
import {
  type AlreadyFiled,
  NOT_FILED,
} from '$lib/strategy/calculations/already-filed';
import NoFilingDecisionPanel from './NoFilingDecisionPanel.svelte';
import type {
  CalculationResults,
  CellPosition,
  CellSelectionDetail,
} from '$lib/strategy/ui';
import { CalculationStatus } from '$lib/strategy/ui';
import StrategyMatrix from './StrategyMatrix.svelte';

type NoChoiceVariant = NonNullable<
  ComponentProps<NoFilingDecisionPanel>['variant']
>;

// Props
export let recipients: [Recipient, Recipient];
export let displayAsAges: boolean;
/**
 * Per recipient: false once they are past 70 or have already filed. A
 * recipient with no choice left
 * has the same filing age in every cell, so their grid carries no
 * information and is not drawn at all.
 */
export let hasFilingChoice: [boolean, boolean] = [true, true];
/** Per recipient, the month benefits started, or null. Changes copy only. */
export let alreadyFiled: AlreadyFiled = NOT_FILED;

// Callback props for events
export let onselectcell:
  | ((detail: CellSelectionDetail) => void)
  | undefined = undefined;
export let calculationResults: CalculationResults;
export let deathProbDistribution1: { age: number; probability: number }[];
export let deathProbDistribution2: { age: number; probability: number }[];

// Only recipients who still have a filing decision get a grid.
$: gridIndexes = [0, 1].filter((i) => hasFilingChoice[i]);
$: skippedIndex = [0, 1].find((i) => !hasFilingChoice[i]);

// When nobody has a grid, name the actual reason. A single filed spouse can
// only reach this state if the other is past 70.
$: noChoiceVariant = noChoiceVariantFor(
  alreadyFiled.filter((f) => f !== null).length
);

function noChoiceVariantFor(filedCount: number): NoChoiceVariant {
  if (filedCount === 2) return 'both-filed';
  if (filedCount === 1) return 'filed-and-past-seventy';
  return 'both-past-seventy';
}

// Shared state for matrix hovering
let hoveredCell: CellPosition | null = null;

// Handle hover cell events from child components
function handleHoverCell(detail: CellPosition | null) {
  hoveredCell = detail;
}
</script>

<div class="result-box">
  {#if gridIndexes.length === 0}
    <!-- Gated on Complete like the grid branch below, so the panel does not
         flash while a calculation is still running. -->
    {#if calculationResults.status() === CalculationStatus.Complete}
      <div class="result-content">
        <NoFilingDecisionPanel variant={noChoiceVariant} />
      </div>
    {/if}
  {:else}
    <div class="result-content">
      <header class="section-header">
        <p class="section-kicker">How death ages shape the strategies</p>
      </header>
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
        <strong class="hint">Click any cell</strong> to see the full filing
        breakdown for that scenario.
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
        <div class="matrices-toolbar">
          <span class="toolbar-label">Display filing as</span>
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
      {/if}
    </div>

    {#if calculationResults.status() === CalculationStatus.Complete}
      {#if skippedIndex !== undefined}
        <div class="result-content">
          <p class="past-70-note">
            {#if alreadyFiled[skippedIndex] !== null}
              <RecipientName r={recipients[skippedIndex]} /> already receives
              benefits, so there is no grid for them: that filing date is
              settled.
            {:else}
              <RecipientName r={recipients[skippedIndex]} /> is past 70, so
              there is no grid for them: delayed retirement credits have
              stopped and filing now is their only remaining option.
            {/if}
            The lifespan trade-off below is <RecipientName
              r={recipients[skippedIndex === 0 ? 1 : 0]}
            />'s alone.
          </p>
        </div>
      {/if}
      <div
        class="matrices-container"
        class:single-matrix={gridIndexes.length === 1}
      >
        {#each gridIndexes as recipientIndex (recipientIndex)}
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
  {/if}
</div>

<style>
  .result-box {
    margin-top: 0.75rem;
  }

  .past-70-note {
    margin: 0 0 1rem;
    padding: 0.75rem 1rem;
    background: #f7f8fd;
    border-radius: 8px;
    font-size: 0.92rem;
    line-height: 1.55;
    color: #333;
  }

  /* The section heading, prose, and toolbar stay in the same 1200px column
     as the rest of the page. The matrices below break out to full viewport
     because the dense data needs every pixel. */
  .result-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 0.5rem;
  }

  .section-header {
    padding-bottom: 0.5rem;
    margin-bottom: 0.6rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-kicker {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .lede {
    max-width: 72ch;
    margin: 0.6rem 0 0;
    font-size: 0.95rem;
    color: #1f2937;
    line-height: 1.5;
  }

  .caption {
    max-width: 72ch;
    margin: 0.35rem 0 0;
    font-size: 0.85rem;
    color: #6b7280;
    line-height: 1.5;
  }

  .matrices-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.65rem;
    margin-top: 1.5rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .toolbar-label {
    font-size: 0.78rem;
    color: #6b7280;
    font-weight: 500;
  }

  .caption em {
    font-style: normal;
    color: #4b5563;
    font-weight: 500;
  }

  .caption .hint {
    color: #081d88;
    font-weight: 600;
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
    margin-top: 1rem;
    padding: 0 0.5rem;
  }

  /* With only one recipient still facing a decision, a half-width grid
     stranded on the left reads as a missing second chart. */
  .matrices-container.single-matrix {
    grid-template-columns: minmax(0, 1fr);
    max-width: 900px;
    margin-inline: auto;
  }

  @media (max-width: 768px) {
    .matrices-container {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }
</style>
