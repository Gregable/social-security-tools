import { describe, expect, it } from 'vitest';
import { benefitAtAge } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { BenefitType } from '$lib/strategy/calculations/benefit-period';
import type { LateSpouse } from '$lib/strategy/calculations/late-spouse';
import {
  ownFilingRange,
  strategySumCentsWidowed,
  strategySumPeriodsWidowed,
  survivorFilingRange,
  widowedSurvivorBenefit,
} from '$lib/strategy/calculations/widowed-benefits';

const month = (years: number, monthIndex: number) =>
  MonthDate.initFromYearsMonths({ years, months: monthIndex });
const age = (years: number, months: number) =>
  MonthDuration.initFromYearsMonths({ years, months });

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

const currentDate = month(2026, 9); // October 2026

// Died November 2025 at 61, before claiming: 100% of a $2,000 PIA, no limit.
const neverClaimed: LateSpouse = {
  recipient: makeRecipient(2000, 1964, 4, 10),
  deathDate: month(2025, 10),
  claim: { kind: 'none' },
};

// Claimed at 62 (January 2022), died June 2026: limit max($1,400, $1,650).
const claimedAt62: LateSpouse = {
  recipient: makeRecipient(2000, 1960, 0, 2),
  deathDate: month(2026, 5),
  claim: { kind: 'retirement', startedAt: month(2022, 0) },
};

function expectAge(actual: MonthDuration, expected: MonthDuration) {
  expect(actual.toFullAgeString()).toBe(expected.toFullAgeString());
}

describe('survivorFilingRange', () => {
  it('runs from 60 to survivor FRA for a survivor not yet 60', () => {
    // Born 15 Mar 1968: 58y7m in October 2026, survivor FRA 67.
    const survivor = makeRecipient(1500, 1968, 2, 15);
    const range = survivorFilingRange(
      survivor,
      neverClaimed,
      currentDate,
      null
    );
    expectAge(range.earliest, age(60, 0));
    expectAge(range.latest, age(67, 0));
    expect(range.hasChoice).toBe(true);
  });

  it('starts now, with no backdating, for a survivor between 60 and FRA', () => {
    // Born 15 Mar 1964: 62y7m now. A backdated claim before survivor FRA
    // would add age reduction, so SSA does not allow it.
    const survivor = makeRecipient(1500, 1964, 2, 15);
    const range = survivorFilingRange(
      survivor,
      neverClaimed,
      currentDate,
      null
    );
    expectAge(range.earliest, age(62, 7));
    expectAge(range.latest, age(67, 0));
    expect(range.hasChoice).toBe(true);
  });

  it('stops where the widow(er)s limit caps the benefit', () => {
    // $2,000 x (0.715 + 0.285 x m/84) first reaches the $1,650 limit at
    // m = 33 months past 60. Waiting longer only forgoes payments.
    const survivor = makeRecipient(1500, 1968, 2, 15);
    const range = survivorFilingRange(survivor, claimedAt62, currentDate, null);
    expectAge(range.earliest, age(60, 0));
    expectAge(range.latest, age(62, 9));
    expect(range.hasChoice).toBe(true);
  });

  it('backdates up to six months once the limit already caps the benefit', () => {
    // Born 15 Mar 1962: 64y7m now, capped from the death month (64y3m) on.
    // SSA pays up to six months back when the limit sets the amount, but
    // not before the death (GN 00204.030 D.2.b).
    const survivor = makeRecipient(1500, 1962, 2, 15);
    const range = survivorFilingRange(survivor, claimedAt62, currentDate, null);
    expectAge(range.earliest, age(64, 3));
    expectAge(range.latest, age(64, 3));
    expect(range.hasChoice).toBe(false);
  });

  it('backdates up to six months, not before FRA, past survivor FRA', () => {
    // Born 15 Mar 1957: survivor FRA 66y2m; 69y7m now. Spouse died January
    // 2026 (68y10m), so six months back (69y1m) is the binding limit.
    const survivor = makeRecipient(1500, 1957, 2, 15);
    const spouse: LateSpouse = { ...neverClaimed, deathDate: month(2026, 0) };
    const range = survivorFilingRange(survivor, spouse, currentDate, null);
    expectAge(range.earliest, age(69, 1));
    expectAge(range.latest, age(69, 1));
    expect(range.hasChoice).toBe(false);
  });

  it('is the actual start age once survivor benefits have started', () => {
    const survivor = makeRecipient(1500, 1964, 2, 15);
    const range = survivorFilingRange(
      survivor,
      neverClaimed,
      currentDate,
      month(2025, 11)
    );
    expectAge(range.earliest, age(61, 9));
    expectAge(range.latest, age(61, 9));
    expect(range.hasChoice).toBe(false);
  });

  it('refuses a start month the form would reject', () => {
    const survivor = makeRecipient(1500, 1964, 2, 15);
    expect(() =>
      survivorFilingRange(survivor, neverClaimed, currentDate, month(2025, 9))
    ).toThrow(/invalid survivor start month/);
  });
});

