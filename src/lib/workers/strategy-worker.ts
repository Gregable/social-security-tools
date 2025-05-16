// This worker calculates the optimal Social Security filing strategy for a
// married couple at every survival age. It uses a brute force algorithm to
// search for the best strategy, and then stores the results in shared memory.
// Several optimizations are used to reduce the number of iterations, including
// memoization and early stopping.

import { Recipient } from "$lib/recipient";
import { Birthdate } from "$lib/birthday";
import { MonthDate, MonthDuration } from "$lib/month-time";
import { RecipientPersonalBenefits } from "$lib/strategy/recipient-personal-benefits";
import * as constants from "$lib/strategy/constants";

// sharedAgeAUint16Array hold the recommended filing age for person A.
let sharedAgeAUint16Array: Uint16Array;
// sharedAgeBUint16Array hold the recommended filing age for person B.
let sharedAgeBUint16Array: Uint16Array;
// sharedStrategySumUint16Array holds the sum of the strategy, in cents.
let sharedStrategySumUint32Array: Uint32Array;

// Returns the index into the shared arrays for a given pair of ages.
function bufferIndex(ageMonths: Array<number>): number {
  const tableWidth = constants.MAX_AGE - constants.MIN_AGE + 1;
  const offsetAgeMonths = [
    ageMonths[0] - constants.MIN_AGE,
    ageMonths[1] - constants.MIN_AGE,
  ];
  return offsetAgeMonths[0] * tableWidth + offsetAgeMonths[1];
}

// memoize table for spousal benefit.
let memoizedSpousalBenefit: Map<number, number> = new Map();

function MemoizedSpousalBenefitCents(
  recipient: Recipient,
  spouse: Recipient,
  startDate: MonthDate
): number {
  // Return a memoized value if it exists:
  const memoizedKey: number = startDate.monthsSinceEpoch();
  if (memoizedSpousalBenefit.has(memoizedKey)) {
    return memoizedSpousalBenefit.get(memoizedKey);
  }

  const spousalBenefitCents = recipient
    .spousalBenefitOnDateGivenStartDate(spouse, startDate, startDate)
    .cents();

  // Memoize the result:
  memoizedSpousalBenefit.set(memoizedKey, spousalBenefitCents);
  return spousalBenefitCents;
}

let settings = {
  recipients: [null, null],
  eligibleForSpousal: false,
};

let recipientPersonalBenefits = new RecipientPersonalBenefits();

function setup(config: any) {
  memoizedSpousalBenefit = new Map();
  sharedAgeAUint16Array = config.ageValues[0];
  sharedAgeBUint16Array = config.ageValues[1];
  sharedStrategySumUint32Array = config.strategySumValues;

  // Precalculate spousal eligibility:
  settings.eligibleForSpousal =
    settings.recipients[1].eligibleForSpousalBenefit(settings.recipients[0]);
}

// TODO: Add survivor benefit.
// TODO: Account for time value.

// Sums the personal and spousal benefits for a given strategy and final age.
function strategySumCents(
  finalDates: [MonthDate, MonthDate],
  strats: [MonthDuration, MonthDuration]
): number {
  let strategySumCents = 0;
  // stratDates is the MonthDate version of the |strats| values relative to the
  // birthdates of the recipients.
  let stratDates: [MonthDate, MonthDate] = [null, null];
  for (let i = 0; i < 2; i++) {
    stratDates[i] = settings.recipients[i].birthdate.dateAtLayAge(strats[i]);
    strategySumCents += recipientPersonalBenefits.getLifetimeBenefitForFinalAge(
      i,
      strats[i]
    );
  }

  // Start the month after the final date of the higher earner or the start of
  // their strategy, whichever is later:
  const survivorStartDate = MonthDate.max(
    finalDates[1].addDuration(new MonthDuration(1)),
    stratDates[0]
  );

  // Add in spousal benefits, if eligible:
  if (settings.eligibleForSpousal) {
    const spousalStartDate = MonthDate.max(stratDates[0], stratDates[1]);
    const spousalEndDate = MonthDate.min(
      survivorStartDate,
      // Include the month of the final date:
      finalDates[1].addDuration(new MonthDuration(1))
    );
    const numMonths = spousalEndDate.monthsSinceEpoch();
    spousalStartDate.monthsSinceEpoch();
    if (numMonths > 0) {
      const spousalBenefitCents = MemoizedSpousalBenefitCents(
        settings.recipients[1],
        settings.recipients[0],
        spousalStartDate
      );

      strategySumCents += spousalBenefitCents * numMonths;
    }
  }

  // TODO: Survivor benefits.
  //
  // Don't add the recipientPersonalBenefits[1] or spouse's benefit above if recipient[0]
  // dies before recipient[1].
  //
  // Instead, recalculate the recipientPersonalBenefits[1] to take into account the date of
  // death of recipient[0] and their filing strategy.
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
  if (finalDates[0].greaterThan(survivorStartDate)) {
    // https://www.ssa.gov/benefits/survivors/survivorchartred.html shows the
    // adjustment if filing before FRA.
    const numMonths = survivorStartDate.subtractDate(finalDates[1]).asMonths();
    if (numMonths > 0) {
      //TODO: We've stopped adding spousal benefits above if the spouse is dead, but we are still adding personal benefits. We need to stop adding personal benefits and start adding spousal benefits at this time. One way to do this is to adjust recipientPersonalBenefits to take into account the date of death of the spouse. I'm too tired to implement this now without making a mistake.
    }
  }

  return strategySumCents;
}

