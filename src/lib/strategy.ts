import { Recipient } from "$lib/recipient";
import { Money } from "$lib/money";
import { Birthdate } from "$lib/birthday";
import { MonthDate, MonthDuration } from "$lib/month-time";

export interface StrategyParams {
  pias: [number, number];
  birthdates: [Date, Date];
  // Each strategy and final age is a month duration after birth date:
  strategy: [number, number];
  finalAge: [number, number];
}

interface Context {
  recipients: [Recipient, Recipient];
  stratDates: [MonthDate, MonthDate];
  finalDates: [MonthDate, MonthDate];
}

export function StrategySequence(config: StrategyParams) {
  let out = [];
  let context: Context = {
    recipients: [null, null],
    stratDates: [null, null],
    finalDates: [null, null],
  };
  for (let i = 0; i < 2; i++) {
    context.recipients[i] = new Recipient();
    context.recipients[i].setPia(Money.from(config.pias[i]));
    context.recipients[i].birthdate = new Birthdate(config.birthdates[i]);
    context.stratDates[i] = context.recipients[i].birthdate.dateAtLayAge(
      new MonthDuration(config.strategy[i])
    );
    context.finalDates[i] = context.recipients[i].birthdate.dateAtLayAge(
      new MonthDuration(config.finalAge[i])
    );
  }

  const startDate = MonthDate.min(context.stratDates[0], context.stratDates[1]);
  const endDate = MonthDate.max(context.finalDates[0], context.finalDates[1]);

  let year = startDate.year();
  let benefit = [Money.zero(), Money.zero()];
  let totalBenefit = Money.zero();
  for (
    let d = MonthDate.copyFrom(startDate);
    d.lessThanOrEqual(endDate);
    d.increment()
  ) {
    if (d.year() > year) {
      out.push(
        year +
          " " +
          benefit[0].string() +
          "+" +
          benefit[1].string() +
          "=" +
          benefit[0].plus(benefit[1]).string()
      );
      year = d.year();
      benefit = [Money.zero(), Money.zero()];
    }
    if (d.lessThanOrEqual(context.finalDates[0])) {
      const amount = context.recipients[0].allBenefitsOnDate(
        context.recipients[1],
        context.stratDates[1],
        context.stratDates[0],
        d
      );
      benefit[0] = benefit[0].plus(amount);
      totalBenefit = totalBenefit.plus(amount);
    }
    if (d.lessThanOrEqual(context.finalDates[1])) {
      const amount = context.recipients[1].allBenefitsOnDate(
        context.recipients[0],
        context.stratDates[0],
        context.stratDates[1],
        d
      );
      benefit[1] = benefit[1].plus(amount);
      totalBenefit = totalBenefit.plus(amount);
    }
  }
  out.push(
    year +
      " " +
      benefit[0].string() +
      "+" +
      benefit[1].string() +
      "=" +
      benefit[0].plus(benefit[1]).string()
  );
  out.push("Total: " + totalBenefit.string());
  return out;
}
