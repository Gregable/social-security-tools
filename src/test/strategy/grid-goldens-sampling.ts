/**
 * Input sampling for the grid goldens (generate-grid-goldens.test.ts).
 *
 * Inputs are drawn from a seeded PRNG and rejected only on their own
 * values (ages), never on a library result, so they never drift with the
 * library. golden-inputs.test.ts checks that grid-goldens.json holds
 * exactly what drawGridInputs() draws.
 */

import { drawInputs } from './golden-sampling';

export const GRID_GOLDENS_FILE = 'goldens/grid-goldens.json';
export const GRID_GOLDEN_CASES = 1000;

export interface GridGoldenInputs {
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
}

/**
 * Draws one case from the seeded stream, or null when the draw falls outside
 * the ages the goldens cover. Depends only on `rng`.
 */
function sampleGridInputs(rng: () => number): GridGoldenInputs | null {
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

  // Both recipients must still have a filing age to choose: earliestFiling
  // < 70y. Subtracting birth years from 2026 misstates the age in April by
  // -3 to +8 months, so 69 is a conservative cap; it also leaves out ages
  // from 69y5m, which do still have a choice.
  const earnerCurrentAge = currentDateYear - earnerBirthYear;
  const depCurrentAge = currentDateYear - depBirthYear;
  if (earnerCurrentAge < 55 || earnerCurrentAge > 69) return null;
  if (depCurrentAge < 55 || depCurrentAge > 69) return null;

  const swapOrder = rng() < 0.5;
  const partial = {
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
  };

  // Pick representative death ages (months) per recipient AFTER the swap, so
  // each death age is paired with the right person. The UI guarantees death
  // age >= person's current age + 1 year (buckets start past currentAge),
  // so we do the same here.
  const [currentAge0, currentAge1] = swapOrder
    ? [depCurrentAge, earnerCurrentAge]
    : [earnerCurrentAge, depCurrentAge];
  const sampleBucketMonths = (minAge: number): number => {
    const minBucket = Math.max(minAge + 1, 63);
    const maxBucket = 101;
    const ageYears =
      Math.floor(minBucket + rng() * (maxBucket - minBucket)) + 0.5;
    return Math.round(ageYears * 12);
  };
  const deathAge0Months = sampleBucketMonths(currentAge0);
  const deathAge1Months = sampleBucketMonths(currentAge1);

  return { ...partial, deathAge0Months, deathAge1Months, swapOrder };
}

/** The committed grid inputs, in order: 1000 draws from seed 42. */
export function drawGridInputs(): GridGoldenInputs[] {
  return drawInputs(
    42,
    GRID_GOLDEN_CASES,
    5 * GRID_GOLDEN_CASES,
    sampleGridInputs
  );
}
