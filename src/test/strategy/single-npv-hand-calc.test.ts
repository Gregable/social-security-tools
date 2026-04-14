import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  strategySumCentsCouple,
  strategySumCentsSingle,
  strategySumPeriodsSingle,
} from '$lib/strategy/calculations';

/**
 * Hand-calculated verification tests for strategySumCentsSingle at 0% discount.
 *
 * At 0% discount with currentDate far in the past, NPV = sum of all monthly
 * payments. Each test computes the expected benefit and total by hand, then
 * compares against the function output.
 *
 * All recipients use birth years >= 1960 so NRA = 67y0m and delayed retirement
 * increase = 8%/year. Birth day is set > 2 (using the 15th) so earliest filing
 * is 62y1m.
 *
 * To avoid the delayed January bump (which splits payments into two periods
 * with different amounts), tests that file after NRA use either:
 *   - Filing at exactly age 70 (explicit exception in benefit-calculator.ts)
 *   - Filing at NRA or before (no delayed credits to split)
 *   - December 15 birth (so filing months land in January)
 */

// currentDate far in the past so all payments are included in the NPV sum.
const CURRENT_DATE = MonthDate.initFromYearsMonths({ years: 200, months: 0 });
const DISCOUNT_RATE = 0;

/**
 * Creates a PIA-only Recipient with the given dollar PIA and birthdate.
 */
function makeRecipient(
  piaDollars: number,
  birthYear: number,
  birthMonth: number,
  birthDay: number
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(birthYear, birthMonth, birthDay);
  r.setPia(Money.from(piaDollars));
  return r;
}

/**
 * Computes the expected monthly benefit in cents for a given PIA and filing
 * age, using the SSA formula for 1960+ births (NRA = 67y0m = 804 months,
 * delayed increase = 8%/year).
 *
 * The formula mirrors benefitAtAge: floor PIA to dollar, apply multiplier,
 * floor again.
 */
function expectedBenefitCents(
  piaDollars: number,
  filingAgeMonths: number
): number {
  const NRA_MONTHS = 804; // 67 * 12
  const piaFlooredCents = Math.floor(piaDollars) * 100;

  if (filingAgeMonths < NRA_MONTHS) {
    const monthsBefore = NRA_MONTHS - filingAgeMonths;
    const reduction =
      (Math.min(36, monthsBefore) * 5) / 900 +
      (Math.max(0, monthsBefore - 36) * 5) / 1200;
    const rawCents = Math.round(piaFlooredCents * (1 - reduction));
    return Math.floor(rawCents / 100) * 100;
  } else {
    const monthsAfter = filingAgeMonths - NRA_MONTHS;
    const increase = (0.08 / 12) * monthsAfter;
    const rawCents = Math.round(piaFlooredCents * (1 + increase));
    return Math.floor(rawCents / 100) * 100;
  }
}

/**
 * Returns the number of payment months from filingDate through finalDate
 * inclusive.
 */
function paymentMonths(filingDate: MonthDate, finalDate: MonthDate): number {
  return finalDate.monthsSinceEpoch() - filingDate.monthsSinceEpoch() + 1;
}

// ---------------------------------------------------------------------------
// 1. Filing at NRA
// ---------------------------------------------------------------------------

describe('Filing at NRA', () => {
  // At NRA (67y0m), benefit = PIA exactly (no reduction, no increase).
  const NRA = MonthDuration.initFromYearsMonths({ years: 67, months: 0 });

  it('PIA $1000, death at 75', () => {
    const r = makeRecipient(1000, 1960, 5, 15); // Jun 15, 1960
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 75,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    // 75y0m - 67y0m = 8y0m = 96 months, + 1 inclusive = 97
    expect(months).toBe(97);

    const benefitCents = 1000_00; // PIA at NRA
    const expectedNPV = benefitCents * months;

    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $500, death at 80', () => {
    const r = makeRecipient(500, 1962, 2, 15); // Mar 15, 1962
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 80,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(157); // 13y0m + 1

    const expectedNPV = 500_00 * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $1500, death at 85', () => {
    const r = makeRecipient(1500, 1963, 0, 15); // Jan 15, 1963
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 85,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(217); // 18y0m + 1

    const expectedNPV = 1500_00 * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $2000, death at 90', () => {
    const r = makeRecipient(2000, 1964, 7, 15); // Aug 15, 1964
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 90,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(277); // 23y0m + 1

    const expectedNPV = 2000_00 * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $2500, death at 95', () => {
    const r = makeRecipient(2500, 1965, 3, 15); // Apr 15, 1965
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 95,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(337); // 28y0m + 1

    const expectedNPV = 2500_00 * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $3000, death at 100', () => {
    const r = makeRecipient(3000, 1966, 9, 15); // Oct 15, 1966
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 100,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(397); // 33y0m + 1

    const expectedNPV = 3000_00 * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $3822 (max-ish), death at 70', () => {
    const r = makeRecipient(3822, 1960, 0, 15); // Jan 15, 1960
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 70,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(37); // 3y0m + 1

    const expectedNPV = 3822_00 * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $100 (minimum-ish), death at 80', () => {
    const r = makeRecipient(100, 1970, 6, 15); // Jul 15, 1970
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 80,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(157); // 13y0m + 1

    const expectedNPV = 100_00 * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });
});

