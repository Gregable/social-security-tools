describe("MonthDate Initialization", function() {
  it("FromMonths", function() {
    let md = new MonthDate().initFromMonths(13);
    expect(md.year()).toBe(1);
    expect(md.monthIndex()).toBe(1);
  });
  it("FromYearsMonths", function() {
    let md = new MonthDate().initFromYearsMonths(2000, 0);
    expect(md.year()).toBe(2000);
    expect(md.monthIndex()).toBe(0);
  });
  it("FromYearsMonthsStr", function() {
    let md = new MonthDate().initFromYearsMonthsStr(2000, "Jan");
    expect(md.year()).toBe(2000);
    expect(md.monthIndex()).toBe(0);
  });
  it("FromMonthsDate", function() {
    let mdToCopy = new MonthDate().initFromYearsMonthsStr(2000, "Jan");
    let md = new MonthDate().initFromMonthDate(mdToCopy);
    expect(md.year()).toBe(2000);
    expect(md.monthIndex()).toBe(0);
  });

});

describe("MonthDate", function() {
  let testMd = new MonthDate().initFromYearsMonths(2012, 9);
  it("returns monthsSinceEpoch", function() {
    expect(testMd.monthsSinceEpoch()).toBe(2012 * 12 + 9);
  });
  it("returns year", function() {
    expect(testMd.year()).toBe(2012);
  });
  it("returns monthIndex", function() {
    expect(testMd.monthIndex()).toBe(9);
  });
  it("returns monthName", function() {
    expect(testMd.monthName()).toBe("Oct");
  });
  it("returns monthFullName", function() {
    expect(testMd.monthFullName()).toBe("October");
  });
  it("correctly compares to another MonthDate", function() {
    expect(testMd.greaterThan(new MonthDate().initFromYearsMonths(2012, 8)))
        .toBe(true);
    expect(testMd.greaterThan(new MonthDate().initFromYearsMonths(2012, 9)))
        .toBe(false);
    expect(testMd.greaterThan(new MonthDate().initFromYearsMonths(2012, 10)))
        .toBe(false);

    expect(testMd.lessThan(new MonthDate().initFromYearsMonths(2012, 8)))
        .toBe(false);
    expect(testMd.lessThan(new MonthDate().initFromYearsMonths(2012, 9)))
        .toBe(false);
    expect(testMd.lessThan(new MonthDate().initFromYearsMonths(2012, 10)))
        .toBe(true);

    expect(testMd.greaterThanOrEqual(
          new MonthDate().initFromYearsMonths(2012, 8))).toBe(true);
    expect(testMd.greaterThanOrEqual(
          new MonthDate().initFromYearsMonths(2012, 9))).toBe(true);
    expect(testMd.greaterThanOrEqual(
          new MonthDate().initFromYearsMonths(2012, 10))).toBe(false);

    expect(testMd.lessThanOrEqual(
          new MonthDate().initFromYearsMonths(2012, 8))).toBe(false);
    expect(testMd.lessThanOrEqual(
          new MonthDate().initFromYearsMonths(2012, 9))).toBe(true);
    expect(testMd.lessThanOrEqual(
          new MonthDate().initFromYearsMonths(2012, 10))).toBe(true);
  });
  it("subtracts a MonthDate", function() {
    let duration = testMd.subtractDate(
        new MonthDate().initFromYearsMonths(2011, 9));
    expect(duration.asMonths()).toBe(12);
  });
  it("subtracts a MonthDuration", function() {
    let newDate = testMd.subtractDuration(
        new MonthDuration().initFromMonths(12));
    expect(newDate.year()).toBe(2011);
    expect(newDate.monthIndex()).toBe(9);
  });
  it("adds a MonthDuration", function() {
    let newDate = testMd.addDuration(new MonthDuration().initFromMonths(12));
    expect(newDate.year()).toBe(2013);
    expect(newDate.monthIndex()).toBe(9);
  });
});

