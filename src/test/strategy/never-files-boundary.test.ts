import { describe, expect, it } from 'vitest';
import {
  benefitAtAge,
  filedBeforeDeath,
  survivorBenefit,
} from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { optimalStrategyCoupleOptimized } from '$lib/strategy/calculations/strategy-calc';

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

describe('survivor base at the filing-month boundary after FRA', () => {
  // Earner born July 2, 1960 (FRA 67). Survivor claims at their own FRA so
  // the base amount is observable directly.
  const deceased = makeRecipient(2000, 1960, 6, 2);
  const survivor = makeRecipient(300, 1962, 3, 2);
  const survivorFilingDate = survivor.birthdate.dateAtSsaAge(
    survivor.survivorNormalRetirementAge()
  );

  it('dying at 68y6m: previous-month filing vs death-month filing differ by one month of credits', () => {
    const deathDate = deceased.birthdate.dateAtLayAge(age(68, 6));
    const previousMonth = deathDate.subtractDuration(new MonthDuration(1));

    const filed = survivorBenefit(
      survivor,
      deceased,
      previousMonth,
      deathDate,
      survivorFilingDate
    );
    const neverFiled = survivorBenefit(
      survivor,
      deceased,
      deathDate,
      deathDate,
      survivorFilingDate
    );

    // Both exceed the 82.5% floor, so the filed branch reads the deceased's
    // actual benefit and the never-filed branch reads it as if filed at death.
    expect(filed.cents()).toBe(benefitAtAge(deceased, age(68, 5)).cents());
    expect(neverFiled.cents()).toBe(benefitAtAge(deceased, age(68, 6)).cents());
    expect(neverFiled.cents()).toBeGreaterThan(filed.cents());
  });

  it('dying past 70: both branches agree on the age-70 benefit', () => {
    const deathDate = deceased.birthdate.dateAtLayAge(age(72, 0));
    const previousMonth = deathDate.subtractDuration(new MonthDuration(1));
    // The survivor is past their own FRA by then, so claiming the month after
    // death carries no age reduction.
    const claimAfterDeath = deathDate.addDuration(new MonthDuration(1));

    const filed = survivorBenefit(
      survivor,
      deceased,
      previousMonth,
      deathDate,
      claimAfterDeath
    );
    const neverFiled = survivorBenefit(
      survivor,
      deceased,
      deathDate,
      deathDate,
      claimAfterDeath
    );

    const atAge70 = benefitAtAge(deceased, age(70, 0));
    expect(filed.cents()).toBe(atAge70.cents());
    expect(neverFiled.cents()).toBe(atAge70.cents());
  });
});

describe('the optimizer represents "never files" as a death-month filing', () => {
  // The display components derive the "does not file" label from the
  // optimizer's output through filedBeforeDeath. These pin that contract.
  const currentDate = MonthDate.initFromYearsMonths({ years: 2026, months: 8 });

  it('a high earner dying early before FRA never files, so the survivor keeps full PIA', () => {
    const earner = makeRecipient(2500, 1965, 6, 2);
    const dependent = makeRecipient(300, 1966, 3, 2);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      earner.birthdate.dateAtLayAge(age(64, 0)),
      dependent.birthdate.dateAtLayAge(age(90, 0)),
    ];

    const [earnerAge] = optimalStrategyCoupleOptimized(
      recipients,
      finalDates,
      currentDate,
      0.03
    );
    expect(
      filedBeforeDeath(earner.birthdate.dateAtSsaAge(earnerAge), finalDates[0])
    ).toBe(false);
  });

  it('a recipient dying before the earliest filing age is clamped to an age past death', () => {
    const earner = makeRecipient(2500, 1966, 6, 2);
    const dependent = makeRecipient(300, 1966, 3, 2);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      earner.birthdate.dateAtLayAge(age(61, 0)),
      dependent.birthdate.dateAtLayAge(age(90, 0)),
    ];

    const [earnerAge] = optimalStrategyCoupleOptimized(
      recipients,
      finalDates,
      currentDate,
      0.03
    );
    expect(
      filedBeforeDeath(earner.birthdate.dateAtSsaAge(earnerAge), finalDates[0])
    ).toBe(false);
  });
});

describe('first-of-month birthdays', () => {
  // SSA treats a person as attaining an age the day before their birthday,
  // so for someone born on the 1st the SSA age is a month ahead of the lay
  // age. Display sites derive filing dates from SSA ages and death dates from
  // lay ages; the round trip through ageAtSsaDate must land on the death
  // month exactly.
  const recipient = makeRecipient(1000, 1960, 0, 1);
  const deathDate = recipient.birthdate.dateAtLayAge(age(70, 6));

  it('the SSA age at the death date maps back to the death month', () => {
    const deathAgeSsa = recipient.birthdate.ageAtSsaDate(deathDate);
    expect(recipient.birthdate.dateAtSsaAge(deathAgeSsa).toString()).toBe(
      deathDate.toString()
    );
    expect(
      filedBeforeDeath(recipient.birthdate.dateAtSsaAge(deathAgeSsa), deathDate)
    ).toBe(false);
  });

  it('one SSA month earlier is a real filing', () => {
    const oneMonthEarlier = recipient.birthdate
      .ageAtSsaDate(deathDate)
      .subtract(new MonthDuration(1));
    expect(
      filedBeforeDeath(
        recipient.birthdate.dateAtSsaAge(oneMonthEarlier),
        deathDate
      )
    ).toBe(true);
  });
});
