/**
 * Worked example for the Government Pension Offset guide.
 *
 * Two widows have the same survivor benefit and the same non-covered
 * pension, which the Government Pension Offset cut to $0 for both. One
 * applied before the Act became law and was entitled to her survivor
 * benefit at a $0 payment amount; the other never applied. The Social Security Fairness
 * Act ends the offset for benefits payable for January 2024 onward (POMS
 * GN 02608.100). The entitled widow is owed every month from January 2024.
 * The widow who never applied must file now, and like any applicant past
 * full retirement age she can be paid for at most six months before the
 * month she files (POMS GN 00204.030; the Act did not change that rule).
 *
 * The example starts from a stated survivor benefit payable for January
 * 2024 rather than from earnings records: both widows are past survivor
 * full retirement age and neither has a Social Security benefit of her
 * own, so the benefit
 * is the late husband's full benefit and is not reduced for age. Each later
 * month applies the cost-of-living adjustments in constants.ts. A COLA is
 * effective for the December benefit of its year, so the December figure
 * already carries it. Each adjusted amount is truncated to the dime and
 * the monthly payment to the dollar (POMS RS 00601.020).
 *
 * The month both widows contact Social Security is a fixed, named month
 * rather than today, so the figures do not move as the calendar does. The
 * guide states it in prose; re-read that prose if it changes.
 */

import { colaAdjustedDimes, floorToDollarCents } from './benefit-rounding';
import * as constants from './constants';
import { Money } from './money';
import { MonthDate, MonthDuration } from './month-time';

/** The first month the offset no longer applies to (POMS GN 02608.100). */
export const REPEAL_FIRST_MONTH: MonthDate = MonthDate.initFromYearsMonths({
  years: 2024,
  months: 0,
});

/**
 * The most months before the month of filing that an unreduced retirement,
 * spouse, or survivor claim filed at or after full retirement age can be
 * paid for (POMS GN 00204.030). Claims based on disability can reach back
 * 12 months, and a benefit reduced for age generally none; the example's
 * widows are past full retirement age, so six applies.
 */
export const MAX_RETROACTIVE_MONTHS = 6;

/**
 * The month both widows in the example contact Social Security: the month
 * the guide was written, November 2026. Back pay runs through the month
 * before it.
 */
export const EXAMPLE_CONTACT_MONTH: MonthDate = MonthDate.initFromYearsMonths({
  years: 2026,
  months: 10,
});

export const GPO_EXAMPLE = {
  /**
   * The survivor benefit payable for January 2024 before any offset: the
   * late husband's full benefit at the dime, already including the 2023
   * COLA, which took effect with the December 2023 benefit.
   */
  january2024Benefit: Money.from(1800),
  /** The widow's monthly pension from work not covered by Social Security. */
  pension: Money.from(3000),
} as const;

/** The month a year's COLA first applies to: December of that year. */
const COLA_MONTH_INDEX = 11;

/** A run of consecutive months paid at the same monthly amount. */
export interface PaymentPeriod {
  readonly first: MonthDate;
  readonly last: MonthDate;
  readonly months: number;
  readonly monthlyPayment: Money;
  readonly subtotal: Money;
}

/** Everything payable for a run of months, grouped by monthly amount. */
export interface BackPay {
  readonly first: MonthDate;
  readonly last: MonthDate;
  readonly months: number;
  readonly periods: readonly PaymentPeriod[];
  readonly total: Money;
}

function requireBenefit(january2024Benefit: Money) {
  const cents = january2024Benefit.cents();
  if (!Number.isInteger(cents) || cents <= 0 || cents % 10 !== 0) {
    throw new Error(
      `the January 2024 benefit must be a positive whole number of dimes, got ${january2024Benefit.string()}`
    );
  }
}

/**
 * The monthly payment for `month`, from the benefit payable for January
 * 2024: each COLA effective by that month applied in turn at the dime, and
 * the result truncated to the dollar.
 *
 * @throws Error if `month` is before January 2024, if the benefit is not a
 *   positive whole number of dimes, or if constants.ts lacks a COLA the
 *   month needs
 */
export function monthlyPayment(
  january2024Benefit: Money,
  month: MonthDate
): Money {
  requireBenefit(january2024Benefit);
  if (month.lessThan(REPEAL_FIRST_MONTH)) {
    throw new Error(
      `the offset still applies to ${month.toString()}; the repeal starts with ${REPEAL_FIRST_MONTH.toString()}`
    );
  }
  let dimes = january2024Benefit.cents();
  // A year's COLA counts once its December has arrived.
  const lastColaYear =
    month.monthIndex() >= COLA_MONTH_INDEX ? month.year() : month.year() - 1;
  for (let year = REPEAL_FIRST_MONTH.year(); year <= lastColaYear; ++year) {
    const cola = constants.COLA[year];
    if (cola === undefined) {
      throw new Error(`no COLA for ${year} in constants.ts`);
    }
    dimes = colaAdjustedDimes(dimes, cola);
  }
  return Money.fromCents(floorToDollarCents(dimes));
}

