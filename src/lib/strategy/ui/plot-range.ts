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
 * The interesting part of the chart is where the lines change: from the last
 * death age before any line first changes to the death age of the last
 * change in any line. A single-mode line typically climbs once, from its
 * minimum for early deaths to its maximum for late ones; a widowed-mode own
 * benefit line can climb and then fall back. This frames that span, plus
 * `padding` years either side, within the buckets. Gaps are skipped. When no
 * line changes, there is nothing to frame and every bucket is shown.
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
    let previous: PlotPoint | null = null;
    for (const point of line) {
      if (point.filingAgeMonths === null) continue;
      if (
        previous !== null &&
        point.filingAgeMonths !== previous.filingAgeMonths
      ) {
        min = Math.min(min, previous.deathAge - padding);
        max = Math.max(max, point.deathAge + padding);
      }
      previous = point;
    }
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
