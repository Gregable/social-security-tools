import { MonthDate, MonthDuration } from '$lib/month-time';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import { PersonalBenefitPeriods } from './recipient-personal-benefits.js';

class BenefitPeriod {
  constructor() {}

  // startDate and endDate are inclusive on both sides:
  public startDate: MonthDate;
  public endDate: MonthDate;
  public amount: Money;
} // class BenefitPeriod

/**
 * Calculates the total lifetime benefit in cents for a given Social Security
 * filing strategy for a couple.
 *
 * This function computes the sum of personal, spousal, and survivor benefits
 * for both recipients based on their selected filing ages and expected final
 * ages (death dates).
 *
 * @param {[Recipient, Recipient]} recipients - An array containing the two
 *                                              recipients for whom the strategy
 *                                              results are being calculated.
 * @param {[MonthDate, MonthDate]} finalDates - An array containing the final
 *                                              dates (death dates) for each
 *                                              recipient.
 * @param {MonthDate} currentDate - Today's date.
 * @param {number} discountRate - Rate used for present value calculation. 0
 *                                means no discount.
 * @param {[MonthDuration, MonthDuration]} strats - An array containing the
 *                                                  filing ages (as
 *                                                  MonthDuration)
 *                                                  for each recipient.
 */
export function strategySumPeriods(
  recipients: [Recipient, Recipient],
  finalDates: [MonthDate, MonthDate],
  strats: [MonthDuration, MonthDuration]
): BenefitPeriod[] {
  let periods: BenefitPeriod[] = new Array();

  // Declare variables to hold recipient information, final dates, filing
  // strategies (ages), and calculated filing dates.
  let earner: Recipient;
  let dependent: Recipient;
  let earnerFinalDate: MonthDate;
  let dependentFinalDate: MonthDate;
  let earnerStrat: MonthDuration;
  let dependentStrat: MonthDuration;
  let earnerStratDate: MonthDate;
  let dependentStratDate: MonthDate;

  // Calculate the MonthDate version of the filing strategy ages by offsetting
  // the strategy ages from each recipient's birthdate.
  let stratDates: [MonthDate, MonthDate] = [null, null];
  for (let i = 0; i < 2; i++) {
    stratDates[i] = recipients[i].birthdate.dateAtSsaAge(strats[i]);
  }

  // Determine the higher and lower earner based on their Primary Insurance
  // Amount (PIA).
  if (recipients[0].higherEarningsThan(recipients[1])) {
    earner = recipients[0];
    dependent = recipients[1];
    earnerFinalDate = finalDates[0];
    dependentFinalDate = finalDates[1];
    earnerStrat = strats[0];
    dependentStrat = strats[1];
    earnerStratDate = stratDates[0];
    dependentStratDate = stratDates[1];
  } else {
    earner = recipients[1];
    dependent = recipients[0];
    earnerFinalDate = finalDates[1];
    dependentFinalDate = finalDates[0];
    earnerStrat = strats[1];
    dependentStrat = strats[0];
    earnerStratDate = stratDates[1];
    dependentStratDate = stratDates[0];
  }

  // If the dependent has 0 PIA, then they can't file earlier than the earner.
  // Move the dependent's filing date up to the earner's:
  if (
    dependent.pia().primaryInsuranceAmount().cents() == 0 &&
    dependentStratDate.lessThan(earnerStratDate)
  ) {
    dependentStrat = earnerStrat;
    dependentStratDate = earnerStratDate;
  }

  // Determine the start date for survivor benefits. This is the later of:
  // 1. The month after the earner's death date.
  // 2. The dependent's filing date.
  const survivorStartDate = MonthDate.max(
    earnerFinalDate.addDuration(new MonthDuration(1)),
    dependentStratDate
  );

  // Determine the dependent's survivor benefit amount:
  let isSurvivorBenefitApplicable = false;
  let survivorBenefit: Money = Money.zero();
  if (dependentFinalDate.greaterThan(survivorStartDate)) {
    survivorBenefit = dependent.survivorBenefit(
      /*deceased*/ earner,
      /*deceasedFilingDate*/ earnerStratDate,
      /*deceasedDeathDate*/ earnerFinalDate,
      /*survivorFilingDate*/ survivorStartDate
    );
    // Note that if the survivor's personal benefit is greater than their
    // survivor benefit, they will not switch to a survivor benefit.
    const dependentFinalPersonalBenefit = dependent.benefitOnDate(
      /*filingDate*/ dependentStratDate,
      // Add a year to include all late filing credits.
      /*atDate*/ dependentStratDate.addDuration(MonthDuration.OneYear())
    );
    if (dependentFinalPersonalBenefit.cents() < survivorBenefit.cents()) {
      isSurvivorBenefitApplicable = true;
    }
  }

  // Earner's Personal Benefit:
  // Earner is simple as they will never have spousal or survivor benefits:
  periods.push(
    ...PersonalBenefitPeriods(
      earner,
      earner.birthdate.dateAtSsaAge(earnerStrat),
      earnerFinalDate
    )
  );
  // The latest that the dependent will be collecting a personal benefit is the
  // month before starting a survivor benefit.
  let dependentFinalPersonalDate = dependentFinalDate;
  if (
    isSurvivorBenefitApplicable &&
    dependentFinalDate.greaterThanOrEqual(survivorStartDate)
  ) {
    dependentFinalPersonalDate = survivorStartDate.subtractDuration(
      new MonthDuration(1)
    );
  }
  // Dependent's Personal Benefit:
  periods.push(
    ...PersonalBenefitPeriods(
      dependent,
      dependent.birthdate.dateAtSsaAge(dependentStrat),
      dependentFinalPersonalDate
    )
  );

  // Dependent's Survivor Benefit:
  if (isSurvivorBenefitApplicable) {
    let survivorPeriod = new BenefitPeriod();
    survivorPeriod.amount = survivorBenefit;
    survivorPeriod.startDate = survivorStartDate;
    survivorPeriod.endDate = dependentFinalDate;
    periods.push(survivorPeriod);
  }

  // Dependent's Spousal Benefit:
  if (dependent.eligibleForSpousalBenefit(earner)) {
    let spousalPeriod = new BenefitPeriod();
    // The start date for spousal benefits is the later of the two filing dates.
    spousalPeriod.startDate = MonthDate.max(
      earnerStratDate,
      dependentStratDate
    );
    // The end date for spousal benefits is the earlier of when the dependent
    // starts receiving survivor benefits or their own death date.
    spousalPeriod.endDate = MonthDate.min(
      survivorStartDate.subtractDuration(new MonthDuration(1)),
      // Include the month of the final date:
      dependentFinalDate.addDuration(new MonthDuration(1))
    );

    if (spousalPeriod.endDate.greaterThanOrEqual(spousalPeriod.startDate)) {
      spousalPeriod.amount = dependent.spousalBenefitOnDateGivenStartDate(
        /*spouse=*/ earner,
        /*spouseFilingDate=*/ earnerStratDate,
        /*filingDate=*/ dependentStratDate,
        /*atDate=*/ spousalPeriod.startDate
      );
      periods.push(spousalPeriod);
    }
  }

  return periods;
}

