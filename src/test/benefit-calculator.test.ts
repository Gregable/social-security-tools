import { describe, expect, it } from 'vitest';
import { benefitOnDate, benefitOnDateNominal } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { MonthDate } from '$lib/month-time';
import demo0 from '$lib/pastes/averagepaste.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';

import * as constants from '../lib/constants';

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
  const FILING = MonthDate.initFromYearsMonths({ years: 2024, months: 6 });

  function recipient(): Recipient {
    const r = new Recipient();
    r.birthdate = BIRTHDATE;
    r.earningsRecords = parsePaste(demo0);
    return r;
  }

  const ym = (years: number, months: number) =>
    MonthDate.initFromYearsMonths({ years, months });

  it('equals benefitOnDate for a current/future month (no future COLA assumed)', () => {
    const r = recipient();
    // January of the current year is at/after the most recently applied COLA,
    // so the nominal vintage matches today's dollars exactly.
    const at = ym(constants.CURRENT_YEAR, 0);
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

  it('never exceeds the today’s-dollars value', () => {
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
    // And December's nominal value reaches today's dollars (most recent COLA).
    expect(dec2025).toEqual(benefitOnDate(r, FILING, ym(2025, 11)).value());
  });

  it('applies delayed retirement credits the January after filing, independent of COLA', () => {
    const r = recipient();
    // Dec 2024 and Jan 2025 share the same COLA vintage (2024's COLA, effective
    // Dec 2024), so any increase between them is purely the delayed-credit jump.
    const dec2024 = benefitOnDateNominal(r, FILING, ym(2024, 11)).value();
    const jan2025 = benefitOnDateNominal(r, FILING, ym(2025, 0)).value();
    expect(jan2025).toBeGreaterThan(dec2024);
  });

  it('returns zero before the filing date', () => {
    const r = recipient();
    expect(benefitOnDateNominal(r, FILING, ym(2024, 5)).value()).toEqual(0);
  });
});
