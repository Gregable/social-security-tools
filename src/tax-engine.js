/**
 * A TaxRecord represents one year of Social Security tax data.
 * @constructor
 */
function TaxRecord() {
  this.year = -1;
  this.taxedEarnings = -1;
  this.taxedMedicareEarnings = -1;

  this.earningsCap = -1;
  this.indexFactor = -1;
  this.isTopEarningsYear = null;
}
      
/**
 * Computes the indexed earnings for this tax record.
 * @return {number}
 */
TaxRecord.prototype.indexedEarning = function() {
  var cappedEarning = Math.min(this.earningsCap, this.taxedEarnings);
  return Math.round(100 * cappedEarning * this.indexFactor) / 100;
};

/**
 * A TaxEngine object manages calculating a user's SSA and IRS data.
 * @constructor
 */
function TaxEngine() {
  this.initialized_ = false;
  this.earningsRecords = [];
  this.cutoffIndexedEarnings = 0;
  this.totalIndexedEarnings = 0;
  this.monthlyIndexedEarnings = 0;
  this.futureEarningsYears = 0;
  this.futureEarningsWage = 0;

  this.birthDate = {year: 1970, month: 'Jan'};
  this.fullRetirement = FULL_RETIREMENT_AGE[FULL_RETIREMENT_AGE.length - 1];
}

/**
 * Returns true if the TaxEngine has been initialized from earnings records.
 * @return {boolean}
 */
TaxEngine.prototype.isInitialized = function() {
  return this.initialized_;
};

/**
 * Initializes our data from an array of earning records data.
 * Data should be in the form:
 * [ { 
 *     year: 1960,
 *     taxedEarnings: 19123,
 *     taxedMedicareEarnings: 19123,
 *    },
 *    ...
 * ]
 * Data should already be sorted by year ascending.
 *
 * @param {!Array[!Object]} earningsRecords
 */
TaxEngine.prototype.initFromEarningsRecords = function(earningsRecords) {
  this.earningsRecords = earningsRecords;
  this.processIndexedEarnings_();
  this.initialized_ = true;
};

TaxEngine.prototype.simulateFutureEarningsYears = function(numYears, wage) {
  this.futureEarningsYears = numYears;
  this.futureEarningsWage = wage;
  this.processIndexedEarnings_();
};

/**
 * Given a month name, returns the 0-based index of that month.
 * @param {string} monthName ex: "Oct"
 * @return {number} ex: 10
 */
TaxEngine.prototype.monthIndex = function(monthName) {
  var birthMonthIndex = 0;
  for (var i = 0; i < ALL_MONTHS.length; ++i)
    if (monthName === ALL_MONTHS[i])
      return i;
  return -100000; 
}

TaxEngine.prototype.updateBirthdate = function(birthdate) {
  // Determine if the previous birthdate placed the user as over 60 this year.
  var wasOver60 = (this.birthDate.year < (CURRENT_YEAR - 60));
  // Same calculation for the new birthdate
  var isOver60 = (birthdate.year < (CURRENT_YEAR - 60));

  this.birthDate.year = birthdate.year;
  this.birthDate.month = birthdate.month;

  for (var i = 0; i < FULL_RETIREMENT_AGE.length; ++i) {
    var ageBracket = FULL_RETIREMENT_AGE[i];
    if (this.birthDate.year >= ageBracket.minYear &&
        this.birthDate.year <= ageBracket.maxYear) {
      this.fullRetirement = ageBracket;
    }
  }
  var birthMonthIndex = this.monthIndex(this.birthDate.month);
  var retirementYear = (
      parseInt(this.birthDate.year) +
      this.fullRetirement.ageYears + 
      Math.floor((birthMonthIndex + this.fullRetirement.ageMonths) / 12));
  var retirementMonth = (
      (birthMonthIndex + this.fullRetirement.ageMonths) % 12);

  this.fullRetirementDate = {
    month: ALL_MONTHS[retirementMonth],
    monthIdx: retirementMonth,
    year: retirementYear
  };

  // If the earnings were previously adjusted for over 60 or they are now
  // being adjusted for over 60, then adjust the earnings again since this
  // can affect the calculation.
  if (wasOver60 || isOver60)
    this.processIndexedEarnings_();
}

TaxEngine.prototype.isOver60 = function() {
  return this.birthDate.year < (CURRENT_YEAR - 60);
}

// From https://www.ssa.gov/oact/cola/piaformula.html, the PIA calculation
// depends on the year at which an individual first becomes eligible for
// benefits, (when they turn 62). The computation is based on the wage
// index from two years prior. If the user is not yet 62, we use the
// most up to date bend points, which are for the current year.
TaxEngine.prototype.indexingYear = function() {  
  return Math.min(this.dateAtAge(62, 0).year, CURRENT_YEAR) - 2;
}