/**
 * Calculates the final benefit date for a recipient based on their projected
 * age at death.
 *
 * This function determines the last month for which benefits would be paid,
 * which is December of the year the recipient reaches the specified age.
 *
 * @param {number} recipientIdx - Index of the recipient
 * @param {number} finalAgeYear - The age (in years) at which the recipient is
 *                                projected to die
 * @returns {MonthDate} A MonthDate object representing the final month for
 *                      benefit calculation
 */
function calculateFinalBenefitDate(
  recipientIdx: number,
  finalAgeYear: number
): MonthDate {
  const recipient = settings.recipients[recipientIdx];

  // Get the date when the recipient reaches the specified age
  const dateAtSpecifiedAge = recipient.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({ years: finalAgeYear, months: 0 })
  );

  // Create a date for December of that year
  return MonthDate.initFromYearsMonths({
    years: dateAtSpecifiedAge.year(),
    months: 11, // December (zero-indexed)
  });
}

/**
 * Calculate the optimal strategy given that the couple dies at the given ages.
 *
 * @param {[number, number]} finalAgeYears - A tuple containing the final ages
 *                                           for both recipients.
 * @returns {number} Total personal benefit amount in cents across the period.
 */
function maximizeBenefitsByFinalAges(finalAgeYears: [number, number]) {
  // Track the best strategy for this final age pair, seen so far:
  let bestStrategy = {
    strategySumCents: 0,
    ages: [
      MonthDuration.copyFrom(constants.MIN_STRATEGY_AGE),
      MonthDuration.copyFrom(constants.MIN_STRATEGY_AGE),
    ],
  };

  // Extract the birthdates from the recipients.
  const birthdates: Array<Birthdate> = settings.recipients.map(
    (r) => r.birthdate
  );

  // Calculate the final dates for each recipient:
  let finalDates: [MonthDate, MonthDate] = [
    calculateFinalBenefitDate(0, finalAgeYears[0]),
    calculateFinalBenefitDate(1, finalAgeYears[1]),
  ];

  for (let i = 0; i < 2; i++) {
    recipientPersonalBenefits.computeAllBenefits(
      i,
      settings.recipients[i],
      finalDates[i]
    );
  }

  // Main Loop for a single final age pair:
  // Search for the best strategy by brute force.
  for (
    let stratA = birthdates[0].earliestFilingMonth();
    stratA.lessThanOrEqual(constants.MAX_STRATEGY_AGE);
    stratA.increment()
  ) {
    for (
      let stratB = birthdates[1].earliestFilingMonth();
      stratB.lessThanOrEqual(constants.MAX_STRATEGY_AGE);
      stratB.increment()
    ) {
      const sum = strategySumCents(finalDates, [stratA, stratB]);

      if (sum > bestStrategy.strategySumCents) {
        bestStrategy = {
          strategySumCents: sum,
          ages: [
            MonthDuration.copyFrom(stratA),
            MonthDuration.copyFrom(stratB),
          ],
        };
      }
    }
  }

  const idx = bufferIndex(finalAgeYears);
  sharedAgeAUint16Array[idx] = bestStrategy.ages[0].asMonths();
  sharedAgeBUint16Array[idx] = bestStrategy.ages[1].asMonths();
  sharedStrategySumUint32Array[idx] = bestStrategy.strategySumCents;

  // Optimization: If the best strategy is to file at 70, then we can assume
  // all later ages also have a best strategy of 70 rather than calculating it.
  if (bestStrategy.ages[0].asMonths() == 70 * 12) {
    for (let i = finalAgeYears[0] + 1; i <= constants.MAX_AGE; i++) {
      const idx = bufferIndex([i, finalAgeYears[1]]);
      sharedAgeAUint16Array[idx] = bestStrategy.ages[0].asMonths();
      sharedAgeBUint16Array[idx] = bestStrategy.ages[1].asMonths();
      sharedStrategySumUint32Array[idx] = bestStrategy.strategySumCents;
    }
  }

  if (bestStrategy.ages[1].asMonths() == 70 * 12) {
    for (let i = finalAgeYears[1] + 1; i <= constants.MAX_AGE; i++) {
      const idx = bufferIndex([finalAgeYears[0], i]);
      sharedAgeAUint16Array[idx] = bestStrategy.ages[0].asMonths();
      sharedAgeBUint16Array[idx] = bestStrategy.ages[1].asMonths();
      sharedStrategySumUint32Array[idx] = bestStrategy.strategySumCents;
    }
  }
}
