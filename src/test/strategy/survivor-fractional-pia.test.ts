/**
 * The couple fast paths carry their own copies of the survivor formula in
 * raw cents, and the goldens that check them use whole-dollar PIAs. The form
 * accepts PIAs with cents, so these compare both fast paths with the slow
 * references on PIAs that are not whole dollars, including the case the
 * widow(er)'s limit covers: the earner claimed early and the survivor claims
 * before survivor full retirement age.
 */

import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  type AlreadyFiled,
  NOT_FILED,
} from '$lib/strategy/calculations/already-filed';
import {
  expectedNPVCouple,
  expectedNPVCoupleOptimized,
} from '$lib/strategy/calculations/expected-npv';
import { optimalStrategyCoupleFast } from '$lib/strategy/calculations/optimal-strategy-fast';
import {
  optimalStrategyCouple,
  optimalStrategyCoupleOptimized,
} from '$lib/strategy/calculations/strategy-calc';

function makeRecipient(pia: number, birthdate: Birthdate): Recipient {
  const r = new Recipient();
  r.birthdate = birthdate;
  r.setPia(Money.from(pia));
  return r;
}

// Earner born 2 Jan 1960 (FRA 67): 66y9m now. Dependent born 20 Jul 1962:
// 64y2m now, before survivor FRA.
const currentDate = MonthDate.initFromYearsMonths({ years: 2026, months: 9 });
const recipients: [Recipient, Recipient] = [
  makeRecipient(1234.56, Birthdate.FromYMD(1960, 0, 2)),
  makeRecipient(345.67, Birthdate.FromYMD(1962, 6, 20)),
];
const discountRate = 0.025;

// Claimed February 2022 at 62y1m: the limit is then 82.5% of the PIA, which
// caps every survivor start the dependent has left, after the age reduction.
const EARNER_CLAIMED_EARLY: AlreadyFiled = [
  MonthDate.initFromYearsMonths({ years: 2022, months: 1 }),
  null,
];
const filings: [string, AlreadyFiled][] = [
  ['with no claims yet', NOT_FILED],
  ['after the earner claimed at 62', EARNER_CLAIMED_EARLY],
];

const deathAge = (years: number, months: number) =>
  MonthDuration.initFromYearsMonths({ years, months });

describe('couple fast paths with PIAs in cents', () => {
  describe.each(filings)('%s', (_, alreadyFiled) => {
    it.each([
      ['70 and 95', deathAge(70, 0), deathAge(95, 0)],
      ['68y6m and 88', deathAge(68, 6), deathAge(88, 0)],
      ['75 and 80', deathAge(75, 0), deathAge(80, 0)],
    ])('match the reference for deaths at %s', (_, death0, death1) => {
      const finalDates: [MonthDate, MonthDate] = [
        recipients[0].birthdate.dateAtLayAge(death0),
        recipients[1].birthdate.dateAtLayAge(death1),
      ];
      const [, , reference] = optimalStrategyCouple(
        recipients,
        finalDates,
        currentDate,
        discountRate,
        alreadyFiled
      );
      for (const solver of [
        optimalStrategyCoupleOptimized,
        optimalStrategyCoupleFast,
      ]) {
        const [, , npv] = solver(
          recipients,
          finalDates,
          currentDate,
          discountRate,
          alreadyFiled
        );
        expect(Math.abs(npv - reference)).toBeLessThan(1);
      }
    });

    it('matches the reference expected NPV', () => {
      const dists: [DeathProbability[], DeathProbability[]] = [
        [
          { age: 68, probability: 0.3 },
          { age: 75, probability: 0.4 },
          { age: 85, probability: 0.3 },
        ],
        [
          { age: 70, probability: 0.2 },
          { age: 85, probability: 0.5 },
          { age: 95, probability: 0.3 },
        ],
      ];
      const [reference] = expectedNPVCouple(
        recipients,
        currentDate,
        discountRate,
        dists,
        alreadyFiled
      );
      const [optimized] = expectedNPVCoupleOptimized(
        recipients,
        currentDate,
        discountRate,
        dists,
        alreadyFiled
      );
      expect(
        Math.abs(optimized.expectedNPVCents - reference.expectedNPVCents)
      ).toBeLessThan(1);
    });
  });
});

// Earner born 2 Jan 1959: FRA 66y10m (November 2025), 67y9m now. Filing now
// is after FRA, outside January, in a year after the FRA year, so the
// filing-year amount carries credits only through the prior January
// (67y0m): a nonzero credit the cases above never reach, since there the
// prior January is before FRA.
describe('couple fast paths with PIAs in cents, filing-year credits', () => {
  const lateRecipients: [Recipient, Recipient] = [
    makeRecipient(1234.56, Birthdate.FromYMD(1959, 0, 2)),
    makeRecipient(345.67, Birthdate.FromYMD(1962, 6, 20)),
  ];

  it('optimalStrategyCoupleFast matches the reference when filing now', () => {
    const finalDates: [MonthDate, MonthDate] = [
      lateRecipients[0].birthdate.dateAtLayAge(deathAge(72, 0)),
      lateRecipients[1].birthdate.dateAtLayAge(deathAge(65, 0)),
    ];
    const [earnerAge, , reference] = optimalStrategyCouple(
      lateRecipients,
      finalDates,
      currentDate,
      0.08,
      NOT_FILED
    );
    // The reference's best plan files now, so the filing-year amount counts.
    expect(earnerAge.asMonths()).toBe(67 * 12 + 9);
    const [, , npv] = optimalStrategyCoupleFast(
      lateRecipients,
      finalDates,
      currentDate,
      0.08,
      NOT_FILED
    );
    expect(Math.abs(npv - reference)).toBeLessThan(1);
  });

  it('expectedNPVCoupleOptimized matches the reference for every pair', () => {
    const dists: [DeathProbability[], DeathProbability[]] = [
      [
        { age: 68, probability: 0.5 },
        { age: 80, probability: 0.5 },
      ],
      [
        { age: 70, probability: 0.3 },
        { age: 90, probability: 0.7 },
      ],
    ];
    const key = ({ filingAges: [a, b] }: { filingAges: MonthDuration[] }) =>
      `${a.asMonths()}/${b.asMonths()}`;
    const reference = new Map(
      expectedNPVCouple(lateRecipients, currentDate, 0.025, dists).map((r) => [
        key(r),
        r.expectedNPVCents,
      ])
    );
    const optimized = expectedNPVCoupleOptimized(
      lateRecipients,
      currentDate,
      0.025,
      dists
    );
    expect(optimized.length).toBe(reference.size);
    for (const r of optimized) {
      const expected = reference.get(key(r));
      expect(expected).toBeDefined();
      expect(Math.abs(r.expectedNPVCents - (expected ?? 0))).toBeLessThan(1);
    }
  });
});
