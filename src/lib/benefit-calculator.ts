import * as constants from '$lib/constants';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';

/**
 * The oldest age at which filing still changes the benefit amount. Delayed
 * retirement credits stop accruing the month a recipient turns 70, so waiting
 * beyond it only forgoes payments.
 */
export const MAX_BENEFIT_AGE_MONTHS = 70 * 12;

/**
 * A survivor benefit claimed at age 60 is reduced to this fraction of the
 * base amount, scaling linearly to 100% at survivor full retirement age.
 *
 * Shared with the fast paths in strategy/calculations so all three copies of
 * the survivor formula multiply by the same floating-point value. They must
 * agree to the last rounding step, and `1 - 0.715` is not `0.285` in IEEE
 * arithmetic — a literal 0.285 in one copy rounded a half-cent case the other
 * way, giving a $1/month survivor benefit the grid-cell NPV and the scenario
 * detail then disagreed on.
 */
export const MIN_SURVIVOR_BENEFIT_RATIO = 0.715;

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
 * never rounding up: rounding to the cent first would overpay whenever the
 * exact amount ends in $X.995 or more.
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
 * @param excessCents - The unreduced spousal excess, a whole number of dimes
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
 * age, at the dime: 28.5% times the months early over the months from 60 to
 * survivor full retirement age (20 CFR 404.410(c)), so 71.5% at 60.
 *
 * @param baseCents - The amount reduced, a whole number of dimes
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
 * 82.5% of a PIA as a survivor would be paid it, truncated to the dollar:
 * the widow(er)'s limit floor, for display.
 */
