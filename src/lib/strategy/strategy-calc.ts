import { MonthDate, MonthDuration } from "$lib/month-time";
import { Money } from "$lib/money";
import { Recipient } from "$lib/recipient";
import { PersonalBenefitStrategySum } from "$lib/strategy/recipient-personal-benefits";

/**
 * Calculates the total lifetime benefit in cents for a given Social Security
 * filing strategy.
 *
 * This function computes the sum of personal, spousal, and survivor benefits
 * for both recipients based on their selected filing ages and expected final
 * ages (death dates).
 *
 * @param {[Recipient, Recipient]} recipients - Array containing the
 *                                              recipients for whom we want to
 *                                              calculate the strategy results.
 * @param {[MonthDate, MonthDate]} finalDates - Array containing the final
 *                                              dates (death dates)
 *                                              for each recipient
 * @param {[MonthDuration, MonthDuration]} strats - Array containing the filing
 *                                                  ages for each recipient
 * @returns {number} The total lifetime benefit amount in cents
 */
function strategySumCents(
  recipients: [Recipient, Recipient],
  finalDates: [MonthDate, MonthDate],
  strats: [MonthDuration, MonthDuration]
): number {
  // TODO: This assumes that recipient[0] is the higher earner. Remove that
  // assumption.

  // Return value, total lifetime benefit in cents.
  let result = 0;

  // stratDates is the MonthDate version of the |strats| values. We calculate
  // the dates by offsetting the stategy ages from each recipients' birthdate.
  let stratDates: [MonthDate, MonthDate] = [null, null];
  for (let i = 0; i < 2; i++) {
    stratDates[i] = recipients[i].birthdate.dateAtLayAge(strats[i]);
  }

  // Start survivor benefits at the month after the final date of the higher
  // earner or the strategy filing date of the lower earner, whichever is last:
  const survivorStartDate = MonthDate.max(
    // Starts the month after the earner does.
    finalDates[0].addDuration(new MonthDuration(1)),
    stratDates[1]
  );

  // Calculate the monthly survivor benefit for recipient[1].
  let survivorBenefit: Money = Money.zero();
  if (finalDates[1].greaterThan(survivorStartDate)) {
    survivorBenefit = recipients[1].survivorBenefit(
      /*deceased*/ recipients[0],
      /*deceasedFilintDate*/ stratDates[0],
      /*deceasedDeathDate*/ finalDates[0],
      /*survivorFilingDate*/ stratDates[1]
    );

    // Technically spousal benefits are in addition to one's personal benefit,
    // while survivor benefits replace one's personal benefit. For the sake of
    // this calculation, however, we will treat survivor benefits like spousal
    // benefits, as an additional benefit on top of one's personal benefit.
    // This is done by subtracting the personal benefit.
    survivorBenefit = survivorBenefit.sub(
      recipients[1].benefitOnDate(
        /*filingDate*/ stratDates[1],
        // Add a year to include all late filing credits.
        /*atDate*/ stratDates[1].addDuration(MonthDuration.OneYear())
      )
    );

    // You can't lose money with a survivor benefit, so ensure at worst zero.
    if (survivorBenefit.value() < 0) survivorBenefit = Money.zero();
  }

  // Start by adding in the lifetime *personal* benefits of each recipient for
  // the filing strategy and final date.
  for (let i = 0; i < 2; i++) {
    result += PersonalBenefitStrategySum(
      recipients[i],
      recipients[i].birthdate.dateAtLayAge(strats[i]),
      finalDates[i]
    );
  }

  // Add in spousal benefits, if eligible:
  if (recipients[1].eligibleForSpousalBenefit(recipients[0])) {
    // The start date is the later of the two filing dates.
    const spousalStartDate = MonthDate.max(stratDates[0], stratDates[1]);
    // The end date is either when the recipient starts survivor benefits or
    // dies themselves.
    const spousalEndDate = MonthDate.min(
      survivorStartDate.subtractDuration(new MonthDuration(1)),
      // Include the month of the final date:
      finalDates[1].addDuration(new MonthDuration(1))
    );

    const numMonthsOfSpousalBenefit =
      spousalEndDate.monthsSinceEpoch() - spousalStartDate.monthsSinceEpoch();
    if (numMonthsOfSpousalBenefit > 0) {
      // Benefits are calculated for the lower earning recipient (recipient[1])
      // on their spouse's (recipient[0]) earning's record.
      const spousalBenefitCents = recipients[1]
        .spousalBenefitOnDateGivenStartDate(
          /*spouse=*/ recipients[0],
          /*spouseFilingDate=*/ stratDates[0],
          /*filingDate=*/ stratDates[1],
          /*atDate=*/ spousalStartDate
        )
        .cents();

      result += spousalBenefitCents * numMonthsOfSpousalBenefit;
    }
  }

  // Survivor benefits.
  if (finalDates[1].greaterThan(survivorStartDate)) {
    const numMonthsofSurvivorBenefit = finalDates[1]
      .subtractDate(survivorStartDate)
      .asMonths();
    result += survivorBenefit.cents() * numMonthsofSurvivorBenefit;
  }

  return result;
}
