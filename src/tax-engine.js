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
 * @return {boolean}
 */
TaxRecord.prototype.indexedEarning = function() {
  var cappedEarning = Math.min(this.earningsCap, this.taxedEarnings);
  return Math.floor(cappedEarning * this.indexFactor);
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
}

/**
 * For each earnings record, match up the year with the SSA_MULTIPLIERS table
 * and process the indexed earnings for that record, adding it to the record.
 * @private
 */
TaxEngine.prototype.processIndexedEarnings_ = function() {
  var earningRecordIdx = 0;
  var ssaMultiplierIdx = 0;
  while (ssaMultiplierIdx < SSA_MULTIPLIERS.length &&
         earningRecordIdx < this.earningsRecords.length) {
    var ssaMultiplier = SSA_MULTIPLIERS[ssaMultiplierIdx];
    var earningRecord = this.earningsRecords[earningRecordIdx];

    if (earningRecord.year > ssaMultiplier.year) {
      ++ssaMultiplierIdx;
    } else if (ssaMultiplier.year > earningRecord.year) {
      ++earningRecordIdx;
    } else {
      ++ssaMultiplierIdx;
      ++earningRecordIdx;

      earningRecord.earningsCap = ssaMultiplier.maximumEarnings;
      earningRecord.indexFactor = ssaMultiplier.indexFactor;
    }
  }

  var allIndexedValues = [];
  for (var i = 0; i < this.earningsRecords.length; ++i) {
    var earningRecord = this.earningsRecords[i];
    if (earningRecord.taxedEarnings === -1)
      continue;
    allIndexedValues.push(earningRecord.indexedEarning());
  }
  for (var i = 0; i < this.futureEarningsYears; ++i) {
    allIndexedValues.push(this.futureEarningsWage);
  }

  // Reverse sort the indexed values. Yay javascript, sorting numbers
  // alphabetically!
  allIndexedValues.sort(function(a, b) {return a-b});
  allIndexedValues.reverse();

  // Your top N values are the only ones that 'count'. Compute the cutoff
  // value below which earnings don't count.
  // TODO: Right now if there is a tie for the cutoff, we show all tied
  // elements as a Top N value, leading to a situation where we could have
  // more than N top-N values.
  if (allIndexedValues.length < SSA_EARNINGS_YEARS) {
    this.cutoffIndexedEarnings = 0;
  } else {
    this.cutoffIndexedEarnings = allIndexedValues[SSA_EARNINGS_YEARS - 1];
  }

  for (var i = 0; i < this.earningsRecords.length; ++i) {
    var earningRecord = this.earningsRecords[i];
    if (earningRecord.indexedEarning() >= this.cutoffIndexedEarnings) {
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

  this.monthlyIndexedEarnings =
    this.totalIndexedEarnings / 12 / SSA_EARNINGS_YEARS;
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

  return nonNegativeRecords + this.futureEarningsYears;
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
 * Returns the benefit bracket annual minimum for the given bracket index.
 * @param {number} bracket Must be less than the number of BENEFIT_BRACKETS
 * @return {number} bracket minimum dollar amount.
 */
TaxEngine.prototype.benefitBracketMin = function(bracket) {
  var bracket = BENEFIT_BRACKETS[bracket];
  return bracket.min;
};

/**
 * Returns the benefit bracket annual maximum for the given bracket index.
 * @param {number} bracket Must be less than the number of BENEFIT_BRACKETS
 * @return {number} bracket maximum dollar amount.
 */
TaxEngine.prototype.benefitBracketMax = function(bracket) {
  var bracket = BENEFIT_BRACKETS[bracket];
  return bracket.max;
};

/**
 * Returns the yearly benefit for a specific breakpoint bracket for any
 * yearly indexed earnings.
 * @param {number} earnings yearly indexed earnings to compute
 * @param {number} bracket Must be less than the number of BENEFIT_BRACKETS
 * @return {number} benefit in that bracket for this earnings.
 */
TaxEngine.prototype.estimatedBenefitForEarningsByBracket =
    function(earnings, bracket) {
  var bracket = BENEFIT_BRACKETS[bracket];
  var benefit = earnings;
  if (bracket.max !== undefined) {
    benefit = Math.min(benefit, bracket.max);
  }
  if (bracket.min !== undefined) {
    benefit = Math.max(0, benefit - bracket.min);
  }
  return bracket.multiplier * benefit;
};

/**
 * Returns the total annual fill benefit summed across all benefit brackets.
 * @param {number} earnings yearly indexed earnings to compute
 * @return {number} annual benefit across all benefit brackets.
 */
TaxEngine.prototype.estimatedFullBenefitForEarnings = function(earnings) {
  var sum = 0;
  for (var i = 0; i < BENEFIT_BRACKETS.length; ++i)
    sum += this.estimatedBenefitForEarningsByBracket(earnings, i);
  return sum;
};

/**
 * Returns the yearly benefit for a specific breakpoint bracket for this
 * user's yearly indexed earnings.
 * @param {number} bracket Must be less than the number of BENEFIT_BRACKETS
 * @return {number} benefit in that bracket.
 */
TaxEngine.prototype.estimatedBenefitByBracket = function(bracket) {
  return this.estimatedBenefitForEarningsByBracket(
      this.yearlyIndexedEarnings(), bracket);
};

/**
 * Returns the total annual full benefit summed across all benefit brackets.
 * @return {number} annual benefit across all benefit brackets.
 */
TaxEngine.prototype.estimatedFullBenefit = function() {
  return this.estimatedFullBenefitForEarnings(this.yearlyIndexedEarnings());
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
  // Compute the number of total months between birth and full retirement age.
  const fullAgeMonths = monthsIn(this.fullRetirement.ageYears,
                                 this.fullRetirement.ageMonths);
  // Compute the number of total months between 62 and full retirement age:
  const monthRange = fullAgeMonths - monthsIn(62, 0);
  return this.fullRetirement.earlyReductionTotal / monthRange * 12;
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
    return -1.0 * (this.earlyReductionRate() / 12) * monthsUntil;
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
  return this.estimatedFullBenefitForEarnings(this.yearlyIndexedEarnings()) *
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


