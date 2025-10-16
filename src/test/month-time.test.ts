import { describe, expect, it } from 'vitest';
import { MonthDate, MonthDuration } from '$lib/month-time';

describe('MonthDate Initialization', () => {
  it('constructor from months', () => {
    const md = new MonthDate(13);
    expect(md.year()).toBe(1);
    expect(md.monthIndex()).toBe(1);
  });
  it('FromYearsMonths', () => {
    const md = MonthDate.initFromYearsMonths({ years: 2000, months: 0 });
    expect(md.year()).toBe(2000);
    expect(md.monthIndex()).toBe(0);
  });
  it('FromYearsMonthsStr', () => {
    const md = MonthDate.initFromYearsMonthsStr(2000, 'Jan');
    expect(md.year()).toBe(2000);
    expect(md.monthIndex()).toBe(0);
  });

  it('FromCopy', () => {
    const mdToCopy = MonthDate.initFromYearsMonthsStr(2000, 'Jan');
    const md = MonthDate.copyFrom(mdToCopy);
    expect(md.year()).toBe(2000);
    expect(md.monthIndex()).toBe(0);
  });
});

describe('MonthDate', () => {
  const testMd = MonthDate.initFromYearsMonths({ years: 2012, months: 9 });
  it('returns monthsSinceEpoch', () => {
    expect(testMd.monthsSinceEpoch()).toBe(2012 * 12 + 9);
  });
  it('returns year', () => {
    expect(testMd.year()).toBe(2012);
  });
  it('returns monthIndex', () => {
    expect(testMd.monthIndex()).toBe(9);
  });
  it('returns monthName', () => {
    expect(testMd.monthName()).toBe('Oct');
  });
  it('returns monthFullName', () => {
    expect(testMd.monthFullName()).toBe('October');
  });
  it('correctly compares to another MonthDate', () => {
    expect(
      testMd.greaterThan(
        MonthDate.initFromYearsMonths({ years: 2012, months: 8 })
      )
    ).toBe(true);
    expect(
      testMd.greaterThan(
        MonthDate.initFromYearsMonths({ years: 2012, months: 9 })
      )
    ).toBe(false);
    expect(
      testMd.greaterThan(
        MonthDate.initFromYearsMonths({ years: 2012, months: 10 })
      )
    ).toBe(false);

    expect(
      testMd.lessThan(MonthDate.initFromYearsMonths({ years: 2012, months: 8 }))
    ).toBe(false);
    expect(
      testMd.lessThan(MonthDate.initFromYearsMonths({ years: 2012, months: 9 }))
    ).toBe(false);
    expect(
      testMd.lessThan(
        MonthDate.initFromYearsMonths({ years: 2012, months: 10 })
      )
    ).toBe(true);

    expect(
      testMd.greaterThanOrEqual(
        MonthDate.initFromYearsMonths({ years: 2012, months: 8 })
      )
    ).toBe(true);
    expect(
      testMd.greaterThanOrEqual(
        MonthDate.initFromYearsMonths({ years: 2012, months: 9 })
      )
    ).toBe(true);
    expect(
      testMd.greaterThanOrEqual(
        MonthDate.initFromYearsMonths({ years: 2012, months: 10 })
      )
    ).toBe(false);

    expect(
      testMd.lessThanOrEqual(
        MonthDate.initFromYearsMonths({ years: 2012, months: 8 })
      )
    ).toBe(false);
    expect(
      testMd.lessThanOrEqual(
        MonthDate.initFromYearsMonths({ years: 2012, months: 9 })
      )
    ).toBe(true);
    expect(
      testMd.lessThanOrEqual(
        MonthDate.initFromYearsMonths({ years: 2012, months: 10 })
      )
    ).toBe(true);
  });
  it('subtracts a MonthDate', () => {
    const duration = testMd.subtractDate(
      MonthDate.initFromYearsMonths({ years: 2011, months: 9 })
    );
    expect(duration.asMonths()).toBe(12);
  });
  it('subtracts a MonthDuration', () => {
    const newDate = testMd.subtractDuration(new MonthDuration(12));
    expect(newDate.year()).toBe(2011);
    expect(newDate.monthIndex()).toBe(9);
  });
  it('adds a MonthDuration', () => {
    const newDate = testMd.addDuration(new MonthDuration(12));
    expect(newDate.year()).toBe(2013);
    expect(newDate.monthIndex()).toBe(9);
  });
});

describe('MonthDuration', () => {
  it('initFromYearsMonths', () => {
    const md = MonthDuration.initFromYearsMonths({ years: 12, months: 1 });
    expect(md.asMonths()).toBe(12 * 12 + 1);
  });
  it('years are floored', () => {
    const md = MonthDuration.initFromYearsMonths({ years: 12, months: 11 });
    expect(md.years()).toBe(12);
  });
  it('mods months by 12', () => {
    const md = MonthDuration.initFromYearsMonths({ years: 12, months: 11 });
    expect(md.modMonths()).toBe(11);
  });
  it('rounds to nearest year', () => {
    // Round down (less than 6 months)
    expect(new MonthDuration(65 * 12 + 5).roundedYears()).toBe(65);
    // Round up (6 or more months)
    expect(new MonthDuration(65 * 12 + 6).roundedYears()).toBe(66);
    expect(new MonthDuration(65 * 12 + 11).roundedYears()).toBe(66);
    // Exact years
    expect(new MonthDuration(65 * 12).roundedYears()).toBe(65);
  });
  it('correctly comparse to other MonthDurations', () => {
    const md = new MonthDuration(9);
    expect(md.greaterThan(new MonthDuration(8))).toBe(true);
    expect(md.greaterThan(new MonthDuration(9))).toBe(false);
    expect(md.greaterThan(new MonthDuration(10))).toBe(false);

    expect(md.lessThan(new MonthDuration(8))).toBe(false);
    expect(md.lessThan(new MonthDuration(9))).toBe(false);
    expect(md.lessThan(new MonthDuration(10))).toBe(true);
  });
  it('can be added /subtracted from another MonthDuration', () => {
    const md = new MonthDuration(9);
    expect(md.subtract(new MonthDuration(1)).asMonths()).toBe(8);
    expect(md.add(new MonthDuration(1)).asMonths()).toBe(10);
  });
});