/**
 * For each earnings record, match up the year with the MAXIMUM_EARNINGS
 * and WAGE_INDICES data, compute indexed earnings for that record, adding it
 * to the record.
 * @private
 */
TaxEngine.prototype.processIndexedEarnings_ = function() {
  var allIndexedValues = [];
  for (var i = 0; i < this.earningsRecords.length; ++i) {
    var earningRecord = this.earningsRecords[i];

    earningRecord.earningsCap = MAXIMUM_EARNINGS[earningRecord.year];

    // https://www.ssa.gov/oact/ProgData/retirebenefit1.html
    // Starting in the year the user turns 60, their index factor
    // is always 1.0, regardless of the index factor from the table.
    if ((earningRecord.year - this.birthDate.year) >= 60) {
      earningRecord.indexFactor = 1.0;
    // Otherwise the index factor for a prior year Y is the result of
    // dividing the average wage index for the year in which the person
    // attains age 60 by the average age index for year Y.
    } else if (WAGE_INDICES[earningRecord.year] === undefined) {
        earningRecord.indexFactor = 1.0;
    } else {
      earningRecord.indexFactor = (WAGE_INDICES[this.indexingYear()] /
          WAGE_INDICES[earningRecord.year]);
    }
    
    if (earningRecord.taxedEarnings !== -1)
      allIndexedValues.push(earningRecord.indexedEarning());
  }
  if (this.futureEarningsWage > 0) {
    for (var i = 0; i < this.futureEarningsYears; ++i) {
      allIndexedValues.push(this.futureEarningsWage);
    }
  }

  // Reverse sort the indexed values. Yay javascript, sorting numbers
  // alphabetically!
  allIndexedValues.sort(function(a, b) {return a-b});
  allIndexedValues.reverse();

  // Your top N values are the only ones that 'count'. Compute the cutoff
  // value below which earnings don't count.
  // TODO: Right now if there is a tie for the cutoff, we show all tied
  // elements as a Top N value, leading to a situation where we could show
  // more than N top-N values.
  if (allIndexedValues.length < SSA_EARNINGS_YEARS) {
    this.cutoffIndexedEarnings = 0;
  } else {
    this.cutoffIndexedEarnings = allIndexedValues[SSA_EARNINGS_YEARS - 1];
  }

  for (var i = 0; i < this.earningsRecords.length; ++i) {
    var earningRecord = this.earningsRecords[i];
    if (earningRecord.indexedEarning() >= this.cutoffIndexedEarnings &&
        earningRecord.taxedEarnings > 0) {
      earningRecord.isTopEarningYear = true;
    } else {
      earningRecord.isTopEarningYear = false;
    }
  }


  // Total indexed earnings is the sum of your top 35 indexed earnings.
  this.totalIndexedEarnings = 0;
  for (var i = 0; i < allIndexedValues.length && i < SSA_EARNINGS_YEARS; ++i) {
    this.totalIndexedEarnings += allIndexedValues[i];
  }

  // SSA floors the monthly indexed earnings value. This floored value
  // is the basis for all following calculations. So, if you want to consider
  // your anual insurance amount, it's computed based on monthly values, ie:
  // 12 * floor(totalIndexedEarnings / 12)
  this.monthlyIndexedEarnings =
    Math.floor(this.totalIndexedEarnings / 12 / SSA_EARNINGS_YEARS);
};


/**
 * Returns the number of years for which we have earnings records.
 * @return {number}
 */
TaxEngine.prototype.numEarningsYears = function() {
  var nonNegativeRecords = 0;
  for (var i = 0; i < this.earningsRecords.length; ++i) {
    if (this.earningsRecords[i].taxedEarnings >= 0)
      nonNegativeRecords += 1;
  }
  
  if (this.futureEarningsWage > 0)
    return nonNegativeRecords + this.futureEarningsYears;
  else
    return nonNegativeRecords;

};

/**
 * Returns the average yearly indexed earnings.
 * @return {number}
 */
TaxEngine.prototype.yearlyIndexedEarnings = function() {
  // This is computed as your total indexed earnings divided by the number of
  // years you earned them in.
  return this.totalIndexedEarnings / SSA_EARNINGS_YEARS;
};

/**
 * Returns the first monthly bend point in the PIA formula.
 * @return {number} first annual bend point dollar amount
 */
