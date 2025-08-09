/**
 * Test Data Factories for Recipient Domain
 * ---------------------------------------
 * This module centralizes creation of domain objects used across the
 * Social Security calculation tests so individual test files stay concise
 * and consistent.
 *
 * Goals / Rationale:
 *  - DRY: Avoid repeating verbose Recipient / EarningRecord construction.
 *  - Stability: Provide deterministic defaults (birthdates, PIA, earnings)
 *    so assertions remain stable as external data tables evolve.
 *  - Readability: Let tests express business intent instead of setup noise.
 *  - Flexibility: Simple override objects allow selective customization
 *    without many bespoke helpers.
 *
 * Exposed factories:
 *  - makeRecipient: Generic single Recipient with configurable name, PIA,
 *    birthdate, gender, health multiplier, and relative position (first/second).
 *  - makeRecipients: Convenience pair (typical spousal scenario) unless
 *    overrides supplied.
 *  - makeEarningRecord: Minimal wrapper to create a single EarningRecord.
 *  - makeTop35Recipient: Pre-populated historical earnings block tailored
 *    for top-35 indexed earnings / AIME style tests; deliberately omits
 *    setting PIA to keep the instance in full-record mode (not PIA-only).
 *
 * Implementation notes:
 *  - healthMultiplier is assigned via a cast in case the underlying class
 *    hasn’t formalized the field yet—flag for later refinement.
 *  - makeTop35Recipient pushes records then reassigns the array to trigger
 *    any setter side-effects that recompute indexing or flags.
 *  - Defaults (e.g., $10k annual earnings, $100k generic earnings record)
 *    are chosen to exercise logic while staying easy to reason about.
 *
 * If future tests require more complex scenarios (e.g., staggered future
 * earnings, disability adjustments, COLA variations), prefer extending
 * this module rather than re-implementing ad hoc setup in test files.
 */
import { Recipient } from '$lib/recipient';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { EarningRecord } from '$lib/earning-record';

export function makeRecipient({
  name = 'Test',
  birthYMD = [1960, 0, 15] as [number, number, number],
  pia = 1000,
  gender = 'blended' as 'male' | 'female' | 'blended',
  healthMultiplier = 1.0,
  mark = 'none' as 'first' | 'second' | 'none',
} = {}) {
  const r = new Recipient();
  const [y, m, d] = birthYMD;
  r.birthdate = Birthdate.FromYMD(y, m, d);
  r.setPia(Money.from(pia));
  r.gender = gender;
  (r as any).healthMultiplier = healthMultiplier; // in case not defined in class yet
  r.name = name;
  if (mark === 'first') r.markFirst();
  if (mark === 'second') r.markSecond();
  return r;
}

export function makeRecipients(
  overrides: Partial<Parameters<typeof makeRecipient>[0]>[] = []
) {
  const base: Partial<Parameters<typeof makeRecipient>[0]>[] = [
    { name: 'Alex', mark: 'first' },
    { name: 'Chris', mark: 'second', pia: 500 },
  ];
  return (overrides.length ? overrides : base).map((o) => makeRecipient(o)) as [
    Recipient,
    Recipient,
  ];
}

// Create an earning record for tests with sensible defaults.
export function makeEarningRecord(
  year: number,
  earnings: Money = Money.from(100 * 1000)
) {
  return new EarningRecord({
    year,
    taxedEarnings: earnings,
    taxedMedicareEarnings: earnings,
  });
}

// Creates a recipient with a birthdate derived from startYear - 5 and a
// contiguous block of earnings records starting at startYear. Designed to
// support top-35 style earnings tests. Defaults replicate the scenario used
// in recipient.test.ts.
export function makeTop35Recipient({
  startYear = 1965,
  years = 40,
  annualEarnings = Money.from(10 * 1000),
}: {
  startYear?: number;
  years?: number;
  annualEarnings?: Money;
} = {}) {
  // Create a base recipient WITHOUT setting PIA (avoid triggering isPiaOnly_)
  const r = new (Recipient as any)();
  r.birthdate = Birthdate.FromYMD(startYear - 5, 0, 2);
  for (let i = 0; i < years; i++) {
    r.earningsRecords.push(makeEarningRecord(startYear + i, annualEarnings));
  }
  // Force refresh after push() calls
  // eslint-disable-next-line no-self-assign
  r.earningsRecords = r.earningsRecords;
  return r as Recipient;
}
