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


