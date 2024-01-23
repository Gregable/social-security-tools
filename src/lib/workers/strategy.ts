import { Recipient } from "$lib/recipient";
import { Money } from "$lib/money";
import { Birthdate } from "$lib/birthday";
import { MonthDate, MonthDuration } from "$lib/month-time";

// Age range to generate strategies for:
const MIN_AGE = 62;
const MAX_AGE = 110;

const minStrategyAge = MonthDuration.initFromYearsMonths({
  years: 62,
  months: 0,
});
const maxStrategyAge = MonthDuration.initFromYearsMonths({
  years: 70,
  months: 0,
});

// sharedAgeAUint16Array hold the recommended filing age for person A.
let sharedAgeAUint16Array: Uint16Array;
// sharedAgeBUint16Array hold the recommended filing age for person B.
let sharedAgeBUint16Array: Uint16Array;
// sharedStrategySumUint16Array holds the sum of the strategy, in cents.
let sharedStrategySumUint32Array: Uint32Array;

function bufferIndex(ageAMonths: number, ageBMonths: number): number {
  const tableWidth = MAX_AGE - MIN_AGE + 1;
  const offsetAgeAMonths = ageAMonths - MIN_AGE;
  const offsetAgeBMonths = ageBMonths - MIN_AGE;

  return offsetAgeAMonths * tableWidth + offsetAgeBMonths;
}

// Sum the personal benefit for a given recipient given a filing date and a
// final benefit date.
function PersonalBenefitStrategySum(
  recipient: Recipient,
  filingDate: MonthDate,
  finalDate: MonthDate
): number {
  // personal benefit is only one of 3 values: 0, the benefit for a few months
  // after filing, and the benefit for the rest of the time. If we calculate
  // these 3 values and their number of months, we can avoid a loop
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
  recipientA: null,
  recipientB: null,
  eligibleForSpousal: false,
};

let personalASums: Array<number> = [];
let personalBSums: Array<number> = [];

function setup(config: any) {
  memoizedSpousalBenefit = new Map();
  sharedAgeAUint16Array = config.ageAValues;
  sharedAgeBUint16Array = config.ageBValues;
  sharedStrategySumUint32Array = config.strategySumValues;

  // TODO: Ensure that recipientA is always the higher earner.
  settings.recipientA = new Recipient();
  settings.recipientB = new Recipient();
  settings.recipientA.setPia(Money.from(config.piaA));
  settings.recipientB.setPia(Money.from(config.piaB));

  settings.recipientA.birthdate = Birthdate.FromYMD(
    config.birthdateA.year,
    config.birthdateA.month,
    config.birthdateA.day
  );
  settings.recipientB.birthdate = Birthdate.FromYMD(
    config.birthdateB.year,
    config.birthdateB.month,
    config.birthdateB.day
  );

  // Precalculate spousal eligibility:
  settings.eligibleForSpousal = settings.recipientB.eligibleForSpousalBenefit(
    settings.recipientA
  );

  // Pre-allocate the personal*Sums arrays. They are reused on each iteration,
  // not reallocated.
  personalASums = [];
  personalBSums = [];
  for (
    let i = MonthDuration.copyFrom(minStrategyAge);
    i.lessThanOrEqual(maxStrategyAge);
    i.increment()
  ) {
    personalASums.push(0);
    personalBSums.push(0);
  }
}

// TODO: Add survivor benefit.
// TODO: Account for time value.

// Sums the personal and spousal benefits for a given strategy and final age.
function strategySumCents(
  finalDateB: MonthDate,
  stratA: MonthDuration,
  stratB: MonthDuration
): number {
  const stratADate: MonthDate =
    settings.recipientA.birthdate.dateAtLayAge(stratA);
  const personalASum =
    personalASums[stratA.asMonths() - minStrategyAge.asMonths()];
  const stratBDate = settings.recipientB.birthdate.dateAtLayAge(stratB);
  const personalBSum =
    personalBSums[stratB.asMonths() - minStrategyAge.asMonths()];

  let strategySumCents = personalASum + personalBSum;

  if (settings.eligibleForSpousal) {
    const spousalStartDate = stratBDate.greaterThan(stratADate)
      ? stratBDate
      : stratADate;
    const numMonths =
      finalDateB.monthsSinceEpoch() - spousalStartDate.monthsSinceEpoch() + 1;
    if (numMonths > 0) {
      const spousalBenefitCents = MemoizedSpousalBenefitCents(
        settings.recipientB,
        settings.recipientA,
        spousalStartDate
      );

      strategySumCents += spousalBenefitCents * numMonths;
    }
  }
  return strategySumCents;
}

