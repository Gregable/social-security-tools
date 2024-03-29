// This worker calculates the optimal Social Security filing strategy for a
// married couple at every survival age. It uses a brute force algorithm to
// search for the best strategy, and then stores the results in shared memory.
// Several optimizations are used to reduce the number of iterations, including
// memoization and early stopping.

import { Recipient } from "$lib/recipient";
import { Money } from "$lib/money";
import { Birthdate } from "$lib/birthday";
import { MonthDate, MonthDuration } from "$lib/month-time";

// Age range to generate strategies for:
const MIN_AGE = 62;
const MAX_AGE = 110;

const minStratAge = MonthDuration.initFromYearsMonths({
  years: 62,
  months: 0,
});
const maxStratAge = MonthDuration.initFromYearsMonths({
  years: 70,
  months: 0,
});

// sharedAgeAUint16Array hold the recommended filing age for person A.
let sharedAgeAUint16Array: Uint16Array;
// sharedAgeBUint16Array hold the recommended filing age for person B.
let sharedAgeBUint16Array: Uint16Array;
// sharedStrategySumUint16Array holds the sum of the strategy, in cents.
let sharedStrategySumUint32Array: Uint32Array;

// Returns the index into the shared arrays for a given pair of ages.
function bufferIndex(ageMonths: Array<number>): number {
  const tableWidth = MAX_AGE - MIN_AGE + 1;
  const offsetAgeMonths = [ageMonths[0] - MIN_AGE, ageMonths[1] - MIN_AGE];
  return offsetAgeMonths[0] * tableWidth + offsetAgeMonths[1];
}

// Sum the personal benefit for a given recipient given a filing date and a
// final benefit date.
function PersonalBenefitStrategySum(
  recipient: Recipient,
  filingDate: MonthDate,
  finalDate: MonthDate
): number {
  // personal benefit is only one of 3 values:
  //  - 0
  //  - benefit for a few months after filing (see
  //    https://ssa.tools/guides/delayed-january-bump)
  //  - benefit for the rest of the time.
  // If we calculate these 3 values and their number of months, we can avoid a
  // loop which is a significant performance improvement.
  const monthsRemainingInFilingYear = 12 - filingDate.monthIndex();
  const numMonthsAfterInitialYear =
    finalDate.subtractDate(filingDate).asMonths() +
    1 -
    monthsRemainingInFilingYear;

  const janAfterFilingDate = filingDate.addDuration(
    new MonthDuration(monthsRemainingInFilingYear)
  );

  const initialPersonalBenefit = recipient
    .benefitOnDate(filingDate, filingDate)
    .cents();

  const finalPersonalBenefit = recipient
    .benefitOnDate(filingDate, janAfterFilingDate)
    .cents();

  return (
    initialPersonalBenefit * monthsRemainingInFilingYear +
    finalPersonalBenefit * numMonthsAfterInitialYear
  );
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

let personalSums: Array<Array<number>> = [[], []];

function setup(config: any) {
  memoizedSpousalBenefit = new Map();
  sharedAgeAUint16Array = config.ageValues[0];
  sharedAgeBUint16Array = config.ageValues[1];
  sharedStrategySumUint32Array = config.strategySumValues;

  // TODO: Ensure that recipientA is always the higher earner.
  for (let i = 0; i < 2; i++) {
    settings.recipients[i] = new Recipient();
    settings.recipients[i].setPia(Money.from(config.pias[i]));
    settings.recipients[i].birthdate = new Birthdate(config.birthdates[i]);

    // Pre-allocate the personalSums arrays. They are reused on each iteration,
    // not reallocated.
    personalSums[i] = [];
    for (let j = minStratAge.asMonths(); j <= maxStratAge.asMonths(); j++) {
      personalSums[i].push(0);
    }
  }

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
    strategySumCents +=
      personalSums[i][strats[i].asMonths() - minStratAge.asMonths()];
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
  // Don't add the personalSums[1] or spouse's benefit above if recipient[0]
  // dies before recipient[1].
  //
  // Instead, recalculate the personalSums[1] to take into account the date of
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
      //TODO: We've stopped adding spousal benefits above if the spouse is dead, but we are still adding personal benefits. We need to stop adding personal benefits and start adding spousal benefits at this time. One way to do this is to adjust personalSums to take into account the date of death of the spouse. I'm too tired to implement this now without making a mistake.
    }
  }

  return strategySumCents;
}

