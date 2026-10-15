/**
 * Generates widowed-mode golden cases with the slow reference: every pair of
 * start ages, valued from benefit periods (strategySumCentsWidowed), for two
 * death months and for an expected value over a small death distribution.
 * The fast optimizer is never called, so the goldens pin its results to an
 * independent computation, and any later change to either path that moves a
 * result has to be regenerated deliberately and shows up in review.
 *
 * Skipped in normal runs. Regenerate with:
 *   GENERATE_WIDOWED_GOLDENS=1 npx vitest run src/test/strategy/generate-widowed-goldens.test.ts
 * Output: src/test/strategy/goldens/widowed-goldens.json
 *
 * Results depend on src/lib/constants.ts (bend points, COLAs, wage indices)
 * only through the start-age ranges and benefit rules, since PIAs are given
 * directly. The PRNG is seeded, so a regeneration with unchanged code and
 * constants reproduces the file.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { earliestFilingDate } from '$lib/strategy/calculations/already-filed';
import {
  earliestSurvivorBenefitDate,
  type LateSpouse,
  type LateSpouseClaim,
} from '$lib/strategy/calculations/late-spouse';
import {
  ownFilingRange,
  strategySumCentsWidowed,
  survivorFilingRange,
  type WidowedStrategy,
} from '$lib/strategy/calculations/widowed-benefits';
import {
  WIDOWED_GOLDENS_PATH,
  type WidowedGoldenCase,
  type WidowedGoldenClaim,
  type WidowedGoldenInputs,
  type WidowedGoldenResult,
} from './widowed-goldens-format';

const CASES = 500;
const CURRENT_DATE = MonthDate.initFromYearsMonths({ years: 2026, months: 9 });

// Seedable PRNG (mulberry32), as in the other golden generators.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function recipientFor(piaCents: number, [y, m, d]: readonly number[]) {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(y, m, d);
  r.setPia(Money.fromCents(piaCents));
  return r;
}

/** A widow(er) and late spouse, with some benefits already started. */
function randomInputs(rng: () => number): WidowedGoldenInputs {
  const int = (lo: number, hi: number) =>
    lo + Math.floor(rng() * (hi - lo + 1));
  const survivorBirth = [int(1935, 1975), int(0, 11), int(1, 28)] as const;
  const spouseBirth = [
    survivorBirth[0] + int(-8, 8),
    int(0, 11),
    int(1, 28),
  ] as const;
  const survivor = recipientFor(0, survivorBirth);
  const spouse = recipientFor(0, spouseBirth);
  // Died sometime between 45 and now.
  const at45 = spouse.birthdate
    .dateAtSsaAge(MonthDuration.initFromYearsMonths({ years: 45, months: 0 }))
    .monthsSinceEpoch();
  const now = CURRENT_DATE.monthsSinceEpoch();
  const deathMonth = int(Math.min(at45, now), now);

  let claim: WidowedGoldenClaim = { kind: 'none' };
  const spouseEarliest = earliestFilingDate(
    spouse.birthdate
  ).monthsSinceEpoch();
  const roll = rng();
  if (roll < 0.15) {
    claim = { kind: 'disability' };
  } else if (roll < 0.6 && spouseEarliest < deathMonth) {
    claim = {
      kind: 'retirement',
      startedAt: int(spouseEarliest, deathMonth - 1),
    };
  }

  const survivorEarliest = earliestSurvivorBenefitDate(
    survivor.birthdate,
    new MonthDate(deathMonth)
  ).monthsSinceEpoch();
  const ownEarliest = earliestFilingDate(survivor.birthdate).monthsSinceEpoch();
  return {
    survivorPiaCents: rng() < 0.15 ? 0 : int(300, 3500) * 100 + int(0, 99),
    survivorBirth: [...survivorBirth],
    spousePiaCents: int(500, 4000) * 100 + int(0, 99),
    spouseBirth: [...spouseBirth],
    deathMonth,
    claim,
    survivorFiledAt:
      rng() < 0.2 && survivorEarliest <= now
        ? int(survivorEarliest, now)
        : null,
    ownFiledAt:
      rng() < 0.2 && ownEarliest <= now ? int(ownEarliest, now) : null,
    discountRate: [0, 0.01, 0.025, 0.05][int(0, 3)],
    currentDate: now,
  };
}

function toClaim(claim: WidowedGoldenClaim): LateSpouseClaim {
  return claim.kind === 'retirement'
    ? { kind: 'retirement', startedAt: new MonthDate(claim.startedAt) }
    : claim;
}

