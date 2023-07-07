import {Birthdate} from '../lib/birthday';
import * as constants from '../lib/constants';
import {EarningRecord} from '../lib/earning-record';
import {MonthDate, MonthDuration} from '../lib/month-time';
import {Recipient} from '../lib/recipient'

/**
 * Returns a record with the given year and earnings. Medicare earnings
 * are required, but not used by anything interesting.
 */
function testRecord(year: number, earnings: number = 10 * 1000) {
  return new EarningRecord({
    year: year,
    taxedEarnings: earnings,
    taxedMedicareEarnings: earnings,
  });
}

describe('Recipient', () => {
  it('initializes without input', () => {
    let r = new Recipient();
  });

  it('sets and gets earning records', () => {
    let r = new Recipient();
    let er = testRecord(2010);
    r.earningsRecords = [er];
    expect(r.earningsRecords).toEqual([er]);
  });

  it('sets and gets future earning records', () => {
    let r = new Recipient();
    let er = testRecord(2010);
    r.futureEarningsRecords = [er];
    expect(r.futureEarningsRecords).toEqual([er]);
  });

  it('sets and gets birth date', () => {
    let r = new Recipient();
    const b = new Birthdate(new Date(1970, 1, 1));
    r.birthdate = b;
    expect(r.birthdate).toEqual(b);
  });

  it('simulates future earning years with no earnings', () => {
    let r = new Recipient();
    r.simulateFutureEarningsYears(10, 100 * 1000);
    expect(r.futureEarningsRecords.length).toEqual(10);

    for (let i = 0; i < 10; i++) {
      expect(r.futureEarningsRecords[i].year)
          .toEqual(constants.CURRENT_YEAR + i);
      expect(r.futureEarningsRecords[i].taxedEarnings).toEqual(100 * 1000);
      expect(r.futureEarningsRecords[i].taxedMedicareEarnings)
          .toEqual(100 * 1000);
    }
  });

  it('simulates future earning years with past earnings', () => {
    let r = new Recipient();
    r.earningsRecords = [
      testRecord(constants.CURRENT_YEAR - 2),
      testRecord(constants.CURRENT_YEAR - 1),
    ];

    r.simulateFutureEarningsYears(10, 100 * 1000);
    // If there were no earnings in the current year, the simulation should
    // start in the current year.
    expect(r.futureEarningsRecords[0].year).toEqual(constants.CURRENT_YEAR);
  });

  it('simulates future earning years with past and current earnings', () => {
    let r = new Recipient();
    r.earningsRecords = [
      testRecord(constants.CURRENT_YEAR - 2),
      testRecord(constants.CURRENT_YEAR - 1),
      testRecord(constants.CURRENT_YEAR),
    ];

    r.simulateFutureEarningsYears(10, 100 * 1000);
    // If there were earnings in the current year, the simulation should
    // start in the next year.
    expect(r.futureEarningsRecords[0].year).toEqual(constants.CURRENT_YEAR + 1);
  });

  it('simulates future earning years with incomplete earnings', () => {
    let r = new Recipient();
    r.earningsRecords = [
      testRecord(constants.CURRENT_YEAR - 2),
      testRecord(constants.CURRENT_YEAR - 1, /*earnings*/ -1),
    ];
    // Mark the last record as incomplete.
    r.earningsRecords[1].incomplete = true;

    r.simulateFutureEarningsYears(10, 100 * 1000);
    // If there were earnings in the previous year, but it is an incomplete
    // record, the simulation should start in that year.
    expect(r.futureEarningsRecords[0].year).toEqual(constants.CURRENT_YEAR - 1);
  });

  it('simulates future earning years with earnings in the future', () => {
    let r = new Recipient();
    r.earningsRecords = [
      testRecord(constants.CURRENT_YEAR - 2),
      testRecord(constants.CURRENT_YEAR - 1),
      testRecord(constants.CURRENT_YEAR),
      testRecord(constants.CURRENT_YEAR + 1),
      testRecord(constants.CURRENT_YEAR + 2),
    ];

    r.simulateFutureEarningsYears(10, 100 * 1000);
    // If there were earnings in the current year, the simulation should
    // start in the next year.
    expect(r.futureEarningsRecords[0].year).toEqual(constants.CURRENT_YEAR + 3);
  });

  it('calculates normal retirement', () => {
    let r = new Recipient();
    // Use Jan 2 rather than Jan 1 to avoid issues with "attaining an age" the
    // day before the birthday.
    r.birthdate = new Birthdate(new Date(1957, 0, 2));

    expect(r.normalRetirementAge())
        .toEqual(MonthDuration.initFromYearsMonths({years: 66, months: 6}));
    expect(r.normalRetirementDate())
        .toEqual(MonthDate.initFromYearsMonths({years: 2023, months: 6}));
  });

  it('calculates indexing year', () => {
    let r = new Recipient();
    // Use Jan 2 rather than Jan 1 to avoid issues with "attaining an age" the
    // day before the birthday.
    r.birthdate = new Birthdate(new Date(1957, 0, 2));

    expect(r.indexingYear()).toEqual(2017);
  });

  it('calculates total credits from only earned credits', () => {
    let r = new Recipient();
    // Earned exactly 1, 2, and 3 credits in 2007, 2008, and 2009, respectively:
    r.earningsRecords = [
      testRecord(2007, 1 * constants.EARNINGS_PER_CREDIT[2007]),
      testRecord(2008, 2 * constants.EARNINGS_PER_CREDIT[2008]),
      testRecord(2009, 3 * constants.EARNINGS_PER_CREDIT[2009]),
    ];
    expect(r.totalCredits()).toEqual(6);

    // Earned enough for 20 credits in 2010, but credits are capped at 4 / year.
    r.earningsRecords.push(
        testRecord(2010, 20 * constants.EARNINGS_PER_CREDIT[2010]))
    expect(r.totalCredits()).toEqual(10);
  });

  it('calculates total credits from only future credits', () => {
    let r = new Recipient();
    r.futureEarningsRecords = [
      testRecord(
          constants.MAX_YEAR + 1,
          1 * constants.EARNINGS_PER_CREDIT[constants.MAX_YEAR]),
      testRecord(
          constants.MAX_YEAR + 2,
          2 * constants.EARNINGS_PER_CREDIT[constants.MAX_YEAR]),
    ];
    expect(r.totalCredits()).toEqual(3);

    // Earned enough for 20 credits in 2010, but credits are capped at 4 / year.
    r.futureEarningsRecords.push(testRecord(
        constants.MAX_YEAR + 3,
        30 * constants.EARNINGS_PER_CREDIT[constants.MAX_YEAR]))
    expect(r.totalCredits()).toEqual(7);
  });

  it('updates earnings records on record write', () => {
    let r = new Recipient();
    r.birthdate = new Birthdate(new Date(1990, 0, 2));

    // Records are written initially out of order:
    r.earningsRecords = [
      testRecord(2009),
      testRecord(2007),
      testRecord(2008),
    ];

    for (let i = 0; i < 3; i++) {
      // Records get sorted by year:
      expect(r.earningsRecords[i].year).toEqual(2007 + i);
      // Records have age set:
      expect(r.earningsRecords[i].age).toEqual(2007 - 1990 + i);
      // Records have indexingYear set:
      expect(r.earningsRecords[0].indexingYear).toEqual(2050);
    }

    // Update the birthdate to be 1995, which changes the indexing year:
    r.birthdate = new Birthdate(new Date(1995, 0, 2));
    for (let i = 0; i < 3; i++) {
      // Records have indexingYear set:
      expect(r.earningsRecords[0].indexingYear).toEqual(2055);
    }
  });

  it('updates future earnings records on record write', () => {
    let r = new Recipient();
    r.birthdate = new Birthdate(new Date(1990, 0, 2));

    // Records are written initially out of order:
    r.futureEarningsRecords = [
      testRecord(2009),
      testRecord(2007),
      testRecord(2008),
    ];

    for (let i = 0; i < 3; i++) {
      // Records get sorted by year:
      expect(r.futureEarningsRecords[i].year).toEqual(2007 + i);
      // Records have indexingYear set:
      expect(r.futureEarningsRecords[0].indexingYear).toEqual(2050);
    }

    // Update the birthdate to be 1995, which changes the indexing year:
    r.birthdate = new Birthdate(new Date(1995, 0, 2));
    for (let i = 0; i < 3; i++) {
      // Records have indexingYear set:
      expect(r.futureEarningsRecords[0].indexingYear).toEqual(2055);
    }
  });

  it('calls subscribers on name update', () => {
    let r = new Recipient();
    let numCallbacks = 0;
    let unsubscribe = r.subscribe((recipient: Recipient) => {
      numCallbacks++;
    });
    expect(numCallbacks).toEqual(1);

    r.name = 'Greg';
    expect(numCallbacks).toEqual(2);
    unsubscribe();
  });

  it('calls subscribers on earnings record update', () => {
    let r = new Recipient();
    let expectedRecordCount = 0;
    let numCallbacks = 0;
    let unsubscribe = r.subscribe((recipient: Recipient) => {
      expect(recipient.earningsRecords.length).toEqual(expectedRecordCount);
      numCallbacks++;
    });
    expect(numCallbacks).toEqual(1);

    expectedRecordCount = 1;
    r.earningsRecords = [testRecord(2007)];
    expect(numCallbacks).toEqual(2);
    unsubscribe();
  });

  it('calls subscribers on future earnings record update', () => {
    let r = new Recipient();
    let expectedRecordCount = 0;
    let numCallbacks = 0;
    let unsubscribe = r.subscribe((recipient: Recipient) => {
      expect(recipient.futureEarningsRecords.length)
          .toEqual(expectedRecordCount);
      numCallbacks++;
    });
    expect(numCallbacks).toEqual(1);

    expectedRecordCount = 1;
    r.futureEarningsRecords = [testRecord(2007)];
    expect(numCallbacks).toEqual(2);
    unsubscribe();
  });

  it('calls subscribers on birthday record update', () => {
    let r = new Recipient();
    let numCallbacks = 0;
    let unsubscribe = r.subscribe((recipient: Recipient) => {
      numCallbacks++;
    });
    expect(numCallbacks).toEqual(1);

    r.birthdate = new Birthdate(new Date(1990, 0, 2));
    expect(numCallbacks).toEqual(2);
    unsubscribe();
  });

  /**
   * Generates a recipient with a birthdate in 1960, and 40 years of earnings
   * records starting in 1965. Each year has earnings equal to $10,000.
   */
  function top35RecipientSetup() {
    let r = new Recipient();

    // Pick a start year such that the indexing year is in the past (2020). This
    // way the test won't break when the wage indices are updated for future
    // years.
    const startYear = 1965;
    r.birthdate = new Birthdate(new Date(startYear - 5, 0, 2));
    expect(r.indexingYear()).toBe(2020);

    // Add 40 years of earnings records, starting the year they were born:
    for (let i = 0; i < 40; i++) {
      r.earningsRecords.push(testRecord(startYear + i));
    }
    // .push doesn't call set(), so we must force a refresh:
    r.earningsRecords = r.earningsRecords;

    return r;
  }

  it('computes top35 earnings years from historical data', () => {
    let r = top35RecipientSetup();

    // The top 35 years should be the earliest 35 years, since those have the
    // highest indexing multiple, with ties are broken to earlier years.
    expect(r.earningsRecords[34].year).toEqual(1999);
    expect(r.earningsRecords[34].indexedEarnings()).toEqual(18256.94);
    expect(r.cutoffIndexedEarnings()).toEqual(18256.94);
    let top35total = 0.0;
    for (let i = 0; i < 40; i++) {
      if (i < 35) {
        expect(r.earningsRecords[i].isTop35EarningsYear).toBe(true);
        top35total += Math.round(100 * r.earningsRecords[i].indexedEarnings());
      } else {
        expect(r.earningsRecords[i].isTop35EarningsYear).toBe(false);
      }
    }
    // Deal with precision issues by adding these values as integers:
    // TODO(issues/221): Use an arbitrary precision library.
    top35total /= 100;
    expect(r.totalIndexedEarnings()).toEqual(top35total);
    expect(r.monthlyIndexedEarnings())
        .toEqual(Math.floor(top35total / 12 / 35));
  });

  it('computes top35 earnings years from historical and future data', () => {
    let r = top35RecipientSetup();

    // Add 3 years of future earnings records with enough earnings to
    // ensure that they are top 35 years.
    for (let i = 0; i < 3; i++) {
      r.futureEarningsRecords.push(
          testRecord(constants.CURRENT_YEAR + i, 30 * 1000));
    }
    // .push doesn't call set(), so we must force a refresh:
    r.futureEarningsRecords = r.futureEarningsRecords;

    // The earliest 32 years should form the cutoff:
    expect(r.earningsRecords[31].year).toEqual(1996);
    expect(r.earningsRecords[31].indexedEarnings()).toEqual(21466.70);
    expect(r.cutoffIndexedEarnings()).toEqual(21466.70);
    let top35total = 0.0;
    for (let i = 0; i < 40; i++) {
      if (i < 32) {
        expect(r.earningsRecords[i].isTop35EarningsYear).toBe(true);
        top35total += Math.round(100 * r.earningsRecords[i].indexedEarnings());
      } else {
        expect(r.earningsRecords[i].isTop35EarningsYear).toBe(false);
      }
    }
    // Deal with precision issues by adding these values as integers:
    // TODO(issues/221): Use an arbitrary precision library.
    top35total /= 100;
    // Add back the 3 future years earnings:
    top35total += 30 * 1000 * 3;
    expect(r.totalIndexedEarnings()).toEqual(top35total);
    expect(r.monthlyIndexedEarnings())
        .toEqual(Math.floor(top35total / 12 / 35));
  });

  it('determines hasEarningsBefore1978', () => {
    let r = new Recipient();
    // Empty records:
    expect(r.hasEarningsBefore1978()).toBe(false);

    // Record in 1978:
    r.earningsRecords = [
      testRecord(1978),
    ];
    expect(r.hasEarningsBefore1978()).toBe(false);

    // Record in 1977:
    r.earningsRecords = [
      testRecord(1977),
    ];
    expect(r.hasEarningsBefore1978()).toBe(true);
  });
});
