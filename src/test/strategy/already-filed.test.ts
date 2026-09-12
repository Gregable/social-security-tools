/**
 * Tests for the "already receiving benefits" input to the strategy optimizer.
 *
 * A spouse who has already filed has no filing decision left: their filing
 * age is a fact, not a variable. The optimizer pins that age and searches
 * only the other spouse's ages. These tests cover the eligibility and
 * validation rules, the collapsed filing range, and that every optimizer
 * entry point honours the pin and agrees with a brute-force search.
 */

import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { filingChoices } from '$lib/components/recommended-filing-card';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  isEligibleToHaveFiled,
  NOT_FILED,
  validateFiledMonth,
} from '$lib/strategy/calculations/already-filed';
import {
  expectedNPVCouple,
  expectedNPVCoupleOptimized,
} from '$lib/strategy/calculations/expected-npv';
import { optimalStrategyCoupleFast } from '$lib/strategy/calculations/optimal-strategy-fast';
import {
  filingAgeRange,
  optimalStrategyCouple,
  optimalStrategyCoupleOptimized,
  strategySumCentsCouple,
} from '$lib/strategy/calculations/strategy-calc';

function birthdate(year: number, monthIndex: number, day: number): Birthdate {
  return Birthdate.FromYMD(year, monthIndex, day);
}

function monthDate(year: number, monthIndex: number): MonthDate {
  return MonthDate.initFromYearsMonths({ years: year, months: monthIndex });
}

function makeRecipient(
  piaDollars: number,
  birthYear: number,
  birthMonthIndex: number,
  day: number = 15
): Recipient {
  const r = new Recipient();
  r.birthdate = birthdate(birthYear, birthMonthIndex, day);
  r.setPia(Money.from(piaDollars));
  return r;
}

/**
 * A flat death distribution from `fromAge` to 100. Shape does not matter;
 * every remaining age needs some probability mass.
 */
function flatDeathDistribution(
  fromAge: number
): { age: number; probability: number }[] {
  const ages: number[] = [];
  for (let a = fromAge; a <= 100; a++) ages.push(a);
  return ages.map((age) => ({ age, probability: 1 / ages.length }));
}

/**
 * Brute force: with recipient `pinnedIndex` fixed at `pinnedAge`, scan the
 * other recipient's full unpinned range and return the best pair.
 */
function bruteForcePinned(
  recipients: [Recipient, Recipient],
  finalDates: [MonthDate, MonthDate],
  currentDate: MonthDate,
  discountRate: number,
  pinnedIndex: 0 | 1,
  pinnedAge: MonthDuration
): [MonthDuration, MonthDuration, number] {
  const otherIndex = pinnedIndex === 0 ? 1 : 0;
  const other = filingAgeRange(recipients[otherIndex], currentDate);
  let best: [MonthDuration, MonthDuration, number] = [
    new MonthDuration(0),
    new MonthDuration(0),
    -1,
  ];
  for (let m = other.earliest.asMonths(); m <= other.latest.asMonths(); m++) {
    const strategy: [MonthDuration, MonthDuration] =
      pinnedIndex === 0
        ? [pinnedAge, new MonthDuration(m)]
        : [new MonthDuration(m), pinnedAge];
    const cents = strategySumCentsCouple(
      recipients,
      finalDates,
      currentDate,
      discountRate,
      strategy
    );
    if (cents > best[2]) best = [strategy[0], strategy[1], cents];
  }
  return best;
}

describe('isEligibleToHaveFiled', () => {
  // Born 15 March 1964: earliest filing month is the month after turning 62,
  // April 2026 (see earliestFilingMonth for the 1st/2nd-of-month rule).
  const bd = birthdate(1964, 2, 15);

  it('is false the month before the earliest filing month', () => {
    expect(isEligibleToHaveFiled(bd, monthDate(2026, 2))).toBe(false);
  });

  it('is true in the earliest filing month', () => {
    expect(isEligibleToHaveFiled(bd, monthDate(2026, 3))).toBe(true);
  });

  it('is true well past 62', () => {
    expect(isEligibleToHaveFiled(bd, monthDate(2040, 0))).toBe(true);
  });

  it('honours the 1st-of-month rule', () => {
    // Born on the 1st: earliest filing month is the birthday month itself.
    const first = birthdate(1964, 2, 1);
    expect(isEligibleToHaveFiled(first, monthDate(2026, 2))).toBe(true);
  });
});

describe('validateFiledMonth', () => {
  const bd = birthdate(1964, 2, 15);
  const now = monthDate(2030, 5);

  it('accepts the earliest filing month', () => {
    expect(validateFiledMonth(bd, monthDate(2026, 3), now)).toBeNull();
  });

  it('rejects the month before the earliest filing month', () => {
    expect(validateFiledMonth(bd, monthDate(2026, 2), now)).toMatch(
      /April 2026/
    );
  });

  it('accepts the current month', () => {
    expect(validateFiledMonth(bd, now, now)).toBeNull();
  });

  it('rejects next month', () => {
    expect(validateFiledMonth(bd, monthDate(2030, 6), now)).toMatch(/future/);
  });
});

