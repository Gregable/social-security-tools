/**
 * Golden test case generator for expectedNPVCouple.
 *
 * Generates 1,000 test cases with varied inputs and records the exact output
 * from the current (correct but slow) expectedNPVCouple function. These
 * goldens are used to validate optimized implementations.
 *
 * Run with: npm test src/test/strategy/generate-goldens.test.ts
 * Output: src/test/strategy/goldens/couple-goldens.json
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { expectedNPVCouple } from '$lib/strategy/calculations/expected-npv';

// Simple seedable PRNG (mulberry32)
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface GoldenTestCase {
  id: number;
  inputs: {
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
  };
  output: {
    filingAge0Months: number;
    filingAge1Months: number;
    expectedNPVCents: number;
    // Top 5 for additional validation
    top5: Array<{
      filingAge0Months: number;
      filingAge1Months: number;
      expectedNPVCents: number;
    }>;
  };
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

function generateTestCase(id: number, rng: () => number): GoldenTestCase {
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

  // Skip if either is too young (< 55) or too old (> 75)
  // to have a meaningful filing range
  if (earnerCurrentAge < 55 || earnerCurrentAge > 75) return null as any;
  if (depCurrentAge < 55 || depCurrentAge > 75) return null as any;

  // Generate death probability distributions (10-15 ages each)
  const numDeathAges = 10 + Math.floor(rng() * 6); // 10-15
  const startAge0 = Math.max(earnerCurrentAge, 62);
  const startAge1 = Math.max(depCurrentAge, 62);
  // These are keyed to the earner / dependent semantically (indices 0/1 by
  // PIA). When swapOrder is true below, we'll reorder both recipients and
  // their death distributions together so they stay paired correctly.
  const deathProbs0Raw = generateDeathProbs(rng, numDeathAges, startAge0);
  const deathProbs1Raw = generateDeathProbs(rng, numDeathAges, startAge1);

  // Create recipients. When swapOrder is true, recipients[0] is the lower-PIA
  // "dependent" and recipients[1] is the higher-PIA "earner". deathProbs0 /
  // deathProbs1 are paired with recipients[0] / recipients[1] respectively.
  const earnerRec = new Recipient();
  earnerRec.birthdate = Birthdate.FromYMD(
    earnerBirthYear,
    earnerBirthMonth,
    earnerBirthDay
  );
  earnerRec.setPia(Money.from(earnerPIA));

  const depRec = new Recipient();
  depRec.birthdate = Birthdate.FromYMD(
    depBirthYear,
    depBirthMonth,
    depBirthDay
  );
  depRec.setPia(Money.from(depPIA));

  const recipients: [Recipient, Recipient] = swapOrder
    ? [depRec, earnerRec]
    : [earnerRec, depRec];
  // Death distributions are keyed to the earner/dependent semantics: they were
  // generated from earnerCurrentAge/depCurrentAge. Keep them aligned with the
  // person they were generated for when we swap recipient order.
  const deathProbsByIndex: [DeathProbability[], DeathProbability[]] = swapOrder
    ? [deathProbs1Raw, deathProbs0Raw]
    : [deathProbs0Raw, deathProbs1Raw];

  const currentDate = MonthDate.initFromYearsMonths({
    years: currentDateYear,
    months: currentDateMonth,
  });

  // Run the exact calculation
  const results = expectedNPVCouple(
    recipients,
    currentDate,
    discountRate,
    deathProbsByIndex
  );

  if (results.length === 0) return null as any;

  const top5 = results.slice(0, 5).map((r) => ({
    filingAge0Months: r.filingAges[0].asMonths(),
    filingAge1Months: r.filingAges[1].asMonths(),
    expectedNPVCents: r.expectedNPVCents,
  }));

  return {
    id,
    inputs: {
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
      deathProbs0: deathProbsByIndex[0],
      deathProbs1: deathProbsByIndex[1],
    },
    output: {
      filingAge0Months: top5[0].filingAge0Months,
      filingAge1Months: top5[0].filingAge1Months,
      expectedNPVCents: top5[0].expectedNPVCents,
      top5,
    },
  };
}

describe('golden test case generation', () => {
  it(
    'generate 1000 golden test cases',
    () => {
      const rng = mulberry32(42);
      const goldens: GoldenTestCase[] = [];
      let attempts = 0;

      while (goldens.length < 1000 && attempts < 2000) {
        attempts++;
        const tc = generateTestCase(goldens.length, rng);
        if (tc !== null) {
          goldens.push(tc);
          if (goldens.length % 50 === 0) {
            console.log(
              `Generated ${goldens.length}/1000 goldens (${attempts} attempts)`
            );
          }
        }
      }

      console.log(
        `\nGenerated ${goldens.length} goldens from ${attempts} attempts`
      );

      // Write to file
      const outDir = resolve(__dirname, 'goldens');
      mkdirSync(outDir, { recursive: true });
      const outPath = resolve(outDir, 'couple-goldens.json');
      writeFileSync(outPath, JSON.stringify(goldens, null, 2));
      console.log(`Written to ${outPath}`);

      // Basic stats
      const avgNPV =
        goldens.reduce((s, g) => s + g.output.expectedNPVCents, 0) /
        goldens.length;
      console.log(`Average optimal NPV: $${(avgNPV / 100).toFixed(0)}`);
    },
    { timeout: 3600000 }
  ); // 1 hour timeout
});
