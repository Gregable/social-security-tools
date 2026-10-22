/**
 * Generates widowed-mode golden cases with the slow reference: every pair of
 * start ages, valued from benefit periods (strategySumCentsWidowed), for two
 * death months and for an expected value over a small death distribution.
 * The fast optimizer is never called, so the goldens pin its results to an
 * independent computation, and any later change to either path that moves a
 * result has to be recomputed deliberately and shows up in review.
 *
 * Skipped in normal runs. See golden-modes.ts for the modes:
 *   GENERATE_WIDOWED_GOLDENS=recompute npx vitest run src/test/strategy/generate-widowed-goldens.test.ts
 *   GENERATE_WIDOWED_GOLDENS=regenerate npx vitest run src/test/strategy/generate-widowed-goldens.test.ts
 * Output: src/test/strategy/goldens/widowed-goldens.json
 *
 * PIAs are given directly, so bend points, COLAs and wage indices don't
 * enter; results depend on the benefit rules and the retirement-age tables.
 * Inputs come from widowed-goldens-sampling.ts, whose draws never depend on
 * a search result but do depend on two eligibility rules (see there);
 * golden-inputs.test.ts checks the committed inputs against it.
 */

import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import type {
  LateSpouse,
  LateSpouseClaim,
} from '$lib/strategy/calculations/late-spouse';
import {
  ownFilingRange,
  strategySumCentsWidowed,
  survivorFilingRange,
  type WidowedStrategy,
} from '$lib/strategy/calculations/widowed-benefits';
import { goldenMode, readGoldens, writeGoldens } from './golden-modes';
import {
  WIDOWED_GOLDENS_PATH,
  type WidowedGoldenCase,
  type WidowedGoldenClaim,
  type WidowedGoldenInputs,
  type WidowedGoldenResult,
} from './widowed-goldens-format';
import {
  drawWidowedCases,
  recipientFor,
  type SampledCase,
  WIDOWED_GOLDEN_CASES,
} from './widowed-goldens-sampling';

const CASES = WIDOWED_GOLDEN_CASES;
const FORMAT = { indent: 1, trailingNewline: true };

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

/** The slow reference's best plans for a sampled case. */
function computeCase(id: number, sampled: SampledCase): WidowedGoldenCase {
  const { inputs, distribution } = sampled;
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

  const byDeath = sampled.deathMonths.map((deathMonth) => ({
    deathMonth,
    best: slowBest(
      survivor,
      lateSpouse,
      inputs,
      valueAt(new MonthDate(deathMonth))
    ),
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

const mode = goldenMode('GENERATE_WIDOWED_GOLDENS');

describe.runIf(mode !== null)('widowed golden generation', () => {
  it(
    `writes ${CASES} cases (${mode ?? 'skipped'})`,
    { timeout: 3_600_000 },
    () => {
      const outPath = resolve(__dirname, WIDOWED_GOLDENS_PATH);
      let goldens: WidowedGoldenCase[];
      if (mode === 'recompute') {
        goldens = readGoldens<WidowedGoldenCase>(outPath).map((g) =>
          computeCase(g.id, {
            inputs: g.inputs,
            deathMonths: g.byDeath.map((b) => b.deathMonth),
            distribution: [...g.expected.distribution],
          })
        );
      } else {
        goldens = drawWidowedCases().map((sampled, id) =>
          computeCase(id, sampled)
        );
      }
      mkdirSync(resolve(outPath, '..'), { recursive: true });
      writeGoldens(outPath, goldens, FORMAT);
    }
  );
});
