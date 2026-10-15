import { describe, expect, it } from 'vitest';
import {
  allBenefitsOnDate,
  allBenefitsOnDateNominal,
  baseSpousalBenefit,
  benefitAtAge,
  benefitCentsAtAge,
  benefitOnDate,
  benefitOnDateNominal,
  eligibleForSpousalBenefit,
  spousalBenefitOnDate,
} from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import demo0 from '$lib/pastes/averagepaste.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';

import * as constants from '../lib/constants';

const ym = (years: number, months: number) =>
  MonthDate.initFromYearsMonths({ years, months });

/**
 * benefitOnDateNominal expresses a benefit in the dollars actually payable in
 * the month `atDate` (historical COLA vintage), whereas benefitOnDate always
 * uses today's dollars. These tests mirror the real report behind issue #559:
 * a 1956-born earner who filed mid-2024.
 */
describe('benefitOnDateNominal', () => {
  // Born Sep 29, 1956: NRA is 66y4m, turns 62 in 2018 (COLAs 2018.. apply).
  const BIRTHDATE = Birthdate.FromYMD(1956, 8, 29);
  // Filed July 2024, at age 67y10m (past NRA, so delayed credits accrue).
  const FILING = ym(2024, 6);

  function recipient(): Recipient {
    const r = new Recipient();
    r.birthdate = BIRTHDATE;
    r.earningsRecords = parsePaste(demo0);
    return r;
  }

  it('equals benefitOnDate for a current/future month (no future COLA assumed)', () => {
    const r = recipient();
    // January of the current year is at/after the most recently applied COLA,
    // so the nominal vintage matches today's dollars exactly.
    const at = ym(constants.CURRENT_YEAR, 0);
    expect(benefitOnDateNominal(r, FILING, at).value()).toEqual(
      benefitOnDate(r, FILING, at).value()
    );
  });

  it('clamps to today: a future December does not assume a future COLA', () => {
    const r = recipient();
    // raw vintage would be next year (a December), which exceeds CURRENT_YEAR-1
    // and must be clamped so no not-yet-existent COLA is applied. This exercises
    // the Math.min clamp (not merely its equality case).
    const at = ym(constants.CURRENT_YEAR + 1, 11);
    expect(benefitOnDateNominal(r, FILING, at).value()).toEqual(
      benefitOnDate(r, FILING, at).value()
    );
  });

  it('shows a smaller (nominal) amount for a past mid-year month', () => {
    const r = recipient();
    // June 2025: today's-dollars value includes the Dec-2025 COLA that had not
    // yet taken effect, so the nominal value must be strictly smaller.
    const at = ym(2025, 5);
    expect(benefitOnDateNominal(r, FILING, at).value()).toBeLessThan(
      benefitOnDate(r, FILING, at).value()
    );
  });

  it('never exceeds the present-day value', () => {
    const r = recipient();
    for (let year = 2024; year <= constants.CURRENT_YEAR; year++) {
      for (let month = 0; month < 12; month++) {
        const at = ym(year, month);
        if (at.lessThan(FILING)) continue;
        expect(benefitOnDateNominal(r, FILING, at).value()).toBeLessThanOrEqual(
          benefitOnDate(r, FILING, at).value()
        );
      }
    }
  });

  it('steps up at the December COLA effective date, not January', () => {
    const r = recipient();
    const nov2025 = benefitOnDateNominal(r, FILING, ym(2025, 10)).value();
    const dec2025 = benefitOnDateNominal(r, FILING, ym(2025, 11)).value();
    // The 2.8% COLA is effective December 2025 (paid the following January).
    expect(dec2025).toBeGreaterThan(nov2025);
  });

  it('reaches present-day dollars at the December of the last applied COLA year', () => {
    const r = recipient();
    // December of CURRENT_YEAR-1 has the most recently applied COLA as its
    // vintage, which equals benefitOnDate's fixed cutoff. Anchored to the
    // constant rather than a literal year so it stays correct as time advances.
    const at = ym(constants.CURRENT_YEAR - 1, 11);
    expect(benefitOnDateNominal(r, FILING, at).value()).toEqual(
      benefitOnDate(r, FILING, at).value()
    );
  });

  it('applies delayed retirement credits the January after filing, independent of COLA', () => {
    const r = recipient();
    // Dec 2024 and Jan 2025 share the same COLA vintage (2024's COLA, effective
    // Dec 2024), so any increase between them is purely the delayed-credit jump.
    const dec2024 = benefitOnDateNominal(r, FILING, ym(2024, 11)).value();
    const jan2025 = benefitOnDateNominal(r, FILING, ym(2025, 0)).value();
    expect(jan2025).toBeGreaterThan(dec2024);
  });

  it('returns zero before the filing date and is non-zero at it', () => {
    const r = recipient();
    expect(benefitOnDateNominal(r, FILING, ym(2024, 5)).value()).toEqual(0);
    expect(benefitOnDateNominal(r, FILING, FILING).value()).toBeGreaterThan(0);
  });

  it('caps COLA vintage on the January-filing branch', () => {
    const r = recipient();
    // Filing in January past NRA grants full delayed credits immediately
    // (the monthIndex === 0 branch). A past December in that year should still
    // be capped below today's dollars.
    const janFiling = ym(2024, 0);
    const at = ym(2024, 11);
    expect(benefitOnDateNominal(r, janFiling, at).value()).toBeLessThan(
      benefitOnDate(r, janFiling, at).value()
    );
  });

  it('caps COLA vintage on the exactly-age-70 branch', () => {
    // Born June 1950 -> turns 70 in June 2020. Filing at exactly 70 grants full
    // credits even mid-year (the >= 70 branch); the nominal value for that same
    // year must still reflect only the COLAs in effect then.
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1950, 5, 15);
    r.earningsRecords = parsePaste(demo0);
    const filing = ym(2020, 5);
    const at = ym(2020, 7); // August 2020, same year as filing.
    expect(benefitOnDateNominal(r, filing, at).value()).toBeLessThan(
      benefitOnDate(r, filing, at).value()
    );
  });

  it('is a no-op for PIA-only recipients (no earnings history to unwind)', () => {
    const r = new Recipient();
    r.birthdate = BIRTHDATE;
    r.setPia(Money.from(2000));
    const at = ym(2025, 5); // A past month where an earnings recipient would differ.
    expect(benefitOnDateNominal(r, FILING, at).value()).toEqual(
      benefitOnDate(r, FILING, at).value()
    );
  });
});

