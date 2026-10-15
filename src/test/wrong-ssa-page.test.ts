import { describe, expect, it } from 'vitest';
import { parsePaste } from '$lib/ssa-parse';
import { detectWrongSsaPage } from '$lib/wrong-ssa-page';

/**
 * A synthetic stand-in for a copy of the my Social Security home page: the
 * page users land on after signing in. It links to the earnings record but
 * does not contain it.
 */
const HOME_PAGE_PASTE =
  'Skip to main content\n' +
  'my Social Security\n' +
  'Uncle Sam\n' +
  'Sign Out\n' +
  'What would you like to do?\n' +
  'Eligibility and Earnings\n' +
  'You have the 40 work credits you need to receive benefits!\n' +
  '\n' +
  'You earned $50,000 in 2025. Is this correct?\n' +
  '\n' +
  'Review your full earnings record now\n' +
  '\n' +
  ' Retirement Calculator\n' +
  'Your monthly benefit at your Full Retirement Age (FRA) of 67 is $2,000\n';

describe('detectWrongSsaPage', () => {
  it('recognizes the my Social Security home page', () => {
    expect(detectWrongSsaPage(HOME_PAGE_PASTE)).toBe('my_ssa_home');
  });

  it('is the case the parser rejects, so the paste step needs the hint', () => {
    expect(parsePaste(HOME_PAGE_PASTE)).toEqual([]);
  });

  it('tolerates the link text wrapped or spaced differently', () => {
    expect(detectWrongSsaPage('Review your full\nearnings  record\tnow')).toBe(
      'my_ssa_home'
    );
  });

  it('ignores case, in case the link is restyled', () => {
    expect(detectWrongSsaPage('REVIEW YOUR FULL EARNINGS RECORD NOW')).toBe(
      'my_ssa_home'
    );
  });

  it('returns null for an earnings record table', () => {
    expect(
      detectWrongSsaPage(
        'Work Year\nTaxed Social Security Earnings\n2018\t$100,000\t$100,000\n'
      )
    ).toBeNull();
  });

  it('returns null for unrelated text', () => {
    expect(detectWrongSsaPage('hello')).toBeNull();
    expect(detectWrongSsaPage('')).toBeNull();
  });
});
