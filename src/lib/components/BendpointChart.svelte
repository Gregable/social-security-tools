<script lang="ts">
  import { onMount } from "svelte";

  import { Recipient } from "$lib/recipient";
  import { Money } from "$lib/money";
  import * as constants from "$lib/constants";

  export let recipient: Recipient = new Recipient();

  let mounted: boolean = false;
  $: $recipient && mounted && render();

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let maxRenderedXDollars = Money.from(-1);
  let maxRenderedYDollars = Money.from(-1);

  let chartWidth: number = 0;
  let chartHeight: number = 0;

  onMount(() => {
    updateCanvas();
    mounted = true;
  });

  function updateCanvas() {
    if (!canvasEl) return; // Guard against undefined canvasEl
    canvasEl.setAttribute("width", getComputedStyle(canvasEl).width);
    canvasEl.setAttribute("height", getComputedStyle(canvasEl).height);
    ctx = canvasEl.getContext("2d");
    ctx.font = "bold 14px Helvetica";
    chartWidth = calcChartWidth();
    chartHeight = calcChartHeight();

    render();
  }

  let innerWidth: number = 0;
  $: innerWidth && mounted && updateCanvas();

  let mouseToggle: boolean = true;
  let lastMouseX_: number = -1;
  function onClick(event: MouseEvent) {
    if (!canvasEl) return; // Guard against undefined canvasEl
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

  function calcChartWidth() {
    if (!canvasEl || !ctx) return 0;
    // A 6-digit social security payment would be about the highest we
    // would imagine someone receiving, so we reserve space on the right
    // to display such a value with a little added padding.
    let reservedWidth = Math.ceil(ctx.measureText("$999,999").width) + 10;
    let usableWidth = canvasEl.width - reservedWidth;
    return usableWidth;
  }

  function calcChartHeight() {
    if (!canvasEl) return 0;
    // A 12pt font is 16 pixels high. We reserve a little extra for padding.
    let reservedHeight = 16 + 10;
    let usableHeight = canvasEl.height - reservedHeight;
    return usableHeight;
  }

  /**
   * Compute the canvas x-coordinate for a earnings dollars value.
   */
  function canvasX(earningsX: Money): number {
    let xValue = Math.floor(earningsX.div$(maxRenderedXDollars) * chartWidth);
    let xClipped = Math.min(xValue, chartWidth);
    return xClipped;
  }

  /**
   * Compute the canvas y-coordinate for a benefit dollars value.
   */
  function canvasY(benefitY: Money): number {
    let yValue =
      chartHeight -
      Math.floor(benefitY.div$(maxRenderedYDollars) * chartHeight);
    let yClipped = Math.min(yValue, chartHeight);
    return yClipped;
  }

  /**
   * Compute the canvas earnings dollars for an x-coordinate value.
   * Used for computations involving mouse interactions.
   */
  function earningsX(canvasX: number): Money {
    if (canvasX > chartWidth) canvasX = chartWidth;
    if (canvasX < 0) canvasX = 0;
    return maxRenderedXDollars.times(canvasX / chartWidth);
  }

  let lastRenderedXDollars = Money.from(-1);
  /**
   * Selects an x and y-coordinate (in dollars) as the top-right edge.
   */
  function recomputeBounds() {
    // There are a few goals here when selecting this value:
    // 1) Show all of the breakpoints so the user can get a feel visually
    //    for how these breakpoints affect the computation.
    let breakpoint_min = recipient.pia().secondBendPoint().times(1.25);
    // 2) Show the user's current earnings with some space on either side
    //    so that they can explore the graph to either direction.
    let user_min = recipient.monthlyIndexedEarnings().times(2);
    // 3) Don't show values beyond the maximum achievable AIME.
    // https://github.com/Gregable/social-security-tools/issues/167
    let absolute_max =
      constants.MAXIMUM_EARNINGS[constants.MAX_MAXIMUM_EARNINGS_YEAR].div(12);

    let computed = Money.min(Money.max(breakpoint_min, user_min), absolute_max);

    // We would prefer to keep the viewport fixed as the user changes
    // the benefit, so that it's easier to see what is going on. However
    // we will adjust if the value gets too close to the edges.
    if (
      lastRenderedXDollars.value() < 0 ||
      lastRenderedXDollars.value() > computed.times(1.3).value() ||
      lastRenderedXDollars.value() < computed.div(1.3).value()
    )
      lastRenderedXDollars = computed;

    maxRenderedXDollars = lastRenderedXDollars;
    maxRenderedYDollars = recipient.pia().piaFromAIME(lastRenderedXDollars);
  }

  /**
   * Utility method which walls lineTo on canvas_ after transforming
   * dollarX and dollarY into canvas x / y coordinates.
   */
  function lineTo(dollarX: Money, dollarY: Money) {
    ctx.lineTo(canvasX(dollarX), canvasY(dollarY));
  }

  /**
   * Utility method which walls moveTo on canvas_ after transforming
   * dollarX and dollarY into canvas x/y coordinates.
   */
  function moveTo(dollarX: Money, dollarY: Money) {
    ctx.moveTo(canvasX(dollarX), canvasY(dollarY));
  }

  /**
   *  Render the bounding box for our chart.
   */
  function renderBoundingBox() {
    recomputeBounds();

    ctx.save();
    ctx.lineWidth = 1;

    ctx.beginPath();
    moveTo(Money.from(0), Money.from(0));
    lineTo(Money.from(0), maxRenderedYDollars);
    lineTo(maxRenderedXDollars, maxRenderedYDollars);
    lineTo(maxRenderedXDollars, Money.from(0));
    lineTo(Money.from(0), Money.from(0));
    ctx.stroke();

    ctx.restore();
  }

  /**
   *  Render the breakpoint curves. These are constants.
   */
  function renderBreakPoints() {
    // Show the lines between the breakpoints. These are always the same.
    ctx.save();
    ctx.lineWidth = 4;

    ctx.beginPath();
    moveTo(Money.from(0), Money.from(0));

    let firstBend: Money = recipient.pia().firstBendPoint();
    let secondBend: Money = recipient.pia().secondBendPoint();

    let dollarX: Money;
    let dollarY: Money;

    // Origin to first bend point
    dollarX = firstBend;
    dollarY = recipient.pia().piaFromAIME(dollarX);
    lineTo(dollarX, dollarY);

    // First to second bend point
    dollarX = secondBend;
    dollarY = recipient.pia().piaFromAIME(dollarX);
    lineTo(dollarX, dollarY);

    // Second to third bend point
    dollarX = maxRenderedXDollars;
    dollarY = recipient.pia().piaFromAIME(dollarX);
    lineTo(dollarX, dollarY);

    ctx.stroke();
    ctx.restore();

    // Now lets show vertical bars indicating where the breakpoints live.
    ctx.save();

    // Line between 1st and 2nd breakpoints:
    ctx.beginPath();
    ctx.lineWidth = 0.5;
    dollarX = firstBend;
    dollarY = recipient.pia().piaFromAIME(dollarX);
    moveTo(dollarX, dollarY.sub(Money.from(200)));
    lineTo(dollarX, dollarY.plus(Money.from(200)));
    ctx.stroke();

    // Line between 2nd and 3rd breakpoints:
    ctx.beginPath();
    ctx.lineWidth = 0.5;
    dollarX = secondBend;
    dollarY = recipient.pia().piaFromAIME(dollarX);
    moveTo(dollarX, dollarY.sub(Money.from(200)));
    lineTo(dollarX, dollarY.plus(Money.from(200)));
    ctx.stroke();

    // Some text indicating the slope of the curve along each section delineated
    // by the vertical bars above.
    const textWidth = ctx.measureText("XX%").width / 2;
    ctx.fillStyle = "#78B";

    // Compute the angle at which the chart dimensions are distoring slopes.
    const chartAngle =
      (chartHeight / chartWidth) *
      maxRenderedXDollars.div$(maxRenderedYDollars);
    ctx.fillText("32%", 0, 0);

    ctx.save();
    dollarX = recipient.pia().firstBendPoint().div(2);
    dollarY = recipient.pia().piaFromAIME(dollarX);
    ctx.translate(canvasX(dollarX) - textWidth, canvasY(dollarY));
    // For very high earners, the space for this text can get pretty cramped,
    // so we simply don't show it in this case.
    if (canvasX(dollarX) - canvasX(Money.from(0)) > textWidth + 5) {
      ctx.rotate(-1 * Math.atan(0.9 * chartAngle));
      ctx.fillText("90%", 0, 0);
    }
    ctx.restore();

    ctx.save();
    dollarX = secondBend.sub(firstBend).div(2).plus(firstBend);
    dollarY = recipient.pia().piaFromAIME(dollarX);
    ctx.translate(canvasX(dollarX) - textWidth, canvasY(dollarY));
    ctx.rotate(-1 * Math.atan(0.32 * chartAngle));
    ctx.fillText("32%", 0, 0);
    ctx.restore();

    ctx.save();
    dollarX = maxRenderedXDollars.sub(secondBend).div(2).plus(secondBend);
    dollarY = recipient.pia().piaFromAIME(dollarX);
    let pixelY = canvasY(dollarY);
    // If this is too close to the top of the chart, flip it to below the line.
    if (pixelY < 100)
      // This just happens to work pretty well for positioning below the line.
      pixelY += 10 + 5 * chartAngle;

    ctx.translate(canvasX(dollarX) - textWidth, pixelY);
    ctx.rotate(-1 * Math.atan(0.15 * chartAngle));
    ctx.fillText("15%", 0, 0);
    ctx.restore();

    ctx.restore();
  }

  /**
   * Renders a rectangle with three rounded corners.
   * @param x canvas x coordinate to draw upper-left corner.
   * @param y canvas y coordinate to dray upper-left corner.
   * @param width of rectangle
   * @param height of rectangle
   * @param cornerRadius
   * @param squaredCorner (1 = upper left, then clockwise)
   */
  function roundedBox(
    x: number,
    y: number,
    width: number,
    height: number,
    cornerRadius: number,
    squaredCorner: number
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.lineCap = "square";

    if (squaredCorner === 1) {
      ctx.moveTo(x, y);
    } else {
      ctx.moveTo(x + cornerRadius, y);
    }
    if (squaredCorner === 2) {
      ctx.lineTo(x + width, y);
    } else {
      ctx.lineTo(x + width - cornerRadius, y);
      ctx.arcTo(x + width, y, x + width, y + cornerRadius, cornerRadius);
    }
    if (squaredCorner === 3) {
      ctx.lineTo(x + width, y + height);
    } else {
      ctx.lineTo(x + width, y + height - cornerRadius);
      ctx.arcTo(
        x + width,
        y + height,
        x + width - cornerRadius,
        y + height,
        cornerRadius
      );
    }
    if (squaredCorner === 4) {
      ctx.lineTo(x, y + height);
    } else {
      ctx.lineTo(x + cornerRadius, y + height);
      ctx.arcTo(x, y + height, x, y + height - cornerRadius, cornerRadius);
    }
    if (squaredCorner === 1) {
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, y + cornerRadius);
      ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);
    }

    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Renders a point on the breakpoint curve.
   * @param earningsX dollar value which a point is rendered for.
   */
  function renderEarningsPoint(earningsX: Money) {
    ctx.save();

    // Where on the breakpoint 'curve' the user's benefit values lie.
    const x = earningsX;
    const y = recipient.pia().piaFromAIME(earningsX);

    // Thin dashed lines out from the user benefit point
    ctx.lineWidth = 2;
    ctx.lineCap = "butt";
    ctx.setLineDash([3, 5]);

    // Both lines starting at the point and radiating out makes a nifty
    // animation effect with the dashed lines at the edges of the chart.
    ctx.beginPath();
    moveTo(x, y);
    lineTo(x, Money.from(0));
    ctx.stroke();

    ctx.beginPath();
    moveTo(x, y);
    lineTo(maxRenderedXDollars, y);
    ctx.stroke();

    // White filled circle with black edge showing the user benefit point.
    ctx.setLineDash([]); // Disable the dashed line from above.
    ctx.fillStyle = ctx.strokeStyle;

    ctx.beginPath();
    ctx.arc(
      canvasX(x),
      canvasY(y),
      /*radius=*/ 5,
      /*startAngle=*/ 0,
      /*endAngle=*/ 2 * Math.PI
    );
    ctx.fill();
    ctx.stroke();

    // Text at the edges showing the actual values, white on colored chip.
    const xText = x.wholeDollars();
    const yText = y.wholeDollars();

    // Chip on the bottom edge
    roundedBox(
      canvasX(x),
      canvasY(Money.from(0)),
      ctx.measureText(xText).width + 6,
      19,
      5,
      /*squaredCorner=*/ 1
    );
    // Chip on the right edge
    roundedBox(
      canvasX(maxRenderedXDollars) + 1,
      canvasY(y),
      ctx.measureText(yText).width + 6,
      19,
      5,
      /*squaredCorner=*/ 1
    );

    ctx.fillStyle = "white";
    ctx.fillText(
      // Text on the bottom edge.
      xText,
      canvasX(x) + 2,
      canvasY(Money.from(0)) + 15
    );
    ctx.fillText(
      // Text on the right edge.
      yText,
      canvasX(maxRenderedXDollars) + 3,
      canvasY(y) + 15
    );

    ctx.restore();
  }

  /**
   *  Render the breakpoint chart.
   */
  function render() {
    if (!canvasEl || !ctx) return;
    ctx.save();
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    ctx.strokeStyle = "#666";
    renderBoundingBox();
    renderBreakPoints();
    ctx.strokeStyle = "#5cb85c";

    renderEarningsPoint(recipient.monthlyIndexedEarnings());

    if (lastMouseX_ > 0) {
      ctx.save();
      ctx.strokeStyle = "#337ab7";
      renderEarningsPoint(earningsX(lastMouseX_));
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
