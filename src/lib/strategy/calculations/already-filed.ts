/**
 * The "already receiving benefits" input to the strategy optimizer.
 *
 * A recipient who has filed has no filing decision left to make: their
 * filing month is a fact. The optimizer treats it as a filing-age range of
 * exactly one entry (see `filingAgeRange`), and searches only the other
 * spouse's ages. This module owns the type and the rules for when the input
 * may be shown and what values it accepts; it deliberately depends on
 * nothing but `Birthdate` and `MonthDate` so the form can use it without a
 * `Recipient`.
 */

import type { Birthdate } from '$lib/birthday';
import type { MonthDate } from '$lib/month-time';

/**
 * Per recipient, the month benefits actually started, or null if the
 * recipient has not filed. Index order matches the `recipients` tuple used
 * throughout the strategy code.
 */
export type AlreadyFiled = readonly [MonthDate | null, MonthDate | null];

/**
 * The mutable form-state shape the strategy page binds into its inputs.
 * Snapshot it into an `AlreadyFiled` before handing it to a calculation, so
 * results describe one set of inputs even if the form changes mid-run.
 */
export type AlreadyFiledInput = [MonthDate | null, MonthDate | null];

/** Nobody has filed. The default for every optimizer entry point. */
export const NOT_FILED: AlreadyFiled = [null, null];

/** The first calendar month in which this person could have filed. */
export function earliestFilingDate(birthdate: Birthdate): MonthDate {
  return birthdate.dateAtSsaAge(birthdate.earliestFilingMonth());
}

/**
 * Whether the person is old enough to have filed as of `currentDate`: their
 * earliest filing month (age 62, adjusted for the 1st/2nd-of-month rule) is
 * this month or earlier. The form shows the "already receiving benefits"
 * control only when this is true, so nobody under 62 ever sees it.
 */
export function isEligibleToHaveFiled(
  birthdate: Birthdate,
  currentDate: MonthDate
): boolean {
  return earliestFilingDate(birthdate).lessThanOrEqual(currentDate);
}

/**
 * Validates a claimed filing month. Returns null when acceptable, otherwise
 * a message suitable for showing under the input.
 *
 * The month must be no earlier than the person's earliest filing month and
 * no later than `currentDate`: this feature records what has happened, not
 * a plan.
 */
export function validateFiledMonth(
  birthdate: Birthdate,
  filedAt: MonthDate,
  currentDate: MonthDate
): string | null {
  const earliest = earliestFilingDate(birthdate);
  if (filedAt.lessThan(earliest)) {
    return (
      `Benefits cannot start before the first full month at age 62, ` +
      `which is ${earliest.monthFullName()} ${earliest.year()} for this birthdate.`
    );
  }
  if (filedAt.greaterThan(currentDate)) {
    return 'The start month cannot be in the future.';
  }
  return null;
}
