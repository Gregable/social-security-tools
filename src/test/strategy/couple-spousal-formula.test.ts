import { describe, expect, it } from 'vitest';
import {
  eligibleForSpousalBenefit,
  spousalBenefitOnDate,
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

/**
 * Returns the NRA MonthDate for a recipient.
 */
function nraDate(r: Recipient): MonthDate {
  return r.normalRetirementDate();
}

/**
 * Returns a MonthDate for a recipient at the given age.
 */
function dateAtAge(r: Recipient, years: number, months: number): MonthDate {
  return r.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years, months })
  );
}

/**
 * Hand-calculates the expected spousal benefit in cents for early filing
 * (startDate < NRA).
 *
 * spousalCents = spousePiaCents / 2 - recipientPiaCents
 * monthsBeforeNra = nraEpoch - startDateEpoch
 *
 * If monthsBeforeNra <= 36:
 *   reduced = spousalCents * (1 - monthsBeforeNra / 144)
 * Else:
 *   firstReduction = spousalCents * 0.25
 *   remaining = monthsBeforeNra - 36
 *   secondReduction = spousalCents * (remaining / 240)
 *   reduced = spousalCents - firstReduction - secondReduction
 *
 * Then floor to dollar: Math.floor(reduced / 100) * 100
 */
function expectedEarlySpousalCents(
  spousePiaCents: number,
  recipientPiaCents: number,
  monthsBeforeNra: number
): number {
  const spousalCents = spousePiaCents / 2 - recipientPiaCents;
  if (spousalCents <= 0) return 0;

  let reduced: number;
  if (monthsBeforeNra <= 36) {
    reduced = spousalCents * (1 - monthsBeforeNra / 144);
  } else {
    const firstReduction = spousalCents * 0.25;
    const remaining = monthsBeforeNra - 36;
    const secondReduction = spousalCents * (remaining / 240);
    reduced = spousalCents - firstReduction - secondReduction;
  }

  return Math.floor(reduced / 100) * 100;
}

// ---------------------------------------------------------------------------
// 1. Spousal eligibility
// ---------------------------------------------------------------------------

