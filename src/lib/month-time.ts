import * as constants from './constants';

/**
 * In social security calculations, days don't really matter for much.
 * Everything is computed on month scales, not days. Days or smaller
 * units of time get in the way, not help. This class provides a Date type
 * that manages months, without even being aware of days.
 */
export class MonthDate {
  private monthsSinceEpoch_: number;

  /**
   * Default constructor, returns a MonthDate of January, Year 0.
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
   * @param monthStr - 3 character month string from ALL_MONTHS
   */
  static initFromYearsMonthsStr(years: number, monthStr: string): MonthDate {
    console.assert(Number.isInteger(years), years);
    console.assert(typeof monthStr === 'string');
    console.assert(years >= 0, years);

    const monthIndex = constants.ALL_MONTHS.indexOf(monthStr);
    console.assert(monthIndex >= 0, monthStr);
    console.assert(monthIndex < 12, monthStr);

    return MonthDate.initFromYearsMonths({ years: years, months: monthIndex });
  }

  /**
   * Initializes a MonthDate to the current date.
   * @returns A MonthDate initialized to the current date.
   */
  static initFromNow(): MonthDate {
    const now = new Date();
    return MonthDate.initFromYearsMonths({
      years: now.getFullYear(),
      months: now.getMonth(),
    });
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
   * Returns the year as a 2 digit number, e.g. 2000 becomes 0.
   */
  twoDigitYear() {
    const year = this.year();
    return year % 100;
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
      this.monthsSinceEpoch() - other.monthsSinceEpoch()
    );
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

  /**
   * Returns the maximum of two MonthDates.
   */
  static max(a: MonthDate, b: MonthDate): MonthDate {
    return a.greaterThanOrEqual(b) ? a : b;
  }

  /**
   * Returns the minimum of two MonthDates.
   */
  static min(a: MonthDate, b: MonthDate): MonthDate {
    return a.lessThanOrEqual(b) ? a : b;
  }

  /**
   * Returns a new MonthDuration that is this one incremented by 1 month.
   */
  increment() {
    this.monthsSinceEpoch_ += 1;
  }

  /**
   * Returns a new MonthDuration that is this one decremented by 1 month.
   */
  decrement() {
    this.monthsSinceEpoch_ -= 1;
  }

  /**
   * Returns a human readable string version of the date
   */
  toString() {
    return this.monthName() + ' ' + this.year();
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
    this.months_ = months;
  }

  /**
   * Copy initializer.
   */
  static copyFrom(other: MonthDuration): MonthDuration {
    return new MonthDuration(other.months_);
  }

  /**
   * Initializer from a number of years and months.
   * Internally just adds the two together after multiplying years by 12.
   */
  static initFromYearsMonths(yearsMonths: YearsMonths): MonthDuration {
    console.assert(Number.isInteger(yearsMonths.months), yearsMonths.months);
    console.assert(
      yearsMonths.months < 12 && yearsMonths.months > -12,
      yearsMonths.months
    );
    console.assert(Number.isInteger(yearsMonths.years), yearsMonths.years);
    // Negative durations are OK, but shouldn't have both positive and negative.
    console.assert(
      Math.sign(yearsMonths.years) * Math.sign(yearsMonths.months) >= 0,
      yearsMonths.years + ' ' + yearsMonths.months
    );
    return new MonthDuration(yearsMonths.years * 12 + yearsMonths.months);
  }

  /**
   * @returns MonthDuration of exactly 12 months.
   */
  static OneYear() {
    return new MonthDuration(12);
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
  greaterThan(other: MonthDuration): boolean {
    return this.asMonths() > other.asMonths();
  }

  /**
   * Returns true if this duration is greater than or equal to the other.
   */
  greaterThanOrEqual(other: MonthDuration): boolean {
    return this.asMonths() >= other.asMonths();
  }

  /**
   * Returns true if this duration is less than the other.
   */
  lessThan(other: MonthDuration): boolean {
    return this.asMonths() < other.asMonths();
  }

  /**
   * Returns true if this duration is less than or equal to the other.
   */
  lessThanOrEqual(other: MonthDuration): boolean {
    return this.asMonths() <= other.asMonths();
  }

  /**
   * Subtracts the other duration from this one and returns a new MonthDuration.
   */
  subtract(other: MonthDuration): MonthDuration {
    return new MonthDuration(this.asMonths() - other.asMonths());
  }

  /**
   * Adds the other duration to this one and returns a new MonthDuration.
   */
  add(other: MonthDuration): MonthDuration {
    return new MonthDuration(this.asMonths() + other.asMonths());
  }

  /**
   * Returns a new MonthDuration that is this one incremented by 1 month.
   */
  increment() {
    this.months_ += 1;
  }

  /**
   * Returns a new MonthDuration that is this one decremented by 1 month.
   */
  decrement() {
    this.months_ -= 1;
  }

  /**
   * Formats this duration for display with full precision (years + months).
   *
   * Used in tooltips and detailed displays where the exact monthly
   * duration is important.
   *
   * @returns The duration formatted as "years+months" (e.g., "65+6")
   *   or just "years" if months is 0
   */
  toDisplayString(): string {
    const years = this.years();
    const months = this.modMonths();
    if (months === 0) {
      return `${years}`;
    } else {
      return `${years}+${months}`;
    }
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