export function widowLimitFloor(pia: Money): Money {
  return Money.fromCents(floorToDollarCents(widowLimitFloorDimes(pia.cents())));
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

/**
 * Returns personal benefit amount if starting benefits at a given age.
 *
 * See benefitCentsAtAge for the reduction, credit and rounding rules.
 *
 * @param throughColaYear - Optional last COLA year to apply to the PIA. Defaults
 *   to the current-dollar value. Pass an earlier year (see benefitOnDateNominal)
 *   to compute the nominal benefit payable before later COLAs took effect.
 */
export function benefitAtAge(
  recipient: Recipient,
  age: MonthDuration,
  throughColaYear?: number
): Money {
  return Money.fromCents(
    benefitCentsAtAge(
      recipient.pia().primaryInsuranceAmount(throughColaYear).cents(),
      recipient.normalRetirementAge().asMonths(),
      recipient.delayedRetirementIncrease(),
      age.asMonths()
    )
  );
}

/**
 * Given a certain filing date and current date, returns the benefit amount
 * for the recipient on that date. Does not include spousal benefits.
 *
 * @param recipient - The recipient
 * @param filingDate - The date the recipient files for benefits
 * @param atDate - The date to calculate the benefit for
 * @throws Error if filing age is less than 62
 */
export function benefitOnDate(
  recipient: Recipient,
  filingDate: MonthDate,
  atDate: MonthDate
): Money {
  const filingAge = checkedFilingAge(recipient, filingDate);

  // If the recipient hasn't filed yet, return $0:
  if (filingDate.greaterThan(atDate)) return Money.from(0);

  return benefitOnDateCore(recipient, filingDate, atDate, filingAge);
}

/**
 * benefitOnDate before dollar rounding: the benefit at the dime, which is
 * what spousal and survivor amounts are computed from.
 *
 * @throws Error if filing age is less than 62
 */
function benefitDimesOnDate(
  recipient: Recipient,
  filingDate: MonthDate,
  atDate: MonthDate
): Money {
  const filingAge = checkedFilingAge(recipient, filingDate);
  if (filingDate.greaterThan(atDate)) return Money.from(0);
  return benefitDimesOnDateCore(recipient, filingDate, atDate, filingAge);
}

/**
 * The recipient's SSA age at `filingDate`.
 *
 * @throws Error if it is less than 62
 */
function checkedFilingAge(
  recipient: Recipient,
  filingDate: MonthDate
): MonthDuration {
  const filingAge = recipient.birthdate.ageAtSsaDate(filingDate);
  const minFilingAge = MonthDuration.initFromYearsMonths({
    years: 62,
    months: 0,
  });
  if (filingAge.lessThan(minFilingAge)) {
    throw new Error(
      `Filing age must be at least 62, got ${filingAge.years()}y ${filingAge.modMonths()}m`
    );
  }
  return filingAge;
}

/**
 * Optimized version of benefitOnDate that skips validation.
 * Use only when inputs are already validated (e.g., in strategy calculations).
 */
export function benefitOnDateOptimized(
  recipient: Recipient,
  filingDate: MonthDate,
  atDate: MonthDate
): Money {
  const filingAge = recipient.birthdate.ageAtSsaDate(filingDate);
  return benefitOnDateCore(recipient, filingDate, atDate, filingAge);
}

/**
 * Returns the last COLA year in effect for a benefit shown for the month
 * `atDate`, for display of historical (nominal) amounts.
 *
 * A given year's COLA is effective in December of that year (payable the
 * following January), so a benefit "for" a month only reflects COLA[Y] once
 * that December has arrived. We also never assume COLAs beyond those already
 * applied today (`CURRENT_YEAR - 1`), so any current or future `atDate` yields
 * the same current-dollar value as `benefitOnDate`.
 */
function colaYearForDisplayDate(atDate: MonthDate): number {
  // monthIndex() is 0 for January and 11 for December. A December benefit is the
  // first month to reflect that year's COLA; January through November reflect
  // only through the prior year's.
  const raw = atDate.monthIndex() === 11 ? atDate.year() : atDate.year() - 1;
  return Math.min(raw, constants.CURRENT_YEAR - 1);
}

/**
 * Like benefitOnDate, but expresses the result in the dollars actually payable
 * in the month `atDate` rather than in today's dollars.
 *
 * benefitOnDate always applies every COLA through `CURRENT_YEAR - 1`, so a past
 * month is shown inflated by COLAs that had not yet taken effect then. This
 * variant instead caps COLAs at the vintage in effect for `atDate`, so a past
 * month reflects the nominal amount payable then (matching SSA letters/deposits
 * to within whole-dollar rounding). For any `atDate` at or after the most recent
 * applied COLA, it is identical to benefitOnDate.
 *
 * Used by the filing-date chart display only; the strategy optimizer continues
 * to use benefitOnDate/benefitOnDateOptimized (constant today's dollars).
 *
 * PIA-only recipients have no earnings history to unwind COLAs from, so their
 * override PIA (already in current dollars) is returned unchanged; for them this
 * matches benefitOnDate for every date.
 *
 * @param recipient - The recipient
 * @param filingDate - The date the recipient files for benefits
 * @param atDate - The month to express the benefit in (and to calculate for)
 * @throws Error if filing age is less than 62
 */
export function benefitOnDateNominal(
  recipient: Recipient,
  filingDate: MonthDate,
  atDate: MonthDate
): Money {
  const filingAge = recipient.birthdate.ageAtSsaDate(filingDate);
  const minFilingAge = MonthDuration.initFromYearsMonths({
    years: 62,
    months: 0,
  });
  if (filingAge.lessThan(minFilingAge)) {
    throw new Error(
      `Filing age must be at least 62, got ${filingAge.years()}y ${filingAge.modMonths()}m`
    );
  }

  // If the recipient hasn't filed yet, return $0:
  if (filingDate.greaterThan(atDate)) return Money.from(0);

  return benefitOnDateCore(
    recipient,
    filingDate,
    atDate,
    filingAge,
    colaYearForDisplayDate(atDate)
  );
}

/**
 * The age whose delayed credits are in effect on `atDate` for a recipient who
 * filed at `filingAge`. Usually that is the filing age itself; filing after
 * full retirement age in a month other than January, before 70, credits only
 * the months through January of the filing year (or full retirement age, if
 * later) until the following January.
 */
function creditedAgeOnDate(
  recipient: Recipient,
  filingDate: MonthDate,
  atDate: MonthDate,
  filingAge: MonthDuration
): MonthDuration {
  // If this is the year after filing, delayed credits are fully applied.
  if (filingDate.year() < atDate.year()) return filingAge;

  const normalRetirementDate: MonthDate = recipient.normalRetirementDate();

  // If you are filing before normal retirement, no delayed credits apply.
  if (filingDate.lessThanOrEqual(normalRetirementDate)) return filingAge;

  // 70 is an explicit exception because the SSA likes to make my life harder.
  // Normally, you'd need to wait until the next year to get delayed credits,
  // but not if you file at exactly 70.
  if (filingAge.years() >= 70) return filingAge;

  // If you file in January, delayed credits are fully applied.
  if (filingDate.monthIndex() === 0) return filingAge;

  // Otherwise, you only get credits up to January of this year,
  // or NRA, whichever is later.
  const thisJan = MonthDate.initFromYearsMonths({
    years: filingDate.year(),
    months: 0,
  });

  const benefitComputationDate = normalRetirementDate.greaterThan(thisJan)
    ? normalRetirementDate
    : thisJan;

  return recipient.birthdate.ageAtSsaDate(benefitComputationDate);
}

/**
 * Core benefit calculation logic shared between benefitOnDate variants.
 * Calculates delayed retirement credits based on filing date.
 *
 * @param throughColaYear - Optional last COLA year to apply to the PIA. When
 *   omitted, the current-dollar PIA is used (today's dollars). benefitOnDateNominal
 *   passes the vintage in effect for `atDate` to show historical amounts.
 */
function benefitOnDateCore(
  recipient: Recipient,
  filingDate: MonthDate,
  atDate: MonthDate,
  filingAge: MonthDuration,
  throughColaYear?: number
): Money {
  return benefitAtAge(
    recipient,
    creditedAgeOnDate(recipient, filingDate, atDate, filingAge),
    throughColaYear
  );
}

/**
 * benefitOnDateCore before dollar rounding: the benefit at the dime, which
 * is what spousal and survivor amounts are computed from (POMS RS 00601.020
 * D.2, RS 00615.694).
 */
function benefitDimesOnDateCore(
  recipient: Recipient,
  filingDate: MonthDate,
  atDate: MonthDate,
  filingAge: MonthDuration,
  throughColaYear?: number
): Money {
  return Money.fromCents(
    benefitDimesAtAge(
      recipient.pia().primaryInsuranceAmount(throughColaYear).cents(),
      recipient.normalRetirementAge().asMonths(),
      recipient.delayedRetirementIncrease(),
      creditedAgeOnDate(recipient, filingDate, atDate, filingAge).asMonths()
    )
  );
}

/**
 * Returns true if recipient a has higher earnings than recipient b,
 * based on their Primary Insurance Amounts.
 */
export function higherEarningsThan(a: Recipient, b: Recipient): boolean {
  return a
    .pia()
    .primaryInsuranceAmount()
    .greaterThan(b.pia().primaryInsuranceAmount());
}

/**
 * The base (unreduced) spousal benefit at normal retirement age: 50% of the
 * higher earner's PIA, truncated to the dime, minus the lower earner's own
 * PIA, floored at $0. This is the spousal top-up before any early-filing
 * reduction. A lower earner is eligible for a spousal benefit exactly when
 * this is positive.
 *
 * @param higher - The higher earner (whose PIA the spousal benefit is based on)
 * @param lower - The potential spousal claimant
 */
export function baseSpousalBenefit(higher: Recipient, lower: Recipient): Money {
  const excessCents =
    spousalOriginalBenefitCents(higher.pia().primaryInsuranceAmount().cents()) -
    lower.pia().primaryInsuranceAmount().cents();
  return Money.fromCents(Math.max(0, excessCents));
}

/**
 * Returns true if recipient is eligible for spousal benefits from spouse.
 */
export function eligibleForSpousalBenefit(
  recipient: Recipient,
  spouse: Recipient
): boolean {
  // recipient is the potential claimant; spouse is the higher earner.
  return baseSpousalBenefit(spouse, recipient).value() > 0;
}

/**
 * Calculates the spousal benefit amount on a specific date based on filing
 * dates.
 *
 * It accounts for:
 * - The earnings relationship between spouses (higher vs lower earner)
 * - Whether the benefit start date has been reached
 * - Normal retirement age adjustments
 * - Early filing reductions (different rates for first 36 months vs beyond)
 * - Delayed retirement credits impact on spousal benefits
 *
 * @param recipient - The lower-earning spouse
 * @param spouse - The higher-earning spouse whose record provides the benefit
 * @param spouseFilingDate - The date when the higher-earning spouse files
 * @param filingDate - The date when this recipient (lower earner) files
 * @param atDate - The specific date for which to calculate the benefit amount
 * @param throughColaYear - Optional last COLA year to apply to the underlying
 *   PIAs and personal benefit. Defaults to the current-dollar value; pass an
 *   earlier year (see allBenefitsOnDateNominal) to express the spousal benefit
 *   in the dollars payable at a past month.
 * @returns The calculated spousal benefit amount
 */
export function spousalBenefitOnDate(
  recipient: Recipient,
  spouse: Recipient,
  spouseFilingDate: MonthDate,
  filingDate: MonthDate,
  atDate: MonthDate,
  throughColaYear?: number
): Money {
  // Calculate the starting date as the latest of the two filing dates:
  const startDate = spouseFilingDate.greaterThan(filingDate)
    ? spouseFilingDate
    : filingDate;

  // If the spouse has lower earnings, return $0:
  if (higherEarningsThan(recipient, spouse)) return Money.zero();

  // If the start date is in the future, return $0:
  if (startDate.greaterThan(atDate)) return Money.zero();

  const piaAmountCents: number = recipient
    .pia()
    .primaryInsuranceAmount(throughColaYear)
    .cents();
  // The original benefit: half the higher earner's PIA, at the dime.
  const originalCents = spousalOriginalBenefitCents(
    spouse.pia().primaryInsuranceAmount(throughColaYear).cents()
  );

  // The excess over the recipient's own PIA is what is paid as a spouse:
  const excessCents = originalCents - piaAmountCents;
  if (excessCents <= 0) {
    return Money.zero();
  }

  const normalRetirementDate = recipient.normalRetirementDate();

  // Spousal Benefits start on after normal retirement date:
  if (startDate.greaterThanOrEqual(normalRetirementDate)) {
    if (filingDate.lessThanOrEqual(normalRetirementDate)) {
      return Money.fromCents(floorToDollarCents(excessCents));
    }
    // https://www.bogleheads.org/forum/viewtopic.php?p=3986794#p3986794
    // https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615694
    // Filed for their own benefit after full retirement age, so it carries
    // delayed credits. SSA computes the combined amount without them (own
    // PIA plus the excess, i.e. the original benefit) and pays as a spouse
    // that combined amount minus the own benefit with credits. Both are at
    // the dime; each benefit is then truncated to the dollar separately
    // (POMS RS 00601.020 D.2).
    // Use benefitDimesOnDateCore (not benefitOnDate) so the optional COLA
    // cutoff is applied to the personal benefit too. In this branch
    // filingDate is past NRA and startDate <= atDate, so benefitOnDate's
    // age>=62 and filingDate>atDate guards are never relevant here.
    const personalDimes = benefitDimesOnDateCore(
      recipient,
      filingDate,
      atDate,
      recipient.birthdate.ageAtSsaDate(filingDate),
      throughColaYear
    );
    const payableCents = originalCents - personalDimes.cents();
    return Money.fromCents(
      payableCents <= 0 ? 0 : floorToDollarCents(payableCents)
    );
  }

  // Spousal Benefits start before normal retirement date: reduce the excess.
  const monthsBeforeNra =
    normalRetirementDate.monthsSinceEpoch() - startDate.monthsSinceEpoch();
  return Money.fromCents(
    floorToDollarCents(reducedSpousalExcessDimes(excessCents, monthsBeforeNra))
  );
}

/**
 * Returns the spousal and primary benefit on a given date for a recipient.
 */
export function allBenefitsOnDate(
  recipient: Recipient,
  spouse: Recipient,
  spouseFilingDate: MonthDate,
  filingDate: MonthDate,
  atDate: MonthDate
): Money {
  return benefitOnDate(recipient, filingDate, atDate).plus(
    spousalBenefitOnDate(
      recipient,
      spouse,
      spouseFilingDate,
      filingDate,
      atDate
    )
  );
}

/**
 * Like allBenefitsOnDate, but expresses the combined personal + spousal benefit
 * in the dollars actually payable in the month `atDate` rather than in today's
 * dollars. Used by the combined (spousal) chart display only; the strategy
 * optimizer continues to use allBenefitsOnDate (constant today's dollars).
 *
 * For any `atDate` at or after the most recent applied COLA this is identical
 * to allBenefitsOnDate. See benefitOnDateNominal for the COLA-vintage rule.
 *
 * Note: this covers the personal and spousal components only; survivor benefits
 * are not adjusted here (tracked separately on issue #559).
 */
export function allBenefitsOnDateNominal(
  recipient: Recipient,
  spouse: Recipient,
  spouseFilingDate: MonthDate,
  filingDate: MonthDate,
  atDate: MonthDate
): Money {
  const throughColaYear = colaYearForDisplayDate(atDate);
  return benefitOnDateNominal(recipient, filingDate, atDate).plus(
    spousalBenefitOnDate(
      recipient,
      spouse,
      spouseFilingDate,
      filingDate,
      atDate,
      throughColaYear
    )
  );
}

/**
 * Whether a filing month means the recipient actually filed before dying.
 *
 * SSA pays no retirement benefit for the month of death, so a claim effective
 * in that month or later is no claim at all. The survivor rules below treat
 * such a worker as never having filed, and the UI labels the strategy "does
 * not file" rather than naming a filing month.
 *
 * The optimizers do not model a separate "never file" choice. They cap the
 * search at the death month (or, for a recipient who dies before they could
 * file, at the one age left), so a filing age in or past the death month is
 * how that strategy is represented.
 *
 * Model limitation: the benefit-period generators still count the death
 * month inclusive, so a death-month filing earns one month of personal
 * benefit in the NPV even though SSA would not pay it.
 */
export function filedBeforeDeath(
  filingDate: MonthDate,
  deathDate: MonthDate
): boolean {
  return filingDate.lessThan(deathDate);
}

/**
 * A survivor benefit before the survivor's own age reduction.
 *
 * `base` is the amount the age reduction applies to (SSA's "original
 * benefit"): the deceased's PIA, or their benefit including delayed
 * retirement credits when they earned any.
 *
 * `limit` is the widow(er)'s limit, often called RIB-LIM, or null when it
 * does not apply. It applies when the deceased took a reduced retirement
 * benefit, and caps the survivor benefit *after* the age reduction at the
 * larger of that reduced benefit and 82.5% of the deceased's PIA (Act
 * 202(e)(2)(D); POMS RS 00615.320). Reducing the capped amount for age
 * instead would understate any survivor benefit claimed before survivor full
 * retirement age.
 *
 * Both are at the dime, before any rounding to the dollar: SSA rounds only
 * the final survivor benefit to the dollar (POMS RS 00601.020).
 */
export interface SurvivorBenefitBasis {
  readonly base: Money;
  readonly limit: Money | null;
}

/**
 * Determines the survivor benefit basis from the deceased's record.
 *
 * @param deceased The deceased recipient.
 * @param deceasedFilingDate The date the deceased recipient filed for
 * benefits. If the deceased recipient did not file for benefits, use the
 * date of death or any date later.
 * @param deceasedDeathDate The date of death of the deceased recipient.
 */
export function survivorBenefitBasis(
  deceased: Recipient,
  deceasedFilingDate: MonthDate,
  deceasedDeathDate: MonthDate
): SurvivorBenefitBasis {
  const pia = deceased.pia().primaryInsuranceAmount();

  // The deceased's benefit, at the dime, read at a date late enough that
  // every delayed credit has taken effect. A year after filing always
  // qualifies (delayed credits land the January after filing at the latest).
  // A fixed age-71 date does not: someone who files past 71 would be read
  // *before* they filed, and the benefit is $0 for a date before filing.
  const benefitAfterAllCredits = (filingDate: MonthDate): Money =>
    benefitDimesOnDate(
      deceased,
      filingDate,
      filingDate.addDuration(MonthDuration.OneYear())
    );

  if (!filedBeforeDeath(deceasedFilingDate, deceasedDeathDate)) {
    // Died before filing, and before full retirement age: 100% of the PIA.
    if (deceasedDeathDate.lessThan(deceased.normalRetirementDate())) {
      return { base: pia, limit: null };
    }
    // Died before filing but after full retirement age: their benefit as
    // though they had filed in the month of death, which credits every
    // month up to but not including it (20 CFR 404.313(e)(1)). Delayed
    // credits stop accruing at age 70, so cap the effective filing date
    // there.
    const age70Date = deceased.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
    );
    const effectiveFilingDate = MonthDate.min(deceasedDeathDate, age70Date);
    return {
      base: benefitAfterAllCredits(effectiveFilingDate),
      limit: null,
    };
  }

  const ownBenefit = benefitAfterAllCredits(deceasedFilingDate);
  // Filed at or after full retirement age: the benefit they received,
  // including any delayed retirement credits.
  if (!deceasedFilingDate.lessThan(deceased.normalRetirementDate())) {
    return { base: ownBenefit, limit: null };
  }
  // Filed early: the age reduction starts from 100% of the PIA, and the
  // widow(er)'s limit caps the result.
  return {
    base: pia,
    limit: Money.fromCents(widowLimitDimes(pia.cents(), ownBenefit.cents())),
  };
}

