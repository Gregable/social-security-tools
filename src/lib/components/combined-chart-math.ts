import { allBenefitsOnDate as allBenefitsOnDate_ } from '$lib/benefit-calculator';
import type { ChartLayout } from '$lib/components/chart-utils';
import type { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import {
  type RecipientContext,
  userSelectedDate,
} from './combined-chart-context';

// Width in pixels for the compressed gap region when there's a large age difference
export const COMPRESSED_GAP_WIDTH = 36;

export interface GapInfo {
  hasGap: boolean;
  gapStartDate: MonthDate; // Older person's age 70
  gapEndDate: MonthDate; // Younger person's age 62
  gapMonths: number;
}

/**
 * Returns [youngerRecipient, olderRecipient].
 * If same age, arbitrarily picks recipient as younger.
 */
export function youngerOlder(
  recipient: Recipient,
  spouse: Recipient
): [Recipient, Recipient] {
  if (recipient.birthdate.ssaBirthdate() === spouse.birthdate.ssaBirthdate()) {
    return [recipient, spouse];
  }

  // The younger recipient has the *higher* birthdate.
  const youngerRecipient =
    recipient.birthdate.ssaBirthdate() < spouse.birthdate.ssaBirthdate()
      ? spouse
      : recipient;
  const olderRecipient =
    recipient.birthdate.ssaBirthdate() < spouse.birthdate.ssaBirthdate()
      ? recipient
      : spouse;

  return [youngerRecipient, olderRecipient];
}

/**
 * Computes gap info for the age gap between two recipients.
 * Recomputed fresh each call to avoid shared-state issues.
 */
export function getGapInfo(recipient: Recipient, spouse: Recipient): GapInfo {
  const [youngerRecipient, olderRecipient] = youngerOlder(recipient, spouse);

  const gapStartDate = olderRecipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
  );
  const gapEndDate = youngerRecipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
  );

  const gapMonths = gapEndDate.subtractDate(gapStartDate).asMonths();

  return {
    hasGap: gapMonths > 0,
    gapStartDate,
    gapEndDate,
    gapMonths: Math.max(0, gapMonths),
  };
}

/**
 * Returns the [startDate, endDate] range to show on the canvas.
 * Spans from older person's age 62 to younger person's age 71.
 */
export function dateRange(
  recipient: Recipient,
  spouse: Recipient
): [MonthDate, MonthDate] {
  const [youngerRecipient, olderRecipient] = youngerOlder(recipient, spouse);
  const startDate = olderRecipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
  );
  const endDate = youngerRecipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
  );
  return [startDate, endDate];
}

/**
 * Compute the canvas x-coordinate for a date.
 * When there's a large age gap, uses piecewise linear mapping with compression.
 */
export function canvasX(
  date: MonthDate,
  recipient: Recipient,
  spouse: Recipient,
  layout: ChartLayout
): number {
  const [startDate, endDate] = dateRange(recipient, spouse);
  const gap = getGapInfo(recipient, spouse);

  // No gap: use original linear mapping
  if (!gap.hasGap) {
    const xValue =
      (date.subtractDate(startDate).asMonths() /
        endDate.subtractDate(startDate).asMonths()) *
      (layout.canvasWidth - layout.reservedLeft);
    return layout.reservedLeft + Math.round(xValue);
  }

  // Calculate pixels-per-month for non-gap regions
  const totalWidth = layout.canvasWidth - layout.reservedLeft;
  const nonGapMonths =
    endDate.subtractDate(startDate).asMonths() - gap.gapMonths;
  const nonGapWidth = totalWidth - COMPRESSED_GAP_WIDTH;
  const pixelsPerMonth = nonGapWidth / nonGapMonths;

  const segment1Months = gap.gapStartDate.subtractDate(startDate).asMonths();
  const segment1Width = segment1Months * pixelsPerMonth;

  if (date.lessThanOrEqual(gap.gapStartDate)) {
    // Segment 1: Before gap
    const monthsFromStart = date.subtractDate(startDate).asMonths();
    return layout.reservedLeft + Math.round(monthsFromStart * pixelsPerMonth);
  }
  if (date.lessThan(gap.gapEndDate)) {
    // Segment 2: Inside gap (compressed)
    const monthsIntoGap = date.subtractDate(gap.gapStartDate).asMonths();
    const gapPercent = monthsIntoGap / gap.gapMonths;
    return (
      layout.reservedLeft +
      Math.round(segment1Width + gapPercent * COMPRESSED_GAP_WIDTH)
    );
  }
  // Segment 3: After gap
  const monthsAfterGap = date.subtractDate(gap.gapEndDate).asMonths();
  return (
    layout.reservedLeft +
    Math.round(
      segment1Width + COMPRESSED_GAP_WIDTH + monthsAfterGap * pixelsPerMonth
    )
  );
}

/**
 * Inverse of canvasX, computes a date from a canvas x-coordinate.
 */
