import { describe, expect, it } from 'vitest';
import {
  benefitAtAge,
  benefitOnDate,
  survivorBenefit,
} from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { type MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

/**
 * Creates a Recipient in PIA-only mode with the given PIA and birthdate.
 *
 * @param piaDollars PIA in whole dollars
 * @param birthYear Lay birth year
 * @param birthMonth Lay birth month (0-indexed: 0=Jan, 11=Dec)
 * @param birthDay Lay birth day (1-indexed)
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

function age(years: number, months: number): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

/**
 * Computes the base survivor benefit by hand, matching the logic in
 * survivorBenefit for the RIB-LIM case (deceased filed before death).
 *
 * base = max(floor(PIA * 0.825), benefitOnDate(deceased, filingDate, age71date))
 * The result is then floored to cents via Math.floor on the max.
 */
function handRibLimBase(deceased: Recipient, filingDate: MonthDate): number {
  const piaCents = deceased.pia().primaryInsuranceAmount().cents();
  // 82.5% of PIA: Money.from(pia).times(0.825) = Math.round(piaCents * 0.825)
  const ribLimCents = Math.round(piaCents * 0.825);

  const age71date = deceased.birthdate.dateAtSsaAge(age(71, 0));
  const actualBenefit = benefitOnDate(deceased, filingDate, age71date);
  const actualCents = actualBenefit.cents();

  // Money.max picks the larger, then floor the result to cents
  return Math.floor(Math.max(ribLimCents, actualCents));
}

/**
 * Computes the survivor age reduction by hand.
 *
 * If survivorAge >= survivorNRA: factor = 1.0
 * Otherwise:
 *   monthsBetween60AndNRA = survivorNRA.asMonths() - 720
 *   monthsBetweenAge60AndSurvivorAge = survivorAge.asMonths() - 720
 *   ratio = max(0, monthsBetweenAge60AndSurvivorAge / monthsBetween60AndNRA)
 *   factor = 0.715 + 0.285 * ratio
 *
 * result = floor(baseCents * factor / 100) * 100  (floor to dollar)
 */
function handSurvivorReduction(
  baseCents: number,
  survivorAgeMonths: number,
  survivorNraMonths: number
): number {
  if (survivorAgeMonths >= survivorNraMonths) {
    // Full benefit, floored to dollar
    return Math.floor(baseCents / 100) * 100;
  }
  const monthsBetween60AndNRA = survivorNraMonths - 720; // 60*12 = 720
  const monthsBetweenAge60AndSurvivorAge = survivorAgeMonths - 720;
  const ratio = Math.max(
    0,
    monthsBetweenAge60AndSurvivorAge / monthsBetween60AndNRA
  );
  const factor = 0.715 + 0.285 * ratio;
  // Money.times does Math.round(cents * factor), then floorToDollar
  const afterMultiply = Math.round(baseCents * factor);
  return Math.floor(afterMultiply / 100) * 100;
}

// ---------------------------------------------------------------------------
// All test recipients use birth years 1962+ so survivor NRA = 67y0m (804 months)
// and regular NRA = 67y0m with 8%/year delayed credits.
//
// Birth day of 2 means SSA birth date is the 1st of the same month, keeping
// month arithmetic simple.
// ---------------------------------------------------------------------------

// Survivor NRA for 1962+ births: 67y0m = 804 months total
const SURVIVOR_NRA_MONTHS = 804;

// ---------------------------------------------------------------------------
// 1. Deceased never filed - died before NRA
//    Base = deceased PIA (no delayed credits, no reduction).
// ---------------------------------------------------------------------------

describe('Deceased never filed - died before NRA', () => {
  // When deceasedFilingDate >= deceasedDeathDate, the code treats deceased as
  // not having filed. If death is before NRA, base = PIA.

  it('PIA $1000: survivor at NRA gets full $1000', () => {
    const deceased = makeRecipient(1000, 1962, 0, 2); // Jan 2, 1962
    const survivor = makeRecipient(500, 1964, 0, 2); // Jan 2, 1964

    // Deceased dies at age 65 (before NRA of 67)
    const deathDate = deceased.birthdate.dateAtSsaAge(age(65, 0));
    // Filing date >= death date signals "never filed"
    const deceasedFilingDate = deathDate;
    // Survivor files at survivor NRA (67y0m)
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );
    // Base = PIA = $1000, survivor at NRA => full base floored to dollar
    expect(result.value()).toBe(1000);
  });

  it('PIA $2000: survivor at NRA gets full $2000', () => {
    const deceased = makeRecipient(2000, 1962, 5, 2); // Jun 2, 1962
    const survivor = makeRecipient(800, 1963, 3, 2); // Apr 2, 1963

    const deathDate = deceased.birthdate.dateAtSsaAge(age(64, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );
    expect(result.value()).toBe(2000);
  });

  it('PIA $500: survivor at NRA gets full $500', () => {
    const deceased = makeRecipient(500, 1965, 8, 2); // Sep 2, 1965
    const survivor = makeRecipient(200, 1966, 2, 2); // Mar 2, 1966

    const deathDate = deceased.birthdate.dateAtSsaAge(age(63, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );
    expect(result.value()).toBe(500);
  });

  it('PIA $3000: survivor at NRA gets full $3000', () => {
    const deceased = makeRecipient(3000, 1970, 11, 2); // Dec 2, 1970
    const survivor = makeRecipient(1500, 1972, 6, 2); // Jul 2, 1972

    const deathDate = deceased.birthdate.dateAtSsaAge(age(66, 6));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );
    expect(result.value()).toBe(3000);
  });
});

// ---------------------------------------------------------------------------
// 2. Deceased never filed - died after NRA
//    Base = benefitOnDate(deceased, deathDate, age71date)
//    The deceased accrues delayed credits as if they filed at death.
// ---------------------------------------------------------------------------

describe('Deceased never filed - died after NRA', () => {
  it('died at 68 (12 months delayed credits): gets 108% of PIA', () => {
    // NRA = 67y0m, died at 68y0m => 12 months of delayed credits at 8%/yr
    // multiplier = (0.08/12)*12 = 0.08
    // benefit = floor(round(PIA_cents * 1.08) / 100) * 100
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1964, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(68, 0));
    const deceasedFilingDate = deathDate; // never filed
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // Hand calc: PIA = $2000 = 200000 cents
    // benefitAtAge at 68y0m: multiplier = (0.08/12)*12 = 0.08
    // round(200000 * 1.08) = 216000, floor(216000/100)*100 = 216000
    // = $2160
    const expectedBenefit = benefitOnDate(
      deceased,
      deathDate,
      deceased.birthdate.dateAtSsaAge(age(71, 0))
    );
    expect(result.value()).toBe(expectedBenefit.value());
    expect(result.value()).toBe(2160);
  });

  it('died at 69 (24 months delayed credits): gets 116% of PIA', () => {
    const deceased = makeRecipient(1500, 1962, 0, 2);
    // Survivor must be old enough that NRA filing is after deceased death
    // Deceased dies ~Jan 2031, survivor born 1962 files at 67y1m ~Feb 2029
    // Need survivor born earlier. Use 1956: SSA birth Dec 1955, +67y1m = Jan 2023.
    // That's too early. Instead, make survivor file later (e.g., age 70).
    const survivor = makeRecipient(600, 1962, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(69, 0));
    const deceasedFilingDate = deathDate;
    // File at 69y1m to ensure it's after death date
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(69, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // multiplier = (0.08/12)*24 = 0.16, benefit = 1500 * 1.16 = $1740
    // round(150000 * 1.16) = 174000, floor(174000/100)*100 = 174000
    // Survivor at NRA or after => full base
    expect(result.value()).toBe(1740);
  });

  it('died at 70 (36 months = max delayed credits): gets 124% of PIA', () => {
    const deceased = makeRecipient(2000, 1962, 0, 2);
    // Deceased dies at 70 ~Jan 2032. Survivor must file after that.
    // Survivor born same year, file at 70y1m.
    const survivor = makeRecipient(800, 1962, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(70, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(70, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // multiplier = (0.08/12)*36 = 0.24, benefit = 2000 * 1.24 = $2480
    // Survivor at 70y1m >= NRA (67y0m) => full base
    expect(result.value()).toBe(2480);
  });

  it('died at 72: delayed credits cap at age 70, survivor gets age-70 benefit', () => {
    // When someone dies after 70 without filing, delayed credits cap at
    // age 70. The survivor benefit should be based on the age-70 benefit,
    // not $0.
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1962, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(72, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(72, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // Delayed credits: 36 months * (8%/12) = 24% increase.
    // $2000 * 1.24 = $2480
    expect(result.value()).toBe(2480);
  });
});

// ---------------------------------------------------------------------------
// 3. Deceased filed early - RIB-LIM
//    base = max(82.5% of PIA, actual benefit at death)
//    actual benefit = benefitOnDate(deceased, filingDate, age71date)
// ---------------------------------------------------------------------------

describe('Deceased filed early - RIB-LIM', () => {
  it('filed at 62y0m (maximum early reduction): RIB-LIM wins over actual', () => {
    // Person born Jan 2, 1962. NRA = 67y0m. Files at 62y0m.
    // But Birthdate.earliestFilingMonth for day=2 is 62y0m (since day <= 2).
    // Early months = 67*12 - 62*12 = 60 months before NRA
    // Reduction: first 36 months at 5/900 each, next 24 at 5/1200 each
    //   = 36*5/900 + 24*5/1200 = 0.2 + 0.1 = 0.3
    // multiplier = -0.3, so actual = PIA * 0.7
    // 82.5% of PIA = PIA * 0.825
    // Since 0.825 > 0.70, base = 82.5% of PIA
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1964, 0, 2);

    const filingDate = deceased.birthdate.dateAtSsaAge(age(62, 0));
    // Death after filing but within a reasonable time
    const deathDate = deceased.birthdate.dateAtSsaAge(age(66, 0));
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // PIA = $2000 = 200000 cents
    // 82.5%: round(200000 * 0.825) = 165000 cents
    // Actual at 62: benefitAtAge at 62y0m
    //   multiplier = -0.3, round(200000*0.7) = 140000
    //   floor(140000/100)*100 = 140000 = $1400
    // max(165000, 140000) = 165000, floor(165000) = 165000
    // base = 165000 cents. Survivor at NRA => floor(165000/100)*100 = $1650
    expect(result.value()).toBe(1650);
  });

  it('filed at 62y0m with $1000 PIA: RIB-LIM check', () => {
    const deceased = makeRecipient(1000, 1962, 0, 2);
    const survivor = makeRecipient(400, 1964, 0, 2);

    const filingDate = deceased.birthdate.dateAtSsaAge(age(62, 0));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(66, 0));
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // 82.5%: round(100000 * 0.825) = round(82500) = 82500
    // Actual at 62: round(100000 * 0.7) = 70000, floor = 70000
    // max(82500, 70000) = 82500, floor(82500) = 82500
    // Survivor at NRA: floor(82500/100)*100 = $825
    expect(result.value()).toBe(825);
  });

  it('filed at 65y0m (24 months early): actual may exceed 82.5%', () => {
    // 24 months before NRA = 67-65 = 24 months
    // All 24 months in the 5/900 range (< 36 months)
    // multiplier = -(24 * 5/900) = -0.13333...
    // actual = PIA * (1 - 0.13333) = PIA * 0.86667
    // 82.5% = PIA * 0.825
    // 0.86667 > 0.825 so actual wins
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1964, 0, 2);

    const filingDate = deceased.birthdate.dateAtSsaAge(age(65, 0));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(66, 0));
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // PIA = $2000 = 200000 cents
    // multiplier = -(24*5/900) = -0.133333...
    // round(200000 * (1 - 0.133333...)) = round(200000 * 0.866667) = round(173333.4) = 173333
    // floor(173333/100)*100 = 173300 (actual benefit)
    // 82.5%: round(200000 * 0.825) = 165000
    // max(173300, 165000) = 173300
    // floor(173300) = 173300
    // Survivor at NRA: floor(173300/100)*100 = $1733
    const actualBenefit = benefitAtAge(deceased, age(65, 0));
    const ribLimCents = Math.round(200000 * 0.825);
    const baseCents = Math.floor(Math.max(ribLimCents, actualBenefit.cents()));
    const expected = Math.floor(baseCents / 100) * 100;
    expect(result.value()).toBe(expected / 100);
  });

  it('filed at NRA (67y0m): actual = PIA, which exceeds 82.5%', () => {
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1964, 0, 2);

    const filingDate = deceased.birthdate.dateAtSsaAge(age(67, 0));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(68, 0));
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // At NRA: actual = PIA = $2000 = 200000 cents
    // 82.5%: round(200000 * 0.825) = 165000
    // max(200000, 165000) = 200000
    // Survivor at NRA: $2000
    expect(result.value()).toBe(2000);
  });

  it('filed at 70y0m (max delayed credits): actual = 124% of PIA', () => {
    const deceased = makeRecipient(2000, 1962, 0, 2);
    // Deceased dies at 75 ~Jan 2037. Survivor must file after.
    const survivor = makeRecipient(800, 1962, 0, 2);

    // Filing at 70 means they filed before death (death comes later)
    const filingDate = deceased.birthdate.dateAtSsaAge(age(70, 0));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(75, 0));
    // Survivor files at 75y1m (after death)
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(75, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // At 70: multiplier = (0.08/12)*36 = 0.24
    // actual = round(200000 * 1.24) = 248000, floor = 248000
    // 82.5%: 165000
    // max(248000, 165000) = 248000
    // Survivor at 75y1m >= NRA => full base: $2480
    expect(result.value()).toBe(2480);
  });

  it('filed at 64y0m (36 months early): boundary of reduction formula', () => {
    // Exactly 36 months before NRA (67-64 = 36 months)
    // All in the 5/900 range
    // multiplier = -(36 * 5/900) = -0.2
    // actual = PIA * 0.8
    // 82.5% vs 80%: RIB-LIM (82.5%) wins
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1964, 0, 2);

    const filingDate = deceased.birthdate.dateAtSsaAge(age(64, 0));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(66, 0));
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // actual: round(200000 * 0.8) = 160000, floor = 160000
    // 82.5%: round(200000 * 0.825) = 165000
    // max(165000, 160000) = 165000, floor = 165000
    // $1650
    expect(result.value()).toBe(1650);
  });
});

