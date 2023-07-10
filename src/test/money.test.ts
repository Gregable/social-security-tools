import {Money} from '../lib/money';

describe('money.ts', () => {
  it('can be constructed from a float', () => {
    const money = Money.from(123.45);
    expect(money.value()).toEqual(123.45);
  });

  it('can be constructed from an integer', () => {
    const money = Money.from(123);
    expect(money.value()).toEqual(123);
  });

  it('can be added to another money', () => {
    const money = Money.from(0.10);
    const other = Money.from(0.20);
    const sum = money.plus(other);
    expect(sum.value()).toEqual(0.30);
  });

  it('can be subtracted from another money', () => {
    const money = Money.from(123.45);
    const other = Money.from(67.89);
    const diff = money.sub(other);
    expect(diff.value()).toEqual(55.56);
  });

  it('can be multiplied by a factor', () => {
    const money = Money.from(123.45);
    const product = money.times(2);
    expect(product.value()).toEqual(246.90);
  });

  it('can be divided by a factor', () => {
    const money = Money.from(123.45);
    const quotient = money.div(2);
    expect(quotient.value()).toEqual(61.73);
  });

  it('can be divided by another money', () => {
    const money = Money.from(123.46);
    const other = Money.from(61.73);
    const quotient = money.div$(other);
    expect(quotient).toEqual(2);
  });

  it('can determine a minimum', () => {
    const money = Money.from(123.45);
    const other = Money.from(67.89);
    const min = Money.min(money, other);
    expect(min.value()).toEqual(67.89);
  });

  it('can determine a maximum', () => {
    const money = Money.from(123.45);
    const other = Money.from(67.89);
    const max = Money.max(money, other);
    expect(max.value()).toEqual(123.45);
  });
});