TaxEngine.prototype.firstBendPoint = function() {
  const wage_in_1977 = WAGE_INDICES[1977]; 
  const wage = WAGE_INDICES[this.indexingYear()];
  const multiplier = wage / wage_in_1977;
  return Math.round(BENDPOINT1_IN_1977 * multiplier);
}

/**
 * Returns the second monthly bend point in the PIA formula.
 * @return {number} second annual bend point dollar amount
 */
TaxEngine.prototype.secondBendPoint = function() {
  const wage_in_1977 = WAGE_INDICES[1977];
  const wage = WAGE_INDICES[this.indexingYear()];
  const multiplier = wage / wage_in_1977;
  return Math.round(BENDPOINT2_IN_1977 * multiplier);
}

/**
 * Returns the PIA component for a specific breakpoint bracket for any
 * monthly indexed earnings.
 * @param {number} earnings monthly indexed earnings to compute
 * @param {number} bracket Must be 0, 1 or 2
 * @return {number} benefit in that bracket for this earnings.
 */
TaxEngine.prototype.primaryInsuranceAmountForEarningsByBracket =
    function(earnings, bracket) {
  earnings = Math.round(earnings);
  if (bracket === 0) {
    return (Math.min(earnings, this.firstBendPoint()) *
      BEFORE_BENDPOINT1_MULTIPLIER);
  } else if (bracket === 1) {
    return (
        Math.max(0, (
            Math.min(earnings, this.secondBendPoint()) -
            this.firstBendPoint())) *
        BEFORE_BENDPOINT2_MULTIPLIER);
  } else if (bracket === 2) {
    return Math.max(0, earnings - this.secondBendPoint()) *
      AFTER_BENDPOINT2_MULTIPLIER;
  }
  return -1;
};

/**
 * Returns the total monthly full benefit summed across all benefit brackets,
 * not adjusted for cost of living.
 * @param {number} earnings monthly indexed earnings to compute
 * @return {number} annual benefit across all benefit brackets.
 */
TaxEngine.prototype.primaryInsuranceAmountForEarningsUnadjusted =
    function(earnings) {
  var sum = 0;
  for (var i = 0; i < 3; ++i)
    sum += this.primaryInsuranceAmountForEarningsByBracket(earnings, i);
  // Primary Insurance amounts are always rounded down the the nearest dime.
  // Who decided this was an important step?
  return Math.floor(sum * 10) / 10;
};

/**
 * Returns the PIA component a specific breakpoint bracket for this
 * user's monthly indexed earnings.
 * @param {number} bracket Must be 0, 1, or 2
 * @return {number} benefit in that bracket.
 */
TaxEngine.prototype.primaryInsuranceAmountByBracket = function(bracket) {
  return this.primaryInsuranceAmountForEarningsByBracket(
      this.monthlyIndexedEarnings, bracket);
};

/**
 * Returns the primary insurance amount (monthly benefit) summed across all
 * benefit brackets, but not adjusted for COLA increases.
 * @return {number} unadjusted primary insurance amount
 */
TaxEngine.prototype.primaryInsuranceAmountUnadjusted = function() {
  return this.primaryInsuranceAmountForEarningsUnadjusted(
      this.monthlyIndexedEarnings);
}

/**
 * Returns the set of years for which the primary insurance amount needs
 * to be adjusted by COLA values.
 * @return {Array<number>}
 */
TaxEngine.prototype.colaAdjustmentYears = function() {
  var adjustmentYears = [];
  for (var year = this.dateAtAge(62, 0).year; year < CURRENT_YEAR; ++year)
    adjustmentYears.push(year);
  return adjustmentYears;
}

/**
 * Returns an array of adjustments to be displayed to the user. Each record
 * has the year, the adjustment rate, and the starting/ending values.
 * @return {Array<Object>}
 */
TaxEngine.prototype.colaAdjustments = function() {
  const years = this.colaAdjustmentYears();
  var adjusted = this.primaryInsuranceAmountUnadjusted();

  if (this.adjustments_ !== undefined) {
    if (this.adjustments_.length === 0 && years.length === 0)
     return this.adjustments_;
    if (this.adjustments_.length > 0 && this.adjustments_[0].start === adjusted)
     return this.adjustments_;
  }

  this.adjustments_ = [];
  for (var year of this.colaAdjustmentYears()) {
    if (COLA[year] !== undefined) {
      var newadjusted = adjusted * (1 + (COLA[year] / 100.0));
      // Primary Insurance amounts are always rounded down the the nearest dime.
      newadjusted = Math.floor(newadjusted * 10) / 10;

      this.adjustments_.push(
          {
            'year': year,
            'cola': COLA[year],
            'start': adjusted,
            'end': newadjusted,
          });

      adjusted = newadjusted;
    }
  }
  return this.adjustments_;
}

