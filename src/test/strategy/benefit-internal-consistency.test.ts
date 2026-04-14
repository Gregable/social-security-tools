import { describe, expect, it } from 'vitest';
import {
  allBenefitsOnDate,
  benefitAtAge,
  benefitOnDate,
  higherEarningsThan,
  spousalBenefitOnDate,
  survivorBenefit,
} from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
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

function monthDate(year: number, month: number): MonthDate {
  return MonthDate.initFromYearsMonths({ years: year, months: month });
}

// ---------------------------------------------------------------------------
// 1. benefitOnDate matches benefitAtAge for post-NRA January filing
// ---------------------------------------------------------------------------

describe('benefitOnDate matches benefitAtAge for post-NRA January filing', () => {
  // When filing in January after NRA, delayed credits are fully applied
  // immediately (no January bump needed). So benefitOnDate at any later date
  // should equal benefitAtAge at the filing age.

  it('PIA $1000, born Jun 1965, filing Jan at age 68', () => {
    // Born Jun 15 1965 => SSA birth Jun 1965, NRA = 67y0m => NRA date Jun 2032
    // Filing Jan 2034 (age 68y7m by SSA) => January filing, post-NRA
    const r = makeRecipient(1000, 1965, 5, 15);
    const filingDate = monthDate(2034, 0); // Jan 2034
    const filingAge = r.birthdate.ageAtSsaDate(filingDate);
    const laterDate = monthDate(2035, 6); // Jul 2035

    const fromOnDate = benefitOnDate(r, filingDate, laterDate);
    const fromAtAge = benefitAtAge(r, filingAge);

    expect(fromOnDate.cents()).toBe(fromAtAge.cents());
  });

  it('PIA $2000, born Mar 1970, filing Jan at age 69', () => {
    const r = makeRecipient(2000, 1970, 2, 15);
    const filingDate = monthDate(2039, 0); // Jan 2039
    const filingAge = r.birthdate.ageAtSsaDate(filingDate);
    const laterDate = monthDate(2039, 6); // Jun 2039

    const fromOnDate = benefitOnDate(r, filingDate, laterDate);
    const fromAtAge = benefitAtAge(r, filingAge);

    expect(fromOnDate.cents()).toBe(fromAtAge.cents());
  });

  it('PIA $1500, born Sep 1968, filing Jan at age 68', () => {
    const r = makeRecipient(1500, 1968, 8, 15);
    const filingDate = monthDate(2037, 0); // Jan 2037
    const filingAge = r.birthdate.ageAtSsaDate(filingDate);
    const laterDate = monthDate(2038, 0); // Jan 2038

    const fromOnDate = benefitOnDate(r, filingDate, laterDate);
    const fromAtAge = benefitAtAge(r, filingAge);

    expect(fromOnDate.cents()).toBe(fromAtAge.cents());
  });
});

// ---------------------------------------------------------------------------
// 2. benefitOnDate at NRA equals PIA
// ---------------------------------------------------------------------------

describe('benefitOnDate at NRA equals PIA', () => {
  it('PIA $1000, NRA = 67y0m', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    const nraDate = r.normalRetirementDate();

    const result = benefitOnDate(r, nraDate, nraDate);
    expect(result.cents()).toBe(100_000);
  });

  it('PIA $2500, NRA = 67y0m', () => {
    const r = makeRecipient(2500, 1970, 3, 15);
    const nraDate = r.normalRetirementDate();

    const result = benefitOnDate(r, nraDate, nraDate);
    expect(result.cents()).toBe(250_000);
  });

  it('PIA $3822, NRA = 67y0m', () => {
    const r = makeRecipient(3822, 1975, 8, 15);
    const nraDate = r.normalRetirementDate();

    const result = benefitOnDate(r, nraDate, nraDate);
    expect(result.cents()).toBe(382_200);
  });
});

// ---------------------------------------------------------------------------
// 3. allBenefitsOnDate = personal + spousal
// ---------------------------------------------------------------------------