describe('ownFilingRange', () => {
  it('matches filingAgeRange for someone with their own benefit', () => {
    const survivor = makeRecipient(1500, 1968, 2, 15);
    const range = ownFilingRange(survivor, currentDate, null);
    expectAge(range.earliest, age(62, 1));
    expectAge(range.latest, age(70, 0));
    expect(range.hasChoice).toBe(true);
  });

  it('has no choice when there is no benefit on their own record', () => {
    const survivor = makeRecipient(0, 1968, 2, 15);
    const range = ownFilingRange(survivor, currentDate, null);
    expectAge(range.latest, range.earliest);
    expect(range.hasChoice).toBe(false);
  });
});

describe('widowedSurvivorBenefit', () => {
  it('reduces 100% of PIA for age when the spouse never claimed', () => {
    const survivor = makeRecipient(1500, 1968, 2, 15);
    const at60 = survivor.birthdate.dateAtSsaAge(age(60, 0));
    expect(widowedSurvivorBenefit(survivor, neverClaimed, at60).value()).toBe(
      1430
    );
  });

  it('caps at the widow(er)s limit when the spouse claimed early', () => {
    const survivor = makeRecipient(1500, 1968, 2, 15);
    const at63 = survivor.birthdate.dateAtSsaAge(age(63, 0));
    // $2,000 x 0.837143 = $1,674.29, over the $1,650 limit.
    expect(widowedSurvivorBenefit(survivor, claimedAt62, at63).value()).toBe(
      1650
    );
  });
});

