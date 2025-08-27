<script lang="ts">
  import type { Recipient } from '$lib/recipient';

  import { MonthDate, MonthDuration } from '$lib/month-time';
  import { MonthDurationRange } from '$lib/month-duration-range';
  import { Money } from '$lib/money';
  import { strategySumCents } from '$lib/strategy/calculations/strategy-calc';
  import RecipientName from '$lib/components/RecipientName.svelte';

  // Props
  export let recipients: [Recipient, Recipient];
  export let deathAge1: MonthDuration;
  export let deathAge2: MonthDuration;
  export let discountRate: number;
  export let optimalNPV: Money;
  export let displayAsAges: boolean = false;

  // State
  interface AlternativeResult {
    filingAge1: MonthDuration;
    filingAge2: MonthDuration;
    npv: Money;
    percentOfOptimal: number;
  }

  let alternativeResults: AlternativeResult[][] = [];
  let filingAgeRange1: MonthDurationRange;
  let filingAgeRange2: MonthDurationRange;
  let isCalculating: boolean = false;
  const currentDate: MonthDate = MonthDate.initFromNow();

  // Hover state tracking
  let hoveredRowIndex: number = -1;
  let hoveredColIndex: number = -1;
  let hoveredResult: AlternativeResult | null = null;

  // Pin state tracking
  let isPinned: boolean = false;
  let pinnedRowIndex: number = -1;
  let pinnedColIndex: number = -1;
  let pinnedResult: AlternativeResult | null = null;

  /**
   * Creates a filing age range for a given recipient.
   *
   * This function calculates the earliest and latest possible filing ages
   * for a recipient. The earliest is typically 62+0 or 62+1 based on birth day,
   * clipped to exclude any ages in the past. The latest is the minimum of
   * age 70+0 or the recipient's death age.
   *
   * @param recipient - The recipient for whom to generate filing age ranges
   * @param deathAge - The age at which the recipient dies
   * @returns A MonthDurationRange representing possible filing ages
   */
  function createFilingAgeRange(
    recipient: Recipient,
    deathAge: MonthDuration
  ): MonthDurationRange {
    const currentAge = recipient.birthdate.ageAtSsaDate(currentDate);

    // Get the earliest filing age for this recipient
    const earliestFiling = recipient.birthdate.earliestFilingMonth();

    // Start from the maximum of earliest filing age or current age
    const startingAge = currentAge.greaterThan(earliestFiling)
      ? currentAge
      : earliestFiling;

    // End at the minimum of age 70 or death age
    const maxAge70 = MonthDuration.initFromYearsMonths({
      years: 70,
      months: 0,
    });
    const end = maxAge70.lessThan(deathAge) ? maxAge70 : deathAge;

    return new MonthDurationRange(startingAge, end);
  }

  /**
   * Creates year-based header objects that span across multiple months.
   *
   * Takes an array of MonthDuration objects and groups them by year,
   * calculating how many months each year spans. This is used to create column
   * and row headers that show only the year (e.g., "62", "63") but span across
   * all the months within that year in the grid.
   *
   * @param {MonthDuration[]} ageRange - Array of MonthDuration objects
   * @returns {Array<{year: number, colspan: number}>} Array of header objects
   * where each object contains the year to display and the number of months it
   * spans
   */
  function generateYearHeaders(
    ageRange: MonthDuration[]
  ): Array<{ year: number; colspan: number }> {
    const yearHeaders = [];
    let currentYear = null;
    let monthCount = 0;

    for (const duration of ageRange) {
      const years = duration.years();
      if (years !== currentYear) {
        if (currentYear !== null && monthCount > 0) {
          yearHeaders.push({
            year: currentYear,
            colspan: monthCount,
          });
        }
        currentYear = years;
        monthCount = 1;
      } else {
        monthCount++;
      }
    }

    // Add the last year
    if (currentYear !== null && monthCount > 0) {
      yearHeaders.push({
        year: currentYear,
        colspan: monthCount,
      });
    }

    return yearHeaders;
  }

  /**
   * Creates date-based header objects that span across multiple months within a year.
   *
   * Takes an array of MonthDuration objects and groups them by calendar year,
   * calculating how many months each year spans. This is used to create column
   * and row headers that show calendar years (e.g., "2028", "2029") instead of ages.
   *
   * @param {MonthDuration[]} ageRange - Array of MonthDuration objects
   * @param {Recipient} recipient - The recipient to calculate filing dates for
   * @returns {Array<{year: number, colspan: number}>} Array of header objects
   * where each object contains the calendar year to display and the number of months it spans
   */
  function generateDateHeaders(
    ageRange: MonthDuration[],
    recipient: Recipient
  ): Array<{ year: number; colspan: number }> {
    const dateHeaders = [];
    let currentYear = null;
    let monthCount = 0;

    for (const duration of ageRange) {
      // Convert age to actual filing date
      const filingDate = recipient.birthdate.dateAtLayAge(duration);
      const calendarYear = filingDate.year();

      if (calendarYear !== currentYear) {
        if (currentYear !== null && monthCount > 0) {
          dateHeaders.push({
            year: currentYear,
            colspan: monthCount,
          });
        }
        currentYear = calendarYear;
        monthCount = 1;
      } else {
        monthCount++;
      }
    }

    // Add the last year
    if (currentYear !== null && monthCount > 0) {
      dateHeaders.push({
        year: currentYear,
        colspan: monthCount,
      });
    }

    return dateHeaders;
  }

  // Calculate alternative strategies when inputs change (inputs always defined)
  $: calculateAlternativeStrategies();

  /**
   * Calculates NPV for all possible filing strategy combinations.
   *
   * This is the main calculation function that generates a comprehensive matrix
   * of net present values for every possible monthly filing age combination
   * between the two recipients. The calculation respects each recipient's
   * earliest eligible filing age and current age constraints.
   *
   * The function runs asynchronously with periodic yielding to prevent UI
   * blocking during large calculations (potentially 100x100 = 10,000
   * combinations).
   *
   * Updates the component state with:
   * - alternativeResults: 2D array of NPV results and metadata
   * - isCalculating: Loading state flag
   * - filingAgeRange1/filingAgeRange2: The ranges of filing ages for each
   *     recipient
   */
  async function calculateAlternativeStrategies(): Promise<void> {
    if (isCalculating) return;

    isCalculating = true;

    try {
      // Generate age ranges
      filingAgeRange1 = createFilingAgeRange(recipients[0], deathAge1);
      filingAgeRange2 = createFilingAgeRange(recipients[1], deathAge2);

      // Calculate final dates for the death ages
      const finalDates: [MonthDate, MonthDate] = [
        recipients[0].birthdate.dateAtLayAge(deathAge1),
        recipients[1].birthdate.dateAtLayAge(deathAge2),
      ];

      // Initialize results matrix
      alternativeResults = Array(filingAgeRange1.getLength())
        .fill(null)
        .map(() => Array(filingAgeRange2.getLength()).fill(null));

      // Calculate NPV for each filing strategy combination (monthly precision)
      for (let i = 0; i < filingAgeRange1.getLength(); i++) {
        for (let j = 0; j < filingAgeRange2.getLength(); j++) {
          const strategy1 = filingAgeRange1.indexToMonthDuration(i);
          const strategy2 = filingAgeRange2.indexToMonthDuration(j);

          // Calculate NPV for this strategy
          const npvCents = strategySumCents(
            recipients,
            finalDates,
            currentDate,
            discountRate,
            [strategy1, strategy2]
          );
          const npv = Money.fromCents(npvCents);

          // Calculate percentage of optimal
          const percentOfOptimal = npv.div$(optimalNPV) * 100;

          alternativeResults[i][j] = {
            filingAge1: strategy1,
            filingAge2: strategy2,
            npv: npv,
            percentOfOptimal,
          };
        }

        // Allow UI to update periodically
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } catch (error) {
      console.error('Error calculating alternative strategies:', error);
    } finally {
      isCalculating = false;
    }
  }

  // Get color for NPV value based on percentage of optimal
  /**
   * Determines the background color for a grid cell based on NPV performance.
   *
   * Uses a color scale to visually represent how close each filing strategy
   * combination comes to the optimal NPV. Includes special handling for
   * strategies that exactly match the optimal NPV.
   *
   * Color scale:
   * - Dark green (rgb(0, 100, 0)): Exact optimal match (100%)
   * - Green (rgb(34, 139, 34)): 95-100% of optimal
   * - Yellow-green (rgb(154, 205, 50)): 90-95% of optimal
   * - Gold (rgb(255, 215, 0)): 85-90% of optimal
   * - Orange (rgb(255, 165, 0)): 80-85% of optimal
   * - Red (rgb(220, 20, 60)): <80% of optimal
   *
   * @param {number} percentOfOptimal - The NPV as a percentage of the optimal NPV
   * @param {Money} npv - The actual NPV value as a Money object
   * @param {Money} optimalNPV - The optimal NPV value as a Money object for exact comparison
   * @returns {string} RGB color string for use in CSS background-color
   */
  function getColor(
    percentOfOptimal: number,
    npv: Money,
    optimalNPV: Money
  ): string {
    // Special color for exact 100% match (same NPV as optimal), Dark green
    if (npv.equals(optimalNPV)) return 'rgb(0, 100, 0)';

    // Color scale from red (bad) to green (optimal)
    if (percentOfOptimal >= 95) return 'rgb(34, 139, 34)'; // Green
    if (percentOfOptimal >= 90) return 'rgb(154, 205, 50)'; // Yellow-green
    if (percentOfOptimal >= 85) return 'rgb(255, 215, 0)'; // Gold
    if (percentOfOptimal >= 80) return 'rgb(255, 165, 0)'; // Orange
    return 'rgb(220, 20, 60)'; // Red
  }

  /**
   * Handles mouse enter events on data cells to update hover state.
   */
  function handleCellMouseEnter(
    i: number,
    j: number,
    result: AlternativeResult
  ): void {
    if (!isPinned) {
      hoveredRowIndex = i;
      hoveredColIndex = j;
      hoveredResult = result;
    }
  }

  /**
   * Handles mouse leave events on the grid to clear hover state.
   */
  function handleGridMouseLeave(): void {
    if (!isPinned) {
      hoveredRowIndex = -1;
      hoveredColIndex = -1;
      hoveredResult = null;
    }
  }

  /**
   * Handles keydown events on data cells for accessibility.
   * Responds to Enter and Space keys to trigger cell click.
   */
  function handleCellKeydown(
    event: KeyboardEvent,
    i: number,
    j: number,
    result: AlternativeResult
  ): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCellClick(i, j, result);
    }
  }

  /**
   * Handles click events on data cells to toggle pin state.
   */
  function handleCellClick(
    i: number,
    j: number,
    result: AlternativeResult
  ): void {
    if (isPinned) {
      // If currently pinned, any click unpins
      isPinned = false;
      pinnedRowIndex = -1;
      pinnedColIndex = -1;
      pinnedResult = null;
      // Set hover state to clicked cell
      hoveredRowIndex = i;
      hoveredColIndex = j;
      hoveredResult = result;
    } else {
      // If not pinned, pin to this cell
      isPinned = true;
      pinnedRowIndex = i;
      pinnedColIndex = j;
      pinnedResult = result;
      // Clear hover state when pinned
      hoveredRowIndex = -1;
      hoveredColIndex = -1;
      hoveredResult = null;
    }
  }

  // Reactive statement to determine which cell should be highlighted and which result to show
  $: displayedRowIndex = isPinned ? pinnedRowIndex : hoveredRowIndex;
  $: displayedColIndex = isPinned ? pinnedColIndex : hoveredColIndex;
  $: displayedResult = isPinned ? pinnedResult : hoveredResult;

  /**
   * Formats a MonthDuration as either a readable age string or filing date.
   * Converts "62+1" format to "Age 62 and 1 month" format for ages,
   * or to filing date format for dates based on displayAsAges toggle.
   */
  function formatAge(
    duration: MonthDuration,
    recipientIndex: number = 0
  ): string {
    if (displayAsAges) {
      const years = duration.years();
      const months = duration.modMonths();

      if (months === 0) {
        return `Age ${years}`;
      } else if (months === 1) {
        return `Age ${years} and 1 month`;
      } else {
        return `Age ${years} and ${months} months`;
      }
    } else {
      // Display as filing date
      const filingDate =
        recipients[recipientIndex].birthdate.dateAtLayAge(duration);
      return `${filingDate.monthName()} ${filingDate.year()}`;
    }
  }
