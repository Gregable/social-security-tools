<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { createEventDispatcher } from "svelte";
  import { MonthDate } from "$lib/month-time";
  import type { Money } from "$lib/money";
  import {
    getFilingDate,
    createValueExtractor,
    createBorderRemovalFunctions,
  } from "$lib/strategy/ui";
  import { getMonthYearColor } from "$lib/strategy/ui";
  import { calculateGridTemplates } from "$lib/strategy/ui";

  // Props
  export let recipientIndex: number;
  export let recipients: [Recipient, Recipient];
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

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Matrix width tracking
  let matrixWidth: number = 0;

  // Fixed height constant (matches CSS)
  const MATRIX_HEIGHT = 900;

  // Calculate grid templates based on probabilities
  function getCellDimensions(rowIndex: number, colIndex: number): { width: number; height: number } {
    // Use the reactive cell dimensions matrix
    return cellDimensions[rowIndex]?.[colIndex] || { width: 0, height: 0 };
  }

  // Extractor for recipient values
  $: borderRemovalFuncs = createBorderRemovalFunctions(
    createValueExtractor(recipients, recipientIndex + 1),
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

  // Handle events
  function handleMouseOver(i: number, j: number) {
    dispatch("hovercell", { rowIndex: i, colIndex: j });
  }

  function handleMouseOut() {
    dispatch("hovercell", null);
  }

  function handleClick(i: number, j: number) {
    const result = calculationResults[i][j];
    if (result) {
      const filingAge1 = result.filingAge1;
      const filingDate1 = recipients[0].birthdate.dateAtLayAge(filingAge1);
      const filingAge2 = result.filingAge2;
      const filingDate2 = recipients[1].birthdate.dateAtLayAge(filingAge2);

      dispatch("selectcell", {
        deathAge1: deathAgeRange1[i],
        deathAge2: deathAgeRange2[j],
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
      Optimal Filing Date for <RecipientName r={recipients[recipientIndex]} />
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
        style="grid-column: span {deathAgeRange2.length}"
      >
        <RecipientName r={recipients[1]} apos /> Death Age
      </div>
    </div>

    <div class="grid-headers age-headers">
      <div class="empty-corner"></div>
      <div class="empty-corner"></div>
      <div
        class="age-header-container"
        style="grid-template-columns: {columnTemplate}; width: 100%;"
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
          style="grid-template-rows: {rowTemplate}"
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
        style="grid-template-columns: {columnTemplate}; grid-template-rows: {rowTemplate}; min-height: 0; display: grid;"
      >
        {#each deathAgeRange1 as deathAge1, i}
          {#each deathAgeRange2 as deathAge2, j}
            <div
              class="strategy-cell"
              class:highlighted-cell={hoveredCell &&
                hoveredCell.rowIndex === i &&
                hoveredCell.colIndex === j}
              class:highlighted-column={hoveredCell &&
                hoveredCell.colIndex === j &&
                hoveredCell.rowIndex !== i}
              class:highlighted-row={hoveredCell &&
                hoveredCell.rowIndex === i &&
                hoveredCell.colIndex !== j}
              class:selected-cell={selectedCellData &&
                selectedCellData.deathAge1 === deathAgeRange1[i] &&
                selectedCellData.deathAge2 === deathAgeRange2[j]}
              on:mouseover={() => handleMouseOver(i, j)}
              on:mouseout={handleMouseOut}
              on:focus={() => handleMouseOver(i, j)}
              on:blur={handleMouseOut}
              on:click={() => handleClick(i, j)}
              tabindex="0"
              role="gridcell"
              title="Net present value: {calculationResults[i][
                j
              ]?.totalBenefit.string() || 'N/A'}"
              style={calculationResults[i][j] &&
              minMonthsSinceEpoch !== null &&
              maxMonthsSinceEpoch !== null
                ? `background-color: ${(() => {
                    const filingAge =
                      calculationResults[i][j][
                        `filingAge${recipientIndex + 1}`
                      ];
                    const filingDate =
                      recipients[recipientIndex].birthdate.dateAtLayAge(
                        filingAge
                      );
                    return getMonthYearColor(
                      filingDate.monthsSinceEpoch(),
                      minMonthsSinceEpoch,
                      maxMonthsSinceEpoch
                    );
                  })()};`
                : ""}
            >
              <div class="filing-dates">
                {#if calculationResults[i][j]}
                  {getFilingDate(
                    recipients,
                    recipientIndex,
                    calculationResults[i][j][
                      `filingAge${recipientIndex + 1}Years`
                    ],
                    calculationResults[i][j][
                      `filingAge${recipientIndex + 1}Months`
                    ],
                    cellDimensions[i]?.[j]?.width || 0,
                    cellDimensions[i]?.[j]?.height || 0
                  )}
                {:else}
                  N/A
                {/if}
              </div>
            </div>
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

  .recipient1-matrix .matrix-title h4 {
    color: #005600;
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

  .empty-corner {
    background-color: #e9ecef;
    min-width: 2rem;
    min-height: 2rem;
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
