/**
 * Worked examples for the retroactive retirement benefits guide.
 *
 * The guide follows one retiree who reaches full retirement age in the
 * latest year the constants cover, with a round Primary Insurance Amount,
 * and files some months later. Social Security then offers up to six months
 * of back pay, which costs a delayed retirement credit for every month taken
 * back. Every figure is derived from constants.ts and the benefit
 * calculator, so the guide's tables follow the annual update. The example
 * PIA and any sentence in the guide naming a percentage are hand-written
 * and still need a read each year.
 *
 * The comparison is nominal and ignores mortality, like the break-even
 * guide's. It also ignores the January crediting rule (credits earned in
 * the filing year are paid from the following January), which delays part
 * of the larger check for a few months but does not change which choice
 * pays more in the long run.
 *
 * The result records are plain readonly interfaces produced only by the
 * functions beside them; they are not meant to be constructed by hand.
 */

import { benefitAtAge } from './benefit-calculator';
import { Birthdate } from './birthday';
import * as constants from './constants';
import { Money } from './money';
import { MonthDuration } from './month-time';
import { Recipient } from './recipient';

/** A round Primary Insurance Amount the guide can reason about aloud. */
export const EXAMPLE_PIA: Money = Money.from(2500);

/**
 * Retirement benefits can be paid for at most this many months before the
 * month of filing (20 CFR 404.621(a)(1)).
 */
export const MAX_RETROACTIVE_MONTHS = 6;

/** Age of the example retiree in the guide's year: full retirement age. */
const EXAMPLE_RETIREE_AGE = 67;

/** Delayed credits stop at 70, so back pay to 70 costs nothing. */
const LATEST_CREDIT_AGE = MonthDuration.initFromYearsMonths({
  years: 70,
  months: 0,
});

/**
 * A retiree who reaches full retirement age in the latest year the
 * constants cover, so the example stays current. The PIA is set directly
 * rather than computed from earnings, and a set PIA never has
 * cost-of-living adjustments applied, so the figures are in the guide
 * year's dollars. The birth year gives a full retirement age of 67, which
 * the guide states in prose.
 */
export function exampleRetiree(): Recipient {
  const retiree = new Recipient();
  retiree.birthdate = Birthdate.FromYMD(
    constants.MAX_YEAR - EXAMPLE_RETIREE_AGE,
    0,
    2
  );
  retiree.setPia(EXAMPLE_PIA);
  return retiree;
}

function requireAtOrPastFra(retiree: Recipient, filingAge: MonthDuration) {
  const fra = retiree.normalRetirementAge();
  if (filingAge.lessThan(fra)) {
    throw new Error(
      `retroactive retirement benefits need a filing at or past full retirement age (${fra.toYearsAndMonthsString()}), got ${filingAge.toYearsAndMonthsString()}`
    );
  }
}

/**
 * How many months of back pay Social Security can offer someone filing at
 * `filingAge`: up to six, but never for a month before full retirement age,
 * because those months would be paid at a reduced rate (20 CFR
 * 404.621(a)(1)(ii)).
 */
export function maxRetroactiveMonths(
  retiree: Recipient,
  filingAge: MonthDuration
): number {
  requireAtOrPastFra(retiree, filingAge);
  const pastFra = filingAge.subtract(retiree.normalRetirementAge()).asMonths();
  return Math.min(MAX_RETROACTIVE_MONTHS, pastFra);
}

/**
 * How many of the available back-pay months cost nothing: those at or past
 * 70, where delayed credits have already stopped (20 CFR 404.313). Zero
 * for anyone filing at or before 70.
 */
export function costFreeMonths(
  retiree: Recipient,
  filingAge: MonthDuration
): number {
  const available = maxRetroactiveMonths(retiree, filingAge);
  if (!filingAge.greaterThan(LATEST_CREDIT_AGE)) return 0;
  return Math.min(available, filingAge.subtract(LATEST_CREDIT_AGE).asMonths());
}

