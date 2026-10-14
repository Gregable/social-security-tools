import { describe, expect, it } from 'vitest';
import { MAX_WAGE_INDEX_YEAR } from '$lib/constants';
import { familyMaximum, familyMaximumBendPoints } from '$lib/family-maximum';
import { Money } from '$lib/money';

/**
 * The published bend points come from https://www.ssa.gov/oact/cola/familymax.html.
 * A worker first eligible in year Y uses the wage index from Y - 2, so the
 * 2025 figures index on 2023, the 2026 figures on 2024, and the 2027 figures
 * on 2025.
 */
describe('familyMaximumBendPoints', () => {
  it('reproduces the 2025 bend points SSA published', () => {
    const bends = familyMaximumBendPoints(2023);
    expect(bends.first.string()).toBe('$1,567.00');
    expect(bends.second.string()).toBe('$2,262.00');
    expect(bends.third.string()).toBe('$2,950.00');
  });

  it('reproduces the 2026 bend points SSA published', () => {
    const bends = familyMaximumBendPoints(2024);
    expect(bends.first.string()).toBe('$1,643.00');
    expect(bends.second.string()).toBe('$2,371.00');
    expect(bends.third.string()).toBe('$3,093.00');
  });

  it('reproduces the 2027 bend points SSA published', () => {
    const bends = familyMaximumBendPoints(2025);
    expect(bends.first.string()).toBe('$1,712.00');
    expect(bends.second.string()).toBe('$2,471.00');
    expect(bends.third.string()).toBe('$3,223.00');
  });

  it('holds the latest known bend points for indexing years past the data', () => {
    const latest = familyMaximumBendPoints(MAX_WAGE_INDEX_YEAR);
    const future = familyMaximumBendPoints(MAX_WAGE_INDEX_YEAR + 5);
    expect(future.first.equals(latest.first)).toBe(true);
    expect(future.second.equals(latest.second)).toBe(true);
    expect(future.third.equals(latest.third)).toBe(true);
  });
});

describe('familyMaximum', () => {
  it('is 150% of a PIA that sits below the first bend point', () => {
    expect(familyMaximum(Money.from(1000), 2024).string()).toBe('$1,500.00');
  });

  it('is exactly 150% of a PIA that lands on the first bend point', () => {
    expect(familyMaximum(Money.from(1643), 2024).string()).toBe('$2,464.50');
  });

  it('applies the 272% bracket to a PIA between the first two bend points', () => {
    // 1.5 * 1643 + 2.72 * (2000 - 1643) = 3435.54
    expect(familyMaximum(Money.from(2000), 2024).string()).toBe('$3,435.50');
  });

  it('applies the 150%, 272%, and 134% brackets and floors to the dime', () => {
    // 1.5 * 1643 + 2.72 * (2371 - 1643) + 1.34 * (2500 - 2371) = 4617.52
    expect(familyMaximum(Money.from(2500), 2024).string()).toBe('$4,617.50');
  });

  it('applies the 175% bracket above the third bend point', () => {
    // ... + 1.34 * (3093 - 2371) + 1.75 * (5000 - 3093) = 8749.39
    expect(familyMaximum(Money.from(5000), 2024).string()).toBe('$8,749.30');
  });

  it('rejects a PIA that is not positive', () => {
    expect(() => familyMaximum(Money.from(0), 2024)).toThrow(/positive/);
  });

  it('always exceeds the PIA, so the family pool is never negative', () => {
    // Every bracket multiplier is above 1. familyPayout relies on this; a
    // constants edit that broke it should fail here, not print a negative.
    for (const pia of [1, 1643, 2371, 3093, 5000, 10_000]) {
      const max = familyMaximum(Money.from(pia), 2024);
      expect(max.greaterThan(Money.from(pia))).toBe(true);
    }
  });
});
