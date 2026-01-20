import { describe, expect, it } from 'vitest';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';

import * as constants from '../lib/constants';

// Returns a record with the given year and earnings. Medicare earnings
// are required, but not used by anything interesting.
function testRecord(year: number, earnings: Money = Money.from(100 * 1000)) {
  return new EarningRecord({
    year: year,
    taxedEarnings: earnings,
    taxedMedicareEarnings: earnings,
  });
}

describe('EarningRecord', () => {
  it(`looks up earnings cap for pre-range past year`, () => {
    const preCapRecord = testRecord(1900);
    expect(preCapRecord.earningsCap()).toEqual(
      constants.MAXIMUM_EARNINGS[constants.MIN_MAXIMUM_EARNINGS_YEAR]
    );
  });

  it(`looks up earnings cap for past year`, () => {
    expect(testRecord(2010).earningsCap()).toEqual(
      constants.MAXIMUM_EARNINGS[2010]
    );
  });

  it(`looks up earnings cap for future year`, () => {
    expect(testRecord(constants.MAX_YEAR + 5).earningsCap()).toEqual(
      constants.MAXIMUM_EARNINGS[constants.MAX_YEAR]
    );
  });

  it(`calculates credits before 1978`, () => {
    // Before 1978, you got a credit for every $50 of earnings.
    const record = testRecord(1977, Money.from(120));
    expect(record.credits()).toEqual(2);
  });

  it(`calculates credits after 1978`, () => {
    // In 2007, you got a credit for every $1000 of earnings.
    const record = testRecord(2007, Money.from(3900));
    expect(record.credits()).toEqual(3);
  });

  it(`calculates indexed earnings after indexingYear`, () => {
    // indexingYear is before the year of the record, so the index factor
    // is 1.0.
    const indexedRecord = testRecord(2010);
    indexedRecord.indexingYear = 2000;
    expect(indexedRecord.indexFactor()).toEqual(1.0);
    expect(indexedRecord.indexedEarnings().value()).toEqual(100 * 1000);
  });

  it(`calculates indexed earnings before 1951`, () => {
    // year is before 1951, so the index factor is 0.0. It's not clear
    // if this is the correct behavior. I think the correct behavior is
    // probably undefined, but I don't want to crash for example.
    expect(constants.MIN_WAGE_INDEX_YEAR).toEqual(1951);
    const indexedRecord = testRecord(constants.MIN_WAGE_INDEX_YEAR - 1);
    indexedRecord.indexingYear = 1990;
    expect(indexedRecord.indexFactor()).toEqual(0.0);
    expect(indexedRecord.indexedEarnings().value()).toEqual(0);
  });

  it(`calculates indexed earnings for wages in the future`, () => {
    const indexedRecord = testRecord(constants.MAX_YEAR + 5);
    indexedRecord.indexingYear = constants.MAX_YEAR + 10;
    expect(indexedRecord.indexFactor()).toEqual(1.0);
    expect(indexedRecord.indexedEarnings().value()).toEqual(100 * 1000);
  });

  it(`calculates indexed earnings`, () => {
    const indexedRecord = testRecord(2010);
    indexedRecord.indexingYear = 2020;

    const expectedIndexFactor = constants.WAGE_INDICES[2020].div$(
      constants.WAGE_INDICES[2010]
    );
    expect(indexedRecord.indexFactor()).toEqual(expectedIndexFactor);

    const expectedIndexedEarnings: Money =
      indexedRecord.taxedEarnings.times(expectedIndexFactor);
    expect(indexedRecord.indexedEarnings()).toEqual(expectedIndexedEarnings);
  });

  it(`calculates capped earnings`, () => {
    const indexedRecord = testRecord(
      constants.MAX_YEAR + 5,
      constants.MAXIMUM_EARNINGS[2010].times(2)
    );
    indexedRecord.indexingYear = constants.MAX_YEAR;

    expect(indexedRecord.indexedEarnings()).toEqual(
      constants.MAXIMUM_EARNINGS[constants.MAX_MAXIMUM_EARNINGS_YEAR]
    );
  });
});

describe('EarningRecord serialization', () => {
  it('serializes to plain object', () => {
    const record = new EarningRecord({
      year: 2020,
      taxedEarnings: Money.from(50000),
      taxedMedicareEarnings: Money.from(55000),
    });
    record.incomplete = true;

    const serialized = record.serialize();

    expect(serialized).toEqual({
      year: 2020,
      taxedEarningsCents: 5000000,
      taxedMedicareEarningsCents: 5500000,
      incomplete: true,
    });
  });

  it('deserializes back to EarningRecord', () => {
    const serialized = {
      year: 2020,
      taxedEarningsCents: 5000000,
      taxedMedicareEarningsCents: 5500000,
      incomplete: true,
    };

    const record = EarningRecord.deserialize(serialized);

    expect(record.year).toBe(2020);
    expect(record.taxedEarnings.cents()).toBe(5000000);
    expect(record.taxedMedicareEarnings.cents()).toBe(5500000);
    expect(record.incomplete).toBe(true);
  });

  it('round-trips correctly', () => {
    const original = new EarningRecord({
      year: 2015,
      taxedEarnings: Money.from(75432.5),
      taxedMedicareEarnings: Money.from(80000),
    });
    original.incomplete = false;

    const roundTripped = EarningRecord.deserialize(original.serialize());

    expect(roundTripped.year).toBe(original.year);
    expect(roundTripped.taxedEarnings.cents()).toBe(
      original.taxedEarnings.cents()
    );
    expect(roundTripped.taxedMedicareEarnings.cents()).toBe(
      original.taxedMedicareEarnings.cents()
    );
    expect(roundTripped.incomplete).toBe(original.incomplete);
  });
});
