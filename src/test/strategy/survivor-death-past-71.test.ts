/**
 * TDD test for survivor benefit bug: when the deceased dies after age 71
 * without having filed, survivorBenefit() incorrectly returns $0.
 *
 * SSA rule: delayed retirement credits accrue up to age 70. If someone
 * dies at 72+ without filing, the survivor benefit should be based on
 * the maximum delayed benefit (as if filed at 70), not $0.
 */
import { describe, expect, it } from 'vitest';
import { survivorBenefit } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

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

describe('survivorBenefit - deceased dies past age 71 without filing', () => {
  // For 1960+ births: NRA = 67y0m, delayed increase = 8%/year.
  // At age 70: benefit = PIA * 1.24 (36 months of delayed credits).
  // Credits do NOT accrue past age 70, so dying at 72 without filing
  // should yield the same survivor benefit as dying at 70.

  it('deceased dies at age 72 without filing - should get age-70 benefit, not $0', () => {
    const deceased = makeRecipient(1000, 1960, 0, 15); // Jan 15, 1960
    const survivor = makeRecipient(200, 1960, 0, 15);

    // Deceased dies at age 72 (never filed)
    const deathDate = deceased.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 72, months: 0 })
    );
    // Use death date as filing date to indicate "never filed"
    const deceasedFilingDate = deathDate;
    // Survivor files month after death (at survivor NRA or later)
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // Should be floor(PIA * 1.24) = floor($1000 * 1.24) = $1240
    // NOT $0 (which is the current buggy behavior)
    expect(result.cents()).toBeGreaterThan(0);
    expect(result.value()).toBe(1240);
  });

  it('deceased dies at age 75 without filing - should get age-70 benefit', () => {
    const deceased = makeRecipient(2000, 1965, 5, 15); // Jun 15, 1965
    const survivor = makeRecipient(500, 1965, 5, 15);

    const deathDate = deceased.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 75, months: 0 })
    );
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // floor($2000 * 1.24) = $2480
    expect(result.cents()).toBeGreaterThan(0);
    expect(result.value()).toBe(2480);
  });

  it('deceased dies at age 80 without filing - should get age-70 benefit', () => {
    const deceased = makeRecipient(1500, 1962, 2, 15); // Mar 15, 1962
    const survivor = makeRecipient(300, 1962, 2, 15);

    const deathDate = deceased.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 80, months: 0 })
    );
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // floor($1500 * 1.24) = $1860
    expect(result.cents()).toBeGreaterThan(0);
    expect(result.value()).toBe(1860);
  });

  it('deceased dies at exactly age 70 without filing - should still work (baseline)', () => {
    // This case already works - the death date equals age 70,
    // so benefitOnDate(deceased, age70, age71) should return the correct value.
    const deceased = makeRecipient(1000, 1960, 0, 15);
    const survivor = makeRecipient(200, 1960, 0, 15);

    const deathDate = deceased.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
    );
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    expect(result.value()).toBe(1240);
  });

  it('deceased dies at age 71y6m - credits should cap at age 70', () => {
    // Non-round age past 71. Credits should NOT continue past 70.
    const deceased = makeRecipient(1000, 1960, 0, 15);
    const survivor = makeRecipient(200, 1960, 0, 15);

    const deathDate = deceased.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 71, months: 6 })
    );
    const deceasedFilingDate = deathDate;
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      survivor,
      deceased,
      deceasedFilingDate,
      deathDate,
      survivorFilingDate
    );

    // Same as dying at 70: floor($1000 * 1.24) = $1240
    expect(result.value()).toBe(1240);
  });
});
