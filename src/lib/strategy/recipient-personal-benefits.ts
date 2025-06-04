import * as constants from "$lib/strategy/constants";

import { Recipient } from "$lib/recipient";
import { MonthDate, MonthDuration } from "$lib/month-time";
import { Money } from "$lib/money";

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
export function PersonalBenefitStrategySum(
  recipient: Recipient,
  filingDate: MonthDate,
  finalDate: MonthDate
): number {
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
    constants.MONTHS_IN_YEAR - filingDate.monthIndex(),
    totalMonths
  );

  // Compute the number of months that (3) applies. This is:
  // Total number of months -minus- months in the first year.
  const numMonthsAfterInitialYear = totalMonths - monthsRemainingInFilingYear;

  // Compute the first date of the first January after the filing date.
  const janAfterFilingDate = filingDate.addDuration(
    new MonthDuration(monthsRemainingInFilingYear)
  );

  // Compute the personal benefit on the filing date.
  const initialPersonalBenefit = recipient
    .benefitOnDate(filingDate, filingDate)
    .cents();

  // Compute the personal benefit on the Jan after the filing date.
  const finalPersonalBenefit = recipient
    .benefitOnDate(filingDate, janAfterFilingDate)
    .cents();

  return (
    // 2) Benefit for a few months after filing
    initialPersonalBenefit * monthsRemainingInFilingYear +
    // 3) Benefit for the rest of the time.
    finalPersonalBenefit * numMonthsAfterInitialYear
  );
}

class BenefitPeriod {
  constructor() {}

  // startDate and endDate are inclusive on both sides:
  public startDate: MonthDate;
  public endDate: MonthDate;
  public amount: Money;
} // class BenefitPeriod

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
  finalDate: MonthDate
): BenefitPeriod[] {
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
    constants.MONTHS_IN_YEAR - filingDate.monthIndex(),
    totalMonths
  );

  // Compute the number of months that (3) applies. This is:
  // Total number of months -minus- months in the first year.
  const numMonthsAfterInitialYear = totalMonths - monthsRemainingInFilingYear;

  // Compute the first date of the first January after the filing date.
  const janAfterFilingDate = filingDate.addDuration(
    new MonthDuration(monthsRemainingInFilingYear)
  );

  let periods: BenefitPeriod[] = new Array();

  let initialPeriod = new BenefitPeriod();
  initialPeriod.amount = recipient.benefitOnDate(filingDate, filingDate);
  initialPeriod.startDate = filingDate;
  // Subtract 1 so that we get inclusive periods:
  initialPeriod.endDate = filingDate.addDuration(
    new MonthDuration(monthsRemainingInFilingYear - 1)
  );
  // Don't insert an empty period:
  if (monthsRemainingInFilingYear > 0) {
    periods.push(initialPeriod);
  }

  let finalPeriod = new BenefitPeriod();
  finalPeriod.amount = recipient.benefitOnDate(filingDate, janAfterFilingDate);
  finalPeriod.startDate = initialPeriod.endDate.addDuration(
    new MonthDuration(1)
  );
  finalPeriod.endDate = finalPeriod.startDate.addDuration(
    new MonthDuration(numMonthsAfterInitialYear - 1)
  );
  if (numMonthsAfterInitialYear > 0) periods.push(finalPeriod);

  return periods;
}

export class RecipientPersonalBenefits {
  /**
   * Data array structure:
   * A single flat array storing benefit amounts where:
   * - First half contains values for recipient 0 (primary)
   * - Second half contains values for recipient 1 (spouse)
   * - Within each half, each position corresponds to a filing age from
   *   MIN_STRATEGY_AGE to MAX_STRATEGY_AGE
   * This structure optimizes memory use and access performance compared to
   * nested objects.
   */
  private readonly arraySize =
    2 *
    (constants.MAX_STRATEGY_AGE.asMonths() -
      constants.MIN_STRATEGY_AGE.asMonths() +
      1);
  private data: number[];

  /**
   * Constructor. Pre-allocates the array.
   */
  constructor() {
    this.data = new Array(this.arraySize).fill(0);
  }

  /**
   * Converts recipient index and filing age into the flat array index
   * @param recipientIndex The index of the recipient (0=primary, 1=spouse)
   * @param filingAge The filing age as a MonthDuration (between
   *                  MIN_STRATEGY_AGE and MAX_STRATEGY_AGE)
   * @returns The corresponding index in the flat data array
   * @throws Error if filing age is outside the valid range or recipient index
   *         is invalid
   */
  private getIndex(recipientIndex: number, filingAge: MonthDuration): number {
    if (recipientIndex < 0 || recipientIndex > 1) {
      throw new Error(
        `Invalid recipient index: ${recipientIndex}. Must be 0 or 1.`
      );
    }

    const ageMonths = filingAge.asMonths();
    if (
      ageMonths < constants.MIN_STRATEGY_AGE.asMonths() ||
      ageMonths > constants.MAX_STRATEGY_AGE.asMonths()
    ) {
      throw new Error(`Filing age ${ageMonths} months is outside valid range.`);
    }

    const ageOffset = ageMonths - constants.MIN_STRATEGY_AGE.asMonths();
    const recipientOffset =
      recipientIndex *
      (constants.MAX_STRATEGY_AGE.asMonths() -
        constants.MIN_STRATEGY_AGE.asMonths() +
        1);

    return recipientOffset + ageOffset;
  }

  /**
   * Sets the benefit amount for a specific recipient and filing age
   * @param recipientIndex The index of the recipient (0 or 1)
   * @param filingAge The filing age as a MonthDuration
   * @param benefitAmount The calculated benefit total in cents
   */
  setBenefit(
    recipientIndex: number,
    filingAge: MonthDuration,
    benefitAmount: number
  ) {
    const idx = this.getIndex(recipientIndex, filingAge);
    this.data[idx] = benefitAmount;
  }

  /**
   * Gets the benefit amount for a specific recipient and filing age
   * @param recipientIndex The index of the recipient (0 or 1)
   * @param filingAge The filing age as a MonthDuration
   * @returns The calculated benefit total in cents
   */
  getLifetimeBenefitForFinalAge(
    recipientIndex: number,
    filingAge: MonthDuration
  ): number {
    const idx = this.getIndex(recipientIndex, filingAge);
    return this.data[idx];
  }

  /**
   * Computes all of the benefit amounts at once in a loop.
   */
  computeAllBenefits(
    recipientIndex: number,
    recipient: Recipient,
    finalDate: MonthDate
  ) {
    const birthdate = recipient.birthdate;

    for (
      let strategyAge = MonthDuration.copyFrom(constants.MIN_STRATEGY_AGE);
      strategyAge.lessThanOrEqual(constants.MAX_STRATEGY_AGE);
      strategyAge.increment()
    ) {
      // Calculate the personal benefit:
      this.setBenefit(
        recipientIndex,
        strategyAge,
        PersonalBenefitStrategySum(
          recipient,
          birthdate.dateAtLayAge(strategyAge),
          finalDate
        )
      );
    }
  }
}
