import { benefitAtAge } from '$lib/benefit-calculator';
import type { Birthdate } from '$lib/birthday';
import type { ChartLayout } from '$lib/components/chart-utils';
import type { Money } from '$lib/money';
import { type MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';

/**
 * Returns the maximum dollars displayed on the chart (benefit at age 70).
 */
export function maxRenderedYDollars(recipient: Recipient): Money {
  const maxAge = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
  return benefitAtAge(recipient, maxAge);
}

/**
 * Compute the canvas x-coordinate for a date.
 */
export function canvasX(
  date: MonthDate,
  birthdate: Birthdate,
  layout: ChartLayout
): number {
  const startDate = birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
  );
  // Allow the canvas to show all of the way to age 71, so that there is
  // some rendered space if the user slides the slider all of the way to 70.
  const endDate = birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
  );
  const xValue =
    (date.subtractDate(startDate).asMonths() /
      endDate.subtractDate(startDate).asMonths()) *
    (layout.canvasWidth - layout.reservedLeft);
  return layout.reservedLeft + Math.round(xValue);
}

/**
 * Inverse of canvasX, computes a date from a canvas x-coordinate.
 */
export function dateX(
  x: number,
  birthdate: Birthdate,
  layout: ChartLayout
): MonthDate {
  const startDate = birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
  );
  const endDate = birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
  );

  // Clip x to a range of [reservedLeft, canvasWidth] to ensure that
  // the date is within the chart bounds.
  const clampedX = Math.max(
    layout.reservedLeft,
    Math.min(layout.canvasWidth, x)
  );

  const percent =
    (clampedX - layout.reservedLeft) /
    (layout.canvasWidth - layout.reservedLeft);

  const numMonths = Math.round(
    endDate.subtractDate(startDate).asMonths() * percent
  );
  return startDate.addDuration(new MonthDuration(numMonths));
}

/**
 * Compute the canvas y-coordinate for a benefit dollars value.
 */
export function canvasY(
  benefitY: Money,
  maxY: Money,
  layout: ChartLayout
): number {
  const chartHeight =
    layout.canvasHeight - layout.reservedTop - layout.reservedBottom;
  // canvasYValue is the absolute number of canvas pixels that this point
  // represents above 0.
  const canvasYValue = Math.floor(benefitY.div$(maxY) * chartHeight);

  // The zeroLineY is the pixel position (counted from top) of the $0 line.
  const zeroLineY = layout.canvasHeight - layout.reservedBottom;
  return zeroLineY - canvasYValue;
}
