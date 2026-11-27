import { describe, expect, it } from 'vitest';

import { benefitOnDateNominal } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import type { ChartLayout } from '$lib/components/chart-utils';
import {
  placeFilingDateLabel,
  renderFilingDateLabel,
  renderFilingDateLine,
  selectedDateLabelText,
} from '$lib/components/filing-date-chart-annotations';
import {
  canvasX,
  canvasY,
  maxRenderedYDollars,
} from '$lib/components/filing-date-chart-math';
import { renderYearVerticalLines } from '$lib/components/filing-date-chart-renderer';
import { Money } from '$lib/money';
import type { MonthDate } from '$lib/month-time';
import { MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { asCanvasContext, recordingContext } from './recording-context';

// The chart area of this layout runs from y = 120 down to the $0 line at
// y = 412. The recording context measures text at 7px per character.
const layout: ChartLayout = {
  canvasWidth: 620,
  canvasHeight: 420,
  reservedLeft: 70,
  reservedTop: 120,
  reservedBottom: 8,
};

// Born in October 1984: age 62 is October 2046, and normal retirement age
// (67) is October 2051.
function recipientBornOct1984(): Recipient {
  const recipient = new Recipient();
  recipient.birthdate = Birthdate.FromYMD(1984, 9, 15);
  recipient.setPia(Money.from(2135));
  return recipient;
}

function dateAtAge(
  recipient: Recipient,
  years: number,
  months: number = 0
): MonthDate {
  return recipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years, months })
  );
}

describe('placeFilingDateLabel', () => {
  const recipient = recipientBornOct1984();

  function textAt(
    filingDate: MonthDate,
    hoverDate: MonthDate | null = null
  ): string | undefined {
    return placeFilingDateLabel(
      asCanvasContext(recordingContext()),
      recipient,
      filingDate,
      hoverDate,
      layout
    )?.text;
  }

  it('says "Filing date" and the date where the shaded area is low', () => {
    expect(textAt(dateAtAge(recipient, 62, 1))).toBe('Filing date: Nov 2046');
  });

  it('gives the date alone where only that fits above the shaded area', () => {
    expect(textAt(dateAtAge(recipient, 67))).toBe('Oct 2051');
  });

  it('has no label where the shaded area reaches the top of the chart', () => {
    expect(textAt(dateAtAge(recipient, 70))).toBeUndefined();
  });

  it('gives way to the hover line when the two are close together', () => {
    const filingDate = dateAtAge(recipient, 67);
    expect(textAt(filingDate, filingDate)).toBeUndefined();
    expect(textAt(filingDate, dateAtAge(recipient, 67, 2))).toBeUndefined();
    expect(textAt(filingDate, dateAtAge(recipient, 66, 10))).toBeUndefined();
  });

  it('keeps its label when the hover line is elsewhere', () => {
    const filingDate = dateAtAge(recipient, 67);
    expect(textAt(filingDate, dateAtAge(recipient, 64))).toBe('Oct 2051');
    expect(textAt(filingDate, dateAtAge(recipient, 69))).toBe('Oct 2051');
  });

  it('is centered on the filing date line', () => {
    const filingDate = dateAtAge(recipient, 67);
    const placed = placeFilingDateLabel(
      asCanvasContext(recordingContext()),
      recipient,
      filingDate,
      null,
      layout
    );
    const lineX = canvasX(filingDate, recipient.birthdate, layout);
    expect(placed?.label.bounds.left).toBeLessThan(lineX);
    expect(placed?.label.bounds.right).toBeGreaterThan(lineX);
  });
});

describe('selectedDateLabelText', () => {
  const recipient = recipientBornOct1984();
  const filingDate = dateAtAge(recipient, 67);

  function textAt(hoverDate: MonthDate, chart: ChartLayout = layout): string {
    return selectedDateLabelText(
      asCanvasContext(recordingContext()),
      recipient,
      filingDate,
      hoverDate,
      chart
    );
  }

  it('says "Month shown" before the filing date, where there is room', () => {
    expect(textAt(dateAtAge(recipient, 64, 6))).toBe('Month shown: Apr 2049');
  });

  it('gives the month alone over the shaded area', () => {
    expect(textAt(dateAtAge(recipient, 68, 9))).toBe('Jul 2053');
  });

  it('gives the month alone on the filing month itself', () => {
    expect(textAt(filingDate)).toBe('Oct 2051');
  });

  it('gives the month alone on a chart too short for the longer text', () => {
    const shortChart = { ...layout, canvasHeight: 200 };
    expect(textAt(dateAtAge(recipient, 64, 6), shortChart)).toBe('Apr 2049');
  });

  it('gives the month alone just before the filing date, where the label would reach over the corner of the shaded area', () => {
    expect(textAt(dateAtAge(recipient, 66, 11))).toBe('Sep 2051');
  });

  it('says "Month shown" over a shaded area low enough to leave room', () => {
    const earlyFilingDate = dateAtAge(recipient, 62, 1);
    const text = selectedDateLabelText(
      asCanvasContext(recordingContext()),
      recipient,
      earlyFilingDate,
      dateAtAge(recipient, 66),
      layout
    );
    expect(text).toBe('Month shown: Oct 2050');
  });
});