/**
 * allBenefitsOnDateNominal applies the same historical-COLA-vintage rule to the
 * combined personal + spousal benefit shown on the spousal (combined) chart.
 */
describe('allBenefitsOnDateNominal (spousal)', () => {
  const BIRTHDATE = Birthdate.FromYMD(1956, 8, 29);
  // Both file at NRA (Jan 2023 for someone born in 1956), so the lower earner
  // receives an unreduced spousal top-up.
  const FILING = ym(2023, 0);

  function paste(annual: number): string {
    const lines: string[] = [];
    for (let year = 2024; year >= 1985; year--) {
      lines.push(`${year} $${annual} $${annual}`);
    }
    return lines.join('\n');
  }

  function earner(annual: number): Recipient {
    const r = new Recipient();
    r.birthdate = BIRTHDATE;
    r.earningsRecords = parsePaste(paste(annual));
    return r;
  }

  // Low earner gets a spousal top-up from the high earner.
  const lowEarner = () => earner(18000);
  const highEarner = () => earner(160000);

  it('has a positive spousal component for this fixture', () => {
    const low = lowEarner();
    const high = highEarner();
    const at = ym(constants.CURRENT_YEAR, 0);
    const combined = allBenefitsOnDate(low, high, FILING, FILING, at).value();
    const personalOnly = benefitOnDate(low, FILING, at).value();
    expect(combined).toBeGreaterThan(personalOnly);
  });

  it('equals allBenefitsOnDate for a current/future month', () => {
    const low = lowEarner();
    const high = highEarner();
    const at = ym(constants.CURRENT_YEAR, 0);
    expect(
      allBenefitsOnDateNominal(low, high, FILING, FILING, at).value()
    ).toEqual(allBenefitsOnDate(low, high, FILING, FILING, at).value());
  });

  it('shows a smaller (nominal) combined benefit for a past mid-year month', () => {
    const low = lowEarner();
    const high = highEarner();
    const at = ym(2025, 5); // June 2025: excludes the Dec-2025 COLA.
    expect(
      allBenefitsOnDateNominal(low, high, FILING, FILING, at).value()
    ).toBeLessThan(allBenefitsOnDate(low, high, FILING, FILING, at).value());
  });

  it('steps up the combined benefit at the December COLA effective date', () => {
    const low = lowEarner();
    const high = highEarner();
    const nov = allBenefitsOnDateNominal(
      low,
      high,
      FILING,
      FILING,
      ym(2025, 10)
    ).value();
    const dec = allBenefitsOnDateNominal(
      low,
      high,
      FILING,
      FILING,
      ym(2025, 11)
    ).value();
    expect(dec).toBeGreaterThan(nov);
  });

  it('caps the spousal component COLA vintage via throughColaYear', () => {
    const low = lowEarner();
    const high = highEarner();
    const at = ym(2025, 5);
    const today = spousalBenefitOnDate(low, high, FILING, FILING, at).value();
    const nominal = spousalBenefitOnDate(
      low,
      high,
      FILING,
      FILING,
      at,
      2024
    ).value();
    expect(today).toBeGreaterThan(0);
    expect(nominal).toBeLessThan(today);
  });

  it('caps COLA vintage in the combined-max branch (lower earner files after NRA)', () => {
    const low = lowEarner();
    const high = highEarner();
    // Lower earner files July 2024 (after their NRA of Jan 2023), entering the
    // combined-max branch where the personal benefit is subtracted from half
    // the higher earner's PIA. That personal benefit must also honor the COLA
    // cutoff (computed via benefitOnDateCore, not benefitOnDate).
    const lateFiling = ym(2024, 6);
    const at = ym(2025, 5);
    const today = spousalBenefitOnDate(
      low,
      high,
      FILING,
      lateFiling,
      at
    ).value();
    const nominal = spousalBenefitOnDate(
      low,
      high,
      FILING,
      lateFiling,
      at,
      2024
    ).value();
    expect(today).toBeGreaterThan(0);
    expect(nominal).toBeLessThan(today);
  });
});