/** The best strategy by exhaustive search, valued by `valueOfPlan`. */
function slowBest(
  survivor: Recipient,
  lateSpouse: LateSpouse,
  inputs: WidowedGoldenInputs,
  valueOfPlan: (strategy: WidowedStrategy) => number
): WidowedGoldenResult {
  const current = new MonthDate(inputs.currentDate);
  const survivorRange = survivorFilingRange(
    survivor,
    lateSpouse,
    current,
    inputs.survivorFiledAt === null
      ? null
      : new MonthDate(inputs.survivorFiledAt)
  );
  const ownRange = ownFilingRange(
    survivor,
    current,
    inputs.ownFiledAt === null ? null : new MonthDate(inputs.ownFiledAt)
  );
  let best: WidowedGoldenResult | null = null;
  // The same order as the fast search: survivor starts outside, own starts
  // inside, youngest first, keeping the first of a tie.
  for (
    let s = survivorRange.earliest.asMonths();
    s <= survivorRange.latest.asMonths();
    s++
  ) {
    for (
      let o = ownRange.earliest.asMonths();
      o <= ownRange.latest.asMonths();
      o++
    ) {
      const npvCents = valueOfPlan({
        survivorStart: new MonthDuration(s),
        ownStart: new MonthDuration(o),
      });
      if (best === null || npvCents > best.npvCents) {
        best = { npvCents, survivorStartMonths: s, ownStartMonths: o };
      }
    }
  }
  if (best === null) throw new Error('empty search space');
  return best;
}

function goldenCase(id: number, rng: () => number): WidowedGoldenCase {
  const inputs = randomInputs(rng);
  const int = (lo: number, hi: number) =>
    lo + Math.floor(rng() * (hi - lo + 1));
  const survivor = recipientFor(inputs.survivorPiaCents, inputs.survivorBirth);
  const lateSpouse: LateSpouse = {
    recipient: recipientFor(inputs.spousePiaCents, inputs.spouseBirth),
    deathDate: new MonthDate(inputs.deathMonth),
    claim: toClaim(inputs.claim),
  };
  const current = new MonthDate(inputs.currentDate);
  const valueAt = (finalDate: MonthDate) => (strategy: WidowedStrategy) =>
    strategySumCentsWidowed(
      survivor,
      lateSpouse,
      finalDate,
      current,
      inputs.discountRate,
      strategy
    );

  // Two deaths from a year out to 100, at month precision.
  const currentAgeMonths = survivor.birthdate.ageAtSsaDate(current).asMonths();
  const byDeath = [0, 1].map(() => {
    const deathAgeMonths = int(
      Math.max(currentAgeMonths + 12, 61 * 12),
      Math.max(currentAgeMonths + 24, 100 * 12)
    );
    const finalDate = survivor.birthdate.dateAtLayAge(
      new MonthDuration(deathAgeMonths)
    );
    return {
      deathMonth: finalDate.monthsSinceEpoch(),
      best: slowBest(survivor, lateSpouse, inputs, valueAt(finalDate)),
    };
  });

  // Six death ages from now to 100, as expected NPVs are: each at mid-year.
  const fromAge = Math.max(Math.floor(currentAgeMonths / 12), 60);
  const span = Math.max(100 - fromAge, 6);
  const raw = [0, 1, 2, 3, 4, 5].map((i) => ({
    age: fromAge + Math.round((i * span) / 5),
    weight: 1 + int(0, 9),
  }));
  const total = raw.reduce((s, r) => s + r.weight, 0);
  const distribution: DeathProbability[] = raw.map((r) => ({
    age: r.age,
    probability: r.weight / total,
  }));
  const expected = slowBest(survivor, lateSpouse, inputs, (strategy) =>
    distribution.reduce(
      (sum, { age, probability }) =>
        sum +
        probability *
          valueAt(
            survivor.birthdate.dateAtLayAge(
              MonthDuration.initFromYearsMonths({ years: age, months: 6 })
            )
          )(strategy),
      0
    )
  );
  return { id, inputs, byDeath, expected: { distribution, best: expected } };
}

describe.runIf(process.env.GENERATE_WIDOWED_GOLDENS === '1')(
  'generate widowed goldens',
  () => {
    it(`writes ${CASES} cases`, { timeout: 3_600_000 }, () => {
      const rng = mulberry32(1960);
      const goldens = Array.from({ length: CASES }, (_, id) =>
        goldenCase(id, rng)
      );
      const outPath = resolve(__dirname, WIDOWED_GOLDENS_PATH);
      mkdirSync(resolve(outPath, '..'), { recursive: true });
      writeFileSync(outPath, `${JSON.stringify(goldens, null, 1)}\n`);
    });
  }
);
