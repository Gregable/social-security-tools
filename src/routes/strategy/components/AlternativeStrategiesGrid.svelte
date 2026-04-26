<script lang="ts">
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { Money } from "$lib/money";
  import { MonthDurationRange } from "$lib/month-duration-range";
  import { MonthDate, MonthDuration } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import { strategySumCentsCouple } from "$lib/strategy/calculations/strategy-calc";

  export let recipients: [Recipient, Recipient];
  export let deathAge1: MonthDuration;
  export let deathAge2: MonthDuration;
  export let discountRate: number;
  export let optimalNPV: Money;
  export let optimalFilingAges: [MonthDuration, MonthDuration];
  export let displayAsAges: boolean = false;

  interface AlternativeResult {
    filingAge1: MonthDuration;
    filingAge2: MonthDuration;
    npv: Money;
    delta: Money;
    percentOfOptimal: number;
  }

  let alternativeResults: AlternativeResult[][] = [];
  let filingAgeRange1: MonthDurationRange;
  let filingAgeRange2: MonthDurationRange;
  let isCalculating: boolean = false;
  const currentDate: MonthDate = MonthDate.initFromNow();

  let hoveredRowIndex: number = -1;
  let hoveredColIndex: number = -1;
  let hoveredResult: AlternativeResult | null = null;

  let isPinned: boolean = false;
  let pinnedRowIndex: number = -1;
  let pinnedColIndex: number = -1;
  let pinnedResult: AlternativeResult | null = null;

  function createFilingAgeRange(
    recipient: Recipient,
    deathAge: MonthDuration
  ): MonthDurationRange {
    const currentAge = recipient.birthdate.ageAtSsaDate(currentDate);
    const earliestFiling = recipient.birthdate.earliestFilingMonth();
    const startingAge = currentAge.greaterThan(earliestFiling)
      ? currentAge
      : earliestFiling;
    const maxAge70 = MonthDuration.initFromYearsMonths({
      years: 70,
      months: 0,
    });
    const end = maxAge70.lessThan(deathAge) ? maxAge70 : deathAge;
    return new MonthDurationRange(startingAge, end);
  }

  function generateYearHeaders(
    ageRange: MonthDuration[]
  ): Array<{ year: number; colspan: number }> {
    const yearHeaders: Array<{ year: number; colspan: number }> = [];
    let currentYear: number | null = null;
    let monthCount = 0;

    for (const duration of ageRange) {
      const years = duration.years();
      if (years !== currentYear) {
        if (currentYear !== null && monthCount > 0) {
          yearHeaders.push({ year: currentYear, colspan: monthCount });
        }
        currentYear = years;
        monthCount = 1;
      } else {
        monthCount++;
      }
    }

    if (currentYear !== null && monthCount > 0) {
      yearHeaders.push({ year: currentYear, colspan: monthCount });
    }

    return yearHeaders;
  }

  function generateDateHeaders(
    ageRange: MonthDuration[],
    recipient: Recipient
  ): Array<{ year: number; colspan: number }> {
    const dateHeaders: Array<{ year: number; colspan: number }> = [];
    let currentYear: number | null = null;
    let monthCount = 0;

    for (const duration of ageRange) {
      const filingDate = recipient.birthdate.dateAtLayAge(duration);
      const calendarYear = filingDate.year();

      if (calendarYear !== currentYear) {
        if (currentYear !== null && monthCount > 0) {
          dateHeaders.push({ year: currentYear, colspan: monthCount });
        }
        currentYear = calendarYear;
        monthCount = 1;
      } else {
        monthCount++;
      }
    }

    if (currentYear !== null && monthCount > 0) {
      dateHeaders.push({ year: currentYear, colspan: monthCount });
    }

    return dateHeaders;
  }

  $: calculateAlternativeStrategies();

  async function calculateAlternativeStrategies(): Promise<void> {
    if (isCalculating) return;
    isCalculating = true;

    try {
      filingAgeRange1 = createFilingAgeRange(recipients[0], deathAge1);
      filingAgeRange2 = createFilingAgeRange(recipients[1], deathAge2);

      const finalDates: [MonthDate, MonthDate] = [
        recipients[0].birthdate.dateAtLayAge(deathAge1),
        recipients[1].birthdate.dateAtLayAge(deathAge2),
      ];

      alternativeResults = Array(filingAgeRange1.getLength())
        .fill(null)
        .map(() => Array(filingAgeRange2.getLength()).fill(null));

      for (let i = 0; i < filingAgeRange1.getLength(); i++) {
        for (let j = 0; j < filingAgeRange2.getLength(); j++) {
          const strategy1 = filingAgeRange1.indexToMonthDuration(i);
          const strategy2 = filingAgeRange2.indexToMonthDuration(j);

          const npvCents = strategySumCentsCouple(
            recipients,
            finalDates,
            currentDate,
            discountRate,
            [strategy1, strategy2]
          );
          const npv = Money.fromCents(npvCents);
          const delta = npv.sub(optimalNPV);
          const percentOfOptimal = npv.div$(optimalNPV) * 100;

          alternativeResults[i][j] = {
            filingAge1: strategy1,
            filingAge2: strategy2,
            npv,
            delta,
            percentOfOptimal,
          };
        }

        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } catch (error) {
      console.error("Error calculating alternative strategies:", error);
    } finally {
      isCalculating = false;
    }
  }

  function getColor(percentOfOptimal: number, isOptimal: boolean): string {
    if (isOptimal) return "rgb(0, 100, 0)";
    if (percentOfOptimal >= 95) return "rgb(34, 139, 34)";
    if (percentOfOptimal >= 90) return "rgb(154, 205, 50)";
    if (percentOfOptimal >= 85) return "rgb(255, 215, 0)";
    if (percentOfOptimal >= 80) return "rgb(255, 165, 0)";
    return "rgb(220, 20, 60)";
  }

  // The optimal-cell indices are derived from the recipients' optimal filing
  // ages. Comparing by filing-age is robust where comparing NPVs cents-exact
  // could miss rounding differences between solver paths.
  $: optimalIndices = (() => {
    if (!filingAgeRange1 || !filingAgeRange2) return [-1, -1] as const;
    const i =
      optimalFilingAges[0].asMonths() - filingAgeRange1.getStart().asMonths();
    const j =
      optimalFilingAges[1].asMonths() - filingAgeRange2.getStart().asMonths();
    if (i < 0 || j < 0) return [-1, -1] as const;
    if (i >= filingAgeRange1.getLength() || j >= filingAgeRange2.getLength()) {
      return [-1, -1] as const;
    }
    return [i, j] as const;
  })();
  $: optimalI = optimalIndices[0];
  $: optimalJ = optimalIndices[1];

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

  function handleGridMouseLeave(): void {
    if (!isPinned) {
      hoveredRowIndex = -1;
      hoveredColIndex = -1;
      hoveredResult = null;
    }
  }

  function handleCellKeydown(
    event: KeyboardEvent,
    i: number,
    j: number,
    result: AlternativeResult
  ): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCellClick(i, j, result);
    }
  }

  function handleCellClick(
    i: number,
    j: number,
    result: AlternativeResult
  ): void {
    if (isPinned) {
      isPinned = false;
      pinnedRowIndex = -1;
      pinnedColIndex = -1;
      pinnedResult = null;
      hoveredRowIndex = i;
      hoveredColIndex = j;
      hoveredResult = result;
    } else {
      isPinned = true;
      pinnedRowIndex = i;
      pinnedColIndex = j;
      pinnedResult = result;
      hoveredRowIndex = -1;
      hoveredColIndex = -1;
      hoveredResult = null;
    }
  }

  $: displayedRowIndex = isPinned ? pinnedRowIndex : hoveredRowIndex;
  $: displayedColIndex = isPinned ? pinnedColIndex : hoveredColIndex;
  $: displayedResult = isPinned ? pinnedResult : hoveredResult;

  $: isOptimalDisplayed =
    displayedRowIndex === optimalI && displayedColIndex === optimalJ;

  function formatDelta(delta: Money): string {
    const cents = delta.cents();
    if (cents === 0) return "$0";
    if (cents > 0) return `+${delta.wholeDollars()}`;
    // wholeDollars() handles negative formatting (e.g., "-$3,400")
    return delta.wholeDollars();
  }

  function formatAge(
    duration: MonthDuration,
    recipientIndex: number = 0
  ): string {
    if (displayAsAges) {
      const years = duration.years();
      const months = duration.modMonths();
      if (months === 0) return `Age ${years}`;
      if (months === 1) return `Age ${years} and 1 month`;
      return `Age ${years} and ${months} months`;
    }
    const filingDate =
      recipients[recipientIndex].birthdate.dateAtLayAge(duration);
    return `${filingDate.monthName()} ${filingDate.year()}`;
  }