describe('baseSpousalBenefit', () => {
  function piaOnly(pia: number): Recipient {
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1960, 0, 1);
    r.setPia(Money.from(pia));
    return r;
  }

  it('is 50% of the higher PIA minus the lower PIA when eligible', () => {
    // 50% of $2,000 = $1,000; minus $400 = $600.
    expect(baseSpousalBenefit(piaOnly(2000), piaOnly(400)).wholeDollars()).toBe(
      '$600'
    );
  });

  it('floors at $0 when half the higher PIA does not exceed the lower PIA', () => {
    expect(baseSpousalBenefit(piaOnly(2000), piaOnly(1000)).value()).toBe(0);
    expect(baseSpousalBenefit(piaOnly(2000), piaOnly(1500)).value()).toBe(0);
  });

  it('is positive exactly when eligibleForSpousalBenefit is true', () => {
    const higher = piaOnly(2000);
    const eligibleLower = piaOnly(400);
    const ineligibleLower = piaOnly(1200);
    expect(baseSpousalBenefit(higher, eligibleLower).value()).toBeGreaterThan(
      0
    );
    expect(eligibleForSpousalBenefit(eligibleLower, higher)).toBe(true);
    expect(baseSpousalBenefit(higher, ineligibleLower).value()).toBe(0);
    expect(eligibleForSpousalBenefit(ineligibleLower, higher)).toBe(false);
  });
});

/**
 * SSA applies the early-retirement reduction and delayed retirement credits to
 * the PIA as computed (to the dime), and only rounds the resulting monthly
 * benefit down to the dollar. See the worked examples in Appendix C of SSA's
 * Annual Statistical Supplement:
 * https://www.ssa.gov/policy/docs/statcomps/supplement/2024/apnc.html
 */
describe('benefitAtAge rounding', () => {
  const age = (years: number, months = 0) =>
    MonthDuration.initFromYearsMonths({ years, months });

  function withPia(pia: Money, birthdate: Birthdate): Recipient {
    const r = new Recipient();
    r.birthdate = birthdate;
    r.setPia(pia);
    return r;
  }

  // Born 2 Jan 1960: full retirement age 67, 8% per year delayed credits.
  const r = withPia(Money.fromCents(320090), Birthdate.FromYMD(1960, 0, 2));

  it('pays the PIA rounded down to the dollar at full retirement age', () => {
    expect(benefitAtAge(r, age(67)).wholeDollars()).toBe('$3,200');
  });

  it('applies delayed credits to the unrounded PIA', () => {
    // $3,200.90 x 1.24 = $3,969.11, not $3,200 x 1.24 = $3,968.
    expect(benefitAtAge(r, age(70)).wholeDollars()).toBe('$3,969');
  });

  it('applies the early reduction to the unrounded PIA', () => {
    // 24 months early: $3,200.90 x (1 - 24 x 5/900) = $2,774.11, not
    // $3,200 x (1 - 24 x 5/900) = $2,773.33.
    expect(benefitAtAge(r, age(65)).wholeDollars()).toBe('$2,774');
  });

  it("matches SSA's published examples", () => {
    // Early: PIA $1,640.90 at 62 with FRA 67 is $1,148.63, paid as $1,148.
    const early = withPia(
      Money.fromCents(164090),
      Birthdate.FromYMD(1962, 0, 2)
    );
    expect(benefitAtAge(early, age(62)).wholeDollars()).toBe('$1,148');

    // Delayed: born February 1957 (FRA 66y6m), claiming 5 months after FRA.
    // PIA $1,640.90 becomes $1,695.59, paid as $1,695.
    const delayed = withPia(
      Money.fromCents(164090),
      Birthdate.FromYMD(1957, 1, 15)
    );
    expect(benefitAtAge(delayed, age(66, 11)).wholeDollars()).toBe('$1,695');
  });

  // SSA truncates: an adjusted amount of $X.995 or more is still paid as $X,
  // never rounded up to the next cent and then the next dollar.
  it('truncates delayed amounts just below a whole dollar', () => {
    // $1,003.70 x (1 + 12 x 2/3%) = $1,083.996.
    const r = withPia(Money.fromCents(100370), Birthdate.FromYMD(1960, 0, 2));
    expect(benefitAtAge(r, age(68)).wholeDollars()).toBe('$1,083');
  });

  it('truncates early amounts just below a whole dollar', () => {
    // 57 months early: $1,000.70 x (1 - 36 x 5/9% - 21 x 5/12%) = $712.99875.
    const r = withPia(Money.fromCents(100070), Birthdate.FromYMD(1960, 0, 2));
    expect(benefitAtAge(r, age(62, 3)).wholeDollars()).toBe('$712');
  });
});

