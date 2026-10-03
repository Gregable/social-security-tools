import type { MonthDuration } from '$lib/month-time';
import type { StrategyResult } from './calculation-results.js';

/** One point of a filing-age-by-death-age line; null leaves a gap. */
export interface PlotPoint {
  readonly deathAge: number;
  readonly filingAgeMonths: number | null;
}

/**
 * The death-age range a filing-age chart should show.
 *
 * Optimal filing ages typically sit at their minimum for early deaths and
 * climb to their maximum for late ones, so the interesting part of the chart
 * is between the last death age where a line is at its minimum and the
 * first where it reaches its maximum. This frames that span for every line
 * that changes, plus `padding` years either side, within the buckets. When
 * no line changes, there is nothing to frame and every bucket is shown.
 */
export function deathAgeAxisRange(
  series: readonly (readonly PlotPoint[])[],
  bucketMin: number,
  bucketMax: number,
  padding: number = 5
): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const line of series) {
    const points = line.filter(
      (p): p is { deathAge: number; filingAgeMonths: number } =>
        p.filingAgeMonths !== null
    );
    if (points.length === 0) continue;
    const ages = points.map((p) => p.filingAgeMonths);
    const lowest = Math.min(...ages);
    const highest = Math.max(...ages);
    if (lowest === highest) continue;

    let lastAtLowest = points[0].deathAge;
    for (const p of points) {
      if (p.filingAgeMonths === lowest) lastAtLowest = p.deathAge;
    }
    const firstAtHighest =
      points.find((p) => p.filingAgeMonths === highest)?.deathAge ??
      points[points.length - 1].deathAge;

    min = Math.min(min, lastAtLowest - padding);
    max = Math.max(max, firstAtHighest + padding);
  }

  if (min === Number.POSITIVE_INFINITY)
    return { min: bucketMin, max: bucketMax };
  return { min: Math.max(bucketMin, min), max: Math.min(bucketMax, max) };
}

/** One line on a filing-age-by-death-age chart. */
export interface PlotSeries {
  /** Names the line in the legend and in the hover readout. */
  readonly label: string;
  readonly color: string;
  /** The filing age the line shows for one death age, or null for a gap. */
  readonly filingAgeOf: (result: StrategyResult) => MonthDuration | null;
}
