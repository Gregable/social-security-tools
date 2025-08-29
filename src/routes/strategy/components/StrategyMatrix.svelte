<script lang="ts">
  import type { Recipient } from '$lib/recipient';
  import RecipientName from '$lib/components/RecipientName.svelte';
  import StrategyCell from './StrategyCell.svelte';
  import { MonthDuration } from '$lib/month-time';
  import type { Money } from '$lib/money';
  import type { DeathAgeBucket } from '$lib/strategy/ui';
  import type { CalculationResults } from '$lib/strategy/ui';
  import { createBorderRemovalFunctions } from '$lib/strategy/ui';
  import { getMonthYearColor } from '$lib/strategy/ui';

  // Props
  export let recipientIndex: number;
  export let recipients: [Recipient, Recipient];
  export let displayAsAges: boolean = false;
  export let calculationResults: CalculationResults;
  export let deathProbDistribution1: { age: number; probability: number }[];
  export let deathProbDistribution2: { age: number; probability: number }[];
  export let hoveredCell: { rowIndex: number; colIndex: number } | null = null;

  // Callback props for events
  export let onhovercell:
    | ((detail: { rowIndex: number; colIndex: number } | null) => void)
    | undefined = undefined;
  export let onselectcell: ((detail: any) => void) | undefined = undefined;

  // Matrix width tracking
  let matrixWidth: number = 0;

  // Header hover overlay state
  let headerHoverInfo: {
    type: 'row' | 'column';
    index: number;
    bucket: DeathAgeBucket;
    recipient: Recipient;
    distribution: { age: number; probability: number }[];
    x: number;
    y: number;
  } | null = null;

  // Fixed height constant (matches CSS)
  const MATRIX_HEIGHT = 900;

  // Removed unused _getCellDimensions helper (probability-based sizing now handled via reactive cellDimensions)

  // Create normalized value extractor that compares actual dates, not display strings
  function createNormalizedValueExtractor(recipientIndex: number) {
    return (calculationResult: StrategyResultCell): string => {
      // Get the filing age and convert to a normalized date string
      const filingAgeYears =
        calculationResult[`filingAge${recipientIndex + 1}Years`];
      const filingAgeMonths =
        calculationResult[`filingAge${recipientIndex + 1}Months`];

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
    calculationResults.to2D()
  );

  // We derive the actual 3-year (or final open-ended) death-age buckets from
  // the first cell in each row/column. Every cell in a row shares the same
  // bucket1; every cell in a column shares the same bucket2, so sampling once
  // is enough.
  $: rowBuckets = calculationResults.rowBuckets();
  $: colBuckets = calculationResults.colBuckets();

  /**
   * Convert a list of buckets into a CSS grid-template string and parallel
   * percentage list. We:
   *  1. Recompute each bucket's probability mass from the current distribution
   *  2. Normalize masses to fractions summing to 1.
   *  3. Round intermediate fractions (4 decimals) to balance precision & UI
   *     noise.
   *  4. Force the final column/row to make the total exactly 100%.
   * Returned template example: "12.34% 7.89% 79.77%".
   */
  function buildTemplateFromBuckets(
    buckets: DeathAgeBucket[],
    distribution: { age: number; probability: number }[]
  ): { template: string; percentages: number[] } {
    // Compute raw probability mass per bucket (summing appropriate age span)
    const masses = buckets.map((b) => bucketProbability(b, distribution));
    const total = masses.reduce((s, v) => s + v, 0) || 1;
    // Convert to percentages (fractions sum to 1) then format.

    const fractions = masses.map((m) => m / total);
    const percentages: number[] = [];
    let sum = 0;
    for (let i = 0; i < fractions.length; i++) {
      if (i === fractions.length - 1) {
        // Adjust last to force 100%
        const remaining = 1 - sum;
        percentages.push(remaining);
      } else {
        const rounded = parseFloat(fractions[i].toFixed(4));
        percentages.push(rounded);
        sum += rounded;
      }
    }
    // Format into a CSS grid template. We recompute last segment to ensure
    // exact 100% at two-decimal precision (important so cumulative rounding
    // doesn't leave stray pixels or wrap).
    const template = percentages
      .map((p, i) => {
        if (i === percentages.length - 1) {
          // Ensure exact 100 with 2 decimals
          const used = percentages.slice(0, -1).reduce((s, v) => s + v, 0);
          const lastPct = 100 - parseFloat((used * 100).toFixed(2));
          return `${lastPct.toFixed(2)}%`;
        }
        return `${(p * 100).toFixed(2)}%`;
      })
      .join(' ');
    return { template, percentages };
  }

  // Build row & column templates reactively; rowPercentages / columnPercentages
  // align one-to-one with rowBuckets / colBuckets so downstream sizing math is
  // straightforward.
  $: ({ template: rowTemplate, percentages: rowPercentages } =
    buildTemplateFromBuckets(rowBuckets, deathProbDistribution1));
  $: ({ template: columnTemplate, percentages: columnPercentages } =
    buildTemplateFromBuckets(colBuckets, deathProbDistribution2));

  function bucketProbability(
    bucket: DeathAgeBucket,
    distribution: { age: number; probability: number }[]
  ): number {
    if (!bucket) return 0;
    const start = bucket.startAge;
    const end = bucket.endAgeInclusive; // null means open ended
    if (end === null) {
      return distribution
        .filter((d) => d.age >= start)
        .reduce((s, d) => s + d.probability, 0);
    }
    return distribution
      .filter((d) => d.age >= start && d.age <= end)
      .reduce((s, d) => s + d.probability, 0);
  }

  // Build accessible, consistently formatted title / tooltip text for a bucket header.
  function bucketHeaderTitle(
    bucket: DeathAgeBucket,
    distribution: { age: number; probability: number }[],
    recipient: Recipient
  ): string {
    const p = bucketProbability(bucket, distribution);
    const rangeText =
      bucket.endAgeInclusive !== null
        ? `${bucket.startAge} - ${bucket.endAgeInclusive}`
        : `${bucket.startAge}+`;
    // Expected modeled fractional age
    const expected = bucket.expectedAge; // MonthDuration
    const expYearsInt = expected.years();
    const expRemMonths = expected.modMonths();
    const expectedAgeStr = `${expYearsInt}y${expRemMonths ? ' ' + expRemMonths + 'm' : ''}`;
    // Compute calendar MonthDate for modeled death (lay age)
    const birth = recipient.birthdate;
    const deathDate = birth.dateAtLayAge(expected);
    return `Ages ${rangeText} prob mass ${(p * 100).toFixed(2)}% | Modeled at ${expectedAgeStr} (${deathDate.monthName()} ${deathDate.year()}) | Optimal filing shown for death age ${bucket.label}`;
  }
  interface StrategyResultCell {
    deathAge1: string | number;
    deathAge2: string | number;
    filingAge1: any;
    filingAge2: any;
    totalBenefit: Money;
    filingAge1Years: number;
    filingAge1Months: number;
    filingAge2Years: number;
    filingAge2Months: number;
    bucket1: DeathAgeBucket;
    bucket2: DeathAgeBucket;
    error?: any;
    [key: string]: any; // tolerate additional fields from upstream
  }

  // Create reactive cell dimensions matrix that updates when matrixWidth changes
  // Precompute pixel dimensions for each cell (used for adaptive label / date
  // formatting downstream). We multiply the container width by the column's
  // percentage and a fixed MATRIX_HEIGHT by the row's percentage to get the
  // actual rectangular size that visually encodes probability mass.
  $: cellDimensions = rowBuckets.map((_, i) =>
    colBuckets.map((_, j) => ({
      width: matrixWidth * (columnPercentages[j] || 0),
      height: MATRIX_HEIGHT * (rowPercentages[i] || 0),
    }))
  );

  // Calculate cell styles including background color and border removal
  function getCellStyle(i: number, j: number): string {
    let style = '';

    // Add background color based on filing date
    const cell = calculationResults.get(i, j);
    if (cell) {
      const filingAge: MonthDuration = cell[`filingAge${recipientIndex + 1}`];
      const backgroundColor = getMonthYearColor(
        filingAge.asMonths(),
        MonthDuration.initFromYearsMonths({
          years: 62,
          months: 0,
        }).asMonths(),
        MonthDuration.initFromYearsMonths({
          years: 70,
          months: 0,
        }).asMonths()
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

  // Handle header hover events
  function handleHeaderHover(
    event: MouseEvent,
    type: 'row' | 'column',
    index: number,
    bucket: DeathAgeBucket,
    recipient: Recipient,
    distribution: { age: number; probability: number }[]
  ) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    headerHoverInfo = {
      type,
      index,
      bucket,
      recipient,
      distribution,
      x: event.clientX,
      y: event.clientY,
    };
  }

  function handleHeaderHoverOut() {
    headerHoverInfo = null;
  }

  function handleCellSelect(event) {
    const { rowIndex, colIndex } = event.detail;
    const result = calculationResults.get(
      rowIndex,
      colIndex
    ) as StrategyResultCell;
    const bucket1 = rowBuckets[rowIndex];
    const bucket2 = colBuckets[colIndex];
    if (!result || !bucket1 || !bucket2) return;

    // Set selection on the shared CalculationResults state
    calculationResults.setSelectedCell(rowIndex, colIndex);

    const filingAge1 = result.filingAge1;
    const filingDate1 = recipients[0].birthdate.dateAtLayAge(filingAge1);
    const filingAge2 = result.filingAge2;
    const filingDate2 = recipients[1].birthdate.dateAtLayAge(filingAge2);

    // Emit a normalized details payload for external consumers (e.g., details panel)
    onselectcell?.({
      deathAge1: bucket1.label,
      deathAge2: bucket2.label,
      filingAge1Years: result.filingAge1Years,
      filingAge1Months: result.filingAge1Months,
      filingDate1,
      filingAge2Years: result.filingAge2Years,
      filingAge2Months: result.filingAge2Months,
      filingDate2,
      netPresentValue: result.totalBenefit,
    });
  }
</script>

<div class="matrix-container recipient-matrix">
  <div class="matrix-title">
    <h4>
      Optimal Filing {displayAsAges ? 'Age' : 'Date'} for <RecipientName
        r={recipients[recipientIndex]}
      />
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
        style:grid-column="span {colBuckets.length}"
      >
        <RecipientName r={recipients[1]} apos /> Death Age
      </div>
    </div>

    <div class="grid-headers age-headers">
      <div class="empty-corner"></div>
      <div class="empty-corner"></div>
      <div
        class="age-header-container"
        style:grid-template-columns={columnTemplate}
        style:width="100%"
      >
        {#each colBuckets as colBucket, j}
          <div
            class="age-header"
            class:highlighted-column={hoveredCell && hoveredCell.colIndex === j}
            on:mouseenter={(e) =>
              handleHeaderHover(
                e,
                'column',
                j,
                colBucket,
                recipients[1],
                deathProbDistribution2
              )}
            on:mouseleave={handleHeaderHoverOut}
            role="columnheader"
            tabindex="0"
          >
            {colBucket?.label || ''}
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
          style:grid-template-rows={rowTemplate}
        >
          {#each rowBuckets as rowBucket, i}
            <div
              class="age-header"
              class:highlighted-row={hoveredCell && hoveredCell.rowIndex === i}
              on:mouseenter={(e) =>
                handleHeaderHover(
                  e,
                  'row',
                  i,
                  rowBucket,
                  recipients[0],
                  deathProbDistribution1
                )}
              on:mouseleave={handleHeaderHoverOut}
              role="rowheader"
              tabindex="0"
            >
              {rowBucket?.label || ''}
            </div>
          {/each}
        </div>
      </div>

      <!-- Grid cells -->
      <div
        class="strategy-grid"
        bind:clientWidth={matrixWidth}
        style:grid-template-columns={columnTemplate}
        style:grid-template-rows={rowTemplate}
        style:display="grid"
        style:min-height="0"
      >
        {#each rowBuckets as _row, i}
          {#each colBuckets as _col, j}
            <StrategyCell
              rowIndex={i}
              colIndex={j}
              calculationResult={calculationResults.get(i, j)}
              {displayAsAges}
              {recipients}
              {recipientIndex}
              {hoveredCell}
              isSelected={calculationResults.isSelected(i, j)}
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

  <!-- Header hover overlay -->
  {#if headerHoverInfo}
    <div
      class="header-hover-overlay"
      style:left="{headerHoverInfo.x + 10}px"
      style:top="{headerHoverInfo.y - 10}px"
    >
      <div class="overlay-header">
        <RecipientName r={headerHoverInfo.recipient} apos /> Death Age: {headerHoverInfo
          .bucket?.label || ''}
      </div>
      <div class="overlay-content">
        <div class="overlay-section">
          <strong>Age Range:</strong>
          {#if headerHoverInfo.bucket?.endAgeInclusive !== null}
            {headerHoverInfo.bucket?.startAge}y
            <span class="age-range-dash">—</span>
            {headerHoverInfo.bucket?.endAgeInclusive}y + 11m
          {:else}
            {headerHoverInfo.bucket?.startAge}+
          {/if}
        </div>
        <div class="overlay-section">
          <strong>Probability:</strong>
          {(
            bucketProbability(
              headerHoverInfo.bucket,
              headerHoverInfo.distribution
            ) * 100
          ).toFixed(2)}%
        </div>
        <div class="overlay-section">
          <strong>Modeled Age:</strong>
          {(() => {
            const expected = headerHoverInfo.bucket?.expectedAge;
            const expYearsInt = expected?.years() || 0;
            const expRemMonths = expected?.modMonths() || 0;
            return `${expYearsInt}y${expRemMonths ? ' ' + expRemMonths + 'm' : ''}`;
          })()}
        </div>
      </div>
    </div>
  {/if}
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

  /* Header hover overlay styles */
  .header-hover-overlay {
    position: fixed;
    z-index: 1000;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 0;
    max-width: 320px;
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

  .age-range-dash {
    color: #bbb;
    font-weight: normal;
  }
</style>