/**
 * Converts an annual discount rate to a monthly discount rate.
 *
 * @param {number} annualDiscountRate - Annual discount rate (e.g., 0.03 for 3%).
 * @returns {number} Monthly discount rate.
 */
function calculateMonthlyDiscountRate(annualDiscountRate: number): number {
  if (annualDiscountRate === 0) {
    return 0;
  } else {
    return Math.pow(1 + annualDiscountRate, 1 / 12) - 1;
  }
}

/**
 * Calculates the net present value of all benefit periods.
 *
 * This function calls strategySumPeriods to get an array of benefit periods,
 * and then calculates the net present value of the payments during those periods,
 * accounting for the duration of each period and discounting future payments.
 *
 * @param {[Recipient, Recipient]} recipients - An array containing the two
 *                                              recipients for whom the strategy
 *                                              results are being calculated.
 * @param {[MonthDate, MonthDate]} finalDates - An array containing the final
 *                                              dates (death dates) for each
 *                                              recipient.
 * @param {MonthDate} currentDate - Today's date, used as the reference for NPV calculation.
 * @param {number} monthlyDiscountRate - Monthly discount rate (pre-calculated from annual rate).
 * @param {[MonthDuration, MonthDuration]} strats - An array containing the
 *                                                  filing ages (as
 *                                                  MonthDuration)
 *                                                  for each recipient.
 * @returns {Money} The net present value of all payments across all periods.
 */
export function strategySumTotalPeriods(
  recipients: [Recipient, Recipient],
  finalDates: [MonthDate, MonthDate],
  currentDate: MonthDate,
  monthlyDiscountRate: number,
  strats: [MonthDuration, MonthDuration]
): Money {
  const periods = strategySumPeriods(recipients, finalDates, strats);
  let totalNPVCents = 0;

  for (const period of periods) {
    const monthlyPaymentCents = period.amount.cents();

    // Determine the effective start and end dates for payments, considering currentDate
    // Payments are assumed to be received at the end of the month for the previous month's benefits.
    const firstPaymentDate = period.startDate.addDuration(new MonthDuration(1));
    const lastPaymentDate = period.endDate.addDuration(new MonthDuration(1));

    // The effective start of payments for NPV calculation is the later of currentDate + 1 month or firstPaymentDate
    const effectiveStartPaymentDate = MonthDate.max(
      currentDate.addDuration(new MonthDuration(1)),
      firstPaymentDate
    );
    const effectiveEndPaymentDate = lastPaymentDate;

    // If the effective start date is after the effective end date, no payments from this period contribute to NPV.
    if (effectiveStartPaymentDate.greaterThan(effectiveEndPaymentDate)) {
      continue;
    }

    const numberOfPayments =
      effectiveEndPaymentDate.monthsSinceEpoch() -
      effectiveStartPaymentDate.monthsSinceEpoch() +
      1;

    // Number of months from currentDate to the first payment of this effective period
    const monthsToFirstPayment =
      effectiveStartPaymentDate.monthsSinceEpoch() -
      currentDate.monthsSinceEpoch();

    if (monthlyDiscountRate === 0) {
      totalNPVCents += monthlyPaymentCents * numberOfPayments;
    } else {
      // Present value of an ordinary annuity formula: PV = P * [1 - (1 + r_m)^(-N)] / r_m
      // Then discount this PV back to currentDate: PV_discounted = PV * (1 + r_m)^(-k)
      const pvFactor =
        (1 - Math.pow(1 + monthlyDiscountRate, -numberOfPayments)) /
        monthlyDiscountRate;
      const discountFactorToCurrentDate = Math.pow(
        1 + monthlyDiscountRate,
        -monthsToFirstPayment
      );
      totalNPVCents +=
        monthlyPaymentCents * pvFactor * discountFactorToCurrentDate;
    }
  }

  return Money.fromCents(totalNPVCents);
}

