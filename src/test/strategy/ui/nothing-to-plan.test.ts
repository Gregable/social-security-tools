import { describe, expect, it } from 'vitest';
import { nothingToPlanProblem } from '$lib/strategy/ui/nothing-to-plan';

describe('nothingToPlanProblem', () => {
  it('stops a single person with a $0 PIA, and points to the other modes', () => {
    expect(nothingToPlanProblem('single', [0, null])).toMatch(
      /Married couple|Widowed/
    );
    expect(nothingToPlanProblem('single', [1200, null])).toBe(null);
  });

  it('stops a couple only when both PIAs are $0', () => {
    expect(nothingToPlanProblem('couple', [0, 0])).not.toBe(null);
    // A spouse with no record of their own can still get spousal benefits.
    expect(nothingToPlanProblem('couple', [0, 1500])).toBe(null);
    expect(nothingToPlanProblem('couple', [1500, 0])).toBe(null);
  });

  it('leaves widowed mode to its own form, which requires a survivor benefit', () => {
    // WidowedInputs rejects a late spouse's PIA of $0 before Continue.
    expect(nothingToPlanProblem('widowed', [0, 0])).toBe(null);
    expect(nothingToPlanProblem('widowed', [0, 1500])).toBe(null);
  });

  it('leaves a missing PIA to the form, which asks for it', () => {
    expect(nothingToPlanProblem('single', [null, null])).toBe(null);
    expect(nothingToPlanProblem('couple', [0, null])).toBe(null);
  });
});
