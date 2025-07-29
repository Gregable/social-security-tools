<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import type { Money } from "$lib/money";
  import {
    getFilingDate,
    getFilingAge,
  } from "$lib/strategy/ui";
  import { createEventDispatcher } from "svelte";

  // Props
  export let rowIndex: number;
  export let colIndex: number;
  export let calculationResult: any;
  export let displayAsAges: boolean;
  export let recipients: [Recipient, Recipient];
  export let recipientIndex: number;
  export let hoveredCell: { rowIndex: number; colIndex: number } | null;
  export let selectedCellData: {
    deathAge1: number;
    deathAge2: number;
    filingAge1Years: number;
    filingAge1Months: number;
    filingDate1: any;
    filingAge2Years: number;
    filingAge2Months: number;
    filingDate2: any;
    netPresentValue: Money;
  } | null;
  export let deathAgeRange1: number[];
  export let deathAgeRange2: number[];
  export let cellWidth: number = 0;
  export let cellHeight: number = 0;
  export let cellStyle: string = "";

  const dispatch = createEventDispatcher();

  // Calculate conditional CSS classes
  $: isHighlightedCell = hoveredCell && 
    hoveredCell.rowIndex === rowIndex && 
    hoveredCell.colIndex === colIndex;

  $: isHighlightedColumn = hoveredCell && 
    hoveredCell.colIndex === colIndex && 
    hoveredCell.rowIndex !== rowIndex;

  $: isHighlightedRow = hoveredCell && 
    hoveredCell.rowIndex === rowIndex && 
    hoveredCell.colIndex !== colIndex;

  $: isSelectedCell = selectedCellData && 
    selectedCellData.deathAge1 === deathAgeRange1[rowIndex] && 
    selectedCellData.deathAge2 === deathAgeRange2[colIndex];

  // Handle events
  function handleMouseOver() {
    dispatch('hover', { rowIndex, colIndex });
  }

  function handleMouseOut() {
    dispatch('hoverout');
  }

  function handleClick() {
    dispatch('select', { rowIndex, colIndex });
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

    const filingAgeYears = calculationResult[`filingAge${recipientIndex + 1}Years`];
    const filingAgeMonths = calculationResult[`filingAge${recipientIndex + 1}Months`];

    // Use a reasonable default width if cellWidth is 0 (during initialization)
    // Default to a larger size to show full format until actual dimensions are available
    const effectiveCellWidth = cellWidth || 100;

    if (displayAsAges) {
      return getFilingAge(filingAgeYears, filingAgeMonths, effectiveCellWidth, cellHeight);
    } else {
      return getFilingDate(recipients, recipientIndex, filingAgeYears, filingAgeMonths, effectiveCellWidth, cellHeight);
    }
  }
</script>

<div
  class="strategy-cell"
  class:highlighted-cell={isHighlightedCell}
  class:highlighted-column={isHighlightedColumn}
  class:highlighted-row={isHighlightedRow}
  class:selected-cell={isSelectedCell}
  on:mouseover={handleMouseOver}
  on:mouseout={handleMouseOut}
  on:focus={handleMouseOver}
  on:blur={handleMouseOut}
  on:click={handleClick}
  on:keydown={handleKeydown}
  tabindex="0"
  role="gridcell"
  title="Net present value: {calculationResult?.totalBenefit.string() || 'N/A'}"
  style={cellStyle}
>
  <div class="filing-dates">
    {cellContent}
  </div>
</div>

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
</style>