</script>

<div class="alt-grid">
  {#if isCalculating}
    <div class="loading">Calculating alternative strategies…</div>
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

    <div class="info-panel" class:is-pinned={isPinned}>
      <div class="info-panel-header">
        <span class="info-eyebrow">
          {#if isPinned}
            Pinned cell
          {:else}
            Hover any cell
          {/if}
        </span>
        {#if isPinned}
          <span class="info-hint-pin">Click again to unpin</span>
        {/if}
      </div>
      {#if displayedResult}
        <div class="info-content">
          <div class="info-row">
            <span class="info-label"><RecipientName r={recipients[0]} /></span>
            <span class="info-value">{formatAge(displayedResult.filingAge1, 0)}</span>
          </div>
          <div class="info-row">
            <span class="info-label"><RecipientName r={recipients[1]} /></span>
            <span class="info-value">{formatAge(displayedResult.filingAge2, 1)}</span>
          </div>
          <div class="info-row info-delta">
            <span class="info-label">vs optimal</span>
            <span class="info-value">
              {#if isOptimalDisplayed}
                <span class="delta-optimal">Optimal · {displayedResult.npv.wholeDollars()}</span>
              {:else}
                <span class="delta-amount delta-loss">{formatDelta(displayedResult.delta)}</span>
                <span class="delta-pct">({displayedResult.percentOfOptimal.toFixed(1)}% of optimal)</span>
              {/if}
            </span>
          </div>
        </div>
      {:else}
        <div class="info-hint">
          Move over a cell to see how its NPV compares to the optimal filing
          combination at this scenario.
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
      <div class="corner-cell" style:grid-column="1" style:grid-row="1"></div>
      <div class="corner-cell" style:grid-column="2" style:grid-row="1"></div>
      <div class="corner-cell" style:grid-column="1" style:grid-row="2"></div>
      <div class="corner-cell" style:grid-column="2" style:grid-row="2"></div>

      <div
        class="recipient-header recipient-header-column"
        style:grid-column="3 / {range2Length + 3}"
        style:grid-row="1"
      >
        <RecipientName r={recipients[1]} apos />&nbsp;Filing {displayAsAges
          ? "Age"
          : "Date"}
      </div>
      <div
        class="recipient-header recipient-header-row"
        style:grid-column="1"
        style:grid-row="3 / {range1Length + 3}"
      >
        <span class="recipient-text"
          ><RecipientName r={recipients[0]} apos /> Filing {displayAsAges
            ? "Age"
            : "Date"}</span
        >
      </div>

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

      {#each Array(range1Length) as _, i}
        {#each Array(range2Length) as _, j}
          {@const result = alternativeResults[i][j]}
          {@const isHovered =
            displayedRowIndex === i && displayedColIndex === j}
          {@const isPinnedCell =
            isPinned && pinnedRowIndex === i && pinnedColIndex === j}
          {@const isOptimal = i === optimalI && j === optimalJ}
          <div
            class="data-cell {isHovered ? 'hovered' : ''} {isPinnedCell
              ? 'pinned'
              : ''} {isOptimal ? 'optimal' : ''}"
            style:grid-column={j + 3}
            style:grid-row={i + 3}
            style:background-color={getColor(
              result.percentOfOptimal,
              isOptimal
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

    <div class="legend">
      <span class="legend-label">NPV vs optimal:</span>
      <span class="legend-item"
        ><span class="swatch" style:background-color="rgb(0, 100, 0)"></span
        >Optimal</span
      >
      <span class="legend-item"
        ><span class="swatch" style:background-color="rgb(34, 139, 34)"></span
        >95–100%</span
      >
      <span class="legend-item"
        ><span class="swatch" style:background-color="rgb(154, 205, 50)"></span
        >90–95%</span
      >
      <span class="legend-item"
        ><span class="swatch" style:background-color="rgb(255, 215, 0)"></span
        >85–90%</span
      >
      <span class="legend-item"
        ><span class="swatch" style:background-color="rgb(255, 165, 0)"></span
        >80–85%</span
      >
      <span class="legend-item"
        ><span class="swatch" style:background-color="rgb(220, 20, 60)"></span
        >&lt;80%</span
      >
    </div>
  {/if}
</div>

<style>
  .alt-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .loading {
    text-align: center;
    padding: 1.5rem;
    font-style: italic;
    color: #666;
  }

  .info-panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.85rem 1rem;
    transition: border-color 0.15s ease;
  }

  .info-panel.is-pinned {
    border-color: #c7a008;
    box-shadow: 0 0 0 1px rgba(255, 215, 0, 0.4);
  }

  .info-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .info-eyebrow {
    font-size: 0.7rem;
    font-weight: 700;
    color: #6b7280;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .info-hint-pin {
    font-size: 0.72rem;
    color: #6b7280;
    font-style: italic;
  }

  .info-content {
    display: grid;
    grid-template-columns: minmax(80px, max-content) 1fr;
    gap: 0.4rem 1rem;
    align-items: baseline;
  }

  .info-row {
    display: contents;
  }

  .info-label {
    font-size: 0.85rem;
    color: #4b5563;
    font-weight: 500;
  }

  .info-value {
    font-size: 0.95rem;
    color: #060606;
    font-weight: 600;
  }

  .info-delta .info-label {
    font-weight: 600;
    color: #1f2937;
  }

  .delta-amount {
    font-size: 1.1rem;
    font-weight: 800;
    margin-right: 0.4rem;
  }

  .delta-loss {
    color: #b91c1c;
  }

  .delta-optimal {
    color: #166534;
    font-weight: 700;
  }

  .delta-pct {
    font-size: 0.78rem;
    color: #6b7280;
    font-weight: 500;
  }

  .info-hint {
    color: #6b7280;
    font-style: italic;
    text-align: center;
    padding: 0.5rem 0;
    font-size: 0.9rem;
  }

  .grid-wrapper {
    display: grid;
    overflow: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: crosshair;
    align-self: center;
    max-width: 100%;
    background: #fff;
  }

  .corner-cell {
    background: #e0e0e0;
  }

  .column-header-cell {
    background: #f0f0f0;
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
    background: #558855;
    color: #fff;
    font-weight: bold;
  }

  .row-header-cell {
    background: #f0f0f0;
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
    background: #dd6600;
    color: #fff;
    font-weight: bold;
  }

  .recipient-header {
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.8rem;
    color: #333;
  }

  .recipient-header-row {
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

  /* The optimal cell is the dark-green target. A subtle white inset ring
     gives it a visible "pin" so users can spot it among ~10k cells. The
     hovered/pinned overrides win because they're declared after. */
  .data-cell.optimal {
    box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.85);
    z-index: 5;
    position: relative;
  }

  .year-text {
    transform: rotate(-90deg);
    white-space: nowrap;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.85rem;
    font-size: 0.78rem;
    color: #4b5563;
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
    .grid-wrapper {
      grid-template-columns: 15px 20px repeat(var(--grid-cols, 100), 6px);
      grid-template-rows: 15px 15px repeat(var(--grid-rows, 100), 6px);
    }

    .corner-cell {
      font-size: 0.4rem;
    }

    .column-header-cell,
    .row-header-cell {
      font-size: 0.6rem;
    }

    .recipient-header {
      font-size: 0.7rem;
    }

    .info-content {
      grid-template-columns: minmax(60px, max-content) 1fr;
      gap: 0.3rem 0.6rem;
    }
  }
</style>
