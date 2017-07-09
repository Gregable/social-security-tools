/**
 * Given a month name, returns the 0-based index of that month.
 * @param {string} monthName
 * @return {number}
 */
function monthIndex(monthName) {
  for (var i = 0; i < ALL_MONTHS.length; ++i)
    if (monthName === ALL_MONTHS[i])
      return i;
  return -100000; 
}

/**
 * Simple function to compute the number of months in a year, months pair.
 * @param {number} years
 * @param {number} months
 * @return {number}
 */
function monthsIn(years, months) {
  return years * 12 + months;
}

/**
 * Returns the ratio of the average wage in indexingYear to the
 * average wage in 1977.
 * @param {indexingYear} year for which index values are used
 * @return {number} wage ratio
 */
function wageRatioInYear(indexingYear) {
  const wage_in_1977 = WAGE_INDICES[1977];
  const wage = WAGE_INDICES[indexingYear];
  return wage / wage_in_1977;
}

/**
 * Returns the first monthly bend point in the PIA formula.
 * @param {indexingYear} year for which index values are used
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
 * @return {Array<number>}
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
