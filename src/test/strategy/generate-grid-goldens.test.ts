/**
 * Golden test case generator for optimalStrategyCouple (grid cell solver).
 *
 * Each golden is one call to the slow reference `optimalStrategyCouple` with
 * varied (recipients, finalDates, currentDate, discountRate), recording the
 * resulting optimal (filingAge0, filingAge1, npvCents).
 * grid-optimal-goldens.test.ts uses them to validate the optimized
 * per-cell solvers.
 *
 * Skipped in normal runs. See golden-modes.ts for the modes:
 *   GENERATE_GRID_GOLDENS=recompute npx vitest run src/test/strategy/generate-grid-goldens.test.ts
 *   GENERATE_GRID_GOLDENS=regenerate npx vitest run src/test/strategy/generate-grid-goldens.test.ts
 * Output: src/test/strategy/goldens/grid-goldens.json
 *
 * Coverage scope:
 *   - Inputs are constrained so both recipients still have a filing age to
 *     choose (earliestFiling < 70y). The age cap is conservative (see
 *     grid-goldens-sampling.ts), so the oldest SSA age is 69y4m: no case
 *     here has a recipient from 69y5m on, including the past-70y6m regime.
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
 *   - NPVs depend on the benefit rules and, through Recipient, on the
 *     retirement-age tables in src/lib/constants.ts. PIAs are given
 *     directly, so bend points, COLAs and wage indices don't enter.
 *     Recompute after a rule change.
 *   - Inputs come from grid-goldens-sampling.ts, a seeded PRNG that never
 *     consults a result; golden-inputs.test.ts checks the committed inputs
 *     against it.
 */

import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { optimalStrategyCouple } from '$lib/strategy/calculations/strategy-calc';
import { goldenMode, readGoldens, writeGoldens } from './golden-modes';
import {
  drawGridInputs,
  GRID_GOLDEN_CASES,
  GRID_GOLDENS_FILE,
  type GridGoldenInputs,
} from './grid-goldens-sampling';

const GOLDENS_PATH = resolve(__dirname, GRID_GOLDENS_FILE);
const FORMAT = { indent: 2, trailingNewline: false };
const CASES = GRID_GOLDEN_CASES;

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
 * The slow reference's optimal strategy for a case.
 *
 * @throws Error if the NPV is negative: the reference's -1 initializer
 *   survived because no filing pair was evaluated. filingAgeRange gives
 *   every recipient at least one age, so that is a library bug, not a case
 *   to skip.
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
  return drawGridInputs().map((inputs, id) => ({
    id,
    inputs,
    output: computeOutput(inputs),
  }));
}

const mode = goldenMode('GENERATE_GRID_GOLDENS');

describe.runIf(mode !== null)('grid golden generation', () => {
  it(
    `writes ${CASES} cases (${mode ?? 'skipped'})`,
    { timeout: 3_600_000 },
    () => {
      const goldens =
        mode === 'recompute'
          ? readGoldens<GridGoldenCase>(GOLDENS_PATH).map((g) => ({
              ...g,
              output: computeOutput(g.inputs),
            }))
          : regenerate();
      writeGoldens(GOLDENS_PATH, goldens, FORMAT);
    }
  );
});
