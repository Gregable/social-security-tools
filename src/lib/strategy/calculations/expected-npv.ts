import type { DeathProbability } from '$lib/life-tables';
import { type MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import {
  earliestFiling,
  strategySumCentsCouple,
  strategySumCentsSingle,
} from './strategy-calc.js';

export interface FilingAgeResult {
  readonly filingAge: MonthDuration;
  readonly expectedNPVCents: number;
}

/**
 * Computes the probability-weighted expected NPV for every candidate filing
 * age for a single recipient.
 *
 * For each filing age, iterates over all death ages in the probability
 * distribution, computing NPV via the existing strategySumCentsSingle and
 * weighting by P(death at that age).
 *
 * @returns Array of {filingAge, expectedNPVCents} sorted descending by
 *          expectedNPVCents. The first element is the optimal filing age.
 */
export function expectedNPVSingle(
  recipient: Recipient,
  currentDate: MonthDate,
  discountRate: number,
  deathProbDist: DeathProbability[]
): FilingAgeResult[] {
  if (deathProbDist.length === 0) return [];

  const startFilingMonths = earliestFiling(recipient, currentDate).asMonths();
  const endFilingMonths = 70 * 12;

  const results: FilingAgeResult[] = [];

  for (let f = startFilingMonths; f <= endFilingMonths; f++) {
    const filingAge = new MonthDuration(f);
    let expectedNPVCents = 0;

    for (const { age: deathAge, probability } of deathProbDist) {
      if (probability === 0) continue;

      // Convert death age (yearly) to a MonthDate
      // Use mid-year (6 months) as the representative death month
      const deathAgeDuration = MonthDuration.initFromYearsMonths({
        years: deathAge,
        months: 6,
      });
      const finalDate = recipient.birthdate.dateAtLayAge(deathAgeDuration);

      // If death occurs before filing, NPV is 0 for this scenario
      const filingDate = recipient.birthdate.dateAtSsaAge(filingAge);
      if (finalDate.lessThan(filingDate)) continue;

      const npvCents = strategySumCentsSingle(
        recipient,
        finalDate,
        currentDate,
        discountRate,
        filingAge
      );

      expectedNPVCents += probability * npvCents;
    }

    results.push({ filingAge, expectedNPVCents });
  }

  results.sort((a, b) => b.expectedNPVCents - a.expectedNPVCents);
  return results;
}

export interface CoupleFilingAgeResult {
  readonly filingAges: [MonthDuration, MonthDuration];
  readonly expectedNPVCents: number;
}

/**
 * Computes the probability-weighted expected NPV for every candidate filing
 * age pair for a couple using the exact double-sum approach.
 *
 * For each filing pair, iterates over all (earnerDeathAge, depDeathAge) pairs,
 * computes the exact NPV via strategySumCentsCouple (which uses precise
 * monthly benefit periods), and weights by the joint death probability
 * P(earner dies at d_e) * P(dep dies at d_d).
 *
 * Deaths are assumed independent (standard actuarial assumption).
 *
 * @returns Array of {filingAges, expectedNPVCents} sorted descending by
 *          expectedNPVCents. The first element is the optimal filing pair.
 */
export function expectedNPVCouple(
  recipients: [Recipient, Recipient],
  currentDate: MonthDate,
  discountRate: number,
  deathProbDists: [DeathProbability[], DeathProbability[]]
): CoupleFilingAgeResult[] {
  if (deathProbDists[0].length === 0 || deathProbDists[1].length === 0) {
    return [];
  }

  const startFiling0 = earliestFiling(recipients[0], currentDate).asMonths();
  const startFiling1 = earliestFiling(recipients[1], currentDate).asMonths();
  const endFiling = 70 * 12;

  // Pre-compute death dates for each death age to avoid repeated allocation
  const deathDates: [MonthDate[], MonthDate[]] = [[], []];
  for (let i = 0; i < 2; i++) {
    for (const { age } of deathProbDists[i]) {
      deathDates[i].push(
        recipients[i].birthdate.dateAtLayAge(
          MonthDuration.initFromYearsMonths({ years: age, months: 6 })
        )
      );
    }
  }

  const results: CoupleFilingAgeResult[] = [];

  for (let f0 = startFiling0; f0 <= endFiling; f0++) {
    const filingAge0 = new MonthDuration(f0);

    for (let f1 = startFiling1; f1 <= endFiling; f1++) {
      const filingAge1 = new MonthDuration(f1);
      const strats: [MonthDuration, MonthDuration] = [filingAge0, filingAge1];

      let expectedNPVCents = 0;

      for (let ei = 0; ei < deathProbDists[0].length; ei++) {
        const pe = deathProbDists[0][ei].probability;
        if (pe === 0) continue;

        for (let di = 0; di < deathProbDists[1].length; di++) {
          const pd = deathProbDists[1][di].probability;
          if (pd === 0) continue;

          const npv = strategySumCentsCouple(
            recipients,
            [deathDates[0][ei], deathDates[1][di]],
            currentDate,
            discountRate,
            strats
          );

          expectedNPVCents += pe * pd * npv;
        }
      }

      results.push({
        filingAges: [filingAge0, filingAge1],
        expectedNPVCents,
      });
    }
  }

  results.sort((a, b) => b.expectedNPVCents - a.expectedNPVCents);
  return results;
}
