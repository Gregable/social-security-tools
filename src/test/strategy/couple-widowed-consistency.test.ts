/**
 * Couple mode and widowed mode reach the survivor benefit by different
 * routes: couple mode builds it into a couple's payment timeline (and its
 * two fast optimizers carry their own copies of the formula), while widowed
 * mode describes the late spouse with a LateSpouseClaim. These check that the
 * routes agree on the same facts.
 */

import { describe, expect, it } from 'vitest';
import { filedBeforeDeath } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  type AlreadyFiled,
  earliestFilingDate,
} from '$lib/strategy/calculations/already-filed';
import { BenefitType } from '$lib/strategy/calculations/benefit-period';
import {
  expectedNPVCouple,
  expectedNPVCoupleOptimized,
} from '$lib/strategy/calculations/expected-npv';
import type { LateSpouseClaim } from '$lib/strategy/calculations/late-spouse';
import { optimalStrategyCoupleFast } from '$lib/strategy/calculations/optimal-strategy-fast';
import {
  optimalStrategyCouple,
  optimalStrategyCoupleOptimized,
  strategySumPeriodsCouple,
} from '$lib/strategy/calculations/strategy-calc';
import { widowedSurvivorBenefit } from '$lib/strategy/calculations/widowed-benefits';

// Seedable PRNG (mulberry32), as in the golden generators.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRecipient(piaCents: number, birthdate: Birthdate): Recipient {
  const r = new Recipient();
  r.birthdate = birthdate;
  r.setPia(Money.fromCents(piaCents));
  return r;
}

const months = (n: number) => new MonthDuration(n);
const currentDate = MonthDate.initFromYearsMonths({ years: 2026, months: 9 });

describe('the survivor benefit in a couple timeline and in widowed mode', () => {
  it('is the same amount for the same death, claim and start', () => {
    const rng = mulberry32(2024);
    const int = (lo: number, hi: number) =>
      lo + Math.floor(rng() * (hi - lo + 1));
    const seen = { none: 0, early: 0, late: 0 };
    for (let n = 0; n < 1500; n++) {
      const earnerPia = int(1500, 4000) * 100 + int(0, 99);
      const earner = makeRecipient(
        earnerPia,
        Birthdate.FromYMD(int(1945, 1975), int(0, 11), int(1, 28))
      );
      const dependent = makeRecipient(
        int(0, earnerPia - 10000),
        Birthdate.FromYMD(
          earner.birthdate.layBirthYear() + int(-8, 8),
          int(0, 11),
          int(1, 28)
        )
      );
      const strats: [MonthDuration, MonthDuration] = [
        months(int(62 * 12 + 1, 70 * 12)),
        months(int(62 * 12 + 1, 70 * 12)),
      ];
      const earnerDeath = earner.birthdate.dateAtLayAge(
        months(int(62 * 12, 90 * 12))
      );
      const finalDates: [MonthDate, MonthDate] = [
        earnerDeath,
        earnerDeath.addDuration(months(int(12, 30 * 12))),
      ];
      const survivorPeriod = strategySumPeriodsCouple(
        [earner, dependent],
        finalDates,
        strats
      ).find((p) => p.benefitType === BenefitType.Survivor);
      if (survivorPeriod === undefined) continue;

      // The same facts as widowed mode's form would describe them.
      const earnerFiledAt = earner.birthdate.dateAtSsaAge(strats[0]);
      const claim: LateSpouseClaim = filedBeforeDeath(
        earnerFiledAt,
        earnerDeath
      )
        ? { kind: 'retirement', startedAt: earnerFiledAt }
        : { kind: 'none' };
      if (claim.kind === 'none') seen.none++;
      else if (earnerFiledAt.lessThan(earner.normalRetirementDate()))
        seen.early++;
      else seen.late++;

      expect(
        widowedSurvivorBenefit(
          dependent,
          { recipient: earner, deathDate: earnerDeath, claim },
          survivorPeriod.startDate
        ).cents()
      ).toBe(survivorPeriod.amount.cents());
    }
    // Spouses who never claimed, claimed early, and claimed late all came up.
    expect(seen.none).toBeGreaterThan(50);
    expect(seen.early).toBeGreaterThan(50);
    expect(seen.late).toBeGreaterThan(50);
  });
});

/**
 * A couple who have both already claimed, the earner before full
 * retirement age, where the earner dies before the dependent reaches
 * survivor full retirement age: the case the widow(er)'s limit and the age
 * reduction both apply to. Both claims are pinned, so each optimizer values
 * exactly one strategy.
 */
interface PinnedCouple {
  readonly recipients: [Recipient, Recipient];
  readonly alreadyFiled: AlreadyFiled;
  readonly earnerDeath: MonthDate;
  readonly dependentDeath: MonthDate;
  readonly discountRate: number;
}

