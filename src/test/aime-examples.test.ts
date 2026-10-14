import { describe, expect, it } from 'vitest';
import { aboveSecondBendExampleAime, aimeTableRows } from '$lib/aime-examples';
import { Money } from '$lib/money';

const dollars = (...values: number[]): Money[] => values.map(Money.from);

describe('aimeTableRows', () => {
  it('slots a second bend point above 8,000 into order', () => {
    // 2027's second bend point is $8,077, which once landed before the
    // $8,000 row because the guides inserted it at a fixed position.
    expect(aimeTableRows(dollars(6000, 8077, 8000, 10000))).toEqual([
      6000, 8000, 8077, 10000,
    ]);
  });

  it('keeps a second bend point below 8,000 in order', () => {
    expect(aimeTableRows(dollars(6000, 7749, 8000, 10000))).toEqual([
      6000, 7749, 8000, 10000,
    ]);
  });

  it('does not repeat a value that lands on a round row', () => {
    expect(aimeTableRows(dollars(6000, 8000, 8000, 10000))).toEqual([
      6000, 8000, 10000,
    ]);
  });

  it('rounds each value to whole dollars before ordering', () => {
    expect(aimeTableRows(dollars(10000, 9999.6, 8076.6))).toEqual([
      8077, 10000,
    ]);
  });
});

describe('aboveSecondBendExampleAime', () => {
  it('is the next round thousand above the bend point', () => {
    expect(aboveSecondBendExampleAime(Money.from(8077)).value()).toBe(9000);
    expect(aboveSecondBendExampleAime(Money.from(7749)).value()).toBe(8000);
  });

  it('moves past a bend point that is itself a round thousand', () => {
    // The example's AIME must sit strictly inside the top bracket.
    expect(aboveSecondBendExampleAime(Money.from(8000)).value()).toBe(9000);
  });
});
