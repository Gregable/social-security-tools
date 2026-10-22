/**
 * Golden test case generator for expectedNPVCouple.
 *
 * Records the exact output of the slow reference expectedNPVCouple for 1,000
 * varied couples, which expected-npv-couple-goldens.test.ts uses to validate
 * the optimized implementation.
 *
 * Skipped in normal runs. See golden-modes.ts for the modes:
 *   GENERATE_COUPLE_GOLDENS=recompute npx vitest run src/test/strategy/generate-goldens.test.ts
 *   GENERATE_COUPLE_GOLDENS=regenerate npx vitest run src/test/strategy/generate-goldens.test.ts
 * Output: src/test/strategy/goldens/couple-goldens.json
 *
 * Inputs come from couple-goldens-sampling.ts, a seeded PRNG that rejects
 * draws only on their own values, never on a result; golden-inputs.test.ts
 * checks the committed inputs against it.
 */

import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { expectedNPVCouple } from '$lib/strategy/calculations/expected-npv';
import {
  COUPLE_GOLDEN_CASES,
  COUPLE_GOLDENS_FILE,
  type CoupleGoldenInputs,
  drawCoupleInputs,
} from './couple-goldens-sampling';
import { goldenMode, readGoldens, writeGoldens } from './golden-modes';

const GOLDENS_PATH = resolve(__dirname, COUPLE_GOLDENS_FILE);
const FORMAT = { indent: 2, trailingNewline: false };
const CASES = COUPLE_GOLDEN_CASES;

interface CoupleGoldenOutput {
  filingAge0Months: number;
  filingAge1Months: number;
  expectedNPVCents: number;
  // Top 5 for additional validation
  top5: Array<{
    filingAge0Months: number;
    filingAge1Months: number;
    expectedNPVCents: number;
  }>;
}

interface GoldenTestCase {
  id: number;
  inputs: CoupleGoldenInputs;
  output: CoupleGoldenOutput;
}

/**
 * The slow reference's answer for a couple.
 *
 * @throws Error if it has none: every couple has at least one filing option
 *   each, so an empty result is a library bug, not a case to skip.
 */
function computeOutput(inputs: CoupleGoldenInputs): CoupleGoldenOutput {
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
  // When swapOrder is true, recipients[0] is the lower-PIA "dependent";
  // deathProbs0 / deathProbs1 are already paired by index.
  const recipients: [Recipient, Recipient] = inputs.swapOrder
    ? [dep, earner]
    : [earner, dep];

  const results = expectedNPVCouple(
    recipients,
    MonthDate.initFromYearsMonths({
      years: inputs.currentDateYear,
      months: inputs.currentDateMonth,
    }),
    inputs.discountRate,
    [inputs.deathProbs0, inputs.deathProbs1]
  );
  if (results.length === 0) {
    throw new Error(`no result for ${JSON.stringify(inputs)}`);
  }

  const top5 = results.slice(0, 5).map((r) => ({
    filingAge0Months: r.filingAges[0].asMonths(),
    filingAge1Months: r.filingAges[1].asMonths(),
    expectedNPVCents: r.expectedNPVCents,
  }));
  return {
    filingAge0Months: top5[0].filingAge0Months,
    filingAge1Months: top5[0].filingAge1Months,
    expectedNPVCents: top5[0].expectedNPVCents,
    top5,
  };
}

/** Fresh inputs from the seeded stream, with their outputs. */
function regenerate(): GoldenTestCase[] {
  return drawCoupleInputs().map((inputs, id) => ({
    id,
    inputs,
    output: computeOutput(inputs),
  }));
}

const mode = goldenMode('GENERATE_COUPLE_GOLDENS');

describe.runIf(mode !== null)('couple golden generation', () => {
  it(
    `writes ${CASES} cases (${mode ?? 'skipped'})`,
    { timeout: 3_600_000 },
    () => {
      const goldens =
        mode === 'recompute'
          ? readGoldens<GoldenTestCase>(GOLDENS_PATH).map((g) => ({
              ...g,
              output: computeOutput(g.inputs),
            }))
          : regenerate();
      writeGoldens(GOLDENS_PATH, goldens, FORMAT);
    }
  );
});
