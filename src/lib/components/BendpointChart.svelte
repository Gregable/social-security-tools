<script lang="ts">
import { onMount } from 'svelte';
import { Recipient } from '$lib/recipient';
import {
  type BendpointBounds,
  calcChartHeight,
  calcChartWidth,
  earningsX,
  initBounds,
  recomputeBounds,
} from './bendpoint-chart-math';
import {
  renderBoundingBox,
  renderBreakPoints,
  renderEarningsPoint,
} from './bendpoint-chart-renderer';

export let recipient: Recipient = new Recipient();

let mounted: boolean = false;
$: $recipient && mounted && render();

let canvasEl: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

let bounds: BendpointBounds = initBounds();
let chartWidth: number = 0;
let chartHeight: number = 0;

onMount(() => {
  updateCanvas();
  mounted = true;
});

function updateCanvas() {
  if (!canvasEl) return;
  canvasEl.setAttribute('width', getComputedStyle(canvasEl).width);
  canvasEl.setAttribute('height', getComputedStyle(canvasEl).height);
  ctx = canvasEl.getContext('2d');
  ctx.font = 'bold 14px Helvetica';
  chartWidth = calcChartWidth(ctx, canvasEl.width);
  chartHeight = calcChartHeight(canvasEl.height);

  render();
}

let innerWidth: number = 0;
$: innerWidth && mounted && updateCanvas();

let mouseToggle: boolean = true;
let lastMouseX_: number = -1;
function onClick(event: MouseEvent) {
  if (!canvasEl) return;
  if (mouseToggle) {
    mouseToggle = false;
  } else {
    mouseToggle = true;
    lastMouseX_ = event.clientX - canvasEl.getBoundingClientRect().left;
  }
  render();
}

function onMove(event: MouseEvent) {
  if (!mouseToggle || !canvasEl) return;
  lastMouseX_ = event.clientX - canvasEl.getBoundingClientRect().left;
  render();
}

function onOut(_event: MouseEvent) {
  if (!mouseToggle) return;
  lastMouseX_ = -1;
  render();
}

function onBlur(_event: FocusEvent) {
  if (!mouseToggle) return;
  lastMouseX_ = -1;
  render();
}

function render() {
  if (!canvasEl || !ctx) return;

  bounds = recomputeBounds(recipient, bounds);

  ctx.save();
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  ctx.strokeStyle = '#666';
  renderBoundingBox(ctx, bounds, chartWidth, chartHeight);
  renderBreakPoints(ctx, recipient, bounds, chartWidth, chartHeight);
  ctx.strokeStyle = '#5cb85c';

  renderEarningsPoint(
    ctx,
    recipient,
    recipient.monthlyIndexedEarnings(),
    bounds,
    chartWidth,
    chartHeight
  );

  if (lastMouseX_ > 0) {
    ctx.save();
    ctx.strokeStyle = '#337ab7';
    renderEarningsPoint(
      ctx,
      recipient,
      earningsX(lastMouseX_, bounds.maxRenderedXDollars, chartWidth),
      bounds,
      chartWidth,
      chartHeight
    );
    ctx.restore();
  }

  ctx.restore();
}
</script>

<svelte:window bind:innerWidth />
<div class="chart-container">
  <div class="chart-ylabel">
    <span class="vertical-text">Primary Insurance Amount (PIA)</span>
  </div>

  <canvas
    width="600"
    height="400"
    bind:this={canvasEl}
    on:mousedown={onClick}
    on:pointermove={onMove}
    on:mouseout={onOut}
    on:blur={onBlur}
  >
    Your browser does not support HTML canvas.
  </canvas>

  <div class="chart-xlabel">Average Indexed Monthly Earnings (AIME)</div>
</div>

<style>
  .chart-container {
    position: relative;
    max-width: 650px;
    margin-top: 20px;
    font-size: 16px;
    white-space: nowrap;
    /* Prevent wrap */
    width: max-content;
  }

  .chart-ylabel {
    width: 1px;
    float: right;
  }

  .vertical-text {
    transform: rotate(-90deg) translateY(-82px) translateX(-166px);
    -webkit-transform: rotate(-90deg) translateY(-116px) translateX(-166px);
    float: left;
    width: 235px;
    white-space: nowrap;
  }

  .chart-xlabel {
    max-width: 650px;
    height: 30px;
    clear: both;
    text-align: center;
  }

  canvas {
    float: left;
    width: 600px;
    height: 400px;
    /* Prevent the browser from hijacking dragging on the canvas. */
    touch-action: none;
  }

  @media screen and (max-width: 680px) {
    .chart-container {
      font-size: 12px;
    }
    .chart-ylabel {
      width: 30px;
      height: 220px;
    }
    .vertical-text {
      transform: rotate(-90deg) translateY(-82px) translateX(-110px);
      -webkit-transform: rotate(-90deg) translateY(-82px) translateX(-110px);
      width: 180px;
    }
    canvas {
      width: 350px;
      height: 250px;
    }
  }
</style>