// ---------------------------------------------------------------------------
// 4. Survivor at full retirement age (survivor NRA)
//    Gets full base benefit, no age reduction.
// ---------------------------------------------------------------------------

describe('Survivor at full retirement age', () => {
  it('survivor at exactly survivor NRA: gets full base (deceased died before NRA)', () => {
    const deceased = makeRecipient(2500, 1962, 0, 2);
    const survivor = makeRecipient(1000, 1964, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(65, 0));
    const deceasedFilingDate = deathDate; // never filed

    // Survivor files at 67y1m (just after survivor NRA of 67y0m)
    // We need survivorFilingDate > deathDate
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );
    expect(result.value()).toBe(2500);
  });

  it('survivor well past NRA (age 69): still gets full base', () => {
    const deceased = makeRecipient(1800, 1962, 0, 2);
    const survivor = makeRecipient(700, 1964, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(64, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(69, 0));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );
    expect(result.value()).toBe(1800);
  });

  it('survivor at NRA with deceased who had delayed credits', () => {
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1964, 0, 2);

    // Deceased died at 69 (never filed), gets delayed credits
    const deathDate = deceased.birthdate.dateAtSsaAge(age(69, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // 24 months delayed: multiplier = 0.16, benefit = 2000 * 1.16 = $2320
    expect(result.value()).toBe(2320);
  });

  it('survivor at NRA with RIB-LIM base', () => {
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1964, 0, 2);

    // Deceased filed at 62, died at 65
    const filingDate = deceased.birthdate.dateAtSsaAge(age(62, 0));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(65, 0));
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // RIB-LIM: max(82.5% of PIA, actual at 62)
    // 82.5%: round(200000*0.825) = 165000
    // Actual at 62: 0.7 reduction => round(200000*0.7)=140000, floor=140000
    // max(165000, 140000) = 165000
    // Survivor at NRA: floor(165000/100)*100 = $1650
    expect(result.value()).toBe(1650);
  });
});