function randomPinnedCouple(rng: () => number): PinnedCouple {
  const int = (lo: number, hi: number) =>
    lo + Math.floor(rng() * (hi - lo + 1));
  for (;;) {
    const earner = makeRecipient(
      int(1500, 4000) * 100 + int(0, 99),
      Birthdate.FromYMD(int(1956, 1962), int(0, 11), int(1, 28))
    );
    const dependent = makeRecipient(
      int(100, 1000) * 100 + int(0, 99),
      Birthdate.FromYMD(int(1960, 1964), int(0, 11), int(1, 28))
    );
    const earnerLastEarly = MonthDate.min(
      earner.normalRetirementDate().subtractDuration(months(1)),
      currentDate
    );
    const dependentEarliest = earliestFilingDate(dependent.birthdate);
    const dependentFra = dependent.birthdate.dateAtSsaAge(
      dependent.survivorNormalRetirementAge()
    );
    // The earner dies, and the survivor benefit starts the month after,
    // before the dependent's survivor full retirement age.
    const lastDeath = dependentFra.monthsSinceEpoch() - 2;
    if (
      dependentEarliest.greaterThan(currentDate) ||
      lastDeath < currentDate.monthsSinceEpoch()
    ) {
      continue;
    }
    const earnerFiledAt = new MonthDate(
      int(
        earliestFilingDate(earner.birthdate).monthsSinceEpoch(),
        earnerLastEarly.monthsSinceEpoch()
      )
    );
    const dependentFiledAt = new MonthDate(
      int(dependentEarliest.monthsSinceEpoch(), currentDate.monthsSinceEpoch())
    );
    return {
      recipients: [earner, dependent],
      alreadyFiled: [earnerFiledAt, dependentFiledAt],
      earnerDeath: new MonthDate(
        int(currentDate.monthsSinceEpoch(), lastDeath)
      ),
      dependentDeath: dependent.birthdate.dateAtLayAge(
        months(int(85 * 12, 95 * 12))
      ),
      discountRate: [0, 0.025, 0.05][int(0, 2)],
    };
  }
}

describe('the couple fast paths where the widow(er)s limit applies', () => {
  const rng = mulberry32(615320);
  const couples = Array.from({ length: 150 }, () => randomPinnedCouple(rng));

  it('cover that case: a survivor benefit started before survivor full retirement age', () => {
    for (const c of couples) {
      const [earner, dependent] = c.recipients;
      const strats: [MonthDuration, MonthDuration] = [
        earner.birthdate.ageAtSsaDate(c.alreadyFiled[0] as MonthDate),
        dependent.birthdate.ageAtSsaDate(c.alreadyFiled[1] as MonthDate),
      ];
      const survivorPeriod = strategySumPeriodsCouple(
        c.recipients,
        [c.earnerDeath, c.dependentDeath],
        strats
      ).find((p) => p.benefitType === BenefitType.Survivor);
      expect(survivorPeriod).toBeDefined();
      expect(
        survivorPeriod?.startDate.lessThan(
          dependent.birthdate.dateAtSsaAge(
            dependent.survivorNormalRetirementAge()
          )
        )
      ).toBe(true);
    }
  });

  it('value the strategy as the slow reference does', () => {
    for (const c of couples) {
      const finalDates: [MonthDate, MonthDate] = [
        c.earnerDeath,
        c.dependentDeath,
      ];
      const [, , reference] = optimalStrategyCouple(
        c.recipients,
        finalDates,
        currentDate,
        c.discountRate,
        c.alreadyFiled
      );
      for (const solver of [
        optimalStrategyCoupleOptimized,
        optimalStrategyCoupleFast,
      ]) {
        const [, , npv] = solver(
          c.recipients,
          finalDates,
          currentDate,
          c.discountRate,
          c.alreadyFiled
        );
        expect(Math.abs(npv - reference)).toBeLessThan(1);
      }
    }
  });

  it('value it in expectation as the slow reference does', () => {
    for (const c of couples.slice(0, 40)) {
      const [earner] = c.recipients;
      const earnerAge = currentDate.year() - earner.birthdate.layBirthYear();
      const dists: [DeathProbability[], DeathProbability[]] = [
        [
          { age: earnerAge + 1, probability: 0.4 },
          { age: earnerAge + 3, probability: 0.3 },
          { age: 88, probability: 0.3 },
        ],
        [
          { age: 85, probability: 0.5 },
          { age: 95, probability: 0.5 },
        ],
      ];
      const [reference] = expectedNPVCouple(
        c.recipients,
        currentDate,
        c.discountRate,
        dists,
        c.alreadyFiled
      );
      const [optimized] = expectedNPVCoupleOptimized(
        c.recipients,
        currentDate,
        c.discountRate,
        dists,
        c.alreadyFiled
      );
      expect(
        Math.abs(optimized.expectedNPVCents - reference.expectedNPVCents)
      ).toBeLessThan(1);
    }
  });
});
