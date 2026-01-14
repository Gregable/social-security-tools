/**
 * Shared mock data factories for strategy component tests and stories.
 *
 * These factories consolidate common test data creation patterns used across
 * multiple test files and Storybook stories.
 */

import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  CalculationResults,
  type StrategyResult,
} from '$lib/strategy/ui/calculation-results';
import type { DeathAgeBucket } from '$lib/strategy/ui/grid-sizing';

// =============================================================================
// Recipient Factories
// =============================================================================

export interface RecipientOptions {
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  piaAmount?: number;
  name?: string;
  gender?: 'male' | 'female' | 'blended';
  healthMultiplier?: number;
  markFirst?: boolean;
  markSecond?: boolean;
}

/**
 * Creates a Recipient with customizable parameters.
 * Default: Born March 1, 1962, PIA of $2500, named "Alex", marked as first.
 */
export function createRecipient(options: RecipientOptions = {}): Recipient {
  const {
    birthYear = 1962,
    birthMonth = 3, // March (1-indexed for human readability)
    birthDay = 1,
    piaAmount = 2500,
    name = 'Alex',
    gender = 'blended',
    healthMultiplier = 1.0,
    markFirst = true,
    markSecond = false,
  } = options;

  const recipient = new Recipient();
  // Month is 0-indexed in Birthdate.FromYMD
  recipient.birthdate = Birthdate.FromYMD(birthYear, birthMonth - 1, birthDay);
  recipient.setPia(Money.from(piaAmount));
  recipient.name = name;
  recipient.gender = gender;
  recipient.healthMultiplier = healthMultiplier;

  if (markFirst) {
    recipient.markFirst();
  } else if (markSecond) {
    recipient.markSecond();
  }

  return recipient;
}

/**
 * Creates a pair of recipients for couple scenarios.
 * First recipient: Alex (higher earner), born 1965-03-15, PIA $2500
 * Second recipient: Jordan (lower earner), born 1967-07-22, PIA $1200
 */
export function createRecipientPair(): [Recipient, Recipient] {
  const recipient1 = createRecipient({
    birthYear: 1965,
    birthMonth: 3,
    birthDay: 15,
    piaAmount: 2500,
    name: 'Alex',
    markFirst: true,
  });

  const recipient2 = createRecipient({
    birthYear: 1967,
    birthMonth: 7,
    birthDay: 22,
    piaAmount: 1200,
    name: 'Jordan',
    markFirst: false,
    markSecond: true,
  });

  return [recipient1, recipient2];
}

// =============================================================================
// Death Age Bucket Factories
// =============================================================================

export interface BucketOptions {
  label?: string;
  midAge?: number;
  endAgeInclusive?: number | null;
  probability?: number;
}

/**
 * Creates a DeathAgeBucket for a given start age.
 */
export function createBucket(
  startAge: number,
  options: BucketOptions = {}
): DeathAgeBucket {
  const {
    label = startAge.toString(),
    midAge = startAge,
    endAgeInclusive = startAge,
    probability = 0.03,
  } = options;

  return {
    label,
    midAge,
    startAge,
    endAgeInclusive,
    probability,
    expectedAge: new MonthDuration(startAge * 12),
  };
}

/**
 * Creates a range of DeathAgeBuckets from startAge to endAge (inclusive).
 */
export function createBucketRange(
  startAge: number,
  endAge: number
): DeathAgeBucket[] {
  const buckets: DeathAgeBucket[] = [];
  for (let age = startAge; age <= endAge; age++) {
    buckets.push(createBucket(age));
  }
  return buckets;
}

/**
 * Creates three-year buckets similar to generateThreeYearBuckets.
 */
export function createThreeYearBuckets(
  startAge: number = 62,
  endAge: number = 100
): DeathAgeBucket[] {
  const buckets: DeathAgeBucket[] = [];
  let currentStart = startAge;

  while (currentStart + 1 < endAge) {
    const midAge = currentStart + 1;
    buckets.push(
      createBucket(currentStart, {
        label: String(midAge),
        midAge,
        endAgeInclusive: currentStart + 2,
        probability: 0.08, // ~8% for 3-year bucket
      })
    );
    currentStart += 3;
  }

  // Final open-ended bucket
  buckets.push(
    createBucket(currentStart, {
      label: `${currentStart}+`,
      midAge: currentStart,
      endAgeInclusive: null,
      probability: 0.05,
    })
  );

  return buckets;
}

// =============================================================================
// Strategy Result Factories
// =============================================================================

export interface StrategyResultOptions {
  deathAge1?: number | string;
  deathAge2?: number | string;
  filingAgeMonths1?: number;
  filingAgeMonths2?: number;
  totalBenefitCents?: number;
  bucket1?: DeathAgeBucket;
  bucket2?: DeathAgeBucket;
  deathProb1?: number;
  deathProb2?: number;
}

/**
 * Creates a StrategyResult with customizable parameters.
 */
export function createStrategyResult(
  options: StrategyResultOptions = {}
): StrategyResult {
  const {
    deathAge1 = 85,
    deathAge2,
    filingAgeMonths1 = 67 * 12, // 67 years
    filingAgeMonths2,
    totalBenefitCents = 75000000, // $750,000
    bucket1 = createBucket(typeof deathAge1 === 'number' ? deathAge1 : 85),
    bucket2,
    deathProb1 = 0.35,
    deathProb2,
  } = options;

  const result: StrategyResult = {
    deathAge1: String(deathAge1),
    bucket1,
    filingAge1: new MonthDuration(filingAgeMonths1),
    filingAge1Years: Math.floor(filingAgeMonths1 / 12),
    filingAge1Months: filingAgeMonths1 % 12,
    totalBenefit: Money.fromCents(totalBenefitCents),
    deathProb1,
  };

  if (deathAge2 !== undefined) {
    result.deathAge2 = String(deathAge2);
  }
  if (filingAgeMonths2 !== undefined) {
    result.filingAge2 = new MonthDuration(filingAgeMonths2);
    result.filingAge2Years = Math.floor(filingAgeMonths2 / 12);
    result.filingAge2Months = filingAgeMonths2 % 12;
  }
  if (bucket2) {
    result.bucket2 = bucket2;
  }
  if (deathProb2 !== undefined) {
    result.deathProb2 = deathProb2;
  }

  return result;
}

