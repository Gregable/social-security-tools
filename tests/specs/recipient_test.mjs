import { Recipient } from '../../src/recipient.mjs';
import { EarningRecord } from '../../src/recipient.mjs';

let earningRecord = new EarningRecord();
earningRecord.year = 1960;
earningRecord.taxedEarnings = 19123;
earningRecord.taxedMedicareEarnings = 19123;
let testEarnings = [];
testEarnings.push(earningRecord);

describe("Recipient Initialization", function() {
  let r = new Recipient().initFromEarningsRecords(testEarnings);
  it ("isInitialized", function() {
    expect(r.isInitialized()).toBe(true);
  });
  it ("numEarningsYears", function() {
    expect(r.numEarningsYears()).toBe(1);
  });
  it ("hasEarningsBefore1978", function() {
    expect(r.hasEarningsBefore1978).toBe(true);
  });
  it ("neededYears", function() {
    expect(r.neededYears()).toBe(-1);
  });
  it ("cutoffIndexedEarnings", function() {
    // Since the user has <35 years earnings, this should be 0.
    expect(r.cutoffIndexedEarnings).toBe(0);
  });
  it ("credits", function() {
    expect(r.earnedCredits()).toBe(4);
    expect(r.plannedCredits()).toBe(0);
    expect(r.totalCredits()).toBe(4);
  });
  it ("primaryInsuranceAmount", function() {
    // These will need to be updated when there are new wage indices /
    // index factors.
    expect(r.totalIndexedEarnings).toBe(64804.64);
    expect(r.primaryInsuranceAmount()).toBe(138.6);
    expect(r.primaryInsuranceAmountFloored()).toBe(138);
  });
});

describe("Recipient simulateFutureEarnings", function() {
  let r = new Recipient().initFromEarningsRecords(testEarnings);
  r.simulateFutureEarningsYears(2, 50000);
  it ("isInitialized", function() {
    expect(r.isInitialized()).toBe(true);
  });
  it ("numEarningsYears", function() {
    expect(r.numEarningsYears()).toBe(3);
  });
  it ("hasEarningsBefore1978", function() {
    expect(r.hasEarningsBefore1978).toBe(true);
  });
  it ("neededYears", function() {
    expect(r.neededYears()).toBe(9);
  });
  it ("cutoffIndexedEarnings", function() {
    // Since the user has <35 years earnings, this should be 0.
    expect(r.cutoffIndexedEarnings).toBe(0);
  });
  it ("credits", function() {
    expect(r.earnedCredits()).toBe(4);
    expect(r.plannedCredits()).toBe(8);
    expect(r.totalCredits()).toBe(12);
  });
  it ("primaryInsuranceAmount", function() {
    // These will need to be updated when there are new wage indices /
    // index factors.
    expect(r.totalIndexedEarnings).toBe(164804.64);
    expect(r.primaryInsuranceAmount()).toBe(352.8);
    expect(r.primaryInsuranceAmountFloored()).toBe(352);
  });
  it ("hasFutureEarnings", function() {
    expect(r.hasFutureEarnings()).toBe(true);
  });
  it ("futureEarningsYears", function() {
    expect(r.futureEarningsYears()).toBe(2);
  });
  it ("isEligible", function() {
    expect(r.isEligible()).toBe(false);
  });
});
