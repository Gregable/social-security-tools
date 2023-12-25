import { Recipient } from "$lib/recipient";
import { Money } from "$lib/money";
import { Birthdate } from "$lib/birthday";
import { MonthDate, MonthDuration } from "$lib/month-time";

// Precomputed value for if recipient is eligible for spousal benefits,
// determined by comparing the PIA of the recipient to the PIA of the spouse.
let eligibleForSpousal: boolean;

// Precomputed values for the minimum filing date for each recipient. This is
// the date that the recipient turns 62. Stored in months since epoch.
let minimumFilingDateA: number;
let minimumFilingDateB: number;
// Precomputed values for the maximum benefit date for each recipient. This is
// the maximum age of this recipient, which is 70. Stored in months since epoch.
let finalBenefitDateA: number;
let finalBenefitDateB: number;

function PersonalBenefitStrategySum(
  recipient: Recipient,
  filingDate: MonthDate,
  finalDate: MonthDate
) {
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

  const initialPersonalBenefit = recipient.benefitOnDate(
    filingDate,
    filingDate
  );

  const finalPersonalBenefit = recipient.benefitOnDate(
    filingDate,
    janAfterFilingDate
  );

  return initialPersonalBenefit
    .times(monthsRemainingInFilingYear)
    .plus(finalPersonalBenefit.times(numMonthsAfterInitialYear));
}

function SpousalBenefitStrategySum(
  recipient: Recipient,
  spouse: Recipient,
  filingDate: MonthDate,
  filingDateSpouse: MonthDate,
  finalDate: MonthDate
) {
  const startDate = filingDate.greaterThan(filingDateSpouse)
    ? filingDate
    : filingDateSpouse;
  const spousalBenefit = recipient.spousalBenefitOnDate(
    spouse,
    filingDateSpouse,
    filingDate,
    startDate
  );
  const numMonths = finalDate.subtractDate(startDate).asMonths() + 1;
  return spousalBenefit.times(numMonths);
}

function run() {
  let recipientA = new Recipient();
  let recipientB = new Recipient();

  // TODO: Ensure that recipientA is always the higher earner.
  recipientA.setPia(Money.from(1000));
  recipientB.setPia(Money.from(200));

  recipientA.birthdate = Birthdate.FromYMD(1962, 0, 2);
  recipientB.birthdate = Birthdate.FromYMD(1962, 0, 2);

  // Precalculate spousal eligibility:
  eligibleForSpousal = recipientB.eligibleForSpousalBenefit(recipientA);

  let bestStrategy = {
    strategySum: Money.from(0),
    ageA: new MonthDuration(0),
    ageB: new MonthDuration(0),
  };

  const minStrategyAge = MonthDuration.initFromYearsMonths({
    years: 62,
    months: 0,
  });
  const maxStrategyAge = MonthDuration.initFromYearsMonths({
    years: 70,
    months: 0,
  });
  const finalAge = MonthDuration.initFromYearsMonths({
    years: 75,
    months: 11,
  });
  const finalDateA = recipientA.birthdate.dateAtLayAge(finalAge);
  const finalDateB = recipientB.birthdate.dateAtLayAge(finalAge);

  minimumFilingDateA = recipientA.birthdate
    .dateAtLayAge(minStrategyAge)
    .monthsSinceEpoch();
  minimumFilingDateB = recipientB.birthdate
    .dateAtLayAge(minStrategyAge)
    .monthsSinceEpoch();
  finalBenefitDateA = recipientA.birthdate
    .dateAtLayAge(finalAge)
    .monthsSinceEpoch();
  finalBenefitDateB = recipientB.birthdate
    .dateAtLayAge(finalAge)
    .monthsSinceEpoch();

  const start = Date.now();

  // TODO: Add survivor benefit.
  const personalBSums: Array<Money> = [];
  for (
    let stratB = minStrategyAge;
    stratB.lessThanOrEqual(maxStrategyAge);
    stratB = stratB.add(new MonthDuration(1))
  ) {
    const stratBDate = recipientB.birthdate.dateAtLayAge(stratB);
    personalBSums.push(
      PersonalBenefitStrategySum(recipientB, stratBDate, finalDateB)
    );
  }

  for (
    let stratA = minStrategyAge;
    stratA.lessThanOrEqual(maxStrategyAge);
    stratA = stratA.add(new MonthDuration(1))
  ) {
    const stratADate = recipientA.birthdate.dateAtLayAge(stratA);

    const personalASum = PersonalBenefitStrategySum(
      recipientA,
      stratADate,
      finalDateA
    );
    let i = 0;
    for (
      let stratB = minStrategyAge;
      stratB.lessThanOrEqual(maxStrategyAge);
      stratB = stratB.add(new MonthDuration(1))
    ) {
      let strategySum = personalASum.plus(personalBSums[i++]);

      const stratBDate = recipientB.birthdate.dateAtLayAge(stratB);
      if (eligibleForSpousal) {
        strategySum = strategySum.plus(
          SpousalBenefitStrategySum(
            recipientB,
            recipientA,
            stratBDate,
            stratADate,
            finalDateB
          )
        );
      }

      if (strategySum.value() > bestStrategy.strategySum.value()) {
        bestStrategy = { strategySum, ageA: stratA, ageB: stratB };
      }
    }
  }

  const timeElapsed: number = (Date.now() - start) / 1000;
  self.postMessage([
    "done",
    {
      strategySum: bestStrategy.strategySum.string(),
      ageA:
        bestStrategy.ageA.years() + "y " + bestStrategy.ageA.modMonths() + "m",
      ageB:
        bestStrategy.ageB.years() + "y " + bestStrategy.ageB.modMonths() + "m",
      timeElapsed,
    },
  ]);
  self.postMessage(["timeElapsed", timeElapsed]);
}

self.addEventListener("message", function (event) {
  if (event.data == "run") {
    run();
  } else {
    console.log("unrecognized message from worker", event.data);
  }
});