// ---------------------------------------------------------------------------
// 5. Survivor age reduction
//    When survivor files before survivor NRA (67y0m for 1962+ births).
//    Min = 71.5% of base at age 60. Linear interpolation to 100% at NRA.
// ---------------------------------------------------------------------------

describe('Survivor age reduction', () => {
  it('survivor files at age 60y1m (minimum): gets 71.5% + small increment of base', () => {
    // survivor NRA = 67y0m = 804 months
    // monthsBetween60AndNRA = 804 - 720 = 84
    // At age 60y1m = 721 months:
    //   monthsBetweenAge60AndSurvivorAge = 721 - 720 = 1
    //   ratio = 1/84
    //   factor = 0.715 + 0.285 * (1/84)
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1970, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(65, 0));
    const deceasedFilingDate = deathDate; // never filed
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(60, 1));

    // Ensure survivor filing is after death
    expect(survivorFilingDate.greaterThan(deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // base = PIA = $2000 = 200000 cents
    // ratio = 1/84
    // factor = 0.715 + 0.285/84 = 0.715 + 0.00339285...
    // round(200000 * 0.71839285...) = round(143678.57) = 143679
    // floor(143679/100)*100 = 143600 = $1436
    const expected = handSurvivorReduction(200000, 721, SURVIVOR_NRA_MONTHS);
    expect(result.value()).toBe(expected / 100);
  });

  it('survivor files at age 63y0m (36 months after 60)', () => {
    // At age 63y0m = 756 months:
    //   monthsBetweenAge60AndSurvivorAge = 756 - 720 = 36
    //   ratio = 36/84 = 3/7
    //   factor = 0.715 + 0.285 * (3/7) = 0.715 + 0.12214... = 0.83714...
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1968, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(65, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(63, 0));

    expect(survivorFilingDate.greaterThan(deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    const expected = handSurvivorReduction(200000, 756, SURVIVOR_NRA_MONTHS);
    expect(result.value()).toBe(expected / 100);
  });

  it('survivor files at age 65y0m (60 months after 60)', () => {
    // At age 65y0m = 780 months:
    //   ratio = 60/84 = 5/7
    //   factor = 0.715 + 0.285 * (5/7) = 0.715 + 0.20357... = 0.91857...
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1966, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(63, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(65, 0));

    expect(survivorFilingDate.greaterThan(deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    const expected = handSurvivorReduction(200000, 780, SURVIVOR_NRA_MONTHS);
    expect(result.value()).toBe(expected / 100);
  });

  it('survivor files at NRA - 1 month (age 66y11m): ratio just under 1.0', () => {
    // At age 66y11m = 803 months:
    //   ratio = 83/84
    //   factor = 0.715 + 0.285 * (83/84) = 0.715 + 0.28160... = 0.99660...
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1964, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(64, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(66, 11));

    expect(survivorFilingDate.greaterThan(deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    const expected = handSurvivorReduction(200000, 803, SURVIVOR_NRA_MONTHS);
    expect(result.value()).toBe(expected / 100);
  });

  it('survivor at age 62 with $1500 PIA', () => {
    // At age 62y0m = 744 months:
    //   ratio = 24/84 = 2/7
    //   factor = 0.715 + 0.285 * (2/7) = 0.715 + 0.08142... = 0.79642...
    const deceased = makeRecipient(1500, 1962, 0, 2);
    const survivor = makeRecipient(600, 1967, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(64, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(62, 0));

    expect(survivorFilingDate.greaterThan(deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    const expected = handSurvivorReduction(150000, 744, SURVIVOR_NRA_MONTHS);
    expect(result.value()).toBe(expected / 100);
  });

  it('survivor at age 64y6m (54 months after 60)', () => {
    // At age 64y6m = 774 months:
    //   ratio = 54/84 = 9/14
    //   factor = 0.715 + 0.285 * (9/14)
    const deceased = makeRecipient(2400, 1962, 0, 2);
    const survivor = makeRecipient(900, 1967, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(64, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(64, 6));

    expect(survivorFilingDate.greaterThan(deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    const expected = handSurvivorReduction(240000, 774, SURVIVOR_NRA_MONTHS);
    expect(result.value()).toBe(expected / 100);
  });
});

// ---------------------------------------------------------------------------
// 6. Error cases
// ---------------------------------------------------------------------------

describe('Error cases', () => {
  it('throws when survivorFilingDate equals deceasedDeathDate', () => {
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1964, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(65, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = deathDate; // same as death

    expect(() =>
      survivorBenefit(
        survivor,
        deceased,
        deceasedFilingDate,
        deathDate,
        survivorFilingDate
      )
    ).toThrow('Cannot file for survivor benefits before spouse died');
  });

  it('throws when survivorFilingDate is before deceasedDeathDate', () => {
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1964, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(65, 0));
    const deceasedFilingDate = deathDate;
    // One month before death
    const survivorFilingDate = deathDate.subtractDuration(new MonthDuration(1));

    expect(() =>
      survivorBenefit(
        survivor,
        deceased,
        deceasedFilingDate,
        deathDate,
        survivorFilingDate
      )
    ).toThrow('Cannot file for survivor benefits before spouse died');
  });
});

// ---------------------------------------------------------------------------
// 7. Survivor benefit with non-round PIAs (floor behavior)
// ---------------------------------------------------------------------------

describe('Survivor benefit with non-round PIAs', () => {
  it('PIA $1234: verify floor to dollar on base', () => {
    const deceased = makeRecipient(1234, 1962, 0, 2);
    const survivor = makeRecipient(500, 1964, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(65, 0));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // Base = PIA = $1234. Floor to dollar = $1234 (already whole)
    expect(result.value()).toBe(1234);
  });

  it('PIA $1777 with RIB-LIM: non-round 82.5% check', () => {
    const deceased = makeRecipient(1777, 1962, 0, 2);
    const survivor = makeRecipient(700, 1964, 0, 2);

    const filingDate = deceased.birthdate.dateAtSsaAge(age(62, 0));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(66, 0));
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(67, 1));

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // PIA = $1777 = 177700 cents
    // 82.5%: round(177700 * 0.825) = round(146602.5) = 146603
    // Actual at 62: round(177700 * 0.7) = round(124390) = 124390
    //   floor(124390/100)*100 = 124300
    // max(146603, 124300) = 146603
    // floor(146603) = 146603 (already cents)
    // Survivor at NRA: floor(146603/100)*100 = 146600 = $1466
    const piaCents = 177700;
    const ribLim = Math.round(piaCents * 0.825);
    const actualBenefit = benefitAtAge(deceased, age(62, 0)).cents();
    const baseCents = Math.floor(Math.max(ribLim, actualBenefit));
    const expected = Math.floor(baseCents / 100) * 100;
    expect(result.value()).toBe(expected / 100);
  });

  it('PIA $2573 with delayed credits and survivor age reduction', () => {
    // Non-round PIA with delayed credits, and survivor takes early
    const deceased = makeRecipient(2573, 1962, 0, 2);
    // Deceased dies at 69 ~Jan 2031. Need survivor at 63 filing after Jan 2031.
    // Survivor born 1968: SSA birth Dec 1967, +63y0m = Dec 2030 = too early.
    // Survivor born 1968, file at 63y2m: Dec 1967 + 63y2m = Feb 2031 => after Jan 2031.
    const survivor = makeRecipient(1000, 1968, 0, 2);

    // Deceased died at 69 (never filed) => delayed credits
    const deathDate = deceased.birthdate.dateAtSsaAge(age(69, 0));
    const deceasedFilingDate = deathDate;
    // Survivor files at 63y2m to be after death date
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(63, 2));

    expect(survivorFilingDate.greaterThan(deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // Base: benefitOnDate at death (69y0m filing)
    // multiplier = (0.08/12)*24 = 0.16
    // PIA = 257300 cents, floor to dollar = 257300
    // round(257300 * 1.16) = round(298468) = 298468
    // floor(298468/100)*100 = 298400
    const baseBenefit = benefitOnDate(
      deceased,
      deathDate,
      deceased.birthdate.dateAtSsaAge(age(71, 0))
    );
    const baseCents = baseBenefit.cents();

    // Survivor at 63y2m = 758 months, NRA = 804
    const expected = handSurvivorReduction(baseCents, 758, SURVIVOR_NRA_MONTHS);
    expect(result.value()).toBe(expected / 100);
  });

  it('PIA $987 with early filing and survivor age reduction', () => {
    const deceased = makeRecipient(987, 1962, 0, 2);
    const survivor = makeRecipient(400, 1967, 0, 2);

    // Deceased filed at 64 (36 months early), died at 66
    const filingDate = deceased.birthdate.dateAtSsaAge(age(64, 0));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(66, 0));
    // Survivor files at 62
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(62, 0));

    expect(survivorFilingDate.greaterThan(deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // PIA = 98700 cents
    // RIB-LIM: round(98700 * 0.825) = round(81427.5) = 81428
    // Actual at 64: multiplier = -(36*5/900) = -0.2
    //   round(98700 * 0.8) = round(78960) = 78960
    //   floor(78960/100)*100 = 78900
    // max(81428, 78900) = 81428
    // floor(81428) = 81428
    const baseCents = handRibLimBase(deceased, filingDate);

    // Survivor at 62y0m = 744 months
    const expected = handSurvivorReduction(baseCents, 744, SURVIVOR_NRA_MONTHS);
    expect(result.value()).toBe(expected / 100);
  });
});

// ---------------------------------------------------------------------------
// 8. Additional cross-checks: combine base calculation with age reduction
// ---------------------------------------------------------------------------

describe('Combined scenarios', () => {
  it('deceased filed at 63 (48 months early), survivor at 61', () => {
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1968, 0, 2);

    const filingDate = deceased.birthdate.dateAtSsaAge(age(63, 0));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(65, 0));
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(61, 0));

    expect(survivorFilingDate.greaterThan(deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // Actual at 63: 48 months early
    // first 36 at 5/900 = 0.2, next 12 at 5/1200 = 0.05
    // multiplier = -(0.2 + 0.05) = -0.25
    // round(200000 * 0.75) = 150000, floor = 150000
    // 82.5%: round(200000 * 0.825) = 165000
    // max(165000, 150000) = 165000, floor = 165000
    const baseCents = handRibLimBase(deceased, filingDate);
    expect(baseCents).toBe(165000);

    // Survivor at 61y0m = 732 months
    // ratio = 12/84 = 1/7
    // factor = 0.715 + 0.285/7 = 0.715 + 0.04071... = 0.75571...
    const expected = handSurvivorReduction(baseCents, 732, SURVIVOR_NRA_MONTHS);
    expect(result.value()).toBe(expected / 100);
  });

  it('deceased died at NRA exactly (never filed), survivor at 60y1m', () => {
    // Death at exactly NRA: the code checks deceasedDeathDate.lessThan(NRA)
    // At NRA, lessThan is false, so it takes the "died at/after NRA" branch
    // and calls benefitOnDate(deceased, deathDate, age71date)
    const deceased = makeRecipient(2000, 1962, 0, 2);
    const survivor = makeRecipient(800, 1970, 0, 2);

    const deathDate = deceased.normalRetirementDate();
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(60, 1));

    expect(survivorFilingDate.greaterThan(deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // At NRA exactly: benefitOnDate(deceased, NRA, age71) = benefitAtAge at NRA
    // multiplier = 0, benefit = PIA = $2000
    const baseCents = 200000;

    // Survivor at 60y1m = 721 months
    const expected = handSurvivorReduction(baseCents, 721, SURVIVOR_NRA_MONTHS);
    expect(result.value()).toBe(expected / 100);
  });

  it('deceased filed at 68 (with delayed credits), survivor at 64', () => {
    const deceased = makeRecipient(1500, 1962, 0, 2);
    // Deceased dies at 72 ~Jan 2034. Survivor born 1970: SSA Dec 1969,
    // +64y2m = Feb 2034 (after Jan 2034).
    const survivor = makeRecipient(600, 1970, 0, 2);

    // Deceased filed at 68 (12 months delayed), died at 72
    const filingDate = deceased.birthdate.dateAtSsaAge(age(68, 0));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(72, 0));
    // Survivor files at 64y2m to be after death date
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(64, 2));

    expect(survivorFilingDate.greaterThan(deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // Deceased filed at 68: actual = benefitOnDate(deceased, 68y0m, age71)
    // filingDate.year() < age71date.year() so returns benefitAtAge(68y0m)
    // multiplier = (0.08/12)*12 = 0.08
    // round(150000 * 1.08) = 162000, floor = 162000
    // 82.5%: round(150000 * 0.825) = 123750
    // max(162000, 123750) = 162000, floor = 162000
    const baseCents = handRibLimBase(deceased, filingDate);

    // Survivor at 64y2m = 770 months
    const expected = handSurvivorReduction(baseCents, 770, SURVIVOR_NRA_MONTHS);
    expect(result.value()).toBe(expected / 100);
  });

  it('agreement with benefitOnDate for deceased benefit calculation', () => {
    // Verify that the base in the "never filed, died after NRA" path
    // matches what benefitOnDate returns independently
    const deceased = makeRecipient(2000, 1962, 0, 2);
    // Deceased dies at 69y6m. Survivor must file strictly after.
    // Use same birth year and file at 69y7m (1 month after death).
    const survivor = makeRecipient(800, 1962, 0, 2);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(69, 6));
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(69, 7));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // Independent calculation of the base
    const age71date = deceased.birthdate.dateAtSsaAge(age(71, 0));
    const independentBase = benefitOnDate(deceased, deathDate, age71date);

    // Survivor at 69y7m >= NRA (67y0m) => gets the full base
    expect(result.value()).toBe(independentBase.floorToDollar().value());
  });
});
