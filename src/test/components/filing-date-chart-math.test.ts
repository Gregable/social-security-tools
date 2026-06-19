import { describe, expect, it } from 'vitest';

import { Birthdate } from '$lib/birthday';
import type { ChartLayout } from '$lib/components/chart-utils';
import { canvasX, dateX } from '$lib/components/filing-date-chart-math';
import { MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

/**
 * Invariants behind the fix for issue #561.
 *
 * The "Explore Filing Dates" selection must be stored as a date and converted
 * to a pixel at render time, so the selected month is stable no matter what
 * canvas width is in effect (the canvas is a different width in print than on a
 * wide screen).
 *
 * These tests guard the canvasX/dateX pair the fix relies on:
 *  - a stored DATE round-trips to the same month at any width (the property
 *    the fix guarantees), and
 *  - a stored PIXEL does NOT (the bug fingerprint we moved away from).
 */

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

// Three differing canvas widths. The exact values don't matter; the invariant
// is that the round-trip holds regardless of width.
const WIDTHS = [320, 740, 1184];

describe('filing-date chart coordinate math', () => {
  const recipient = recipientBornJan1960();
  const birthdate = recipient.birthdate;
  const startDate = birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
  );

  it('round-trips every month (date -> x -> date) at every canvas width', () => {
    // Cover a clean year-aligned start (born on the 1st -> age-62 floor is
    // 62y0m) and a mid-month birth (floor is 62y1m, so startDate is not aligned
    // to a year boundary), which exercises the dateAtSsaAge floor inside the map.
    const birthdates = [
      Birthdate.FromYMD(1960, 0, 1),
      Birthdate.FromYMD(1960, 5, 15),
    ];
    for (const bd of birthdates) {
      const start = bd.dateAtSsaAge(
        MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
      );
      const end = bd.dateAtSsaAge(
        MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
      );
      for (const width of WIDTHS) {
        const layout = layoutOfWidth(width);
        for (
          let date = start;
          date.lessThanOrEqual(end);
          date = date.addDuration(new MonthDuration(1))
        ) {
          const x = canvasX(date, bd, layout);
          const back = dateX(x, bd, layout);
          expect(back.monthsSinceEpoch()).toBe(date.monthsSinceEpoch());
        }
      }
    }
  });

  it('maps a stored DATE to the same month across screen and print widths', () => {
    // An arbitrary date a user might explore: 36 months into the range.
    const exploredDate = startDate.addDuration(new MonthDuration(36));

    const monthsAcrossWidths = WIDTHS.map((width) => {
      const layout = layoutOfWidth(width);
      // Persist the date, recompute the pixel at this width, re-derive the date.
      const x = canvasX(exploredDate, birthdate, layout);
      return dateX(x, birthdate, layout).monthsSinceEpoch();
    });

    // Every width resolves back to the same month.
    for (const m of monthsAcrossWidths) {
      expect(m).toBe(exploredDate.monthsSinceEpoch());
    }
  });

  it('documents the bug: a stored PIXEL maps to different months across widths', () => {
    // The old code stored the raw mouse pixel. The same pixel divides by a
    // different (canvasWidth - reservedLeft) at print width, so it lands on a
    // different month. This is exactly what the fix avoids by storing a date.
    const pixel = 400;
    const screenMonth = dateX(
      pixel,
      birthdate,
      layoutOfWidth(740)
    ).monthsSinceEpoch();
    const printMonth = dateX(
      pixel,
      birthdate,
      layoutOfWidth(1184)
    ).monthsSinceEpoch();

    expect(screenMonth).not.toBe(printMonth);
  });
});
