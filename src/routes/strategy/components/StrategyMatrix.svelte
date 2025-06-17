<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { createEventDispatcher } from "svelte";
  import {
    getFilingDate,
    createValueExtractor,
    createBorderRemovalFunctions,
  } from "../utils/StrategyCalculationUtils";

  // Props
  export let recipientIndex: number; // 0 or 1
  export let recipients: [Recipient, Recipient];
  export let deathAgeRange: number[];
  export let calculationResults: any[][];
  export let hoveredCell: { rowIndex: number; colIndex: number } | null = null;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Extractors for recipient values
  $: valueExtractor = createValueExtractor(recipients, recipientIndex + 1);
  $: borderRemovalFuncs = createBorderRemovalFunctions(
    valueExtractor,
    calculationResults
  );

  // Handle mouse events
  function handleMouseOver(i: number, j: number) {
    dispatch("hovercell", { rowIndex: i, colIndex: j });
  }

  function handleMouseOut() {
    dispatch("hovercell", null);
  }
</script>

<div class="matrix-container recipient{recipientIndex + 1}-matrix">
  <div class="matrix-title">
    <h4>
      Optimal Filing Date for <RecipientName r={recipients[recipientIndex]} />
    </h4>
  </div>
  <div class="matrix-legend">
    <p>
      <strong>Row:</strong>
      <RecipientName r={recipients[0]} /> death age
    </p>
    <p>
      <strong>Column:</strong>
      <RecipientName r={recipients[1]} /> death age
    </p>
    <p>
      <strong>Cell shows:</strong>
      <RecipientName r={recipients[recipientIndex]} />'s optimal filing date
    </p>
  </div>

  <div class="strategy-matrix">
    <table>
      <thead>
        <!-- Column recipient header -->
        <tr>
          <th></th>
          <th></th>
          <th
            colspan={deathAgeRange.length}
            class="recipient-header col-header"
          >
            <RecipientName r={recipients[1]} /> Death Age
          </th>
        </tr>
        <!-- Column age numbers -->
        <tr>
          <th></th>
          <th></th>
          {#each deathAgeRange as deathAge2, j}
            <th
              class="age-header"
              class:highlighted-column={hoveredCell &&
                hoveredCell.colIndex === j}>{deathAge2}</th
            >
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each deathAgeRange as deathAge1, i}
          <tr class:highlighted-row={hoveredCell && hoveredCell.rowIndex === i}>
            {#if i === 0}
              <th
                rowspan={deathAgeRange.length}
                class="recipient-header row-header"
              >
                <div class="header-text">
                  <RecipientName r={recipients[0]} /> Death Age
                </div>
              </th>
            {/if}
            <th
              class="age-header"
              class:highlighted-row={hoveredCell && hoveredCell.rowIndex === i}
              >{deathAge1}</th
            >
            {#each deathAgeRange as deathAge2, j}
              <td
                class="strategy-cell"
                class:no-right-border={borderRemovalFuncs.right(i, j)}
                class:no-bottom-border={borderRemovalFuncs.bottom(i, j)}
                class:no-left-border={borderRemovalFuncs.left(i, j)}
                class:no-top-border={borderRemovalFuncs.top(i, j)}
                class:highlighted-cell={hoveredCell &&
                  hoveredCell.rowIndex === i &&
                  hoveredCell.colIndex === j}
                class:highlighted-column={hoveredCell &&
                  hoveredCell.colIndex === j &&
                  hoveredCell.rowIndex !== i}
                class:highlighted-row={hoveredCell &&
                  hoveredCell.rowIndex === i &&
                  hoveredCell.colIndex !== j}
                on:mouseover={() => handleMouseOver(i, j)}
                on:mouseout={handleMouseOut}
                on:focus={() => handleMouseOver(i, j)}
                on:blur={handleMouseOut}
                tabindex="0"
                role="gridcell"
                title="Net present value: {calculationResults[i][
                  j
                ]?.totalBenefit.string() || 'N/A'}"
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
                      ]
                    )}
                  {:else}
                    N/A
                  {/if}
                </div>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
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

  .recipient0-matrix {
    background-color: #f8f9ff;
  }

  .recipient1-matrix {
    background-color: #f9fff8;
  }

  .matrix-title {
    margin-bottom: 0.5rem;
    text-align: center;
    padding: 0.5rem;
    border-radius: 4px;
  }

  .recipient0-matrix .matrix-title {
    background-color: #e6eeff;
  }

  .recipient1-matrix .matrix-title {
    background-color: #e6ffe6;
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

  .strategy-matrix {
    overflow-x: auto;
  }

  .strategy-matrix table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .strategy-matrix th,
  .strategy-matrix td {
    border: 2px solid #333;
    padding: 0.5rem;
    text-align: center;
  }

  .strategy-matrix th {
    background-color: #f8f9fa;
    font-weight: bold;
  }

  .recipient-header {
    background-color: #e9ecef !important;
    font-weight: bold;
    font-size: 0.9rem;
    padding: 0.75rem 0.5rem;
  }

  .row-header {
    writing-mode: vertical-lr;
    text-orientation: mixed;
    vertical-align: middle;
    width: 2rem;
    min-width: 2rem;
    max-width: 2rem;
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
    background-color: #e9ecef !important;
    color: #495057;
    font-weight: 600;
    font-size: 0.8rem;
  }

  .strategy-cell {
    background-color: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  /* Highlighting classes */
  tr.highlighted-row > td.highlighted-cell {
    background-color: #007bff !important;
    color: white;
  }

  tr.highlighted-row > td,
  th.highlighted-row {
    background-color: #e6f3ff !important;
  }

  .highlighted-column {
    background-color: #e6f3ff !important;
  }

  .filing-dates {
    line-height: 1.2;
  }

  /* Border removal classes for connected cells with same values */
  .strategy-cell.no-right-border {
    border-right: none !important;
  }

  .strategy-cell.no-bottom-border {
    border-bottom: none !important;
  }

  .strategy-cell.no-left-border {
    border-left: none !important;
  }

  .strategy-cell.no-top-border {
    border-top: none !important;
  }

  @media (max-width: 768px) {
    .strategy-matrix {
      font-size: 0.75rem;
    }

    .strategy-matrix th,
    .strategy-matrix td {
      padding: 0.25rem;
    }
  }
</style>