/**
 * Every payment for the months `first` through `last`, inclusive.
 *
 * @throws Error if `first` is after `last`, or for any reason
 *   monthlyPayment throws
 */
export function backPay(
  january2024Benefit: Money,
  first: MonthDate,
  last: MonthDate
): BackPay {
  if (first.greaterThan(last)) {
    throw new Error(
      `back pay needs at least one month, got ${first.toString()} to ${last.toString()}`
    );
  }
  const periods: PaymentPeriod[] = [];
  let start = first;
  let startPayment = monthlyPayment(january2024Benefit, first);
  const close = (end: MonthDate) => {
    const months = end.subtractDate(start).asMonths() + 1;
    periods.push({
      first: start,
      last: end,
      months,
      monthlyPayment: startPayment,
      subtotal: Money.fromCents(startPayment.cents() * months),
    });
  };
  const oneMonth = new MonthDuration(1);
  for (
    let month = first.addDuration(oneMonth);
    month.lessThanOrEqual(last);
    month = month.addDuration(oneMonth)
  ) {
    const payment = monthlyPayment(january2024Benefit, month);
    if (!payment.equals(startPayment)) {
      close(month.subtractDuration(oneMonth));
      start = month;
      startPayment = payment;
    }
  }
  close(last);
  return {
    first,
    last,
    months: last.subtractDate(first).asMonths() + 1,
    periods,
    total: periods.reduce((sum, p) => sum.plus(p.subtotal), Money.zero()),
  };
}

/** The amounts the example starts from. */
export interface GpoExampleInputs {
  readonly january2024Benefit: Money;
  readonly pension: Money;
}

export interface GpoExample {
  /**
   * The offset GPO computed: two-thirds of the pension. It is more than
   * the benefit, so GPO cut the benefit to $0.
   */
  readonly offsetBeforeRepeal: Money;
  /** The month both widows contact Social Security. */
  readonly contactMonth: MonthDate;
  /**
   * Owed to the widow entitled at $0: January 2024 through the month before
   * contactMonth.
   */
  readonly entitled: BackPay;
  /** Payable to the widow who files in the contact month. */
  readonly neverApplied: BackPay;
  /** Months from January 2024 the late filer can never be paid for. */
  readonly monthsLost: number;
  /** What those months would have paid. */
  readonly amountLost: Money;
  /** The monthly payment both receive from the contact month. */
  readonly paymentFromContactMonth: Money;
}

/**
 * The two widows of the guide's example, both contacting Social Security
 * in `contactMonth`.
 *
 * @throws Error if the pension is not a positive whole number of cents, if
 *   two-thirds of it is not more than the benefit (the guide's story needs
 *   the benefit offset to $0, and its prose says "more than"), if
 *   `contactMonth` is not after January 2024, or for any reason
 *   monthlyPayment or backPay throws
 */
export function gpoExample(
  inputs: GpoExampleInputs = GPO_EXAMPLE,
  contactMonth: MonthDate = EXAMPLE_CONTACT_MONTH
): GpoExample {
  const { january2024Benefit, pension } = inputs;
  requireBenefit(january2024Benefit);
  if (!Number.isInteger(pension.cents()) || pension.cents() <= 0) {
    throw new Error(
      `the pension must be a positive amount, got ${pension.string()}`
    );
  }
  // Total GPO: two-thirds of the pension is at least the benefit (POMS
  // GN 02608.100). The guide says "more than", so this is strict. Compared
  // in exact integers before dividing.
  if (pension.cents() * 2 <= january2024Benefit.cents() * 3) {
    throw new Error(
      `two-thirds of the ${pension.string()} pension must be more than the ${january2024Benefit.string()} benefit, so GPO cut it to $0`
    );
  }
  if (!contactMonth.greaterThan(REPEAL_FIRST_MONTH)) {
    throw new Error(
      `the contact month must be after ${REPEAL_FIRST_MONTH.toString()}, got ${contactMonth.toString()}`
    );
  }
  const oneMonth = new MonthDuration(1);
  const lastOwed = contactMonth.subtractDuration(oneMonth);
  const entitled = backPay(january2024Benefit, REPEAL_FIRST_MONTH, lastOwed);
  const retroStart = MonthDate.max(
    REPEAL_FIRST_MONTH,
    contactMonth.subtractDuration(new MonthDuration(MAX_RETROACTIVE_MONTHS))
  );
  const neverApplied = backPay(january2024Benefit, retroStart, lastOwed);
  return {
    offsetBeforeRepeal: Money.fromCents(Math.floor((pension.cents() * 2) / 3)),
    contactMonth,
    entitled,
    neverApplied,
    monthsLost: entitled.months - neverApplied.months,
    amountLost: entitled.total.sub(neverApplied.total),
    paymentFromContactMonth: monthlyPayment(january2024Benefit, contactMonth),
  };
}
