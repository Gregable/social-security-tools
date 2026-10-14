import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import {
  AFTER_BENDPOINT2_MULTIPLIER,
  BEFORE_BENDPOINT1_MULTIPLIER,
  BEFORE_BENDPOINT2_MULTIPLIER,
  MAX_YEAR,
} from '$lib/constants';
import { incomePiaExample } from '$lib/income-pia-example';
import { Money } from '$lib/money';
import { PrimaryInsuranceAmount } from '$lib/pia';

/**
 * The income guides render these exact figures. When a constants update
 * moves the bend points, update this table alongside it; the guides' prose
 * is generated from the same values and needs no edit.
 */
describe('incomePiaExample', () => {
  it('uses the bend points for workers first eligible in MAX_YEAR', () => {
    const e = incomePiaExample(Money.from(60_000));
    expect(e.eligibilityYear).toBe(MAX_YEAR);
    // https://www.ssa.gov/oact/cola/bendpoints.html, 2027 row.
    expect(e.firstBendPoint.string()).toBe('$1,340.00');
    expect(e.secondBendPoint.string()).toBe('$8,077.00');
  });

  it('walks a $25,000 career through the first two brackets', () => {
    const e = incomePiaExample(Money.from(25_000));
    expect(e.aime.string()).toBe('$2,083.33');
    expect(e.firstBracket.amount.string()).toBe('$1,206.00');
    expect(e.secondBracket.base.string()).toBe('$743.33');
    expect(e.secondBracket.amount.string()).toBe('$237.87');
    expect(e.thirdBracket.amount.string()).toBe('$0.00');
    expect(e.pia.string()).toBe('$1,443.87');
  });

  it('walks a $40,000 career', () => {
    expect(incomePiaExample(Money.from(40_000)).pia.string()).toBe('$1,843.87');
  });

  it('walks a $60,000 career', () => {
    const e = incomePiaExample(Money.from(60_000));
    expect(e.aime.string()).toBe('$5,000.00');
    expect(e.secondBracket.amount.string()).toBe('$1,171.20');
    expect(e.pia.string()).toBe('$2,377.20');
  });

  it('walks an $80,000 career', () => {
    expect(incomePiaExample(Money.from(80_000)).pia.string()).toBe('$2,910.53');
  });

  it('walks a $100,000 career into the third bracket', () => {
    const e = incomePiaExample(Money.from(100_000));
    expect(e.aime.string()).toBe('$8,333.33');
    expect(e.secondBracket.base.string()).toBe('$6,737.00');
    expect(e.secondBracket.amount.string()).toBe('$2,155.84');
    expect(e.thirdBracket.base.string()).toBe('$256.33');
    expect(e.thirdBracket.amount.string()).toBe('$38.45');
    expect(e.pia.string()).toBe('$3,400.29');
  });

  it('sums the three brackets to the PIA it reports', () => {
    for (const income of [10_000, 25_000, 100_000, 250_000]) {
      const e = incomePiaExample(Money.from(income));
      const sum = e.firstBracket.amount
        .plus(e.secondBracket.amount)
        .plus(e.thirdBracket.amount);
      expect(sum.equals(e.pia)).toBe(true);
    }
  });

  it('leaves the upper brackets empty below the first bend point', () => {
    const e = incomePiaExample(Money.from(10_000));
    expect(e.firstBracket.base.equals(e.aime)).toBe(true);
    expect(e.secondBracket.base.string()).toBe('$0.00');
    expect(e.thirdBracket.base.string()).toBe('$0.00');
  });

  it('carries each bracket rate beside its amount', () => {
    const e = incomePiaExample(Money.from(100_000));
    expect(e.firstBracket.rate).toBe(BEFORE_BENDPOINT1_MULTIPLIER);
    expect(e.secondBracket.rate).toBe(BEFORE_BENDPOINT2_MULTIPLIER);
    expect(e.thirdBracket.rate).toBe(AFTER_BENDPOINT2_MULTIPLIER);
  });

  it('rejects a negative income', () => {
    expect(() => incomePiaExample(Money.from(-1))).toThrow(/negative/);
  });

  it('stays within a dollar of the PIA SSA would compute', () => {
    // The walkthrough skips SSA's rounding of the AIME down to the dollar
    // and of the PIA down to the dime; the module says the gap is under a
    // dollar, so hold it to that.
    for (const income of [25_000, 40_000, 60_000, 80_000, 100_000]) {
      const e = incomePiaExample(Money.from(income));
      const ssa = new PrimaryInsuranceAmount({
        isPiaOnly: false,
        overridePia: null,
        birthdate: Birthdate.FromYMD(MAX_YEAR - 62, 0, 15),
        indexingYear: () => MAX_YEAR - 2,
        monthlyIndexedEarnings: () => e.aime,
        isEligible: () => true,
      }).primaryInsuranceAmountUnadjusted();
      expect(Math.abs(e.pia.sub(ssa).value())).toBeLessThan(1);
    }
  });
});
