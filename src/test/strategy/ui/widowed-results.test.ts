import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  createWidowedContext,
  NOT_FILED_WIDOWED,
  optimalStrategyWidowed,
  widowedBenefitUse,
} from '$lib/strategy/calculations/widowed-optimizer';
import { CalculationStatus } from '$lib/strategy/ui/calculation-results';
import { generateMonthlyBuckets } from '$lib/strategy/ui/grid-sizing';
import { widowedResultsByDeathAge } from '$lib/strategy/ui/widowed-results';

function makeRecipient(pia: number, year: number, monthIndex: number) {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(year, monthIndex, 15);
  r.setPia(Money.from(pia));
  return r;
}

describe('widowedResultsByDeathAge', () => {
  const survivor = makeRecipient(1200, 1964, 2);
  const context = createWidowedContext(
    survivor,
    {
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
      expect(row?.filingAge1.asMonths()).toBe(
        best.strategy.ownStart.asMonths()
      );
      expect(row?.survivorFilingAge?.asMonths()).toBe(
        best.strategy.survivorStart.asMonths()
      );
      expect(row?.benefitUse).toEqual(
        widowedBenefitUse(context, best.strategy, finalDate)
      );
      expect(row?.totalBenefit.cents()).toBe(
        Money.fromCents(best.npvCents).cents()
      );
    });
  });
});
