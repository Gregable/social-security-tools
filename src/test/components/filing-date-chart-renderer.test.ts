import { describe, expect, it } from 'vitest';

import { Birthdate } from '$lib/birthday';
import type { ChartLayout } from '$lib/components/chart-utils';
import { canvasX } from '$lib/components/filing-date-chart-math';
import { renderSelectedDateVerticalLine } from '$lib/components/filing-date-chart-renderer';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

/**
 * Regression tests for issue #561: the "Explore Filing Dates" drop-line and its
 * label must point at the same month regardless of the canvas width in effect.
 *
 * The canvas is rendered at different widths on screen vs in print (the
 * @media print block widens it), so a date-driven renderer must derive both the
 * line position and the label from a MonthDate, not from a stored pixel.
 */

/**
 * A minimal recording stand-in for CanvasRenderingContext2D that captures the
 * text drawn (fillText) and the path moves (moveTo/lineTo) so tests can assert
 * what the renderer produced without a real canvas.
 */
function recordingContext() {
  const fillTexts: string[] = [];
  const moveTos: Array<[number, number]> = [];
  const lineTos: Array<[number, number]> = [];
  const ctx = {
    fillTexts,
    moveTos,
    lineTos,
    // Settable style properties the renderer assigns to.
    strokeStyle: '',
    fillStyle: '',
    lineCap: '',
    lineWidth: 0,
    font: '',
    save() {},
    restore() {},
    beginPath() {},
    stroke() {},
    translate() {},
    rotate() {},
    setLineDash() {},
    fillRect() {},
    measureText(text: string) {
      // Width proportional to length is enough for layout math under test.
      return { width: text.length * 7 } as TextMetrics;
    },
    moveTo(x: number, y: number) {
      moveTos.push([x, y]);
    },
    lineTo(x: number, y: number) {
      lineTos.push([x, y]);
    },
    fillText(text: string) {
      fillTexts.push(text);
    },
  };
  return ctx;
}

function layoutOfWidth(canvasWidth: number): ChartLayout {
  return {
    canvasWidth,
    canvasHeight: 420,
    reservedLeft: 70,
    reservedTop: 120,
    reservedBottom: 8,
  };
}

function recipientBornJan1960(): Recipient {
  const recipient = new Recipient();
  recipient.birthdate = Birthdate.FromYMD(1960, 0, 1);
  return recipient;
}

describe('renderSelectedDateVerticalLine', () => {
  // January 2025 is comfortably within the age 62..71 window for a 1960 birth.
  const selectedDate = MonthDate.initFromYearsMonths({
    years: 2025,
    months: 0,
  });

  it('labels the drop-line with the selected month, independent of canvas width', () => {
    const recipient = recipientBornJan1960();

    const screen = recordingContext();
    renderSelectedDateVerticalLine(
      screen as unknown as CanvasRenderingContext2D,
      selectedDate,
      recipient,
      layoutOfWidth(740)
    );

    const print = recordingContext();
    renderSelectedDateVerticalLine(
      print as unknown as CanvasRenderingContext2D,
      selectedDate,
      recipient,
      layoutOfWidth(1184)
    );

    // The label is the selected month (3-char month name, as the canvas has
    // always rendered it), and it is the same at both widths.
    expect(screen.fillTexts).toContain('Jan 2025');
    expect(print.fillTexts).toContain('Jan 2025');
    expect(screen.fillTexts).toEqual(print.fillTexts);
  });

  it('positions the vertical line at canvasX(date) for the active width', () => {
    const recipient = recipientBornJan1960();

    for (const width of [740, 1184]) {
      const ctx = recordingContext();
      renderSelectedDateVerticalLine(
        ctx as unknown as CanvasRenderingContext2D,
        selectedDate,
        recipient,
        layoutOfWidth(width)
      );

      const expectedX = canvasX(
        selectedDate,
        recipient.birthdate,
        layoutOfWidth(width)
      );
      // The vertical line starts at the top (y=0) at the date's x position.
      expect(ctx.moveTos).toContainEqual([expectedX, 0]);
    }
  });

  // The renderer's guard is the half-open interval [reservedLeft, canvasWidth):
  //   if (x < reservedLeft || x >= canvasWidth) return;
  // These two tests pin both ends so a future tweak to the comparison operators
  // is caught.

  it('draws the line at the age-62 start date (x === reservedLeft, inclusive)', () => {
    const recipient = recipientBornJan1960();
    const startDate = recipient.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
    );
    const layout = layoutOfWidth(740);
    // The earliest selectable date sits exactly on the left edge of the plot.
    expect(canvasX(startDate, recipient.birthdate, layout)).toBe(
      layout.reservedLeft
    );

    const ctx = recordingContext();
    renderSelectedDateVerticalLine(
      ctx as unknown as CanvasRenderingContext2D,
      startDate,
      recipient,
      layout
    );

    expect(ctx.moveTos).toContainEqual([layout.reservedLeft, 0]);
    expect(ctx.fillTexts.length).toBeGreaterThan(0);
  });

  it('skips the line at the age-71 end date (x === canvasWidth, exclusive)', () => {
    const recipient = recipientBornJan1960();
    const endDate = recipient.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
    );
    const layout = layoutOfWidth(740);
    // Age 71 is the right edge of the rendered range; it maps to canvasWidth and
    // is intentionally not drawn (the selectable slider stops at age 70).
    expect(canvasX(endDate, recipient.birthdate, layout)).toBe(
      layout.canvasWidth
    );

    const ctx = recordingContext();
    renderSelectedDateVerticalLine(
      ctx as unknown as CanvasRenderingContext2D,
      endDate,
      recipient,
      layout
    );

    expect(ctx.moveTos).toEqual([]);
    expect(ctx.fillTexts).toEqual([]);
  });
});
