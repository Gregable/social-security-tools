import { Recipient } from "$lib/recipient";
import { Money } from "$lib/money";
import { Birthdate } from "$lib/birthday";
import { MonthDate, MonthDuration } from "$lib/month-time";

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

function run(config: any) {
  let recipientA = new Recipient();
  let recipientB = new Recipient();

  // TODO: Ensure that recipientA is always the higher earner.
  recipientA.setPia(Money.from(config.piaA));
  recipientB.setPia(Money.from(config.piaB));

  recipientA.birthdate = Birthdate.FromYMD(
    config.birthdateA.year,
    config.birthdateA.month,
    config.birthdateA.day
  );
  recipientB.birthdate = Birthdate.FromYMD(
    config.birthdateB.year,
    config.birthdateB.month,
    config.birthdateB.day
  );

  // Precalculate spousal eligibility:
  const eligibleForSpousal = recipientB.eligibleForSpousalBenefit(recipientA);

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
  const finalAgeA = MonthDuration.initFromYearsMonths({
    years: config.finalAgeA,
    months: 11,
  });
  const finalAgeB = MonthDuration.initFromYearsMonths({
    years: config.finalAgeB,
    months: 11,
  });
  const finalDateA = recipientA.birthdate.dateAtLayAge(finalAgeA);
  const finalDateB = recipientB.birthdate.dateAtLayAge(finalAgeB);

  // TODO: Add survivor benefit.
  // TODO: Account for time value.
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

  self.postMessage({
    strategySum: bestStrategy.strategySum.string(),
    /*ageA: bestStrategy.ageA.years() + "." + bestStrategy.ageA.modMonths(),
    ageB: bestStrategy.ageB.years() + "." + bestStrategy.ageB.modMonths(),*/
    ageA: bestStrategy.ageA.asMonths(),
    ageB: bestStrategy.ageB.asMonths(),
  });
}

self.addEventListener("message", function (event) {
  run(event.data);
});
