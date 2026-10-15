import type { NoChoiceReason } from '$lib/components/recommended-filing-card';

/**
 * Which explanation NoFilingDecisionPanel gives when nobody in the scenario
 * has a filing age left to choose. `past-seventy` is a single person;
 * `widowed` covers every widowed case; the rest are couples, named for why
 * each of the two has no choice (see `noChoiceVariant`).
 */
export type NoChoiceVariant =
  | 'past-seventy'
  | 'both-past-seventy'
  | 'both-filed'
  | 'filed-and-past-seventy'
  | 'filed-and-spousal-only'
  | 'past-seventy-and-spousal-only'
  | 'widowed';

/**
 * The explanation for a couple, from why each of them has no filing age
 * left to choose. Both cannot be `spousal-only`: that needs the other to
 * have a benefit of their own. For the same reason, beside a `filed`
 * spouse a `spousal-only` one always has the $0 PIA, since `filed` is
 * checked first.
 */
export function noChoiceVariant(
  reasons: readonly [NoChoiceReason, NoChoiceReason]
): NoChoiceVariant {
  const filed = reasons.filter((reason) => reason === 'filed').length;
  if (filed === 2) return 'both-filed';
  if (reasons.includes('spousal-only')) {
    return filed === 1
      ? 'filed-and-spousal-only'
      : 'past-seventy-and-spousal-only';
  }
  return filed === 1 ? 'filed-and-past-seventy' : 'both-past-seventy';
}