describe('Spousal eligibility', () => {
  // eligibleForSpousalBenefit(recipient, spouse) returns true if
  // spouse.PIA / 2 > recipient.PIA (strictly greater).

  it('$2000/$600: eligible (1000 > 600)', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);
  });

  it('$1000/$800: NOT eligible (500 not > 800)', () => {
    const earner = makeRecipient(1000, 1965, 5, 15);
    const dependent = makeRecipient(800, 1965, 5, 15);
    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(false);
  });

  it('$1000/$499: eligible (500 > 499)', () => {
    const earner = makeRecipient(1000, 1965, 5, 15);
    const dependent = makeRecipient(499, 1965, 5, 15);
    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);
  });

  it('$1000/$500: NOT eligible (500 not > 500, must be strictly greater)', () => {
    const earner = makeRecipient(1000, 1965, 5, 15);
    const dependent = makeRecipient(500, 1965, 5, 15);
    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(false);
  });

  it('$0/$0: NOT eligible', () => {
    const earner = makeRecipient(0, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(false);
  });

  it('$2000/$0: eligible (1000 > 0)', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Spousal at NRA - basic
// ---------------------------------------------------------------------------

describe('Spousal at NRA - basic', () => {
  // Both file at NRA (67y0m for 1960+ births).
  // Base spousal = floor(spousePIA/2 - dependentPIA) to dollar.
  // When both file at NRA, startDate = NRA, and
  // filingDate <= NRA path is taken => floor(spousalCents) to dollar.

  it('earner $2000, dependent $600: spousal = $400', () => {
    // spousalCents = 200000/2 - 60000 = 40000 => $400
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerNra = nraDate(earner);
    const depNra = nraDate(dependent);
    const atDate = depNra; // at NRA
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerNra,
      depNra,
      atDate
    );
    expect(result.cents()).toBe(40000);
  });

  it('earner $3000, dependent $1000: spousal = $500', () => {
    // spousalCents = 300000/2 - 100000 = 50000 => $500
    const earner = makeRecipient(3000, 1965, 5, 15);
    const dependent = makeRecipient(1000, 1965, 5, 15);
    const earnerNra = nraDate(earner);
    const depNra = nraDate(dependent);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerNra,
      depNra,
      depNra
    );
    expect(result.cents()).toBe(50000);
  });

  it('earner $2000, dependent $0: spousal = $1000', () => {
    // spousalCents = 200000/2 - 0 = 100000 => $1000
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerNra = nraDate(earner);
    const depNra = nraDate(dependent);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerNra,
      depNra,
      depNra
    );
    expect(result.cents()).toBe(100000);
  });

  it('earner $1500, dependent $400: spousal = $350', () => {
    // spousalCents = 150000/2 - 40000 = 35000 => $350
    const earner = makeRecipient(1500, 1965, 5, 15);
    const dependent = makeRecipient(400, 1965, 5, 15);
    const earnerNra = nraDate(earner);
    const depNra = nraDate(dependent);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerNra,
      depNra,
      depNra
    );
    expect(result.cents()).toBe(35000);
  });

  it('earner $1000, dependent $499: spousal = $1', () => {
    // spousalCents = 100000/2 - 49900 = 100 => floor($1.00) = $1
    const earner = makeRecipient(1000, 1965, 5, 15);
    const dependent = makeRecipient(499, 1965, 5, 15);
    const earnerNra = nraDate(earner);
    const depNra = nraDate(dependent);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerNra,
      depNra,
      depNra
    );
    expect(result.cents()).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// 3. Spousal before NRA - early reduction
// ---------------------------------------------------------------------------

describe('Spousal before NRA - early reduction', () => {
  // For 1960+ births: NRA = 67y0m, delayed increase = 0.08.
  // Use earner PIA = $2000, dependent PIA = $600 => spousalCents = 40000.
  //
  // The startDate = max(earnerFiling, dependentFiling).
  // monthsBeforeNra = NRA_epoch - startDate_epoch.

  const earnerPiaCents = 200000;
  const depPiaCents = 60000;

  it('12 months early (<=36): reduction = 12/144 of base', () => {
    // Both born 1965-05-15. NRA = 67y0m.
    // dependent files at 66y0m (12 months early), earner files at NRA.
    // startDate = earnerNRA (which equals depNRA since same birthdate).
    // Wait - earner files at NRA, dep files at 66y0m.
    // startDate = max(earnerNRA, depFiling@66y0m).
    // earnerNRA month > depFiling month, so startDate = earnerNRA which is
    // at NRA. We need the dep filing date to be the later one.
    // Use: earner files at 66y0m (12 months before NRA), dep also at 66y0m.
    // startDate = max(both at 66y0m) = 66y0m. monthsBeforeNra = 12.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = dateAtAge(earner, 66, 0);
    const depFiling = dateAtAge(dependent, 66, 0);
    const atDate = depFiling;
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    const expected = expectedEarlySpousalCents(earnerPiaCents, depPiaCents, 12);
    expect(result.cents()).toBe(expected);
  });

  it('24 months early: reduction = 24/144', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = dateAtAge(earner, 65, 0);
    const depFiling = dateAtAge(dependent, 65, 0);
    const atDate = depFiling;
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    const expected = expectedEarlySpousalCents(earnerPiaCents, depPiaCents, 24);
    expect(result.cents()).toBe(expected);
  });

  it('36 months early: reduction = 36/144 = 25%', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = dateAtAge(earner, 64, 0);
    const depFiling = dateAtAge(dependent, 64, 0);
    const atDate = depFiling;
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    const expected = expectedEarlySpousalCents(earnerPiaCents, depPiaCents, 36);
    // 36/144 = 0.25, so benefit = 0.75 * 40000 = 30000 => $300
    expect(result.cents()).toBe(expected);
    expect(expected).toBe(30000);
  });

  it('48 months early (>36): 25% + (12/240) of base', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = dateAtAge(earner, 63, 0);
    const depFiling = dateAtAge(dependent, 63, 0);
    const atDate = depFiling;
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    const expected = expectedEarlySpousalCents(earnerPiaCents, depPiaCents, 48);
    expect(result.cents()).toBe(expected);
  });

  it('60 months early: 25% + (24/240)', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = dateAtAge(earner, 62, 0);
    const depFiling = dateAtAge(dependent, 62, 0);
    const atDate = depFiling;
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    const expected = expectedEarlySpousalCents(earnerPiaCents, depPiaCents, 60);
    // 25% + 24/240 = 0.25 + 0.1 = 0.35. Benefit = 0.65 * 40000 = 26000
    expect(result.cents()).toBe(expected);
    expect(expected).toBe(26000);
  });

  it('startDate uses max of both filing dates for reduction calc', () => {
    // Earner files at 66y0m, dependent files at 63y0m.
    // startDate = max(earner@66y0m, dep@63y0m) = earner@66y0m.
    // monthsBeforeNra = 67y0m - 66y0m = 12 (earner and dep born same month).
    // The reduction is based on 12 months, not 48 months.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = dateAtAge(earner, 66, 0);
    const depFiling = dateAtAge(dependent, 63, 0);
    // atDate must be >= startDate
    const startDate = MonthDate.max(earnerFiling, depFiling);
    const atDate = startDate;
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    // startDate is earnerFiling at age 66y0m, which is 12 months before NRA.
    const expected = expectedEarlySpousalCents(earnerPiaCents, depPiaCents, 12);
    expect(result.cents()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 4. Spousal starts only when both filed
// ---------------------------------------------------------------------------

describe('Spousal starts only when both filed', () => {
  it('earner files at 67, dependent files at 62: spousal starts at earner filing', () => {
    // Dependent files at 62, earner files at NRA (67).
    // startDate = max(earnerNRA, dep@62) = earnerNRA.
    // Before earnerNRA, spousal = $0.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = nraDate(earner);
    const depFiling = dateAtAge(dependent, 62, 0);

    // At earner's NRA, spousal should be > $0.
    const atEarnerNra = earnerFiling;
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atEarnerNra
    );
    expect(result.cents()).toBeGreaterThan(0);
  });

  it('earner files at 62, dependent files at 70: spousal starts at dependent filing', () => {
    // startDate = max(earner@62, dep@70) = dep@70.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = dateAtAge(earner, 62, 0);
    const depFiling = dateAtAge(dependent, 70, 0);

    // At dep@70, spousal should be calculable (dep filed after NRA).
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      depFiling
    );
    // startDate >= NRA, and filingDate (70y0m) > NRA, so combined cap path.
    // Personal benefit at 70 with delayed credits:
    // 36 months * 0.08/12 = 0.24, so personal = 600 * 1.24 = 744 => floor = $744
    // spousal = 200000/2 - 74400 = 25600 => floor = $256
    // But actually Money.times uses Math.round, so:
    // 60000 * 1.24 = 74400 exactly, floor = 74400. spousal = 100000 - 74400 = 25600
    expect(result.cents()).toBeGreaterThan(0);
  });

  it('both file same month: spousal starts that month', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const filingDate = dateAtAge(dependent, 65, 0);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      filingDate,
      filingDate,
      filingDate
    );
    // 24 months early, so should get a reduced amount > 0
    expect(result.cents()).toBeGreaterThan(0);
  });

  it('returns $0 for dates before both have filed', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = nraDate(earner); // 67y0m
    const depFiling = dateAtAge(dependent, 64, 0);
    // startDate = max(earnerFiling, depFiling) = earnerFiling.
    // Query at a date 1 month before earnerFiling.
    const beforeBothFiled = earnerFiling.subtractDuration(new MonthDuration(1));
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      beforeBothFiled
    );
    expect(result.cents()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Spousal after NRA - combined cap
// ---------------------------------------------------------------------------

describe('Spousal after NRA - combined cap', () => {
  // When startDate >= NRA and filingDate > NRA, the combined cap path applies:
  // personalBenefit = benefitOnDate(recipient, filingDate, atDate)
  // spousalCents = spousePIA/2 - personalBenefit.cents()
  //
  // For 1960+ births: NRA = 67y0m, delayed increase = 0.08.
  // personalBenefit at age X = floor(PIA * (1 + (X-NRA months) * 0.08/12))

  it('dependent files at NRA: standard formula, no cap reduction', () => {
    // filingDate <= NRA, so standard path: floor(spousePIA/2 - depPIA) to dollar
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = nraDate(earner);
    const depFiling = nraDate(dependent);
    // atDate is in the year after filing so delayed credits fully apply
    const atDate = MonthDate.initFromYearsMonths({
      years: depFiling.year() + 1,
      months: 0,
    });
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    // spousalCents = 200000/2 - 60000 = 40000 => $400
    expect(result.cents()).toBe(40000);
  });

  it('dependent files at 68 (1yr delayed credits): spousal reduced', () => {
    // filingDate = 68y0m (12 months after NRA).
    // personalBenefit = floor(600 * (1 + 12 * 0.08/12)) = floor(600*1.08)
    // = floor($648) = $648 (64800 cents).
    // But Money.times: Math.round(60000 * 1.08) = Math.round(64800) = 64800.
    // floorToDollar = 64800. So personal = $648.
    // spousal = 200000/2 - 64800 = 35200 => floor = $352.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = nraDate(earner);
    const depFiling = dateAtAge(dependent, 68, 0);
    // atDate in year after filing for full delayed credits
    const atDate = MonthDate.initFromYearsMonths({
      years: depFiling.year() + 1,
      months: 0,
    });
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    expect(result.cents()).toBe(35200);
  });

  it('dependent files at 69 (2yr delayed credits): spousal further reduced', () => {
    // personalBenefit = floor(600 * (1 + 24 * 0.08/12))
    // = floor(600 * 1.16) = floor(696) = $696 (69600 cents).
    // Money.times: Math.round(60000 * 1.16) = 69600. Floor = 69600.
    // spousal = 100000 - 69600 = 30400 => floor = $304.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    const earnerFiling = nraDate(earner);
    const depFiling = dateAtAge(dependent, 69, 0);
    const atDate = MonthDate.initFromYearsMonths({
      years: depFiling.year() + 1,
      months: 0,
    });
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    expect(result.cents()).toBe(30400);
  });

  it('dependent files at 70 (3yr delayed credits): spousal may be eliminated', () => {
    // Use dependent PIA = $800.
    // personalBenefit = floor(800 * (1 + 36 * 0.08/12))
    // = floor(800 * 1.24) = floor(992) = $992 (99200 cents).
    // spousal = 200000/2 - 99200 = 800 => floor = $8.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(800, 1965, 5, 15);
    const earnerFiling = nraDate(earner);
    const depFiling = dateAtAge(dependent, 70, 0);
    // At age 70, delayed credits apply immediately (no need for next year).
    const atDate = depFiling;
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    // Money.times: Math.round(80000 * 1.24) = 99200. Floor = 99200.
    // spousal = 100000 - 99200 = 800. Floor = $8 (800 cents).
    expect(result.cents()).toBe(800);
  });

  it('dependent files at 70 with high PIA: spousal eliminated entirely', () => {
    // dependent PIA = $900, earner PIA = $1600.
    // personalBenefit = floor(900 * 1.24) = floor(1116) = $1116 (111600).
    // spousal = 160000/2 - 111600 = -31600, which is <= 0 => $0.
    const earner = makeRecipient(1600, 1965, 5, 15);
    const dependent = makeRecipient(900, 1965, 5, 15);
    const earnerFiling = nraDate(earner);
    const depFiling = dateAtAge(dependent, 70, 0);
    const atDate = depFiling;
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    // Math.round(90000 * 1.24) = 111600. Floor = 111600.
    // spousal = 80000 - 111600 = -31600 <= 0 => $0.
    expect(result.cents()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Spousal with non-round PIAs
// ---------------------------------------------------------------------------

describe('Spousal with non-round PIAs', () => {
  // The PIA is set via setPia(Money.from(X)) which uses Math.round(X * 100),
  // so $1234 = 123400 cents, $567 = 56700 cents, etc.
  // Spousal calculation: spousalCents = spousePiaCents / 2 - depPiaCents.
  // Then floor to dollar.

  it('earner $1234, dependent $567: spousal at NRA', () => {
    // spousalCents = 123400 / 2 - 56700 = 61700 - 56700 = 5000.
    // floor(5000) = $50.
    const earner = makeRecipient(1234, 1965, 5, 15);
    const dependent = makeRecipient(567, 1965, 5, 15);
    const earnerFiling = nraDate(earner);
    const depFiling = nraDate(dependent);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      depFiling
    );
    expect(result.cents()).toBe(5000);
  });

  it('earner $1999, dependent $123: spousal at NRA', () => {
    // spousalCents = 199900 / 2 - 12300 = 99950 - 12300 = 87650.
    // floor(87650 / 100) * 100 = 87600. => $876.
    const earner = makeRecipient(1999, 1965, 5, 15);
    const dependent = makeRecipient(123, 1965, 5, 15);
    const earnerFiling = nraDate(earner);
    const depFiling = nraDate(dependent);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      depFiling
    );
    expect(result.cents()).toBe(87600);
  });

  it('earner $2001, dependent $789: spousal at NRA', () => {
    // spousalCents = 200100 / 2 - 78900 = 100050 - 78900 = 21150.
    // floor(21150 / 100) * 100 = 21100. => $211.
    const earner = makeRecipient(2001, 1965, 5, 15);
    const dependent = makeRecipient(789, 1965, 5, 15);
    const earnerFiling = nraDate(earner);
    const depFiling = nraDate(dependent);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      depFiling
    );
    expect(result.cents()).toBe(21100);
  });

  it('earner $1357, dependent $456: spousal 24 months early', () => {
    // spousalCents = 135700 / 2 - 45600 = 67850 - 45600 = 22250.
    // 24 months early (<=36): reduced = 22250 * (1 - 24/144)
    // = 22250 * (1 - 0.16667) = 22250 * 0.83333 = 18541.6...
    // floor(18541.6 / 100) * 100 = 18500. => $185.
    const earner = makeRecipient(1357, 1965, 5, 15);
    const dependent = makeRecipient(456, 1965, 5, 15);
    const earnerFiling = dateAtAge(earner, 65, 0);
    const depFiling = dateAtAge(dependent, 65, 0);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      depFiling
    );
    const expected = expectedEarlySpousalCents(135700, 45600, 24);
    expect(result.cents()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 7. Edge cases and zero-benefit scenarios
// ---------------------------------------------------------------------------

describe('Spousal edge cases', () => {
  it('returns $0 when recipient has higher earnings than spouse', () => {
    // higherEarningsThan check: recipient PIA > spouse PIA => $0.
    const earner = makeRecipient(600, 1965, 5, 15);
    const dependent = makeRecipient(2000, 1965, 5, 15);
    const earnerFiling = nraDate(earner);
    const depFiling = nraDate(dependent);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      depFiling
    );
    expect(result.cents()).toBe(0);
  });

  it('returns $0 when spousal base is exactly zero', () => {
    // earner PIA = $1000, dependent PIA = $500.
    // spousalCents = 100000/2 - 50000 = 0 => $0.
    const earner = makeRecipient(1000, 1965, 5, 15);
    const dependent = makeRecipient(500, 1965, 5, 15);
    const earnerFiling = nraDate(earner);
    const depFiling = nraDate(dependent);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      depFiling
    );
    expect(result.cents()).toBe(0);
  });

  it('single month early gives correct small reduction', () => {
    // 1 month before NRA.
    // spousalCents = 200000/2 - 60000 = 40000.
    // reduction = 40000 * (1 - 1/144) = 40000 * 143/144 = 39722.22...
    // floor(39722.22 / 100) * 100 = 39700. => $397.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    // Use different filing dates: earner files 1 month before NRA,
    // dependent files at same time.
    const earnerFiling = nraDate(earner).subtractDuration(new MonthDuration(1));
    const depFiling = nraDate(dependent).subtractDuration(new MonthDuration(1));
    const atDate = MonthDate.max(earnerFiling, depFiling);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    const expected = expectedEarlySpousalCents(200000, 60000, 1);
    expect(result.cents()).toBe(expected);
    expect(expected).toBe(39700);
  });

  it('at boundary of 36/37 months early', () => {
    // 37 months early crosses from <=36 formula to >36 formula.
    // spousalCents = 200000/2 - 60000 = 40000.
    // >36 path: firstReduction = 40000 * 0.25 = 10000.
    // remaining = 37 - 36 = 1. secondReduction = 40000 * (1/240) = 166.67.
    // reduced = 40000 - 10000 - 166.67 = 29833.33.
    // floor(29833.33 / 100) * 100 = 29800. => $298.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(600, 1965, 5, 15);
    // 37 months before NRA = 67y0m - 37m = 63y11m
    const earnerFiling = dateAtAge(earner, 63, 11);
    const depFiling = dateAtAge(dependent, 63, 11);
    const atDate = depFiling;
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    const expected = expectedEarlySpousalCents(200000, 60000, 37);
    expect(result.cents()).toBe(expected);
    expect(expected).toBe(29800);
  });
});
