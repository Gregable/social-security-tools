import { MonthDate, MonthDuration } from './month-time';

/**
 * This class represents a person's birthdate.
 *
 * Most people's understanding of the birthday is the date on which a person was
 * born. We describe this as a "lay" birthday. However, the Social Security
 * Administration (SSA) follows English law that a person "attains" an age on
 * the day before their birthdate. This is because the law is written in terms
 * of "full years", and a person is not considered to have a full year until the
 * day before their birthday.
 *
 * This class stores the lay birthdate, and provides functions to convert to
 * the SSA birthdate.
 *
 * All dates should be considered UTC, and care should be taken, since
 * Javascript likes to use local time converssions in many cases.
 */
export class Birthdate {
  /**
   * Birthdate is stored internally as a Date object. We don't expose Date
   * objects as part of the API though, because of the UTC issues.
   */
  private layBirthdate_: Date;

  /**
   * Same as birthdate_, but as a MonthDate object.
   */
  private layBirthMonthDate_: MonthDate;

  /**
   * SSA follows English common law that finds that a person "attains" an age
   * on the day before their birthdate.
   */
  private ssaBirthdate_: Date;

  /**
   * Same as ssaBirthdate_, but as a MonthDate object.
   */
  private ssaBirthMonthDate_: MonthDate;

  /**
   * Creates a new Birthdate object.
   *
   * The parameter is the "lay birthdate", which is the birthdate that is
   * commonly celebrated. It is the date at the moment the person was born.
   * It is very important that this is provided as a UTC date.
   */
  constructor(layBirthdate: Date = new Date(Date.UTC(1980, 0, 1))) {
    this.layBirthdate_ = layBirthdate;
    this.layBirthMonthDate_ = MonthDate.initFromYearsMonths({
      years: this.layBirthdate_.getUTCFullYear(),
      months: this.layBirthdate_.getUTCMonth(),
    });

    // Subtract 24 hours to get the common law date:
    this.ssaBirthdate_ = new Date(
      this.layBirthdate_.getTime() - 24 * 60 * 60 * 1000
    );
    this.ssaBirthMonthDate_ = MonthDate.initFromYearsMonths({
      years: this.ssaBirthdate_.getUTCFullYear(),
      months: this.ssaBirthdate_.getUTCMonth(),
    });
  }

  /**
   * Creates a new Birthdate object from a year, month, and day. Note that month
   * is zero indexed. Day is one indexed.
   */
  static FromYMD(year: number, month: number, day: number) {
    if (year < 1900 || year > 2200) throw new Error(`Invalid Year:${year}`);
    if (month < 0 || month > 11) throw new Error(`Invalid Month:${month}`);
    if (day < 1 || day > 31) throw new Error(`Invalid Day:${day}`);
    return new Birthdate(new Date(Date.UTC(year, month, day)));
  }

  /**
   * Returns the lay birthdate.
   */
  layBirthdate(): Date {
    return this.layBirthdate_;
  }

  /**
   * Returns a string version of the user's lay birthdate. e.g. "Jan 1, 2000"
   */
  layBirthdateString(): string {
    // Adjust by the timezone offset because toLocaleDateString() uses local
    // time, not UTC.
    const timeDiff = this.layBirthdate_.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(this.layBirthdate_.valueOf() + timeDiff);
    return adjustedDate.toLocaleDateString('en-us', {
      month: 'short',
      year: 'numeric',
      day: 'numeric',
    });
  }

  /**
   * Returns true iff the lay birthdate lies on the first of the month,
   * for example Jan 1.
   */
  isFirstOfMonth(): boolean {
    return this.layBirthdate_.getUTCDate() === 1;
  }

  /**
   * SSA follows English common law that finds that a person "attains" an age
   * on the day before their birthdate.
   */
  ssaBirthdate(): Date {
    return this.ssaBirthdate_;
  }