describe('renderFilingDateLine', () => {
  const recipient = recipientBornOct1984();
  const filingDate = dateAtAge(recipient, 67);
  const lineX = canvasX(filingDate, recipient.birthdate, layout);

  it('runs from the slider to the top of the chart area in its first part', () => {
    const ctx = recordingContext();
    renderFilingDateLine(
      asCanvasContext(ctx),
      recipient,
      filingDate,
      'below-slider',
      layout
    );
    expect(ctx.moveTos).toEqual([[lineX, 0]]);
    expect(ctx.lineTos).toEqual([[lineX, layout.reservedTop]]);
  });

  it('runs on down to the corner of the shaded area in its second part', () => {
    const ctx = recordingContext();
    renderFilingDateLine(
      asCanvasContext(ctx),
      recipient,
      filingDate,
      'inside-chart',
      layout
    );
    const cornerY = canvasY(
      benefitOnDateNominal(recipient, filingDate, filingDate),
      maxRenderedYDollars(recipient),
      layout
    );
    expect(cornerY).toBeGreaterThan(layout.reservedTop);
    expect(ctx.moveTos).toEqual([[lineX, layout.reservedTop]]);
    expect(ctx.lineTos).toEqual([[lineX, cornerY]]);
  });

  it('has no second part when the shaded area reaches the top of the chart', () => {
    const ctx = recordingContext();
    renderFilingDateLine(
      asCanvasContext(ctx),
      recipient,
      dateAtAge(recipient, 70),
      'inside-chart',
      layout
    );
    expect(ctx.moveTos).toEqual([]);
  });

  it('is dashed like the hover line, with both parts in step', () => {
    const ctx = recordingContext();
    renderFilingDateLine(
      asCanvasContext(ctx),
      recipient,
      filingDate,
      'inside-chart',
      layout
    );
    expect(ctx.lineDashes).toEqual([[6, 4]]);
    // The second part starts its dash pattern where the first part, which
    // began at y = 0, left off.
    expect(ctx.lineDashOffset).toBe(layout.reservedTop);
  });
});

describe('renderFilingDateLabel', () => {
  it('draws the text it was given', () => {
    const recipient = recipientBornOct1984();
    const ctx = recordingContext();
    const placed = placeFilingDateLabel(
      asCanvasContext(ctx),
      recipient,
      dateAtAge(recipient, 67),
      null,
      layout
    );
    expect(placed).not.toBeNull();
    if (placed === null) return;
    renderFilingDateLabel(asCanvasContext(ctx), recipient, placed);
    expect(ctx.fillTexts).toEqual(['Oct 2051']);
    // It is drawn at the place that was chosen for it.
    expect(ctx.translates).toEqual([
      [placed.label.anchorX, placed.label.anchorY],
    ]);
  });
});

describe('renderYearVerticalLines with a filing date label', () => {
  it('leaves out a year label that the filing date label covers', () => {
    const recipient = recipientBornOct1984();
    // Age 66 and 3 months is January 2051, which is on a year line.
    const placed = placeFilingDateLabel(
      asCanvasContext(recordingContext()),
      recipient,
      dateAtAge(recipient, 66, 3),
      null,
      layout
    );
    expect(placed?.text).toBe('Jan 2051');

    const covered = recordingContext();
    renderYearVerticalLines(
      asCanvasContext(covered),
      recipient,
      layout,
      placed?.label.bounds ?? null
    );
    expect(covered.fillTexts).not.toContain('2051');
    expect(covered.fillTexts).toContain('2050');
    expect(covered.fillTexts).toContain('2052');

    const uncovered = recordingContext();
    renderYearVerticalLines(asCanvasContext(uncovered), recipient, layout);
    expect(uncovered.fillTexts).toContain('2051');
    // The year line itself is still drawn either way.
    expect(covered.moveTos).toEqual(uncovered.moveTos);
  });
});
