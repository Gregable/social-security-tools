import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { NOT_FILED_WIDOWED } from '$lib/strategy/calculations/late-spouse';
import {
  createWidowedContext,
  optimalStrategyWidowed,
  widowedBenefitUse,
} from '$lib/strategy/calculations/widowed-optimizer';
import {
  CalculationStatus,
  type StrategyResult,
} from '$lib/strategy/ui/calculation-results';
import { generateMonthlyBuckets } from '$lib/strategy/ui/grid-sizing';
import {
  WIDOWED_PLOT_SERIES,
  widowedResultsByDeathAge,
} from '$lib/strategy/ui/widowed-results';

function makeRecipient(pia: number, year: number, monthIndex: number) {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(year, monthIndex, 15);
  r.setPia(Money.from(pia));
  return r;
}

const age = (years: number, months: number) =>
  MonthDuration.initFromYearsMonths({ years, months });

/** Born 15 March 1964: 62y7m in October 2026; survivor FRA 67. */
const survivor = makeRecipient(1200, 1964, 2);
const context = createWidowedContext(
  survivor,
  {
    // Died in November 2025 at 64y8m without claiming: the survivor
    // benefit is based on 100% of the $2,600 PIA, with no limit.
    recipient: makeRecipient(2600, 1961, 2),
    deathDate: MonthDate.initFromYearsMonths({ years: 2025, months: 10 }),
    claim: { kind: 'none' },
  },
  MonthDate.initFromYearsMonths({ years: 2026, months: 9 }),
  0.025,
  NOT_FILED_WIDOWED
);
const buckets = generateMonthlyBuckets(64 * 12, [
  { age: 64, probability: 0.5 },
  { age: 90, probability: 0.5 },
]).slice(0, 40);

describe('widowedResultsByDeathAge', () => {
  it('has one complete row per death age, with the best plan for it', () => {
    const results = widowedResultsByDeathAge(context, buckets);
    expect(results.status()).toBe(CalculationStatus.Complete);
    expect(results.rows()).toBe(buckets.length);
    expect(results.cols()).toBe(1);
    buckets.forEach((bucket, i) => {
      const finalDate = survivor.birthdate.dateAtLayAge(bucket.expectedAge);
      const best = optimalStrategyWidowed(context, finalDate);
      const row = results.get(i, 0);
      expect(row?.bucket1).toBe(bucket);
      expect(row?.widowed).toEqual({
        strategy: best.strategy,
        use: widowedBenefitUse(context, best.strategy, finalDate),
      });
      expect(row?.filingAge1.asMonths()).toBe(
        best.strategy.ownStart.asMonths()
      );
      expect(row?.totalBenefit.cents()).toBe(
        Money.fromCents(best.npvCents).cents()
      );
    });
  });

  it('starts the survivor benefit now for an early death, with no own benefit needed', () => {
    // Now, at 62y7m, 53 months before survivor FRA: reduced by
    // 28.5% x 53/84 = 17.98%, to $2,132. The own benefit on a $1,200 PIA
    // never comes close.
    const row = widowedResultsByDeathAge(context, buckets).get(0, 0);
    expect(row?.widowed?.strategy.survivorStart.asMonths()).toBe(
      age(62, 7).asMonths()
    );
    expect(row?.widowed?.use).toEqual({ survivor: true, own: false });
  });
});

describe('WIDOWED_PLOT_SERIES', () => {
  const [survivorLine, ownLine] = WIDOWED_PLOT_SERIES;
  const row = widowedResultsByDeathAge(context, buckets).get(0, 0);
  if (row === undefined || row.widowed === undefined) {
    throw new Error('expected a widowed row');
  }

  function withUse(survivorUsed: boolean, ownUsed: boolean): StrategyResult {
    return {
      ...row,
      widowed: {
        ...row.widowed,
        use: { survivor: survivorUsed, own: ownUsed },
      },
    } as StrategyResult;
  }

  it('draws each benefit at its start age while the plan uses it', () => {
    const both = withUse(true, true);
    expect(survivorLine.filingAgeOf(both)?.asMonths()).toBe(
      row.widowed.strategy.survivorStart.asMonths()
    );
    expect(ownLine.filingAgeOf(both)?.asMonths()).toBe(
      row.widowed.strategy.ownStart.asMonths()
    );
  });

  it('leaves a gap for a benefit the plan does not need', () => {
    expect(survivorLine.filingAgeOf(withUse(false, true))).toBe(null);
    expect(ownLine.filingAgeOf(withUse(true, false))).toBe(null);
  });

  it('draws nothing for a row without a widowed plan', () => {
    const { widowed: _, ...single } = row;
    expect(survivorLine.filingAgeOf(single as StrategyResult)).toBe(null);
    expect(ownLine.filingAgeOf(single as StrategyResult)).toBe(null);
  });
});
