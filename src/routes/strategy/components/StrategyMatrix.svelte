<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import StrategyCell from "./StrategyCell.svelte";
  import { MonthDate, MonthDuration } from "$lib/month-time";
  import type { Money } from "$lib/money";
  import {
    createBorderRemovalFunctions,
  } from "$lib/strategy/ui";
  import { getMonthYearColor } from "$lib/strategy/ui";
  import { calculateGridTemplates } from "$lib/strategy/ui";

  // Props
  export let recipientIndex: number;
  export let recipients: [Recipient, Recipient];
  export let displayAsAges: boolean = false;
  export let deathAgeRange1: number[];
  export let deathAgeRange2: number[];
  export let calculationResults: any[][];
  export let deathProbDistribution1: { age: number; probability: number }[];
  export let deathProbDistribution2: { age: number; probability: number }[];
  export let hoveredCell: { rowIndex: number; colIndex: number } | null = null;
  export let minMonthsSinceEpoch: number | null;
  export let maxMonthsSinceEpoch: number | null;
  export let selectedCellData: {
    deathAge1: number;
    deathAge2: number;
    filingAge1Years: number;
    filingAge1Months: number;
    filingDate1: MonthDate;
    filingAge2Years: number;
    filingAge2Months: number;
    filingDate2: MonthDate;
    netPresentValue: Money;
  } | null;

  // Callback props for events
  export let onhovercell: ((detail: { rowIndex: number; colIndex: number } | null) => void) | undefined = undefined;
  export let onselectcell: ((detail: any) => void) | undefined = undefined;

  // Matrix width tracking
  let matrixWidth: number = 0;

  // Fixed height constant (matches CSS)
  const MATRIX_HEIGHT = 900;

  // Calculate grid templates based on probabilities
  function _getCellDimensions(rowIndex: number, colIndex: number): { width: number; height: number } {
    // Use the reactive cell dimensions matrix
    return cellDimensions[rowIndex]?.[colIndex] || { width: 0, height: 0 };
  }

  // Create normalized value extractor that compares actual dates, not display strings
  function createNormalizedValueExtractor(recipientIndex: number) {
    return (calculationResult: any): string => {
      if (!calculationResult || calculationResult.error) return 'error';
      
      // Get the filing age and convert to a normalized date string
      const filingAgeYears = calculationResult[`filingAge${recipientIndex + 1}Years`];
      const filingAgeMonths = calculationResult[`filingAge${recipientIndex + 1}Months`];
      
      // Create a normalized string that represents the same date regardless of display format
      // Format: "YYYY-MM" for consistent comparison
      const birthdate = recipients[recipientIndex].birthdate;
      const filingAge = MonthDuration.initFromYearsMonths({
        years: filingAgeYears,
        months: filingAgeMonths,
      });
      const filingDate = birthdate.dateAtLayAge(filingAge);
      
      return `${filingDate.year()}-${(filingDate.monthIndex() + 1).toString().padStart(2, '0')}`;
    };
  }

  // Extractor for recipient values using normalized date comparison
  $: borderRemovalFuncs = createBorderRemovalFunctions(
    createNormalizedValueExtractor(recipientIndex),
    calculationResults
  );

  // Calculate grid templates based on probabilities
  $: rowTemplate = calculateGridTemplates(
    deathAgeRange1,
    deathProbDistribution1
  );
  $: columnTemplate = calculateGridTemplates(
    deathAgeRange2,
    deathProbDistribution2
  );
  
  // Calculate the actual percentage for each cell based on grid templates
  $: rowPercentages = rowTemplate.split(' ').map(p => parseFloat(p.replace('%', '')) / 100);
  $: columnPercentages = columnTemplate.split(' ').map(p => parseFloat(p.replace('%', '')) / 100);

  // Create reactive cell dimensions matrix that updates when matrixWidth changes
  $: cellDimensions = deathAgeRange1.map((_, i) => 
    deathAgeRange2.map((_, j) => ({
      width: matrixWidth * (columnPercentages[j] || 0),
      height: MATRIX_HEIGHT * (rowPercentages[i] || 0)
    }))
  );

  // Calculate cell styles including background color and border removal
  function getCellStyle(i: number, j: number): string {
    let style = '';
    
    // Add background color based on filing date
    if (calculationResults[i][j] && minMonthsSinceEpoch !== null && maxMonthsSinceEpoch !== null) {
      const filingAge = calculationResults[i][j][`filingAge${recipientIndex + 1}`];
      const filingDate = recipients[recipientIndex].birthdate.dateAtLayAge(filingAge);
      const backgroundColor = getMonthYearColor(
        filingDate.monthsSinceEpoch(),
        minMonthsSinceEpoch,
        maxMonthsSinceEpoch
      );
      style += `background-color: ${backgroundColor}; `;
    }
    
    // Apply border removal logic
    let bordersRemoved = 0;
    if (borderRemovalFuncs.right(i, j)) {
      style += 'border-right: none; ';
      bordersRemoved++;
    }
    if (borderRemovalFuncs.bottom(i, j)) {
      style += 'border-bottom: none; ';
      bordersRemoved++;
    }
    if (borderRemovalFuncs.left(i, j)) {
      style += 'border-left: none; ';
      bordersRemoved++;
    }
    if (borderRemovalFuncs.top(i, j)) {
      style += 'border-top: none; ';
      bordersRemoved++;
    }
    
    // Add subtle visual indicator when borders are removed
    if (bordersRemoved > 0) {
      style += 'box-shadow: inset 0 0 2px rgba(0, 123, 255, 0.3); ';
    }
    
    return style;
  }

  // Handle events
  function handleCellHover(event) {
    const { rowIndex, colIndex } = event.detail;
    onhovercell?.({ rowIndex, colIndex });
  }

  function handleCellHoverOut() {
    onhovercell?.(null);
  }

  function handleCellSelect(event) {
    const { rowIndex, colIndex } = event.detail;
    const result = calculationResults[rowIndex][colIndex];
    if (result) {
      const filingAge1 = result.filingAge1;
      const filingDate1 = recipients[0].birthdate.dateAtLayAge(filingAge1);
      const filingAge2 = result.filingAge2;
      const filingDate2 = recipients[1].birthdate.dateAtLayAge(filingAge2);

      onselectcell?.({
        deathAge1: deathAgeRange1[rowIndex],
        deathAge2: deathAgeRange2[colIndex],
        filingAge1Years: result.filingAge1Years,
        filingAge1Months: result.filingAge1Months,
        filingDate1: filingDate1,
        filingAge2Years: result.filingAge2Years,
        filingAge2Months: result.filingAge2Months,
        filingDate2: filingDate2,
        netPresentValue: result.totalBenefit,
      });
    }
  }
