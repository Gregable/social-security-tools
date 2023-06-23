import * as constants from './constants'

// TODO(gregable): Remove a bunch of the redundant jsdoc type annotations and
//                 add descriptive text.

/**
 * In social security calculations, days don't really matter for much.
 * Everything is computed on month scales, not days. Days or smaller
 * units of time get in the way, not help. This class provides a Date type
 * that manages months, without even being aware of days.
 */
export class MonthDate {
  private monthsSinceEpoch_: number;

  /**
   * Default constructor, returns a MonthDate of January, Year 0.s
   */
  constructor(monthsSinceEpoch: number = 0) {
    // Internally a MonthDate tracks time from January, Year 0 and counts
    // months from this date. Jan is considered month 0 of the year, and Dec
    // is month 11. So, an internal value of 12 would be January, Year 1.
    this.monthsSinceEpoch_ = monthsSinceEpoch;
  }

  /**
   * Copy initializer.
   */
  static copyFrom(other: MonthDate): MonthDate {
    return new MonthDate(other.monthsSinceEpoch_);
  }

  /**
   * Initializer from a date. So {years: 2000, months: 0} would be Jan, 2000.
   */
  static initFromYearsMonths(yearsMonths: YearsMonths): MonthDate {
    console.assert(Number.isInteger(yearsMonths.years), yearsMonths.years);
    console.assert(Number.isInteger(yearsMonths.months), yearsMonths.months);
    console.assert(yearsMonths.years >= 0, yearsMonths.years);
    console.assert(yearsMonths.months >= 0, yearsMonths.months);
    console.assert(yearsMonths.months < 12, yearsMonths.months);
    return new MonthDate(yearsMonths.years * 12 + yearsMonths.months);
  }

  /**
   * Initializer from a date with string month. Ex: (2000, "Jan").
   * @param {string} monthStr - 3 character month string from ALL_MONTHS
   */
  static initFromYearsMonthsStr(years: number, monthStr: string): MonthDate {
    console.assert(Number.isInteger(years), years);
    console.assert(typeof monthStr === 'string');
    console.assert(years >= 0, years);

    const monthIndex = constants.ALL_MONTHS.indexOf(monthStr)
    console.assert(monthIndex >= 0, monthStr);
    console.assert(monthIndex < 12, monthStr);

    return MonthDate.initFromYearsMonths({years: years, months: monthIndex});
  }

  /**
   * Returns the number of months since epoch.
   */
  monthsSinceEpoch(): number {
    return this.monthsSinceEpoch_;
  }

  /**
   * Returns the year, discarding any extra months.
   */
  year() {
    return Math.floor(this.monthsSinceEpoch_ / 12);
  }

  /**
   * Returns the month index. 0 indicates January, 11 indicates December.
   */
  monthIndex() {
    return this.monthsSinceEpoch_ % 12;
  }

  /**
   * Returns the month name as a 3 character string such as "Jan".
   */
  monthName() {
    return constants.ALL_MONTHS[this.monthsSinceEpoch_ % 12];
  }

  /**
   * Returns the full month name, such as "January".
   */
  monthFullName() {
    return constants.ALL_MONTHS_FULL[this.monthsSinceEpoch_ % 12];
  }

  /**
   * Subtracts one MonthDate from another and returns a MonthDuration.
   */
  subtractDate(other: MonthDate): MonthDuration {
    return new MonthDuration(
        this.monthsSinceEpoch() - other.monthsSinceEpoch());
  }

  /**
   * Subtracts a MonthDuration from a MonthDate and returns a new MonthDate.
   */
  subtractDuration(duration: MonthDuration): MonthDate {
    return new MonthDate(this.monthsSinceEpoch_ - duration.asMonths());
  }

  /**
   * Adds a MonthDuration to a MonthDate and returns a new MonthDate.
   */
  addDuration(duration: MonthDuration): MonthDate {
    return new MonthDate(this.monthsSinceEpoch_ + duration.asMonths());
  }

  /**
   * Returns true if this MonthDate is greater than the other.
   */
  greaterThan(other: MonthDate): boolean {
    return this.monthsSinceEpoch() > other.monthsSinceEpoch();
  }

  /**
   * Returns true if this MonthDate is less than the other.
   */
  lessThan(other: MonthDate): boolean {
    return this.monthsSinceEpoch() < other.monthsSinceEpoch();
  }

  /**
   * Returns true if this MonthDate is less than or equal to the other.
   */
  lessThanOrEqual(other: MonthDate): boolean {
    return this.monthsSinceEpoch() <= other.monthsSinceEpoch();
  }

  /**
   * Returns true if this MonthDate is greater than or equal to the other.
   */
  greaterThanOrEqual(other: MonthDate): boolean {
    return this.monthsSinceEpoch() >= other.monthsSinceEpoch();
  }
}

/**
 * A MonthDuration is a duration of time in months.
 * In social security calculations, days don't really matter for much.
 * Everything is computed on month scales, not days. Days or smaller
 * units of time get in the way, not help. This class provides a Duration type
 * that manages months, without even being aware of days.
 */
export class MonthDuration {
  /**
   * Number of months in this duration.
   */
  private months_: number;

  /**
   * Default constructor
   * @constructor
   */
  constructor(months: number = 0) {
    console.assert(Number.isInteger(months), months);
    this.months_ = months;
  }

  /**
   * Initializer from a number of years and months.
   * Internally just adds the two together after multiplying years by 12.
   */
  static initFromYearsMonths(yearsMonths: YearsMonths): MonthDuration {
    console.assert(Number.isInteger(yearsMonths.months), yearsMonths.months);
    console.assert(
        yearsMonths.months < 12 && yearsMonths.months > -12,
        yearsMonths.months);
    console.assert(Number.isInteger(yearsMonths.years), yearsMonths.years);
    // Negative durations are OK, but shouldn't have both positive and negative.
    console.assert(
        Math.sign(yearsMonths.years) * Math.sign(yearsMonths.months) >= 0,
        (yearsMonths.years + ' ' + yearsMonths.months));
    return new MonthDuration(yearsMonths.years * 12 + yearsMonths.months);
  }

  /**
   * Returns the number of total months. e.g. if the duration is 1y + 1m, this
   * returns 13. May be negative.
   */
  asMonths(): number {
    return this.months_;
  }

  /**
   * Returns the number of whole years, floored.
   */
  years(): number {
    return Math.floor(this.months_ / 12);
  }

  /**
   * Returns the number of months after subtracting whole years. e.g. if the
   * duration is 13 months, this returns 1.
   */
  modMonths(): number {
    return this.months_ % 12;
  }

  /**
   * Returns true if this duration is greater than the other.
   */
  greaterThan(other): boolean {
    return this.asMonths() > other.asMonths();
  }

  /**
   * Returns true if this duration is less than the other.
   */
  lessThan(other): boolean {
    return this.asMonths() < other.asMonths();
  }

  /**
   * Subtracts the other duration from this one and returns a new MonthDuration.
   */
  subtract(other): MonthDuration {
    return new MonthDuration(this.asMonths() - other.asMonths());
  }

  /**
   * Adds the other duration to this one and returns a new MonthDuration.
   */
  add(other): MonthDuration {
    return new MonthDuration(this.asMonths() + other.asMonths());
  }
}

/**
 * Interface for a number of years and months. Prevents errors due to passing
 * the arguments in the opposite order.
 */
interface YearsMonths {
  years: number;
  months: number;
}