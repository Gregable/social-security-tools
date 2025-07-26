import { Recipient } from '$lib/recipient';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Money } from '$lib/money';

const MONTHS_IN_YEAR = 12;

/**
 * Calculates the total sum of personal benefits a recipient would receive
 * between their filing date and final date.
 *
 * Instead of iterating through each month, this function calculates total
 * months in each period and multiplies by the appropriate benefit amount,
 * significantly improving performance.
 *
 * @param {Recipient} recipient - The Social Security benefit recipient
 * @param {MonthDate} filingDate - The date when the recipient files for
 *                                 benefits
 * @param {MonthDate} finalDate - The final date to calculate benefits through
 * @returns {number} Total personal benefit amount in cents across the period
 */
class BenefitPeriod {
  constructor() {}

  // startDate and endDate are inclusive on both sides:
  public startDate: MonthDate;
  public endDate: MonthDate;
  public amount: Money;
} // class BenefitPeriod

/**
 * Sums the total benefit amount from an array of BenefitPeriod objects.
 *
 * @param {BenefitPeriod[]} periods - An array of BenefitPeriod objects
 * @returns {number} Total benefit amount in cents across all periods
 */
export function sumBenefitPeriods(periods: BenefitPeriod[]): number {
  let totalCents = 0;
  for (const period of periods) {
    const durationMonths =
      period.endDate.subtractDate(period.startDate).asMonths() + 1;
    totalCents += period.amount.cents() * durationMonths;
  }
  return totalCents;
}

/**
 * Calculates the total sum of personal benefits a recipient would receive
 * between their filing date and final date.
 *
 * Instead of iterating through each month, this function calculates total
 * months in each period and multiplies by the appropriate benefit amount,
 * significantly improving performance.
 *
 * @param {Recipient} recipient - The Social Security benefit recipient
 * @param {MonthDate} filingDate - The date when the recipient files for
 *                                 benefits
 * @param {MonthDate} finalDate - The final date to calculate benefits through
 */
export function PersonalBenefitPeriods(
  recipient: Recipient,
  filingDate: MonthDate,
  finalDate: MonthDate,
  periods: BenefitPeriod[]
): void {
  // personal benefit is only one of 3 values at any given date:
  //  1) $0 prior to filing
  //  2) Benefit for a few months after filing (see
  //    https://ssa.tools/guides/delayed-january-bump)
  //  3) Benefit for the rest of the time.
  // If we calculate these 3 values and their number of months, we can avoid a
  // loop which is a significant performance improvement.

  // Total months includes the filing month and the final month (inclusive).
  const totalMonths = finalDate.subtractDate(filingDate).asMonths() + 1;

  // Compute the number of months that (2) applies in the first year.
  const monthsRemainingInFilingYear = Math.min(
    MONTHS_IN_YEAR - filingDate.monthIndex(),
    totalMonths
  );

  // Compute the number of months that (3) applies. This is:
  // Total number of months -minus- months in the first year.
  const numMonthsAfterInitialYear = totalMonths - monthsRemainingInFilingYear;

  // Compute the first date of the first January after the filing date.
  const janAfterFilingDate = filingDate.addDuration(
    new MonthDuration(monthsRemainingInFilingYear)
  );

  // Don't insert an empty period:
  if (monthsRemainingInFilingYear > 0) {
    let initialPeriod = new BenefitPeriod();
    initialPeriod.startDate = filingDate;
    // Subtract 1 so that we get inclusive periods:
    initialPeriod.endDate = filingDate.addDuration(
      new MonthDuration(monthsRemainingInFilingYear - 1)
    );
    initialPeriod.amount = recipient.benefitOnDateOptimized(
      filingDate,
      filingDate
    );
    periods.push(initialPeriod);
  }

  if (numMonthsAfterInitialYear > 0) {
    let finalPeriod = new BenefitPeriod();
    finalPeriod.amount = recipient.benefitOnDateOptimized(
      filingDate,
      janAfterFilingDate
    );
    finalPeriod.startDate = filingDate.addDuration(
      new MonthDuration(monthsRemainingInFilingYear)
    );
    finalPeriod.endDate = finalPeriod.startDate.addDuration(
      new MonthDuration(numMonthsAfterInitialYear - 1)
    );
    periods.push(finalPeriod);
  }
}
