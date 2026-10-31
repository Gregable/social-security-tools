/**
 * The retirement earnings test: how much of a year's benefits Social
 * Security withholds from someone under full retirement age who keeps
 * working.
 *
 * The annual test only. SSA also offers a monthly test in the first year of
 * benefits, which depends on month-by-month earnings and is described in
 * the earnings-test guide rather than modeled here.
 *
 * SSA does not withhold the computed amount evenly. It holds back whole
 * monthly checks from January until the amount is covered, then pays the
 * rest of the year in full; whatever the whole checks over-collected is paid
 * back once actual earnings for the year are known (POMS RS 02501.095). The
 * result reports both the amount owed and how that plays out in checks.
 */

import { EARNINGS_TEST_LIMITS } from './constants';
import { Money } from './money';

/**
 * Which exempt amount applies. `underFra` for a year entirely before the
 * year of full retirement age; `fraYear` for the months of that year before
 * the birthday month.
 */
export type EarningsTestPeriod = 'underFra' | 'fraYear';

export interface EarningsTestInput {
  readonly year: number;
  readonly period: EarningsTestPeriod;
  /** Countable earnings from work for the period, before the test. */
  readonly earnings: Money;
  readonly monthlyBenefit: Money;
}

export interface EarningsTestResult {
  /** The exempt amount that applies. */
  readonly limit: Money;
  /** Earnings over the limit, never negative. */
  readonly excess: Money;
  /** Dollars of earnings per dollar withheld: 2 under FRA, 3 in the FRA year. */
  readonly dollarsPerDollar: 2 | 3;
  /** Benefits owed back for the year, capped at the year's benefits. */
  readonly withheld: Money;
  /** Twelve months of the benefit, before the test. */
  readonly annualBenefit: Money;
  /** Whole monthly checks SSA holds back to cover `withheld`. */
  readonly checksWithheld: number;
  /** What the whole checks over-collect, refunded after the year ends. */
  readonly overWithheld: Money;
  /** Benefits kept for the year once the refund is counted. */
  readonly netBenefit: Money;
}

const MONTHS_PER_YEAR = 12;

/** The exempt amount for a year and period; throws for an unpublished year. */
export function earningsTestLimit(
  year: number,
  period: EarningsTestPeriod
): Money {
  const limits = EARNINGS_TEST_LIMITS[year];
  if (limits === undefined) {
    throw new Error(`No earnings test limit on record for ${year}`);
  }
  return limits[period];
}

export function earningsTest(input: EarningsTestInput): EarningsTestResult {
  if (input.earnings.lessThan(Money.zero())) {
    throw new Error('Earnings cannot be negative');
  }
  if (input.monthlyBenefit.lessThan(Money.zero())) {
    throw new Error('Monthly benefit cannot be negative');
  }
  const limit = earningsTestLimit(input.year, input.period);
  const dollarsPerDollar = input.period === 'underFra' ? 2 : 3;
  const excess = Money.max(Money.zero(), input.earnings.sub(limit));
  const annualBenefit = input.monthlyBenefit.times(MONTHS_PER_YEAR);
  const withheld = Money.min(excess.div(dollarsPerDollar), annualBenefit);
  const checksWithheld = input.monthlyBenefit.equals(Money.zero())
    ? 0
    : Math.ceil(withheld.div$(input.monthlyBenefit));
  const overWithheld = input.monthlyBenefit.times(checksWithheld).sub(withheld);
  return {
    limit,
    excess,
    dollarsPerDollar,
    withheld,
    annualBenefit,
    checksWithheld,
    overWithheld,
    netBenefit: annualBenefit.sub(withheld),
  };
}