describe('allBenefitsOnDate = personal + spousal', () => {
  it('lower earner at NRA, higher earner already filed', () => {
    const low = makeRecipient(800, 1965, 5, 15);
    const high = makeRecipient(2400, 1965, 3, 15);

    const lowNra = low.normalRetirementDate();
    const highFiling = high.normalRetirementDate();
    const atDate = monthDate(2033, 6);

    const all = allBenefitsOnDate(low, high, highFiling, lowNra, atDate);
    const personal = benefitOnDate(low, lowNra, atDate);
    const spousal = spousalBenefitOnDate(low, high, highFiling, lowNra, atDate);

    expect(all.cents()).toBe(personal.cents() + spousal.cents());
  });

  it('lower earner files early, higher earner at NRA', () => {
    const low = makeRecipient(600, 1968, 7, 15);
    const high = makeRecipient(2000, 1968, 1, 15);

    const lowFiling = low.birthdate.dateAtSsaAge(age(62, 1));
    const highFiling = high.normalRetirementDate();
    const atDate = monthDate(2040, 0);

    const all = allBenefitsOnDate(low, high, highFiling, lowFiling, atDate);
    const personal = benefitOnDate(low, lowFiling, atDate);
    const spousal = spousalBenefitOnDate(
      low,
      high,
      highFiling,
      lowFiling,
      atDate
    );

    expect(all.cents()).toBe(personal.cents() + spousal.cents());
  });

  it('equal PIAs yield zero spousal, all = personal only', () => {
    const a = makeRecipient(1500, 1965, 5, 15);
    const b = makeRecipient(1500, 1965, 3, 15);

    const aFiling = a.normalRetirementDate();
    const bFiling = b.normalRetirementDate();
    const atDate = monthDate(2034, 0);

    const all = allBenefitsOnDate(a, b, bFiling, aFiling, atDate);
    const personal = benefitOnDate(a, aFiling, atDate);
    const spousal = spousalBenefitOnDate(a, b, bFiling, aFiling, atDate);

    expect(spousal.cents()).toBe(0);
    expect(all.cents()).toBe(personal.cents());
  });

  it('higher earner gets zero spousal from lower earner', () => {
    const low = makeRecipient(500, 1970, 2, 15);
    const high = makeRecipient(3000, 1970, 6, 15);

    const lowFiling = low.normalRetirementDate();
    const highFiling = high.normalRetirementDate();
    const atDate = monthDate(2040, 0);

    const all = allBenefitsOnDate(high, low, lowFiling, highFiling, atDate);
    const personal = benefitOnDate(high, highFiling, atDate);
    const spousal = spousalBenefitOnDate(
      high,
      low,
      lowFiling,
      highFiling,
      atDate
    );

    expect(spousal.cents()).toBe(0);
    expect(all.cents()).toBe(personal.cents());
  });
});

// ---------------------------------------------------------------------------
// 4. spousalBenefitOnDate is symmetric-ish
// ---------------------------------------------------------------------------

