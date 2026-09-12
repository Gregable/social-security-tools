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

  it('draws the boundary between the 2nd and the 3rd of the month', () => {
    // SSA treats a birthday on the 1st or 2nd as attained in the previous
    // month, so the 2nd is eligible in the birthday month and the 3rd is not.
    expect(
      isEligibleToHaveFiled(birthdate(1964, 2, 2), monthDate(2026, 2))
    ).toBe(true);
    expect(
      isEligibleToHaveFiled(birthdate(1964, 2, 3), monthDate(2026, 2))
    ).toBe(false);
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

  it('accepts the birthday month for the 1st and 2nd but not the 3rd', () => {
    const birthdayMonth = monthDate(2026, 2);
    expect(
      validateFiledMonth(birthdate(1964, 2, 1), birthdayMonth, now)
    ).toBeNull();
    expect(
      validateFiledMonth(birthdate(1964, 2, 2), birthdayMonth, now)
    ).toBeNull();
    expect(
      validateFiledMonth(birthdate(1964, 2, 3), birthdayMonth, now)
    ).toMatch(/April 2026/);
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

  it('honours the filed month with no spouse', () => {
    expect(filingChoices(a, null, now, [monthDate(2024, 8), null])).toEqual([
      false,
      true,
    ]);
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
    for (const optimize of [
      optimalStrategyCouple,
      optimalStrategyCoupleOptimized,
      optimalStrategyCoupleFast,
    ]) {
      const [a, , cents] = optimize(
        recipients,
        early,
        now,
        discountRate,
        alreadyFiled
      );
      expect(a.asMonths()).toBe(aliceFiledAge.asMonths());
      expect(cents).toBeGreaterThan(0);
    }
  });

  it('filed exactly in the current month agrees with brute force', () => {
    const nowAge = alice.birthdate.ageAtSsaDate(now);
    const want = bruteForcePinned(
      recipients,
      finalDates,
      now,
      discountRate,
      0,
      nowAge
    );
    for (const optimize of [
      optimalStrategyCouple,
      optimalStrategyCoupleOptimized,
      optimalStrategyCoupleFast,
    ]) {
      const [a, b, cents] = optimize(
        recipients,
        finalDates,
        now,
        discountRate,
        [now, null]
      );
      expect(a.asMonths()).toBe(nowAge.asMonths());
      expect(b.asMonths()).toBe(want[1].asMonths());
      expect(Math.abs(cents - want[2])).toBeLessThanOrEqual(1);
    }
  });

  it('both filed reduces to a single strategy sum', () => {
    const bobFiledAt = monthDate(2025, 5);
    const bobFiledAge = bob.birthdate.ageAtSsaDate(bobFiledAt);
    const bothFiled = [filedAt, bobFiledAt] as const;
    const want = strategySumCentsCouple(
      recipients,
      finalDates,
      now,
      discountRate,
      [aliceFiledAge, bobFiledAge]
    );
    for (const optimize of [
      optimalStrategyCouple,
      optimalStrategyCoupleOptimized,
      optimalStrategyCoupleFast,
    ]) {
      const [a, b, cents] = optimize(
        recipients,
        finalDates,
        now,
        discountRate,
        bothFiled
      );
      expect(a.asMonths()).toBe(aliceFiledAge.asMonths());
      expect(b.asMonths()).toBe(bobFiledAge.asMonths());
      expect(Math.abs(cents - want)).toBeLessThanOrEqual(1);
    }
    const results = expectedNPVCoupleOptimized(
      recipients,
      now,
      discountRate,
      [flatDeathDistribution(66), flatDeathDistribution(63)],
      bothFiled
    );
    expect(results.length).toBe(1);
    expect(results[0].filingAges[0].asMonths()).toBe(aliceFiledAge.asMonths());
    expect(results[0].filingAges[1].asMonths()).toBe(bobFiledAge.asMonths());
  });
});

describe('a zero-PIA dependent who has already filed', () => {
  // Alice has no record of her own and filed at 64y3m (September 2024),
  // before Bob, the earner, has filed. The optimizers normally bump a
  // zero-PIA dependent's reported age up to the earner's filing month, since
  // every earlier age scores the same; a recorded month must stay put.
  const alice = makeRecipient(0, 1960, 5);
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
  const want = bruteForcePinned(
    recipients,
    finalDates,
    now,
    discountRate,
    0,
    aliceFiledAge
  );

  it.each([
    ['optimalStrategyCouple', optimalStrategyCouple],
    ['optimalStrategyCoupleOptimized', optimalStrategyCoupleOptimized],
    ['optimalStrategyCoupleFast', optimalStrategyCoupleFast],
  ])('%s reports the recorded filing age', (_name, optimize) => {
    const [a, b, cents] = optimize(
      recipients,
      finalDates,
      now,
      discountRate,
      alreadyFiled
    );
    expect(a.asMonths()).toBe(aliceFiledAge.asMonths());
    expect(b.asMonths()).toBe(want[1].asMonths());
    expect(Math.abs(cents - want[2])).toBeLessThanOrEqual(1);
  });
});

describe('a spouse who filed past 70', () => {
  // Carol, born June 1954, filed at 71y0m (June 2025). Delayed credits stop
  // at 70, so her benefit is the age-70 amount; the optimizers must report
  // her actual filing age, not 70.
  const carol = makeRecipient(2000, 1954, 5);
  const bob = makeRecipient(2600, 1963, 2);
  const recipients: [Recipient, Recipient] = [carol, bob];
  const now = monthDate(2026, 8);
  const age71 = MonthDuration.initFromYearsMonths({ years: 71, months: 0 });
  const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
  const filedAt = carol.birthdate.dateAtSsaAge(age71);
  const alreadyFiled = [filedAt, null] as const;
  const finalDates: [MonthDate, MonthDate] = [
    carol.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: 88, months: 6 })
    ),
    bob.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: 88, months: 6 })
    ),
  ];
  const discountRate = 0.025;

  it('collapses the filing range to 852 months', () => {
    const range = filingAgeRange(carol, now, filedAt);
    expect(range.earliest.asMonths()).toBe(852);
    expect(range.latest.asMonths()).toBe(852);
    expect(range.hasChoice).toBe(false);
  });

  it('every optimizer reports 852 and scores it as filing at 70', () => {
    const want = bruteForcePinned(
      recipients,
      finalDates,
      now,
      discountRate,
      0,
      age70
    );
    for (const optimize of [
      optimalStrategyCouple,
      optimalStrategyCoupleOptimized,
      optimalStrategyCoupleFast,
    ]) {
      const [a, b, cents] = optimize(
        recipients,
        finalDates,
        now,
        discountRate,
        alreadyFiled
      );
      expect(a.asMonths()).toBe(852);
      expect(b.asMonths()).toBe(want[1].asMonths());
      expect(Math.abs(cents - want[2])).toBeLessThanOrEqual(1);
    }
  });

  it('expected NPV reports 852 for every pair', () => {
    const results = expectedNPVCoupleOptimized(
      recipients,
      now,
      discountRate,
      [flatDeathDistribution(73), flatDeathDistribution(64)],
      alreadyFiled
    );
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.filingAges[0].asMonths()).toBe(852);
    }
  });
});

