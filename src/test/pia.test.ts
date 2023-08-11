import {Birthdate} from '$lib/birthday';
import {EarningRecord} from '$lib/earning-record';
import {Money} from '$lib/money';
import demo0 from '$lib/pastes/averagepaste.txt?raw';
import {Recipient} from '$lib/recipient'
import {parsePaste} from '$lib/ssa-parse';
import {describe, expect, it} from 'vitest'

import * as constants from '../lib/constants';



/**
 * Returns a record with the given year and earnings. Medicare earnings
 * are required, but not used by anything interesting.
 */
function testRecord(year: number, earnings: Money = Money.from(10 * 1000)) {
  return new EarningRecord({
    year: year,
    taxedEarnings: earnings,
    taxedMedicareEarnings: earnings,
  });
}

describe('Recipient', () => {
  it('calculates bendpoints', () => {
    let r = new Recipient();
    // Use Jan 2 rather than Jan 1 to avoid issues with "attaining an age" the
    // day before the birthday.
    r.birthdate = new Birthdate(new Date(1957, 0, 2));

    expect(r.pia().firstBendPoint().value()).toEqual(926);
    expect(r.pia().secondBendPoint().value()).toEqual(5583);
  });

  it('calculates pia by bracket', () => {
    let r = new Recipient();
    // Use Jan 2 rather than Jan 1 to avoid issues with "attaining an age" the
    // day before the birthday.
    r.birthdate = new Birthdate(new Date(1950, 7, 1));
    r.earningsRecords = parsePaste(demo0);

    expect(r.pia().primaryInsuranceAmountByBracket(0).value()).toEqual(690.30);
    expect(r.pia().primaryInsuranceAmountByBracket(1).value()).toEqual(843.20);
    expect(r.pia().primaryInsuranceAmountByBracket(2).value()).toEqual(0);
    let sum: number = 690.30 + 843.20 + 0;
    expect(r.pia().primaryInsuranceAmountUnadjusted().value()).toEqual(sum);
  });

  it('calculates cola adjustments', () => {
    let r = new Recipient();
    // Use Jan 2 rather than Jan 1 to avoid issues with "attaining an age" the
    // day before the birthday.
    r.birthdate = new Birthdate(new Date(1950, 7, 1));
    r.earningsRecords = parsePaste(demo0);

    // There should be one adjustment per year from 2012 to MAX_COLA_YEAR.
    let adjustments = r.pia().colaAdjustments();
    expect(adjustments.length).toEqual(constants.MAX_COLA_YEAR - 2011);

    // Verify the first adjustment.
    expect(adjustments[0].year).toEqual(2012);
    expect(adjustments[0].cola).toEqual(1.7);
    expect(adjustments[0].start.value()).toEqual(1533.50);
    expect(adjustments[0].end.value()).toEqual(1559.50);

    // The final adjustment should end with the PIA.
    expect(adjustments[adjustments.length - 1].end.value())
        .toEqual(r.pia().primaryInsuranceAmount().value());
  });

  it('calculates pia from AIME', () => {
    let r = new Recipient();
    // Use Jan 2 rather than Jan 1 to avoid issues with "attaining an age" the
    // day before the birthday.
    r.birthdate = new Birthdate(new Date(1950, 7, 1));
    r.earningsRecords = parsePaste(demo0);

    // Verify that piaFromAIME agrees with primaryInsuranceAmount using the
    // same AIME.
    expect(
        r.pia().piaFromAIME(r.monthlyIndexedEarnings().roundToDollar()).value())
        .toEqual(r.pia().primaryInsuranceAmount().value());
  });
});