describe('NOT_FILED', () => {
  it('is a pair of nulls', () => {
    expect(NOT_FILED).toEqual([null, null]);
  });
});

describe('filingAgeRange with a filed month', () => {
  // Born June 1960, filed at 64y3m (September 2024), now 66.
  const r = makeRecipient(2000, 1960, 5);
  const filedAt = monthDate(2024, 8);
  const now = monthDate(2026, 8);

  it('collapses to the filing age with no choice', () => {
    const range = filingAgeRange(r, now, filedAt);
    const expected = r.birthdate.ageAtSsaDate(filedAt);
    expect(range.earliest.asMonths()).toBe(expected.asMonths());
    expect(range.latest.asMonths()).toBe(expected.asMonths());
    expect(range.hasChoice).toBe(false);
  });

  it('hands out distinct instances for earliest and latest', () => {
    const range = filingAgeRange(r, now, filedAt);
    expect(range.earliest).not.toBe(range.latest);
  });

  it('is unchanged when filedAt is null', () => {
    const withNull = filingAgeRange(r, now, null);
    const without = filingAgeRange(r, now);
    expect(withNull.earliest.asMonths()).toBe(without.earliest.asMonths());
    expect(withNull.latest.asMonths()).toBe(without.latest.asMonths());
    expect(withNull.hasChoice).toBe(true);
  });

  it('rejects a filed month the person could not have filed in', () => {
    expect(() => filingAgeRange(r, now, monthDate(2020, 0))).toThrow(/age 62/);
  });

  it('rejects a filed month in the future', () => {
    expect(() => filingAgeRange(r, now, monthDate(2027, 0))).toThrow(/future/);
  });
});

describe('filingChoices with a filed spouse', () => {
  const a = makeRecipient(2000, 1960, 5);
  const b = makeRecipient(2500, 1963, 2);
  const now = monthDate(2026, 8);

  it('marks only the filed spouse as having no choice', () => {
    expect(filingChoices(a, b, now, [monthDate(2024, 8), null])).toEqual([
      false,
      true,
    ]);
    expect(filingChoices(a, b, now, [null, monthDate(2026, 0)])).toEqual([
      true,
      false,
    ]);
  });

  it('defaults to nobody filed', () => {
    expect(filingChoices(a, b, now)).toEqual([true, true]);
  });
});

describe('couple optimizers with a filed spouse', () => {
  // Alice, born June 1960, filed at 64y3m (September 2024). Bob, born March
  // 1963, has not filed. Today is September 2026.
  const alice = makeRecipient(2000, 1960, 5);
  const bob = makeRecipient(2600, 1963, 2);
  const recipients: [Recipient, Recipient] = [alice, bob];
  const now = monthDate(2026, 8);
  const filedAt = monthDate(2024, 8);
  const aliceFiledAge = alice.birthdate.ageAtSsaDate(filedAt);
  const alreadyFiled = [filedAt, null] as const;
  const finalDates: [MonthDate, MonthDate] = [
    alice.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: 84, months: 6 })
    ),
    bob.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: 88, months: 6 })
    ),
  ];
  const discountRate = 0.025;

  const expected = bruteForcePinned(
    recipients,
    finalDates,
    now,
    discountRate,
    0,
    aliceFiledAge
  );

  it('optimalStrategyCouple pins the filed spouse and matches brute force', () => {
    const [a, b, cents] = optimalStrategyCouple(
      recipients,
      finalDates,
      now,
      discountRate,
      alreadyFiled
    );
    expect(a.asMonths()).toBe(aliceFiledAge.asMonths());
    expect(b.asMonths()).toBe(expected[1].asMonths());
    expect(cents).toBe(expected[2]);
  });

  it('optimalStrategyCoupleOptimized matches brute force', () => {
    const [a, b, cents] = optimalStrategyCoupleOptimized(
      recipients,
      finalDates,
      now,
      discountRate,
      alreadyFiled
    );
    expect(a.asMonths()).toBe(aliceFiledAge.asMonths());
    expect(b.asMonths()).toBe(expected[1].asMonths());
    expect(cents).toBe(expected[2]);
  });

  it('optimalStrategyCoupleFast matches brute force to the cent', () => {
    const [a, b, cents] = optimalStrategyCoupleFast(
      recipients,
      finalDates,
      now,
      discountRate,
      alreadyFiled
    );
    expect(a.asMonths()).toBe(aliceFiledAge.asMonths());
    expect(b.asMonths()).toBe(expected[1].asMonths());
    expect(Math.abs(cents - expected[2])).toBeLessThanOrEqual(1);
  });

  it('pins the second spouse just as well', () => {
    const bobFiledAt = monthDate(2025, 5);
    const bobFiledAge = bob.birthdate.ageAtSsaDate(bobFiledAt);
    const want = bruteForcePinned(
      recipients,
      finalDates,
      now,
      discountRate,
      1,
      bobFiledAge
    );
    const [a, b, cents] = optimalStrategyCoupleFast(
      recipients,
      finalDates,
      now,
      discountRate,
      [null, bobFiledAt]
    );
    expect(b.asMonths()).toBe(bobFiledAge.asMonths());
    expect(a.asMonths()).toBe(want[0].asMonths());
    expect(Math.abs(cents - want[2])).toBeLessThanOrEqual(1);
  });

  it('a pinned age past the death date still yields a strategy', () => {
    // Alice dies at 63, before her recorded filing at 64y3m. The scenario is
    // odd but must not throw: Bob still has a decision.
    const early: [MonthDate, MonthDate] = [
      alice.birthdate.dateAtLayAge(
        MonthDuration.initFromYearsMonths({ years: 63, months: 6 })
      ),
      finalDates[1],
    ];
    const [a, , cents] = optimalStrategyCoupleFast(
      recipients,
      early,
      now,
      discountRate,
      alreadyFiled
    );
    expect(a.asMonths()).toBe(aliceFiledAge.asMonths());
    expect(cents).toBeGreaterThan(0);
  });
});

