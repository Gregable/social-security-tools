import { Recipient } from "$lib/recipient";
import { Money } from "$lib/money";
import { Birthdate } from "$lib/birthday";
import { MonthDate, MonthDuration } from "$lib/month-time";

const minStrategyAge = MonthDuration.initFromYearsMonths({
  years: 62,
  months: 0,
});
const maxStrategyAge = MonthDuration.initFromYearsMonths({
  years: 70,
  months: 0,
});

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

function SpousalBenefitStrategySum(
  recipient: Recipient,
  spouse: Recipient,
  filingDate: MonthDate,
  filingDateSpouse: MonthDate,
  finalDate: MonthDate
): number {
  const startDate = filingDate.greaterThan(filingDateSpouse)
    ? filingDate
    : filingDateSpouse;
  const spousalBenefitCents = recipient
    .spousalBenefitOnDateGivenStartDate(spouse, startDate, startDate)
    .cents();
  const numMonths: number =
    finalDate.monthsSinceEpoch() - startDate.monthsSinceEpoch() + 1;
  return spousalBenefitCents * numMonths;
}

let settings = {
  workerIdx: -1,
  recipientA: new Recipient(),
  recipientB: new Recipient(),
  eligibleForSpousal: false,
};

const personalBSums: Array<number> = [];

function setup(config: any) {
  settings.workerIdx = config.workerIdx;
  settings.recipientA = new Recipient();
  settings.recipientB = new Recipient();

  // TODO: Ensure that recipientA is always the higher earner.
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

  // Reuse the array rather than reallocating on each pass.
  for (
    let i = MonthDuration.copyFrom(minStrategyAge);
    i.lessThanOrEqual(maxStrategyAge);
    i.increment()
  ) {
    personalBSums.push(0);
  }
}

function run(config: any) {
  let bestStrategy = {
    strategySumCents: 0,
    ageA: new MonthDuration(0),
    ageB: new MonthDuration(0),
  };

  const finalAgeA = MonthDuration.initFromYearsMonths({
    years: config.finalAgeA,
    months: 11,
  });
  const finalAgeB = MonthDuration.initFromYearsMonths({
    years: config.finalAgeB,
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
    const stratADate = settings.recipientA.birthdate.dateAtLayAge(stratA);
    const personalASum = PersonalBenefitStrategySum(
      settings.recipientA,
      stratADate,
      finalDateA
    );
    let i = 0;
    for (
      let stratB = MonthDuration.copyFrom(minStrategyAge);
      stratB.lessThanOrEqual(maxStrategyAge);
      stratB.increment()
    ) {
      let strategySumCents = personalASum + personalBSums[i++];

      const stratBDate = settings.recipientB.birthdate.dateAtLayAge(stratB);
      if (settings.eligibleForSpousal) {
        strategySumCents += SpousalBenefitStrategySum(
          settings.recipientB,
          settings.recipientA,
          stratBDate,
          stratADate,
          finalDateB
        );
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

  self.postMessage({
    workerIdx: settings.workerIdx,
    finalAgeA: config.finalAgeA,
    finalAgeB: config.finalAgeB,
    strategyA: bestStrategy.ageA.asMonths(),
    strategyB: bestStrategy.ageB.asMonths(),
  });
}

function eventHandler(event: any) {
  if (event.data.command == "setup") setup(event.data);
  else if (event.data.command == "run") run(event.data);
}

self.addEventListener("message", eventHandler);
