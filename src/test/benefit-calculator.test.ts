import { describe, expect, it } from 'vitest';
import {
  allBenefitsOnDate,
  allBenefitsOnDateNominal,
  benefitOnDate,
  benefitOnDateNominal,
  spousalBenefitOnDate,
} from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
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