describe('expected NPV with a filed spouse', () => {
  const alice = makeRecipient(2000, 1960, 5);
  const bob = makeRecipient(2600, 1963, 2);
  const recipients: [Recipient, Recipient] = [alice, bob];
  const now = monthDate(2026, 8);
  const filedAt = monthDate(2024, 8);
  const aliceFiledAge = alice.birthdate.ageAtSsaDate(filedAt);
  const alreadyFiled = [filedAt, null] as const;
  const dists: [
    { age: number; probability: number }[],
    { age: number; probability: number }[],
  ] = [flatDeathDistribution(66), flatDeathDistribution(63)];

  it('returns one result per age of the unpinned spouse', () => {
    const results = expectedNPVCoupleOptimized(
      recipients,
      now,
      0.025,
      dists,
      alreadyFiled
    );
    const bobRange = filingAgeRange(bob, now);
    expect(results.length).toBe(
      bobRange.latest.asMonths() - bobRange.earliest.asMonths() + 1
    );
    for (const r of results) {
      expect(r.filingAges[0].asMonths()).toBe(aliceFiledAge.asMonths());
    }
  });

  it('optimized matches the exact reference for every pair', () => {
    const fast = expectedNPVCoupleOptimized(
      recipients,
      now,
      0.025,
      dists,
      alreadyFiled
    );
    const slow = expectedNPVCouple(recipients, now, 0.025, dists, alreadyFiled);
    expect(fast.length).toBe(slow.length);
    const key = (a: MonthDuration, b: MonthDuration) =>
      `${a.asMonths()}:${b.asMonths()}`;
    const slowByKey = new Map(
      slow.map((r) => [
        key(r.filingAges[0], r.filingAges[1]),
        r.expectedNPVCents,
      ])
    );
    for (const r of fast) {
      const want = slowByKey.get(key(r.filingAges[0], r.filingAges[1]));
      expect(want).toBeDefined();
      expect(
        Math.abs(r.expectedNPVCents - (want as number))
      ).toBeLessThanOrEqual(1);
    }
  });

  it('pinning inside the unpinned range does not change any pair value', () => {
    const unpinned = expectedNPVCoupleOptimized(recipients, now, 0.025, dists);
    const key = (a: MonthDuration, b: MonthDuration) =>
      `${a.asMonths()}:${b.asMonths()}`;
    const byKey = new Map(
      unpinned.map((r) => [
        key(r.filingAges[0], r.filingAges[1]),
        r.expectedNPVCents,
      ])
    );
    // Alice's unpinned range starts at her current age, above her real filing
    // age, so pin her at an age inside the unpinned range and compare.
    const insideAge = filingAgeRange(alice, now).earliest;
    const insideMonth = alice.birthdate.dateAtSsaAge(insideAge);
    const pinnedInside = expectedNPVCoupleOptimized(
      recipients,
      now,
      0.025,
      dists,
      [insideMonth, null]
    );
    expect(pinnedInside.length).toBeGreaterThan(0);
    for (const r of pinnedInside) {
      const want = byKey.get(key(r.filingAges[0], r.filingAges[1]));
      expect(want).toBeDefined();
      expect(r.expectedNPVCents).toBe(want);
    }
  });
});
