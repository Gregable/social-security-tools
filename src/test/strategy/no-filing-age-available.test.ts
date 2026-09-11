/**
 * Tests for scenarios in which a recipient has no filing age at all, because
 * they die before the earliest month they could have filed.
 *
 * The optimizers used to answer that malformed question with a sentinel —
 * `[MonthDuration(0), -1]`, i.e. "file at age 0 for minus one cent". Nothing
 * in the return type distinguished it from a real strategy, so the strategy
 * page wrote it straight into the results grid and a filter in
 * StrategyPlotSingle silently dropped the resulting points. That pairing (a
 * producer emitting well-typed garbage, a consumer quietly discarding it) is
 * how the over-70 bug rendered an empty chart with no error at all.
 *
 * Two changes close it, and both are pinned here:
 *   - Death-age buckets start at `earliestModelableDeathAge`, so the UI never
 *     asks the question.
 *   - The optimizers throw rather than inventing an answer, so every value of
 *     their return types is a real strategy.
 */

import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { optimalStrategyCoupleFast } from '$lib/strategy/calculations/optimal-strategy-fast';
import {
  earliestFiling,
  earliestModelableDeathAge,
  NoFilingAgeAvailableError,
  optimalStrategyCouple,
  optimalStrategyCoupleOptimized,
  optimalStrategySingle,
} from '$lib/strategy/calculations/strategy-calc';
import { generateMonthlyBuckets } from '$lib/strategy/ui';

function makeRecipient(
  piaDollars: number,
  birthYear: number,
  birthMonthIndex: number,
  birthDay: number
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(birthYear, birthMonthIndex, birthDay);
  r.setPia(Money.from(piaDollars));
  return r;
}

const age = (years: number, months = 0): MonthDuration =>
  MonthDuration.initFromYearsMonths({ years, months });

const monthDate = (year: number, monthIndex: number): MonthDate =>
  MonthDate.initFromYearsMonths({ years: year, months: monthIndex });

function flatDeathDistribution(
  fromAge: number
): { age: number; probability: number }[] {
  const dist: { age: number; probability: number }[] = [];
  for (let a = fromAge; a <= 119; a++) {
    dist.push({ age: a, probability: 1 / (119 - fromAge + 1) });
  }
  return dist;
}

describe('earliestModelableDeathAge', () => {
  // Born on the 15th, so earliestFilingMonth is the month AFTER the 62nd
  // birthday (62y1m). At age 62y1m exactly, a bucket derived from whole-year
  // currentAge() would sit at 62y0m — one month before they could file.
  it('does not fall below the earliest filing age', () => {
    const r = makeRecipient(2000, 1964, 5, 15);
    const currentDate = monthDate(2026, 6); // Jul 2026 -> age 62y1m

    expect(r.birthdate.currentAge()).toBe(62);
    expect(earliestFiling(r, currentDate).asMonths()).toBe(
      age(62, 1).asMonths()
    );
    expect(earliestModelableDeathAge(r, currentDate).asMonths()).toBe(
      age(62, 1).asMonths()
    );
  });

  // Someone aged 70y11m has a whole-year currentAge() of 70, but cannot file
  // any earlier than 70y5m, so buckets at 70y0m..70y4m are unmodelable.
  it('does not fall below the current age past 70', () => {
    const r = makeRecipient(2000, 1955, 9, 15);
    const currentDate = monthDate(2026, 8); // Sep 2026 -> age 70y11m

    expect(r.birthdate.currentAge()).toBe(70);
    const modelable = earliestModelableDeathAge(r, currentDate);
    expect(modelable.asMonths()).toBe(age(70, 11).asMonths());
    expect(modelable.greaterThanOrEqual(earliestFiling(r, currentDate))).toBe(
      true
    );
  });
});

