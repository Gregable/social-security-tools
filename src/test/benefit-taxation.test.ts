import { describe, expect, it } from 'vitest';
import {
  BENEFIT_TAXATION_THRESHOLDS,
  type TaxableBenefitsInput,
  taxableBenefits,
} from '$lib/benefit-taxation';
import { Money } from '$lib/money';

/**
 * The federal-taxes guide renders these figures and writes prose around
 * them. The thresholds are statutory and unindexed, so they should never
 * move; if they do, re-read federal-taxes/+page.svelte with this file.
 */
const guideExample = (status: 'single' | 'joint'): TaxableBenefitsInput => ({
  status,
  agi: Money.from(30000),
  taxExemptInterest: Money.from(1200),
  benefits: Money.from(16000),
});

describe('BENEFIT_TAXATION_THRESHOLDS', () => {
  it('holds the 1983 and 1993 statutory amounts', () => {
    expect(BENEFIT_TAXATION_THRESHOLDS.single.first.string()).toBe(
      '$25,000.00'
    );
    expect(BENEFIT_TAXATION_THRESHOLDS.single.second.string()).toBe(
      '$34,000.00'
    );
    expect(BENEFIT_TAXATION_THRESHOLDS.joint.first.string()).toBe('$32,000.00');
    expect(BENEFIT_TAXATION_THRESHOLDS.joint.second.string()).toBe(
      '$44,000.00'
    );
  });
});

describe('taxableBenefits', () => {
  it("computes the guide's single filer example", () => {
    const r = taxableBenefits(guideExample('single'));
    expect(r.provisionalIncome.string()).toBe('$39,200.00');
    expect(r.firstThreshold.string()).toBe('$25,000.00');
    expect(r.secondThreshold.string()).toBe('$34,000.00');
    expect(r.tier).toBe('most');
    expect(r.taxable.string()).toBe('$8,920.00');
    expect(r.taxableShare).toBeCloseTo(0.5575, 4);
    expect(r.maximumTaxable.string()).toBe('$13,600.00');
  });

  it("computes the guide's joint filer example", () => {
    const r = taxableBenefits(guideExample('joint'));
    expect(r.provisionalIncome.string()).toBe('$39,200.00');
    expect(r.tier).toBe('half');
    expect(r.taxable.string()).toBe('$3,600.00');
    expect(r.taxableShare).toBeCloseTo(0.225, 4);
  });

  it('taxes nothing at or below the first threshold', () => {
    const r = taxableBenefits({
      status: 'single',
      agi: Money.from(15000),
      taxExemptInterest: Money.zero(),
      benefits: Money.from(20000),
    });
    expect(r.provisionalIncome.string()).toBe('$25,000.00');
    expect(r.tier).toBe('none');
    expect(r.taxable.string()).toBe('$0.00');
    expect(r.taxableShare).toBe(0);
  });

  it('caps the middle tier at half of benefits', () => {
    // Provisional income $33,000 is $8,000 over the first threshold, so the
    // formula alone gives $4,000, but half of a $6,000 benefit is less.
    const r = taxableBenefits({
      status: 'single',
      agi: Money.from(30000),
      taxExemptInterest: Money.zero(),
      benefits: Money.from(6000),
    });
    expect(r.tier).toBe('half');
    expect(r.taxable.string()).toBe('$3,000.00');
    expect(r.taxableShare).toBeCloseTo(0.5, 4);
  });

  it('caps the top tier at 85% of benefits', () => {
    const r = taxableBenefits({
      status: 'joint',
      agi: Money.from(120000),
      taxExemptInterest: Money.zero(),
      benefits: Money.from(30000),
    });
    expect(r.tier).toBe('most');
    expect(r.taxable.string()).toBe('$25,500.00');
    expect(r.taxableShare).toBeCloseTo(0.85, 4);
  });

  it('uses half of a small benefit, not the full middle band, in the top tier', () => {
    // IRS worksheet: the carried-over amount is the smaller of half the
    // middle band ($4,500 single) and half the benefits.
    const r = taxableBenefits({
      status: 'single',
      agi: Money.from(40000),
      taxExemptInterest: Money.zero(),
      benefits: Money.from(4000),
    });
    // PI = 42,000: 0.85 * 8,000 = 6,800 + min(4,500, 2,000) = 8,800,
    // capped at 0.85 * 4,000 = 3,400.
    expect(r.tier).toBe('most');
    expect(r.taxable.string()).toBe('$3,400.00');
  });

  it('shows the tax torpedo: $1,000 more income adds $1,850 of taxable income', () => {
    const base = taxableBenefits(guideExample('single'));
    const more = taxableBenefits({
      ...guideExample('single'),
      agi: Money.from(31000),
    });
    expect(more.taxable.string()).toBe('$9,770.00');
    expect(more.taxable.sub(base.taxable).string()).toBe('$850.00');
  });

  it('reports a zero share when there are no benefits', () => {
    const r = taxableBenefits({
      status: 'single',
      agi: Money.from(50000),
      taxExemptInterest: Money.zero(),
      benefits: Money.zero(),
    });
    expect(r.taxable.string()).toBe('$0.00');
    expect(r.taxableShare).toBe(0);
  });

  it('rejects negative inputs', () => {
    expect(() =>
      taxableBenefits({ ...guideExample('single'), agi: Money.from(-1) })
    ).toThrow(/negative/);
    expect(() =>
      taxableBenefits({
        ...guideExample('single'),
        taxExemptInterest: Money.from(-1),
      })
    ).toThrow(/negative/);
    expect(() =>
      taxableBenefits({ ...guideExample('single'), benefits: Money.from(-1) })
    ).toThrow(/negative/);
  });
});
