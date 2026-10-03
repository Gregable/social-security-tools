/**
 * Widowed-mode fixtures for stories, built with the real calculations so the
 * stories show what the page would. The current date is pinned so they do
 * not drift as real time passes.
 */

import { Birthdate } from '$lib/birthday';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import type {
  LateSpouse,
  LateSpouseClaim,
} from '$lib/strategy/calculations/late-spouse';
import {
  createWidowedContext,
  earliestModelableDeathAgeWidowed,
  expectedNPVWidowed,
  NOT_FILED_WIDOWED,
  type WidowedContext,
  type WidowedFiled,
} from '$lib/strategy/calculations/widowed-optimizer';
import type { CalculationResults } from '$lib/strategy/ui/calculation-results';
import { generateMonthlyBuckets } from '$lib/strategy/ui/grid-sizing';
import {
  type WidowedRecommendation,
  widowedRecommendation,
} from '$lib/strategy/ui/widowed-advice';
import { widowedResultsByDeathAge } from '$lib/strategy/ui/widowed-results';

/** October 2026. */
export const STORY_CURRENT_DATE = MonthDate.initFromYearsMonths({
  years: 2026,
  months: 9,
});

export interface WidowedScenarioOptions {
  /** The survivor's PIA in dollars. */
  readonly ownPia: number;
  /** The survivor's birthdate as [year, month (1-12), day]. */
  readonly born: readonly [number, number, number];
  readonly spousePia: number;
  readonly spouseBorn: readonly [number, number, number];
  /** The month the spouse died, as [year, month (1-12)]. */
  readonly died: readonly [number, number];
  readonly claim?: LateSpouseClaim;
  readonly filed?: WidowedFiled;
  readonly discountRate?: number;
}

function recipientFor(
  pia: number,
  [year, month, day]: readonly [number, number, number]
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(year, month - 1, day);
  r.setPia(Money.from(pia));
  return r;
}

export function widowedContextFor(
  options: WidowedScenarioOptions
): WidowedContext {
  const survivor = recipientFor(options.ownPia, options.born);
  const lateSpouse: LateSpouse = {
    recipient: recipientFor(options.spousePia, options.spouseBorn),
    deathDate: MonthDate.initFromYearsMonths({
      years: options.died[0],
      months: options.died[1] - 1,
    }),
    claim: options.claim ?? { kind: 'none' },
  };
  return createWidowedContext(
    survivor,
    lateSpouse,
    STORY_CURRENT_DATE,
    options.discountRate ?? 0.025,
    options.filed ?? NOT_FILED_WIDOWED
  );
}

/**
 * A smooth death distribution from `fromAge`, thinning out with age. Close
 * enough to a life table for stories, and deterministic.
 */
export function storyDeathDistribution(fromAge: number): DeathProbability[] {
  const out: DeathProbability[] = [];
  let alive = 1;
  for (let age = fromAge; age < 112; age++) {
    const q = Math.min(1, 0.004 * 1.09 ** (age - 60));
    out.push({ age, probability: alive * q });
    alive *= 1 - q;
  }
  out.push({ age: 112, probability: alive });
  return out;
}

function distributionFor(context: WidowedContext): DeathProbability[] {
  return storyDeathDistribution(
    STORY_CURRENT_DATE.year() - context.survivor.birthdate.layBirthYear()
  );
}

/** The headline recommendation, as the page would compute it. */
export function widowedRecommendationFor(
  context: WidowedContext
): WidowedRecommendation {
  return widowedRecommendation(
    context,
    expectedNPVWidowed(context, distributionFor(context))
  );
}

/** The per-death-age results the chart plots, as the page would compute them. */
export function widowedResultsFor(context: WidowedContext): {
  results: CalculationResults;
  deathProbDistribution: DeathProbability[];
} {
  const deathProbDistribution = distributionFor(context);
  const buckets = generateMonthlyBuckets(
    earliestModelableDeathAgeWidowed(context).asMonths(),
    deathProbDistribution
  );
  const results = widowedResultsByDeathAge(context, buckets);
  return { results, deathProbDistribution };
}
