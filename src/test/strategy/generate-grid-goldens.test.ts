/**
 * Golden test case generator for optimalStrategyCouple (grid cell solver).
 *
 * Each golden is one call to the slow reference `optimalStrategyCouple` with
 * varied (recipients, finalDates, currentDate, discountRate), recording the
 * resulting optimal (filingAge0, filingAge1, npvCents). These goldens are
 * used to validate a future optimized implementation of the per-cell solver.
 *
 * Run with: npm test src/test/strategy/generate-grid-goldens.test.ts
 * Output: src/test/strategy/goldens/grid-goldens.json
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { optimalStrategyCouple } from '$lib/strategy/calculations/strategy-calc';

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface GridGoldenCase {
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
    // Grid-cell representative death ages in months (what the UI passes as
    // deathAgeBuckets[i].expectedAge.asMonths()). Encoded separately for each
    // recipient in the order they appear in `recipients`.
    deathAge0Months: number;
    deathAge1Months: number;
    // If true, recipients[0] is the lower-PIA dependent and recipients[1] is
    // the higher-PIA earner.
    swapOrder: boolean;
  };
  output: {
    filingAge0Months: number;
    filingAge1Months: number;
    npvCents: number;
  };
}

function generateCase(id: number, rng: () => number): GridGoldenCase | null {
  const earnerPIA = Math.floor(500 + rng() * 3500);
  const depPIA = rng() < 0.1 ? 0 : Math.floor(rng() * earnerPIA);

  const earnerBirthYear = Math.floor(1955 + rng() * 15);
  const earnerBirthMonth = Math.floor(rng() * 12);
  const earnerBirthDay = Math.floor(1 + rng() * 28);

  const depBirthYear = earnerBirthYear + Math.floor(rng() * 10) - 5;
  const depBirthMonth = Math.floor(rng() * 12);
  const depBirthDay = Math.floor(1 + rng() * 28);

  const discountRate = rng() < 0.1 ? 0 : rng() * 0.07;

  const currentDateYear = 2026;
  const currentDateMonth = 3;

  const earnerCurrentAge = currentDateYear - earnerBirthYear;
  const depCurrentAge = currentDateYear - depBirthYear;
  if (earnerCurrentAge < 55 || earnerCurrentAge > 75) return null;
  if (depCurrentAge < 55 || depCurrentAge > 75) return null;

  const swapOrder = rng() < 0.5;

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

  // Pick representative death ages (months) per recipient AFTER the swap, so
  // each death age is paired with the right person. The UI guarantees death
  // age >= person's current age + 1 year (buckets start past currentAge),
  // so we do the same here.
  const currentAge0 =
    currentDateYear - recipients[0].birthdate.layBirthdate().getUTCFullYear();
  const currentAge1 =
    currentDateYear - recipients[1].birthdate.layBirthdate().getUTCFullYear();
  const sampleBucketMonths = (minAge: number): number => {
    const minBucket = Math.max(minAge + 1, 63);
    const maxBucket = 101;
    const ageYears =
      Math.floor(minBucket + rng() * (maxBucket - minBucket)) + 0.5;
    return Math.round(ageYears * 12);
  };
  const deathAge0Months = sampleBucketMonths(currentAge0);
  const deathAge1Months = sampleBucketMonths(currentAge1);

  const finalDates: [MonthDate, MonthDate] = [
    recipients[0].birthdate.dateAtLayAge(new MonthDuration(deathAge0Months)),
    recipients[1].birthdate.dateAtLayAge(new MonthDuration(deathAge1Months)),
  ];

  const currentDate = MonthDate.initFromYearsMonths({
    years: currentDateYear,
    months: currentDateMonth,
  });

  const [filing0, filing1, npv] = optimalStrategyCouple(
    recipients,
    finalDates,
    currentDate,
    discountRate
  );

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
      deathAge0Months,
      deathAge1Months,
      swapOrder,
    },
    output: {
      filingAge0Months: filing0.asMonths(),
      filingAge1Months: filing1.asMonths(),
      npvCents: npv,
    },
  };
}

describe('grid golden test case generation', () => {
  it('generate 1000 grid goldens', { timeout: 3600000 }, () => {
    const rng = mulberry32(42);
    const goldens: GridGoldenCase[] = [];
    let attempts = 0;

    while (goldens.length < 1000 && attempts < 2000) {
      attempts++;
      const tc = generateCase(goldens.length, rng);
      if (tc !== null) {
        goldens.push(tc);
        if (goldens.length % 50 === 0) {
          console.log(
            `Generated ${goldens.length}/1000 grid goldens (${attempts} attempts)`
          );
        }
      }
    }

    console.log(
      `\nGenerated ${goldens.length} grid goldens from ${attempts} attempts`
    );

    const outDir = resolve(__dirname, 'goldens');
    mkdirSync(outDir, { recursive: true });
    const outPath = resolve(outDir, 'grid-goldens.json');
    writeFileSync(outPath, JSON.stringify(goldens, null, 2));
    console.log(`Written to ${outPath}`);

    const zeroPia = goldens.filter((g) => g.inputs.depPIA === 0).length;
    const zeroRate = goldens.filter((g) => g.inputs.discountRate === 0).length;
    const swapped = goldens.filter((g) => g.inputs.swapOrder).length;
    console.log(
      `Coverage: ${zeroPia} zero-PIA dep, ${zeroRate} zero-rate, ${swapped} swapped`
    );
  });
});
