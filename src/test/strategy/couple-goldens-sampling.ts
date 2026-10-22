/**
 * Input sampling for the couple goldens (generate-goldens.test.ts).
 *
 * Inputs are drawn from a seeded PRNG and rejected only on their own
 * values (ages), never on a library result: a skip that depends on the
 * library makes the stream of inputs, and so the whole file, change
 * whenever the library does. golden-inputs.test.ts checks that
 * couple-goldens.json holds exactly what drawCoupleInputs() draws.
 */

import type { DeathProbability } from '$lib/life-tables';
import { drawInputs } from './golden-sampling';

export const COUPLE_GOLDENS_FILE = 'goldens/couple-goldens.json';
export const COUPLE_GOLDEN_CASES = 1000;

export interface CoupleGoldenInputs {
  earnerPIA: number;
  depPIA: number;
  earnerBirthYear: number;
  earnerBirthMonth: number;
  earnerBirthDay: number;
  depBirthYear: number;
  depBirthMonth: number;
  depBirthDay: number;
  discountRate: number;
  currentDateYear: number;
  currentDateMonth: number;
  // When true, recipients[0] is the lower-PIA "dependent" and recipients[1]
  // is the higher-PIA "earner". Exercises the earner/dependent role
  // classification in the optimized code.
  swapOrder: boolean;
  deathProbs0: DeathProbability[];
  deathProbs1: DeathProbability[];
}

function generateDeathProbs(
  rng: () => number,
  numAges: number,
  currentAge: number
): DeathProbability[] {
  // Pick a mean death age (72-95) and spread (5-12)
  const meanDeath = 72 + rng() * 23;
  const spread = 5 + rng() * 7;

  // Generate ages: evenly spaced from currentAge to 100, pick numAges
  const ages: number[] = [];
  const step = Math.max(1, Math.floor((100 - currentAge) / numAges));
  for (let a = currentAge; a <= 100 && ages.length < numAges; a += step) {
    ages.push(a);
  }
  // Ensure we have at least numAges entries
  while (ages.length < numAges && ages[ages.length - 1] < 100) {
    ages.push(ages[ages.length - 1] + 1);
  }

  // Assign probabilities using Gaussian-like weights
  const weights = ages.map((a) =>
    Math.exp(-0.5 * ((a - meanDeath) / spread) ** 2)
  );
  const totalWeight = weights.reduce((s, w) => s + w, 0);

  return ages.map((age, i) => ({
    age,
    probability: weights[i] / totalWeight,
  }));
}

/**
 * Draws one couple from the seeded stream, or null when the draw falls
 * outside the ages the goldens cover. Depends only on `rng`.
 */
function sampleCoupleInputs(rng: () => number): CoupleGoldenInputs | null {
  // Random PIAs. ~10% of cases have a zero-PIA "dependent" (tests the
  // depZeroPia branch of the optimized code).
  const earnerPIA = Math.floor(500 + rng() * 3500);
  const depPIA = rng() < 0.1 ? 0 : Math.floor(rng() * earnerPIA);

  // Random birthdates
  const earnerBirthYear = Math.floor(1955 + rng() * 15); // 1955-1969
  const earnerBirthMonth = Math.floor(rng() * 12); // 0-11
  const earnerBirthDay = Math.floor(1 + rng() * 28); // 1-28

  // Dependent within 5 years of earner
  const depBirthYear = earnerBirthYear + Math.floor(rng() * 10) - 5;
  const depBirthMonth = Math.floor(rng() * 12);
  const depBirthDay = Math.floor(1 + rng() * 28);

  // Random discount rate (0-7%). ~10% of cases have exactly 0 (tests the
  // mRate===0 branch of the optimized code).
  const discountRate = rng() < 0.1 ? 0 : rng() * 0.07;

  // ~50% of the time, swap recipient order so the higher-PIA recipient is at
  // recipients[1] instead of [0]. This exercises the classifyEarnerDependent
  // index remapping in expectedNPVCoupleOptimized.
  const swapOrder = rng() < 0.5;

  // Current date: use 2026-03 (April 2026) for consistency
  const currentDateYear = 2026;
  const currentDateMonth = 3;

  // Compute current ages
  const earnerCurrentAge = currentDateYear - earnerBirthYear;
  const depCurrentAge = currentDateYear - depBirthYear;

  // Skip if either is too young (< 55) or too old (> 75). Past 70y6m a
  // recipient has a single filing option left, which the goldens include.
  if (earnerCurrentAge < 55 || earnerCurrentAge > 75) return null;
  if (depCurrentAge < 55 || depCurrentAge > 75) return null;

  // Generate death probability distributions (10-15 ages each)
  const numDeathAges = 10 + Math.floor(rng() * 6); // 10-15
  const startAge0 = Math.max(earnerCurrentAge, 62);
  const startAge1 = Math.max(depCurrentAge, 62);
  // These are keyed to the earner / dependent semantically. When swapOrder
  // is true, reorder them with the recipients so they stay paired.
  const deathProbs0Raw = generateDeathProbs(rng, numDeathAges, startAge0);
  const deathProbs1Raw = generateDeathProbs(rng, numDeathAges, startAge1);
  const [deathProbs0, deathProbs1] = swapOrder
    ? [deathProbs1Raw, deathProbs0Raw]
    : [deathProbs0Raw, deathProbs1Raw];

  return {
    earnerPIA,
    depPIA,
    earnerBirthYear,
    earnerBirthMonth,
    earnerBirthDay,
    depBirthYear,
    depBirthMonth,
    depBirthDay,
    discountRate,
    currentDateYear,
    currentDateMonth,
    swapOrder,
    deathProbs0,
    deathProbs1,
  };
}

/** The committed couple inputs, in order: 1000 draws from seed 42. */
export function drawCoupleInputs(): CoupleGoldenInputs[] {
  return drawInputs(
    42,
    COUPLE_GOLDEN_CASES,
    2 * COUPLE_GOLDEN_CASES,
    sampleCoupleInputs
  );
}
