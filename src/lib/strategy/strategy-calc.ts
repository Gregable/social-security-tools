import { MonthDate, MonthDuration } from "$lib/month-time";
import { Money } from "$lib/money";
import { Recipient } from "$lib/recipient";
import { PersonalBenefitStrategySum } from "$lib/strategy/recipient-personal-benefits";

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
 * @param {[MonthDuration, MonthDuration]} strats - An array containing the
 *                                                  filing ages (as
 *                                                  MonthDuration)
 *                                                  for each recipient.
 * @returns {number} The total lifetime benefit amount in cents for the couple.
 */
export function strategySumCents(
  recipients: [Recipient, Recipient],
  finalDates: [MonthDate, MonthDate],
  strats: [MonthDuration, MonthDuration]
): number {
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

  // Determine the higher and lower earner based on their Primary Insurance Amount (PIA).
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

  // Return value, total lifetime benefit in cents.
  let totalBenefitCents = 0;

  // Start by adding in the lifetime *personal* benefits of each recipient for
  // the filing strategy and final date.
  totalBenefitCents += PersonalBenefitStrategySum(
    earner,
    earner.birthdate.dateAtSsaAge(earnerStrat),
    earnerFinalDate
  );
  totalBenefitCents += PersonalBenefitStrategySum(
    dependent,
    dependent.birthdate.dateAtSsaAge(dependentStrat),
    dependentFinalDate
  );

  // Determine the start date for survivor benefits. This is the later of:
  // 1. The month after the earner's death date.
  // 2. The dependent's filing date for survivor benefits.
  const survivorStartDate = MonthDate.max(
    earnerFinalDate.addDuration(new MonthDuration(1)),
    dependentStratDate
  );

  // Calculate the monthly survivor benefit for the dependent, if eligible.
  let survivorBenefit: Money = Money.zero();
  if (dependentFinalDate.greaterThan(survivorStartDate)) {
    survivorBenefit = dependent.survivorBenefit(
      /*deceased*/ earner,
      /*deceasedFilingDate*/ earnerStratDate,
      /*deceasedDeathDate*/ earnerFinalDate,
      /*survivorFilingDate*/ survivorStartDate
    );

    // In Social Security rules, survivor benefits replace personal benefits.
    // However, for the purpose of this calculation, we add survivor benefits
    // on top of personal benefits and then subtract the personal benefit amount
    // to effectively calculate the incremental survivor benefit.
    survivorBenefit = survivorBenefit.sub(
      dependent.benefitOnDate(
        /*filingDate*/ dependentStratDate,
        // Add a year to include all late filing credits.
        /*atDate*/ dependentStratDate.addDuration(MonthDuration.OneYear())
      )
    );

    // A survivor benefit cannot be negative. Ensure at worst zero.
    if (survivorBenefit.value() < 0) survivorBenefit = Money.zero();
  }

  // Add in spousal benefits, if eligible:
  if (dependent.eligibleForSpousalBenefit(earner)) {
    // The start date for spousal benefits is the later of the two filing dates.
    const spousalStartDate = MonthDate.max(earnerStratDate, dependentStratDate);
    // The end date for spousal benefits is the earlier of when the dependent
    // starts receiving survivor benefits or their own death date.
    const spousalEndDate = MonthDate.min(
      survivorStartDate.subtractDuration(new MonthDuration(1)),
      // Include the month of the final date:
      dependentFinalDate.addDuration(new MonthDuration(1))
    );

    // Inclusive of both start and end dates, so add 1.
    const numMonthsOfSpousalBenefit =
      spousalEndDate.monthsSinceEpoch() -
      spousalStartDate.monthsSinceEpoch() +
      1;
    if (numMonthsOfSpousalBenefit > 0) {
      // Calculate the monthly spousal benefit for the dependent based on the earner's record.
      const spousalBenefitCents = dependent
        .spousalBenefitOnDateGivenStartDate(
          /*spouse=*/ earner,
          /*spouseFilingDate=*/ earnerStratDate,
          /*filingDate=*/ dependentStratDate,
          /*atDate=*/ spousalStartDate
        )
        .cents();
      totalBenefitCents += spousalBenefitCents * numMonthsOfSpousalBenefit;
    }
  }

  // Add in the total survivor benefits over the relevant period.
  if (dependentFinalDate.greaterThanOrEqual(survivorStartDate)) {
    const numMonthsofSurvivorBenefit = dependentFinalDate
      .subtractDate(survivorStartDate)
      .add(new MonthDuration(1))
      .asMonths();
    totalBenefitCents += survivorBenefit.cents() * numMonthsofSurvivorBenefit;
  }

  return totalBenefitCents;
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
 * @returns {[MonthDuration, MonthDuration]} An array containing the optimal
 *                                           filing ages for each recipient.
 */
export function optimalStrategy(
  recipients: [Recipient, Recipient],
  finalDates: [MonthDate, MonthDate],
  currentDate: MonthDate
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

      const outcome = strategySumCents(recipients, finalDates, strategy);
      if (outcome > bestStrategy[2]) {
        bestStrategy = [strategy[0], strategy[1], outcome];
      }
    }
  }

  return bestStrategy;
}
