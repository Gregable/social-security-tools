import { describe, expect, it } from 'vitest';

import { Birthdate } from '$lib/birthday';
import type { ChartLayout } from '$lib/components/chart-utils';
import { canvasX } from '$lib/components/filing-date-chart-math';
import {
  type FilingDateChartScene,
  renderFilingDateChart,
} from '$lib/components/filing-date-chart-scene';
import { Money } from '$lib/money';
import type { MonthDate } from '$lib/month-time';
import { MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { asCanvasContext, recordingContext } from './recording-context';

const layout: ChartLayout = {
  canvasWidth: 620,
  canvasHeight: 420,
  reservedLeft: 70,
  reservedTop: 120,
  reservedBottom: 8,
};

// Born in October 1984: age 62 is October 2046, and normal retirement age
// (67) is October 2051, where the benefit is $2,135.
function recipientBornOct1984(): Recipient {
  const recipient = new Recipient();
  recipient.birthdate = Birthdate.FromYMD(1984, 9, 15);
  recipient.setPia(Money.from(2135));
  return recipient;
}

const recipient = recipientBornOct1984();

function dateAtAge(years: number, months: number = 0): MonthDate {
  return recipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years, months })
  );
}

function draw(filingDate: MonthDate, hoverDate: MonthDate | null) {
  const ctx = recordingContext();
  const scene: FilingDateChartScene = {
    recipient,
    filingDate,
    hoverDate,
    userFloor: 62 * 12 + 1,
    layout,
  };
  renderFilingDateChart(asCanvasContext(ctx), scene);
  return ctx;
}

describe('renderFilingDateChart', () => {
  it('labels the filing date line and the benefit when nothing is hovered', () => {
    const ctx = draw(dateAtAge(67), null);
    expect(ctx.fillTexts).toContain('Oct 2051');
    expect(ctx.fillTexts).toContain('$2,135 / mo');
    expect(ctx.fillTexts.some((text) => text.startsWith('Month shown'))).toBe(
      false
    );
  });

  it('labels the hover line with "Month shown" before the filing date', () => {
    const ctx = draw(dateAtAge(67), dateAtAge(64, 6));
    expect(ctx.fillTexts).toContain('Month shown: Apr 2049');
    expect(ctx.fillTexts).toContain('Oct 2051');
  });

  it('labels the hover line with the month alone over the shaded area', () => {
    const ctx = draw(dateAtAge(67), dateAtAge(68, 9));
    expect(ctx.fillTexts).toContain('Jul 2053');
    expect(ctx.fillTexts).not.toContain('Month shown: Jul 2053');
  });

  it('draws the benefit amount after the hover line, so the amount is on top', () => {
    const hoverDate = dateAtAge(67, 4);
    const ctx = draw(dateAtAge(67), hoverDate);
    expect(ctx.fillTexts.indexOf('$2,135 / mo')).toBeGreaterThan(
      ctx.fillTexts.indexOf('Feb 2052')
    );
  });

  it('draws the filing date label after the year labels, so it is on top', () => {
    const ctx = draw(dateAtAge(67), null);
    expect(ctx.fillTexts.indexOf('Oct 2051')).toBeGreaterThan(
      ctx.fillTexts.indexOf('2054')
    );
    expect(ctx.fillTexts.at(-1)).toBe('Oct 2051');
  });

  it('leaves out the year label that the filing date label covers', () => {
    // Age 66 and 3 months is January 2051, which is on a year line.
    const ctx = draw(dateAtAge(66, 3), null);
    expect(ctx.fillTexts).toContain('Jan 2051');
    expect(ctx.fillTexts).not.toContain('2051');
    expect(ctx.fillTexts).toContain('2050');
  });

  it('drops the filing date label when the hover line is next to it', () => {
    const ctx = draw(dateAtAge(67), dateAtAge(67, 1));
    expect(ctx.fillTexts).toContain('Nov 2051');
    expect(ctx.fillTexts).not.toContain('Oct 2051');
  });

  it('draws the filing date line from the slider down to the shaded area', () => {
    const filingDate = dateAtAge(67);
    const ctx = draw(filingDate, null);
    const lineX = canvasX(filingDate, recipient.birthdate, layout);
    expect(ctx.moveTos).toContainEqual([lineX, 0]);
    expect(ctx.lineTos).toContainEqual([lineX, layout.reservedTop]);
    expect(ctx.moveTos).toContainEqual([lineX, layout.reservedTop]);
  });

  it('draws the lower part of the filing date line after the benefit amount', () => {
    const filingDate = dateAtAge(67);
    const ctx = draw(filingDate, null);
    const lineX = canvasX(filingDate, recipient.birthdate, layout);
    // The last path started is the lower part of the line, which therefore
    // sits on top of the white backing of the benefit amount.
    expect(ctx.moveTos.at(-1)).toEqual([lineX, layout.reservedTop]);
  });
});
