/**
 * Golden test case generator for optimalStrategyCouple (grid cell solver).
 *
 * Each golden is one call to the slow reference `optimalStrategyCouple` with
 * varied (recipients, finalDates, currentDate, discountRate), recording the
 * resulting optimal (filingAge0, filingAge1, npvCents). grid-optimal-goldens
 * .test.ts uses them to validate the optimized per-cell solvers.
 *
 * Skipped in normal runs. See golden-modes.ts for the modes:
 *   GENERATE_GRID_GOLDENS=recompute npx vitest run src/test/strategy/generate-grid-goldens.test.ts
 *   GENERATE_GRID_GOLDENS=regenerate npx vitest run src/test/strategy/generate-grid-goldens.test.ts
 * Output: src/test/strategy/goldens/grid-goldens.json
 *
 * Coverage scope:
 *   - Inputs are constrained so both recipients have earliestFiling < 70y,
 *     i.e. both still have a filing age to choose. Cases where a recipient is
 *     already past age 70y6m at currentDate are not represented here.
 *
 *     They used to be excluded on the grounds that they produced a sentinel
 *     in both paths and that the UI never generated them. Both claims were
 *     wrong: the UI does reach them (a user simply enters a birthdate over
 *     70), and the sentinel was the bug — the couple path actually threw
 *     `RangeError: Invalid typed array length`. Since the optimizers now
 *     return a real result there, these cases WOULD validate something, and
 *     extending the generator to cover them is worthwhile. Until then, see
 *     over-70-filing.test.ts, which pins slow-vs-fast agreement in that
 *     regime directly.
 *   - Death ages are always >= currentAge + 1 year (mirrors UI buckets,
 *     which start past the person's current age).
 *
 * Stability:
 *   - NPV values depend on src/lib/constants.ts (SSA bend points, COLA,
 *     wage indices) and the benefit rules: recompute after either changes.
 *   - Inputs are drawn from a seeded PRNG (mulberry32 seed=42) and rejected
 *     only on their own values, never on a result, so regenerating
 *     reproduces them for as long as the sampling below is unchanged.
 */

import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { optimalStrategyCouple } from '$lib/strategy/calculations/strategy-calc';
import { goldenMode, readGoldens, writeGoldens } from './golden-modes';

const GOLDENS_PATH = resolve(__dirname, 'goldens/grid-goldens.json');
const FORMAT = { indent: 2, trailingNewline: false };
const CASES = 1000;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface GridGoldenInputs {
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

interface GridGoldenOutput {
  filingAge0Months: number;
  filingAge1Months: number;
  npvCents: number;
}

interface GridGoldenCase {
  id: number;
  inputs: GridGoldenInputs;
  output: GridGoldenOutput;
}

/** The two recipients in the order the inputs describe. */
function recipientsFor(inputs: GridGoldenInputs): [Recipient, Recipient] {
  const recipient = (pia: number, y: number, m: number, d: number) => {
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(y, m, d);
    r.setPia(Money.from(pia));
    return r;
  };
  const earner = recipient(
    inputs.earnerPIA,
    inputs.earnerBirthYear,
    inputs.earnerBirthMonth,
    inputs.earnerBirthDay
  );
  const dep = recipient(
    inputs.depPIA,
    inputs.depBirthYear,
    inputs.depBirthMonth,
    inputs.depBirthDay
  );
  return inputs.swapOrder ? [dep, earner] : [earner, dep];
}

/**
 * Draws one case from the seeded stream, or null when the draw falls outside
 * the ages the goldens cover. Depends only on `rng`.
 */
function sampleInputs(rng: () => number): GridGoldenInputs | null {
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

  // Both recipients must be able to file: earliestFiling <= 70y, which
  // implies currentAge < 70y+6m. Year-subtraction may off-by-one the real
  // age by up to 11 months (birthmonth not accounted for), so we use 69
  // as a conservative cap.
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
  const recipients = recipientsFor({
    ...partial,
    deathAge0Months: 0,
    deathAge1Months: 0,
    swapOrder,
  });
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

  return { ...partial, deathAge0Months, deathAge1Months, swapOrder };
}

/**
 * The slow reference's optimal strategy for a case.
 *
 * @throws Error if it returns the old negative sentinel: since the optimizers
 *   handle every age, that is a library bug, not a case to skip.
 */
function computeOutput(inputs: GridGoldenInputs): GridGoldenOutput {
  const recipients = recipientsFor(inputs);
  const finalDates: [MonthDate, MonthDate] = [
    recipients[0].birthdate.dateAtLayAge(
      new MonthDuration(inputs.deathAge0Months)
    ),
    recipients[1].birthdate.dateAtLayAge(
      new MonthDuration(inputs.deathAge1Months)
    ),
  ];
  const [filing0, filing1, npv] = optimalStrategyCouple(
    recipients,
    finalDates,
    MonthDate.initFromYearsMonths({
      years: inputs.currentDateYear,
      months: inputs.currentDateMonth,
    }),
    inputs.discountRate
  );
  if (npv < 0) {
    throw new Error(`negative NPV for ${JSON.stringify(inputs)}`);
  }
  return {
    filingAge0Months: filing0.asMonths(),
    filingAge1Months: filing1.asMonths(),
    npvCents: npv,
  };
}

/** Fresh inputs from the seeded stream, with their outputs. */
function regenerate(): GridGoldenCase[] {
  const rng = mulberry32(42);
  const goldens: GridGoldenCase[] = [];
  let attempts = 0;
  while (goldens.length < CASES && attempts < 5 * CASES) {
    attempts++;
    const inputs = sampleInputs(rng);
    if (inputs === null) continue;
    goldens.push({ id: goldens.length, inputs, output: computeOutput(inputs) });
  }
  if (goldens.length < CASES) {
    throw new Error(`only ${goldens.length} cases in ${attempts} attempts`);
  }
  return goldens;
}

const mode = goldenMode('GENERATE_GRID_GOLDENS');

describe.runIf(mode !== null)('grid golden generation', () => {
  it(`writes ${CASES} cases (${mode})`, { timeout: 3_600_000 }, () => {
    const goldens =
      mode === 'recompute'
        ? readGoldens<GridGoldenCase>(GOLDENS_PATH).map((g) => ({
            ...g,
            output: computeOutput(g.inputs),
          }))
        : regenerate();
    writeGoldens(GOLDENS_PATH, goldens, FORMAT);
  });
});
