import type { StrategyMode } from './strategy-mode';

const SINGLE =
  'With a PIA of $0 there is no retirement benefit on your record, so there ' +
  'is nothing to plan. A spouse or surviving spouse can still be paid on ' +
  "their partner's record: choose Married couple or Widowed instead.";

const COUPLE =
  'Both PIAs are $0, so neither of you has a benefit to plan: spousal and ' +
  'survivor benefits are paid on these same records.';

/**
 * A form problem when there is no benefit to plan: a single person's PIA is
 * $0, or both of a couple's are, since spousal and survivor benefits are
 * paid on those same records. Widowed mode needs no check here: its form
 * already requires the late spouse's PIA to be more than $0, so there is
 * always a survivor benefit. `piaValues` are dollars, null where not yet
 * entered; a missing PIA is left to the form, which already asks for it.
 */
export function nothingToPlanProblem(
  mode: StrategyMode,
  piaValues: readonly [number | null, number | null]
): string | null {
  const [first, second] = piaValues;
  if (mode === 'single') return first === 0 ? SINGLE : null;
  if (mode === 'couple' && first === 0 && second === 0) return COUPLE;
  return null;
}
