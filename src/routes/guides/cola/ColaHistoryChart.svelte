<!--
  @component
  @name ColaHistoryChart
  @description
    Bar chart of every cost-of-living adjustment on record, one bar per
    payment year, with the long-run average as a reference line. Inline SVG
    computed from props, so it renders in the prerendered page without
    JavaScript. Each bar carries a title for hover; the guide's full-history
    table is the accessible twin.

  @example
    <ColaHistoryChart history={colaHistory()} average={averageCola()} />

  @prop history - Adjustments oldest first, as colaHistory() returns them.
  @prop average - Arithmetic mean of the adjustments, in whole percent.
-->

<script lang="ts">
import type { AnnualCola } from '$lib/cola';

interface Props {
  history: AnnualCola[];
  average: number;
}

let { history, average }: Props = $props();

// Geometry in SVG user units; the chart scales to its container's width.
const WIDTH = 760;
const HEIGHT = 300;
// The right margin holds the average label, outside the plot so it cannot
// collide with the latest bar's label.
const MARGIN = { top: 28, right: 100, bottom: 36, left: 44 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const BASELINE = MARGIN.top + PLOT_HEIGHT;
const GAP = 2;
const MAX_BAR_WIDTH = 24;
const CORNER = 4;
const TICK_STEP = 5;
const YEAR_LABEL_EVERY = 5;

const band = $derived(PLOT_WIDTH / Math.max(history.length, 1));
const barWidth = $derived(Math.min(MAX_BAR_WIDTH, band - GAP));
const highest = $derived(Math.max(...history.map((a) => a.percent), 0));
const top = $derived(
  Math.max(TICK_STEP, Math.ceil(highest / TICK_STEP) * TICK_STEP)
);
const ticks = $derived(
  Array.from({ length: top / TICK_STEP + 1 }, (_, i) => i * TICK_STEP)
);

function x(index: number): number {
  return MARGIN.left + index * band + (band - barWidth) / 2;
}

function y(percent: number): number {
  return BASELINE - (percent / top) * PLOT_HEIGHT;
}

/** A column with rounded top corners and a square base. */
function barPath(index: number, percent: number): string {
  const left = x(index);
  const right = left + barWidth;
  const topY = y(percent);
  const r = Math.min(CORNER, barWidth / 2, BASELINE - topY);
  return [
    `M${left},${BASELINE}`,
    `V${topY + r}`,
    `Q${left},${topY} ${left + r},${topY}`,
    `H${right - r}`,
    `Q${right},${topY} ${right},${topY + r}`,
    `V${BASELINE}`,
    'Z',
  ].join(' ');
}

const labelled = $derived.by(() => {
  const indices = new Set<number>();
  if (history.length === 0) return indices;
  let max = 0;
  for (let i = 1; i < history.length; i++) {
    if (history[i].percent > history[max].percent) max = i;
  }
  indices.add(max);
  indices.add(history.length - 1);
  return indices;
});

const description = $derived(
  history.length === 0
    ? 'No cost-of-living adjustments on record.'
    : `Cost-of-living adjustments from ${history[0].paymentYear} to ${
        history[history.length - 1].paymentYear
      }, averaging ${average.toFixed(1)}%. The full list is in the table below.`
);
</script>

<svg
  class="cola-chart"
  viewBox="0 0 {WIDTH} {HEIGHT}"
  role="img"
  aria-label={description}
>
  {#each ticks as tick}
    <line
      class="gridline"
      x1={MARGIN.left}
      x2={WIDTH - MARGIN.right}
      y1={y(tick)}
      y2={y(tick)}
    />
    <text class="tick-label" x={MARGIN.left - 8} y={y(tick)} dy="0.35em">
      {tick}%
    </text>
  {/each}

  {#each history as adjustment, i}
    {#if adjustment.percent === 0}
      <text
        class="zero-mark"
        x={x(i) + barWidth / 2}
        y={BASELINE - 4}
        text-anchor="middle"
      >
        0
      </text>
    {/if}
    <g class="bar">
      <title>{adjustment.paymentYear}: {adjustment.percent.toFixed(1)}%</title>
      <rect
        class="hit"
        x={MARGIN.left + i * band}
        y={MARGIN.top}
        width={band}
        height={PLOT_HEIGHT}
      />
      <path
        d={barPath(i, adjustment.percent)}
        data-width={barWidth.toFixed(2)}
      />
      {#if labelled.has(i)}
        <text
          class="bar-label"
          x={x(i) + barWidth / 2}
          y={y(adjustment.percent) - 6}
          text-anchor="middle"
        >
          {adjustment.percent.toFixed(1)}%
        </text>
      {/if}
    </g>
    {#if adjustment.paymentYear % YEAR_LABEL_EVERY === 0}
      <text
        class="year-label"
        x={x(i) + barWidth / 2}
        y={BASELINE + 18}
        text-anchor="middle"
      >
        {adjustment.paymentYear}
      </text>
    {/if}
  {/each}

  <line
    class="average-line"
    x1={MARGIN.left}
    x2={WIDTH - MARGIN.right}
    y1={y(average)}
    y2={y(average)}
  />
  <text
    class="average-label"
    x={WIDTH - MARGIN.right + 8}
    y={y(average)}
    dy="0.35em"
    text-anchor="start"
  >
    Average {average.toFixed(1)}%
  </text>
</svg>

<style>
  .cola-chart {
    display: block;
    width: 100%;
    height: auto;
    margin: 20px 0;
    font-family: inherit;
  }

  .gridline {
    stroke: #e1e0d9;
    stroke-width: 1;
  }

  .tick-label,
  .year-label,
  .zero-mark {
    font-size: 12px;
    fill: #898781;
  }

  .tick-label {
    text-anchor: end;
  }

  .bar path {
    fill: #2a78d6;
  }

  .bar:hover path {
    fill: #1c5cab;
  }

  .bar .hit {
    fill: transparent;
  }

  .bar-label {
    font-size: 12px;
    font-weight: 600;
    fill: #52514e;
  }

  .average-line {
    stroke: #898781;
    stroke-width: 1.5;
    stroke-dasharray: 6 4;
  }

  .average-label {
    font-size: 12px;
    fill: #52514e;
  }
</style>
