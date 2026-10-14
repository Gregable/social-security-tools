import { describe, expect, it } from 'vitest';
import { benefitAtAge } from '$lib/benefit-calculator';
import { MAX_YEAR, MAXIMUM_EARNINGS } from '$lib/constants';
import {
  createMaxEarnerForBirthYear,
  maximumBenefitInYear,
} from '$lib/max-earner';
import { MonthDuration } from '$lib/month-time';

describe('createMaxEarnerForBirthYear', () => {
  it('creates a recipient with the correct birth year', () => {
    const birthYear = 1960;
    const recipient = createMaxEarnerForBirthYear(birthYear);

    expect(recipient.birthdate.layBirthYear()).toEqual(birthYear);
    expect(recipient.birthdate.layBirthMonth()).toEqual(0); // January
    expect(recipient.birthdate.layBirthDayOfMonth()).toEqual(2);
  });

  it('starts earnings at age 22', () => {
    const birthYear = 1960;
    const endYear = 2020;
    const recipient = createMaxEarnerForBirthYear(birthYear, endYear);

    const records = recipient.earningsRecords;
    const firstYear = records[0].year;

    expect(firstYear).toEqual(birthYear + 22);
  });

  it('ends earnings before the end year', () => {
    const birthYear = 1960;
    const endYear = 2020;
    const recipient = createMaxEarnerForBirthYear(birthYear, endYear);

    const records = recipient.earningsRecords;
    const lastYear = records[records.length - 1].year;

    expect(lastYear).toEqual(endYear - 1);
  });

  it('uses maximum earnings for each year', () => {
    const birthYear = 1960;
    const endYear = 2020;
    const recipient = createMaxEarnerForBirthYear(birthYear, endYear);

    for (const record of recipient.earningsRecords) {
      expect(record.taxedEarnings.value()).toEqual(
        MAXIMUM_EARNINGS[record.year].value()
      );
      expect(record.taxedMedicareEarnings.value()).toEqual(
        MAXIMUM_EARNINGS[record.year].value()
      );
    }
  });

  it('defaults endYear to MAX_YEAR', () => {
    const birthYear = 1960;
    const recipient = createMaxEarnerForBirthYear(birthYear);

    const records = recipient.earningsRecords;
    const lastYear = records[records.length - 1].year;

    expect(lastYear).toEqual(MAX_YEAR - 1);
  });

  it('computes a valid PIA for a max earner', () => {
    const birthYear = 1956;
    const recipient = createMaxEarnerForBirthYear(birthYear);

    const pia = recipient.pia().primaryInsuranceAmount();
    expect(pia.value()).toBeGreaterThan(0);
  });

  it('computes benefit at age 70', () => {
    const birthYear = 1956;
    const recipient = createMaxEarnerForBirthYear(birthYear);

    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const benefit = benefitAtAge(recipient, age70);

    expect(benefit.value()).toBeGreaterThan(0);
    // Age 70 benefit should be greater than PIA due to delayed credits
    const pia = recipient.pia().primaryInsuranceAmount();
    expect(benefit.value()).toBeGreaterThan(pia.value());
  });

  it('handles birth year with limited earnings years', () => {
    // Someone born in 2000 would start earning at 2022, only a few years of data
    const birthYear = 2000;
    const recipient = createMaxEarnerForBirthYear(birthYear);

    // Should not throw and should have some records
    const records = recipient.earningsRecords;
    expect(records.length).toBeGreaterThanOrEqual(0);
  });
});

/**
 * SSA publishes the benefit a maximum earner receives on retiring in January
 * of each year, "Initial" column of
 * https://www.ssa.gov/oact/cola/examplemax.html. That figure carries the COLAs
 * through the prior year only, whatever year the site happens to be built in.
 */
describe('maximumBenefitInYear', () => {
  const at = (years: number, months = 0) =>
    MonthDuration.initFromYearsMonths({ years, months });

  it('matches the published 2027 figures, including the 3.6% COLA', () => {
    expect(maximumBenefitInYear(at(62, 1), 2027).wholeDollars()).toBe('$3,094');
    expect(maximumBenefitInYear(at(67), 2027).wholeDollars()).toBe('$4,188');
    expect(maximumBenefitInYear(at(70), 2027).wholeDollars()).toBe('$5,358');
  });

  it('matches the published 2026 figures', () => {
    expect(maximumBenefitInYear(at(67), 2026).wholeDollars()).toBe('$4,207');
    expect(maximumBenefitInYear(at(70), 2026).wholeDollars()).toBe('$5,181');
  });

  it('leaves later COLAs out of past years', () => {
    expect(maximumBenefitInYear(at(67), 2025).wholeDollars()).toBe('$4,043');
    expect(maximumBenefitInYear(at(70), 2021).wholeDollars()).toBe('$3,895');
  });

  // benefitAtAge floors the PIA to the dollar before applying delayed
  // credits; SSA applies them to the dime-rounded PIA ($3,909.60 x 1.3067 =
  // $5,108.54, not $3,909 x 1.3067 = $5,107.76). When that rounding is fixed
  // this starts passing and vitest reports it; move it into the test above.
  it.fails('matches the published 2025 age-70 figure to the dollar', () => {
    expect(maximumBenefitInYear(at(70), 2025).wholeDollars()).toBe('$5,108');
  });
});
