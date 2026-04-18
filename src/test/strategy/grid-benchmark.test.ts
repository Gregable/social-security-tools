/**
 * Benchmark test for the per-cell grid solver. Measures end-to-end time to
 * process a realistic grid (14x14 death-age cells, ~96x96 filing pairs per
 * cell) using the current optimal-strategy implementation.
 *
 * Excluded from default runs; invoke explicitly to get timing.
 */

import { describe, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { optimalStrategyCoupleFast } from '$lib/strategy/calculations/optimal-strategy-fast';
import { optimalStrategyCoupleOptimized } from '$lib/strategy/calculations/strategy-calc';

function buildRecipient(
  year: number,
  month: number,
  day: number,
  pia: number
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(year, month, day);
  r.setPia(Money.from(pia));
  return r;
}

describe('grid benchmark', () => {
  it('timing: full 14x14 grid', { timeout: 120000 }, () => {
    const r0 = buildRecipient(1962, 5, 15, 2800);
    const r1 = buildRecipient(1964, 8, 22, 1600);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2026,
      months: 3,
    });
    const discountRate = 0.03;

    // 14 buckets per side (UI's generateThreeYearBuckets). Representative
    // death ages at bucket midpoints + 0.5y, in months.
    const deathAgeMonths = [
      762, 798, 834, 870, 906, 942, 978, 1014, 1050, 1086, 1122, 1158, 1194,
      1230,
    ];

    const iterations = 3;
    const cells = deathAgeMonths.length * deathAgeMonths.length;

    const runGrid = (
      solver: typeof optimalStrategyCoupleOptimized,
      label: string
    ) => {
      const times: number[] = [];
      for (let iter = 0; iter < iterations; iter++) {
        const start = performance.now();
        for (const d0 of deathAgeMonths) {
          for (const d1 of deathAgeMonths) {
            const finalDates: [MonthDate, MonthDate] = [
              r0.birthdate.dateAtLayAge(new MonthDuration(d0)),
              r1.birthdate.dateAtLayAge(new MonthDuration(d1)),
            ];
            solver(recipients, finalDates, currentDate, discountRate);
          }
        }
        times.push(performance.now() - start);
      }
      const min = Math.min(...times);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(
        `[${label}] (${cells} cells):` +
          ` min=${min.toFixed(1)}ms avg=${avg.toFixed(1)}ms` +
          ` per-cell=${(min / cells).toFixed(2)}ms` +
          ` runs=[${times.map((t) => t.toFixed(1)).join(', ')}]`
      );
      return min;
    };

    console.log('');
    const slow = runGrid(optimalStrategyCoupleOptimized, 'Optimized');
    const fast = runGrid(optimalStrategyCoupleFast, 'Fast');
    console.log(`\nSpeedup: ${(slow / fast).toFixed(1)}x`);
  });
});