describe('monthly buckets built from earliestModelableDeathAge', () => {
  // The end-to-end property: every bucket the UI generates must admit at
  // least one filing age, so the optimizer is never asked the malformed
  // question in the first place.
  const cases: [string, Recipient, MonthDate][] = [
    ['age 62y1m', makeRecipient(2000, 1964, 5, 15), monthDate(2026, 6)],
    ['age 70y11m', makeRecipient(2000, 1955, 9, 15), monthDate(2026, 8)],
    ['age 78', makeRecipient(2000, 1948, 5, 15), monthDate(2026, 8)],
  ];

  for (const [label, recipient, currentDate] of cases) {
    it(`every bucket admits a filing age at ${label}`, () => {
      const startMonths = earliestModelableDeathAge(
        recipient,
        currentDate
      ).asMonths();
      const buckets = generateMonthlyBuckets(
        startMonths,
        flatDeathDistribution(Math.floor(startMonths / 12))
      );
      expect(buckets.length).toBeGreaterThan(0);

      for (const bucket of buckets) {
        const finalDate = recipient.birthdate.dateAtLayAge(bucket.expectedAge);
        // Must not throw, and must return a filing age inside the range.
        const [filingAge, npv] = optimalStrategySingle(
          recipient,
          finalDate,
          currentDate,
          0.03
        );
        expect(filingAge.asMonths()).toBeGreaterThanOrEqual(
          earliestFiling(recipient, currentDate).asMonths()
        );
        expect(npv).toBeGreaterThan(0);
      }
    });
  }
});

/** Recipient `a` dies at 62y0m, one month before they could first file. */
function coupleWhereFirstDiesBeforeFiling(): [Recipient, Recipient] {
  const a = makeRecipient(2000, 1964, 5, 15);
  const b = makeRecipient(1200, 1962, 5, 15);
  a.markFirst();
  b.markSecond();
  return [a, b];
}

function deathDatesForThatCouple(
  a: Recipient,
  b: Recipient
): [MonthDate, MonthDate] {
  return [
    a.birthdate.dateAtLayAge(age(62, 0)),
    b.birthdate.dateAtLayAge(age(90)),
  ];
}

describe('optimizers reject a scenario with no filing age', () => {
  it('optimalStrategySingle throws rather than returning age 0', () => {
    const r = makeRecipient(2000, 1964, 5, 15);
    const currentDate = monthDate(2026, 6); // age 62y1m, earliest filing 62y1m
    // Dies at 62y0m — one month before they could file.
    const finalDate = r.birthdate.dateAtLayAge(age(62, 0));

    expect(() =>
      optimalStrategySingle(r, finalDate, currentDate, 0.03)
    ).toThrow(NoFilingAgeAvailableError);
  });

  // A couple is different from a single recipient: one spouse dying before
  // they could file does NOT make the scenario meaningless. The other still
  // has a genuine filing decision, and the survivor benefit still depends on
  // it. Throwing (or returning the old [0, 0, -1] sentinel) would discard
  // that answer, so the couple optimizers collapse the dead spouse's range
  // to a single immaterial age instead.
  it("keeps the surviving spouse's decision when the other cannot file", () => {
    const cur = monthDate(2026, 6);
    const [a, b] = coupleWhereFirstDiesBeforeFiling();
    const finalDates = deathDatesForThatCouple(a, b);

    const fast = optimalStrategyCoupleFast([a, b], finalDates, cur, 0.03);
    expect(fast[2]).toBeGreaterThan(0);
    // The surviving spouse's age is a real filing age in their own range.
    expect(fast[1].asMonths()).toBeGreaterThanOrEqual(
      earliestFiling(b, cur).asMonths()
    );
    expect(fast[1].asMonths()).toBeLessThanOrEqual(70 * 12);
    // The spouse who died first is reported at their earliest filing age
    // rather than an impossible age 0.
    expect(fast[0].asMonths()).toBe(earliestFiling(a, cur).asMonths());
  });

  it('all three couple implementations agree in that case', () => {
    const cur = monthDate(2026, 6);
    const [a, b] = coupleWhereFirstDiesBeforeFiling();
    const finalDates = deathDatesForThatCouple(a, b);

    const fast = optimalStrategyCoupleFast([a, b], finalDates, cur, 0.03);
    const optimized = optimalStrategyCoupleOptimized(
      [a, b],
      finalDates,
      cur,
      0.03
    );
    const slow = optimalStrategyCouple([a, b], finalDates, cur, 0.03);

    for (const other of [optimized, slow]) {
      expect(other[0].asMonths()).toBe(fast[0].asMonths());
      expect(other[1].asMonths()).toBe(fast[1].asMonths());
      expect(Math.abs(other[2] - fast[2])).toBeLessThan(1);
    }
  });

  it('names both bounds so the malformed scenario is identifiable', () => {
    const r = makeRecipient(2000, 1964, 5, 15);
    const currentDate = monthDate(2026, 6);
    const finalDate = r.birthdate.dateAtLayAge(age(62, 0));

    expect(() =>
      optimalStrategySingle(r, finalDate, currentDate, 0.03)
    ).toThrow(/earliest filing age is 745 months.*only through 744 months/);
  });
});
