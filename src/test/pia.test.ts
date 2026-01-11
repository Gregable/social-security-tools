import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import demo0 from '$lib/pastes/averagepaste.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';

import * as constants from '../lib/constants';

describe('Recipient', () => {
  it('calculates bendpoints', () => {
    const r = new Recipient();
    // Use Jan 2 rather than Jan 1 to avoid issues with "attaining an age" the
    // day before the birthday.
    r.birthdate = Birthdate.FromYMD(1957, 0, 2);

    expect(r.pia().firstBendPoint().value()).toEqual(926);
    expect(r.pia().secondBendPoint().value()).toEqual(5583);
  });

  it('calculates pia by bracket', () => {
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1950, 6, 1);
    r.earningsRecords = parsePaste(demo0);

    expect(r.pia().primaryInsuranceAmountByBracket(0).value()).toEqual(690.3);
    expect(r.pia().primaryInsuranceAmountByBracket(1).value()).toEqual(825.6);
    expect(r.pia().primaryInsuranceAmountByBracket(2).value()).toEqual(0);
    const sum: number = 690.3 + 825.6 + 0;
    expect(r.pia().primaryInsuranceAmountUnadjusted().value()).toEqual(sum);
  });

  it('calculates cola adjustments', () => {
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1950, 6, 1);
    r.earningsRecords = parsePaste(demo0);

    // There should be one adjustment per year from 2012 to MAX_COLA_YEAR.
    const adjustments = r.pia().colaAdjustments();
    expect(adjustments.length).toEqual(constants.MAX_COLA_YEAR - 2011);

    // Verify the first adjustment.
    expect(adjustments[0].year).toEqual(2012);
    expect(adjustments[0].cola).toEqual(1.7);
    expect(adjustments[0].start.value()).toEqual(1515.9);
    expect(adjustments[0].end.value()).toEqual(1541.6);

    // The final adjustment or one before it, should end with the PIA.
    let one_before = 0;
    if (constants.MAX_COLA_YEAR === constants.CURRENT_YEAR) {
      one_before = 1;
    }
    expect(
      adjustments[adjustments.length - 1 - one_before].end.value()
    ).toEqual(r.pia().primaryInsuranceAmount().value());
  });

  it('calculates pia from AIME', () => {
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1950, 6, 1);
    r.earningsRecords = parsePaste(demo0);

    // Verify that piaFromAIME agrees with primaryInsuranceAmount using the
    // same AIME.
    expect(
      r.pia().piaFromAIME(r.monthlyIndexedEarnings().roundToDollar()).value()
    ).toEqual(r.pia().primaryInsuranceAmount().value());
  });
});
