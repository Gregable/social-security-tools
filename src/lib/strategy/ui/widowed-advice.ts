/**
 * Turns widowed-mode optimizer results into what the page says about each
 * benefit: start it in a given month, start it now and backdate, it has
 * already started, it is not needed, or, for the own benefit, there is none
 * on the survivor's record. Kept out of the components so the rules can be
 * tested.
 */

import type { DeathProbability } from '$lib/life-tables';
import type { Money } from '$lib/money';
import type { MonthDate, MonthDuration } from '$lib/month-time';
import type { WidowedStrategy } from '$lib/strategy/calculations/widowed-benefits';
import {
  expectedNPVWidowed,
  type WidowedBenefitUse,
  type WidowedContext,
  widowedAmounts,
  widowedBenefitUse,
  widowedHorizon,
  widowedNPVCents,
} from '$lib/strategy/calculations/widowed-optimizer';

/** What to do about one of a widow(er)'s two benefits. */
export type WidowedClaimAdvice =
  /** Already receiving it since `month`. */
  | {
      readonly kind: 'started';
      readonly month: MonthDate;
      readonly age: MonthDuration;
      readonly amount: Money;
    }
  /**
   * The best start month has passed: claim now and ask SSA to backdate to
   * `backdateTo`, which it allows.
   */
  | {
      readonly kind: 'file-now';
      readonly backdateTo: MonthDate;
      readonly amount: Money;
    }
  | {
      readonly kind: 'file-in';
      readonly month: MonthDate;
      readonly age: MonthDuration;
      readonly amount: Money;
    }
  /** It is never the larger benefit in this plan, so it changes nothing. */
  | { readonly kind: 'not-needed' };

/**
 * What to do about the survivor's own retirement benefit, which, unlike the
 * survivor benefit, may not exist.
 */
export type OwnClaimAdvice =
  | WidowedClaimAdvice
  /** There is no retirement benefit on their record. */
  | { readonly kind: 'no-benefit' };

/** A claim still to make, as opposed to a settled fact. */
export type ClaimToMake = Extract<
  WidowedClaimAdvice,
  { readonly kind: 'file-in' | 'file-now' }
>;

export function isClaimToMake(advice: OwnClaimAdvice): advice is ClaimToMake {
  return advice.kind === 'file-in' || advice.kind === 'file-now';
}

/** What the page says about each benefit in one plan. */
export interface WidowedAdvice {
  readonly survivor: WidowedClaimAdvice;
  readonly own: OwnClaimAdvice;
  /**
   * Which benefit starts first when the plan uses both, so the page can say
   * "then switch"; null when it uses only one.
   */
  readonly first: 'survivor' | 'own' | 'together' | null;
}

/** The plan the page recommends, with its expected value. */
export interface WidowedRecommendation extends WidowedAdvice {
  /** The plan's expected NPV across the death distribution, in cents. */
  readonly expectedNPVCents: number;
}

function adviceFor(
  context: WidowedContext,
  startAge: MonthDuration,
  amount: Money,
  filedAt: MonthDate | null,
  used: boolean
): WidowedClaimAdvice {
  const birthdate = context.survivor.birthdate;
  if (filedAt !== null) {
    return { kind: 'started', month: filedAt, age: startAge, amount };
  }
  if (!used) return { kind: 'not-needed' };
  const month = birthdate.dateAtSsaAge(startAge);
  // Strictly before: this month's claim is "file this month", not a backdate.
  if (month.lessThan(context.currentDate)) {
    return { kind: 'file-now', backdateTo: month, amount };
  }
  return { kind: 'file-in', month, age: startAge, amount };
}

/** What the page says about each benefit for a widow(er) following `strategy`. */
export function widowedAdvice(
  context: WidowedContext,
  strategy: WidowedStrategy
): WidowedAdvice {
  const amounts = widowedAmounts(context, strategy);
  const use = widowedBenefitUse(context, strategy, widowedHorizon(context));
  const hasOwnRecord =
    context.survivor.pia().primaryInsuranceAmount().cents() > 0;

  const survivor = adviceFor(
    context,
    strategy.survivorStart,
    amounts.survivor,
    context.filed.survivor,
    use.survivor
  );
  const own: OwnClaimAdvice = hasOwnRecord
    ? adviceFor(
        context,
        strategy.ownStart,
        amounts.own,
        context.filed.own,
        use.own
      )
    : { kind: 'no-benefit' };

  let first: WidowedAdvice['first'] = null;
  if (use.survivor && use.own && hasOwnRecord) {
    const s = strategy.survivorStart.asMonths();
    const o = strategy.ownStart.asMonths();
    first = s < o ? 'survivor' : o < s ? 'own' : 'together';
  }
  return { survivor, own, first };
}

/**
 * The plan the page recommends: the strategy with the highest expected NPV
 * across `deathProbDist`, with what to do about each benefit.
 */
export function widowedRecommendation(
  context: WidowedContext,
  deathProbDist: readonly DeathProbability[]
): WidowedRecommendation {
  const best = expectedNPVWidowed(context, deathProbDist);
  return {
    ...widowedAdvice(context, best.strategy),
    expectedNPVCents: best.npvCents,
  };
}

/** One of the common approaches, valued for a single death month. */
export interface WidowedAlternative {
  readonly strategy: WidowedStrategy;
  readonly npvCents: number;
  readonly use: WidowedBenefitUse;
}

/**
 * The common approaches, valued for a widow(er) who dies in `finalDate`, so
 * a scenario can show what the best plan is worth against them:
 *
 * 1. survivor benefit as early as possible, own benefit as late as possible;
 * 2. own benefit as early as possible, survivor benefit at its maximum;
 * 3. both as early as possible.
 *
 * Within the ages still open; approaches that coincide are listed once.
 */
export function widowedAlternatives(
  context: WidowedContext,
  finalDate: MonthDate
): readonly WidowedAlternative[] {
  const { survivorRange, ownRange } = context;
  const candidates: WidowedStrategy[] = [
    { survivorStart: survivorRange.earliest, ownStart: ownRange.latest },
    { survivorStart: survivorRange.latest, ownStart: ownRange.earliest },
    { survivorStart: survivorRange.earliest, ownStart: ownRange.earliest },
  ];
  const seen = new Set<string>();
  const alternatives: WidowedAlternative[] = [];
  for (const strategy of candidates) {
    const use = widowedBenefitUse(context, strategy, finalDate);
    // A benefit that never pays leaves the stream unchanged whenever it
    // starts, so two approaches that differ only there are the same plan.
    const key = [
      use.survivor ? strategy.survivorStart.asMonths() : '-',
      use.own ? strategy.ownStart.asMonths() : '-',
    ].join(':');
    if (seen.has(key)) continue;
    seen.add(key);
    alternatives.push({
      strategy,
      npvCents: widowedNPVCents(context, strategy, finalDate),
      use,
    });
  }
  return alternatives;
}