describe('strategySumPeriodsWidowed', () => {
  // Born 15 Mar 1968: SSA birth month March 1968.
  const survivor = makeRecipient(2000, 1968, 2, 15);
  const finalDate = survivor.birthdate.dateAtSsaAge(age(85, 0));
  const dateAt = (a: MonthDuration) => survivor.birthdate.dateAtSsaAge(a);

  it('pays the survivor benefit first, then switches to the larger own benefit', () => {
    const periods = strategySumPeriodsWidowed(
      survivor,
      neverClaimed,
      finalDate,
      {
        survivorStart: age(60, 0),
        ownStart: age(70, 0),
      }
    );
    expect(periods.map((p) => p.benefitType)).toEqual([
      BenefitType.Survivor,
      BenefitType.Personal,
    ]);
    expect(periods[0].startDate.toString()).toBe(dateAt(age(60, 0)).toString());
    expect(periods[0].endDate.toString()).toBe(dateAt(age(69, 11)).toString());
    expect(periods[0].amount.value()).toBe(1430);
    expect(periods[1].startDate.toString()).toBe(dateAt(age(70, 0)).toString());
    expect(periods[1].endDate.toString()).toBe(finalDate.toString());
    expect(periods[1].amount.value()).toBe(2480);
  });

  it('pays the own benefit first, then switches to the unreduced survivor benefit', () => {
    const lowEarner = makeRecipient(1000, 1968, 2, 15);
    const periods = strategySumPeriodsWidowed(
      lowEarner,
      neverClaimed,
      finalDate,
      {
        survivorStart: age(67, 0),
        ownStart: age(62, 1),
      }
    );
    expect(periods.map((p) => p.benefitType)).toEqual([
      BenefitType.Personal,
      BenefitType.Survivor,
    ]);
    expect(periods[0].amount.value()).toBe(
      benefitAtAge(lowEarner, age(62, 1)).value()
    );
    expect(periods[0].endDate.toString()).toBe(dateAt(age(66, 11)).toString());
    expect(periods[1].startDate.toString()).toBe(dateAt(age(67, 0)).toString());
    expect(periods[1].amount.value()).toBe(2000);
  });

  it('keeps paying the survivor benefit while it exceeds a smaller own benefit', () => {
    // Own benefit at 62y1m ($1,408) never exceeds the survivor benefit at
    // 60 ($1,430), so claiming it changes nothing.
    const periods = strategySumPeriodsWidowed(
      survivor,
      neverClaimed,
      finalDate,
      {
        survivorStart: age(60, 0),
        ownStart: age(62, 1),
      }
    );
    expect(periods).toHaveLength(1);
    expect(periods[0].benefitType).toBe(BenefitType.Survivor);
    expect(periods[0].endDate.toString()).toBe(finalDate.toString());
  });

  it('follows the own benefit through the January after a late, mid-year claim', () => {
    // Claiming at 68y5m (August 2036) pays credits only through January
    // 2036 until January 2037, when the rest arrive. The survivor benefit
    // fills the gap if it is larger than the filing-year amount.
    const midEarner = makeRecipient(1300, 1968, 2, 15);
    const periods = strategySumPeriodsWidowed(
      midEarner,
      neverClaimed,
      finalDate,
      {
        survivorStart: age(60, 0),
        ownStart: age(68, 5),
      }
    );
    const filingYear = benefitAtAge(midEarner, age(67, 10)).value(); // Jan 2036
    const full = benefitAtAge(midEarner, age(68, 5)).value();
    expect(filingYear).toBeLessThan(1430);
    expect(full).toBeGreaterThan(1430);
    expect(periods.map((p) => p.benefitType)).toEqual([
      BenefitType.Survivor,
      BenefitType.Personal,
    ]);
    expect(periods[1].startDate.toString()).toBe(month(2037, 0).toString());
    expect(periods[1].amount.value()).toBe(full);
  });

  it('stops at the death month', () => {
    const early = survivor.birthdate.dateAtSsaAge(age(65, 0));
    const periods = strategySumPeriodsWidowed(survivor, neverClaimed, early, {
      survivorStart: age(60, 0),
      ownStart: age(70, 0),
    });
    expect(periods).toHaveLength(1);
    expect(periods[0].endDate.toString()).toBe(early.toString());
  });

  it('has no own-benefit periods for someone with no own record', () => {
    const noRecord = makeRecipient(0, 1968, 2, 15);
    const periods = strategySumPeriodsWidowed(
      noRecord,
      neverClaimed,
      finalDate,
      {
        survivorStart: age(64, 0),
        ownStart: age(62, 1),
      }
    );
    expect(periods.map((p) => p.benefitType)).toEqual([BenefitType.Survivor]);
  });
});

describe('strategySumCentsWidowed', () => {
  it('sums every monthly payment with no discount', () => {
    const survivor = makeRecipient(2000, 1968, 2, 15);
    const finalDate = survivor.birthdate.dateAtSsaAge(age(85, 0));
    const npv = strategySumCentsWidowed(
      survivor,
      neverClaimed,
      finalDate,
      currentDate,
      0,
      { survivorStart: age(60, 0), ownStart: age(70, 0) }
    );
    // 120 months of $1,430, then 70y0m through 85y0m inclusive: 181 months
    // of $2,480.
    expect(npv).toBe((120 * 1430 + 181 * 2480) * 100);
  });
});
