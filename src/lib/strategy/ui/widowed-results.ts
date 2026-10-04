import { Money } from '$lib/money';
import {
  optimalStrategyWidowed,
  type WidowedContext,
  widowedBenefitUse,
} from '$lib/strategy/calculations/widowed-optimizer';
import { CalculationResults } from './calculation-results.js';
import type { DeathAgeBucket } from './grid-sizing.js';
import type { PlotSeries } from './plot-range.js';

/**
 * The best widowed-mode plan for each death age, one row per bucket, for
 * the chart and the scenario cards. Each row's `widowed` holds the plan;
 * `filingAge1` repeats its own retirement start.
 */
export function widowedResultsByDeathAge(
  context: WidowedContext,
  buckets: DeathAgeBucket[]
): CalculationResults {
  const results = new CalculationResults(buckets.length, 1);
  results.beginRun();
  buckets.forEach((bucket1, i) => {
    const finalDate = context.survivor.birthdate.dateAtLayAge(
      bucket1.expectedAge
    );
    const best = optimalStrategyWidowed(context, finalDate);
    results.set(i, 0, {
      deathAge1: bucket1.label,
      bucket1,
      filingAge1: best.strategy.ownStart,
      widowed: {
        strategy: best.strategy,
        use: widowedBenefitUse(context, best.strategy, finalDate),
      },
      totalBenefit: Money.fromCents(best.npvCents),
      filingAge1Years: best.strategy.ownStart.years(),
      filingAge1Months: best.strategy.ownStart.modMonths(),
    });
  });
  results.completeRun();
  return results;
}

/**
 * The chart's lines in widowed mode: when to start each benefit, with a gap
 * at death ages where it is never the larger one. The survivor color was
 * checked against the own-benefit blue and the mortality red for color
 * vision deficiency separation and contrast.
 */
export const WIDOWED_PLOT_SERIES: readonly PlotSeries[] = [
  {
    label: 'Survivor benefit',
    color: '#0f8a63',
    filingAgeOf: (r) =>
      r.widowed?.use.survivor ? r.widowed.strategy.survivorStart : null,
  },
  {
    label: 'Your retirement benefit',
    color: '#005ea5',
    filingAgeOf: (r) =>
      r.widowed?.use.own ? r.widowed.strategy.ownStart : null,
  },
];
