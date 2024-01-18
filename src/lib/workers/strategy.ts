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

function PersonalBenefitStrategySum(
  recipient: Recipient,
  filingDate: MonthDate,
  finalDate: MonthDate
): number {
  // personal benefit is only one of 3 values: 0, the benefit for a few months
  // after filing, and the benefit for the rest of the time. If we calculate
  // these 3 values and their number of months, we can avoid the loop and
  // memoization entirely.
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
const memoizedSpousalBenefit: Map<number, number> = new Map();

let hits = 0;
let misses = 0;

function MemoizedSpousalBenefitCents(
  recipient: Recipient,
  spouse: Recipient,
  startDate: MonthDate
): number {
  // Return a memoized value if it exists:
  const memoizedKey: number = startDate.monthsSinceEpoch();
  if (memoizedSpousalBenefit.has(memoizedKey)) {
    hits += 1;
    return memoizedSpousalBenefit.get(memoizedKey);
  }
  misses += 1;

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

const personalBSums: Array<number> = [];

function setup(config: any) {
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

  // Reuse the personalBSums array rather than reallocating on each pass.
  for (
    let i = MonthDuration.copyFrom(minStrategyAge);
    i.lessThanOrEqual(maxStrategyAge);
    i.increment()
  ) {
    personalBSums.push(0);
  }
}

function run(finalAgeAYears: number, finalAgeBYears: number) {
  let bestStrategy = {
    strategySumCents: 0,
    ageA: new MonthDuration(0),
    ageB: new MonthDuration(0),
  };

  const finalAgeA = MonthDuration.initFromYearsMonths({
    years: finalAgeAYears,
    months: 11,
  });
  const finalAgeB = MonthDuration.initFromYearsMonths({
    years: finalAgeBYears,
    months: 11,
  });
  const finalDateA = settings.recipientA.birthdate.dateAtLayAge(finalAgeA);
  const finalDateB = settings.recipientB.birthdate.dateAtLayAge(finalAgeB);

  // TODO: Add survivor benefit.
  // TODO: Account for time value.
  for (
    let stratB = MonthDuration.copyFrom(minStrategyAge);
    stratB.lessThanOrEqual(maxStrategyAge);
    stratB.increment()
  ) {
    const stratBDate = settings.recipientB.birthdate.dateAtLayAge(stratB);
    personalBSums[stratB.asMonths() - minStrategyAge.asMonths()] =
      PersonalBenefitStrategySum(settings.recipientB, stratBDate, finalDateB);
  }

  for (
    let stratA = MonthDuration.copyFrom(minStrategyAge);
    stratA.lessThanOrEqual(maxStrategyAge);
    stratA.increment()
  ) {
    const stratADate: MonthDate =
      settings.recipientA.birthdate.dateAtLayAge(stratA);
    const personalASum = PersonalBenefitStrategySum(
      settings.recipientA,
      stratADate,
      finalDateA
    );

    for (
      let stratB = MonthDuration.copyFrom(minStrategyAge);
      stratB.lessThanOrEqual(maxStrategyAge);
      stratB.increment()
    ) {
      let strategySumCents =
        personalASum +
        personalBSums[stratB.asMonths() - minStrategyAge.asMonths()];

      if (settings.eligibleForSpousal) {
        const stratBDate = settings.recipientB.birthdate.dateAtLayAge(stratB);
        const spousalStartDate = stratBDate.greaterThan(stratADate)
          ? stratBDate
          : stratADate;
        const numMonths =
          finalDateB.monthsSinceEpoch() -
          spousalStartDate.monthsSinceEpoch() +
          1;
        if (numMonths > 0) {
          const spousalBenefitCents = MemoizedSpousalBenefitCents(
            settings.recipientB,
            settings.recipientA,
            spousalStartDate
          );
          strategySumCents += spousalBenefitCents * numMonths;
        }
      }

      if (strategySumCents > bestStrategy.strategySumCents) {
        bestStrategy = {
          strategySumCents: strategySumCents,
          ageA: MonthDuration.copyFrom(stratA),
          ageB: MonthDuration.copyFrom(stratB),
        };
      }
    }
  }

  const MAX_AGE = 110;
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
      if (sharedAgeAUint16Array[idx] == 0) {
        run(a, b);
      }
    }
  }
  console.log(hits);
  console.log(misses);

  self.postMessage("");
}

self.addEventListener("message", eventHandler);
