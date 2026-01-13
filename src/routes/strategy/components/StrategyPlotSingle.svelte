<script lang="ts">
  import { MonthDuration } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import type { CalculationResults } from "$lib/strategy/ui";
  import { onMount } from "svelte";

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

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let hoveredPoint: any = null;
  let selectedRowIndex: number | null = null;

  // Dimensions
  const width = 800;
  const height = 400;
  const padding = { top: 20, right: 60, bottom: 50, left: 100 };
  // Actual earliest filing age (for filtering invalid results)
  $: earliestFilingAge = recipient.birthdate.earliestFilingMonth().asMonths();
  // Y-axis display range with padding above and below
  const minFilingAge = 61 * 12 + 11; // 61 years 11 months
  const maxFilingAge = 70 * 12 + 1; // 70 years 1 month

  // Reactive Data
  $: rowBuckets = calculationResults.rowBuckets();

  // X-axis padding in years on each side of the interesting range
  const xAxisPadding = 2;

  /**
   * The data points to plot. Each point represents a death age bucket and the
   * corresponding optimal filing age.
   */
  $: strategyPoints = Array.from({ length: calculationResults.rows() })
    .map((_, i) => {
      const result = calculationResults.get(i, 0);
      if (!result) return null;
      // Filter out invalid results where no filing strategy was found (e.g. death before earliest filing age)
      if (result.filingAge1.asMonths() < earliestFilingAge) return null;
      return {
        deathAge: result.bucket1.startAge,
        filingAgeMonths: result.filingAge1.asMonths(),
        result,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  // Compute x-axis range based on where filing age varies
  $: xAxisRange = (() => {
    const bucketMin = rowBuckets[0].startAge;
    const bucketMax = rowBuckets[rowBuckets.length - 1].startAge;

    if (strategyPoints.length === 0) {
      return { min: bucketMin, max: bucketMax };
    }

    // Find the minimum and maximum filing ages in the data
    const filingAges = strategyPoints.map((p) => p.filingAgeMonths);
    const minFiling = Math.min(...filingAges);
    const maxFiling = Math.max(...filingAges);

    // If filing age is constant (flat line), show full range
    if (minFiling === maxFiling) {
      return { min: bucketMin, max: bucketMax };
    }

    // Find the last death age where filing age is at minimum
    // (filing age typically stays at minimum for early death ages, then increases)
    let minFilingDeathAge = strategyPoints[0].deathAge;
    for (const p of strategyPoints) {
      if (p.filingAgeMonths === minFiling) {
        minFilingDeathAge = p.deathAge;
      }
    }

    // Find the first death age where filing age reaches maximum
    let maxFilingDeathAge = strategyPoints[strategyPoints.length - 1].deathAge;
    for (const p of strategyPoints) {
      if (p.filingAgeMonths === maxFiling) {
        maxFilingDeathAge = p.deathAge;
        break;
      }
    }

    // Add padding and clamp to valid bucket range
    return {
      min: Math.max(bucketMin, minFilingDeathAge - xAxisPadding),
      max: Math.min(bucketMax, maxFilingDeathAge + xAxisPadding),
    };
  })();

  $: minDeathAge = xAxisRange.min;
  $: maxDeathAge = xAxisRange.max;

  $: mortalityPoints = (() => {
    if (deathProbDistribution.length === 0) return [];

    const currentAge = deathProbDistribution[0].age;
    const startAge = Math.max(currentAge, 62);

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
    const yTicks = [62, 63, 64, 65, 66, 67, 68, 69, 70]
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
    ctx.fillText(`Optimal Filing ${displayAsAges ? "Age" : "Date"}`, 0, 0);
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

    if (strategyPoints.length > 0) {
      ctx.strokeStyle = "#005ea5";
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      strategyPoints.forEach((d, i) => {
        const x = xScale(d.deathAge);
        const y = yScale(d.filingAgeMonths);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.fillStyle = "#005ea5";
      // Only draw points if we don't have too many, otherwise it looks cluttered
      if (strategyPoints.length < 50) {
        strategyPoints.forEach((d) => {
          const x = xScale(d.deathAge);
          const y = yScale(d.filingAgeMonths);
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
    ctx.restore();

    // Draw selected point (if any) with distinct "pinned" styling
    if (selectedRowIndex !== null && strategyPoints[selectedRowIndex]) {
      const selectedPoint = strategyPoints[selectedRowIndex];
      const sx = xScale(selectedPoint.deathAge);
      const sy = yScale(selectedPoint.filingAgeMonths);

      // Interpolate cumulative probability for selected point
      let selectedProb: number | null = null;
      const floorAge = Math.floor(selectedPoint.deathAge);
      const ceilAge = Math.ceil(selectedPoint.deathAge);

      const p1 = mortalityPoints.find((d) => d.age === floorAge);
      const p2 = mortalityPoints.find((d) => d.age === ceilAge);

      if (p1 && p2) {
        if (p1.age === p2.age) {
          selectedProb = p1.cumulativeProb;
        } else {
          const ratio = (selectedPoint.deathAge - p1.age) / (p2.age - p1.age);
          selectedProb =
            p1.cumulativeProb + ratio * (p2.cumulativeProb - p1.cumulativeProb);
        }
      } else if (p1) {
        selectedProb = p1.cumulativeProb;
      } else if (p2) {
        selectedProb = p2.cumulativeProb;
      }

      let topY = sy;
      let probY = 0;
      if (selectedProb !== null) {
        probY = yScaleRight(selectedProb);
        topY = Math.min(sy, probY);
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

      // Horizontal line for filing age (left axis to point)
      ctx.beginPath();
      ctx.moveTo(padding.left, sy);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      // Horizontal line for cumulative probability (point to right axis)
      if (selectedProb !== null && selectedPoint.deathAge <= 100) {
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

      // Draw selected point circle with golden glow
      ctx.fillStyle = "#fff8dc";
      ctx.strokeStyle = "#d4a000";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner circle
      ctx.fillStyle = "#005ea5";
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (hoveredPoint) {
      const x = xScale(hoveredPoint.deathAge);
      const y = yScale(hoveredPoint.filingAgeMonths);

      // Interpolate cumulative probability
      let interpolatedProb: number | null = null;
      const floorAge = Math.floor(hoveredPoint.deathAge);
      const ceilAge = Math.ceil(hoveredPoint.deathAge);

      const p1 = mortalityPoints.find((d) => d.age === floorAge);
      const p2 = mortalityPoints.find((d) => d.age === ceilAge);

      if (p1 && p2) {
        if (p1.age === p2.age) {
          interpolatedProb = p1.cumulativeProb;
        } else {
          const ratio = (hoveredPoint.deathAge - p1.age) / (p2.age - p1.age);
          interpolatedProb =
            p1.cumulativeProb + ratio * (p2.cumulativeProb - p1.cumulativeProb);
        }
      } else if (p1) {
        interpolatedProb = p1.cumulativeProb;
      } else if (p2) {
        interpolatedProb = p2.cumulativeProb;
      }

      let topY = y;
      let probY = 0;
      if (interpolatedProb !== null) {
        probY = yScaleRight(interpolatedProb);
        topY = Math.min(y, probY);
      }

      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical line from highest point
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();

      // Horizontal line for filing age
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.fillStyle = "white";
      ctx.strokeStyle = "#005ea5";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(x - 25, height - padding.bottom + 10, 50, 20);

      ctx.fillStyle = "#000";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";

      // Format death age for display (e.g. 85y5m)
      const years = Math.floor(hoveredPoint.deathAge);
      const months = Math.round((hoveredPoint.deathAge - years) * 12);
      const label = months === 0 ? `${years}` : `${years}y${months}m`;

      ctx.fillText(label, x, height - padding.bottom + 20);

      // Y Axis Label Highlight
      const yLabel = displayAsAges
        ? formatAge(hoveredPoint.filingAgeMonths)
        : formatDate(hoveredPoint.filingAgeMonths);

      ctx.textAlign = "right";
      const textWidth = ctx.measureText(yLabel).width;

      // Background
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(padding.left - textWidth - 15, y - 10, textWidth + 10, 20);

      // Text
      ctx.fillStyle = "#000";
      ctx.fillText(yLabel, padding.left - 10, y);

      // Cumulative Probability Crosshair
      if (interpolatedProb !== null && hoveredPoint.deathAge <= 100) {
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
      strategyPoints &&
      mortalityPoints &&
      displayAsAges !== undefined &&
      ctx
    ) {
      draw();
    }
  }

  function handleMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (width / rect.width);
    const age = invertXScale(x);

    if (strategyPoints.length > 0) {
      const closest = strategyPoints.reduce((prev, curr) => {
        return Math.abs(curr.deathAge - age) < Math.abs(prev.deathAge - age)
          ? curr
          : prev;
      });
      hoveredPoint = closest;
    } else {
      hoveredPoint = null;
    }
    requestAnimationFrame(draw);
  }

  function handleMouseLeave() {
    hoveredPoint = null;
    requestAnimationFrame(draw);
  }

  function handleClick(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (width / rect.width);
    const age = invertXScale(x);

    if (strategyPoints.length > 0) {
      // Find closest point
      let closestIndex = 0;
      let closestDist = Infinity;
      strategyPoints.forEach((p, i) => {
        const dist = Math.abs(p.deathAge - age);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = i;
        }
      });

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
  <div class="header-section">
    <div class="header-content">
      <h3>
        Optimal Strategy: Filing <span
          class:active={!displayAsAges}
          class:inactive={displayAsAges}>Date</span
        ><label class="toggle-label">
          <input
            type="checkbox"
            bind:checked={displayAsAges}
            class="toggle-checkbox"
          />
          <span class="toggle-slider"></span>
        </label><span
          class:active={displayAsAges}
          class:inactive={!displayAsAges}>Age</span
        >
      </h3>
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

<style>
  .result-box {
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .header-section {
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
  }

  .header-content h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    flex-shrink: 0;
    margin: 0 0.25rem;
  }

  .active {
    font-weight: bold;
    color: #007bff;
  }

  .inactive {
    font-weight: normal;
    color: #999;
    opacity: 0.7;
  }

  .toggle-checkbox {
    display: none;
  }

  .toggle-slider {
    position: relative;
    width: 40px;
    height: 20px;
    background-color: #ccc;
    border-radius: 20px;
    transition: background-color 0.3s ease;
  }

  .toggle-slider::before {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
  }

  .toggle-checkbox:checked + .toggle-slider {
    background-color: #007bff;
  }

  .toggle-checkbox:checked + .toggle-slider::before {
    transform: translateX(20px);
  }

  .chart-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }
</style>
