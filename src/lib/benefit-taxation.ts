/**
 * How much of a year's Social Security benefits is subject to federal
 * income tax, following the worksheet in IRS Publication 915.
 *
 * Provisional income is adjusted gross income before any Social Security,
 * plus tax-exempt interest, plus half of the benefits. Above a first
 * threshold up to half of benefits is taxable; above a second, up to 85%.
 * The thresholds were set in 1983 and 1993 and are not indexed, so every
 * year more retirees cross them.
 *
 * Married filing separately while living with the spouse has thresholds of
 * zero and is not modeled here; the guide describes it in prose.
 */

import { BENEFIT_TAXATION_THRESHOLDS } from './constants';
import { Money } from './money';

export { BENEFIT_TAXATION_THRESHOLDS };

export type FilingStatus = 'single' | 'joint';

export interface TaxableBenefitsInput {
  readonly status: FilingStatus;
  /** Adjusted gross income before any Social Security benefits. */
  readonly agi: Money;
  /** Tax-exempt interest, such as municipal bond interest. */
  readonly taxExemptInterest: Money;
  /** Total Social Security benefits received in the year. */
  readonly benefits: Money;
}

/** Which band provisional income falls in. */
export type TaxationTier = 'none' | 'half' | 'most';

export interface TaxableBenefitsResult {
  readonly provisionalIncome: Money;
  readonly firstThreshold: Money;
  readonly secondThreshold: Money;
  readonly tier: TaxationTier;
  /** Benefits included in taxable income. */
  readonly taxable: Money;
  /** `taxable` as a fraction of benefits, 0 when there are no benefits. */
  readonly taxableShare: number;
  /** The 85% ceiling: benefits are never more taxable than this. */
  readonly maximumTaxable: Money;
}

const HALF = 0.5;
const MOST = 0.85;

function requireNonNegative(value: Money, name: string): void {
  if (value.lessThan(Money.zero())) {
    throw new Error(`${name} cannot be negative`);
  }
}

export function taxableBenefits(
  input: TaxableBenefitsInput
): TaxableBenefitsResult {
  requireNonNegative(input.agi, 'Adjusted gross income');
  requireNonNegative(input.taxExemptInterest, 'Tax-exempt interest');
  requireNonNegative(input.benefits, 'Benefits');

  const { first: firstThreshold, second: secondThreshold } =
    BENEFIT_TAXATION_THRESHOLDS[input.status];
  const halfBenefits = input.benefits.times(HALF);
  const maximumTaxable = input.benefits.times(MOST);
  const provisionalIncome = input.agi
    .plus(input.taxExemptInterest)
    .plus(halfBenefits);

  let tier: TaxationTier;
  let taxable: Money;
  if (provisionalIncome.lessThanOrEqual(firstThreshold)) {
    tier = 'none';
    taxable = Money.zero();
  } else if (provisionalIncome.lessThanOrEqual(secondThreshold)) {
    tier = 'half';
    taxable = Money.min(
      provisionalIncome.sub(firstThreshold).times(HALF),
      halfBenefits
    );
  } else {
    tier = 'most';
    const middleBand = Money.min(
      secondThreshold.sub(firstThreshold).times(HALF),
      halfBenefits
    );
    taxable = Money.min(
      provisionalIncome.sub(secondThreshold).times(MOST).plus(middleBand),
      maximumTaxable
    );
  }

  return {
    provisionalIncome,
    firstThreshold,
    secondThreshold,
    tier,
    taxable,
    taxableShare: input.benefits.equals(Money.zero())
      ? 0
      : taxable.div$(input.benefits),
    maximumTaxable,
  };
}
