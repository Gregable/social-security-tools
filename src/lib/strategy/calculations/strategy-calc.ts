import { MonthDate, MonthDuration } from '$lib/month-time';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import { PersonalBenefitPeriods } from './recipient-personal-benefits.js';
import { BenefitType, BenefitPeriod } from './benefit-period.js';

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
  let earnerIndex: number;
  let dependentIndex: number;
  if (recipients[0].higherEarningsThan(recipients[1])) {
    earnerIndex = 0;
    dependentIndex = 1;
  } else {
    earnerIndex = 1;
    dependentIndex = 0;
  }
  earner = recipients[earnerIndex];
  dependent = recipients[dependentIndex];
  earnerFinalDate = finalDates[earnerIndex];
  dependentFinalDate = finalDates[dependentIndex];
  earnerStrat = strats[earnerIndex];
  dependentStrat = strats[dependentIndex];
  earnerStratDate = stratDates[earnerIndex];
  dependentStratDate = stratDates[dependentIndex];

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
  PersonalBenefitPeriods(
    earner,
    earner.birthdate.dateAtSsaAge(earnerStrat),
    earnerFinalDate,
    periods,
    earnerIndex
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
  PersonalBenefitPeriods(
    dependent,
    dependent.birthdate.dateAtSsaAge(dependentStrat),
    dependentFinalPersonalDate,
    periods,
    dependentIndex
  );

  // Dependent's Survivor Benefit:
  if (isSurvivorBenefitApplicable) {
    let survivorPeriod = new BenefitPeriod();
    survivorPeriod.amount = survivorBenefit;
    survivorPeriod.startDate = survivorStartDate;
    survivorPeriod.endDate = dependentFinalDate;
    survivorPeriod.recipientIndex = dependentIndex;
    survivorPeriod.benefitType = BenefitType.Survivor;
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
      spousalPeriod.recipientIndex = dependentIndex;
      spousalPeriod.benefitType = BenefitType.Spousal;
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
 * Calculates NPV for a single period with optional memoization.
 * This helper can be used by both the original and optimized functions.
 */
function calculatePeriodNPV(
  monthlyPaymentCents: number,
  numberOfPayments: number,
  monthsToFirstPayment: number,
  monthlyDiscountRate: number,
  pvFactorCache?: Map<number, number>,
  discountFactorCache?: Map<number, number>
): number {
  if (monthlyDiscountRate === 0) {
    return monthlyPaymentCents * numberOfPayments;
  }

  let pvFactor: number;
  let discountFactorToCurrentDate: number;

  // Use memoization if caches are provided
  if (pvFactorCache && discountFactorCache) {
    pvFactor = getMemoizedPVFactor(
      numberOfPayments,
      monthlyDiscountRate,
      pvFactorCache
    );
    discountFactorToCurrentDate = getMemoizedDiscountFactor(
      monthsToFirstPayment,
      monthlyDiscountRate,
      discountFactorCache
    );
  } else {
    // Direct calculation for non-memoized case
    pvFactor =
      (1 - Math.pow(1 + monthlyDiscountRate, -numberOfPayments)) /
      monthlyDiscountRate;
    discountFactorToCurrentDate = Math.pow(
      1 + monthlyDiscountRate,
      -monthsToFirstPayment
    );
  }

  return monthlyPaymentCents * pvFactor * discountFactorToCurrentDate;
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

    const monthsToFirstPayment =
      effectiveStartPaymentDate.monthsSinceEpoch() -
      currentDate.monthsSinceEpoch();

    totalNPVCents += calculatePeriodNPV(
      monthlyPaymentCents,
      numberOfPayments,
      monthsToFirstPayment,
      monthlyDiscountRate
    );
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
 * Cache for memoizing expensive NPV calculations.
 */
interface NPVCache {
  pvFactorCache: Map<number, number>;
  discountFactorCache: Map<number, number>;
}

/**
 * Memoized calculation of present value factor for an annuity.
 * PV Factor = [1 - (1 + r)^(-N)] / r
 */
function getMemoizedPVFactor(
  numberOfPayments: number,
  monthlyDiscountRate: number,
  cache: Map<number, number>
): number {
  if (cache.has(numberOfPayments)) {
    return cache.get(numberOfPayments)!;
  }

  const pvFactor =
    (1 - Math.pow(1 + monthlyDiscountRate, -numberOfPayments)) /
    monthlyDiscountRate;

  cache.set(numberOfPayments, pvFactor);
  return pvFactor;
}

/**
 * Memoized calculation of discount factor to current date.
 * Discount Factor = (1 + r)^(-k) where k is months to first payment
 */
function getMemoizedDiscountFactor(
  monthsToFirstPayment: number,
  monthlyDiscountRate: number,
  cache: Map<number, number>
): number {
  if (cache.has(monthsToFirstPayment)) {
    return cache.get(monthsToFirstPayment)!;
  }

  const discountFactor = Math.pow(
    1 + monthlyDiscountRate,
    -monthsToFirstPayment
  );

  cache.set(monthsToFirstPayment, discountFactor);
  return discountFactor;
}

/**
 * Optimized context for strategy calculations that extracts invariant computations.
 */
interface OptimizationContext {
  earner: Recipient;
  dependent: Recipient;
  earnerFinalDate: MonthDate;
  dependentFinalDate: MonthDate;
  earnerIndex: number;
  dependentIndex: number;
  dependentHasZeroPia: boolean;
  isSpousalBenefitEligible: boolean;
  monthlyDiscountRate: number;
  currentDatePlusOne: MonthDate;
  npvCache: NPVCache;
}

/**
 * Creates an optimization context by pre-computing invariant values.
 */
function createOptimizationContext(
  recipients: [Recipient, Recipient],
  finalDates: [MonthDate, MonthDate],
  currentDate: MonthDate,
  monthlyDiscountRate: number
): OptimizationContext {
  // Determine the higher and lower earner based on their Primary Insurance Amount (PIA).
  let earner: Recipient;
  let dependent: Recipient;
  let earnerFinalDate: MonthDate;
  let dependentFinalDate: MonthDate;
  let earnerIndex: number;
  let dependentIndex: number;

  if (recipients[0].higherEarningsThan(recipients[1])) {
    earner = recipients[0];
    dependent = recipients[1];
    earnerFinalDate = finalDates[0];
    dependentFinalDate = finalDates[1];
    earnerIndex = 0;
    dependentIndex = 1;
  } else {
    earner = recipients[1];
    dependent = recipients[0];
    earnerFinalDate = finalDates[1];
    dependentFinalDate = finalDates[0];
    earnerIndex = 1;
    dependentIndex = 0;
  }

  const dependentHasZeroPia =
    dependent.pia().primaryInsuranceAmount().cents() == 0;
  const isSpousalBenefitEligible = dependent.eligibleForSpousalBenefit(earner);

  return {
    earner,
    dependent,
    earnerFinalDate,
    dependentFinalDate,
    earnerIndex,
    dependentIndex,
    dependentHasZeroPia,
    isSpousalBenefitEligible,
    monthlyDiscountRate,
    currentDatePlusOne: currentDate.addDuration(new MonthDuration(1)),
    npvCache: {
      pvFactorCache: new Map<number, number>(),
      discountFactorCache: new Map<number, number>(),
    },
  };
}

/**
 * Optimized strategy sum calculation using pre-computed context.
 */
function strategySumCentsOptimized(
  currentDate: MonthDate,
  context: OptimizationContext,
  strats: [MonthDuration, MonthDuration]
): number {
  // Extract strategy values based on earner/dependent roles
  const earnerStrat = strats[context.earnerIndex];
  const dependentStrat = strats[context.dependentIndex];

  // Calculate filing dates
  let earnerStratDate = context.earner.birthdate.dateAtSsaAge(earnerStrat);
  let dependentStratDate =
    context.dependent.birthdate.dateAtSsaAge(dependentStrat);

  // If the dependent has 0 PIA, then they can't file earlier than the earner.
  // Move the dependent's filing date up to the earner's:
  if (
    context.dependentHasZeroPia &&
    dependentStratDate.lessThan(earnerStratDate)
  ) {
    dependentStratDate = earnerStratDate;
  }

  const periods = strategySumPeriodsOptimized(
    context,
    earnerStratDate,
    dependentStratDate
  );

  let totalNPVCents = 0;

  for (const period of periods) {
    const monthlyPaymentCents = period.amount.cents();

    // Determine the effective start and end dates for payments, considering currentDate
    // Payments are assumed to be received at the end of the month for the previous month's benefits.
    const firstPaymentDate = period.startDate.addDuration(new MonthDuration(1));
    const lastPaymentDate = period.endDate.addDuration(new MonthDuration(1));

    // The effective start of payments for NPV calculation is the later of currentDate + 1 month or firstPaymentDate
    const effectiveStartPaymentDate = MonthDate.max(
      context.currentDatePlusOne,
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

    const monthsToFirstPayment =
      effectiveStartPaymentDate.monthsSinceEpoch() -
      currentDate.monthsSinceEpoch();

    totalNPVCents += calculatePeriodNPV(
      monthlyPaymentCents,
      numberOfPayments,
      monthsToFirstPayment,
      context.monthlyDiscountRate,
      context.npvCache.pvFactorCache,
      context.npvCache.discountFactorCache
    );
  }

  return totalNPVCents;
}

/**
 * Optimized version of strategySumPeriods using pre-computed context.
 */
function strategySumPeriodsOptimized(
  context: OptimizationContext,
  earnerStratDate: MonthDate,
  dependentStratDate: MonthDate
): BenefitPeriod[] {
  let periods: BenefitPeriod[] = new Array();

  // Determine the start date for survivor benefits. This is the later of:
  // 1. The month after the earner's death date.
  // 2. The dependent's filing date.
  const survivorStartDate = MonthDate.max(
    context.earnerFinalDate.addDuration(new MonthDuration(1)),
    dependentStratDate
  );

  // Determine the dependent's survivor benefit amount:
  let isSurvivorBenefitApplicable = false;
  let survivorBenefit: Money = Money.zero();
  if (context.dependentFinalDate.greaterThan(survivorStartDate)) {
    survivorBenefit = context.dependent.survivorBenefit(
      /*deceased*/ context.earner,
      /*deceasedFilingDate*/ earnerStratDate,
      /*deceasedDeathDate*/ context.earnerFinalDate,
      /*survivorFilingDate*/ survivorStartDate
    );
    // Note that if the survivor's personal benefit is greater than their
    // survivor benefit, they will not switch to a survivor benefit.
    const dependentFinalPersonalBenefit = context.dependent.benefitOnDate(
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
  PersonalBenefitPeriods(
    context.earner,
    earnerStratDate,
    context.earnerFinalDate,
    periods,
    context.earnerIndex
  );

  // The latest that the dependent will be collecting a personal benefit is the
  // month before starting a survivor benefit.
  let dependentFinalPersonalDate = context.dependentFinalDate;
  if (
    isSurvivorBenefitApplicable &&
    context.dependentFinalDate.greaterThanOrEqual(survivorStartDate)
  ) {
    dependentFinalPersonalDate = survivorStartDate.subtractDuration(
      new MonthDuration(1)
    );
  }

  // Dependent's Personal Benefit:
  PersonalBenefitPeriods(
    context.dependent,
    dependentStratDate,
    dependentFinalPersonalDate,
    periods,
    context.dependentIndex
  );

  // Dependent's Survivor Benefit:
  if (isSurvivorBenefitApplicable) {
    let survivorPeriod = new BenefitPeriod();
    survivorPeriod.amount = survivorBenefit;
    survivorPeriod.startDate = survivorStartDate;
    survivorPeriod.endDate = context.dependentFinalDate;
    survivorPeriod.recipientIndex = context.dependentIndex;
    periods.push(survivorPeriod);
  }

  // Dependent's Spousal Benefit:
  if (context.isSpousalBenefitEligible) {
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
      context.dependentFinalDate.addDuration(new MonthDuration(1))
    );

    if (spousalPeriod.endDate.greaterThanOrEqual(spousalPeriod.startDate)) {
      spousalPeriod.amount =
        context.dependent.spousalBenefitOnDateGivenStartDate(
          /*spouse=*/ context.earner,
          /*spouseFilingDate=*/ earnerStratDate,
          /*filingDate=*/ dependentStratDate,
          /*atDate=*/ spousalPeriod.startDate
        );
      spousalPeriod.recipientIndex = context.dependentIndex;
      spousalPeriod.benefitType = BenefitType.Spousal;
      periods.push(spousalPeriod);
    }
  }

  return periods;
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
        discountRate,
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
export function optimalStrategyOptimized(
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

  // Pre-compute optimization context to avoid repeated calculations
  const context = createOptimizationContext(
    recipients,
    finalDates,
    currentDate,
    monthlyDiscountRate
  );

  const startFilingDate0: number = earliestFiling(
    recipients[0],
    currentDate
  ).asMonths();
  const startFilingDate1: number = earliestFiling(
    recipients[1],
    currentDate
  ).asMonths();

  // Pre-compute final loop bounds to avoid expensive calculations in loops
  const endFilingAge0: number = Math.min(
    70 * 12,
    recipients[0].birthdate.ageAtSsaDate(finalDates[0]).asMonths()
  );
  const endFilingAge1: number = Math.min(
    70 * 12,
    recipients[1].birthdate.ageAtSsaDate(finalDates[1]).asMonths()
  );

  for (let i = startFilingDate0; i <= endFilingAge0; ++i) {
    for (let j = startFilingDate1; j <= endFilingAge1; ++j) {
      const strategy: [MonthDuration, MonthDuration] = [
        new MonthDuration(i),
        new MonthDuration(j),
      ];

      const outcome = strategySumCentsOptimized(currentDate, context, strategy);
      /*const outcome = strategySumCents(
        recipients,
        finalDates,
        currentDate,
        discountRate,
        strategy
      );*/
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