</script>

<div class="alternative-strategies-container">
  <p>
    This grid shows the net present value for all possible filing {displayAsAges
      ? 'age'
      : 'date'} combinations for the selected death ages (<RecipientName
      r={recipients[0]}
    />: {deathAge1}, <RecipientName r={recipients[1]} />: {deathAge2}). Values
    are color-coded relative to the optimal strategy.
  </p>

  {#if isCalculating}
    <div class="loading">
      <p>Calculating alternative strategies...</p>
    </div>
  {:else if alternativeResults.length > 0}
    {@const filingAgeRange1Array = filingAgeRange1.toArray()}
    {@const filingAgeRange2Array = filingAgeRange2.toArray()}
    {@const yearHeaders1 = displayAsAges
      ? generateYearHeaders(filingAgeRange1Array)
      : generateDateHeaders(filingAgeRange1Array, recipients[0])}
    {@const yearHeaders2 = displayAsAges
      ? generateYearHeaders(filingAgeRange2Array)
      : generateDateHeaders(filingAgeRange2Array, recipients[1])}
    {@const range1Length = filingAgeRange1.getLength()}
    {@const range2Length = filingAgeRange2.getLength()}

    <!-- Info Panel -->
    <div class="info-panel">
      <h4>Cell Details {isPinned ? '(Pinned - click cell to unpin)' : ''}</h4>
      {#if displayedResult}
        <div class="info-content">
          <div class="info-row">
            <span class="info-label"><RecipientName r={recipients[0]} />:</span>
            <span class="info-value"
              >{formatAge(displayedResult.filingAge1, 0)}</span
            >
          </div>
          <div class="info-row">
            <span class="info-label"><RecipientName r={recipients[1]} />:</span>
            <span class="info-value"
              >{formatAge(displayedResult.filingAge2, 1)}</span
            >
          </div>
          <div class="info-row">
            <span class="info-label"
              ><abbr title="Net Present Value">NPV</abbr>:</span
            >
            <span class="info-value"
              >{displayedResult.npv.wholeDollars()} ({displayedResult.percentOfOptimal.toFixed(
                1
              )}% of optimal)</span
            >
          </div>
        </div>
      {:else}
        <div class="info-content">
          <p class="info-hint">
            Hover over a cell to see filing strategy details{isPinned
              ? ''
              : ', or click to pin'}
          </p>
        </div>
      {/if}
    </div>

    <div
      class="grid-wrapper"
      style:grid-template-columns="20px 25px repeat({range2Length}, 8px)"
      style:grid-template-rows="20px 20px repeat({range1Length}, 8px)"
      on:mouseleave={handleGridMouseLeave}
      role="grid"
      tabindex="0"
    >
      <!-- Top-left corner cells -->
      <div class="corner-cell" style:grid-column="1" style:grid-row="1"></div>
      <div class="corner-cell" style:grid-column="2" style:grid-row="1"></div>
      <div class="corner-cell" style:grid-column="1" style:grid-row="2"></div>
      <div class="corner-cell" style:grid-column="2" style:grid-row="2"></div>

      <!-- Recipient name headers -->
      <div
        class="recipient-header recipient-header-column"
        style:grid-column="3 / {range2Length + 3}"
        style:grid-row="1"
      >
        <RecipientName r={recipients[1]} apos />&nbsp;Filing {displayAsAges
          ? 'Age'
          : 'Date'}
      </div>
      <div
        class="recipient-header recipient-header-row"
        style:grid-column="1"
        style:grid-row="3 / {range1Length + 3}"
      >
        <span class="recipient-text"
          ><RecipientName r={recipients[0]} apos /> Filing {displayAsAges
            ? 'Age'
            : 'Date'}</span
        >
      </div>

      <!-- Column headers (Recipient 2 ages) - spanning headers -->
      {#each yearHeaders2 as yearHeader, headerIndex}
        {@const colOffset = 3}
        {@const startCol =
          colOffset +
          (headerIndex > 0
            ? yearHeaders2
                .slice(0, headerIndex)
                .reduce((sum, h) => sum + h.colspan, 0)
            : 0)}
        {@const endCol = startCol + yearHeader.colspan}
        {@const isHighlighted =
          displayedColIndex >= 0 &&
          displayedColIndex >= startCol - colOffset &&
          displayedColIndex < endCol - colOffset}
        <div
          class="column-header-cell {isHighlighted ? 'highlighted' : ''}"
          style:grid-column="{startCol} / {endCol}"
          style:grid-row="2"
        >
          {#if displayAsAges ? yearHeader.colspan >= 2 : yearHeader.colspan >= 4}
            {yearHeader.year}
          {/if}
        </div>
      {/each}

      <!-- Row headers (Recipient 1 ages) - spanning headers -->
      {#each yearHeaders1 as yearHeader, headerIndex}
        {@const rowOffset = 3}
        {@const startRow =
          rowOffset +
          (headerIndex > 0
            ? yearHeaders1
                .slice(0, headerIndex)
                .reduce((sum, h) => sum + h.colspan, 0)
            : 0)}
        {@const endRow = startRow + yearHeader.colspan}
        {@const isHighlighted =
          displayedRowIndex >= 0 &&
          displayedRowIndex >= startRow - rowOffset &&
          displayedRowIndex < endRow - rowOffset}
        <div
          class="row-header-cell {isHighlighted ? 'highlighted' : ''}"
          style:grid-column="2"
          style:grid-row="{startRow} / {endRow}"
        >
          {#if displayAsAges ? yearHeader.colspan >= 2 : yearHeader.colspan >= 4}
            <span class="year-text">{yearHeader.year}</span>
          {/if}
        </div>
      {/each}

      <!-- Data cells -->
      {#each Array(range1Length) as _, i}
        {#each Array(range2Length) as _, j}
          {@const result = alternativeResults[i][j]}
          {@const isHovered =
            displayedRowIndex === i && displayedColIndex === j}
          {@const isPinnedCell =
            isPinned && pinnedRowIndex === i && pinnedColIndex === j}
          <div
            class="data-cell {isHovered ? 'hovered' : ''} {isPinnedCell
              ? 'pinned'
              : ''}"
            style:grid-column={j + 3}
            style:grid-row={i + 3}
            style:background-color={getColor(
              result.percentOfOptimal,
              result.npv,
              optimalNPV
            )}
            on:mouseenter={() => handleCellMouseEnter(i, j, result)}
            on:click={() => handleCellClick(i, j, result)}
            on:keydown={(event) => handleCellKeydown(event, i, j, result)}
            role="gridcell"
            tabindex="0"
          ></div>
        {/each}
      {/each}
    </div>

    <!-- Legend -->
    <div class="legend">
      <h4>Legend</h4>
      <div class="legend-items">
        <div class="legend-item">
          <div
            class="legend-color"
            style:background-color="rgb(0, 100, 0)"
          ></div>
          <span>Exact optimal match (100%)</span>
        </div>
        <div class="legend-item">
          <div
            class="legend-color"
            style:background-color="rgb(34, 139, 34)"
          ></div>
          <span>95-100% of optimal</span>
        </div>
        <div class="legend-item">
          <div
            class="legend-color"
            style:background-color="rgb(154, 205, 50)"
          ></div>
          <span>90-95% of optimal</span>
        </div>
        <div class="legend-item">
          <div
            class="legend-color"
            style:background-color="rgb(255, 215, 0)"
          ></div>
          <span>85-90% of optimal</span>
        </div>
        <div class="legend-item">
          <div
            class="legend-color"
            style:background-color="rgb(255, 165, 0)"
          ></div>
          <span>80-85% of optimal</span>
        </div>
        <div class="legend-item">
          <div
            class="legend-color"
            style:background-color="rgb(220, 20, 60)"
          ></div>
          <span>&lt;80% of optimal</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .alternative-strategies-container {
    padding: 1.5rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    font-style: italic;
    color: #666;
  }

  .info-panel {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
    min-height: 120px;
  }

  .info-panel h4 {
    margin: 0 0 0.75rem 0;
    color: #0056b3;
    font-size: 0.9rem;
  }

  .info-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 88px; /* Consistent height to prevent jumping */
  }

  .info-row {
    display: grid;
    grid-template-columns: minmax(120px, max-content) 1fr;
    gap: 1rem;
    align-items: center;
  }

  .info-label {
    font-weight: 500;
    color: #333;
    text-align: right;
    white-space: nowrap;
  }

  .info-value {
    font-weight: bold;
    color: #0056b3;
    text-align: left;
  }

  .info-hint {
    color: #666;
    font-style: italic;
    margin: 0;
    text-align: center;
    padding: 1rem 0;
  }

  /* Style the abbreviation */
  abbr {
    text-decoration: underline dotted;
    cursor: help;
  }

  .grid-wrapper {
    display: grid;
    overflow: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-top: 1rem;
    cursor: crosshair;
  }

  .corner-cell {
    background-color: #e0e0e0;
  }

  .column-header-cell {
    background-color: #f0f0f0;
    border-right: 1px solid #ddd;
    border-bottom: 1px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.7rem;
    transition: background-color 0.2s ease;
  }

  .column-header-cell.highlighted {
    background-color: #558855;
    color: white;
    font-weight: bold;
  }

  .row-header-cell {
    background-color: #f0f0f0;
    border-right: 1px solid #ccc;
    border-bottom: 1px solid #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.7rem;
    transition: background-color 0.2s ease;
  }

  .row-header-cell.highlighted {
    background-color: #dd6600;
    color: white;
    font-weight: bold;
  }

  .recipient-header {
    background-color: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.8rem;
    color: #333;
  }

  .recipient-header-row {
    /* Row header spans vertically */
    writing-mode: vertical-rl;
    text-orientation: mixed;
  }

  .recipient-text {
    transform: rotate(180deg);
    white-space: nowrap;
  }

  .data-cell {
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    cursor: crosshair;
    box-sizing: border-box;
    transition: all 0.1s ease;
  }

  .data-cell.hovered {
    border: 3px solid #ffffff !important;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
    z-index: 10;
    position: relative;
    transform: scale(1.1);
  }

  .data-cell.pinned {
    border: 3px solid #ffd700 !important;
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
    z-index: 15;
    position: relative;
    transform: scale(1.15);
  }

  .year-text {
    transform: rotate(-90deg);
    white-space: nowrap;
  }

  .legend {
    margin-top: 1rem;
  }

  .legend h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .legend-color {
    width: 20px;
    height: 15px;
    border: 1px solid #ccc;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    .alternative-strategies-container {
      padding: 1rem;
    }

    .legend-items {
      flex-direction: column;
      gap: 0.5rem;
    }

    .grid-wrapper {
      grid-template-columns: 15px 20px repeat(var(--grid-cols, 100), 6px);
      grid-template-rows: 15px 15px repeat(var(--grid-rows, 100), 6px);
    }

    .corner-cell {
      font-size: 0.4rem;
    }

    .column-header-cell {
      font-size: 0.6rem;
    }

    .row-header-cell {
      font-size: 0.6rem;
    }

    .recipient-header {
      font-size: 0.7rem;
    }
  }
</style>
