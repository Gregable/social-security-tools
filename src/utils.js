/**
 * In social security calculations, days don't really matter for much.
 * Everything is computed on month scales, not days. Days or smaller
 * units of time get in the way, not help. This class provides a Date type
 * that manages months, without even being aware of days.
 */
class MonthDate {
  // Default constructor, returns a MonthDate of January, Year 0. Use the
  // various initFrom methods to construct different MonthDates.
  constructor() {
    // Internally a MonthDate tracks time from January, Year 0 and counts
    // months from this date. Jan is considered month 0 of the year, and Dec
    // is month 11. So, an internal value of 12 would be January, Year 1.
    this.monthsSinceEpoch_ = 0;
  }

  /* @param {MonthDate} monthDate (copy initializer) */
  initFromMonthDate(monthDate) {
    this.monthsSinceEpoch_ = monthDate.monthsSinceEpoch_;
    return this;
  }

  /* @param {number} monthsSinceEpoch integer months since Jan, Year 0 */
  initFromMonths(monthsSinceEpoch) {
    console.assert(Number.isInteger(monthsSinceEpoch), monthsSinceEpoch);
    console.assert(monthsSinceEpoch >= 0, monthsSinceEpoch);
    this.monthsSinceEpoch_ = monthsSinceEpoch;
    return this;
  }
 
  /*
   * Initializer from a date. So (2000, 0) would be Jan, 2000.
   * @param {number} years
   * @param {number} months
   */
  initFromYearsMonths(years, months) {
    console.assert(Number.isInteger(years), years);
    console.assert(Number.isInteger(months), months);
    console.assert(years >= 0, years);
    console.assert(months >= 0, months);
    console.assert(months < 12, months);
    this.initFromMonths(years * 12 + months);
    return this;
  }

  /*
   * Initializer from a date with string month. Ex: (2000, "Jan").
   * @param {number} years
   * @param {string} monthStr
   */
  initFromYearsMonthsStr(years, monthStr) {
    console.assert(Number.isInteger(years), years);
    console.assert(typeof monthStr === 'string');
    console.assert(years >= 0, years);
    var monthIndex = ALL_MONTHS.indexOf(monthStr)
    console.assert(monthIndex >= 0, monthStr);
    console.assert(monthIndex < 12, monthStr);

    this.initFromYearsMonths(years, monthIndex);
    return this;
  }

  /*
   * Returns the number of months since epoch.
   * @return {number}
   */
  monthsSinceEpoch() {
    return this.monthsSinceEpoch_;
  }

  /*
   * Returns the year, discarding any extra months.
   * @return {number}
   */
  year() {
    return Math.floor(this.monthsSinceEpoch_ / 12);
  }

  /*
   * Returns the month index. 0 indicates January, 11 indicates December.
   * @return {number}
   */
  monthIndex() {
    return this.monthsSinceEpoch_ % 12;
  }

  /*
   * Returns the month name as a 3 character string such as "Jan".
   * @return {number}
   */
  monthName() {
    return ALL_MONTHS[this.monthsSinceEpoch_ % 12];
  }

  /*
   * @param {monthDate} other
   * @return {MonthDuration}
   */
  subtractDate(other) {
    return new MonthDuration().initFromMonths(
        this.monthsSinceEpoch() - other.monthsSinceEpoch());
  }

  /*
   * @param {MonthDuration} duration
   * @return {MonthDate}
   */
  subtractDuration(duration) {
    return new MonthDate().initFromMonths(
        this.monthsSinceEpoch_ - duration.asMonths());
  }

  /*
   * @param {MonthDuration} duration
   * @return {MonthDate}
   */
  addDuration(duration) {
    return new MonthDate().initFromMonths(
        this.monthsSinceEpoch_ + duration.asMonths());
  }

  /*
   * @param {MonthDate} other
   * @return {boolean}
   */
  greaterThan(other) {
    return this.monthsSinceEpoch() > other.monthsSinceEpoch();
  }

  /*
   * @param {MonthDate} other
   * @return {boolean}
   */
  lessThan(other) {
    return this.monthsSinceEpoch() < other.monthsSinceEpoch();
  }

  /*
   * @param {MonthDate} other
   * @return {boolean}
   */
  lessThanOrEqual(other) {
    return this.monthsSinceEpoch() <= other.monthsSinceEpoch();
  }

  /*
   * @param {MonthDate} other
   * @return {boolean}
   */
  greaterThanOrEqual(other) {
    return this.monthsSinceEpoch() >= other.monthsSinceEpoch();
  }

}

/**
 * In social security calculations, days don't really matter for much.
 * Everything is computed on month scales, not days. Days or smaller
 * units of time get in the way, not help. This class provides a Duration type
 * that manages months, without even being aware of days.
 */
class MonthDuration {
  // Default constructor, returns a MonthDuration of 0 months. Use the various
  // initFrom methods to construct different MonthDurations.
  constructor() {
    this.months_ = 0;
  }

  /* @param {number} months */
  initFromMonths(months) {
    console.assert(Number.isInteger(months), months);
    this.months_ = months;
    return this;
  }

  /* @param {number} years */
  /* @param {number} months */
  initFromYearsMonths(years, months) {
    console.assert(Number.isInteger(months), months);
    console.assert(months < 12 && months > -12, months);
    console.assert(Number.isInteger(years), years);
    // Negative durations are OK, but shouldn't have both positive and negative.
    console.assert(Math.sign(years) * Math.sign(months) >= 0, (years, months));
    this.months_ = years * 12 + months;
    return this;
  }

  /*
   * Returns the number of total months. If the duration is 1y + 1m, this
   * returns 13. May be negative.
   * @return {number}
   */
  asMonths() {
    return this.months_;
  }

