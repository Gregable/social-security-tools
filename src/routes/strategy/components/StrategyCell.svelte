<script lang="ts">
import { filedBeforeDeath } from '$lib/benefit-calculator';
import RecipientName from '$lib/components/RecipientName.svelte';
import type { MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import type { CellPosition, StrategyResult } from '$lib/strategy/ui';
import {
  getFilingAge,
  getFilingDate,
  NEVER_FILES_DETAIL,
  NEVER_FILES_LABEL,
} from '$lib/strategy/ui';

// Props
export let rowIndex: number;
export let colIndex: number;
export let calculationResult: any;
export let displayAsAges: boolean;
export let recipients: [Recipient, Recipient];
export let recipientIndex: number;
export let hoveredCell: CellPosition | null;
export let isSelected: boolean = false;
export let cellWidth: number = 0;
export let cellHeight: number = 0;
export let cellStyle: string = '';

// Callback props
export let onhover: ((position: CellPosition) => void) | undefined =
  undefined;
export let onhoverout: (() => void) | undefined = undefined;
export let onselect: ((position: CellPosition) => void) | undefined =
  undefined;

// Cell hover overlay state
let cellHoverInfo: {
  x: number;
  y: number;
  filing1: string;
  filing2: string;
} | null = null;

/**
 * The per-recipient half of a couple result. StrategyResult declares the
 * second recipient's fields optional because the same shape serves single
 * results; this cell is couple-only, and reading the fields through here
 * makes a missing half a visible error rather than a property read on
 * undefined.
 */
interface RecipientStrategy {
  readonly filingAge: MonthDuration;
  readonly deathAge: MonthDuration;
}

function recipientStrategy(
  result: StrategyResult,
  recipientIndex: number
): RecipientStrategy {
  if (recipientIndex === 0) {
    return { filingAge: result.filingAge1, deathAge: result.bucket1.expectedAge };
  }
  if (result.filingAge2 === undefined || result.bucket2 === undefined) {
    throw new Error('StrategyCell requires a couple result');
  }
  return { filingAge: result.filingAge2, deathAge: result.bucket2.expectedAge };
}

/**
 * Whether this cell's strategy has the recipient filing before their death
 * month. The optimizer's search runs up to the death month (or, for a
 * recipient who dies before they could file, the one age past death that is
 * left), and a filing then is the "never files" strategy rather than a filing.
 */
function filesInCell(
  result: StrategyResult,
  recipients: [Recipient, Recipient],
  recipientIndex: number
): boolean {
  const recipient = recipients[recipientIndex];
  const { filingAge, deathAge } = recipientStrategy(result, recipientIndex);
  return filedBeforeDeath(
    recipient.birthdate.dateAtSsaAge(filingAge),
    recipient.birthdate.dateAtLayAge(deathAge)
  );
}

function describeFiling(
  result: StrategyResult,
  recipients: [Recipient, Recipient],
  recipientIndex: number
): string {
  if (!filesInCell(result, recipients, recipientIndex)) {
    return `${NEVER_FILES_LABEL} (${NEVER_FILES_DETAIL.toLowerCase()})`;
  }
  const { filingAge } = recipientStrategy(result, recipientIndex);
  const filingDate = recipients[recipientIndex].birthdate.dateAtSsaAge(
    filingAge
  );
  return `${filingAge.years()}y ${filingAge.modMonths()}m (${filingDate.toString()})`;
}

// Calculate conditional CSS classes
$: isHighlightedCell =
  hoveredCell &&
  hoveredCell.rowIndex === rowIndex &&
  hoveredCell.colIndex === colIndex;

$: isHighlightedColumn =
  hoveredCell &&
  hoveredCell.colIndex === colIndex &&
  hoveredCell.rowIndex !== rowIndex;

$: isHighlightedRow =
  hoveredCell &&
  hoveredCell.rowIndex === rowIndex &&
  hoveredCell.colIndex !== colIndex;

// Handle events
function handleMouseOver(event: MouseEvent) {
  onhover?.({ rowIndex, colIndex });

  if (calculationResult) {
    cellHoverInfo = {
      x: event.clientX,
      y: event.clientY,
      filing1: describeFiling(calculationResult, recipients, 0),
      filing2: describeFiling(calculationResult, recipients, 1),
    };
  }
}

function handleFocus() {
  onhover?.({ rowIndex, colIndex });
}

function handleMouseOut() {
  onhoverout?.();
  cellHoverInfo = null;
}

function handleBlur() {
  onhoverout?.();
}

function handleClick() {
  onselect?.({ rowIndex, colIndex });
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
}

// Get the display content for the cell (reactive)
$: cellContent = getCellContentReactive(
  calculationResult,
  displayAsAges,
  recipients,
  recipientIndex,
  cellWidth,
  cellHeight
);

function getCellContentReactive(
  calculationResult: any,
  displayAsAges: boolean,
  recipients: [Recipient, Recipient],
  recipientIndex: number,
  cellWidth: number,
  cellHeight: number
): string {
  if (!calculationResult) {
    return 'N/A';
  }

  const filingAgeYears =
    calculationResult[`filingAge${recipientIndex + 1}Years`];
  const filingAgeMonths =
    calculationResult[`filingAge${recipientIndex + 1}Months`];

  // Use a reasonable default width if cellWidth is 0 (during initialization)
  // Default to a larger size to show full format until actual dimensions are available
  const effectiveCellWidth = cellWidth || 100;

  // One label at every width. Unlike a date, which can be abbreviated
  // without changing meaning, a different word here would read as a
  // different outcome. The cell truncates with an ellipsis; the hover
  // overlay spells it out.
  if (!filesInCell(calculationResult, recipients, recipientIndex)) {
    return NEVER_FILES_LABEL;
  }

  if (displayAsAges) {
    return getFilingAge(
      filingAgeYears,
      filingAgeMonths,
      effectiveCellWidth,
      cellHeight
    );
  } else {
    return getFilingDate(
      recipients,
      recipientIndex,
      filingAgeYears,
      filingAgeMonths,
      effectiveCellWidth,
      cellHeight
    );
  }
}
</script>

<div
  class="strategy-cell"
  class:highlighted-cell={isHighlightedCell}
  class:highlighted-column={isHighlightedColumn}
  class:highlighted-row={isHighlightedRow}
  class:selected-cell={isSelected}
  on:mouseover={handleMouseOver}
  on:mouseout={handleMouseOut}
  on:focus={handleFocus}
  on:blur={handleBlur}
  on:click={handleClick}
  on:keydown={handleKeydown}
  tabindex="0"
  role="gridcell"
  style={cellStyle}
>
  <div class="filing-dates">
    {cellContent}
  </div>
</div>

<!-- Cell hover overlay -->
{#if cellHoverInfo}
  <div
    class="cell-hover-overlay"
    style:left="{cellHoverInfo.x + 10}px"
    style:top="{cellHoverInfo.y - 10}px"
  >
    <div class="overlay-header">Filing Strategy</div>
    <div class="overlay-content">
      <div class="overlay-section">
        <strong><RecipientName r={recipients[0]} />:</strong>
        {cellHoverInfo.filing1}
      </div>
      <div class="overlay-section">
        <strong><RecipientName r={recipients[1]} />:</strong>
        {cellHoverInfo.filing2}
      </div>
      <div class="overlay-footer">Click for full details</div>
    </div>
  </div>
{/if}

<style>
  .strategy-cell {
    border: 1px solid #333;
    text-align: center;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0; /* Important for grid items to prevent content from expanding them */
    min-width: 0; /* Important for grid items to prevent content from expanding them */
    width: 100%;
    height: 100%;
    align-self: stretch;
    justify-self: stretch;
    box-sizing: border-box;
    overflow: hidden;
  }

  /* Highlighting classes */
  .highlighted-cell {
    background-color: #007bff !important;
    color: white;
  }

  .highlighted-row {
    background-color: #e6f3ff !important;
  }

  .highlighted-column {
    background-color: #e6f3ff !important;
  }

  .filing-dates {
    line-height: 1.2;
    font-size: 0.85rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%; /* Prevent text from forcing cell to expand */
  }

  .strategy-cell.selected-cell {
    font-weight: bolder;
    background-color: #d6e3ff !important;
    color: #0056b3;
  }

  @media (max-width: 768px) {
    .filing-dates {
      font-size: 0.75rem;
    }

    .strategy-cell {
      padding: 0.15rem;
    }
  }

  /* Cell hover overlay styles */
  .cell-hover-overlay {
    position: fixed;
    z-index: 1000;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 0;
    max-width: 280px;
    font-size: 0.9rem;
    pointer-events: none;
    transform: translateY(-100%);
  }

  .overlay-header {
    background: #f8f9fa;
    padding: 0.75rem;
    border-bottom: 1px solid #e9ecef;
    border-radius: 7px 7px 0 0;
    font-weight: bold;
    color: #0056b3;
    font-size: 0.95rem;
    text-align: center;
  }

  .overlay-content {
    padding: 0.75rem;
  }

  .overlay-section {
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }

  .overlay-section:last-of-type {
    margin-bottom: 0;
  }

  .overlay-footer {
    padding-top: 0.5rem;
    border-top: 1px solid #e9ecef;
    font-style: italic;
    color: #6c757d;
    font-size: 0.85rem;
    text-align: center;
    margin-top: 0.5rem;
  }
</style>
