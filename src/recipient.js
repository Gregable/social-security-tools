/**
 * An EarningRecord represents one year of Social Security earning data.
 * @constructor
 */
function EarningRecord() {
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
EarningRecord.prototype.indexedEarning = function() {
  var cappedEarning = Math.min(this.earningsCap, this.taxedEarnings);
  return Math.round(100 * cappedEarning * this.indexFactor) / 100;
};

/**
 * A Recipient object manages calculating a user's SSA and IRS data.
 * @constructor
 * @param {string} recipient's initial name.
 */
function Recipient(name) {
  this.initialized_ = false;
  
  /* The recipients name.
   * @type {string}
   */
  this.name = name

  /* The recipient's earning records over all years in the SSA database, if any.
   * @type {!Array<EarningRecord>}
   */
  this.earningsRecords = [];

  // In addition, we allow the recipient to specify future earnings as two
  // values: number of years and wage per year.
  this.futureEarningsYears = 0;
  this.futureEarningsWage = 0;

  // Once earnings have been processed, this stores the indexed earning dollar
  // amount below which additional earnings values will not affect earnings.
  this.cutoffIndexedEarnings = 0;
  
  // This value is the your average monthly earnings (floored) over the <= 35
  // years of earning history: total earnings / 35 / 12.
  this.monthlyIndexedEarnings = 0;

  // This is the monthly primary insurance amount, calculated either from
  // monthlyIndexedEarnings or set directly.
  this.primaryInsuranceAmountValue = 0;

  // Recipient's birth date and normal retirement date in year and month.
  this.birthDate = {year: 1970, month: 'Jan'};
  this.normalRetirementDate = { year: 2037, month: 'Jan' }

  // Will reference a value in the FULL_RETIREMENT_AGE array once age is set.
  this.normalRetirement = {};
}

/**
 * Returns true if the Recipient has been initialized from earnings records.
 * @return {boolean}
 */
Recipient.prototype.isInitialized = function() {
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
 * @param {!Array<!EarningRecord>} earningsRecords
 */
Recipient.prototype.initFromEarningsRecords = function(earningsRecords) {
  this.earningsRecords = earningsRecords;
  this.processIndexedEarnings_();
  this.initialized_ = true;
};

/**
 * Allows a user to simulate working additional years in the future.
 */
Recipient.prototype.simulateFutureEarningsYears = function(numYears, wage) {
  this.futureEarningsYears = numYears;
  this.futureEarningsWage = wage;
  this.processIndexedEarnings_();
};

Recipient.prototype.updateBirthdate = function(birthdate) {
  this.birthDate.year = birthdate.year;
  this.birthDate.month = birthdate.month;

  // Find the retirement age bracket data for this recipient.
  for (var i = 0; i < FULL_RETIREMENT_AGE.length; ++i) {
    var ageBracket = FULL_RETIREMENT_AGE[i];
    if (this.birthDate.year >= ageBracket.minYear &&
        this.birthDate.year <= ageBracket.maxYear) {
      this.normalRetirement = ageBracket;
    }
  }

  var birthMonthIndex = monthIndex(this.birthDate.month);
  var retirementYear = (
      parseInt(this.birthDate.year) +
      this.normalRetirement.ageYears + 
      Math.floor((birthMonthIndex + this.normalRetirement.ageMonths) / 12));
  var retirementMonth = (
      (birthMonthIndex + this.normalRetirement.ageMonths) % 12);

  this.normalRetirementDate = {
    month: ALL_MONTHS[retirementMonth],
    year: retirementYear
  };

  // Birthdate can affect indexed earnings.
  this.processIndexedEarnings_();
}

// Used for displaying text for earners whose indexing factors are still
// changing.
Recipient.prototype.isOver60 = function() {
  return this.birthDate.year < (CURRENT_YEAR - 60);
}

/**
 * Returns the date at a given age. Age is specified as a year and
 * month index (0-11).
 * @param {number} year
 * @param {number} month
 * @return {Object}
 */
Recipient.prototype.dateAtAge = function(year, month) {
  if (month === undefined) month = 0;
  var birthMonthIndex = monthIndex(this.birthDate.month);
  var dateYear = (year + this.birthDate.year +
                  Math.floor((month + birthMonthIndex) / 12));
  var dateMonth = (month + birthMonthIndex) % 12
  return {
    month: ALL_MONTHS[dateMonth],
    year: dateYear
  }
};

/**
 * Returns the date in months (so year 2000 is 12 * 2000) at a given age.
 * Age is specified as a year and month index (0-11).
 * @param {number} year
 * @param {number} month
 * @return {Object}
 */
Recipient.prototype.dateMonthsAtAge = function(year, month) {
  if (month === undefined) month = 0;
  var birthMonthIndex = monthIndex(this.birthDate.month);
  var dateYear = (year + this.birthDate.year +
                  Math.floor((month + birthMonthIndex) / 12));
  var dateMonth = (month + birthMonthIndex) % 12;
  return (dateYear * 12) + dateMonth;
};


/**
 * Returns the age at a given date. Date is specified as a year and
 * month index (0-11).
 * @param {number} year
 * @param {number} month
 * @return {Object}
 */
Recipient.prototype.ageAtDate = function(year, month) {
  if (month === undefined) month = 0;
  var dateMonthIndex = monthIndex(this.birthDate.month);
  var ageYear = (year - this.birthDate.year +
                  Math.floor((month - dateMonthIndex) / 12));
  var ageMonth = (month + 12 - dateMonthIndex) % 12
  return {
    month: ALL_MONTHS[ageMonth],
    year: ageYear
  }
};

/**
 * Returns the age in months (so could be hundreds) at a given date.
 * Date is specified as a year and month index (0-11).
 * @param {number} year
 * @param {number} month
 * @return {Object}
 */
Recipient.prototype.monthsOldAtDate = function(year, month) {
  if (month === undefined) month = 0;
  var dateMonthIndex = monthIndex(this.birthDate.month);
  return ((year - this.birthDate.year) * 12) + month - dateMonthIndex;
};

// From https://www.ssa.gov/oact/cola/piaformula.html, the PIA calculation
// depends on the year at which an individual first becomes eligible for
// benefits, (when they turn 62). The computation is based on the wage
// index from two years prior. If the user is not yet 62, we use the
// most up to date bend points, which are for the current year.
Recipient.prototype.indexingYear = function() {  
  return Math.min(this.dateAtAge(62, 0).year, CURRENT_YEAR) - 2;
}

/**
 * For each earnings record, match up the year with the MAXIMUM_EARNINGS
 * and WAGE_INDICES data, compute indexed earnings for that record, adding it
 * to the record. This is the main loop for calculating primary insurance amount
 * from earnings data.
 * @private
 */
Recipient.prototype.processIndexedEarnings_ = function() {
  // If there are no earning records, the result will be 0. Don't recompute.
  // Note this case also occurs for recipients who have had their PIA set
  // directly, rather than via earnings records.
  if (this.monthlyIndexedEarnings === 0 &&
      this.earningsRecords.length === 0)
    return;

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

  // Set bits for all years above the top earning year.
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
  var totalIndexedEarnings = 0;
  for (var i = 0; i < allIndexedValues.length && i < SSA_EARNINGS_YEARS; ++i) {
    totalIndexedEarnings += allIndexedValues[i];
  }

  // SSA floors the monthly indexed earnings value. This floored value
  // is the basis for all following calculations. So, if you want to consider
  // your anual insurance amount, it's computed based on monthly values, ie:
  // 12 * floor(totalIndexedEarnings / 12)
  this.monthlyIndexedEarnings =
    Math.floor(totalIndexedEarnings / 12 / SSA_EARNINGS_YEARS);
  
  // From the monthlyIndexedEarnings, compute this user's primary insurance
  // amount.
  this.primaryInsuranceAmountValue =
    colaAdjustment(this.dateAtAge(62, 0).year,
        this.primaryInsuranceAmountUnadjusted());
};


/**
 * Returns the number of years for which we have earnings records.
 * @return {number}
 */
Recipient.prototype.numEarningsYears = function() {
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
 * Returns the PIA component a specific breakpoint bracket for this
 * user's monthly indexed earnings.
 * @param {number} bracket Must be 0, 1, or 2
 * @return {number} benefit in that bracket.
 */
Recipient.prototype.primaryInsuranceAmountByBracket = function(bracket) {
  return primaryInsuranceAmountForEarningsByBracket(
      this.indexingYear(), this.monthlyIndexedEarnings, bracket);
};

/**
 * Returns the primary insurance amount (monthly benefit) summed across all
 * benefit brackets, but not adjusted for COLA increases.
 * @return {number} unadjusted primary insurance amount
 */
Recipient.prototype.primaryInsuranceAmountUnadjusted = function() {
  return primaryInsuranceAmountForEarningsUnadjusted(
      this.indexingYear(), this.monthlyIndexedEarnings);
}

/**
 * Returns true iff the user's age is such that their PIA needs to be
 * adjusted for COLA values. This boolean is used to show/hide a section.
 * @return {boolean}
 */
Recipient.prototype.shouldAdjustForCOLA = function() {
  return this.dateAtAge(62, 0).year <= CURRENT_YEAR;
};

/**
 * Returns an array of adjustments to be displayed to the user. Each record
 * has the year, the adjustment rate, and the starting/ending values.
 * @return {Array<Object>}
 */
Recipient.prototype.colaAdjustments = function() {
  const years = colaAdjustmentYears(this.dateAtAge(62, 0).year);
  var adjusted = this.primaryInsuranceAmountUnadjusted();

  if (this.adjustments_ !== undefined) {
    if (this.adjustments_.length === 0 && years.length === 0)
     return this.adjustments_;
    if (this.adjustments_.length > 0 && this.adjustments_[0].start === adjusted)
     return this.adjustments_;
  }

  this.adjustments_ = [];
  for (var year of years) {
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
Recipient.prototype.primaryInsuranceAmount = function() {
  // Handle user input. Angular enforces that the input is a number-formatted
  // string, but not that it's a number.
  parsed = parseInt(this.primaryInsuranceAmountValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Returns the primary insurance amount floored. This is the actual payment
 * amount if paid out.
 * @return {number} floored primary insurance amount
 */
Recipient.prototype.primaryInsuranceAmountFloored = function() {
  return Math.floor(this.primaryInsuranceAmount());
};

/**
 * Returns the annual rate of benefit increase for taking late benefits.
 * @return {number}
 */
Recipient.prototype.delayIncreaseRate = function() {
  return this.normalRetirement.delayedIncreaseAnnual;
}

/**
 * Returns benefit multiplier at a given age. Age is specified as a year and
 * month index (0-11).
 * @param {number} year
 * @param {number} month
 * @return {number}
 */
Recipient.prototype.benefitMultiplierAtAge = function(year, month) {
  // Compute the number of total months between birth and full retirement age.
  const fullAgeMonths = monthsIn(this.normalRetirement.ageYears,
                                 this.normalRetirement.ageMonths);
  const startAgeMonths = monthsIn(year, month);
  if (fullAgeMonths > startAgeMonths) {
    // Reduced benefits due to taking benefits early.
    const monthsUntil = fullAgeMonths - startAgeMonths;
    return -1.0 * ((Math.min(36, monthsUntil) * 5.0 / 900.0) +
                   (Math.max(0, monthsUntil - 36) * 5.0 / 1200.0));
  } else {
    // Increased benefits due to taking benefits late.
    const monthsAfter = startAgeMonths - fullAgeMonths;
    return this.delayIncreaseRate() / 12 * monthsAfter;
  }
};

/**
 * Returns personal benefit amount if starting benefits at a given age.
 * Age is specified as a year and month index (0-11).
 * @param {number} year
 * @param {number} month
 * @return {number}
 */
Recipient.prototype.benefitAtAge = function(year, month) {
  return this.primaryInsuranceAmountFloored() *
    (1 + this.benefitMultiplierAtAge(year, month));
};

/**
 * @param {Recipient} spouse
 */
Recipient.prototype.setSpouse = function(spouse) {
  this.spouse = spouse;
};

Recipient.prototype.earliestSpousalBenefitDate = function() {
  earliestSpouseDate = this.spouse.dateAtAge(62, 0);
  earliestDate = this.dateAtAge(62, 0);

  // The earliest a spouse could start collecting spousal benefits is
  // the later of the month that both spouses reach 62.
  if (earliestSpouseDate.year < earliestDate.year ||
      monthIndex(earliestSpouseDate.month) < monthIndex(earliestDate.month))
    return earliestDate;
  return earliestSpouseDate;
};

/**
 * Returns spousal benefit multiplier at a given age. Age is specified as a
 * year and month index (0-11).
 * @param {number} year
 * @param {number} month
 * @return {number}
 */
Recipient.prototype.spousalBenefitMultiplierAtAge = function(year, month) {
  // Compute the number of total months between birth and full retirement age.
  const fullAgeMonths = monthsIn(this.normalRetirement.ageYears,
                                 this.normalRetirement.ageMonths);
  const startAgeMonths = monthsIn(year, month);
  if (fullAgeMonths > startAgeMonths) {
    // Reduced benefits due to taking benefits early.
    const monthsUntil = fullAgeMonths - startAgeMonths;
    return -1.0 * ((Math.min(36, monthsUntil) * 25.0 / 3600.0) +
                   (Math.max(0, monthsUntil - 36) * 5.0 / 1200.0));
  } else {
    // No increased benefits from taking spousal benefits later than full
    // retirement age.
    return 0.0;
  }
};

/**
 * Returns the final total benefit amount (personal + spousal) based on both
 * the recipient's start age and recipient's age when spousal benefits start.
 * Age is specified as a year and month index (0-11).
 * @param {number} selfStartYear
 * @param {number} selfStartMonth
 * @param {number} spousalStartYear
 * @param {number} spousalStartMonth
 */
Recipient.prototype.totalBenefitWithSpousal = function(
    selfStartYear, selfStartMonth, spousalStartYear, spousalStartMonth) {
  const personalBenefit = 
    this.benefitAtAge(selfStartYear, selfStartMonth);

  // The spousal benefit at full retirement is half the spouse's PIA minus
  // the spouses PIA, or 0.
  const spousalBenefitAtFRA = Math.max(0, 
      (this.spouse.primaryInsuranceAmount() / 2.0) -
      this.primaryInsuranceAmount());

  const spousalBenefitMultiplier = this.spousalBenefitMultiplierAtAge(
      spousalStartYear, spousalStartMonth);
  const spousalBenefit = spousalBenefitAtFRA * (1 + spousalBenefitMultiplier);

  return personalBenefit + spousalBenefit;
}
