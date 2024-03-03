import { Birthdate } from "$lib/birthday";
import { EarningRecord } from "$lib/earning-record";
import { Money } from "$lib/money";
import { MonthDate, MonthDuration } from "$lib/month-time";
import { Recipient } from "$lib/recipient";
import { describe, expect, it } from "vitest";

import * as constants from "../lib/constants";

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

describe("Recipient", () => {
  it("initializes without input", () => {
    let r = new Recipient();
  });

  it("sets and gets earning records", () => {
    let r = new Recipient();
    let er = testRecord(2010);
    r.earningsRecords = [er];
    expect(r.earningsRecords).toEqual([er]);
  });

  it("sets and gets future earning records", () => {
    let r = new Recipient();
    let er = testRecord(2010);
    r.futureEarningsRecords = [er];
    expect(r.futureEarningsRecords).toEqual([er]);
  });

  it("sets and gets birth date", () => {
    let r = new Recipient();
    const b = Birthdate.FromYMD(1970, 1, 1);
    r.birthdate = b;
    expect(r.birthdate).toEqual(b);
  });

  it("simulates future earning years with no earnings", () => {
    let r = new Recipient();
    r.simulateFutureEarningsYears(10, Money.from(100 * 1000));
    expect(r.futureEarningsRecords.length).toEqual(10);

    for (let i = 0; i < 10; i++) {
      expect(r.futureEarningsRecords[i].year).toEqual(
        constants.CURRENT_YEAR + i
      );
      expect(r.futureEarningsRecords[i].taxedEarnings.value()).toEqual(
        100 * 1000
      );
      expect(r.futureEarningsRecords[i].taxedMedicareEarnings.value()).toEqual(
        100 * 1000
      );
    }
  });

  it("simulates future earning years with past earnings", () => {
    let r = new Recipient();
    r.earningsRecords = [
      testRecord(constants.CURRENT_YEAR - 2),
      testRecord(constants.CURRENT_YEAR - 1),
    ];

    r.simulateFutureEarningsYears(10, Money.from(100 * 1000));
    // If there were no earnings in the current year, the simulation should
    // start in the current year.
    expect(r.futureEarningsRecords[0].year).toEqual(constants.CURRENT_YEAR);
  });

  it("simulates future earning years with past and current earnings", () => {
    let r = new Recipient();
    r.earningsRecords = [
      testRecord(constants.CURRENT_YEAR - 2),
      testRecord(constants.CURRENT_YEAR - 1),
      testRecord(constants.CURRENT_YEAR),
    ];

    r.simulateFutureEarningsYears(10, Money.from(100 * 1000));
    // If there were earnings in the current year, the simulation should
    // start in the next year.
    expect(r.futureEarningsRecords[0].year).toEqual(constants.CURRENT_YEAR + 1);
  });

  it("simulates future earning years with incomplete earnings", () => {
    let r = new Recipient();
    r.earningsRecords = [
      testRecord(constants.CURRENT_YEAR - 2),
      testRecord(constants.CURRENT_YEAR - 1, /*earnings*/ Money.from(-1)),
    ];
    // Mark the last record as incomplete.
    r.earningsRecords[1].incomplete = true;

    r.simulateFutureEarningsYears(10, Money.from(100 * 1000));
    // If there were earnings in the previous year, but it is an incomplete
    // record, the simulation should start in that year.
    expect(r.futureEarningsRecords[0].year).toEqual(constants.CURRENT_YEAR - 1);
  });

  it("simulates future earning years with earnings in the future", () => {
    let r = new Recipient();
    r.earningsRecords = [
      testRecord(constants.CURRENT_YEAR - 2),
      testRecord(constants.CURRENT_YEAR - 1),
      testRecord(constants.CURRENT_YEAR),
      testRecord(constants.CURRENT_YEAR + 1),
      testRecord(constants.CURRENT_YEAR + 2),
    ];

    r.simulateFutureEarningsYears(10, Money.from(100 * 1000));
    // If there were earnings in the current year, the simulation should
    // start in the next year.
    expect(r.futureEarningsRecords[0].year).toEqual(constants.CURRENT_YEAR + 3);
  });

  it("calculates normal retirement", () => {
    let r = new Recipient();
    // Use Jan 2 rather than Jan 1 to avoid issues with "attaining an age" the
    // day before the birthday.
    r.birthdate = Birthdate.FromYMD(1957, 0, 2);

    expect(r.normalRetirementAge()).toEqual(
      MonthDuration.initFromYearsMonths({ years: 66, months: 6 })
    );
    expect(r.normalRetirementDate()).toEqual(
      MonthDate.initFromYearsMonths({ years: 2023, months: 6 })
    );
  });

  it("calculates indexing year", () => {
    let r = new Recipient();
    // Use Jan 2 rather than Jan 1 to avoid issues with "attaining an age" the
    // day before the birthday.
    r.birthdate = Birthdate.FromYMD(1957, 0, 2);

    expect(r.indexingYear()).toEqual(2017);
  });

  it("calculates total credits from only earned credits", () => {
    let r = new Recipient();
    // Earned exactly 1, 2, and 3 credits in 2007, 2008, and 2009, respectively:
    r.earningsRecords = [
      testRecord(2007, constants.EARNINGS_PER_CREDIT[2007].times(1)),
      testRecord(2008, constants.EARNINGS_PER_CREDIT[2008].times(2)),
      testRecord(2009, constants.EARNINGS_PER_CREDIT[2009].times(3)),
    ];
    expect(r.totalCredits()).toEqual(6);

    // Earned enough for 20 credits in 2010, but credits are capped at 4 / year.
    r.earningsRecords.push(
      testRecord(2010, constants.EARNINGS_PER_CREDIT[2010].times(20))
    );
    expect(r.totalCredits()).toEqual(10);
  });

  it("calculates total credits from only future credits", () => {
    let r = new Recipient();
    r.futureEarningsRecords = [
      testRecord(
        constants.MAX_YEAR + 1,
        constants.EARNINGS_PER_CREDIT[constants.MAX_YEAR].times(1)
      ),
      testRecord(
        constants.MAX_YEAR + 2,
        constants.EARNINGS_PER_CREDIT[constants.MAX_YEAR].times(2)
      ),
    ];
    expect(r.totalCredits()).toEqual(3);

    // Earned enough for 20 credits in 2010, but credits are capped at 4 / year.
    r.futureEarningsRecords.push(
      testRecord(
        constants.MAX_YEAR + 3,
        constants.EARNINGS_PER_CREDIT[constants.MAX_YEAR].times(30)
      )
    );
    expect(r.totalCredits()).toEqual(7);
  });

  it("updates earnings records on record write", () => {
    let r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1990, 0, 2);

    // Records are written initially out of order:
    r.earningsRecords = [testRecord(2009), testRecord(2007), testRecord(2008)];

    for (let i = 0; i < 3; i++) {
      // Records get sorted by year:
      expect(r.earningsRecords[i].year).toEqual(2007 + i);
      // Records have age set:
      expect(r.earningsRecords[i].age).toEqual(2007 - 1990 + i);
      // Records have indexingYear set:
      expect(r.earningsRecords[0].indexingYear).toEqual(2050);
    }

    // Update the birthdate to be 1995, which changes the indexing year:
    r.birthdate = Birthdate.FromYMD(1995, 0, 2);
    for (let i = 0; i < 3; i++) {
      // Records have indexingYear set:
      expect(r.earningsRecords[0].indexingYear).toEqual(2055);
    }
  });

  it("updates future earnings records on record write", () => {
    let r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1990, 0, 2);

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
    r.birthdate = Birthdate.FromYMD(1995, 0, 2);
    for (let i = 0; i < 3; i++) {
      // Records have indexingYear set:
      expect(r.futureEarningsRecords[0].indexingYear).toEqual(2055);
    }
  });

  it("calls subscribers on name update", () => {
    let r = new Recipient();
    let numCallbacks = 0;
    let unsubscribe = r.subscribe((recipient: Recipient) => {
      numCallbacks++;
    });
    expect(numCallbacks).toEqual(1);

    r.name = "Greg";
    expect(numCallbacks).toEqual(2);
    unsubscribe();
  });

  it("calls subscribers on earnings record update", () => {
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

  it("calls subscribers on future earnings record update", () => {
    let r = new Recipient();
    let expectedRecordCount = 0;
    let numCallbacks = 0;
    let unsubscribe = r.subscribe((recipient: Recipient) => {
      expect(recipient.futureEarningsRecords.length).toEqual(
        expectedRecordCount
      );
      numCallbacks++;
    });
    expect(numCallbacks).toEqual(1);

    expectedRecordCount = 1;
    r.futureEarningsRecords = [testRecord(2007)];
    expect(numCallbacks).toEqual(2);
    unsubscribe();
  });

  it("calls subscribers on birthday record update", () => {
    let r = new Recipient();
    let numCallbacks = 0;
    let unsubscribe = r.subscribe((recipient: Recipient) => {
      numCallbacks++;
    });
    expect(numCallbacks).toEqual(1);

    r.birthdate = Birthdate.FromYMD(1990, 0, 2);
    expect(numCallbacks).toEqual(2);
    unsubscribe();
  });

  it("shortens name", () => {
    let r = new Recipient();
    r.name = "Gregory";
    expect(r.shortName(5)).toEqual("Greg…");
    expect(r.shortName(7)).toEqual("Gregory");
  });

  it("captures first, second, only", () => {
    let r = new Recipient();
    expect(r.first).toEqual(true);
    expect(r.only).toEqual(true);

    r.markFirst();
    expect(r.first).toEqual(true);
    expect(r.only).toEqual(false);

    let r2 = new Recipient();
    r2.markSecond();
    expect(r2.first).toEqual(false);
    expect(r2.only).toEqual(false);
  });

  /**
   * Generates a recipient with a birthdate in 1960, and 40 years of earnings
   * records starting in 1965. Each year has earnings equal to $10,000.
   */
  function top35RecipientSetup() {
    let r = new Recipient();

    // Pick a start year such that the indexing year is in the past (2020).
    // This way the test won't break when the wage indices are updated for
    // future years.
    const startYear = 1965;
    r.birthdate = Birthdate.FromYMD(startYear - 5, 0, 2);
    expect(r.indexingYear()).toBe(2020);

    // Add 40 years of earnings records, starting the year they were born:
    for (let i = 0; i < 40; i++) {
      r.earningsRecords.push(testRecord(startYear + i));
    }
    // .push doesn't call set(), so we must force a refresh:
    r.earningsRecords = r.earningsRecords;

    return r;
  }

  it("computes top35 earnings years from historical data", () => {
    let r = top35RecipientSetup();

    // The top 35 years should be the earliest 35 years, since those have the
    // highest indexing multiple, with ties are broken to earlier years.
    expect(r.earningsRecords[34].year).toEqual(1999);
    expect(r.earningsRecords[34].indexedEarnings().value()).toEqual(18256.94);
    expect(r.cutoffIndexedEarnings().value()).toEqual(18256.94);
    let top35total = Money.from(0.0);
    for (let i = 0; i < 40; i++) {
      if (i < 35) {
        expect(r.earningsRecords[i].isTop35EarningsYear).toBe(true);
        top35total = top35total.plus(r.earningsRecords[i].indexedEarnings());
      } else {
        expect(r.earningsRecords[i].isTop35EarningsYear).toBe(false);
      }
    }
    expect(r.totalIndexedEarnings().value()).toEqual(top35total.value());
    expect(r.monthlyIndexedEarnings().value()).toEqual(
      top35total.div(12).div(35).floorToDollar().value()
    );
  });

  it("computes top35 earnings years from historical and future data", () => {
    let r = top35RecipientSetup();

    // Add 3 years of future earnings records with enough earnings to
    // ensure that they are top 35 years.
    for (let i = 0; i < 3; i++) {
      r.futureEarningsRecords.push(
        testRecord(constants.CURRENT_YEAR + i, Money.from(30 * 1000))
      );
    }
    // .push doesn't call set(), so we must force a refresh:
    r.futureEarningsRecords = r.futureEarningsRecords;

    // The earliest 32 years should form the cutoff:
    expect(r.earningsRecords[31].year).toEqual(1996);
    expect(r.earningsRecords[31].indexedEarnings().value()).toEqual(21466.7);
    expect(r.cutoffIndexedEarnings().value()).toEqual(21466.7);
    let top35total = Money.from(0.0);
    for (let i = 0; i < 40; i++) {
      if (i < 32) {
        expect(r.earningsRecords[i].isTop35EarningsYear).toBe(true);
        top35total = top35total.plus(r.earningsRecords[i].indexedEarnings());
      } else {
        expect(r.earningsRecords[i].isTop35EarningsYear).toBe(false);
      }
    }

    // Add back the 3 future years earnings:
    top35total = top35total.plus(Money.from(30 * 1000 * 3));
    expect(r.totalIndexedEarnings().value()).toEqual(top35total.value());
    expect(r.monthlyIndexedEarnings().value()).toEqual(
      top35total.div(12).div(35).floorToDollar().value()
    );
  });

  it("determines hasEarningsBefore1978", () => {
    let r = new Recipient();
    // Empty records:
    expect(r.hasEarningsBefore1978()).toBe(false);

    // Record in 1978:
    r.earningsRecords = [testRecord(1978)];
    expect(r.hasEarningsBefore1978()).toBe(false);

    // Record in 1977:
    r.earningsRecords = [testRecord(1977)];
    expect(r.hasEarningsBefore1978()).toBe(true);
  });

  it("correctly calculates benefits based on filing ages", () => {
    let r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1960, 0, 5);
    // Over time, the PIA will increase due to COLAs, but we want the tests
    // to be stable, so we set the PIA to a fixed value for testing.
    r.setPia(Money.from(1000.0));

    // Early retirement at 62 should be 30% reduction:
    expect(
      r
        .benefitAtAge(
          MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
        )
        .value()
    ).toEqual(700.0);
    // Early retirement at 66 should be 6.67% reduction:
    expect(
      r
        .benefitAtAge(
          MonthDuration.initFromYearsMonths({ years: 66, months: 0 })
        )
        .value()
    ).toEqual(933.0);
    // Test the normal retirement age:
    expect(
      r
        .benefitAtAge(
          MonthDuration.initFromYearsMonths({ years: 67, months: 0 })
        )
        .value()
    ).toEqual(1000.0);
    // Delayed retirement at 68 should be 8% increase:
    expect(
      r
        .benefitAtAge(
          MonthDuration.initFromYearsMonths({ years: 68, months: 0 })
        )
        .value()
    ).toEqual(1080.0);
    // Delayed retirement at 70 should be 24% increase:
    expect(
      r
        .benefitAtAge(
          MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
        )
        .value()
    ).toEqual(1240.0);
  });

  it("correctly calculates benefits based on filing and current dates", () => {
    let r = new Recipient();
    // Over time, the PIA will increase due to COLAs, but we want the tests
    // to be stable, so we set the PIA to a fixed value for testing.
    r.setPia(Money.from(1000.0));

    // If they haven't filed yet, they should have zero benefit:
    r.birthdate = Birthdate.FromYMD(1960, 0, 5);
    expect(
      r
        .benefitOnDate(
          // File at NRA, 67:
          MonthDate.initFromYearsMonths({ years: 2027, months: 1 }),
          // Currently at age 63:
          MonthDate.initFromYearsMonths({ years: 2023, months: 1 })
        )
        .value()
    ).toEqual(0);

    // Early retirement at 66 should be 6.67% reduction:
    expect(
      r
        .benefitOnDate(
          MonthDate.initFromYearsMonths({ years: 2026, months: 0 }),
          MonthDate.initFromYearsMonths({ years: 2026, months: 0 })
        )
        .value()
    ).toEqual(933.0);
    // Reductions are applied monthly, unlike delayed retirement credits, so
    // adding 2 months should increase the benefit by 1/6 of 6.67%:
    expect(
      r
        .benefitOnDate(
          MonthDate.initFromYearsMonths({ years: 2026, months: 2 }),
          MonthDate.initFromYearsMonths({ years: 2026, months: 2 })
        )
        .value()
    ).toEqual(944.0);

    // Filing in the middle of the year, but on the month they turn 70,
    // should immediately be maximum delayed multiplier of 24%
    r.birthdate = Birthdate.FromYMD(1960, 6, 5);
    expect(
      r
        .benefitOnDate(
          MonthDate.initFromYearsMonths({ years: 2030, months: 6 }),
          MonthDate.initFromYearsMonths({ years: 2030, months: 6 })
        )
        .value()
    ).toEqual(1240.0);

    // Filing in the middle of the year, but on the month before they turn 70,
    // should result in only a 20% increase until the following year. where
    // it will be 24%. The 20% number is the delayed retirement credits as of
    // Jan 2030.
    r.birthdate = Birthdate.FromYMD(1960, 6, 5);
    expect(
      r
        .benefitOnDate(
          MonthDate.initFromYearsMonths({ years: 2030, months: 5 }),
          MonthDate.initFromYearsMonths({ years: 2030, months: 5 })
        )
        .value()
    ).toEqual(1200.0); // 0.67 per month for 30 months = 20%
    expect(
      r
        .benefitOnDate(
          MonthDate.initFromYearsMonths({ years: 2030, months: 5 }),
          MonthDate.initFromYearsMonths({ years: 2031, months: 0 })
        )
        .value()
    ).toEqual(1233.0); // 0.67 per month for 35 months = 23.33%
  });

  it("correctly calculates spousal benefits based on filing and current dates", () => {
    let r = new Recipient();
    // Over time, the PIA will increase due to COLAs, but we want the tests
    // to be stable, so we set the PIA to a fixed value for testing.
    r.setPia(Money.from(1000.0));

    let s = new Recipient();
    // Force a spousal PIA large enough to generate a $500 spousal benefit.
    s.setPia(Money.from(3000.0));

    // If they haven't filed yet, they should have zero benefit:
    r.birthdate = Birthdate.FromYMD(1960, 0, 5);
    s.birthdate = Birthdate.FromYMD(1960, 0, 5);
    expect(
      r
        .spousalBenefitOnDate(
          s,
          MonthDate.initFromYearsMonths({ years: 2027, months: 1 }),
          // File at NRA, 67:
          MonthDate.initFromYearsMonths({ years: 2027, months: 1 }),
          // Currently at age 63:
          MonthDate.initFromYearsMonths({ years: 2023, months: 1 })
        )
        .value()
    ).toEqual(0);

    // atDate before spouse files results in no benefit
    expect(
      r
        .spousalBenefitOnDate(
          s,
          MonthDate.initFromYearsMonths({ years: 2027, months: 1 }),
          MonthDate.initFromYearsMonths({ years: 2026, months: 0 }),
          MonthDate.initFromYearsMonths({ years: 2026, months: 0 })
        )
        .value()
    ).toEqual(0);

    // Early retirement at 66 should be 8.33% reduction:
    expect(
      r
        .spousalBenefitOnDate(
          s,
          MonthDate.initFromYearsMonths({ years: 2022, months: 1 }),
          MonthDate.initFromYearsMonths({ years: 2026, months: 0 }),
          MonthDate.initFromYearsMonths({ years: 2026, months: 0 })
        )
        .value()
    ).toEqual(458);

    // Reductions are applied monthly, unlike delayed retirement credits, so
    // adding 6 months should be only a 4.165% reduction:
    expect(
      r
        .spousalBenefitOnDate(
          s,
          MonthDate.initFromYearsMonths({ years: 2022, months: 1 }),
          MonthDate.initFromYearsMonths({ years: 2026, months: 6 }),
          MonthDate.initFromYearsMonths({ years: 2026, months: 6 })
        )
        .value()
    ).toEqual(479);

    // 3 years of reductions should be 25%
    expect(
      r
        .spousalBenefitOnDate(
          s,
          MonthDate.initFromYearsMonths({ years: 2022, months: 1 }),
          MonthDate.initFromYearsMonths({ years: 2024, months: 0 }),
          MonthDate.initFromYearsMonths({ years: 2024, months: 0 })
        )
        .value()
    ).toEqual(375);

    // Each month past 3 years should be another 5 / 12 % reduction.
    expect(
      r
        .spousalBenefitOnDate(
          s,
          MonthDate.initFromYearsMonths({ years: 2022, months: 1 }),
          MonthDate.initFromYearsMonths({ years: 2023, months: 11 }),
          MonthDate.initFromYearsMonths({ years: 2023, months: 11 })
        )
        .value()
    ).toEqual(372);

    // Delayed retirement should not add any additional benefit:
    expect(
      r
        .spousalBenefitOnDate(
          s,
          MonthDate.initFromYearsMonths({ years: 2022, months: 1 }),
          MonthDate.initFromYearsMonths({ years: 2029, months: 0 }),
          MonthDate.initFromYearsMonths({ years: 2029, months: 0 })
        )
        .value()
    ).toEqual(500.0);
  });

  it("calculates spousal benefits for a specific example", () => {
    let r = new Recipient();
    r.setPia(Money.from(1000.0));

    let s = new Recipient();
    s.setPia(Money.from(200.0));

    r.birthdate = Birthdate.FromYMD(1962, 0, 2);
    s.birthdate = Birthdate.FromYMD(1962, 0, 2);
    expect(
      s
        .spousalBenefitOnDate(
          r,
          MonthDate.initFromYearsMonths({ years: 2028, months: 0 }),
          MonthDate.initFromYearsMonths({ years: 2024, months: 0 }),
          MonthDate.initFromYearsMonths({ years: 2029, months: 0 })
        )
        .value()
    ).toEqual(275);
  });

  it("calculates survivor benefits", () => {
    // Two recipients, one with a PIA of $1000, and the other with a PIA of
    // $3000. The first recipient is the survivor, and the second recipient is
    // the deceased. Both born in Jan 1960, so FRA of 67 is in Jan 2027.
    let recipient = new Recipient();
    recipient.setPia(Money.from(1000.0));
    recipient.birthdate = Birthdate.FromYMD(1960, 0, 5);

    let deceased = new Recipient();
    deceased.setPia(Money.from(3000.0));
    deceased.birthdate = Birthdate.FromYMD(1960, 0, 5);

    // Scenario 1: Deceased died at age 60 before filing.
    {
      const deceasedDeathDate = MonthDate.initFromYearsMonths({
        years: 2020,
        months: 0,
      });
      const deceasedFilingDate = MonthDate.initFromYearsMonths({
        years: 2027,
        months: 0,
      });

      // In this situation, the base survivor benefit is the full deceased's PIA
      // of $3000. Since the recipient files for survivor benefits at the
      // earliest age 60, the benefit is reduced to only 71.5% of the PIA.
      // $3,000 * 0.715 = $2,145.
      expect(
        recipient
          .survivorBenefit(
            deceased,
            deceasedFilingDate,
            deceasedDeathDate,
            deceasedDeathDate
          )
          .value()
      ).toEqual(2145);
    }

    // Scenario 2: Deceased died at age 68 without filing, after FRA.
    {
      const deceasedDeathDate = MonthDate.initFromYearsMonths({
        years: 2028,
        months: 0,
      });
      const deceasedFilingDate = MonthDate.initFromYearsMonths({
        years: 2028,
        months: 0,
      });

      // In this situation, the base survivor benefit is the deceased benefit
      // at age 68 which is 8% higher than the PIA. $3,000 * 1.08 = $3,240.
      // Since the recipient
      expect(
        recipient
          .survivorBenefit(
            deceased,
            deceasedFilingDate,
            deceasedDeathDate,
            deceasedDeathDate
          )
          .value()
      ).toEqual(3240);
    }

    // Scenario 3: Deceased filed for benefits at age 62, and died at age 67.
    {
      const deceasedDeathDate = MonthDate.initFromYearsMonths({
        years: 2027,
        months: 0,
      });
      const deceasedFilingDate = MonthDate.initFromYearsMonths({
        years: 2022,
        months: 1,
      });
      // In this situation, the base survivor benefit is the minimum: 82.5% of
      // the deceased's PIA. $3,000 * 0.825 = $2,475.
      expect(
        recipient
          .survivorBenefit(
            deceased,
            deceasedFilingDate,
            deceasedDeathDate,
            deceasedDeathDate
          )
          .value()
      ).toEqual(2475);
    }

    // Scenario 3: Deceased filed for benefits at age 68, and died at age 69.
    {
      const deceasedDeathDate = MonthDate.initFromYearsMonths({
        years: 2029,
        months: 0,
      });
      const deceasedFilingDate = MonthDate.initFromYearsMonths({
        years: 2028,
        months: 0,
      });
      // In this situation, the base survivor benefit is the deceased's benefit, which is 108% of their PIA. $3,000 * 1.08 = $3,240.
      expect(
        recipient
          .survivorBenefit(
            deceased,
            deceasedFilingDate,
            deceasedDeathDate,
            deceasedDeathDate
          )
          .value()
      ).toEqual(3240);
    }
  });
});