  /**
   * Returns a birthdate to an SSA birthdate. SSA follows English common law
   * that finds that a person "attains" an age on the day before the birthdate.
   * This function subtracts 1 day, and returns the result as a MonthDate.
   */
  ssaBirthMonthDate(): MonthDate {
    return this.ssaBirthMonthDate_;
  }

  /** @returns 4 digit number representing the year */
  layBirthYear(): number {
    return this.layBirthdate_.getUTCFullYear();
  }
  /**
   * @returns Index of the month. January is 0, Feb is 1, and so on.
   */
  layBirthMonth(): number {
    return this.layBirthdate_.getUTCMonth();
  }
  /** @returns number representing the day of the month (from 1 to 31). */
  layBirthDayOfMonth(): number {
    return this.layBirthdate_.getUTCDate();
  }

  /**
   * @returns date at a given age, as determined by lay ages.
   */
  dateAtLayAge(age: MonthDuration): MonthDate {
    return this.layBirthMonthDate_.addDuration(age);
  }

  /**
   * @returns 4 digit number representing the year
   */
  ssaBirthYear(): number {
    return this.ssaBirthMonthDate().year();
  }

  /**
   * @returns Index of the month. January is 0, Feb is 1, and so on.
   */
  ssaBirthMonth(): number {
    return this.ssaBirthMonthDate().monthIndex();
  }

  /**
   * @returns date at a given age, as determined by the SSA ages.
   */
  dateAtSsaAge(age: MonthDuration): MonthDate {
    return this.ssaBirthMonthDate().addDuration(age);
  }

  /**
   * @returns age at a given date, as determined by the SSA ages.
   */
  ageAtSsaDate(date: MonthDate): MonthDuration {
    return date.subtractDate(this.ssaBirthMonthDate());
  }

  /**
   * Convenient version of dateAtSsaAge that operates on years only.
   *
   * @returns year in which the recipient turns the given age, as determined by
   *     SSA ages.
   */
  yearTurningSsaAge(yearsOld: number): number {
    return this.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: yearsOld, months: 0 })
    ).year();
  }

  /**
   * Returns the earliest filing month for the given birthdate. Does not take
   * into account PIA.
   *
   * @returns the earliest filing month for the given birthdate.
   */
  earliestFilingMonth(): MonthDuration {
    const month = MonthDuration.initFromYearsMonths({ years: 62, months: 0 });
    if (this.layBirthDayOfMonth() > 2) {
      month.increment();
    }
    return month;
  }

  /**
   * Computes the person's current lay age in whole years at the given date.
   * If no date is supplied, the current system date (now) is used. This is
   * the commonly understood age: it increments on the lay birthday. All
   * calculations are performed in UTC to avoid daylight savings issues.
   *
   * For example, someone born Feb 2, 2000 has age:
   *  - 24 on Feb 1, 2025
   *  - 25 on Feb 2, 2025 and after (until Feb 1, 2026)
   */
  currentAge(asOf: Date = new Date()): number {
    const yearDiff = asOf.getUTCFullYear() - this.layBirthYear();
    const asOfMonth = asOf.getUTCMonth();
    const asOfDay = asOf.getUTCDate();
    const bMonth = this.layBirthMonth();
    const bDay = this.layBirthDayOfMonth();
    // If current month precedes birth month, or it's the birth month but the
    // day has not yet arrived, subtract one year.
    if (asOfMonth < bMonth || (asOfMonth === bMonth && asOfDay < bDay)) {
      return yearDiff - 1;
    }
    return yearDiff;
  }

  /**
   * @returns the date in the given year that social security considers it
   * the person's birthdate, as well as their age.
   */
  exampleSsaAge(year: number): {
    age: number;
    day: number;
    month: string;
    year: number;
  } {
    var example = {
      age: year - this.ssaBirthYear(),
      day: this.ssaBirthdate().getUTCDate(),
      month: this.ssaBirthMonthDate().monthFullName(),
      year: year,
    };
    return example;
  }
}