describe("MonthDuration", function() {
  it("initFromYearsMonths", function() {
    let md = new MonthDuration().initFromYearsMonths(12, 1);
    expect(md.asMonths()).toBe(12 * 12 + 1);
  });
  it("years are floored", function() {
    let md = new MonthDuration().initFromYearsMonths(12, 11);
    expect(md.years()).toBe(12);
  });
  it("mods months by 12", function() {
    let md = new MonthDuration().initFromYearsMonths(12, 11);
    expect(md.modMonths()).toBe(11);
  });
  it("correctly comparse to other MonthDurations", function() {
    let md = new MonthDuration().initFromMonths(9);
    expect(md.greaterThan(new MonthDuration().initFromMonths(8))).toBe(true);
    expect(md.greaterThan(new MonthDuration().initFromMonths(9))).toBe(false);
    expect(md.greaterThan(new MonthDuration().initFromMonths(10))).toBe(false);

    expect(md.lessThan(new MonthDuration().initFromMonths(8))).toBe(false);
    expect(md.lessThan(new MonthDuration().initFromMonths(9))).toBe(false);
    expect(md.lessThan(new MonthDuration().initFromMonths(10))).toBe(true);
  });
  it("can be added / subtracted from another MonthDuration", function() {
    let md = new MonthDuration().initFromMonths(9);
    expect(md.subtract(new MonthDuration().initFromMonths(1)).asMonths())
      .toBe(8);
    expect(md.add(new MonthDuration().initFromMonths(1)).asMonths())
      .toBe(10);
  });
});

describe("utils", function() {
  it("rounds to the next lowest dime", function() {
    expect(NearestDime(10.12)).toBe(10.1);
    expect(NearestDime(10.19)).toBe(10.1);
  });
 it("rounds to the next lowest penny", function() {
    expect(NearestPenny(10.123)).toBe(10.12);
    expect(NearestPenny(10.129)).toBe(10.12);
  });

  it("inserts commas into numbers", function() {
    expect(insertNumericalCommas(123)).toBe("123");
    expect(insertNumericalCommas(1234)).toBe("1,234");
    expect(insertNumericalCommas(123.4)).toBe("123.4");
    expect(insertNumericalCommas(1234.5)).toBe("1,234.5");
    expect(insertNumericalCommas(-1234.5)).toBe("-1,234.5");
  });
  it("returns wage watio by year", function() {
    expect(Math.floor(wageRatioInYear(2000)*100)/100).toBe(3.28);
  });
  it("returns bend points by year", function() {
    expect(firstBendPoint(2000)).toBe(592);
    expect(secondBendPoint(2000)).toBe(3567);
  });
  it("returns pia amounts per bracket", function() {
    // (indexingYear, earnings, bracket)
    // Year 2000, $500 earnings. Entirely in the first bracket.
    expect(primaryInsuranceAmountForEarningsByBracket(2000, 500, 0))
      .toBe(450);
    expect(primaryInsuranceAmountForEarningsByBracket(2000, 500, 1))
      .toBe(0);
    expect(primaryInsuranceAmountForEarningsByBracket(2000, 500, 2))
      .toBe(0);

    // Year 2000, $1000 earnings. In the first 2 brackets.
    expect(primaryInsuranceAmountForEarningsByBracket(2000, 1000, 0))
      .toBe(532.8);
    expect(primaryInsuranceAmountForEarningsByBracket(2000, 1000, 1))
      .toBe(130.56);
    expect(primaryInsuranceAmountForEarningsByBracket(2000, 1000, 2))
      .toBe(0);

    // Year 2000, $5000 earnings. In all 3 brackets.
    expect(primaryInsuranceAmountForEarningsByBracket(2000, 5000, 0))
      .toBe(532.8);
    expect(primaryInsuranceAmountForEarningsByBracket(2000, 5000, 1))
      .toBe(952);
    expect(primaryInsuranceAmountForEarningsByBracket(2000, 5000, 2))
      .toBe(214.95);
  });
  it("returns unadjusted pia for earnings", function() {
    // The sum should add up to the per-bracket values in the $5000 case
    // in the previous test.
    expect(primaryInsuranceAmountForEarningsUnadjusted(2000, 5000)).toBe(
          NearestDime(214.95 + 952 + 532.8));
  });
});
