import { MonthDate, MonthDuration } from "$lib/month-time";
import { Recipient } from "$lib/recipient";
import * as constants from "$lib/strategy/constants";
import {
  PersonalBenefitStrategySum,
  RecipientPersonalBenefits,
} from "$lib/strategy/recipient-personal-benefits";

/**
 * Calculates the total lifetime benefit in cents for a given Social Security
 * filing strategy.
 *
 * This function computes the sum of personal and spousal benefits for both
 * recipients based on their selected filing ages and expected final ages
 * (death dates).
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
  let strategySumCents = 0;

  // stratDates is the MonthDate version of the |strats| values. We calculate
  // the dates by offsetting the stategy ages from each recipients' birthdate.
  let stratDates: [MonthDate, MonthDate] = [null, null];
  for (let i = 0; i < 2; i++) {
    stratDates[i] = recipients[i].birthdate.dateAtLayAge(strats[i]);
  }

  // Start by adding in the lifetime *personal* benefits of each recipient for
  // the filing strategy and final date.
  for (let i = 0; i < 2; i++) {
    strategySumCents += PersonalBenefitStrategySum(
      recipients[i],
      recipients[i].birthdate.dateAtLayAge(strats[i]),
      finalDates[i]
    );
  }

  // Start survivor benefits at the month after the final date of the higher
  // earner or the strategy filing date of the lower earner, whichever is last:
  const survivorStartDate = MonthDate.max(
    // Starts the month after the earner does.
    finalDates[0].addDuration(new MonthDuration(1)),
    stratDates[1]
  );

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

      strategySumCents += spousalBenefitCents * numMonthsOfSpousalBenefit;
    }
  }

  // TODO: Survivor benefits.
  //
  // Don't add the recipientPersonalBenefits[1] or spouse's benefit above if
  // recipient[0] dies before recipient[1].
  //
  // Instead, recalculate the recipientPersonalBenefits[1] to take into account
  // the date of death of recipient[0] and their filing strategy.
  //
  // The rules are complicated, see especially the 2nd link:
  // https://www.ssa.gov/benefits/survivors/onyourown.html#h5
  // https://articles.opensocialsecurity.com/survivor-benefit-calculation/
  // The survivor benefit amount calculation depends on:
  // - The deceased's PIA
  // - The deceased's age at death
  // - The survivor's age
  // - Whether or not the deceased had already filed for benefits at the time
  //   of death
  //
  // As a result, we can't precalculate the survivor benefit amount until we
  // have selected a specific filing strategy for the deceased.
  //
  // First, calculate the base survivor benefit amount {
  //
  //   If the deceased had not filed before dying, then:
  //   - If the deceased died before FRA, the base is the deceased's PIA.
  //   - If the deceased died after FRA, the base is the deceased's benefit
  //     amount.
  //
  //   If the deceased had filed before dying, then the base is the greater of:
  //   - The amount the deceased was receiving at the time of death.
  //   - 82.5% of the deceased's PIA.
  //
  // }
  //
  // Next, adjust the base survivor benefit amount based on the survivor's age:
  // - If the survivor is older than FRA, the benefit is not adjusted.
  // - If the survivor is younger than FRA, the benefit is adjusted
  //   proportionally between 71.5% and 100% of the base amount based on the
  //   survivor's age between 60 and FRA.
  if (finalDates[1].greaterThan(survivorStartDate)) {
    // https://www.ssa.gov/benefits/survivors/survivorchartred.html shows the
    // adjustment if filing before FRA.
    const numMonths = survivorStartDate.subtractDate(finalDates[1]).asMonths();
    if (numMonths > 0) {
      //TODO: We've stopped adding spousal benefits above if the spouse is dead, but we are still adding personal benefits. We need to stop adding personal benefits and start adding spousal benefits at this time. One way to do this is to adjust recipientPersonalBenefits to take into account the date of death of the spouse. I'm too tired to implement this now without making a mistake.
    }
  }

  return strategySumCents;
}