function run(finalAgeYears: [number, number]) {
  // Track the best strategy for this final age pair, seen so far:
  let bestStrategy = {
    strategySumCents: 0,
    ages: [
      MonthDuration.copyFrom(minStratAge),
      MonthDuration.copyFrom(minStratAge),
    ],
  };

  const birthdates: Array<Birthdate> = settings.recipients.map(
    (r) => r.birthdate
  );

  // Pre-calculate the final dates for each recipient:
  let finalDates: [MonthDate, MonthDate] = [null, null];
  for (let i = 0; i < 2; i++) {
    // We assume that the person will live until the last month of the year
    // in which they die in order to calculate the final benefit.
    finalDates[i] = birthdates[i].dateAtLayAge(
      MonthDuration.initFromYearsMonths({
        years: finalAgeYears[i],
        months: 11 - settings.recipients[i].birthdate.layBirthMonth(),
      })
    );
    // Pre-calculate the personal benefits once for each strategy. First,
    // loop over all strategies and calculate the personal benefit for each.
    for (
      let strat = MonthDuration.copyFrom(minStratAge);
      strat.lessThanOrEqual(maxStratAge);
      strat.increment()
    ) {
      const stratDate = birthdates[i].dateAtLayAge(strat);
      // Calculate the personal benefit for this strategy and final date.
      personalSums[i][strat.asMonths() - minStratAge.asMonths()] =
        PersonalBenefitStrategySum(
          settings.recipients[i],
          stratDate,
          finalDates[i]
        );
    }
  }

  // Main Loop for a single final age pair:
  // Search for the best strategy by brute force.
  for (
    let stratA = birthdates[0].earliestFilingMonth();
    stratA.lessThanOrEqual(maxStratAge);
    stratA.increment()
  ) {
    for (
      let stratB = birthdates[1].earliestFilingMonth();
      stratB.lessThanOrEqual(maxStratAge);
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
    for (let i = finalAgeYears[0] + 1; i <= MAX_AGE; i++) {
      const idx = bufferIndex([i, finalAgeYears[1]]);
      sharedAgeAUint16Array[idx] = bestStrategy.ages[0].asMonths();
      sharedAgeBUint16Array[idx] = bestStrategy.ages[1].asMonths();
      sharedStrategySumUint32Array[idx] = bestStrategy.strategySumCents;
    }
  }

  if (bestStrategy.ages[1].asMonths() == 70 * 12) {
    for (let i = finalAgeYears[1] + 1; i <= MAX_AGE; i++) {
      const idx = bufferIndex([finalAgeYears[0], i]);
      sharedAgeAUint16Array[idx] = bestStrategy.ages[0].asMonths();
      sharedAgeBUint16Array[idx] = bestStrategy.ages[1].asMonths();
      sharedStrategySumUint32Array[idx] = bestStrategy.strategySumCents;
    }
  }
}

function eventHandler(event: any) {
  setup(event.data);
  // Loop over all possible final ages and calculate the best strategy for each.
  for (let a = MIN_AGE; a <= MAX_AGE; a++) {
    for (let b = MIN_AGE; b <= MAX_AGE; b++) {
      const idx = bufferIndex([a, b]);
      // Skip if we've already calculated this value:
      if (sharedAgeAUint16Array[idx] == 0) {
        run([a, b]);
      }
    }
  }

  self.postMessage("");
}

self.addEventListener("message", eventHandler);
