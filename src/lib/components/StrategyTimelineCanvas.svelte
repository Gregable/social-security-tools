<script lang="ts">
  import { onMount } from 'svelte';
  import type { Recipient } from '$lib/recipient';
  import type { StrategyResult } from '$lib/strategy/ui';
  import { MonthDate, MonthDuration } from '$lib/month-time';
  import { strategySumPeriods } from '$lib/strategy/calculations/strategy-calc';

  // Component props
  export let result: StrategyResult;
  export let recipients: [Recipient, Recipient];
  export let width: number = 800;
  export let height: number = 600;

  // Canvas element and context
  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let mounted = false;

  // Layout constants
  const MARGIN_TOP = 40;
  const MARGIN_BOTTOM = 40;
  const MARGIN_LEFT = 80;
  const MARGIN_RIGHT = 80;

  // Derived data from props
  $: filingDate1 = recipients[0].birthdate.dateAtLayAge(result.filingAge1);
  $: filingDate2 = recipients[1].birthdate.dateAtLayAge(result.filingAge2);

  // Expected death ages (probability-weighted modeled midpoint)
  $: expectedAge1 = result.bucket1.expectedAge;
  $: expectedAge2 = result.bucket2.expectedAge;
  $: deathDate1 = recipients[0].birthdate.dateAtLayAge(expectedAge1);
  $: deathDate2 = recipients[1].birthdate.dateAtLayAge(expectedAge2);

  // Calculate benefit periods for the selected strategy
  $: finalDate1 = recipients[0].birthdate.dateAtLayAge(
    new MonthDuration(result.bucket1.midAge * 12)
  );
  $: finalDate2 = recipients[1].birthdate.dateAtLayAge(
    new MonthDuration(result.bucket2.midAge * 12)
  );
  $: finalDates = [finalDate1, finalDate2] as [MonthDate, MonthDate];

  $: filingAge1 = result.filingAge1;
  $: filingAge2 = result.filingAge2;
  $: filingAges = [filingAge1, filingAge2] as [MonthDuration, MonthDuration];

  $: _benefitPeriods = strategySumPeriods(recipients, finalDates, filingAges);

  // Timeline bounds - from earliest filing to latest death
  $: timelineStartDate = MonthDate.min(filingDate1, filingDate2);
  $: timelineEndDate = MonthDate.max(deathDate1, deathDate2);

  // Chart dimensions
  $: _chartWidth = width - MARGIN_LEFT - MARGIN_RIGHT;
  $: chartHeight = height - MARGIN_TOP - MARGIN_BOTTOM;

  // Initialize canvas when mounted
  onMount(() => {
    mounted = true;
    if (canvasEl) {
      ctx = canvasEl.getContext('2d');
      if (ctx) {
        ctx.font = '12px sans-serif';
        render();
      }
    }
  });

  // Re-render when data changes
  $: if (mounted && ctx && result && recipients) {
    render();
  }

  /**
   * Convert a date to a Y coordinate on the canvas (time flows top to bottom)
   */
  function dateToY(date: MonthDate): number {
    const totalMonths = timelineEndDate
      .subtractDate(timelineStartDate)
      .asMonths();
    const monthsFromStart = date.subtractDate(timelineStartDate).asMonths();
    const progress = monthsFromStart / totalMonths;
    return MARGIN_TOP + progress * chartHeight;
  }

  /**
   * Convert a Y coordinate to a date
   */
  function _yToDate(y: number): MonthDate {
    const progress = (y - MARGIN_TOP) / chartHeight;
    const totalMonths = timelineEndDate
      .subtractDate(timelineStartDate)
      .asMonths();
    const monthsFromStart = Math.round(progress * totalMonths);
    return timelineStartDate.addDuration(new MonthDuration(monthsFromStart));
  }

  /**
   * Main render function
   */
  function render() {
    if (!ctx || !canvasEl) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up basic styling
    ctx.fillStyle = '#333';
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;

    // For now, just draw a basic timeline axis and some test elements
    drawTimelineAxis();
    drawTestElements();
  }

  /**
   * Draw the main timeline axis (vertical line showing time progression)
   */
  function drawTimelineAxis() {
    ctx.save();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;

    // Draw main timeline axis
    ctx.beginPath();
    ctx.moveTo(MARGIN_LEFT, MARGIN_TOP);
    ctx.lineTo(MARGIN_LEFT, height - MARGIN_BOTTOM);
    ctx.stroke();

    // Add some time markers
    const yearDuration = new MonthDuration(12);
    let currentDate = timelineStartDate;

    while (currentDate.lessThanOrEqual(timelineEndDate)) {
      const y = dateToY(currentDate);

      // Draw tick mark
      ctx.beginPath();
      ctx.moveTo(MARGIN_LEFT - 5, y);
      ctx.lineTo(MARGIN_LEFT + 5, y);
      ctx.stroke();

      // Draw year label
      ctx.fillStyle = '#666';
      ctx.textAlign = 'right';
      ctx.fillText(currentDate.year().toString(), MARGIN_LEFT - 10, y + 4);

      currentDate = currentDate.addDuration(yearDuration);
    }

    ctx.restore();
  }

  /**
   * Draw some test elements to verify the coordinate system works
   */
  function drawTestElements() {
    ctx.save();

    // Draw filing date markers
    ctx.fillStyle = recipients[0].colors().medium;
    const filing1Y = dateToY(filingDate1);
    ctx.beginPath();
    ctx.arc(MARGIN_LEFT + 100, filing1Y, 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText(
      `${recipients[0].name} files`,
      MARGIN_LEFT + 110,
      filing1Y + 4
    );

    ctx.fillStyle = recipients[1].colors().medium;
    const filing2Y = dateToY(filingDate2);
    ctx.beginPath();
    ctx.arc(MARGIN_LEFT + 100, filing2Y, 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.fillText(
      `${recipients[1].name} files`,
      MARGIN_LEFT + 110,
      filing2Y + 4
    );

    // Draw death date markers
    ctx.fillStyle = '#999';
    const death1Y = dateToY(deathDate1);
    ctx.beginPath();
    ctx.arc(MARGIN_LEFT + 200, death1Y, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#666';
    ctx.fillText(`${recipients[0].name} death`, MARGIN_LEFT + 210, death1Y + 4);

    const death2Y = dateToY(deathDate2);
    ctx.beginPath();
    ctx.arc(MARGIN_LEFT + 200, death2Y, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillText(`${recipients[1].name} death`, MARGIN_LEFT + 210, death2Y + 4);

    ctx.restore();
  }
</script>

<div class="strategy-timeline">
  <canvas
    bind:this={canvasEl}
    {width}
    {height}
    style="border: 1px solid #ddd; background: white;"
  ></canvas>
</div>

<style>
  .strategy-timeline {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }

  canvas {
    border-radius: 4px;
  }
</style>
