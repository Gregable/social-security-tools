/**
 * Raw-number benefit helpers shared by the two couple fast paths,
 * expectedNPVCoupleOptimized (expected-npv.ts) and optimalStrategyCoupleFast
 * (optimal-strategy-fast.ts).
 *
 * They replicate the arithmetic of the object-oriented implementations in
 * benefit-calculator.ts and strategy-calc.ts on raw `number` values (cents,
 * epoch months) so the hot loops allocate no Money / MonthDate /
 * MonthDuration objects. They MUST match those implementations to the last
 * rounding step; any divergence shows up as a golden-test failure
 * (grid-optimal-goldens.test.ts, expected-npv-couple-goldens.test.ts). The
 * rounding itself comes from the shared primitives in benefit-calculator.ts:
 * amounts are kept at the dime and only each final benefit is truncated to
 * the dollar, as SSA does.
 */

import {
  benefitDimesAtAge,
  floorToDollarCents,
  MAX_BENEFIT_AGE_MONTHS,
  reducedSpousalExcessDimes,
  reducedSurvivorDimes,
  spousalOriginalBenefitCents,
  widowLimitDimes,
} from '$lib/benefit-rounding';

/**
 * Personal benefit during the filing year, at the dime, in cents.
 *
 * Replicates benefitDimesOnDateCore(r, fd, fd, age) from
 * benefit-calculator.ts.
 *
 * The "January bump": for recipients filing after NRA but before age 70 in
 * a non-January month, SSA only grants delayed credits up to the previous
 * January. Full credits kick in the following January. This helper returns
 * the *reduced* amount that applies during the filing year; the full amount
 * is `benefitDimesAtAge` of the filing age.
 *
 * When the bump doesn't apply (filed before/at NRA, at 70, or in January),
 * returns the same value as `benefitDimesAtAge`.
 */
export function filingYearDimes(
  piaCents: number,
  nraMonths: number,
  delayedRetirementIncrease: number,
  ageMonths: number,
  ssaBirthEpoch: number,
  nraEpoch: number
): number {
  const filingEpoch = ssaBirthEpoch + ageMonths;
  if (
    filingEpoch <= nraEpoch ||
    ageMonths >= MAX_BENEFIT_AGE_MONTHS ||
    filingEpoch % 12 === 0
  )
    return benefitDimesAtAge(
      piaCents,
      nraMonths,
      delayedRetirementIncrease,
      ageMonths
    );

  const thisJan = filingEpoch - (filingEpoch % 12);
  const compAge = Math.max(nraEpoch, thisJan) - ssaBirthEpoch;
  return benefitDimesAtAge(
    piaCents,
    nraMonths,
    delayedRetirementIncrease,
    compAge
  );
}

/**
 * Personal benefit paid during the filing year, in cents: filingYearDimes
 * truncated to the dollar. Same parameters.
 */
export function filingYearCents(
  piaCents: number,
  nraMonths: number,
  delayedRetirementIncrease: number,
  ageMonths: number,
  ssaBirthEpoch: number,
  nraEpoch: number
): number {
  return floorToDollarCents(
    filingYearDimes(
      piaCents,
      nraMonths,
      delayedRetirementIncrease,
      ageMonths,
      ssaBirthEpoch,
      nraEpoch
    )
  );
}

/**
 * Spousal benefit in cents for a given filing pair.
 *
 * Replicates spousalBenefitOnDate (benefit-calculator.ts) at the spousal
 * period's start date. The original benefit is half the earner's PIA,
 * truncated to the dime, and the amount paid is its excess over the
 * dependent's own PIA:
 *
 *   - If the spousal period starts before the dependent's NRA, the excess is
 *     reduced for age.
 *   - If the dependent filed *after* their own NRA (accruing DRC), the
 *     amount paid is the original benefit minus the dependent's own benefit
 *     with credits, at the dime.
 *
 * `depFYDimes` and `depPJDimes` are the dependent's own benefit at the dime
 * during the filing year and from the following January (filingYearDimes and
 * benefitDimesAtAge).
 *
 * Returns 0 if the dependent has higher earnings or the excess is non-positive.
 */