function run(finalAgeAYears: number, finalAgeBYears: number) {
  const finalAgeA = MonthDuration.initFromYearsMonths({
    years: finalAgeAYears,
    months: 11,
  });
  const finalAgeB = MonthDuration.initFromYearsMonths({
    years: finalAgeBYears,
    months: 11,
  });
  const finalDateA: MonthDate =
    settings.recipientA.birthdate.dateAtLayAge(finalAgeA);
  const finalDateB: MonthDate =
    settings.recipientB.birthdate.dateAtLayAge(finalAgeB);

  const exhaustiveSearch = true;

  let bestStrategy = {
    strategySumCents: 0,
    ageA: MonthDuration.copyFrom(minStrategyAge),
    ageB: MonthDuration.copyFrom(minStrategyAge),
  };
  // Pre-calculate the personal benefits once for each strategy:
  // Personal benefits for person A:
  for (
    let stratA = MonthDuration.copyFrom(minStrategyAge);
    stratA.lessThanOrEqual(maxStrategyAge);
    stratA.increment()
  ) {
    const stratADate = settings.recipientA.birthdate.dateAtLayAge(stratA);
    personalASums[stratA.asMonths() - minStrategyAge.asMonths()] =
      PersonalBenefitStrategySum(settings.recipientA, stratADate, finalDateA);
  }

  // Personal benefits for person B:
  for (
    let stratB = MonthDuration.copyFrom(minStrategyAge);
    stratB.lessThanOrEqual(maxStrategyAge);
    stratB.increment()
  ) {
    const stratBDate = settings.recipientB.birthdate.dateAtLayAge(stratB);
    personalBSums[stratB.asMonths() - minStrategyAge.asMonths()] =
      PersonalBenefitStrategySum(settings.recipientB, stratBDate, finalDateB);
  }

  // Search for the best strategy by brute force:
  for (
    let stratA = MonthDuration.copyFrom(minStrategyAge);
    stratA.lessThanOrEqual(maxStrategyAge);
    stratA.increment()
  ) {
    for (
      let stratB = MonthDuration.copyFrom(minStrategyAge);
      stratB.lessThanOrEqual(maxStrategyAge);
      stratB.increment()
    ) {
      const sum = strategySumCents(finalDateB, stratA, stratB);

      if (sum > bestStrategy.strategySumCents) {
        bestStrategy = {
          strategySumCents: sum,
          ageA: MonthDuration.copyFrom(stratA),
          ageB: MonthDuration.copyFrom(stratB),
        };
      }
    }
  }

  const idx = bufferIndex(finalAgeAYears, finalAgeBYears);
  sharedAgeAUint16Array[idx] = bestStrategy.ageA.asMonths();
  sharedAgeBUint16Array[idx] = bestStrategy.ageB.asMonths();
  sharedStrategySumUint32Array[idx] = bestStrategy.strategySumCents;

  // Optimization: If the best strategy is to file at 70, then we can assume
  // all later ages also have a best strategy of 70.
  if (bestStrategy.ageA.asMonths() == 70 * 12) {
    for (let i = finalAgeAYears + 1; i <= MAX_AGE; i++) {
      const idx = bufferIndex(i, finalAgeBYears);
      sharedAgeAUint16Array[idx] = bestStrategy.ageA.asMonths();
      sharedAgeBUint16Array[idx] = bestStrategy.ageB.asMonths();
      sharedStrategySumUint32Array[idx] = bestStrategy.strategySumCents;
    }
  }

  if (bestStrategy.ageB.asMonths() == 70 * 12) {
    for (let i = finalAgeBYears + 1; i <= MAX_AGE; i++) {
      const idx = bufferIndex(finalAgeAYears, i);
      sharedAgeAUint16Array[idx] = bestStrategy.ageA.asMonths();
      sharedAgeBUint16Array[idx] = bestStrategy.ageB.asMonths();
      sharedStrategySumUint32Array[idx] = bestStrategy.strategySumCents;
    }
  }
}

function eventHandler(event: any) {
  setup(event.data);
  for (let a = MIN_AGE; a <= MAX_AGE; a++) {
    for (let b = MIN_AGE; b <= MAX_AGE; b++) {
      const idx = bufferIndex(a, b);
      // Skip if we've already calculated this value:
      if (sharedAgeAUint16Array[idx] == 0) {
        run(a, b);
      }
    }
  }

  self.postMessage("");
}

self.addEventListener("message", eventHandler);