/**
 * Applies the survivor's age reduction to a survivor benefit basis, then the
 * widow(er)'s limit.
 *
 * At or past survivor full retirement age there is no reduction. Before it,
 * the base is reduced linearly from 100% at survivor full retirement age to
 * 71.5% at 60. Survivor full retirement age has its own table, so it can
 * differ from the survivor's own retirement full retirement age.
 *
 * @param survivor The surviving recipient.
 * @param basis The basis from `survivorBenefitBasis` (or, for a deceased
 * who received disability benefits, 100% of their PIA with no limit).
 * @param survivorFilingDate The month survivor benefits start.
 */
export function reducedSurvivorBenefit(
  survivor: Recipient,
  basis: SurvivorBenefitBasis,
  survivorFilingDate: MonthDate
): Money {
  const survivorAgeAtFiling = survivor.birthdate
    .ageAtSsaDate(survivorFilingDate)
    .asMonths();
  const survivorNra = survivor.survivorNormalRetirementAge().asMonths();
  let reducedCents = basis.base.cents();
  if (survivorAgeAtFiling < survivorNra) {
    const reductionMonths = survivorNra - 60 * 12;
    // A claim before 60 is reduced as though made at 60.
    const monthsEarly = Math.min(
      reductionMonths,
      survivorNra - survivorAgeAtFiling
    );
    reducedCents = reducedSurvivorDimes(
      reducedCents,
      monthsEarly,
      reductionMonths
    );
  }
  const limitedCents =
    basis.limit !== null
      ? Math.min(reducedCents, basis.limit.cents())
      : reducedCents;
  return Money.fromCents(floorToDollarCents(limitedCents));
}

/**
 * Determines the survivor benefit for a recipient.
 * @param survivor The surviving recipient.
 * @param deceased The deceased recipient.
 * @param deceasedFilingDate The date the deceased recipient filed for
 * benefits. If the deceased recipient did not file for benefits, use the
 * date of death or any date later.
 * @param deceasedDeathDate The date of death of the deceased recipient.
 * @param survivorFilingDate The date the survivor recipient filed for
 * survivor benefits.
 */
export function survivorBenefit(
  survivor: Recipient,
  deceased: Recipient,
  deceasedFilingDate: MonthDate,
  deceasedDeathDate: MonthDate,
  survivorFilingDate: MonthDate
): Money {
  if (survivorFilingDate.lessThanOrEqual(deceasedDeathDate)) {
    throw new Error(
      `Cannot file for survivor benefits before spouse died: ${survivorFilingDate.toString()} <= ${deceasedDeathDate.toString()}`
    );
  }
  return reducedSurvivorBenefit(
    survivor,
    survivorBenefitBasis(deceased, deceasedFilingDate, deceasedDeathDate),
    survivorFilingDate
  );
}
