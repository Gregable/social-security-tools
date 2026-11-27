import { describe, expect, it } from 'vitest';

import type { ChartLayout } from '$lib/components/chart-utils';
import {
  fitsAbove,
  hoverPhase,
  lineLabel,
  lineLabelsCollide,
  overlaps,
} from '$lib/components/filing-date-chart-labels';
import { MonthDate } from '$lib/month-time';

// The chart area of this layout runs from y = 120 down to the $0 line at
// y = 412.
const layout: ChartLayout = {
  canvasWidth: 620,
  canvasHeight: 420,
  reservedLeft: 70,
  reservedTop: 120,
  reservedBottom: 8,
};

function month(years: number, months: number): MonthDate {
  return MonthDate.initFromYearsMonths({ years, months });
}

describe('hoverPhase', () => {
  const filingDate = month(2051, 9);

  it('is before-filing for a month earlier than the filing date', () => {
    expect(hoverPhase(filingDate, month(2051, 8))).toBe('before-filing');
  });

  it('is filing-month for the filing date itself', () => {
    expect(hoverPhase(filingDate, month(2051, 9))).toBe('filing-month');
  });

  it('is after-filing for a month later than the filing date', () => {
    expect(hoverPhase(filingDate, month(2051, 10))).toBe('after-filing');
  });
});

describe('lineLabel', () => {
  it('ends at the same height whatever the length of the text', () => {
    const short = lineLabel(300, 60, layout);
    const long = lineLabel(300, 150, layout);
    expect(long.bounds.top).toBe(short.bounds.top);
    expect(long.bounds.bottom - short.bounds.bottom).toBe(90);
  });

  it('keeps a month and year within the band under the slider', () => {
    expect(lineLabel(300, 60, layout).bounds.bottom).toBeLessThanOrEqual(
      layout.reservedTop
    );
  });

  it('is centered on its line', () => {
    const { bounds } = lineLabel(300, 60, layout);
    expect(bounds.left).toBeLessThan(300);
    expect(bounds.right).toBeGreaterThan(300);
  });
});

describe('fitsAbove', () => {
  const label = lineLabel(300, 150, layout);

  it('accepts a label that ends well above what is beneath it', () => {
    expect(fitsAbove(label, label.bounds.bottom + 24)).toBe(true);
  });

  it('rejects a label that would crowd what is beneath it', () => {
    expect(fitsAbove(label, label.bounds.bottom + 23)).toBe(false);
  });
});

describe('lineLabelsCollide', () => {
  it('is true exactly when the labels of the two lines would overlap', () => {
    for (const distance of [0, 10, 18, 20, 21, 22, 40]) {
      const a = lineLabel(300, 60, layout);
      const b = lineLabel(300 + distance, 60, layout);
      if (overlaps(a.bounds, b.bounds)) {
        expect(lineLabelsCollide(300, 300 + distance)).toBe(true);
      }
    }
    expect(lineLabelsCollide(300, 340)).toBe(false);
    expect(lineLabelsCollide(340, 300)).toBe(false);
    expect(lineLabelsCollide(300, 310)).toBe(true);
    expect(lineLabelsCollide(310, 300)).toBe(true);
  });
});