describe('one spouse filed and the other past 70y6m', () => {
  // Dan, born January 1955, is 71y8m in September 2026 and has not filed;
  // his range collapses on its own. Alice filed in September 2024.
  const alice = makeRecipient(2000, 1960, 5);
  const dan = makeRecipient(2600, 1955, 0);
  const recipients: [Recipient, Recipient] = [alice, dan];
  const now = monthDate(2026, 8);
  const filedAt = monthDate(2024, 8);
  const alreadyFiled = [filedAt, null] as const;

  it('both ranges collapse and expected NPV has exactly one result', () => {
    const aliceRange = filingAgeRange(alice, now, filedAt);
    const danRange = filingAgeRange(dan, now, null);
    expect(aliceRange.hasChoice).toBe(false);
    expect(danRange.hasChoice).toBe(false);
    expect(danRange.earliest.asMonths()).toBe(danRange.latest.asMonths());

    const results = expectedNPVCoupleOptimized(
      recipients,
      now,
      0.025,
      [flatDeathDistribution(67), flatDeathDistribution(72)],
      alreadyFiled
    );
    expect(results.length).toBe(1);
    expect(results[0].filingAges[0].asMonths()).toBe(
      aliceRange.earliest.asMonths()
    );
    expect(results[0].filingAges[1].asMonths()).toBe(
      danRange.earliest.asMonths()
    );
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

  it('optimized matches the exact reference with the earner pinned', () => {
    const bobFiledAt = monthDate(2025, 5);
    const earnerPinned = [null, bobFiledAt] as const;
    const fast = expectedNPVCoupleOptimized(
      recipients,
      now,
      0.025,
      dists,
      earnerPinned
    );
    const slow = expectedNPVCouple(recipients, now, 0.025, dists, earnerPinned);
    expect(fast.length).toBe(slow.length);
    expect(fast.length).toBeGreaterThan(0);
    const key = (a: MonthDuration, b: MonthDuration) =>
      `${a.asMonths()}:${b.asMonths()}`;
    const slowByKey = new Map(
      slow.map((r) => [
        key(r.filingAges[0], r.filingAges[1]),
        r.expectedNPVCents,
      ])
    );
    const bobFiledAge = bob.birthdate.ageAtSsaDate(bobFiledAt);
    for (const r of fast) {
      expect(r.filingAges[1].asMonths()).toBe(bobFiledAge.asMonths());
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
