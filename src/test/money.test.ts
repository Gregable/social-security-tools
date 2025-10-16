import { expect, test } from 'vitest';
import { Money } from '$lib/money';

test('can be constructed from a float', () => {
  const money = Money.from(123.45);
  expect(money.value()).toEqual(123.45);
});

test('can be constructed from an integer', () => {
  const money = Money.from(123);
  expect(money.value()).toEqual(123);
});

test('can be added to another money', () => {
  const money = Money.from(0.1);
  const other = Money.from(0.2);
  const sum = money.plus(other);
  expect(sum.value()).toEqual(0.3);
});

test('can be subtracted from another money', () => {
  const money = Money.from(123.45);
  const other = Money.from(67.89);
  const diff = money.sub(other);
  expect(diff.value()).toEqual(55.56);
});

test('can be multiplied by a factor', () => {
  const money = Money.from(123.45);
  const product = money.times(2);
  expect(product.value()).toEqual(246.9);
});

test('can be divided by a factor', () => {
  const money = Money.from(123.45);
  const quotient = money.div(2);
  expect(quotient.value()).toEqual(61.73);
});

test('can be divided by another money', () => {
  const money = Money.from(123.46);
  const other = Money.from(61.73);
  const quotient = money.div$(other);
  expect(quotient).toEqual(2);
});

test('can determine a minimum', () => {
  const money = Money.from(123.45);
  const other = Money.from(67.89);
  const min = Money.min(money, other);
  expect(min.value()).toEqual(67.89);
});

test('can determine a maximum', () => {
  const money = Money.from(123.45);
  const other = Money.from(67.89);
  const max = Money.max(money, other);
  expect(max.value()).toEqual(123.45);
});

test('can check equality with another money object', () => {
  const money1 = Money.from(123.45);
  const money2 = Money.from(123.45);
  const money3 = Money.from(67.89);

  expect(money1.equals(money2)).toBe(true);
  expect(money1.equals(money3)).toBe(false);
  expect(money2.equals(money3)).toBe(false);
});

test('equality works with fromCents constructor', () => {
  const money1 = Money.fromCents(12345);
  const money2 = Money.from(123.45);

  expect(money1.equals(money2)).toBe(true);
});

test('wholeDollars formats as currency without decimal places', () => {
  const money1 = Money.from(1234.56);
  expect(money1.wholeDollars()).toBe('$1,235');

  const money2 = Money.from(1000000.99);
  expect(money2.wholeDollars()).toBe('$1,000,001');

  const money3 = Money.from(0.49);
  expect(money3.wholeDollars()).toBe('$0');

  const money4 = Money.from(0.5);
  expect(money4.wholeDollars()).toBe('$1');
});

test('wholeDollars handles negative values correctly', () => {
  const money1 = Money.from(-1234.56);
  expect(money1.wholeDollars()).toBe('-$1,235');

  const money2 = Money.from(-0.49);
  expect(money2.wholeDollars()).toBe('-$0');

  const money3 = Money.from(-0.51);
  expect(money3.wholeDollars()).toBe('-$1');
});

test('wholeDollars handles zero correctly', () => {
  const money = Money.from(0);
  expect(money.wholeDollars()).toBe('$0');
});
