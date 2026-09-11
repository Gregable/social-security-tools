import { describe, expect, it } from 'vitest';
import { filedBeforeDeath, survivorBenefit } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

/**
 * A filing month at or after the death month is not a filing at all. The
 * survivor rules already treat it that way; these tests pin that boundary and
 * the predicate the UI uses to label such a strategy "does not file".
 */

function makeRecipient(
  piaDollars: number,
  year: number,
  monthIndex: number,
  day: number
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(year, monthIndex, day);
  r.setPia(Money.from(piaDollars));
  return r;
}

const age = (years: number, months: number) =>
  MonthDuration.initFromYearsMonths({ years, months });

describe('filedBeforeDeath', () => {
  const death = MonthDate.initFromYearsMonths({ years: 2029, months: 0 });

  it('is true for a filing month before the death month', () => {
    const filing = death.subtractDuration(new MonthDuration(1));
    expect(filedBeforeDeath(filing, death)).toBe(true);
  });

  it('is false for a filing month equal to the death month', () => {
    expect(filedBeforeDeath(death, death)).toBe(false);
  });

  it('is false for a filing month after the death month', () => {
    const filing = death.addDuration(new MonthDuration(1));
    expect(filedBeforeDeath(filing, death)).toBe(false);
  });
});

describe('survivor base at the filing-month boundary', () => {
  // Earner born July 2, 1965 (FRA 67), dies Jan 2029 at 63y6m, before FRA.
  // Survivor born April 2, 1966 with a small PIA.
  const deceased = makeRecipient(2547, 1965, 6, 2);
  const survivor = makeRecipient(599, 1966, 3, 2);
  const deathDate = deceased.birthdate.dateAtLayAge(age(63, 6));
  // Survivor claims at their own full retirement age so no age reduction
  // applies and the base amount is observable directly.
  const survivorFilingDate = survivor.birthdate.dateAtSsaAge(
    survivor.survivorNormalRetirementAge()
  );

  it('filing one month before death caps the survivor at 82.5% of PIA', () => {
    const filingDate = deathDate.subtractDuration(new MonthDuration(1));
    expect(filedBeforeDeath(filingDate, deathDate)).toBe(true);

    const result = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );
    const ribLim = Money.from(2547).times(0.825).floorToDollar();
    expect(result.cents()).toBe(ribLim.cents());
  });

  it('filing in the death month is no filing: survivor gets full PIA', () => {
    expect(filedBeforeDeath(deathDate, deathDate)).toBe(false);

    const result = survivorBenefit(
      survivor,
      deceased,
      deathDate,
      deathDate,
      survivorFilingDate
    );
    expect(result.cents()).toBe(Money.from(2547).cents());
  });
});
