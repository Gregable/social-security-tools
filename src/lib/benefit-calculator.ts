import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';

/**
 * Returns benefit multiplier at a given age relative to normal retirement age.
 *
 * The early retirement reduction factor changes from 6.67%/yr for years
 * earlier than 3 years before normal retirement age to 5%/yr for the 3 years
 * immediately before normal retirement age.
 */
function benefitMultiplierAtAge(
  nra: MonthDuration,
  delayedRetirementIncrease: number,
  age: MonthDuration
): number {
  if (nra.greaterThan(age)) {
    // Reduced benefits due to taking benefits early.
    const before = nra.subtract(age);
    return (
      -1.0 *
      ((Math.min(36, before.asMonths()) * 5) / 900 +
        (Math.max(0, before.asMonths() - 36) * 5) / 1200)
    );
  } else {
    // Increased benefits due to taking benefits late.
    const after = age.subtract(nra);
    return (delayedRetirementIncrease / 12) * after.asMonths();
  }
}

/**
 * Returns personal benefit amount if starting benefits at a given age.
 */
export function benefitAtAge(recipient: Recipient, age: MonthDuration): Money {
  return recipient
    .pia()
    .primaryInsuranceAmount()
    .floorToDollar()
    .times(
      1 +
        benefitMultiplierAtAge(
          recipient.normalRetirementAge(),
          recipient.delayedRetirementIncrease(),
          age
        )
    )
    .floorToDollar();
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

  return benefitOnDateCore(recipient, filingDate, atDate, filingAge);
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
 * Core benefit calculation logic shared between benefitOnDate variants.
 * Calculates delayed retirement credits based on filing date.
 */
function benefitOnDateCore(
  recipient: Recipient,
  filingDate: MonthDate,
  atDate: MonthDate,
  filingAge: MonthDuration
): Money {
  // If this is the year after filing, delayed credits are fully applied.
  if (filingDate.year() < atDate.year())
    return benefitAtAge(recipient, filingAge);

  const normalRetirementDate: MonthDate = recipient.normalRetirementDate();

  // If you are filing before normal retirement, no delayed credits apply.
  if (filingDate.lessThanOrEqual(normalRetirementDate))
    return benefitAtAge(recipient, filingAge);

  // 70 is an explicit exception because the SSA likes to make my life harder.
  // Normally, you'd need to wait until the next year to get delayed credits,
  // but not if you file at exactly 70.
  if (filingAge.years() >= 70) return benefitAtAge(recipient, filingAge);

  // If you file in January, delayed credits are fully applied.
  if (filingDate.monthIndex() === 0) return benefitAtAge(recipient, filingAge);

  // Otherwise, you only get credits up to January of this year,
  // or NRA, whichever is later.
  const thisJan = MonthDate.initFromYearsMonths({
    years: filingDate.year(),
    months: 0,
  });

  const benefitComputationDate = normalRetirementDate.greaterThan(thisJan)
    ? normalRetirementDate
    : thisJan;

  return benefitAtAge(
    recipient,
    recipient.birthdate.ageAtSsaDate(benefitComputationDate)
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
 * Returns true if recipient is eligible for spousal benefits from spouse.
 */
export function eligibleForSpousalBenefit(
  recipient: Recipient,
  spouse: Recipient
): boolean {
  const piaAmount: Money = recipient.pia().primaryInsuranceAmount();
  const spousePiaAmount: Money = spouse.pia().primaryInsuranceAmount();

  return spousePiaAmount.div(2).greaterThan(piaAmount);
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
 * @returns The calculated spousal benefit amount
 */
export function spousalBenefitOnDate(
  recipient: Recipient,
  spouse: Recipient,
  spouseFilingDate: MonthDate,
  filingDate: MonthDate,
  atDate: MonthDate
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
    .primaryInsuranceAmount()
    .cents();
  const spousePiaAmountCents: number = spouse
    .pia()
    .primaryInsuranceAmount()
    .cents();

  // Calculate the base spousal benefit amount:
  const spousalCents = spousePiaAmountCents / 2 - piaAmountCents;
  if (spousalCents <= 0) {
    return Money.zero();
  }

  const normalRetirementDate = recipient.normalRetirementDate();

  // Spousal Benefits start on after normal retirement date:
  if (startDate.greaterThanOrEqual(normalRetirementDate)) {
    if (filingDate.lessThanOrEqual(normalRetirementDate)) {
      return Money.fromCents(spousalCents).floorToDollar();
    }
    // https://www.bogleheads.org/forum/viewtopic.php?p=3986794#p3986794
    // https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615694
    // The combined spousal and personal benefits cannot be greater than
    // 50% of the higher earner's PIA, except in the case where personal
    // benefits alone are higher than 50% of the higher earner's PIA.
    // The way this is computed is to reduce the spousal benefit if the sum
    // of the spousal and personal benefits exceeds 50% of the higher
    // earner's PIA.
    const personalBenefit = benefitOnDate(recipient, filingDate, atDate);
    const spouseBenefitCents =
      spousePiaAmountCents / 2 - personalBenefit.cents();
    if (spouseBenefitCents <= 0) {
      return Money.zero();
    } else {
      return Money.fromCents(spouseBenefitCents).floorToDollar();
    }
  }

  // Spousal Benefits start before normal retirement date:
  let monthsBeforeNra: number =
    normalRetirementDate.monthsSinceEpoch() - startDate.monthsSinceEpoch();
  if (monthsBeforeNra <= 36) {
    // 25 / 36 of one percent for each month:
    return Money.fromCents(
      spousalCents * (1 - monthsBeforeNra / 144)
    ).floorToDollar();
  } else {
    // 25% for the first 36 months:
    const firstReductionCents: number = spousalCents * 0.25;
    monthsBeforeNra = monthsBeforeNra - 36;
    // 5 / 12 of one percent for each additional month:
    const secondReductionCents: number = spousalCents * (monthsBeforeNra / 240);

    return Money.fromCents(
      spousalCents - firstReductionCents - secondReductionCents
    ).floorToDollar();
  }
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
  // First calculate the base survivor benefit. There are two situations based
  // on if the deceased recipient filed for benefits before death or not.
  let baseSurvivorBenefit: Money;

  if (survivorFilingDate.lessThanOrEqual(deceasedDeathDate)) {
    throw new Error(
      `Cannot file for survivor benefits before spouse died: ${survivorFilingDate.toString()} <= ${deceasedDeathDate.toString()}`
    );
  }

  if (deceasedFilingDate.greaterThanOrEqual(deceasedDeathDate)) {
    // If the deceased recipient did not file for benefits before death:
    if (deceasedDeathDate.lessThan(deceased.normalRetirementDate())) {
      // If the deceased died before Normal Retirement Age, the survivor
      // benefit is based on the deceased recipient's PIA.
      baseSurvivorBenefit = deceased.pia().primaryInsuranceAmount();
    } else {
      // If the deceased died after Normal Retirement Age, the survivor
      // benefit is based on the deceased recipient's benefit as though they
      // filed for benefits on the date of death. Delayed retirement credits
      // stop accruing at age 70, so cap the effective filing date there.
      const age70Date = deceased.birthdate.dateAtSsaAge(
        MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
      );
      const effectiveFilingDate = MonthDate.min(deceasedDeathDate, age70Date);
      baseSurvivorBenefit = benefitOnDate(
        deceased,
        effectiveFilingDate,
        deceased.birthdate.dateAtSsaAge(
          MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
        )
      );
    }
  } else {
    // If the deceased recipient filed for benefits before death, then the base
    // survivor benefit is the greater of the deceased recipient's benefit at
    // the time of death or 82.5% of the deceased recipient's PIA.
    baseSurvivorBenefit = Money.max(
      deceased.pia().primaryInsuranceAmount().times(0.825),
      benefitOnDate(
        deceased,
        deceasedFilingDate,
        deceased.birthdate.dateAtSsaAge(
          MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
        )
      )
    );
    baseSurvivorBenefit = Money.fromCents(
      Math.floor(baseSurvivorBenefit.cents())
    );
  }

  // Next, calculate the survivor benefit for the recipient based on the
  // survivor's age. If the survivor is at or above Full Retirement Age,
  // the survivor benefit is the base survivor benefit. If the survivor is
  // below Full Retirement Age, the survivor benefit is reduced based on the
  // survivor's age, adjusted proportionally between 71.5% and 100% of the
  // base amount based on the survivor's age between 60 and Full Retirement
  // Age.
  const survivorAgeAtFiling =
    survivor.birthdate.ageAtSsaDate(survivorFilingDate);
  if (
    survivorAgeAtFiling.greaterThanOrEqual(
      survivor.survivorNormalRetirementAge()
    )
  ) {
    return baseSurvivorBenefit.floorToDollar();
  } else {
    const monthsBetween60AndNRA = survivor
      .survivorNormalRetirementAge()
      .subtract(MonthDuration.initFromYearsMonths({ years: 60, months: 0 }))
      .asMonths();
    const monthsBetweenAge60AndSurvivorAge = survivorAgeAtFiling
      .subtract(MonthDuration.initFromYearsMonths({ years: 60, months: 0 }))
      .asMonths();

    const reductionRatio = Math.max(
      0,
      monthsBetweenAge60AndSurvivorAge / monthsBetween60AndNRA
    );
    const minSurvivorBenefitRatio = 0.715;
    const result = baseSurvivorBenefit.times(
      minSurvivorBenefitRatio + (1 - minSurvivorBenefitRatio) * reductionRatio
    );
    return result.floorToDollar();
  }
}
