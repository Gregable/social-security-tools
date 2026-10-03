import { describe, expect, it } from 'vitest';
import { deathAgeAxisRange, type PlotPoint } from '$lib/strategy/ui/plot-range';

/** One point per death age, filing at 62 through `fromAge`, then 70. */
function step(fromAge: number, toAge: number): PlotPoint[] {
  const points: PlotPoint[] = [];
  for (let deathAge = 62; deathAge <= 100; deathAge++) {
    let filingAgeMonths = 70 * 12;
    if (deathAge <= fromAge) filingAgeMonths = 62 * 12;
    else if (deathAge < toAge) filingAgeMonths = 66 * 12;
    points.push({ deathAge, filingAgeMonths });
  }
  return points;
}

describe('deathAgeAxisRange', () => {
  it('shows every bucket when the line is flat', () => {
    const flat = step(100, 101);
    expect(deathAgeAxisRange([flat], 62, 100)).toEqual({ min: 62, max: 100 });
  });

  it('frames where one line changes, with padding', () => {
    // Last death age at the minimum: 75. First at the maximum: 85.
    expect(deathAgeAxisRange([step(75, 85)], 62, 100)).toEqual({
      min: 70,
      max: 90,
    });
  });

  it('clamps the padding to the buckets', () => {
    expect(deathAgeAxisRange([step(63, 65)], 62, 66)).toEqual({
      min: 62,
      max: 66,
    });
  });

  it('frames the changes of every line together', () => {
    expect(deathAgeAxisRange([step(75, 85), step(70, 92)], 62, 100)).toEqual({
      min: 65,
      max: 97,
    });
  });

  it('ignores a flat line next to one that changes', () => {
    expect(deathAgeAxisRange([step(100, 101), step(75, 85)], 62, 100)).toEqual({
      min: 70,
      max: 90,
    });
  });

  it('skips gaps, where a line has no point', () => {
    const gappy: PlotPoint[] = [
      { deathAge: 70, filingAgeMonths: 62 * 12 },
      { deathAge: 80, filingAgeMonths: null },
      { deathAge: 90, filingAgeMonths: 70 * 12 },
    ];
    expect(deathAgeAxisRange([gappy], 62, 100)).toEqual({ min: 65, max: 95 });
  });

  it('shows every bucket when there are no points at all', () => {
    expect(deathAgeAxisRange([[]], 62, 100)).toEqual({ min: 62, max: 100 });
  });
});
