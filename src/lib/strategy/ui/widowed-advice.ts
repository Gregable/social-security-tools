/**
 * Turns widowed-mode optimizer results into what the page says about each
 * benefit: start it in a given month, start it now and backdate, it has
 * already started, or it is not needed. Kept out of the components so the
 * rules can be tested.
 */

import type { Money } from '$lib/money';
import type { MonthDate, MonthDuration } from '$lib/month-time';
import type { WidowedStrategy } from '$lib/strategy/calculations/widowed-benefits';
import {
  type WidowedBenefitUse,
  type WidowedContext,
  type WidowedResult,
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
  | { readonly kind: 'not-needed' }
  /** Own benefit only: there is no retirement benefit on their record. */
  | { readonly kind: 'no-benefit' };

export interface WidowedRecommendation {
  readonly survivor: WidowedClaimAdvice;
  readonly own: WidowedClaimAdvice;
  /**
   * Which benefit starts first when the plan uses both, so the page can say
   * "then switch"; null when it uses only one.
   */
  readonly first: 'survivor' | 'own' | 'together' | null;
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

/**
 * What the page recommends for `result`, the best strategy across the
 * widow(er)'s death distribution.
 */
export function widowedRecommendation(
  context: WidowedContext,
  result: WidowedResult
): WidowedRecommendation {
  const { strategy } = result;
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
  const own: WidowedClaimAdvice = hasOwnRecord
    ? adviceFor(
        context,
        strategy.ownStart,
        amounts.own,
        context.filed.own,
        use.own
      )
    : { kind: 'no-benefit' };

  let first: WidowedRecommendation['first'] = null;
  if (use.survivor && use.own && hasOwnRecord) {
    const s = strategy.survivorStart.asMonths();
    const o = strategy.ownStart.asMonths();
    first = s < o ? 'survivor' : o < s ? 'own' : 'together';
  }
  return { survivor, own, first, expectedNPVCents: result.npvCents };
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
): WidowedAlternative[] {
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
