import { describe, expect, it } from 'vitest';
import {
  claimAgeComparison,
  EXAMPLE_PIA,
  exampleParent,
  familyPayout,
} from '$lib/child-benefit-example';
import { MAX_YEAR } from '$lib/constants';
import { Money } from '$lib/money';

describe('exampleParent', () => {
  it('turns 62 in the latest year the constants cover', () => {
    expect(exampleParent().birthdate.yearTurningSsaAge(62)).toBe(MAX_YEAR);
  });

  it('has a full retirement age of exactly 67', () => {
    const fra = exampleParent().normalRetirementAge();
    expect(fra.years()).toBe(67);
    expect(fra.modMonths()).toBe(0);
  });

  it('carries the example PIA unchanged', () => {
    expect(
      exampleParent().pia().primaryInsuranceAmount().equals(EXAMPLE_PIA)
    ).toBe(true);
  });
});

/**
 * The guide renders these exact figures and writes prose around them. When
 * a constants update moves them, update this table and re-read the prose in
 * child-benefits/+page.svelte together.
 */
describe('familyPayout', () => {
  it('leaves one child at the full 50% when the maximum does not bind', () => {
    const p = familyPayout(exampleParent(), 1);
    expect(p.familyMaximum.string()).toBe('$4,617.50');
    expect(p.eachUnlimited.string()).toBe('$1,250.00');
    expect(p.each.string()).toBe('$1,250.00');
    expect(p.familyTotal.string()).toBe('$3,750.00');
    expect(p.capped).toBe(false);
  });

  it('splits the pool between two children once the maximum binds', () => {
    const p = familyPayout(exampleParent(), 2);
    expect(p.each.string()).toBe('$1,058.70');
    expect(p.familyTotal.string()).toBe('$4,617.40');
    expect(p.capped).toBe(true);
  });

  it('splits the same pool three ways for three beneficiaries', () => {
    // A third child, or a spouse with a child in care, adds nothing to the
    // family total; it only divides the pool further.
    const p = familyPayout(exampleParent(), 3);
    expect(p.each.string()).toBe('$705.80');
    expect(p.familyTotal.string()).toBe('$4,617.40');
    expect(p.capped).toBe(true);
  });

  it('rejects a beneficiary count that is not a positive integer', () => {
    expect(() => familyPayout(exampleParent(), 0)).toThrow();
    expect(() => familyPayout(exampleParent(), 1.5)).toThrow();
  });
});

describe('claimAgeComparison', () => {
  const c = claimAgeComparison(exampleParent(), [9, 12]);

  it('reduces the parent by 30% for claiming five years early', () => {
    expect(c.benefitAt62.string()).toBe('$1,750.00');
    expect(c.benefitAtFra.string()).toBe('$2,500.00');
    expect(c.monthlyReduction.string()).toBe('$750.00');
  });

  it('pays both children until the older turns 18, then the younger alone', () => {
    // 72 months of $2,117.40 shared, then 36 months of $1,250.00.
    expect(c.childrenTotal.string()).toBe('$197,452.80');
    expect(c.monthsOfChildBenefits).toBe(108);
  });

  it('counts what the family collects before full retirement age', () => {
    expect(c.ownBeforeFra.string()).toBe('$105,000.00');
    expect(c.childrenBeforeFra.string()).toBe('$127,044.00');
    expect(c.leadAtFra.string()).toBe('$232,044.00');
  });

  it('finds the age at which the larger check would catch up', () => {
    // $232,044 / $750 a month = 309.4 months after 67.
    expect(c.monthsToCatchUp).toBe(310);
    expect(c.catchUpAge.years()).toBe(92);
    expect(c.catchUpAge.modMonths()).toBe(10);
  });

  it('lowers the surviving spouse to the 82.5% floor after an early claim', () => {
    // A worker who claimed early leaves a survivor benefit of the larger of
    // the reduced check and 82.5% of the PIA, rounded down to the dollar.
    expect(c.survivorIfClaimedAt62.string()).toBe('$2,062.00');
    expect(c.survivorIfClaimedAtFra.string()).toBe('$2,500.00');
  });

  it('pays nothing before full retirement age to a child already 18', () => {
    const grown = claimAgeComparison(exampleParent(), [17]);
    // Twelve months only, all before full retirement age.
    expect(grown.monthsOfChildBenefits).toBe(12);
    expect(grown.childrenBeforeFra.equals(grown.childrenTotal)).toBe(true);
  });

  it('rejects children who are not under 18', () => {
    expect(() => claimAgeComparison(exampleParent(), [18])).toThrow();
    expect(() => claimAgeComparison(exampleParent(), [])).toThrow();
    expect(() => claimAgeComparison(exampleParent(), [-1])).toThrow();
  });

  it('rejects a parent whose benefit the example cannot reduce', () => {
    const parent = exampleParent();
    expect(() => claimAgeComparison(parent, [9, Number.NaN])).toThrow();
    expect(Money.from(0).lessThan(c.monthlyReduction)).toBe(true);
  });
});
