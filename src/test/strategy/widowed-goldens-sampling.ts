/**
 * Input sampling for the widowed goldens (generate-widowed-goldens.test.ts).
 *
 * Draws come from a seeded PRNG and never depend on a search result. They
 * do depend on two eligibility rules, earliestFilingDate and
 * earliestSurvivorBenefitDate, which decide whether some draws happen: a
 * change to either shifts the stream. golden-inputs.test.ts checks that
 * widowed-goldens.json holds exactly what drawWidowedCases() draws, so
 * such a change fails there rather than silently.
 */

import { Birthdate } from '$lib/birthday';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { earliestFilingDate } from '$lib/strategy/calculations/already-filed';
import { earliestSurvivorBenefitDate } from '$lib/strategy/calculations/late-spouse';
import { drawInputs } from './golden-sampling';
import type {
  WidowedGoldenClaim,
  WidowedGoldenInputs,
} from './widowed-goldens-format';

export const WIDOWED_GOLDEN_CASES = 500;
export const CURRENT_DATE = MonthDate.initFromYearsMonths({
  years: 2026,
  months: 9,
});

export function recipientFor(piaCents: number, [y, m, d]: readonly number[]) {
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

/**
 * Everything one case draws from the seeded stream: the people and claims,
 * two death months, and a death distribution. Drawn in this order, which
 * fixes the stream; nothing here depends on a search result.
 */
export interface SampledCase {
  readonly inputs: WidowedGoldenInputs;
  readonly deathMonths: readonly number[];
  readonly distribution: DeathProbability[];
}

export function sampleCase(rng: () => number): SampledCase {
  const inputs = randomInputs(rng);
  const int = (lo: number, hi: number) =>
    lo + Math.floor(rng() * (hi - lo + 1));
  const survivor = recipientFor(inputs.survivorPiaCents, inputs.survivorBirth);
  const current = new MonthDate(inputs.currentDate);

  // Two deaths from a year out to 100, at month precision.
  const currentAgeMonths = survivor.birthdate.ageAtSsaDate(current).asMonths();
  const deathMonths = [0, 1].map(() => {
    const deathAgeMonths = int(
      Math.max(currentAgeMonths + 12, 61 * 12),
      Math.max(currentAgeMonths + 24, 100 * 12)
    );
    return survivor.birthdate
      .dateAtLayAge(new MonthDuration(deathAgeMonths))
      .monthsSinceEpoch();
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
  return { inputs, deathMonths, distribution };
}

/** The committed widowed cases, in order: 500 draws from seed 1960. */
export function drawWidowedCases(): SampledCase[] {
  return drawInputs(
    1960,
    WIDOWED_GOLDEN_CASES,
    WIDOWED_GOLDEN_CASES,
    sampleCase
  );
}