  /*
   * Returns the number of whole years, floored.
   * @return {number}
   */
  years() {
    return Math.floor(this.months_ / 12);
  }

  /*
   * Returns the number of months after subtracting whole years. If the
   * duration is 13 months, this returns 1.
   * @return {number}
   */
  modMonths() {
    return this.months_ % 12;
  }

  /*
   * @param {MonthDuration} other
   * @return {boolean}
   */
  greaterThan(other) {
    return this.asMonths() > other.asMonths();
  }

  /*
   * @param {MonthDuration} other
   * @return {boolean}
   */
  lessThan(other) {
    return this.asMonths() < other.asMonths();
  }

  /*
   * @param {MonthDuration} other
   * @return {MonthDuration}
   */
  subtract(other) {
    return new MonthDuration().initFromMonths(
        this.asMonths() - other.asMonths());
  }

  /*
   * @param {MonthDuration} other
   * @return {MonthDuration}
   */
  add(other) {
    return new MonthDuration().initFromMonths(
        this.asMonths() + other.asMonths());
  }
}

/**
 * Converts a number to a string such as 1200 to '1,200'.
 * @param {number} num
 * @return {string}
 */
function insertNumericalCommas(num) {
 return num.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}

/**
 * Returns the ratio of the average wage in indexingYear to the
 * average wage in 1977.
 * @param {number} indexingYear year for which index values are used
 * @return {number} wage ratio
 */
function wageRatioInYear(indexingYear) {
  const wage_in_1977 = WAGE_INDICES[1977];
  const wage = WAGE_INDICES[indexingYear];
  return wage / wage_in_1977;
}

/**
 * Returns the first monthly bend point in the PIA formula.
 * @param {number} indexingYear year for which index values are used
 * @return {number} first annual bend point dollar amount
 */
function firstBendPoint(indexingYear) {
  return Math.round(BENDPOINT1_IN_1977 * wageRatioInYear(indexingYear));
}

/**
 * Returns the second monthly bend point in the PIA formula.
 * @param {indexingYear} year for which index values are used
 * @return {number} first annual bend point dollar amount
 */
function secondBendPoint(indexingYear) {
  return Math.round(BENDPOINT2_IN_1977 * wageRatioInYear(indexingYear));
}

/**
 * Returns the PIA component for a specific breakpoint bracket for any
 * monthly indexed earnings.
 * @param {indexingYear} year for which index values are used
 * @param {number} earnings monthly indexed earnings to compute
 * @param {number} bracket Must be 0, 1 or 2
 * @return {number} benefit in that bracket for this earnings.
 */
function primaryInsuranceAmountForEarningsByBracket(
    indexingYear, earnings, bracket) {
  earnings = Math.round(earnings);
  var firstBend = firstBendPoint(indexingYear);
  var secondBend = secondBendPoint(indexingYear);

  if (bracket === 0) {
    return Math.min(earnings, firstBend) * BEFORE_BENDPOINT1_MULTIPLIER;
  } else if (bracket === 1) {
    return (
        Math.max(0, (Math.min(earnings, secondBend) - firstBend)) *
        BEFORE_BENDPOINT2_MULTIPLIER);
  } else if (bracket === 2) {
    return Math.max(0, earnings - secondBend) * AFTER_BENDPOINT2_MULTIPLIER;
  }

  return -1;
};

/**
 * Returns the total monthly full benefit summed across all benefit brackets,
 * not adjusted for cost of living.
 * @param {indexingYear} year for which index values are used
 * @param {number} earnings monthly indexed earnings to compute
 * @return {number} annual benefit across all benefit brackets.
 */
function primaryInsuranceAmountForEarningsUnadjusted(indexingYear, earnings) {
  var sum = 0;
  for (var i = 0; i < 3; ++i)
    sum += primaryInsuranceAmountForEarningsByBracket(
        indexingYear, earnings, i);
  // Primary Insurance amounts are always rounded down the the nearest dime.
  // Who decided this was an important step?
  return Math.floor(sum * 10) / 10;
};

/**
 * Returns the set of years for which the primary insurance amount needs
 * to be adjusted by COLA values.
 * @param {number} yearTurn62
 * @return {Array<number>}
 */
function colaAdjustmentYears(yearTurn62) {
  var adjustmentYears = [];
  for (var year = yearTurn62; year < CURRENT_YEAR; ++year)
    adjustmentYears.push(year);
  return adjustmentYears;
}

/**
 * Returns the final COLA adjusted primary insurance amount.
 * @param {number} yearTurn62
 * @param {number} initialPIA
 * @return {number}
 */
function colaAdjustment(yearTurn62, initialPIA) {
  var adjustedPIA = initialPIA;
  for (var year of colaAdjustmentYears(yearTurn62)) {
    if (COLA[year] !== undefined) {
      adjustedPIA = adjustedPIA * (1 + (COLA[year] / 100.0));
      // Primary Insurance amounts are always rounded down the the nearest dime.
      adjustedPIA = Math.floor(adjustedPIA * 10) / 10;
    }
  }
  return adjustedPIA;
}

/**
 * Returns the primary insurance amount (monthly benefit) summed across all
 * benefit brackets and adjusted for COLA increases (if any).
 * @param {indexingYear} year for which index values are used
 * @param {number} yearTurn62
 * @param {number} earnings monthly indexed earnings to compute
 * @return {number} primary insurance amount
 */
function primaryInsuranceAmountForEarnings(indexingYear, yearTurn62, earnings) {
  return colaAdjustment(yearTurn62, 
      primaryInsuranceAmountForEarningsUnadjusted(indexingYear, earnings));
};
