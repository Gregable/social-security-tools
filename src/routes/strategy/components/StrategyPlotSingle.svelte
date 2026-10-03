<script lang="ts">
  import { filedBeforeDeath } from "$lib/benefit-calculator";
  import HowToReadChart from "$lib/components/HowToReadChart.svelte";
  import { MonthDuration } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import {
    type CalculationResults,
    NEVER_FILES_LABEL,
    type StrategyResult,
  } from "$lib/strategy/ui";
  import {
    deathAgeAxisRange,
    type PlotSeries,
  } from "$lib/strategy/ui/plot-range";
  import { onMount } from "svelte";

  /** The single mode line: the optimal filing age. */
  const OWN_FILING_SERIES: PlotSeries = {
    label: "Optimal filing",
    color: "#005ea5",
    filingAgeOf: (result) => result.filingAge1,
  };

  /** The recipient for whom the strategy is calculated. */
  export let recipient: Recipient;
  /** The results of the strategy calculation. */
  export let calculationResults: CalculationResults;
  /** The death probability distribution for the recipient.
   *  Must be sorted by age. */
  export let deathProbDistribution: { age: number; probability: number }[];
  /** Whether to display the filing date as an age (true) or a calendar date
   * (false). */
  export let displayAsAges: boolean;
  /** Callback when a point is selected (clicked). */
  export let onselectpoint:
    | ((detail: { rowIndex: number }) => void)
    | undefined = undefined;
  /**
   * The lines to draw. Single mode draws one, the optimal filing age;
   * widowed mode draws one per benefit and gets a legend.
   */
  export let series: PlotSeries[] = [OWN_FILING_SERIES];
  /** The youngest filing age the y-axis must show, in months. */
  export let minFilingAgeMonths: number = 62 * 12;
  /** Widowed mode: explain the two lines rather than the one. */
  export let widowed: boolean = false;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let hoveredIndex: number | null = null;
  let selectedRowIndex: number | null = null;

  // Sync local crosshair selection with parent selection so external
  // clears (e.g. "Back to chart") drop the crosshair too.
  $: {
    const sel = calculationResults.getSelectedCell();
    const externalIdx = sel ? sel.row : null;
    if (externalIdx !== selectedRowIndex) {
      selectedRowIndex = externalIdx;
      if (ctx) requestAnimationFrame(draw);
    }
  }

  // Dimensions
  const width = 800;
  const height = 400;
  const padding = { top: 20, right: 60, bottom: 50, left: 100 };
  // Y-axis display range, with a month of padding below and above.
  $: minFilingAge = minFilingAgeMonths - 1;
  const maxFilingAge = 70 * 12 + 1; // 70 years 1 month

  // Reactive Data
  $: rowBuckets = calculationResults.rowBuckets();

  // X-axis padding in years on each side of the interesting range
  const xAxisPadding = 5;

  /**
   * One row per death age bucket. No filtering on filing age here: this
   * used to drop any point below the earliest filing age, which silently
   * swallowed the optimizer's "file at age 0" sentinel and left the chart
   * blank with no error. Buckets now start at the first death age that
   * admits a filing, and the optimizer throws rather than inventing an
   * answer, so any row reaching here is real.
   */
  $: rows = Array.from({ length: calculationResults.rows() })
    .map((_, i) => calculationResults.get(i, 0))
    .filter((result): result is StrategyResult => result !== undefined)
    .map((result) => ({ deathAge: result.bucket1.startAge, result }));

  /** Per series, the filing age in months at each row, or null for a gap. */
  $: seriesPoints = series.map((s) =>
    rows.map(({ deathAge, result }) => ({
      deathAge,
      filingAgeMonths: s.filingAgeOf(result)?.asMonths() ?? null,
    }))
  );

  $: xAxisRange =
    rowBuckets.length === 0
      ? { min: 62, max: 100 }
      : deathAgeAxisRange(
          seriesPoints,
          rowBuckets[0].startAge,
          rowBuckets[rowBuckets.length - 1].startAge,
          xAxisPadding
        );

  $: minDeathAge = xAxisRange.min;
  $: maxDeathAge = xAxisRange.max;

  $: mortalityPoints = (() => {
    if (deathProbDistribution.length === 0) return [];

    const currentAge = deathProbDistribution[0].age;
    const startAge = Math.max(currentAge, Math.floor(minFilingAgeMonths / 12));

    // Filter to relevant ages
    const relevantDist = deathProbDistribution.filter((d) => d.age >= startAge);

    if (relevantDist.length === 0) return [];

    // Calculate total probability mass for normalization to ensure we reach 100%
    // since we are conditioning on reaching startAge.
    const totalProbability = relevantDist.reduce(
      (acc, d) => acc + d.probability,
      0
    );

    let sum = 0;
    // Start with 0 probability at the startAge
    const points = [{ age: startAge, cumulativeProb: 0 }];

    relevantDist.forEach((d) => {
      sum += d.probability;
      // The probability applies to the year following the birthday, so the
      // cumulative probability is reached at the next birthday.
      const normalizedProb = totalProbability > 0 ? sum / totalProbability : 0;
      points.push({ age: d.age + 1, cumulativeProb: normalizedProb });
    });

    return points;
  })();

  // Scales
  function xScale(deathAge: number) {
    if (maxDeathAge === minDeathAge) return padding.left;
    return (
      padding.left +
      ((deathAge - minDeathAge) / (maxDeathAge - minDeathAge)) *
        (width - padding.left - padding.right)
    );
  }

  function yScale(filingAgeMonths: number) {
    return (
      height -
      padding.bottom -
      ((filingAgeMonths - minFilingAge) / (maxFilingAge - minFilingAge)) *
        (height - padding.top - padding.bottom)
    );
  }

  function yScaleRight(probability: number) {
    return (
      height -
      padding.bottom -
      probability * (height - padding.top - padding.bottom)
    );
  }

  function invertXScale(x: number) {
    const plotWidth = width - padding.left - padding.right;
    const relativeX = x - padding.left;
    const ratio = Math.max(0, Math.min(1, relativeX / plotWidth));
    return minDeathAge + ratio * (maxDeathAge - minDeathAge);
  }

  // Formatters
  function formatAge(months: number): string {
    const years = Math.floor(months / 12);
    const m = months % 12;
    return m === 0 ? `${years}` : `${years}m${m}`;
  }

  function formatDate(months: number): string {
    const date = recipient.birthdate.dateAtSsaAge(new MonthDuration(months));
    const d = new Date(date.year(), date.monthIndex());
    return d.toLocaleString("default", { month: "short", year: "numeric" });
  }

  /**
   * Axis label for a filing age at one row. A filing month in or after the
   * death month is the "never files" strategy, not a filing month.
   */
  function formatFiling(filingAgeMonths: number, result: StrategyResult): string {
    const filingDate = recipient.birthdate.dateAtSsaAge(
      new MonthDuration(filingAgeMonths)
    );
    const deathDate = recipient.birthdate.dateAtLayAge(
      result.bucket1.expectedAge
    );
    if (!filedBeforeDeath(filingDate, deathDate)) {
      return NEVER_FILES_LABEL;
    }
    return displayAsAges
      ? formatAge(filingAgeMonths)
      : formatDate(filingAgeMonths);
  }

  /** The cumulative death probability at a death age, interpolated. */
  function cumulativeProbabilityAt(deathAge: number): number | null {
    const p1 = mortalityPoints.find((d) => d.age === Math.floor(deathAge));
    const p2 = mortalityPoints.find((d) => d.age === Math.ceil(deathAge));
    if (p1 && p2) {
      if (p1.age === p2.age) return p1.cumulativeProb;
      const ratio = (deathAge - p1.age) / (p2.age - p1.age);
      return p1.cumulativeProb + ratio * (p2.cumulativeProb - p1.cumulativeProb);
    }
    if (p1) return p1.cumulativeProb;
    if (p2) return p2.cumulativeProb;
    return null;
  }

  /** The y positions of every series with a point at `index`. */
  function pointsAt(index: number): { y: number; color: string; filingAgeMonths: number }[] {
    const out: { y: number; color: string; filingAgeMonths: number }[] = [];
    seriesPoints.forEach((points, s) => {
      const filingAgeMonths = points[index]?.filingAgeMonths;
      if (filingAgeMonths === null || filingAgeMonths === undefined) return;
      out.push({ y: yScale(filingAgeMonths), color: series[s].color, filingAgeMonths });
    });
    return out;
  }

  // Draw Loop
  function draw() {
    if (!ctx || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, width, height);

    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Y Axis Ticks
    const yTicks = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70]
      .map((y) => y * 12)
      .filter((m) => m >= minFilingAge);
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    yTicks.forEach((tick) => {
      const y = yScale(tick);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = "#005ea5";
      ctx.textAlign = "right";
      ctx.fillText(
        displayAsAges ? formatAge(tick) : formatDate(tick),
        padding.left - 10,
        y
      );
    });

    // X Axis Ticks (Death Ages - Every Even Year)
    const xTicks = [];
    if (maxDeathAge > minDeathAge) {
      for (
        let age = Math.ceil(minDeathAge);
        age <= Math.floor(maxDeathAge);
        age++
      ) {
        if (age % 2 === 0) xTicks.push(age);
      }
    }

    ctx.strokeStyle = "black";
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();

    ctx.fillStyle = "#666";
    ctx.textAlign = "center";
    xTicks.forEach((tick) => {
      const x = xScale(tick);
      ctx.fillText(tick.toString(), x, height - padding.bottom + 20);
    });

    ctx.fillStyle = "black";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("Death Age", width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(
      `${widowed ? "Start" : "Optimal Filing"} ${displayAsAges ? "Age" : "Date"}`,
      0,
      0
    );
    ctx.restore();

    // Right Y Axis (Cumulative Probability)
    const rightYTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    ctx.strokeStyle = "black";
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - padding.right, padding.top);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    ctx.fillStyle = "#dc3545";
    ctx.textAlign = "left";
    rightYTicks.forEach((tick) => {
      const y = yScaleRight(tick);
      ctx.beginPath();
      ctx.moveTo(width - padding.right, y);
      ctx.lineTo(width - padding.right + 5, y);
      ctx.stroke();
      ctx.fillText(`${Math.round(tick * 100)}%`, width - padding.right + 10, y);
    });

    ctx.save();
    ctx.translate(width - 15, height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "black";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Cumulative Death Probability", 0, 0);
    ctx.restore();

    // Clip drawing area for lines
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      padding.left,
      padding.top,
      width - padding.left - padding.right,
      height - padding.top - padding.bottom
    );
    ctx.clip();

    // Plot Cumulative Probability Line
    if (mortalityPoints.length > 0) {
      ctx.strokeStyle = "#dc3545"; // Red color
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();

      let started = false;
      for (const d of mortalityPoints) {
        if (d.age > 100) break;
        const x = xScale(d.age);
        const y = yScaleRight(d.cumulativeProb);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // One line per series, broken wherever the series has no point.
    seriesPoints.forEach((points, s) => {
      ctx.strokeStyle = series[s].color;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      let penDown = false;
      for (const p of points) {
        if (p.filingAgeMonths === null) {
          penDown = false;
          continue;
        }
        const x = xScale(p.deathAge);
        const y = yScale(p.filingAgeMonths);
        if (penDown) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        penDown = true;
      }
      ctx.stroke();
    });
    ctx.restore();

    // Draw selected point (if any) with distinct "pinned" styling
    const selectedRow =
      selectedRowIndex !== null ? rows[selectedRowIndex] : undefined;
    if (selectedRowIndex !== null && selectedRow) {
      const sx = xScale(selectedRow.deathAge);
      const marks = pointsAt(selectedRowIndex);
      const selectedProb = cumulativeProbabilityAt(selectedRow.deathAge);

      let topY = marks.length > 0 ? Math.min(...marks.map((m) => m.y)) : height - padding.bottom;
      let probY = 0;
      if (selectedProb !== null) {
        probY = yScaleRight(selectedProb);
        topY = Math.min(topY, probY);
      }

      // Draw persistent crosshairs for selected point
      ctx.strokeStyle = "#d4a000";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      // Vertical line from highest point down to x-axis
      ctx.beginPath();
      ctx.moveTo(sx, topY);
      ctx.lineTo(sx, height - padding.bottom);
      ctx.stroke();

      // Horizontal line for each filing age (left axis to point)
      for (const mark of marks) {
        ctx.beginPath();
        ctx.moveTo(padding.left, mark.y);
        ctx.lineTo(sx, mark.y);
        ctx.stroke();
      }

      // Horizontal line for cumulative probability (point to right axis)
      if (selectedProb !== null && selectedRow.deathAge <= 100) {
        ctx.beginPath();
        ctx.moveTo(sx, probY);
        ctx.lineTo(width - padding.right, probY);
        ctx.stroke();

        // Draw point on mortality line
        ctx.fillStyle = "#fff8dc";
        ctx.strokeStyle = "#d4a000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, probY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner circle for mortality point
        ctx.fillStyle = "#dc3545";
        ctx.beginPath();
        ctx.arc(sx, probY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw selected point circles with golden glow
      for (const mark of marks) {
        ctx.fillStyle = "#fff8dc";
        ctx.strokeStyle = "#d4a000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, mark.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner circle
        ctx.fillStyle = mark.color;
        ctx.beginPath();
        ctx.arc(sx, mark.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const hoveredRow = hoveredIndex !== null ? rows[hoveredIndex] : undefined;
    if (hoveredIndex !== null && hoveredRow) {
      const x = xScale(hoveredRow.deathAge);
      const marks = pointsAt(hoveredIndex);
      const interpolatedProb = cumulativeProbabilityAt(hoveredRow.deathAge);

      let topY = marks.length > 0 ? Math.min(...marks.map((m) => m.y)) : height - padding.bottom;
      let probY = 0;
      if (interpolatedProb !== null) {
        probY = yScaleRight(interpolatedProb);
        topY = Math.min(topY, probY);
      }

      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical line from highest point
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();

      // Horizontal line for each filing age
      for (const mark of marks) {
        ctx.beginPath();
        ctx.moveTo(padding.left, mark.y);
        ctx.lineTo(x, mark.y);
        ctx.stroke();
      }

      for (const mark of marks) {
        ctx.fillStyle = "white";
        ctx.strokeStyle = mark.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(x, mark.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(x - 25, height - padding.bottom + 10, 50, 20);

      ctx.fillStyle = "#000";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";

      // Format death age for display (e.g. 85y5m)
      const years = Math.floor(hoveredRow.deathAge);
      const months = Math.round((hoveredRow.deathAge - years) * 12);
      const label = months === 0 ? `${years}` : `${years}y${months}m`;

      ctx.fillText(label, x, height - padding.bottom + 20);

      // Y Axis Label Highlight, one per line
      ctx.textAlign = "right";
      for (const mark of marks) {
        const yLabel = formatFiling(mark.filingAgeMonths, hoveredRow.result);
        const textWidth = ctx.measureText(yLabel).width;

        // Background
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(
          padding.left - textWidth - 15,
          mark.y - 10,
          textWidth + 10,
          20
        );

        // Text; the colored marker on the line carries which one it is.
        ctx.fillStyle = "#000";
        ctx.fillText(yLabel, padding.left - 10, mark.y);
      }

      // Cumulative Probability Crosshair
      if (interpolatedProb !== null && hoveredRow.deathAge <= 100) {
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(x, probY);
        ctx.lineTo(width - padding.right, probY);
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.strokeStyle = "#dc3545";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(x, probY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right Axis Label Highlight
        const probLabel = `${(interpolatedProb * 100).toFixed(1)}%`;
        ctx.textAlign = "left";
        const probTextWidth = ctx.measureText(probLabel).width;

        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(
          width - padding.right + 5,
          probY - 10,
          probTextWidth + 10,
          20
        );

        ctx.fillStyle = "#000";
        ctx.fillText(probLabel, width - padding.right + 10, probY);
      }
    }
  }

  $: {
    if (
      seriesPoints &&
      mortalityPoints &&
      displayAsAges !== undefined &&
      minFilingAge !== undefined &&
      ctx
    ) {
      draw();
    }
  }

  /** The row whose death age is closest to the pointer. */
  function closestRowIndex(e: MouseEvent): number | null {
    if (rows.length === 0) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (width / rect.width);
    const age = invertXScale(x);
    let closestIndex = 0;
    let closestDist = Infinity;
    rows.forEach((row, i) => {
      const dist = Math.abs(row.deathAge - age);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });
    return closestIndex;
  }

  function handleMouseMove(e: MouseEvent) {
    hoveredIndex = closestRowIndex(e);
    requestAnimationFrame(draw);
  }

  function handleMouseLeave() {
    hoveredIndex = null;
    requestAnimationFrame(draw);
  }

  function handleClick(e: MouseEvent) {
    const closestIndex = closestRowIndex(e);
    if (closestIndex !== null) {
      // Toggle selection: if clicking on already selected, deselect
      if (selectedRowIndex === closestIndex) {
        selectedRowIndex = null;
        onselectpoint?.(null);
      } else {
        selectedRowIndex = closestIndex;
        onselectpoint?.({ rowIndex: closestIndex });
      }
    }
    requestAnimationFrame(draw);
  }

  onMount(() => {
    ctx = canvas.getContext("2d");
    draw();
  });
</script>

<div class="result-box">
  <header class="section-header">
    <p class="section-kicker">How death age shapes the strategy</p>
  </header>
  {#if widowed}
    <p class="lede">
      Every death age has its own best timing for your two benefits. The
      <strong>Recommended filing</strong> above picks the plan that works best
      across all of them; below, see what would be best at each specific age.
    </p>
    <p class="caption">
      Each colored line shows when to start one benefit for each possible
      death age. A gap means that benefit is never the larger one, so it is
      not needed at that age. The red line shows your cumulative probability
      of dying by that age.
      <strong class="hint">Click the chart</strong> to see the full plan for a
      specific death age.
    </p>
  {:else}
    <p class="lede">
      Every death age has its own optimal filing. The
      <strong>Recommended Filing</strong> above picks a single strategy that
      works well across all of them; below, see what would be optimal at each
      specific age.
    </p>
    <p class="caption">
      The blue line shows the optimal filing {displayAsAges
        ? "age"
        : "date"} for each possible death age; the red line shows your cumulative
      probability of dying by that age.
      <strong class="hint">Click the chart</strong> to see the full filing
      breakdown for a specific death age.
    </p>
  {/if}
  <HowToReadChart>
    <ul>
      <li>
        <strong>X-axis (Death Age):</strong> a hypothetical age you live to.
      </li>
      {#if widowed}
        {#each series as s}
          <li>
            <strong style:color={s.color}>{s.label} (left axis):</strong> when
            to start it to maximize your lifetime benefits <em>if</em> you knew
            you'd live exactly to that death age.
          </li>
        {/each}
      {:else}
        <li>
          <strong>Blue line (left axis):</strong> the filing {displayAsAges
            ? "age"
            : "date"} that would have maximized your lifetime benefits
          <em>if</em> you knew you'd live exactly to that death age.
        </li>
      {/if}
      <li>
        <strong>Red line (right axis):</strong> cumulative probability
        you've died by that age. Steeper means a larger fraction of
        outcomes fall in that range.
      </li>
      <li>
        <span class="hover-only"
          ><strong>Hover the chart</strong> to see the values at each death
          age.</span
        >
        <span class="touch-only"
          ><strong>Tap the chart</strong> to see the values at each death age.</span
        >
      </li>
    </ul>
    {#if widowed}
      <p>
        <strong>Takeaway:</strong> a short life favors starting benefits
        early; a long one favors letting the benefit you will end on grow.
        The Recommended filing picks the best plan across the whole
        distribution, weighted by how likely each lifespan is.
      </p>
    {:else}
      <p>
        <strong>Takeaway:</strong> short lifespans favor filing early; long
        lifespans favor delaying. The Recommended Filing picks the best
        single date across the whole distribution, weighted by how likely
        each lifespan is.
      </p>
    {/if}
  </HowToReadChart>

  <div class="chart-block">
    <div class="chart-toolbar">
      {#if series.length > 1}
        <ul class="legend" aria-label="Chart lines">
          {#each series as s}
            <li>
              <span class="swatch" style:background-color={s.color}></span>
              {s.label}
            </li>
          {/each}
        </ul>
      {/if}
      <span class="toolbar-label">Display filing as</span>
      <div class="segmented" role="group" aria-label="Display filing as">
        <button
          type="button"
          class="seg"
          class:active={!displayAsAges}
          on:click={() => (displayAsAges = false)}
        >
          Date
        </button>
        <button
          type="button"
          class="seg"
          class:active={displayAsAges}
          on:click={() => (displayAsAges = true)}
        >
          Age
        </button>
      </div>
    </div>

    <div class="chart-container">
      <canvas
        bind:this={canvas}
        on:mousemove={handleMouseMove}
        on:mouseleave={handleMouseLeave}
        on:click={handleClick}
        style="width: 100%; height: auto; cursor: crosshair;"
      ></canvas>
    </div>
  </div>
</div>

<style>
  .touch-only {
    display: none;
  }
  @media (hover: none) {
    .hover-only {
      display: none;
    }
    .touch-only {
      display: inline;
    }
  }

  .result-box {
    max-width: 800px;
    margin: 0.75rem auto 2rem;
  }

  .section-header {
    padding-bottom: 0.5rem;
    margin-bottom: 0.6rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-kicker {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .lede {
    margin: 0.6rem 0 0;
    font-size: 0.95rem;
    color: #1f2937;
    line-height: 1.5;
  }

  .caption {
    margin: 0.35rem 0 0;
    font-size: 0.85rem;
    color: #6b7280;
    line-height: 1.5;
  }

  .caption .hint {
    color: #081d88;
    font-weight: 600;
  }

  .chart-block {
    margin-top: 1.5rem;
  }

  .chart-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.65rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1rem;
    margin: 0 auto 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.85rem;
    color: #1f2937;
  }

  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .swatch {
    display: inline-block;
    width: 18px;
    height: 4px;
    border-radius: 2px;
  }

  .toolbar-label {
    font-size: 0.78rem;
    color: #6b7280;
    font-weight: 500;
  }

  .segmented {
    display: inline-flex;
    background: #eef1f5;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 3px;
    flex-shrink: 0;
  }

  .seg {
    font: inherit;
    border: none;
    background: transparent;
    color: #4b5563;
    padding: 0.35rem 0.9rem;
    font-size: 0.88rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .seg:hover:not(.active) {
    color: #081d88;
  }

  .seg.active {
    background: #ffffff;
    color: #081d88;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(11, 17, 48, 0.08);
  }

  .seg:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 2px;
  }

  .chart-container {
    width: 100%;
    max-width: 800px;
    margin: 1rem auto 0;
  }
</style>
