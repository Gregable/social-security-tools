/**
 * Regression tests for recipients who are already past age 70.
 *
 * Delayed retirement credits stop accruing at age 70, so someone older than
 * that has no filing decision left to make: the only thing they can do is file
 * now (SSA allows up to six months of retroactivity), and the amount is the
 * age-70 amount regardless of how long they waited.
 *
 * The optimizers used to encode the age-70 cap only as a loop bound
 * (`for (age = earliestFiling; age <= 70*12; age++)`). Once `earliestFiling`
 * passed 70 that range went empty or negative, which produced a nonsense
 * "file at age 0" result in the single optimizer and a
 * `RangeError: Invalid typed array length` in the couple optimizer. The couple
 * case surfaced on /strategy as "Could not compute results", which also hid the
 * still-meaningful filing decision of an under-70 spouse.
 */

import { describe, expect, it } from 'vitest';
import { benefitAtAge, survivorBenefit } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  expectedNPVCoupleOptimized,
  expectedNPVSingle,
} from '$lib/strategy/calculations/expected-npv';
import { optimalStrategyCoupleFast } from '$lib/strategy/calculations/optimal-strategy-fast';
import {
  earliestFiling,
  filingAgeRange,
  MAX_FILING_AGE,
  optimalStrategyCouple,
  optimalStrategySingle,
} from '$lib/strategy/calculations/strategy-calc';

function makeRecipient(piaDollars: number, birthYear: number): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(birthYear, 5, 15);
  r.setPia(Money.from(piaDollars));
  return r;
}

function age(years: number, months: number = 0): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

function monthDate(year: number, monthIndex: number): MonthDate {
  return MonthDate.initFromYearsMonths({ years: year, months: monthIndex });
}

/**
 * A flat death distribution over the ages a recipient could still reach. The
 * exact shape does not matter for these tests; what matters is that every
 * recipient has some probability mass at every remaining age.
 */
function flatDeathDistribution(
  fromAge: number
): { age: number; probability: number }[] {
  const dist: { age: number; probability: number }[] = [];
  const toAge = 119;
  for (let a = fromAge; a <= toAge; a++) {
    dist.push({ age: a, probability: 1 / (toAge - fromAge + 1) });
  }
  return dist;
}

// Born Jun 1948, so age 78 in Jun 2026. Well past any filing decision.
const OVER_70 = () => makeRecipient(2000, 1948);
// Born Jun 1962, so age 64 in Jun 2026. Still has a real decision to make.
const UNDER_70 = () => makeRecipient(1200, 1962);
const CURRENT_DATE = monthDate(2026, 5);
const DISCOUNT_RATE = 0.03;

describe('delayed retirement credits stop at age 70', () => {
  it('pays the same amount at 72 as at 70', () => {
    const r = makeRecipient(2000, 1948);
    expect(benefitAtAge(r, age(72)).cents()).toBe(
      benefitAtAge(r, age(70)).cents()
    );
  });

  it('pays the same amount at 70y1m as at 70y0m', () => {
    const r = makeRecipient(2000, 1948);
    expect(benefitAtAge(r, age(70, 1)).cents()).toBe(
      benefitAtAge(r, age(70)).cents()
    );
  });

  it('still credits every month up to 70', () => {
    const r = makeRecipient(2000, 1948);
    expect(benefitAtAge(r, age(70)).cents()).toBeGreaterThan(
      benefitAtAge(r, age(69, 11)).cents()
    );
  });
});

