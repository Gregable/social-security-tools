/**
 * Raw-number benefit rounding, shared by benefit-calculator.ts and the
 * strategy fast paths (couple-fast-primitives.ts and friends).
 *
 * SSA rounds every benefit amount down to the dime and only the final
 * monthly benefit down to the dollar (POMS RS 00601.020). These helpers
 * apply each factor as an exact fraction in integer cents, so they take and
 * return plain numbers, never Money or MonthDuration objects.
 */

/**
 * The oldest age at which filing still changes the benefit amount. Delayed
 * retirement credits stop accruing the month a recipient turns 70, so waiting
 * beyond it only forgoes payments.
 */
export const MAX_BENEFIT_AGE_MONTHS = 70 * 12;

/**
 * Returns an annual delayed retirement credit rate (e.g. 0.08) in tenths of a
 * percent (80). Every rate SSA has used is a whole number of tenths.
 *
 * @throws Error if the rate is not a whole number of tenths of a percent.
 */
function delayedCreditPerMille(delayedRetirementIncrease: number): number {
  const perMille = Math.round(delayedRetirementIncrease * 1000);
  if (Math.abs(delayedRetirementIncrease * 1000 - perMille) > 1e-9) {
    throw new Error(
      `Delayed retirement credit ${delayedRetirementIncrease} is not a whole ` +
        'number of tenths of a percent'
    );
  }
  return perMille;
}

/**
 * Truncates an amount in cents to the dime: `cents * numerator / denominator`
 * rounded down to a multiple of 10 cents.
 *
 * SSA rounds every benefit amount down to the dime and only the final
 * monthly benefit down to the dollar (POMS RS 00601.020), multiplying before
 * dividing (RS 00615.005). Every factor here is an exact fraction, so the
 * product is an integer far below 2^53, and a true quotient short of a whole
 * dime is short by at least 1/(denominator * 10): far more than
 * floating-point division can err by, so the floor is exact.
 */
function floorToDime(
  cents: number,
  numerator: number,
  denominator: number
): number {
  return Math.floor((cents * numerator) / (denominator * 10)) * 10;
}

/** Truncates an amount in whole cents to the dollar. */
export function floorToDollarCents(cents: number): number {
  return Math.floor(cents / 100) * 100;
}

/**
 * Personal benefit at the dime, in cents, from a PIA claimed at a given age.
 *
 * Claiming early reduces the PIA by 5/9 of 1% for each of the first 36 months
 * before full retirement age and 5/12 of 1% for each month beyond that.
 * Claiming late increases it by a twelfth of the annual delayed retirement
 * credit for each month after full retirement age, up to age 70. SSA applies
 * the factor to the PIA as computed (to the dime) and truncates the result,
 * never rounding up: rounding to the cent first would overpay by a dime
 * whenever the exact amount falls within half a cent below a whole dime
 * (e.g. $412.3996), and by a dollar when that dime is a whole dollar.
 *
 * This is the amount spousal and survivor benefits are computed from; the
 * benefit actually paid is benefitCentsAtAge, the same truncated to the
 * dollar. The strategy fast paths call both with raw numbers, so they take no
 * Money or MonthDuration objects.
 *
 * @param piaCents - The PIA in whole cents
 * @param nraMonths - Full retirement age in months
 * @param delayedRetirementIncrease - Annual delayed credit rate, e.g. 0.08
 * @param ageMonths - Claiming age in months; ages past 70 count as 70
 * @throws Error if claiming at or after full retirement age with a delayed
 *   credit rate that is not a whole number of tenths of a percent
 */
export function benefitDimesAtAge(
  piaCents: number,
  nraMonths: number,
  delayedRetirementIncrease: number,
  ageMonths: number
): number {
  if (ageMonths < nraMonths) {
    const before = nraMonths - ageMonths;
    // 5/900 and 5/1200 over a common denominator: 20/3600 and 15/3600.
    return floorToDime(
      piaCents,
      3600 - 20 * Math.min(36, before) - 15 * Math.max(0, before - 36),
      3600
    );
  }
  const after = Math.min(ageMonths, MAX_BENEFIT_AGE_MONTHS) - nraMonths;
  // An annual credit of r/1000 earns r/12000 a month.
  return floorToDime(
    piaCents,
    12000 + delayedCreditPerMille(delayedRetirementIncrease) * after,
    12000
  );
}

/**
 * Personal benefit paid, in cents: benefitDimesAtAge truncated to the dollar.
 * Same parameters and errors as benefitDimesAtAge.
 */
export function benefitCentsAtAge(
  piaCents: number,
  nraMonths: number,
  delayedRetirementIncrease: number,
  ageMonths: number
): number {
  return floorToDollarCents(
    benefitDimesAtAge(piaCents, nraMonths, delayedRetirementIncrease, ageMonths)
  );
}

/**
 * A spouse's original benefit, in cents: half the worker's PIA, truncated to
 * the dime (POMS RS 00202.020, RS 00601.020).
 */
export function spousalOriginalBenefitCents(workerPiaCents: number): number {
  return floorToDime(workerPiaCents, 1, 2);
}

/**
 * A spousal excess reduced for claiming before full retirement age, at the
 * dime: 25/36 of 1% for each of the first 36 months and 5/12 of 1% for each
 * month beyond (POMS RS 00615.201), applied to the excess of the original
 * benefit over the spouse's own PIA (RS 00615.250).
 *
 * @param excessCents - The unreduced spousal excess in whole cents (normally
 *   a whole number of dimes; a PIA entered by hand may have cents)
 * @param monthsEarly - Months before full retirement age, 1 or more
 */
export function reducedSpousalExcessDimes(
  excessCents: number,
  monthsEarly: number
): number {
  return monthsEarly <= 36
    ? floorToDime(excessCents, 144 - monthsEarly, 144)
    : floorToDime(excessCents, 180 - (monthsEarly - 36), 240);
}

/**
 * A survivor benefit reduced for claiming before survivor full retirement
 * age, at the dime: reduced by 28.5% times the months early over the months
 * from 60 to survivor full retirement age (20 CFR 404.410(c)), so to 71.5%
 * at 60.
 *
 * @param baseCents - The amount reduced, in whole cents (normally a whole
 *   number of dimes)
 * @param monthsEarly - Months before survivor full retirement age, at most
 *   `reductionMonths`; 0 leaves the base unreduced
 * @param reductionMonths - Months from 60 to survivor full retirement age
 */
export function reducedSurvivorDimes(
  baseCents: number,
  monthsEarly: number,
  reductionMonths: number
): number {
  return floorToDime(
    baseCents,
    1000 * reductionMonths - 285 * monthsEarly,
    1000 * reductionMonths
  );
}

/**
 * The floor of the widow(er)'s limit, at the dime: 82.5% of the deceased's
 * PIA, truncated to the dime (POMS RS 00615.320's examples: $374.90 gives
 * $309.20).
 */
export function widowLimitFloorDimes(piaCents: number): number {
  return floorToDime(piaCents, 825, 1000);
}

/**
 * The widow(er)'s limit, at the dime: the larger of the deceased's reduced
 * retirement benefit at the dime and 82.5% of their PIA truncated to the
 * dime (Act 202(e)(2)(D); POMS RS 00615.320).
 */
export function widowLimitDimes(
  piaCents: number,
  ownBenefitDimes: number
): number {
  return Math.max(widowLimitFloorDimes(piaCents), ownBenefitDimes);
}
