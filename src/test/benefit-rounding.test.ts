import { describe, expect, it } from 'vitest';
import { colaAdjustedDimes } from '$lib/benefit-rounding';
import { COLA } from '$lib/constants';
import { Money } from '$lib/money';

describe('colaAdjustedDimes', () => {
  it('applies the COLA as an exact fraction and truncates to the dime', () => {
    // $1,845.00 x 1.028 = $1,896.66, truncated to $1,896.60.
    expect(colaAdjustedDimes(184500, 2.8)).toBe(189660);
    expect(colaAdjustedDimes(180000, 2.5)).toBe(184500);
    expect(colaAdjustedDimes(180000, 0)).toBe(180000);
  });

  it('truncates ordinary products to the dime', () => {
    // Neither product lies within half a cent of a dime, so rounding to the
    // cent first would give the same answer: $123.45 x 1.028 = $126.9066
    // and $1,234.95 x 1.032 = $1,274.4684.
    expect(colaAdjustedDimes(12345, 2.8)).toBe(12690);
    expect(colaAdjustedDimes(123495, 3.2)).toBe(127440);
  });

  it('never rounds up across a dime at a true boundary', () => {
    // $1,803.40 x 1.028 = $1,853.8952. Rounding to the cent first gives
    // $1,853.90, a dime too high.
    expect(colaAdjustedDimes(180340, 2.8)).toBe(185380);
    expect(Money.fromCents(180340).times(1.028).floorToDime().cents()).toBe(
      185390
    );
    // $9.99 x 1.001 = $9.99999: rounding to the cent first gives $10.00.
    expect(colaAdjustedDimes(999, 0.1)).toBe(990);
  });

  it.each(
    Object.entries(COLA).map(([year, cola]) => [Number(year), cola] as const)
  )('accepts the %i COLA of %d%% and matches the exact product', (_y, cola) => {
    const cents = 123456;
    const exact = Math.floor((cents * (1000 + Math.round(cola * 10))) / 10000);
    expect(colaAdjustedDimes(cents, cola)).toBe(exact * 10);
  });

  it('rejects a COLA that is not finite, negative, or not in tenths', () => {
    expect(() => colaAdjustedDimes(10000, Number.NaN)).toThrow(/finite/);
    expect(() => colaAdjustedDimes(10000, Number.POSITIVE_INFINITY)).toThrow(
      /finite/
    );
    expect(() => colaAdjustedDimes(10000, 2.85)).toThrow(/tenths/);
    expect(() => colaAdjustedDimes(10000, -0.1)).toThrow(/tenths/);
  });

  it('rejects an amount that is not a non-negative whole number of cents', () => {
    expect(() => colaAdjustedDimes(1000.5, 2.8)).toThrow(
      /non-negative integer/
    );
    expect(() => colaAdjustedDimes(-1000, 2.8)).toThrow(/non-negative integer/);
  });
});