/**
 * Returns the primary insurance amount (monthly benefit) summed across all
 * benefit brackets and adjusted for COLA increases (if any).
 * @return {number} primary insurance amount
 */
TaxEngine.prototype.primaryInsuranceAmount = function() {
  var colaAdjustment = 1.0;
  var adjusted = this.primaryInsuranceAmountUnadjusted();
  for (var year of this.colaAdjustmentYears()) {
    if (COLA[year] !== undefined) {
      adjusted = adjusted * (1 + (COLA[year] / 100.0));
      // Primary Insurance amounts are always rounded down the the nearest dime.
      adjusted = Math.floor(adjusted * 10) / 10;
    }
  }
  return adjusted;
};

/**
 * Returns the primary insurance amount (monthly benefit) summed across all
 * benefit brackets and adjusted for COLA increases (if any).
 * @param {number} earnings monthly indexed earnings to compute
 * @return {number} primary insurance amount
 */
TaxEngine.prototype.primaryInsuranceAmountForEarnings = function(earnings) {
  var colaAdjustment = 1.0;
  var adjusted = this.primaryInsuranceAmountForEarningsUnadjusted(earnings);
  for (var year of this.colaAdjustmentYears()) {
    if (COLA[year] !== undefined) {
      adjusted = adjusted * (1 + (COLA[year] / 100.0));
      // Primary Insurance amounts are always rounded down the the nearest dime.
      adjusted = Math.floor(adjusted * 10) / 10;
    }
  }
  return adjusted;
};

/**
 * Returns the primary insurance amount floored. This is the actual payment
 * amount if paid out.
 * @return {number} floored primary insurance amount
 */
TaxEngine.prototype.primaryInsuranceAmountFloored = function() {
  return Math.floor(this.primaryInsuranceAmount());
};

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
 * Returns the annual rate of benefit reduction for taking early benefits.
 * @return {number}
 */
TaxEngine.prototype.earlyReductionRate = function() {
  return -1;
}

/**
 * Returns the annual rate of benefit increase for taking late benefits.
 * @return {number}
 */
TaxEngine.prototype.delayIncreaseRate = function() {
  return this.fullRetirement.delayedIncreaseAnnual;
}

/**
 * Returns benefit information at a given age. Age is specified as a year and
 * month index (0-11).
 * @param {number} year
 * @param {number} month
 * @return {number}
 */
TaxEngine.prototype.benefitMultiplierAtAge = function(year, month) {
  // Compute the number of total months between birth and full retirement age.
  const fullAgeMonths = monthsIn(this.fullRetirement.ageYears,
                                 this.fullRetirement.ageMonths);
  var multiplier = 0;
  if ((year < this.fullRetirement.ageYears) ||
      (year == this.fullRetirement.ageYears &&
       month <= this.fullRetirement.ageMonths)) {
    // Reduced benefits due to taking benefits early.
    const monthsUntil = fullAgeMonths - monthsIn(year, month);
    return -1.0 * ((Math.min(36, monthsUntil) * 5.0 / 900.0) +
                   (Math.max(0, monthsUntil - 36) * 5.0 / 1200.0));
  } else {
    // Increased benefits due to taking benefits late.
    const monthsAfter = monthsIn(year, month) - fullAgeMonths;
    return this.delayIncreaseRate() / 12 * monthsAfter;
  }
};

/**
 * Returns benefit information at a given age. Age is specified as a year and
 * month index (0-11).
 * @param {number} year
 * @param {number} month
 * @return {number}
 */
TaxEngine.prototype.benefitAtAge = function(year, month) {
  return this.primaryInsuranceAmountFloored() *
    (1 + this.benefitMultiplierAtAge(year, month));
};

/**
 * Returns the date at a given age. Age is specified as a year and
 * month index (0-11).
 * @param {number} year
 * @param {number} month
 * @return {Object}
 */
TaxEngine.prototype.dateAtAge = function(year, month) {
  var birthMonthIndex = this.monthIndex(this.birthDate.month);
  var dateYear = (year + this.birthDate.year +
                  Math.floor(month + birthMonthIndex / 12));
  var dateMonth = month + birthMonthIndex % 12
  return {
    month: ALL_MONTHS[dateMonth],
    year: dateYear
  }
};

/**
 * Returns true iff the user's age is such that their PIA needs to be
 * adjusted for COLA values. This boolean is used to show/hide a section.
 * @return {boolean}
 */
TaxEngine.prototype.shouldAdjustForCOLA = function() {
  return this.dateAtAge(62, 0).year <= CURRENT_YEAR;
};
