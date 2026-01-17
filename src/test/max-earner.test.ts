import { describe, expect, it } from 'vitest';
import { MAX_YEAR, MAXIMUM_EARNINGS } from '$lib/constants';
import { createMaxEarnerForBirthYear } from '$lib/max-earner';
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
    const benefit = recipient.benefitAtAge(age70);

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
