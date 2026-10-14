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

  it('can file in the month they turn 62, as the comparison assumes', () => {
    // Only someone born on the 1st or 2nd is 62 for the whole birth month.
    const earliest = exampleParent().birthdate.earliestFilingMonth();
    expect(earliest.years()).toBe(62);
    expect(earliest.modMonths()).toBe(0);
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
    expect(p.familyMaximum.string()).toBe('$4,671.30');
    expect(p.eachUnlimited.string()).toBe('$1,250.00');
    expect(p.each.string()).toBe('$1,250.00');
    expect(p.familyTotal.string()).toBe('$3,750.00');
    expect(p.capped).toBe(false);
  });

  it('splits the pool between two children once the maximum binds', () => {
    const p = familyPayout(exampleParent(), 2);
    expect(p.each.string()).toBe('$1,085.60');
    expect(p.familyTotal.string()).toBe('$4,671.20');
    expect(p.capped).toBe(true);
  });

  it('splits the same pool three ways for three beneficiaries', () => {
    // A third child, or a spouse with a child in care, adds nothing to the
    // family total; it only divides the pool further.
    const p = familyPayout(exampleParent(), 3);
    expect(p.each.string()).toBe('$723.70');
    expect(p.familyTotal.string()).toBe('$4,671.10');
    expect(p.capped).toBe(true);
  });

  it('halves a small PIA between two children with nothing left over', () => {
    // Below the first bend point the maximum is exactly 150%, so the pool
    // is half the PIA: one child takes all of it uncapped, two split it.
    const parent = exampleParent();
    parent.setPia(Money.from(1000));
    const one = familyPayout(parent, 1);
    expect(one.each.string()).toBe('$500.00');
    expect(one.capped).toBe(false);
    const two = familyPayout(parent, 2);
    expect(two.each.string()).toBe('$250.00');
    expect(two.capped).toBe(true);
  });

  it('rejects a beneficiary count that is not a positive integer', () => {
    expect(() => familyPayout(exampleParent(), 0)).toThrow(/positive/);
    expect(() => familyPayout(exampleParent(), 1.5)).toThrow(/positive/);
  });
});

describe('claimAgeComparison', () => {
  const c = claimAgeComparison(exampleParent(), [9, 12]);

  it('reduces the parent by 30% for claiming five years early', () => {
    expect(c.benefitAt62.string()).toBe('$1,750.00');
    expect(c.benefitAtFra.string()).toBe('$2,500.00');
    expect(c.monthlyReduction.string()).toBe('$750.00');
    expect(c.timeToFra.asMonths()).toBe(60);
  });

  it('pays both children until the older turns 18, then the younger alone', () => {
    // 72 months of $2,171.20 shared, then 36 months of $1,250.00.
    expect(c.childrenTotal.string()).toBe('$201,326.40');
    expect(c.childBenefitSpan.asMonths()).toBe(108);
    expect(c.oldestChildBenefitSpan.asMonths()).toBe(72);
  });

  it('reports the parent ages at which each child ages out', () => {
    expect(c.parentAgeWhenOldestTurns18.years()).toBe(68);
    expect(c.parentAgeWhenOldestTurns18.modMonths()).toBe(0);
    expect(c.parentAgeWhenYoungestTurns18.years()).toBe(71);
    expect(c.parentAgeWhenYoungestTurns18.modMonths()).toBe(0);
  });

  it('counts what the family collects before full retirement age', () => {
    expect(c.ownBeforeFra.string()).toBe('$105,000.00');
    expect(c.childrenBeforeFra.string()).toBe('$130,272.00');
    expect(c.leadAtFra.string()).toBe('$235,272.00');
  });

  it('finds the age at which the larger check would catch up', () => {
    // $235,272 / $750 a month = 313.7 months after 67.
    expect(c.timeToCatchUp.asMonths()).toBe(314);
    expect(c.catchUpAge.years()).toBe(93);
    expect(c.catchUpAge.modMonths()).toBe(2);
  });

  it('comes out close to even for a single child who is already 16', () => {
    // 24 months of $1,250 plus 60 months of $1,750 = $135,000, which the
    // $750 difference repays in exactly 180 months. The guide cites this.
    const teen = claimAgeComparison(exampleParent(), [16]);
    expect(teen.leadAtFra.string()).toBe('$135,000.00');
    expect(teen.timeToCatchUp.asMonths()).toBe(180);
    expect(teen.catchUpAge.years()).toBe(82);
    expect(teen.catchUpAge.modMonths()).toBe(0);
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
    expect(grown.childBenefitSpan.asMonths()).toBe(12);
    expect(grown.childrenBeforeFra.equals(grown.childrenTotal)).toBe(true);
  });

  it('rejects children who are not whole ages under 18', () => {
    expect(() => claimAgeComparison(exampleParent(), [18])).toThrow(/under/);
    expect(() => claimAgeComparison(exampleParent(), [])).toThrow(/child/);
    expect(() => claimAgeComparison(exampleParent(), [-1])).toThrow(/under/);
    expect(() => claimAgeComparison(exampleParent(), [9, Number.NaN])).toThrow(
      /under/
    );
  });

  it('does not share the caller’s age array', () => {
    const ages = [9, 12];
    const result = claimAgeComparison(exampleParent(), ages);
    ages.push(3);
    expect(result.childAges).toEqual([9, 12]);
  });
});