export function dateX(
  x: number,
  recipient: Recipient,
  spouse: Recipient,
  layout: ChartLayout
): MonthDate {
  const [startDate, endDate] = dateRange(recipient, spouse);
  const gap = getGapInfo(recipient, spouse);

  const clampedX = Math.max(
    layout.reservedLeft,
    Math.min(layout.canvasWidth, x)
  );

  // No gap: use original linear mapping
  if (!gap.hasGap) {
    const percent =
      (clampedX - layout.reservedLeft) /
      (layout.canvasWidth - layout.reservedLeft);
    const numMonths = Math.round(
      endDate.subtractDate(startDate).asMonths() * percent
    );
    return startDate.addDuration(new MonthDuration(numMonths));
  }

  // Calculate segment boundaries
  const totalWidth = layout.canvasWidth - layout.reservedLeft;
  const nonGapMonths =
    endDate.subtractDate(startDate).asMonths() - gap.gapMonths;
  const nonGapWidth = totalWidth - COMPRESSED_GAP_WIDTH;
  const pixelsPerMonth = nonGapWidth / nonGapMonths;

  const segment1Months = gap.gapStartDate.subtractDate(startDate).asMonths();
  const segment1Width = segment1Months * pixelsPerMonth;

  const relativeX = clampedX - layout.reservedLeft;

  if (relativeX <= segment1Width) {
    // Segment 1: Before gap
    const months = Math.round(relativeX / pixelsPerMonth);
    return startDate.addDuration(new MonthDuration(months));
  }
  if (relativeX <= segment1Width + COMPRESSED_GAP_WIDTH) {
    // Segment 2: Inside gap
    const gapPercent = (relativeX - segment1Width) / COMPRESSED_GAP_WIDTH;
    const monthsIntoGap = Math.round(gapPercent * gap.gapMonths);
    return gap.gapStartDate.addDuration(new MonthDuration(monthsIntoGap));
  }
  // Segment 3: After gap
  const monthsAfterGap = Math.round(
    (relativeX - segment1Width - COMPRESSED_GAP_WIDTH) / pixelsPerMonth
  );
  return gap.gapEndDate.addDuration(new MonthDuration(monthsAfterGap));
}

/**
 * Compute the canvas y-coordinate for a benefit dollars value.
 * Handles the split chart where recipient is on top and spouse is on bottom.
 */
export function canvasY(
  personCtx: RecipientContext,
  benefitY: Money,
  maxY: Money,
  minY: Money,
  layout: ChartLayout
): number {
  const chartHeight =
    layout.canvasHeight - layout.reservedTop - layout.reservedBottom;
  const dollarsHeight = maxY.plus(minY);

  const pixelsPerDollar = chartHeight / dollarsHeight.value();
  const zeroHeight = minY.value() * pixelsPerDollar;

  let chartY: number;
  if (personCtx.r.first) {
    chartY = zeroHeight + benefitY.value() * pixelsPerDollar;
  } else {
    // Subtract 1 pixel so that the two zero lines aren't drawn on top of
    // each other. Technically this makes the chart slightly out of scale, but
    // it's not noticeable.
    chartY = zeroHeight - benefitY.value() * pixelsPerDollar - 1;
  }

  return Math.floor(layout.canvasHeight - layout.reservedBottom - chartY);
}

/**
 * Returns the max benefit for the first recipient at their age 70.
 */
export function maxRenderedYDollars(
  firstCtx: RecipientContext,
  secondCtx: RecipientContext
): Money {
  const recipientAge70 = firstCtx.r.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
  );
  return allBenefitsOnDate_(
    firstCtx.r,
    secondCtx.r,
    recipientAge70,
    recipientAge70,
    recipientAge70
  );
}

/**
 * Returns the max benefit for the second recipient at their age 70.
 * Named "min" because this determines the downward extent of the split
 * chart's Y-axis (the second recipient renders below the zero line).
 */
export function minRenderedYDollars(
  firstCtx: RecipientContext,
  secondCtx: RecipientContext
): Money {
  const spouseAge70 = secondCtx.r.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
  );
  return allBenefitsOnDate_(
    secondCtx.r,
    firstCtx.r,
    spouseAge70,
    spouseAge70,
    spouseAge70
  );
}

/**
 * Returns all benefits on a given date, including spousal benefits.
 * `personCtx` is the person whose benefit we're computing (always either
 * `firstCtx` or `secondCtx`). The function uses `personCtx.r.first` to
 * determine which context is self vs spouse for the filing date lookup.
 */
export function allBenefitsOnDate(
  personCtx: RecipientContext,
  firstCtx: RecipientContext,
  secondCtx: RecipientContext,
  atDate: MonthDate,
  selfFilingDate: MonthDate = new MonthDate(0)
): Money {
  let spouseFilingDate: MonthDate;
  let spouse: Recipient;
  if (personCtx.r.first) {
    if (selfFilingDate.monthsSinceEpoch() === 0)
      selfFilingDate = userSelectedDate(firstCtx);
    spouseFilingDate = userSelectedDate(secondCtx);
    spouse = secondCtx.r;
  } else {
    if (selfFilingDate.monthsSinceEpoch() === 0)
      selfFilingDate = userSelectedDate(secondCtx);
    spouseFilingDate = userSelectedDate(firstCtx);
    spouse = firstCtx.r;
  }

  return allBenefitsOnDate_(
    personCtx.r,
    spouse,
    spouseFilingDate,
    selfFilingDate,
    atDate
  );
}
