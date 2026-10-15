/**
 * Checks the fast widowed optimizer against goldens computed by the slow
 * reference (see generate-widowed-goldens.test.ts): for each case, the best
 * plan for two death months and the best plan by expected value.
 *
 * Values must match to a millionth. A different plan is accepted only when
 * it ties the golden one: the golden plan, valued by the fast path, must be
 * worth the same, so a different choice can come only from how two equal
 * values round.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import type { LateSpouseClaim } from '$lib/strategy/calculations/late-spouse';
import type { WidowedStrategy } from '$lib/strategy/calculations/widowed-benefits';
import {
  createWidowedContext,
  expectedNPVWidowed,
  optimalStrategyWidowed,
  type WidowedContext,
  type WidowedResult,
  widowedExpectedNPVCents,
  widowedNPVCents,
} from '$lib/strategy/calculations/widowed-optimizer';
import {
  WIDOWED_GOLDENS_PATH,
  type WidowedGoldenCase,
  type WidowedGoldenClaim,
  type WidowedGoldenResult,
} from './widowed-goldens-format';

const goldens: WidowedGoldenCase[] = JSON.parse(
  readFileSync(resolve(__dirname, WIDOWED_GOLDENS_PATH), 'utf-8')
);

function recipientFor(piaCents: number, [y, m, d]: readonly number[]) {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(y, m, d);
  r.setPia(Money.fromCents(piaCents));
  return r;
}

function toClaim(claim: WidowedGoldenClaim): LateSpouseClaim {
  return claim.kind === 'retirement'
    ? { kind: 'retirement', startedAt: new MonthDate(claim.startedAt) }
    : claim;
}

function contextFor({ inputs }: WidowedGoldenCase): WidowedContext {
  return createWidowedContext(
    recipientFor(inputs.survivorPiaCents, inputs.survivorBirth),
    {
      recipient: recipientFor(inputs.spousePiaCents, inputs.spouseBirth),
      deathDate: new MonthDate(inputs.deathMonth),
      claim: toClaim(inputs.claim),
    },
    new MonthDate(inputs.currentDate),
    inputs.discountRate,
    {
      survivor:
        inputs.survivorFiledAt === null
          ? null
          : new MonthDate(inputs.survivorFiledAt),
      own: inputs.ownFiledAt === null ? null : new MonthDate(inputs.ownFiledAt),
    }
  );
}

function strategyOf(golden: WidowedGoldenResult): WidowedStrategy {
  return {
    survivorStart: new MonthDuration(golden.survivorStartMonths),
    ownStart: new MonthDuration(golden.ownStartMonths),
  };
}

const close = (a: number, b: number) =>
  Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));

/**
 * Whether `fast` matches `golden`: the same value, and the same plan unless
 * the golden plan is worth exactly as much by the fast path's own reckoning.
 */
function agrees(
  fast: WidowedResult,
  golden: WidowedGoldenResult,
  fastValueOfGoldenPlan: number
): boolean {
  if (!close(fast.npvCents, golden.npvCents)) return false;
  const samePlan =
    fast.strategy.survivorStart.asMonths() === golden.survivorStartMonths &&
    fast.strategy.ownStart.asMonths() === golden.ownStartMonths;
  return samePlan || close(fastValueOfGoldenPlan, fast.npvCents);
}

describe('widowed goldens', () => {
  it('has the cases the generator wrote', () => {
    expect(goldens.length).toBe(500);
  });

  it(
    'finds the slow reference’s best plan for each death month',
    { timeout: 60_000 },
    () => {
      const failures: string[] = [];
      for (const golden of goldens) {
        const context = contextFor(golden);
        for (const { deathMonth, best } of golden.byDeath) {
          const finalDate = new MonthDate(deathMonth);
          const fast = optimalStrategyWidowed(context, finalDate);
          const goldenValue = widowedNPVCents(
            context,
            strategyOf(best),
            finalDate
          );
          if (!agrees(fast, best, goldenValue)) {
            failures.push(
              `#${golden.id} death ${finalDate.toString()}: golden ${JSON.stringify(best)}, fast ${fast.strategy.survivorStart.asMonths()}/${fast.strategy.ownStart.asMonths()} ${fast.npvCents}`
            );
          }
        }
      }
      expect(failures).toEqual([]);
    }
  );

  it(
    'finds the slow reference’s best plan by expected value',
    { timeout: 60_000 },
    () => {
      const failures: string[] = [];
      for (const golden of goldens) {
        const context = contextFor(golden);
        const { distribution, best } = golden.expected;
        const fast = expectedNPVWidowed(context, distribution);
        const goldenValue = widowedExpectedNPVCents(
          context,
          distribution,
          strategyOf(best)
        );
        if (!agrees(fast, best, goldenValue)) {
          failures.push(
            `#${golden.id}: golden ${JSON.stringify(best)}, fast ${fast.strategy.survivorStart.asMonths()}/${fast.strategy.ownStart.asMonths()} ${fast.npvCents}`
          );
        }
      }
      expect(failures).toEqual([]);
    }
  );
});
