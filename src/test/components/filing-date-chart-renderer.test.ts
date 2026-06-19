import { describe, expect, it } from 'vitest';

import { Birthdate } from '$lib/birthday';
import type { ChartLayout } from '$lib/components/chart-utils';
import { canvasX } from '$lib/components/filing-date-chart-math';
import { renderSelectedDateVerticalLine } from '$lib/components/filing-date-chart-renderer';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

/**
 * Regression tests for issue #561: the "Explore Filing Dates" drop-line and its
 * label must point at the same month regardless of the canvas width in effect.
 *
 * Print mode resizes the canvas (80vw) relative to the screen (min(55vw, 740px)),
 * so a date-driven renderer must derive both the line position and the label
 * from a MonthDate, not from a stored pixel.
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
});
