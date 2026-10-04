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
import {
  type LateSpouse,
  type LateSpouseClaim,
  NOT_FILED_WIDOWED,
  type WidowedFiled,
} from '$lib/strategy/calculations/late-spouse';
import {
  createWidowedContext,
  earliestModelableDeathAgeWidowed,
  type WidowedContext,
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

/**
 * The scenarios the headline stories show. widowed-story-scenarios.test.ts
 * checks that each still gives the advice its story describes.
 */
export const HEADLINE_SCENARIOS = {
  /** A larger own benefit: survivor benefit first, own benefit at 70. */
  survivorFirstThenOwn: {
    ownPia: 2500,
    born: [1968, 3, 15],
    spousePia: 1500,
    spouseBorn: [1964, 5, 10],
    died: [2025, 11],
  },
  /** A larger survivor benefit: own benefit first, survivor benefit later. */
  ownFirstThenSurvivor: {
    ownPia: 1200,
    born: [1964, 3, 15],
    spousePia: 2600,
    spouseBorn: [1961, 3, 15],
    died: [2025, 11],
  },
  /**
   * Past 62, with an own benefit that never catches up: the survivor
   * benefit starts now, so there is no gap for the own benefit to bridge.
   */
  ownNotNeeded: {
    ownPia: 300,
    born: [1962, 9, 15],
    spousePia: 2400,
    spouseBorn: [1960, 3, 15],
    died: [2025, 11],
  },
  /** Past survivor full retirement age: claim now and backdate. */
  fileNowBackdated: {
    ownPia: 1500,
    born: [1950, 5, 10],
    spousePia: 2500,
    spouseBorn: [1948, 2, 10],
    died: [2025, 3],
  },
  /** Survivor benefits already started; only the own benefit is planned. */
  alreadyReceivingSurvivor: {
    ownPia: 1800,
    born: [1963, 7, 20],
    spousePia: 2400,
    spouseBorn: [1961, 9, 5],
    died: [2024, 2],
    claim: {
      kind: 'retirement',
      startedAt: MonthDate.initFromYearsMonths({ years: 2024, months: 0 }),
    },
    filed: {
      survivor: MonthDate.initFromYearsMonths({ years: 2024, months: 3 }),
      own: null,
    },
  },
} as const satisfies Record<string, WidowedScenarioOptions>;

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
  return widowedRecommendation(context, distributionFor(context));
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