function earliestFiling(
  recipient: Recipient,
  currentDate: MonthDate
): MonthDuration {
  // The earliest date that a recipient can file for benefits is governed by a
  // few rules:

  // 1) Cannot file before they are age 62 for an entire month. Essentially
  //    this means the month after their 62nd birthday, unless born on 1st or
  //    2nd of the month, then it's the month of their 62nd birthday.
  //    See: https://ssa.tools/guides/1st-and-2nd-of-month
  let earliestMonth = recipient.birthdate.earliestFilingMonth();

  const currentAge = recipient.birthdate.ageAtSsaDate(currentDate);

  // If that's now or in the future, done:
  if (earliestMonth.greaterThanOrEqual(currentAge)) {
    return earliestMonth;
  }

  // 2) You can only file retroactively back to your normal retirement age.
  if (recipient.normalRetirementAge().greaterThan(earliestMonth)) {
    // Though you can always file at the current age:
    if (recipient.normalRetirementAge().greaterThan(currentAge)) {
      earliestMonth = currentAge;
    } else {
      earliestMonth = recipient.normalRetirementAge();
    }
  }

  // 3) You can only file retroactively by at most 6 months.
  const sixMonthsAgo = currentAge.subtract(new MonthDuration(6));
  if (earliestMonth.lessThan(sixMonthsAgo)) {
    earliestMonth = sixMonthsAgo;
  }

  return earliestMonth;
}

/**
 * Calculates the optimal filing ages for a couple so as to maximize lifetime
 * benefits as returned by strategySumCents
 *
 * @param {[Recipient, Recipient]} recipients - An array containing the two
 *                                              recipients for whom the strategy
 *                                              results are being calculated.
 * @param {[MonthDate, MonthDate]} finalDates - An array containing the final
 *                                              dates (death dates) for each
 *                                              recipient.
 * @param {MonthDate} currentDate - Today's date.
 * @param {number} discountRate - Rate used for present value calculation. 0
 *                                means no discount.
 * @returns {[MonthDuration, MonthDuration]} An array containing the optimal
 *                                           filing ages for each recipient.
 */
export function optimalStrategy(
  recipients: [Recipient, Recipient],
  finalDates: [MonthDate, MonthDate],
  currentDate: MonthDate,
  discountRate: number
): [MonthDuration, MonthDuration, number] {
  let bestStrategy: [MonthDuration, MonthDuration, number] = [
    new MonthDuration(0),
    new MonthDuration(0),
    -1,
  ];

  // Calculate monthly discount rate once, since it doesn't change during optimization
  const monthlyDiscountRate = calculateMonthlyDiscountRate(discountRate);

  const startFilingDate0: number = earliestFiling(
    recipients[0],
    currentDate
  ).asMonths();
  const startFilingDate1: number = earliestFiling(
    recipients[1],
    currentDate
  ).asMonths();

  for (let i = startFilingDate0; i <= 70 * 12; ++i) {
    for (let j = startFilingDate1; j <= 70 * 12; ++j) {
      const strategy: [MonthDuration, MonthDuration] = [
        new MonthDuration(i),
        new MonthDuration(j),
      ];

      const outcome = strategySumCents(
        recipients,
        finalDates,
        currentDate,
        monthlyDiscountRate,
        strategy
      );
      if (outcome > bestStrategy[2]) {
        bestStrategy = [strategy[0], strategy[1], outcome];
      }
    }
  }

  return bestStrategy;
}

/**
 * Convenience function that returns the strategy sum in cents rather than as a Money object.
 * This is a wrapper around strategySumTotalPeriods that extracts the cents value.
 */
export function strategySumCents(
  recipients: [Recipient, Recipient],
  finalDates: [MonthDate, MonthDate],
  currentDate: MonthDate,
  discountRate: number,
  strats: [MonthDuration, MonthDuration]
): number {
  const monthlyDiscountRate = calculateMonthlyDiscountRate(discountRate);

  return strategySumTotalPeriods(
    recipients,
    finalDates,
    currentDate,
    monthlyDiscountRate,
    strats
  ).cents();
}