export function spousalCentsForPair(
  depPiaCents: number,
  earnerPiaCents: number,
  depFilingEpoch: number,
  depNraEpoch: number,
  spousalStartEpoch: number,
  depFYDimes: number,
  depPJDimes: number
): number {
  const original = spousalOriginalBenefitCents(earnerPiaCents);
  const excess = original - depPiaCents;
  if (excess <= 0) return 0;

  if (spousalStartEpoch >= depNraEpoch) {
    if (depFilingEpoch <= depNraEpoch) return floorToDollarCents(excess);
    const startYear = Math.floor(spousalStartEpoch / 12);
    const filingYear = Math.floor(depFilingEpoch / 12);
    const personal = startYear > filingYear ? depPJDimes : depFYDimes;
    const payable = original - personal;
    return payable <= 0 ? 0 : floorToDollarCents(payable);
  }

  return floorToDollarCents(
    reducedSpousalExcessDimes(excess, depNraEpoch - spousalStartEpoch)
  );
}

/**
 * Survivor benefit in cents. Replicates survivorBenefit (benefit-calculator.ts).
 *
 * Base (what the survivor's age reduction applies to), at the dime:
 *   1. Earner died before filing and before NRA: the earner's PIA.
 *   2. Earner died before filing but after NRA: benefit as if the earner
 *      filed at min(death age, 70).
 *   3. Earner filed at or after NRA: the earner's benefit at filing.
 *   4. Earner filed before NRA: the earner's PIA.
 *
 * The base is reduced if the survivor starts collecting before their own
 * survivor-NRA (71.5% at age 60, linearly to 100% at NRA). In case 4 the
 * result is then capped at the widow(er)'s limit, max(82.5% of PIA, the
 * earner's reduced benefit); the cap applies after the age reduction, never
 * before it. Only the final amount is truncated to the dollar.
 */
export function survivorCentsCalc(
  earnerPiaCents: number,
  earnerNra: number,
  earnerDelayedRetirementIncrease: number,
  earnerSsaBirth: number,
  earnerNraEpoch: number,
  earnerFilingEpoch: number,
  earnerDeathEpoch: number,
  earner70Epoch: number,
  depSurvNra: number,
  survStartEpoch: number,
  depSsaBirth: number
): number {
  let base: number;
  let limit = Number.POSITIVE_INFINITY;
  if (earnerFilingEpoch >= earnerDeathEpoch) {
    if (earnerDeathEpoch < earnerNraEpoch) {
      base = earnerPiaCents;
    } else {
      const effEpoch = Math.min(earnerDeathEpoch, earner70Epoch);
      base = benefitDimesAtAge(
        earnerPiaCents,
        earnerNra,
        earnerDelayedRetirementIncrease,
        effEpoch - earnerSsaBirth
      );
    }
  } else {
    const eBenefit = benefitDimesAtAge(
      earnerPiaCents,
      earnerNra,
      earnerDelayedRetirementIncrease,
      earnerFilingEpoch - earnerSsaBirth
    );
    if (earnerFilingEpoch < earnerNraEpoch) {
      base = earnerPiaCents;
      limit = widowLimitDimes(earnerPiaCents, eBenefit);
    } else {
      base = eBenefit;
    }
  }

  const survAge = survStartEpoch - depSsaBirth;
  let reduced = base;
  if (survAge < depSurvNra) {
    const reductionMonths = depSurvNra - 720;
    // A claim before 60 is reduced as though made at 60.
    const monthsEarly = Math.min(reductionMonths, depSurvNra - survAge);
    reduced = reducedSurvivorDimes(base, monthsEarly, reductionMonths);
  }
  return floorToDollarCents(Math.min(reduced, limit));
}