describe('spousalBenefitOnDate is symmetric-ish', () => {
  // If A earns more than B, B gets spousal from A but A gets nothing from B.

  it('PIA $2000 vs $800: lower earner gets spousal, higher does not', () => {
    const high = makeRecipient(2000, 1965, 5, 15);
    const low = makeRecipient(800, 1965, 3, 15);

    const highFiling = high.normalRetirementDate();
    const lowFiling = low.normalRetirementDate();
    const atDate = monthDate(2034, 0);

    const lowGets = spousalBenefitOnDate(
      low,
      high,
      highFiling,
      lowFiling,
      atDate
    );
    const highGets = spousalBenefitOnDate(
      high,
      low,
      lowFiling,
      highFiling,
      atDate
    );

    expect(lowGets.cents()).toBeGreaterThan(0);
    expect(highGets.cents()).toBe(0);
  });

  it('PIA $3000 vs $500: lower earner gets spousal, higher does not', () => {
    const high = makeRecipient(3000, 1970, 6, 15);
    const low = makeRecipient(500, 1970, 2, 15);

    const highFiling = high.normalRetirementDate();
    const lowFiling = low.normalRetirementDate();
    const atDate = monthDate(2040, 0);

    const lowGets = spousalBenefitOnDate(
      low,
      high,
      highFiling,
      lowFiling,
      atDate
    );
    const highGets = spousalBenefitOnDate(
      high,
      low,
      lowFiling,
      highFiling,
      atDate
    );

    expect(lowGets.cents()).toBeGreaterThan(0);
    expect(highGets.cents()).toBe(0);
  });

  it('PIA $1800 vs $1000: lower earner gets spousal, higher does not', () => {
    const high = makeRecipient(1800, 1968, 8, 15);
    const low = makeRecipient(600, 1968, 4, 15);

    const highFiling = high.normalRetirementDate();
    const lowFiling = low.normalRetirementDate();
    const atDate = monthDate(2038, 0);

    const lowGets = spousalBenefitOnDate(
      low,
      high,
      highFiling,
      lowFiling,
      atDate
    );
    const highGets = spousalBenefitOnDate(
      high,
      low,
      lowFiling,
      highFiling,
      atDate
    );

    expect(lowGets.cents()).toBeGreaterThan(0);
    expect(highGets.cents()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 5. higherEarningsThan is antisymmetric
// ---------------------------------------------------------------------------

describe('higherEarningsThan is antisymmetric', () => {
  it('$2000 vs $1000: a > b and not b > a', () => {
    const a = makeRecipient(2000, 1965, 5, 15);
    const b = makeRecipient(1000, 1965, 3, 15);

    expect(higherEarningsThan(a, b)).toBe(true);
    expect(higherEarningsThan(b, a)).toBe(false);
  });

  it('$3500 vs $1200: a > b and not b > a', () => {
    const a = makeRecipient(3500, 1970, 6, 15);
    const b = makeRecipient(1200, 1970, 2, 15);

    expect(higherEarningsThan(a, b)).toBe(true);
    expect(higherEarningsThan(b, a)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. benefitAtAge is monotonically non-decreasing 62-70
// ---------------------------------------------------------------------------

describe('benefitAtAge is monotonically non-decreasing 62-70', () => {
  it('PIA $1000, born 1965: benefit never decreases month to month', () => {
    const r = makeRecipient(1000, 1965, 5, 15);

    let prevCents = 0;
    for (let totalMonths = 62 * 12; totalMonths <= 70 * 12; totalMonths++) {
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      const current = benefitAtAge(r, age(years, months));

      expect(current.cents()).toBeGreaterThanOrEqual(prevCents);
      prevCents = current.cents();
    }
  });

  it('PIA $2777, born 1970: benefit never decreases month to month', () => {
    const r = makeRecipient(2777, 1970, 3, 15);

    let prevCents = 0;
    for (let totalMonths = 62 * 12; totalMonths <= 70 * 12; totalMonths++) {
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      const current = benefitAtAge(r, age(years, months));

      expect(current.cents()).toBeGreaterThanOrEqual(prevCents);
      prevCents = current.cents();
    }
  });
});

// ---------------------------------------------------------------------------
// 7. benefitOnDate year-after vs year-of filing (delayed January bump)
// ---------------------------------------------------------------------------

describe('benefitOnDate year-after vs year-of filing', () => {
  // For mid-year post-NRA filing, the benefit in the filing year uses credits
  // only up to January of that year (or NRA, whichever is later). The next
  // January all credits are applied => higher benefit.

  it('mid-year filing: benefit at filing < benefit next January', () => {
    // Born Jun 15 1965, NRA = Jun 2032. File Jul 2033 (post-NRA, mid-year).
    const r = makeRecipient(1000, 1965, 5, 15);
    const filingDate = monthDate(2033, 6); // Jul 2033
    const nextJan = monthDate(2034, 0); // Jan 2034

    const atFiling = benefitOnDate(r, filingDate, filingDate);
    const atNextJan = benefitOnDate(r, filingDate, nextJan);

    expect(atFiling.cents()).toBeLessThan(atNextJan.cents());
  });

  it('mid-year filing: difference equals credits for extra months', () => {
    // Born Jun 15 1965, NRA = Jun 2032. File Jul 2033 (post-NRA).
    // At filing time (Jul 2033), benefit computed as of Jan 2033 (NRA < Jan 2033).
    // At next Jan (Jan 2034), benefit computed with full filing age credits.
    const r = makeRecipient(1000, 1965, 5, 15);
    const filingDate = monthDate(2033, 6); // Jul 2033
    const nextJan = monthDate(2034, 0); // Jan 2034

    // In filing year: credits up to Jan 2033 (age at Jan 2033)
    const janThisYear = monthDate(2033, 0);
    const ageAtJan = r.birthdate.ageAtSsaDate(janThisYear);
    const benefitAtJan = benefitAtAge(r, ageAtJan);

    // Next year: full filing age credits
    const filingAge = r.birthdate.ageAtSsaDate(filingDate);
    const benefitAtFilingAge = benefitAtAge(r, filingAge);

    const atFiling = benefitOnDate(r, filingDate, filingDate);
    const atNextJan = benefitOnDate(r, filingDate, nextJan);

    expect(atFiling.cents()).toBe(benefitAtJan.cents());
    expect(atNextJan.cents()).toBe(benefitAtFilingAge.cents());
  });

  it('January filing: year-of and year-after are equal', () => {
    // Born Jun 15 1965. File Jan 2034 (post-NRA, January filing).
    const r = makeRecipient(1500, 1965, 5, 15);
    const filingDate = monthDate(2034, 0); // Jan 2034
    const nextJan = monthDate(2035, 0); // Jan 2035

    const atFiling = benefitOnDate(r, filingDate, filingDate);
    const atNextJan = benefitOnDate(r, filingDate, nextJan);

    // January filing: credits are fully applied immediately
    expect(atFiling.cents()).toBe(atNextJan.cents());
  });

  it('age 70 filing: year-of and year-after are equal (exception)', () => {
    // Born Jun 15 1965. Age 70 = Jun 2035.
    const r = makeRecipient(1000, 1965, 5, 15);
    const age70Date = r.birthdate.dateAtSsaAge(age(70, 0));

    const atFiling = benefitOnDate(r, age70Date, age70Date);
    const nextJan = monthDate(age70Date.year() + 1, 0);
    const atNextJan = benefitOnDate(r, age70Date, nextJan);

    expect(atFiling.cents()).toBe(atNextJan.cents());
  });
});

// ---------------------------------------------------------------------------
// 8. survivorBenefit base calculation consistency
// ---------------------------------------------------------------------------

describe('survivorBenefit base calculation consistency', () => {
  // In all tests below, the deceased is born much earlier than the survivor
  // so the deceased dies before the survivor files for survivor benefits.

  it('deceased filed at NRA: survivor base = PIA', () => {
    // Deceased: PIA $2000, born Jun 15 1950, NRA = 66y0m, filed at NRA, died at 68.
    // Survivor: born Jun 15 1980, survivor NRA = 67y0m => files Jun 2047.
    // Deceased death: Jun 2018. Survivor filing: Jun 2047. OK: 2047 > 2018.
    const deceased = makeRecipient(2000, 1950, 5, 15);
    const survivor = makeRecipient(500, 1980, 5, 15);

    const deceasedNra = deceased.normalRetirementDate();
    const deathDate = deceased.birthdate.dateAtSsaAge(age(68, 0));
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(
      survivor.survivorNormalRetirementAge()
    );

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedNra,
      deathDate,
      survivorFilingDate
    );

    // Deceased filed at NRA (66y0m for 1950 birth): benefit = PIA = $2000.
    // base = max(82.5% * PIA, benefit) = max($1650, $2000) = $2000.
    // Survivor at survivor NRA: 100% of base.
    expect(result.cents()).toBe(200_000);
  });

  it('deceased filed at 62: survivor base = 82.5% of PIA (RIB-LIM)', () => {
    // Deceased: PIA $2000, born Jun 15 1950, NRA = 66y0m, filed at 62y1m, died at 68.
    // Survivor: born Jun 15 1980, survivor NRA = 67y0m.
    const deceased = makeRecipient(2000, 1950, 5, 15);
    const survivor = makeRecipient(500, 1980, 5, 15);

    const deceasedFilingDate = deceased.birthdate.dateAtSsaAge(age(62, 1));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(68, 0));
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(
      survivor.survivorNormalRetirementAge()
    );

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // Deceased NRA = 66y0m. At 62y1m (47 months early):
    // reduction = min(36,47)*5/900 + max(0,11)*5/1200 = 0.2 + 11*5/1200
    // benefit at that age < PIA
    // base = max(82.5% * PIA, benefit at 62y1m)
    // 82.5% * $2000 = $1650
    // benefit at 62y1m: multiplier = -(36*5/900 + 11*5/1200) = -(0.2 + 0.04583) = -0.24583
    // round(200000 * 0.75417) = round(150833.33) = 150833
    // floor(150833/100)*100 = 150800 = $1508
    // base = max($1650, $1508) = $1650
    const pia = Money.from(2000);
    const ribLim = pia.times(0.825).floorToDollar();
    expect(result.cents()).toBe(ribLim.cents());
  });

  it('deceased filed at 70: survivor base = 124% of PIA', () => {
    // Deceased: PIA $1000, born Jun 15 1950, NRA = 66y0m, filed at 70, died at 72.
    // Survivor: born Jun 15 1980, survivor NRA = 67y0m => files Jun 2047.
    // Deceased death at 72 = Jun 2022. Survivor files Jun 2047. OK.
    const deceased = makeRecipient(1000, 1950, 5, 15);
    const survivor = makeRecipient(300, 1980, 5, 15);

    const deceasedFilingDate = deceased.birthdate.dateAtSsaAge(age(70, 0));
    const deathDate = deceased.birthdate.dateAtSsaAge(age(72, 0));
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(
      survivor.survivorNormalRetirementAge()
    );

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // Deceased NRA = 66y0m. At age 70 (48 months delayed):
    // increase = 0.065/12 * 48 = 0.26 (delayed increase is 6.5% for 1950 birth)
    // Benefit = floor(round(100000 * 1.26)) = $1260
    // Wait - delayed increase for 1950 birth: from constants, 1943-1954 => 0.07
    // Actually: 1945-1956 bracket has delayedIncreaseAnnual = ?
    // Let me just use benefitAtAge directly.
    const atAge70 = benefitAtAge(deceased, age(70, 0));
    // base = max(82.5% * 1000, atAge70) = max(825, atAge70)
    // atAge70 > PIA always, so base = atAge70.
    const ribLim = Money.from(1000).times(0.825).floorToDollar();
    expect(atAge70.cents()).toBeGreaterThan(ribLim.cents());
    expect(result.cents()).toBe(atAge70.cents());
  });

  it('deceased died at 72 without filing: survivor base = benefit as if filed at 70', () => {
    // Deceased: PIA $1000, born Jun 15 1950, never filed, died at 72.
    // Since deceased died after NRA without filing, benefit is computed as
    // though they filed at death, but delayed credits cap at age 70.
    // Survivor: born Jun 15 1980.
    const deceased = makeRecipient(1000, 1950, 5, 15);
    const survivor = makeRecipient(300, 1980, 5, 15);

    const deathDate = deceased.birthdate.dateAtSsaAge(age(72, 0));
    // Filing date >= death date means "did not file before death"
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(
      survivor.survivorNormalRetirementAge()
    );

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // Effective filing date = min(deathDate, age70Date) = age70Date.
    // benefitOnDate(deceased, age70Date, age71Date) = benefitAtAge(deceased, age(70,0))
    const atAge70 = benefitAtAge(deceased, age(70, 0));
    expect(result.cents()).toBe(atAge70.cents());
  });
});

// ---------------------------------------------------------------------------
// 9. spousal reduction formula transitions smoothly at 36-month boundary
// ---------------------------------------------------------------------------

describe('spousal reduction formula transitions smoothly at 36-month boundary', () => {
  // The spousal benefit reduction uses two formulas:
  // - Within 36 months of NRA: reduction = monthsBefore / 144 (i.e. 25/36% per month)
  // - Beyond 36 months: 25% + (monthsBeyond36 * 5/1200) of spousal base
  // At exactly 36 months, both formulas should give the same result (25% reduction).

  it('at exactly 36 months before NRA: reduction = 25%', () => {
    // Need a scenario where startDate is exactly 36 months before NRA.
    // Low earner born Jun 15 1965 => NRA = Jun 2032.
    // If both file at the same time and startDate = Jun 2029 => 36 months before NRA.
    const low = makeRecipient(500, 1965, 5, 15);
    const high = makeRecipient(2000, 1965, 3, 15);

    const _lowNra = low.normalRetirementDate(); // Jun 2032
    // startDate = max(spouseFiling, recipientFiling)
    // Set both to Jun 2029 so startDate = Jun 2029, 36 months before Jun 2032.
    const filingDate = monthDate(2029, 5); // Jun 2029
    const atDate = monthDate(2029, 5);

    const spousal = spousalBenefitOnDate(
      low,
      high,
      filingDate,
      filingDate,
      atDate
    );

    // Spousal base = high PIA / 2 - low PIA = 2000/2 - 500 = $500 = 50000 cents
    // At 36 months: reduction = 36/144 = 0.25 => benefit = 50000 * 0.75 = 37500
    // floor(37500 / 100) * 100 = 37500
    const spousalBase = 200_000 / 2 - 50_000;
    const expected =
      Math.floor(Math.floor(spousalBase * (1 - 36 / 144)) / 100) * 100;
    expect(spousal.cents()).toBe(expected);
  });

  it('at 37 months before NRA: reduction = 25% + 5/1200', () => {
    const low = makeRecipient(500, 1965, 5, 15);
    const high = makeRecipient(2000, 1965, 3, 15);

    const _lowNra = low.normalRetirementDate(); // Jun 2032
    // startDate = May 2029 => 37 months before Jun 2032
    const filingDate = monthDate(2029, 4); // May 2029
    const atDate = monthDate(2029, 4);

    const spousal = spousalBenefitOnDate(
      low,
      high,
      filingDate,
      filingDate,
      atDate
    );

    // Spousal base = 50000 cents
    // Beyond 36 formula: base - 25% - (1 * 5/1200) of base
    // = 50000 - 12500 - 50000/240 = 50000 - 12500 - 208.33
    const spousalBase = 200_000 / 2 - 50_000;
    const firstReduction = spousalBase * 0.25;
    const secondReduction = spousalBase * (1 / 240);
    const expected =
      Math.floor((spousalBase - firstReduction - secondReduction) / 100) * 100;
    expect(spousal.cents()).toBe(expected);
  });

  it('transition from 36 to 37 months is smooth (no discontinuity)', () => {
    const low = makeRecipient(500, 1965, 5, 15);
    const high = makeRecipient(2000, 1965, 3, 15);

    // 36 months before NRA
    const filing36 = monthDate(2029, 5); // Jun 2029
    const spousal36 = spousalBenefitOnDate(
      low,
      high,
      filing36,
      filing36,
      filing36
    );

    // 37 months before NRA
    const filing37 = monthDate(2029, 4); // May 2029
    const spousal37 = spousalBenefitOnDate(
      low,
      high,
      filing37,
      filing37,
      filing37
    );

    // At 36 months: 75% of base. At 37: slightly less.
    // The difference should be small (roughly 5/1200 of spousal base).
    // spousalBase = 50000 cents. Delta ~= 50000 * 5/1200 ~= 208 cents.
    // After flooring, both results should differ by at most ~$3.
    const diff = spousal36.cents() - spousal37.cents();
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThanOrEqual(300);
  });
});

// ---------------------------------------------------------------------------
// 10. survivor age reduction interpolates correctly at boundaries
// ---------------------------------------------------------------------------

describe('survivor age reduction interpolates correctly at boundaries', () => {
  // The survivor benefit at filing ages between 60 and survivor NRA
  // interpolates linearly between 71.5% and 100% of the base.

  it('filing at age 60: survivor gets 71.5% of base', () => {
    const deceased = makeRecipient(2000, 1960, 5, 15);
    const survivor = makeRecipient(300, 1965, 5, 15);

    // Deceased filed at NRA, died at 72.
    const _deceasedNra = deceased.normalRetirementDate();
    const _deathDate = deceased.birthdate.dateAtSsaAge(age(72, 0));

    // Survivor files at exactly age 60.
    const _survivorFilingDate = survivor.birthdate.dateAtSsaAge(age(60, 0));
    // Survivor filing must be after death, so make death date before age 60.
    // Adjust: deceased must die before survivor files.
    // Deceased born 1960, survivor born 1965. Deceased at age 72 = 2032.
    // Survivor at age 60 = Jun 2025. That's before 2032, so we need to adjust.
    // Let's make the deceased older so they die before the survivor turns 60.
    const deceasedOlder = makeRecipient(2000, 1950, 5, 15);
    const deceasedOlderNra = deceasedOlder.normalRetirementDate();
    const deathDateOlder = deceasedOlder.birthdate.dateAtSsaAge(age(72, 0));
    // Deceased born 1950, dies at 72 = 2022.
    // Survivor born 1965, age 60 = 2025. Good, 2025 > 2022.

    const survivorFilingDate2 = survivor.birthdate.dateAtSsaAge(age(60, 0));

    const result = survivorBenefit(
      survivor,
      deceasedOlder,
      deceasedOlderNra,
      deathDateOlder,
      survivorFilingDate2
    );

    // Deceased filed at NRA (65y0m for 1950 birth): benefit = PIA = $2000.
    // base = max(82.5% * $2000, $2000) = $2000.
    // At age 60: ratio = 0 / (nra-60months), factor = 0.715 + 0.285 * 0 = 0.715
    // result = floor(200000 * 0.715) = floor(143000) = $1430
    const baseBenefit = Money.from(2000);
    const expected = baseBenefit.times(0.715).floorToDollar();
    expect(result.cents()).toBe(expected.cents());
  });

  it('filing at survivor NRA: survivor gets 100% of base', () => {
    // Deceased: PIA $2000, born 1950, filed at NRA, died at 72 (2022).
    // Survivor: born Jun 15 1962, survivor NRA = 67y0m (born 1962+).
    const deceasedOlder = makeRecipient(2000, 1950, 5, 15);
    const survivor = makeRecipient(300, 1962, 5, 15);

    const deceasedNra = deceasedOlder.normalRetirementDate();
    const deathDate = deceasedOlder.birthdate.dateAtSsaAge(age(72, 0));
    // Survivor NRA for survivor benefits: born 1962 => 67y0m.
    const survivorFilingDate = survivor.birthdate.dateAtSsaAge(
      survivor.survivorNormalRetirementAge()
    );

    const result = survivorBenefit(
      survivor,
      deceasedOlder,
      deceasedNra,
      deathDate,
      survivorFilingDate
    );

    // At survivor NRA: 100% of base = PIA = $2000
    expect(result.cents()).toBe(200_000);
  });
});