/**
 * Checks benefitAtAge against exact rational arithmetic for every filing
 * month from 62 to 70 and a run of dime PIAs, at each delayed retirement
 * credit rate. Floating-point shortcuts that round to the cent before the
 * dollar floor pay $1 too much on roughly 1 in 250 of these.
 */
describe('benefitAtAge matches exact SSA arithmetic', () => {
  // [birth year, FRA years, FRA months, annual delayed credit as n / 1000].
  const brackets: [number, number, number, bigint][] = [
    [1937, 65, 0, 65n],
    [1940, 65, 6, 70n],
    [1942, 65, 10, 75n],
    [1960, 67, 0, 80n],
  ];

  /** Exact benefit in whole dollars: floor(PIA x factor), factor = n / d. */
  function exactDollars(
    piaCents: number,
    fraMonths: number,
    ageMonths: number,
    annualPerMille: bigint
  ): bigint {
    let n: bigint;
    let d: bigint;
    if (ageMonths < fraMonths) {
      // 5/9 of 1% for the first 36 months, 5/12 of 1% for each month beyond.
      const k = fraMonths - ageMonths;
      const first = BigInt(Math.min(36, k));
      const beyond = BigInt(Math.max(0, k - 36));
      // 1 - first*5/900 - beyond*5/1200, over a common denominator of 3600.
      n = 3600n - first * 20n - beyond * 15n;
      d = 3600n;
    } else {
      // annualPerMille/1000 per year = annualPerMille/12000 per month.
      const m = BigInt(Math.min(ageMonths, 70 * 12) - fraMonths);
      n = 12000n + annualPerMille * m;
      d = 12000n;
    }
    return (BigInt(piaCents) * n) / (d * 100n);
  }

  it.each(brackets)('born %i', (year, fraYears, fraMonths, perMille) => {
    const fra = fraYears * 12 + fraMonths;
    const mismatches: string[] = [];
    for (let piaCents = 100000; piaCents <= 110000; piaCents += 10) {
      const r = withPiaCents(piaCents, Birthdate.FromYMD(year, 0, 2));
      for (let a = 62 * 12; a <= 70 * 12; a++) {
        const got = benefitAtAge(r, new MonthDuration(a)).cents();
        const want = Number(exactDollars(piaCents, fra, a, perMille)) * 100;
        if (got !== want)
          mismatches.push(`${piaCents}c @${a}m: ${got} != ${want}`);
      }
    }
    expect(mismatches.slice(0, 5)).toEqual([]);
  });

  function withPiaCents(cents: number, birthdate: Birthdate): Recipient {
    const r = new Recipient();
    r.birthdate = birthdate;
    r.setPia(Money.fromCents(cents));
    return r;
  }
});

describe('benefitCentsAtAge delayed credit rates', () => {
  it('accepts every rate in the full retirement age table', () => {
    // A rate that is not a whole number of tenths of a percent would throw
    // at runtime for that birth cohort; catch a bad constant here instead.
    for (const bracket of constants.FULL_RETIREMENT_AGE) {
      const fra = bracket.ageYears * 12 + bracket.ageMonths;
      expect(() =>
        benefitCentsAtAge(100000, fra, bracket.delayedIncreaseAnnual, 70 * 12)
      ).not.toThrow();
    }
  });

  it('rejects a rate that is not a whole number of tenths of a percent', () => {
    // The rate only matters at or after full retirement age.
    expect(() => benefitCentsAtAge(100000, 804, 0.0667, 816)).toThrow(
      /tenths of a percent/
    );
    // 12 months early: $1,000 x 3360/3600 = $933.33, paid as $933.
    expect(benefitCentsAtAge(100000, 804, 0.0667, 792)).toBe(93300);
  });
});