</script>

<div class="matrix-container recipient-matrix">
  <div class="matrix-title">
    <h4>
      Optimal Filing {displayAsAges ? 'Age' : 'Date'} for <RecipientName r={recipients[recipientIndex]} />
    </h4>
  </div>
  <div class="matrix-legend">
    <p>
      <strong>Size</strong>: Row and Column width / height indicate the relative
      probability of each person's death at that age range.
    </p>
  </div>

  <div class="strategy-grid-container">
    <!-- Column headers -->
    <div class="grid-headers">
      <div
        class="recipient-header col-header"
        style:grid-column="span {deathAgeRange2.length}"
      >
        <RecipientName r={recipients[1]} apos /> Death Age
      </div>
    </div>

    <div class="grid-headers age-headers">
      <div class="empty-corner"></div>
      <div class="empty-corner"></div>
      <div
        class="age-header-container"
        style:grid-template-columns="{columnTemplate}" style:width="100%"
      >
        {#each deathAgeRange2 as deathAge, j}
          <div
            class="age-header"
            class:highlighted-column={hoveredCell && hoveredCell.colIndex === j}
          >
            {deathAge}
          </div>
        {/each}
      </div>
    </div>

    <!-- Main grid with row headers and cells -->
    <div class="grid-main-container">
      <!-- Row headers -->
      <div class="grid-headers row-headers">
        <div class="recipient-header row-header header-text">
          <div class="header-text">
            <RecipientName r={recipients[0]} apos /> Death Age
          </div>
        </div>
        <div
          class="age-header-container"
          style:grid-template-rows="{rowTemplate}"
        >
          {#each deathAgeRange1 as deathAge, i}
            <div
              class="age-header"
              class:highlighted-row={hoveredCell && hoveredCell.rowIndex === i}
            >
              {deathAge}
            </div>
          {/each}
        </div>
      </div>

      <!-- Grid cells -->
      <div
        class="strategy-grid"
        bind:clientWidth={matrixWidth}
        style:grid-template-columns="{columnTemplate}" style:grid-template-rows="{rowTemplate}" style:display="grid" style:min-height="0"
      >
        {#each deathAgeRange1 as _deathAge1, i}
          {#each deathAgeRange2 as _deathAge2, j}
            <StrategyCell
              rowIndex={i}
              colIndex={j}
              calculationResult={calculationResults[i][j]}
              {displayAsAges}
              {recipients}
              {recipientIndex}
              {hoveredCell}
              {selectedCellData}
              {deathAgeRange1}
              {deathAgeRange2}
              cellWidth={cellDimensions[i]?.[j]?.width || 0}
              cellHeight={cellDimensions[i]?.[j]?.height || 0}
              cellStyle={getCellStyle(i, j)}
              on:hover={handleCellHover}
              on:hoverout={handleCellHoverOut}
              on:select={handleCellSelect}
            />
          {/each}
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .matrix-container {
    margin-top: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1rem;
    background-color: #ffffff;
  }

  .recipient-matrix {
    background-color: #f9fff8;
  }

  .matrix-title {
    margin-bottom: 0.5rem;
    text-align: center;
    padding: 0.5rem;
    border-radius: 4px;
  }

  .matrix-title h4 {
    margin: 0;
    color: #0056b3;
  }

  .matrix-legend {
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: #e9ecef;
    border-radius: 4px;
  }

  .matrix-legend p {
    margin: 0.5rem 0;
  }

  .strategy-grid-container {
    display: grid;
    grid-template-rows: auto auto 1fr;
  }

  .grid-headers {
    display: grid;
    grid-template-columns: auto 1fr;
  }

  .age-headers {
    grid-template-columns: auto auto 1fr;
  }

  .age-header-container {
    display: grid;
    height: 100%;
  }

  .grid-main-container {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: stretch; /* Ensure rows stretch to fill the container */
    height: 100%; /* Force to take up full height */
  }

  .row-headers {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%; /* Ensure it takes up full height */
    min-height: 900px;
    align-self: stretch;
    justify-self: stretch;
  }

  .strategy-grid {
    display: grid;
    grid-auto-flow: row;
    /* Force the grid to expand to fill available space */
    width: 100%;
    height: 100%;
  }

  .recipient-header {
    background-color: #e9ecef;
    font-weight: bold;
    font-size: 0.9rem;
    padding: 0.75rem 0.5rem;
    text-align: center;
  }

  .row-header {
    writing-mode: vertical-lr;
    text-orientation: mixed;
    height: 100%;
    min-height: 900px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
  }

  .row-header .header-text {
    transform: rotate(180deg);
    white-space: nowrap;
  }

  .col-header {
    text-align: center;
    vertical-align: middle;
  }

  .age-header {
    background-color: #e9ecef;
    color: #495057;
    font-weight: 600;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ddd;
    min-width: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    align-self: stretch; /* Make sure it stretches to fill grid cell */
    justify-self: stretch;
  }

  .row-headers .age-header {
    min-width: 2rem;
  }

  .empty-corner {
    background-color: #e9ecef;
    min-width: 2rem;
    min-height: 2rem;
  }
</style>