// =============================================================================
// Calculation Results Factories
// =============================================================================

export interface CalculationResultsOptions {
  /** How to determine filing age based on death age */
  filingAgePattern?:
    | 'typical' // Gradual increase from 62 to 70
    | 'flat-early' // Always file at 62
    | 'flat-late' // Always file at 70
    | 'sharp-transition'; // Sharp transition at age 80
  /** Start age for death age range (default: 62) */
  startAge?: number;
  /** End age for death age range (default: 100) */
  endAge?: number;
  /** Use monthly granularity (default: true) */
  monthlyGranularity?: boolean;
}

/**
 * Creates a CalculationResults matrix for single recipient scenarios.
 * Uses monthly buckets from startAge to endAge.
 */
export function createCalculationResults(
  options: CalculationResultsOptions = {}
): CalculationResults {
  const {
    filingAgePattern = 'typical',
    startAge = 62,
    endAge = 100,
    monthlyGranularity = true,
  } = options;

  const numRows = monthlyGranularity
    ? (endAge - startAge) * 12
    : endAge - startAge + 1;
  const results = new CalculationResults(numRows, 1);

  for (let i = 0; i < numRows; i++) {
    const deathAgeMonths = monthlyGranularity
      ? startAge * 12 + i
      : (startAge + i) * 12;
    const deathAge = deathAgeMonths / 12;

    const filingAgeMonths = calculateFilingAge(deathAge, filingAgePattern);

    results.set(i, 0, {
      deathAge1: monthlyGranularity ? deathAge.toFixed(2) : String(deathAge),
      bucket1: createBucket(deathAge),
      filingAge1: new MonthDuration(filingAgeMonths),
      totalBenefit: Money.from(500000 + deathAge * 1000),
      filingAge1Years: Math.floor(filingAgeMonths / 12),
      filingAge1Months: filingAgeMonths % 12,
    });
  }

  return results;
}

/**
 * Creates a 2D CalculationResults matrix for couple scenarios.
 */
export function createCoupleCalculationResults(
  rows: number = 13,
  cols: number = 13
): CalculationResults {
  const results = new CalculationResults(rows, cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const deathAge1 = 62 + i * 3;
      const deathAge2 = 62 + j * 3;

      // Filing ages vary based on death ages
      const filingAge1 = calculateFilingAge(deathAge1, 'typical');
      const filingAge2 = calculateFilingAge(deathAge2, 'typical');

      results.set(
        i,
        j,
        createStrategyResult({
          deathAge1,
          deathAge2,
          filingAgeMonths1: filingAge1,
          filingAgeMonths2: filingAge2,
          bucket1: createBucket(deathAge1, {
            label: String(deathAge1 + 1),
            midAge: deathAge1 + 1,
            endAgeInclusive: deathAge1 + 2,
          }),
          bucket2: createBucket(deathAge2, {
            label: String(deathAge2 + 1),
            midAge: deathAge2 + 1,
            endAgeInclusive: deathAge2 + 2,
          }),
        })
      );
    }
  }

  return results;
}

/**
 * Helper to calculate filing age based on death age and pattern.
 */
function calculateFilingAge(
  deathAge: number,
  pattern: CalculationResultsOptions['filingAgePattern']
): number {
  switch (pattern) {
    case 'flat-early':
      return 62 * 12;
    case 'flat-late':
      return 70 * 12;
    case 'sharp-transition':
      return deathAge < 80 ? 62 * 12 : 70 * 12;
    default:
      // Gradual increase from 62 to 70
      if (deathAge <= 75) {
        return 62 * 12;
      } else if (deathAge >= 88) {
        return 70 * 12;
      } else {
        const ratio = (deathAge - 75) / 13;
        return Math.round(62 * 12 + ratio * (70 - 62) * 12);
      }
  }
}

// =============================================================================
// Probability Distribution Factories
// =============================================================================

/**
 * Creates a realistic death probability distribution using a Gompertz-like curve.
 * Probability increases exponentially with age.
 */
export function createDeathProbDistribution(
  currentAge: number = 62
): { age: number; probability: number }[] {
  const distribution: { age: number; probability: number }[] = [];

  // Use a Gompertz-like mortality curve
  for (let age = currentAge; age <= 120; age++) {
    const baseRate = 0.001;
    const doublingTime = 8; // mortality doubles every ~8 years
    const prob = baseRate * 2 ** ((age - currentAge) / doublingTime);
    distribution.push({ age, probability: Math.min(prob, 1) });
  }

  // Normalize so probabilities sum to 1
  const total = distribution.reduce((sum, d) => sum + d.probability, 0);
  for (const d of distribution) {
    d.probability /= total;
  }

  return distribution;
}

/**
 * Creates a uniform death probability distribution (for testing edge cases).
 */
export function createUniformProbDistribution(
  startAge: number = 62,
  endAge: number = 100
): { age: number; probability: number }[] {
  const distribution: { age: number; probability: number }[] = [];
  const numAges = endAge - startAge + 1;
  const uniformProb = 1 / numAges;

  for (let age = startAge; age <= endAge; age++) {
    distribution.push({ age, probability: uniformProb });
  }

  return distribution;
}