describe('survivor benefit when the deceased filed past 70', () => {
  // survivorBenefit reads the deceased's benefit at a date late enough for
  // every delayed credit to have landed. That date used to be a fixed age 71,
  // which is *before* the filing date of anyone who filed later — and
  // benefitOnDate returns $0 for a date before filing. The Math.max then fell
  // through to the 82.5%-of-PIA floor, understating the survivor benefit.
  it('is based on the age-70 benefit, not the 82.5% floor', () => {
    const deceased = makeRecipient(2000, 1948);
    const survivor = makeRecipient(1200, 1950);

    const filingDate = deceased.birthdate.dateAtSsaAge(age(77, 6));
    const deathDate = deceased.birthdate.dateAtLayAge(age(90));
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const benefit = survivorBenefit(
      survivor,
      deceased,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // The deceased's own benefit, with credits capped at 70, is the floor of
    // what the survivor receives — strictly more than 82.5% of PIA.
    const at70 = benefitAtAge(deceased, MAX_FILING_AGE);
    expect(benefit.cents()).toBe(at70.cents());
    expect(benefit.cents()).toBeGreaterThan(
      deceased.pia().primaryInsuranceAmount().times(0.825).cents()
    );
  });

  it('matches the age-70 case for a deceased who filed at exactly 70', () => {
    const deceased = makeRecipient(2000, 1948);
    const survivor = makeRecipient(1200, 1950);
    const deathDate = deceased.birthdate.dateAtLayAge(age(90));
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const filedAt70 = survivorBenefit(
      survivor,
      deceased,
      deceased.birthdate.dateAtSsaAge(MAX_FILING_AGE),
      deathDate,
      survivorFilingDate
    );
    const filedAt77 = survivorBenefit(
      survivor,
      deceased,
      deceased.birthdate.dateAtSsaAge(age(77, 6)),
      deathDate,
      survivorFilingDate
    );

    expect(filedAt77.cents()).toBe(filedAt70.cents());
  });
});

describe('filingAgeRange', () => {
  it('runs from the earliest filing age to 70 for an under-70 recipient', () => {
    const r = UNDER_70();
    const range = filingAgeRange(r, CURRENT_DATE);
    expect(range.earliest.asMonths()).toBe(
      earliestFiling(r, CURRENT_DATE).asMonths()
    );
    expect(range.latest.asMonths()).toBe(MAX_FILING_AGE.asMonths());
    expect(range.earliest.lessThan(range.latest)).toBe(true);
  });

  it('collapses to a single choice for an over-70 recipient', () => {
    const r = OVER_70();
    const range = filingAgeRange(r, CURRENT_DATE);
    const earliest = earliestFiling(r, CURRENT_DATE);
    expect(earliest.greaterThan(MAX_FILING_AGE)).toBe(true);
    expect(range.earliest.asMonths()).toBe(earliest.asMonths());
    expect(range.latest.asMonths()).toBe(earliest.asMonths());
  });

  it('reports whether a filing decision remains', () => {
    expect(filingAgeRange(UNDER_70(), CURRENT_DATE).hasChoice).toBe(true);
    expect(filingAgeRange(OVER_70(), CURRENT_DATE).hasChoice).toBe(false);
  });
});

describe('single optimizer past age 70', () => {
  it('recommends filing now rather than an impossible age 0', () => {
    const r = OVER_70();
    const finalDate = r.birthdate.dateAtLayAge(age(90));
    const [filingAge, npvCents] = optimalStrategySingle(
      r,
      finalDate,
      CURRENT_DATE,
      DISCOUNT_RATE
    );

    expect(filingAge.asMonths()).toBe(
      earliestFiling(r, CURRENT_DATE).asMonths()
    );
    expect(npvCents).toBeGreaterThan(0);
  });

  it('returns a non-empty expected-NPV ranking', () => {
    const r = OVER_70();
    const results = expectedNPVSingle(
      r,
      CURRENT_DATE,
      DISCOUNT_RATE,
      flatDeathDistribution(78)
    );

    expect(results.length).toBe(1);
    expect(results[0].filingAge.asMonths()).toBe(
      earliestFiling(r, CURRENT_DATE).asMonths()
    );
    expect(results[0].expectedNPVCents).toBeGreaterThan(0);
  });
});

describe('couple optimizer with one recipient past age 70', () => {
  it('computes a strategy instead of throwing', () => {
    const over = OVER_70();
    const under = UNDER_70();
    over.markFirst();
    under.markSecond();
    const recipients: [Recipient, Recipient] = [over, under];

    const [overFilingAge, underFilingAge, npvCents] = optimalStrategyCoupleFast(
      recipients,
      [
        over.birthdate.dateAtLayAge(age(90)),
        under.birthdate.dateAtLayAge(age(90)),
      ],
      CURRENT_DATE,
      DISCOUNT_RATE
    );

    expect(overFilingAge.asMonths()).toBe(
      earliestFiling(over, CURRENT_DATE).asMonths()
    );
    expect(underFilingAge.greaterThanOrEqual(age(62))).toBe(true);
    expect(underFilingAge.lessThanOrEqual(MAX_FILING_AGE)).toBe(true);
    expect(npvCents).toBeGreaterThan(0);
  });

  it('still optimizes the under-70 spouse across their whole range', () => {
    const over = OVER_70();
    const under = UNDER_70();
    over.markFirst();
    under.markSecond();
    const recipients: [Recipient, Recipient] = [over, under];

    const results = expectedNPVCoupleOptimized(
      recipients,
      CURRENT_DATE,
      DISCOUNT_RATE,
      [flatDeathDistribution(78), flatDeathDistribution(64)]
    );

    expect(results.length).toBeGreaterThan(0);
    const best = results[0];
    expect(best.expectedNPVCents).toBeGreaterThan(0);
    expect(best.filingAges[0].asMonths()).toBe(
      earliestFiling(over, CURRENT_DATE).asMonths()
    );

    // The under-70 spouse's filing age is the result of a real search: the
    // ranking must contain more than one distinct choice for them.
    const underAges = new Set(results.map((r) => r.filingAges[1].asMonths()));
    expect(underAges.size).toBeGreaterThan(1);
  });

  it('agrees with the slow reference implementation', () => {
    // The fast path is validated against optimalStrategyCouple by golden
    // tests. Past 70 is the case that used to diverge: the reference's loop
    // went empty while the fast path threw. Both must now agree.
    const over = OVER_70();
    const under = UNDER_70();
    over.markFirst();
    under.markSecond();
    const recipients: [Recipient, Recipient] = [over, under];
    const finalDates: [MonthDate, MonthDate] = [
      over.birthdate.dateAtLayAge(age(90)),
      under.birthdate.dateAtLayAge(age(88)),
    ];

    const fast = optimalStrategyCoupleFast(
      recipients,
      finalDates,
      CURRENT_DATE,
      DISCOUNT_RATE
    );
    const reference = optimalStrategyCouple(
      recipients,
      finalDates,
      CURRENT_DATE,
      DISCOUNT_RATE
    );

    expect(fast[0].asMonths()).toBe(reference[0].asMonths());
    expect(fast[1].asMonths()).toBe(reference[1].asMonths());
    // Within a cent, matching the tolerance the golden tests use: the two
    // implementations accumulate the same sum in a different order.
    expect(Math.abs(fast[2] - reference[2])).toBeLessThan(1);
  });

  it('handles both recipients being past 70', () => {
    const a = makeRecipient(2000, 1948);
    const b = makeRecipient(1200, 1950);
    a.markFirst();
    b.markSecond();
    const recipients: [Recipient, Recipient] = [a, b];

    const results = expectedNPVCoupleOptimized(
      recipients,
      CURRENT_DATE,
      DISCOUNT_RATE,
      [flatDeathDistribution(78), flatDeathDistribution(76)]
    );

    expect(results.length).toBe(1);
    expect(results[0].expectedNPVCents).toBeGreaterThan(0);
  });
});
