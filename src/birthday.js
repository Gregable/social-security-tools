/**
 * User birthdays in social security have some unique properties. We manage
 * them with instances of this class.
 */
class Birthday {
  constructor() {
    // Internally a Birthday tracks time from January 1, Year 0.
    this.birthdate_ = new Date(1980, 0, 1);
  }

  // A lay birthdate is the birthdate that is commonly celebrated. It is the
  // date at the moment the person was born. It is computed differently by the
  // Social Security Administration.
  initFromLayBirthdate(year, month, day) {
    this.birthdate_ = new Date(year, month, day);
    return this;
  }
  initFromLayDateObj(dateObj) {
    this.birthdate_ = dateObj;
    return this;
  }

  /**
   * SSA follows English common law that finds that a person "attains" an age
   * on the day before their birthday. This function subtracts 1 day.
   */
  englishBirthdate() {
    // We subtract 12 hours. 24 or 1 could get into trouble with daylight
    // savings time changes. Why doesn't javascript have better date libraries?
    return new Date(this.birthdate_.getTime() - (12 * 60 * 60 * 1000));
  }

  /**
   * Returns a birthdate to an SSA birthdate. SSA follows English common law
   * that finds that a person "attains" an age on the day before the birthday.
   * This function subtracts 1 day, and returns the result as a MontDate.
   */
  ssaBirthDate() {
    const ebd = this.englishBirthdate();
    return new MonthDate().initFromYearsMonths(
        ebd.getFullYear(), ebd.getMonth());
  }

  // Returns a 4 digit number representing the year
  layBirthYear() {
    return this.birthdate_.getFullYear();
  }
  // Returns a number representing the month. January is 0, Feb is 1, and so on.
  layBirthMonth() {
    return this.birthdate_.getMonth();
  }
  // Returns a number representing the day of the month (from 1 to 31).
  layBirthDayOfMonth() {
    return this.birthdate_.getDate();
  }

  // Returns a 4 digit number representing the year
  ssaBirthYear() {
    return this.ssaBirthDate().year();
  }
  // Returns a number representing the month. January is 0, Feb is 1, and so on.
  ssaBirthMonth() {
    return this.ssaBirthDate().monthIndex();
  }

  /**
   * This returns the date in the given year that social security considers it
   * the person's birthdate, as well as their age.
   */
  exampleSsaAge(year) {
		if (year === undefined)
      year = CURRENT_YEAR;
    var example = {
      'age': year - this.ssaBirthYear(),
      'day': this.englishBirthdate().getDate(),
      'month': this.ssaBirthDate().monthFullName(),
      'year': year
    };
    return example;
  }
};
