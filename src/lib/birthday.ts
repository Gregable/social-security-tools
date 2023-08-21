import {MonthDate, MonthDuration} from './month-time'

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
  private birthdate_: Date;

  /**
   * Creates a new Birthdate object.
   *
   * The parameter is the "lay birthdate", which is the birthdate that is
   * commonly celebrated. It is the date at the moment the person was born.
   * It is very important that this is provided as a UTC date.
   */
  private constructor(layBirthdate: Date = new Date(Date.UTC(1980, 0, 1))) {
    this.birthdate_ = layBirthdate;
  }

  /**
   * Creates a new Birthdate object from a year, month, and day. Note that month
   * is zero indexed. Day is one indexed.
   */
  static FromYMD(year: number, month: number, day: number) {
    return new Birthdate(new Date(Date.UTC(year, month, day)));
  }
  /**
   * Returns true iff the lay birthdate lies on the first of the month,
   * for example Jan 1.
   */
  isFirstOfMonth(): boolean {
    return this.birthdate_.getUTCDate() == 1;
  }

  /**
   * Returns a string version of the user's lay birthdate. e.g. "Jan 1, 2000"
   */
  layBirthdateString(): string {
    // Adjust by the timezone offset because toLocaleDateString() uses local
    // time, not UTC.
    const timeDiff = this.birthdate_.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(this.birthdate_.valueOf() + timeDiff);
    return adjustedDate.toLocaleDateString(
        'en-us', {month: 'short', year: 'numeric', day: 'numeric'});
  }

  /**
   * SSA follows English common law that finds that a person "attains" an age
   * on the day before their birthdate. This function subtracts 1 day from the
   * lay birthdate, and returns the result as a Date object.
   */
  ssaBirthdate(): Date {
    // We subtract 24 hours:
    return new Date(this.birthdate_.getTime() - (24 * 60 * 60 * 1000));
  }

  /**
   * Returns a birthdate to an SSA birthdate. SSA follows English common law
   * that finds that a person "attains" an age on the day before the birthdate.
   * This function subtracts 1 day, and returns the result as a MonthDate.
   */
  ssaBirthMonthDate(): MonthDate {
    const ebd = this.ssaBirthdate();
    return MonthDate.initFromYearsMonths(
        {years: ebd.getUTCFullYear(), months: ebd.getUTCMonth()});
  }

  /** @returns 4 digit number representing the year */
  layBirthYear(): number {
    return this.birthdate_.getUTCFullYear();
  }
  /**
   * @returns Index of the month. January is 0, Feb is 1, and so on.
   */
  layBirthMonth(): number {
    return this.birthdate_.getUTCMonth();
  }
  /** @returns number representing the day of the month (from 1 to 31). */
  layBirthDayOfMonth(): number {
    return this.birthdate_.getUTCDate();
  }

  /**
   * @returns date at a given age, as determined by lay ages.
   */
  dateAtLayAge(age: MonthDuration): MonthDate {
    return MonthDate
        .initFromYearsMonths(
            {years: this.layBirthYear(), months: this.layBirthMonth()})
        .addDuration(age);
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
    return this
        .dateAtSsaAge(
            MonthDuration.initFromYearsMonths({years: yearsOld, months: 0}))
        .year();
  }

  /**
   * @returns the date in the given year that social security considers it
   * the person's birthdate, as well as their age.
   */
  exampleSsaAge(year: number):
      {age: number, day: number, month: string, year: number} {
    var example = {
      'age': year - this.ssaBirthYear(),
      'day': this.ssaBirthdate().getUTCDate(),
      'month': this.ssaBirthMonthDate().monthFullName(),
      'year': year,
    };
    return example;
  }
};