// ---------------------------------------------------------------------------
// 2. Filing at 70
// ---------------------------------------------------------------------------

describe('Filing at 70', () => {
  // At 70y0m: 36 months after NRA (67y0m). Increase = (0.08/12)*36 = 0.24.
  // Benefit = floor(PIA * 1.24).
  // Filing at exactly age 70 is an explicit exception -- no delayed January
  // bump even if filing month is not January.
  const AGE_70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });

  it('PIA $1000, death at 85', () => {
    const r = makeRecipient(1000, 1960, 5, 15); // Jun 15, 1960
    const filingDate = r.birthdate.dateAtSsaAge(AGE_70);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 85,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(181); // 15y0m + 1

    // floor(1000 * 1.24) = 1240
    const benefitCents = expectedBenefitCents(1000, 70 * 12);
    expect(benefitCents).toBe(1240_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_70
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $1500, death at 90', () => {
    const r = makeRecipient(1500, 1962, 8, 15); // Sep 15, 1962
    const filingDate = r.birthdate.dateAtSsaAge(AGE_70);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 90,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(241); // 20y0m + 1

    // floor(1500 * 1.24) = 1860
    const benefitCents = expectedBenefitCents(1500, 70 * 12);
    expect(benefitCents).toBe(1860_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_70
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $2000, death at 95', () => {
    const r = makeRecipient(2000, 1964, 3, 15); // Apr 15, 1964
    const filingDate = r.birthdate.dateAtSsaAge(AGE_70);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 95,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(301); // 25y0m + 1

    // floor(2000 * 1.24) = 2480
    const benefitCents = expectedBenefitCents(2000, 70 * 12);
    expect(benefitCents).toBe(2480_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_70
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $2500, death at 100', () => {
    const r = makeRecipient(2500, 1965, 0, 15); // Jan 15, 1965
    const filingDate = r.birthdate.dateAtSsaAge(AGE_70);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 100,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(361); // 30y0m + 1

    // floor(2500 * 1.24) = 3100
    const benefitCents = expectedBenefitCents(2500, 70 * 12);
    expect(benefitCents).toBe(3100_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_70
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $3000, death at 80', () => {
    const r = makeRecipient(3000, 1966, 11, 15); // Dec 15, 1966
    const filingDate = r.birthdate.dateAtSsaAge(AGE_70);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 80,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(121); // 10y0m + 1

    // floor(3000 * 1.24) = 3720
    const benefitCents = expectedBenefitCents(3000, 70 * 12);
    expect(benefitCents).toBe(3720_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_70
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $500, death at 75', () => {
    const r = makeRecipient(500, 1968, 4, 15); // May 15, 1968
    const filingDate = r.birthdate.dateAtSsaAge(AGE_70);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 75,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(61); // 5y0m + 1

    // floor(500 * 1.24) = 620
    const benefitCents = expectedBenefitCents(500, 70 * 12);
    expect(benefitCents).toBe(620_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_70
    );
    expect(actual).toBe(expectedNPV);
  });
});

// ---------------------------------------------------------------------------
// 3. Filing at 62 (earliest for day > 2 is 62y1m)
// ---------------------------------------------------------------------------

describe('Filing at 62', () => {
  // For births after the 2nd, earliest filing is 62y1m.
  // 62y1m = 745 months. NRA = 804 months. Months before NRA = 59.
  // reduction = min(36,59)*5/900 + max(0,59-36)*5/1200
  //           = 36*5/900 + 23*5/1200
  //           = 0.2 + 115/1200
  //           = 0.2 + 0.095833...
  //           = 0.295833...
  // benefit = floor( floor(PIA) * (1 - 0.295833...) ) = floor(PIA * 0.704166...)
  const AGE_62_1 = MonthDuration.initFromYearsMonths({ years: 62, months: 1 });

  it('PIA $1000, death at 80', () => {
    const r = makeRecipient(1000, 1960, 5, 15); // Jun 15, 1960
    const filingDate = r.birthdate.dateAtSsaAge(AGE_62_1);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 80,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    // 80y0m - 62y1m = 17y11m = 215 months, + 1 = 216
    expect(months).toBe(216);

    // floor(1000 * 0.704166...) = floor(704.166...) = 704
    const benefitCents = expectedBenefitCents(1000, 62 * 12 + 1);
    expect(benefitCents).toBe(704_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_62_1
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $1500, death at 85', () => {
    const r = makeRecipient(1500, 1962, 2, 15); // Mar 15, 1962
    const filingDate = r.birthdate.dateAtSsaAge(AGE_62_1);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 85,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(276); // 22y11m + 1

    // floor(1500 * 0.704166...) = floor(1056.25) = 1056
    const benefitCents = expectedBenefitCents(1500, 62 * 12 + 1);
    expect(benefitCents).toBe(1056_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_62_1
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $2000, death at 90', () => {
    const r = makeRecipient(2000, 1964, 7, 15); // Aug 15, 1964
    const filingDate = r.birthdate.dateAtSsaAge(AGE_62_1);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 90,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(336); // 27y11m + 1

    // floor(2000 * 0.704166...) = floor(1408.333...) = 1408
    const benefitCents = expectedBenefitCents(2000, 62 * 12 + 1);
    expect(benefitCents).toBe(1408_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_62_1
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $2500, death at 75', () => {
    const r = makeRecipient(2500, 1965, 3, 15); // Apr 15, 1965
    const filingDate = r.birthdate.dateAtSsaAge(AGE_62_1);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 75,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(156); // 12y11m + 1

    // floor(2500 * 0.704166...) = floor(1760.416...) = 1760
    const benefitCents = expectedBenefitCents(2500, 62 * 12 + 1);
    expect(benefitCents).toBe(1760_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_62_1
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $3000, death at 95', () => {
    const r = makeRecipient(3000, 1966, 9, 15); // Oct 15, 1966
    const filingDate = r.birthdate.dateAtSsaAge(AGE_62_1);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 95,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(396); // 32y11m + 1

    // floor(3000 * 0.704166...) = floor(2112.5) = 2112
    const benefitCents = expectedBenefitCents(3000, 62 * 12 + 1);
    expect(benefitCents).toBe(2112_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_62_1
    );
    expect(actual).toBe(expectedNPV);
  });

  it('PIA $800, death at 70', () => {
    const r = makeRecipient(800, 1968, 4, 15); // May 15, 1968
    const filingDate = r.birthdate.dateAtSsaAge(AGE_62_1);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 70,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(96); // 7y11m + 1

    // floor(800 * 0.704166...) = floor(563.333...) = 563
    const benefitCents = expectedBenefitCents(800, 62 * 12 + 1);
    expect(benefitCents).toBe(563_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      AGE_62_1
    );
    expect(actual).toBe(expectedNPV);
  });
});

// ---------------------------------------------------------------------------
// 4. Various filing ages
// ---------------------------------------------------------------------------

describe('Various filing ages', () => {
  // All use December 15 birth so that adding age months to the SSA birth
  // month (November, due to SSA's day-before rule for Dec 15 birth) produces
  // filing months that avoid the delayed January bump issue.
  //
  // Born Dec 15, 1960 => SSA birthdate is Dec 14 => SSA birth month = Nov
  // (month index 11). Adding e.g. 63y0m => month 63*12 + 11*1 offset from
  // epoch. Filing date = SSA birth MonthDate + age duration.

  it('Filing at 63y0m, PIA $1000, death at 80', () => {
    // Born Dec 15, 1960. SSA birth = Nov 1960.
    // Filing at 63y0m: SSA age date = Nov 1960 + 63y0m = Nov 2023.
    // NRA - filing = 804 - 756 = 48 months early.
    // reduction = 36*5/900 + 12*5/1200 = 0.2 + 0.05 = 0.25
    // benefit = floor(1000 * 0.75) = 750
    const r = makeRecipient(1000, 1960, 11, 15);
    const strat = MonthDuration.initFromYearsMonths({ years: 63, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 80,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    // 80y0m - 63y0m = 17y0m = 204 months + 1 = 205
    expect(months).toBe(205);

    const benefitCents = expectedBenefitCents(1000, 63 * 12);
    expect(benefitCents).toBe(750_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      strat
    );
    expect(actual).toBe(expectedNPV);
  });

  it('Filing at 64y0m, PIA $1500, death at 85', () => {
    // Filing at 64y0m: NRA - filing = 804 - 768 = 36 months early.
    // reduction = 36*5/900 + 0 = 0.2
    // benefit = floor(1500 * 0.8) = 1200
    const r = makeRecipient(1500, 1960, 11, 15);
    const strat = MonthDuration.initFromYearsMonths({ years: 64, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 85,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(253); // 21y0m + 1

    const benefitCents = expectedBenefitCents(1500, 64 * 12);
    expect(benefitCents).toBe(1200_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      strat
    );
    expect(actual).toBe(expectedNPV);
  });

  it('Filing at 65y0m, PIA $2000, death at 90', () => {
    // Filing at 65y0m: NRA - filing = 804 - 780 = 24 months early.
    // reduction = 24*5/900 = 120/900 = 2/15 = 0.13333...
    // benefit = floor(2000 * (1 - 2/15)) = floor(2000 * 13/15) = floor(1733.33) = 1733
    const r = makeRecipient(2000, 1960, 11, 15);
    const strat = MonthDuration.initFromYearsMonths({ years: 65, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 90,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(301); // 25y0m + 1

    const benefitCents = expectedBenefitCents(2000, 65 * 12);
    expect(benefitCents).toBe(1733_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      strat
    );
    expect(actual).toBe(expectedNPV);
  });

  it('Filing at 66y0m, PIA $2500, death at 85', () => {
    // Filing at 66y0m: NRA - filing = 804 - 792 = 12 months early.
    // reduction = 12*5/900 = 60/900 = 1/15 = 0.06666...
    // benefit = floor(2500 * (1 - 1/15)) = floor(2500 * 14/15) = floor(2333.33) = 2333
    const r = makeRecipient(2500, 1960, 11, 15);
    const strat = MonthDuration.initFromYearsMonths({ years: 66, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 85,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(229); // 19y0m + 1

    const benefitCents = expectedBenefitCents(2500, 66 * 12);
    expect(benefitCents).toBe(2333_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      strat
    );
    expect(actual).toBe(expectedNPV);
  });

  it('Filing at 68y0m, PIA $1000, death at 85 (January filing)', () => {
    // Filing at 68y0m: filing age - NRA = 816 - 804 = 12 months after NRA.
    // increase = (0.08/12) * 12 = 0.08
    // benefit = floor(1000 * 1.08) = 1080
    //
    // Born Jan 15, 1960 => SSA birth = Jan 14, 1960 => SSA birth month = Jan
    // (month index 0). Filing at 68y0m => Jan 1960 + 816 months = Jan 2028.
    // January filing => no delayed bump.
    const r = makeRecipient(1000, 1960, 0, 15); // Jan 15, 1960
    const strat = MonthDuration.initFromYearsMonths({ years: 68, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    // Verify it's January
    expect(filingDate.monthIndex()).toBe(0);

    const deathAge = MonthDuration.initFromYearsMonths({
      years: 85,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(205); // 17y0m + 1

    const benefitCents = expectedBenefitCents(1000, 68 * 12);
    expect(benefitCents).toBe(1080_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      strat
    );
    expect(actual).toBe(expectedNPV);
  });

  it('Filing at 69y0m, PIA $2000, death at 90 (January filing)', () => {
    // Filing at 69y0m: filing age - NRA = 828 - 804 = 24 months after NRA.
    // increase = (0.08/12) * 24 = 0.16
    // benefit = floor(2000 * 1.16) = 2320
    //
    // Born Jan 15, 1960 => SSA birth = Jan 14, 1960 => SSA birth month = Jan
    // (month index 0). Filing at 69y0m => Jan 1960 + 828 months = Jan 2029.
    // January filing => no delayed bump.
    const r = makeRecipient(2000, 1960, 0, 15); // Jan 15, 1960
    const strat = MonthDuration.initFromYearsMonths({ years: 69, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    expect(filingDate.monthIndex()).toBe(0);

    const deathAge = MonthDuration.initFromYearsMonths({
      years: 90,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(253); // 21y0m + 1

    const benefitCents = expectedBenefitCents(2000, 69 * 12);
    expect(benefitCents).toBe(2320_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      strat
    );
    expect(actual).toBe(expectedNPV);
  });
});

// ---------------------------------------------------------------------------
// 5. Different birth years
// ---------------------------------------------------------------------------

describe('Different birth years', () => {
  // All use NRA filing (67y0m) with PIA $1000 and death at 80 to isolate
  // the effect of birth year on NRA lookup and filing date calculation.
  // All 1960+ births have NRA = 67y0m so benefit = PIA.
  const NRA = MonthDuration.initFromYearsMonths({ years: 67, months: 0 });
  const DEATH_AGE = MonthDuration.initFromYearsMonths({ years: 80, months: 0 });
  const PIA = 1000;

  it('Birth year 1960', () => {
    const r = makeRecipient(PIA, 1960, 5, 15);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const finalDate = r.birthdate.dateAtSsaAge(DEATH_AGE);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(157);

    const expectedNPV = PIA * 100 * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });

  it('Birth year 1965', () => {
    const r = makeRecipient(PIA, 1965, 8, 15);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const finalDate = r.birthdate.dateAtSsaAge(DEATH_AGE);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(157);

    const expectedNPV = PIA * 100 * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });

  it('Birth year 1970', () => {
    const r = makeRecipient(PIA, 1970, 0, 15);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const finalDate = r.birthdate.dateAtSsaAge(DEATH_AGE);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(157);

    const expectedNPV = PIA * 100 * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });

  it('Birth year 1975', () => {
    const r = makeRecipient(PIA, 1975, 11, 15);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const finalDate = r.birthdate.dateAtSsaAge(DEATH_AGE);

    const months = paymentMonths(filingDate, finalDate);
    expect(months).toBe(157);

    const expectedNPV = PIA * 100 * months;
    const actual = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE,
      NRA
    );
    expect(actual).toBe(expectedNPV);
  });
});

// ---------------------------------------------------------------------------
// 6. Non-zero discount rate hand calculations
// ---------------------------------------------------------------------------

describe('Non-zero discount rate hand calculations', () => {
  // NPV with discount rate r (monthly) and k months to first payment:
  //   Single payment:  NPV = payment_cents * (1+r)^(-k)
  //   N payments:      NPV = payment_cents * [(1-(1+r)^(-N))/r] * (1+r)^(-k)
  //
  // The code offsets payments by 1 month: the first payment for a benefit
  // month arrives 1 month later. effectiveStartPaymentDate =
  //   max(currentDate + 1, startDate + 1).
  // monthsToFirstPayment = effectiveStartPaymentDate - currentDate.
  //
  // To get k=1 (simplest case), set currentDate = filingDate.
  // Then firstPaymentDate = filingDate + 1, effectiveStart = filingDate + 1,
  // and monthsToFirstPayment = 1.

  const NRA = MonthDuration.initFromYearsMonths({ years: 67, months: 0 });

  it('0% discount rate, 1 month of benefit', () => {
    const r = makeRecipient(1000, 1960, 5, 15);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const finalDate = filingDate; // 1 month of benefit
    const currentDate = filingDate; // k = 1

    const actual = strategySumCentsSingle(r, finalDate, currentDate, 0, NRA);
    expect(actual).toBe(1000_00);
  });

  it('6% annual discount rate, 1 month of benefit', () => {
    const r = makeRecipient(1000, 1960, 5, 15);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const finalDate = filingDate;
    const currentDate = filingDate;
    const annualRate = 0.06;
    const monthlyRate = (1 + annualRate) ** (1 / 12) - 1;

    const actual = strategySumCentsSingle(
      r,
      finalDate,
      currentDate,
      annualRate,
      NRA
    );
    // The code uses an annuity PV formula: pvFactor * discountFactor.
    // For N=1 payment, pvFactor = (1-(1+r)^-1)/r = 1/(1+r).
    // With k=1 months to first payment, discountFactor = (1+r)^-1.
    // Total: payment * (1+r)^-2.
    const expected = 1000_00 * (1 + monthlyRate) ** -2;
    expect(actual).toBeCloseTo(expected, 2);
  });

  it('12% annual discount rate, 1 month of benefit', () => {
    const r = makeRecipient(1000, 1960, 5, 15);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const finalDate = filingDate;
    const currentDate = filingDate;
    const annualRate = 0.12;
    const monthlyRate = (1 + annualRate) ** (1 / 12) - 1;

    const actual = strategySumCentsSingle(
      r,
      finalDate,
      currentDate,
      annualRate,
      NRA
    );
    // Same logic: N=1, k=1, so NPV = payment * (1+r)^-2.
    const expected = 1000_00 * (1 + monthlyRate) ** -2;
    expect(actual).toBeCloseTo(expected, 2);
  });

  it('6% annual, 12 months of benefit', () => {
    const r = makeRecipient(2000, 1960, 5, 15);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 67,
      months: 11,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);
    const currentDate = filingDate;
    const annualRate = 0.06;
    const monthlyRate = (1 + annualRate) ** (1 / 12) - 1;
    const N = 12;
    const k = 1;

    const actual = strategySumCentsSingle(
      r,
      finalDate,
      currentDate,
      annualRate,
      NRA
    );
    // NPV = payment * [(1-(1+r)^-N)/r] * (1+r)^-k
    const pvFactor = (1 - (1 + monthlyRate) ** -N) / monthlyRate;
    const discountFactor = (1 + monthlyRate) ** -k;
    const expected = 2000_00 * pvFactor * discountFactor;
    expect(actual).toBeCloseTo(expected, 2);
  });

  it('12% annual, 24 months of benefit', () => {
    const r = makeRecipient(1500, 1960, 5, 15);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 68,
      months: 11,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);
    const currentDate = filingDate;
    const annualRate = 0.12;
    const monthlyRate = (1 + annualRate) ** (1 / 12) - 1;
    const N = 24;
    const k = 1;

    const actual = strategySumCentsSingle(
      r,
      finalDate,
      currentDate,
      annualRate,
      NRA
    );
    // Filing at NRA: no delayed bump (benefit is same before and after January).
    // So all 24 months are a single period at $1500.
    const pvFactor = (1 - (1 + monthlyRate) ** -N) / monthlyRate;
    const discountFactor = (1 + monthlyRate) ** -k;
    const expected = 1500_00 * pvFactor * discountFactor;
    expect(actual).toBeCloseTo(expected, 2);
  });

  it('6% annual, 120 months of benefit (10 years)', () => {
    const r = makeRecipient(1000, 1960, 5, 15);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 76,
      months: 11,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);
    const currentDate = filingDate;
    const annualRate = 0.06;
    const monthlyRate = (1 + annualRate) ** (1 / 12) - 1;
    const N = 120;
    const k = 1;

    const actual = strategySumCentsSingle(
      r,
      finalDate,
      currentDate,
      annualRate,
      NRA
    );
    const pvFactor = (1 - (1 + monthlyRate) ** -N) / monthlyRate;
    const discountFactor = (1 + monthlyRate) ** -k;
    const expected = 1000_00 * pvFactor * discountFactor;
    expect(actual).toBeCloseTo(expected, 2);
  });

  it('discount rate 0% multi-month matches undiscounted sum', () => {
    // Cross-check: at 0% discount with currentDate = filingDate, NPV should
    // equal payment * N.
    const r = makeRecipient(1000, 1960, 5, 15);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 72,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);
    const currentDate = filingDate;
    const N = paymentMonths(filingDate, finalDate);

    const actual = strategySumCentsSingle(r, finalDate, currentDate, 0, NRA);
    expect(actual).toBe(1000_00 * N);
  });

  it('higher discount rate produces lower NPV', () => {
    const r = makeRecipient(2000, 1960, 5, 15);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 85,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);
    const filingDate = r.birthdate.dateAtSsaAge(NRA);
    const currentDate = filingDate;

    const npv0 = strategySumCentsSingle(r, finalDate, currentDate, 0, NRA);
    const npv3 = strategySumCentsSingle(r, finalDate, currentDate, 0.03, NRA);
    const npv6 = strategySumCentsSingle(r, finalDate, currentDate, 0.06, NRA);
    const npv12 = strategySumCentsSingle(r, finalDate, currentDate, 0.12, NRA);

    expect(npv0).toBeGreaterThan(npv3);
    expect(npv3).toBeGreaterThan(npv6);
    expect(npv6).toBeGreaterThan(npv12);
  });
});

// ---------------------------------------------------------------------------
// 7. Cross-validate single vs couple API
// ---------------------------------------------------------------------------

describe('Cross-validate single vs couple API', () => {
  // Create a couple where recipient2 has $0 PIA and dies at age 62 (before
  // they could file). The earner's single-filer NPV should closely match
  // the couple NPV since the dependent contributes nothing.

  const NRA = MonthDuration.initFromYearsMonths({ years: 67, months: 0 });
  const AGE_70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
  const AGE_62_1 = MonthDuration.initFromYearsMonths({ years: 62, months: 1 });

  function makePairWithDeadSpouse(piaDollars: number) {
    const earner = makeRecipient(piaDollars, 1960, 5, 15);
    // Spouse has $0 PIA and same birthdate
    const spouse = makeRecipient(0, 1960, 5, 15);

    const earnerDeathAge = MonthDuration.initFromYearsMonths({
      years: 85,
      months: 0,
    });
    // Spouse dies before age 62 -- cannot file for benefits
    const spouseDeathAge = MonthDuration.initFromYearsMonths({
      years: 61,
      months: 0,
    });

    const earnerFinalDate = earner.birthdate.dateAtSsaAge(earnerDeathAge);
    const spouseFinalDate = spouse.birthdate.dateAtSsaAge(spouseDeathAge);

    return { earner, spouse, earnerFinalDate, spouseFinalDate };
  }

  it('NRA filing, PIA $1000, 0% discount', () => {
    const { earner, spouse, earnerFinalDate, spouseFinalDate } =
      makePairWithDeadSpouse(1000);

    const singleNPV = strategySumCentsSingle(
      earner,
      earnerFinalDate,
      CURRENT_DATE,
      0,
      NRA
    );
    const coupleNPV = strategySumCentsCouple(
      [earner, spouse],
      [earnerFinalDate, spouseFinalDate],
      CURRENT_DATE,
      0,
      [NRA, NRA]
    );
    expect(coupleNPV).toBe(singleNPV);
  });

  it('NRA filing, PIA $2000, 6% discount', () => {
    const { earner, spouse, earnerFinalDate, spouseFinalDate } =
      makePairWithDeadSpouse(2000);
    const currentDate = earner.birthdate.dateAtSsaAge(NRA);

    const singleNPV = strategySumCentsSingle(
      earner,
      earnerFinalDate,
      currentDate,
      0.06,
      NRA
    );
    const coupleNPV = strategySumCentsCouple(
      [earner, spouse],
      [earnerFinalDate, spouseFinalDate],
      currentDate,
      0.06,
      [NRA, NRA]
    );
    expect(coupleNPV).toBeCloseTo(singleNPV, 2);
  });

  it('Age 70 filing, PIA $1500, 0% discount', () => {
    const { earner, spouse, earnerFinalDate, spouseFinalDate } =
      makePairWithDeadSpouse(1500);

    const singleNPV = strategySumCentsSingle(
      earner,
      earnerFinalDate,
      CURRENT_DATE,
      0,
      AGE_70
    );
    const coupleNPV = strategySumCentsCouple(
      [earner, spouse],
      [earnerFinalDate, spouseFinalDate],
      CURRENT_DATE,
      0,
      [AGE_70, AGE_70]
    );
    expect(coupleNPV).toBe(singleNPV);
  });

  it('Age 62 filing, PIA $3000, 0% discount', () => {
    const { earner, spouse, earnerFinalDate, spouseFinalDate } =
      makePairWithDeadSpouse(3000);

    const singleNPV = strategySumCentsSingle(
      earner,
      earnerFinalDate,
      CURRENT_DATE,
      0,
      AGE_62_1
    );
    const coupleNPV = strategySumCentsCouple(
      [earner, spouse],
      [earnerFinalDate, spouseFinalDate],
      CURRENT_DATE,
      0,
      [AGE_62_1, AGE_62_1]
    );
    expect(coupleNPV).toBe(singleNPV);
  });

  it('Age 70 filing, PIA $2500, 3% discount', () => {
    const { earner, spouse, earnerFinalDate, spouseFinalDate } =
      makePairWithDeadSpouse(2500);
    const currentDate = earner.birthdate.dateAtSsaAge(AGE_70);

    const singleNPV = strategySumCentsSingle(
      earner,
      earnerFinalDate,
      currentDate,
      0.03,
      AGE_70
    );
    const coupleNPV = strategySumCentsCouple(
      [earner, spouse],
      [earnerFinalDate, spouseFinalDate],
      currentDate,
      0.03,
      [AGE_70, AGE_70]
    );
    expect(coupleNPV).toBeCloseTo(singleNPV, 2);
  });
});

// ---------------------------------------------------------------------------
// 8. Period-based accumulated total
// ---------------------------------------------------------------------------

describe('Period-based accumulated total', () => {
  // Use strategySumPeriodsSingle to get periods, then manually sum
  // period.amount.cents() * (endDate - startDate + 1) for each period.
  // Verify it matches strategySumCentsSingle at 0% discount (with
  // currentDate far in the past so all payments are included).

  function manualSumFromPeriods(
    recipient: Recipient,
    finalDate: MonthDate,
    strat: MonthDuration
  ): number {
    const periods = strategySumPeriodsSingle(recipient, finalDate, strat);
    let total = 0;
    for (const period of periods) {
      const months =
        period.endDate.subtractDate(period.startDate).asMonths() + 1;
      total += period.amount.cents() * months;
    }
    return total;
  }

  it('Filing at 62y1m', () => {
    const strat = MonthDuration.initFromYearsMonths({ years: 62, months: 1 });
    const r = makeRecipient(1500, 1960, 5, 15);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 85,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const fromPeriods = manualSumFromPeriods(r, finalDate, strat);
    const fromCents = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      0,
      strat
    );
    expect(fromPeriods).toBe(fromCents);
  });

  it('Filing at 65y0m', () => {
    const strat = MonthDuration.initFromYearsMonths({ years: 65, months: 0 });
    const r = makeRecipient(2000, 1960, 11, 15);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 85,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const fromPeriods = manualSumFromPeriods(r, finalDate, strat);
    const fromCents = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      0,
      strat
    );
    expect(fromPeriods).toBe(fromCents);
  });

  it('Filing at 67y0m (NRA)', () => {
    const strat = MonthDuration.initFromYearsMonths({ years: 67, months: 0 });
    const r = makeRecipient(1000, 1960, 5, 15);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 80,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const fromPeriods = manualSumFromPeriods(r, finalDate, strat);
    const fromCents = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      0,
      strat
    );
    expect(fromPeriods).toBe(fromCents);
  });

  it('Filing at 68y0m with delayed January bump', () => {
    // Born Jun 15, 1960. SSA birth month = May (index 5).
    // Filing at 68y0m => May 1960 + 816 months = May 2028.
    // Not January, not age 70, and after NRA => delayed January bump applies.
    // This creates two periods with different amounts.
    const strat = MonthDuration.initFromYearsMonths({ years: 68, months: 0 });
    const r = makeRecipient(1000, 1960, 5, 15);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 85,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const periods = strategySumPeriodsSingle(r, finalDate, strat);
    // Should have 2 periods due to the delayed January bump
    expect(periods.length).toBe(2);

    const fromPeriods = manualSumFromPeriods(r, finalDate, strat);
    const fromCents = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      0,
      strat
    );
    expect(fromPeriods).toBe(fromCents);
  });

  it('Filing at 70y0m', () => {
    const strat = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const r = makeRecipient(2500, 1960, 5, 15);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 90,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const fromPeriods = manualSumFromPeriods(r, finalDate, strat);
    const fromCents = strategySumCentsSingle(
      r,
      finalDate,
      CURRENT_DATE,
      0,
      strat
    );
    expect(fromPeriods).toBe(fromCents);
  });
});

// ---------------------------------------------------------------------------
// 9. Symmetry checks
// ---------------------------------------------------------------------------

describe('Symmetry checks', () => {
  // Two separately-constructed recipients with identical PIA and birthdate
  // should produce identical NPV at any filing age.

  const NRA = MonthDuration.initFromYearsMonths({ years: 67, months: 0 });
  const AGE_62_1 = MonthDuration.initFromYearsMonths({ years: 62, months: 1 });
  const AGE_65 = MonthDuration.initFromYearsMonths({ years: 65, months: 0 });
  const AGE_70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });

  function assertSymmetry(
    piaDollars: number,
    strat: MonthDuration,
    deathYears: number
  ) {
    const r1 = makeRecipient(piaDollars, 1962, 3, 15);
    const r2 = makeRecipient(piaDollars, 1962, 3, 15);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: deathYears,
      months: 0,
    });
    const finalDate1 = r1.birthdate.dateAtSsaAge(deathAge);
    const finalDate2 = r2.birthdate.dateAtSsaAge(deathAge);

    const npv1 = strategySumCentsSingle(r1, finalDate1, CURRENT_DATE, 0, strat);
    const npv2 = strategySumCentsSingle(r2, finalDate2, CURRENT_DATE, 0, strat);
    expect(npv1).toBe(npv2);
  }

  it('Identical recipients at NRA', () => {
    assertSymmetry(1000, NRA, 85);
  });

  it('Identical recipients at 62y1m', () => {
    assertSymmetry(2000, AGE_62_1, 80);
  });

  it('Identical recipients at 65y0m', () => {
    assertSymmetry(1500, AGE_65, 90);
  });

  it('Identical recipients at 70y0m', () => {
    assertSymmetry(2500, AGE_70, 95);
  });
});

// ---------------------------------------------------------------------------
// 10. Mid-month filing ages
// ---------------------------------------------------------------------------

describe('Mid-month filing ages', () => {
  // Test ages like 63y7m, 65y3m, 66y11m. Compute the expected benefit from
  // the SSA formula, verify NPV = benefit_cents * months at 0% discount.
  //
  // Use Dec 15 birth to avoid delayed January bump for pre-NRA filing.

  it('Filing at 63y7m, PIA $1200, death at 82', () => {
    // 63y7m = 763 months. NRA = 804. Months before = 41.
    // reduction = min(36,41)*5/900 + max(0,41-36)*5/1200
    //           = 36*5/900 + 5*5/1200 = 0.2 + 25/1200 = 0.2 + 0.020833...
    //           = 0.220833...
    // benefit = floor(1200 * (1 - 0.220833...)) = floor(1200 * 0.779166...)
    //         = floor(935.0) = 935
    const r = makeRecipient(1200, 1960, 11, 15);
    const strat = MonthDuration.initFromYearsMonths({ years: 63, months: 7 });
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 82,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    // 82y0m - 63y7m = 18y5m = 221 months + 1 = 222
    expect(months).toBe(222);

    const benefitCents = expectedBenefitCents(1200, 63 * 12 + 7);
    expect(benefitCents).toBe(935_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(r, finalDate, CURRENT_DATE, 0, strat);
    expect(actual).toBe(expectedNPV);
  });

  it('Filing at 65y3m, PIA $1800, death at 83', () => {
    // 65y3m = 783 months. NRA = 804. Months before = 21.
    // reduction = min(36,21)*5/900 = 21*5/900 = 105/900 = 7/60 = 0.116666...
    // benefit = floor(1800 * (1 - 7/60)) = floor(1800 * 53/60) = floor(1590) = 1590
    const r = makeRecipient(1800, 1960, 11, 15);
    const strat = MonthDuration.initFromYearsMonths({ years: 65, months: 3 });
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 83,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    // 83y0m - 65y3m = 17y9m = 213 months + 1 = 214
    expect(months).toBe(214);

    const benefitCents = expectedBenefitCents(1800, 65 * 12 + 3);
    expect(benefitCents).toBe(1590_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(r, finalDate, CURRENT_DATE, 0, strat);
    expect(actual).toBe(expectedNPV);
  });

  it('Filing at 66y11m, PIA $2200, death at 88', () => {
    // 66y11m = 803 months. NRA = 804. Months before = 1.
    // reduction = 1*5/900 = 5/900 = 1/180 = 0.005555...
    // benefit = floor(2200 * (1 - 1/180)) = floor(2200 * 179/180)
    //         = floor(2187.777...) = 2187
    const r = makeRecipient(2200, 1960, 11, 15);
    const strat = MonthDuration.initFromYearsMonths({ years: 66, months: 11 });
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 88,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    // 88y0m - 66y11m = 21y1m = 253 months + 1 = 254
    expect(months).toBe(254);

    const benefitCents = expectedBenefitCents(2200, 66 * 12 + 11);
    expect(benefitCents).toBe(2187_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(r, finalDate, CURRENT_DATE, 0, strat);
    expect(actual).toBe(expectedNPV);
  });

  it('Filing at 64y6m, PIA $900, death at 78', () => {
    // 64y6m = 774 months. NRA = 804. Months before = 30.
    // reduction = min(36,30)*5/900 = 30*5/900 = 150/900 = 1/6 = 0.166666...
    // benefit = floor(900 * (1 - 1/6)) = floor(900 * 5/6) = floor(750) = 750
    const r = makeRecipient(900, 1960, 11, 15);
    const strat = MonthDuration.initFromYearsMonths({ years: 64, months: 6 });
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    const deathAge = MonthDuration.initFromYearsMonths({
      years: 78,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(deathAge);

    const months = paymentMonths(filingDate, finalDate);
    // 78y0m - 64y6m = 13y6m = 162 months + 1 = 163
    expect(months).toBe(163);

    const benefitCents = expectedBenefitCents(900, 64 * 12 + 6);
    expect(benefitCents).toBe(750_00);

    const expectedNPV = benefitCents * months;
    const actual = strategySumCentsSingle(r, finalDate, CURRENT_DATE, 0, strat);
    expect(actual).toBe(expectedNPV);
  });
});