export interface RetroactiveChoice {
  readonly filingAge: MonthDuration;
  /** Months of back pay actually available and taken. */
  readonly monthsBack: number;
  /** The month benefits begin if the back pay is taken. */
  readonly startAge: MonthDuration;
  /** The ongoing benefit if benefits begin in the filing month. */
  readonly benefitWithoutBackPay: Money;
  /** The ongoing benefit, and the rate of each back-pay month, if taken. */
  readonly benefitWithBackPay: Money;
  /** The one-time payment for the back-pay months. */
  readonly lumpSum: Money;
  /** How much smaller every later check is for taking the back pay. */
  readonly monthlyCost: Money;
  /**
   * Time after filing for the larger checks to add up to the lump sum.
   * Null when the back pay is free, which happens once the backdated start
   * is at or past 70.
   */
  readonly timeToPayBack: MonthDuration | null;
  /** The age at which declining the back pay has paid off: filingAge plus timeToPayBack. */
  readonly paybackAge: MonthDuration | null;
}

/**
 * The trade a retiree filing at `filingAge` faces when asked whether to
 * start benefits up to `monthsRequested` months earlier. The months
 * actually available may be fewer, because none can fall before full
 * retirement age.
 */
export function retroactiveChoice(
  retiree: Recipient,
  filingAge: MonthDuration,
  monthsRequested: number
): RetroactiveChoice {
  if (
    !Number.isInteger(monthsRequested) ||
    monthsRequested < 0 ||
    monthsRequested > MAX_RETROACTIVE_MONTHS
  ) {
    throw new Error(
      `back pay runs from zero to six months, got ${monthsRequested}`
    );
  }
  const monthsBack = Math.min(
    monthsRequested,
    maxRetroactiveMonths(retiree, filingAge)
  );
  const startAge = filingAge.subtract(new MonthDuration(monthsBack));
  const benefitWithoutBackPay = benefitAtAge(retiree, filingAge);
  const benefitWithBackPay = benefitAtAge(retiree, startAge);
  const lumpSum = benefitWithBackPay.times(monthsBack);
  const monthlyCost = benefitWithoutBackPay.sub(benefitWithBackPay);

  let timeToPayBack: MonthDuration | null = null;
  if (monthlyCost.greaterThan(Money.from(0))) {
    timeToPayBack = new MonthDuration(Math.ceil(lumpSum.div$(monthlyCost)));
  }
  return {
    filingAge,
    monthsBack,
    startAge,
    benefitWithoutBackPay,
    benefitWithBackPay,
    lumpSum,
    monthlyCost,
    timeToPayBack,
    paybackAge: timeToPayBack === null ? null : filingAge.add(timeToPayBack),
  };
}

/**
 * The filing ages the guide tabulates, each taking the full six months of
 * back pay: the first age with six months available, then whole years to
 * 70. A final row files past 70 and takes only the months back to 70, the
 * ones that cost nothing.
 */
export function paybackRows(retiree: Recipient): RetroactiveChoice[] {
  const fra = retiree.normalRetirementAge();
  const filingAges: MonthDuration[] = [
    fra.add(new MonthDuration(MAX_RETROACTIVE_MONTHS)),
  ];
  for (
    let years = fra.years() + 1;
    years <= LATEST_CREDIT_AGE.years();
    years++
  ) {
    filingAges.push(MonthDuration.initFromYearsMonths({ years, months: 0 }));
  }
  const rows = filingAges.map((filingAge) =>
    retroactiveChoice(retiree, filingAge, MAX_RETROACTIVE_MONTHS)
  );
  const pastSeventy = LATEST_CREDIT_AGE.add(new MonthDuration(4));
  rows.push(
    retroactiveChoice(
      retiree,
      pastSeventy,
      costFreeMonths(retiree, pastSeventy)
    )
  );
  return rows;
}
