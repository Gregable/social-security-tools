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
  this.credits = 0;
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
  
  /* The recipients name. Model variable.
   * @type {string}
   */
  this.name = name

  /* The recipient's earning records over all years in the SSA database, if any.
   * @type {!Array<EarningRecord>}
   */
  this.earningsRecords_ = [];

  /* The recipient's planned future earning records, if any.
   * @type {!Array<EarningRecord>}
   */
  this.futureEarningsRecords_ = [];

  // Once earnings have been processed, this stores the indexed earning dollar
  // amount below which additional earnings values will not affect earnings.
  this.cutoffIndexedEarnings = 0;
 
  // This value is the your total over the <= 35 years of earning history.
  this.totalIndexedEarnings = 0;
 
  // This value is the your average monthly earnings (floored) over the <= 35
  // years of earning history: total earnings / 35 / 12.
  this.monthlyIndexedEarnings = 0;

  // The total credits earned, maximum of 40
  this.earnedCredits_ = 0;

  // The total of credits that would be earned in the planned work
  this.plannedCredits_ = 0;

  // total credits = earnedCredits + planned credits
  this.totalCredits_ = 0;

  // Have earnings before 1978
  this.hasEarningsBefore1978 = false;

  // Additional years of work needed given the earnings at entered
  // future wage, -1 means wage is too low to earn a credit in any year or
  // no future earnings years are set.
  this.neededYears_ = -1;

  // This is the monthly primary insurance amount, calculated either from
  // monthlyIndexedEarnings or set directly.
  this.primaryInsuranceAmountValue = 0;

  this.birthdate_ = new Birthday();

  // This is a tuple of:
  // minYear, maxYear, ageYears, ageMonths, delatedIncreaseAnnual
  this.normalRetirement = FULL_RETIREMENT_AGE[0];
  
  // If true, the user's birthday is on the first, so they can recieve full
  // benefits on the month they turn 62.
  this.isFullMonth = false;
}

/**
 * Returns true if the Recipient has been initialized from earnings records.
 * @return {boolean}
 */
Recipient.prototype.isInitialized = function() {
  return this.initialized_;
};

Recipient.prototype.earningsRecords = function() {
  return this.earningsRecords_;
};

Recipient.prototype.hasFutureEarnings = function() {
  return this.futureEarningsRecords_.length > 0;
};

Recipient.prototype.futureEarningsRecords = function() {
  return this.futureEarningsRecords_;
};

Recipient.prototype.futureEarningsYears = function() {
  return this.futureEarningsRecords_.length;
};

Recipient.prototype.plannedCredits = function() {
  return this.plannedCredits_;
}

Recipient.prototype.earnedCredits = function() {
  return this.earnedCredits_;
}

Recipient.prototype.totalCredits = function() {
  return this.totalCredits_;
}

Recipient.prototype.neededYears = function() {
  return this.neededYears_;
}

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
 * @param {!Array<!EarningRecord>} records
 */
Recipient.prototype.initFromEarningsRecords = function(records) {
  this.earningsRecords_ = records;
  this.processIndexedEarnings_();
  this.initialized_ = true;
  return this;
};

/**
 * Allows a user to simulate working additional years in the future.
 */
Recipient.prototype.simulateFutureEarningsYears = function(numYears, wage) {
  this.futureEarningsRecords_ = [];
  if (wage > 0) {
    start_year = CURRENT_YEAR;
    if (isLastYearIncomplete(this.earningsRecords_))
      start_year = start_year - 1;
    for (var i = 0; i < numYears; ++i) {
      var futureRecord = new EarningRecord();
      futureRecord.year = start_year + i;
      futureRecord.taxedEarnings = wage;
      futureRecord.taxedMedicareEarnings = wage;
      futureRecord.earningsCap = wage;
      futureRecord.indexFactor = 1.0;
      this.futureEarningsRecords_.push(futureRecord);
    }
  }
  this.processIndexedEarnings_();
};


/**
 * This returns the date in the given year that it is considered a person's
 * birthday, as well as their age.
 */
Recipient.prototype.exampleAge = function(year) {
  return this.birthdate_.exampleSsaAge(year);
}

Recipient.prototype.birthDate = function() {
  return this.birthdate_;
}

/*
 * Update this recipient's birthdate. Caller should provide the lay birthdate
 * as a JavaScript Date object.
 * @param {Date} birthdate
 */
Recipient.prototype.updateBirthdate = function(birthdate) {
  this.birthdate_.initFromLayDateObj(birthdate);
  this.isFullMonth = birthdate.getDate() === 1;

  // Find the retirement age bracket data for this recipient.
  for (var i = 0; i < FULL_RETIREMENT_AGE.length; ++i) {
    var ageBracket = FULL_RETIREMENT_AGE[i];
    if (this.birthdate_.ssaBirthYear() >= ageBracket.minYear &&
        this.birthdate_.ssaBirthYear() <= ageBracket.maxYear) {
      this.normalRetirement = ageBracket;
    }
  }
  var normalRetirementAge = this.normalRetirementAge();

  // Birthdate can affect indexed earnings.
  this.processIndexedEarnings_();
}

/*
 * Returns this recipient's normal retirement date
 * @return {MonthDate}
 */
Recipient.prototype.normalRetirementDate = function() {
  return this.birthdate_.ssaBirthDate().addDuration(
      this.normalRetirementAge());
}

/**
 * Returns the date that spousal benefits inflect for reduction between 6.67%
 * and 5%
 * @return {MonthDate}
 */
Recipient.prototype.spousalInflectionDate = function() {
  var threeYears = new MonthDuration().initFromYearsMonths(3, 0);
  return this.normalRetirementDate().subtractDuration(threeYears);
}

/**
 * Returns the date at a given age.
 * @param {MonthDuration} age
 * @return {MonthDate}
 */
Recipient.prototype.dateAtAge = function(age) {
  console.assert(typeof age === typeof new MonthDate(), age);
  return this.birthdate_.ssaBirthDate().addDuration(age);
};

/**
 * Convenience method for dateAtAge that accepts an integer years old.
 * Used primarily in partials.
 * @param {number} year
 * @return {MonthDate}
 */
Recipient.prototype.dateAtYearsOld = function(years) {
  return this.dateAtAge(new MonthDuration().initFromYearsMonths(years, 0));
};

/**
 * Returns the age at a given date.
 * @param {MonthDate} date
 * @return {MonthDuration}
 */
Recipient.prototype.ageAtDate = function(date) {
  return date.subtractDate(this.birthdate_.ssaBirthDate());
};

// Used for displaying text for earners whose indexing factors are still
// changing.
Recipient.prototype.isOver60 = function() {
  var age = this.ageAtDate(
      new MonthDate().initFromYearsMonths(CURRENT_YEAR, 0));
  return age.years > 60;
}

// From https://www.ssa.gov/oact/cola/piaformula.html, the PIA calculation
// depends on the year at which an individual first becomes eligible for
// benefits, (when they turn 62). The computation is based on the wage
// index from two years prior. If the user is not yet 62, we use the
// most up to date bend points, which are for the current year.
Recipient.prototype.indexingYear = function() {  
  return Math.min(this.dateAtYearsOld(62).year(), CURRENT_YEAR) - 2;
}

isLastYearIncomplete = function(records) {
  for (var record of records) {
    if (record.year === (CURRENT_YEAR - 1))
      return record.taxedEarnings === -1;
  }
  return false;
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
      this.earningsRecords_.length === 0)
    return;
  
  this.earnedCredits_ = 0;
  this.plannedCredits_ = 0;
  this.neededYears_ = -1;
  var allIndexedValues = [];
  for (var i = 0; i < this.earningsRecords_.length; ++i) {
    var earningRecord = this.earningsRecords_[i];

    if (earningRecord.year < 1978) {
      this.hasEarningsBefore1978 = true;
    }

    earningRecord.earningsCap = MAXIMUM_EARNINGS[earningRecord.year];

    // https://www.ssa.gov/oact/ProgData/retirebenefit1.html
    // Starting in the year the user turns 60, their index factor
    // is always 1.0, regardless of the index factor from the table.
    if ((earningRecord.year - this.birthdate_.ssaBirthYear()) >= 60) {
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
      allIndexedValues.push(earningRecord);

    earningRecord.credits = this.calculateCredits(
        earningRecord.taxedEarnings, earningRecord.year);
    this.earnedCredits_ = Math.min(
        40, this.earnedCredits_ + earningRecord.credits);
  }
  var neededCredits = 40 - this.earnedCredits_;
  if (this.hasFutureEarnings()) {
    var credits = this.calculateCredits(
        this.futureEarningsRecords_[0].taxedEarnings, CURRENT_YEAR);
    this.neededYears_ = Math.ceil(neededCredits / credits);
    for (var i = 0; i < this.futureEarningsRecords_.length; ++i) {
      var futureRecord = this.futureEarningsRecords_[0];
      allIndexedValues.push(futureRecord);
      this.plannedCredits_ = Math.min(
          neededCredits, this.plannedCredits_ + credits);
    }
  }
  this.totalCredits_ = this.earnedCredits_ + this.plannedCredits_;

  // Reverse sort the indexed values. Yay javascript, sorting numbers
  // alphabetically!
  allIndexedValues.sort(function(a, b) {
    // Prefer higher indexed values.
    if (a.indexedEarning() != b.indexedEarning())
      return a.indexedEarning() - b.indexedEarning();
    // Break ties in favor of earlier years.
    return b.year - a.year;
  });
  allIndexedValues.reverse();

  // Your top N values are the only ones that 'count'. Compute the cutoff
  // value below which earnings don't count.
  if (allIndexedValues.length < SSA_EARNINGS_YEARS) {
    this.cutoffIndexedEarnings = 0;
  } else {
    this.cutoffIndexedEarnings =
      allIndexedValues[SSA_EARNINGS_YEARS - 1].indexedEarning();
  }

  for (var i = 0; i < allIndexedValues.length; ++i) {
    allIndexedValues[i].isTopEarningYear = i < SSA_EARNINGS_YEARS;
  }

  // Total indexed earnings is the sum of your top 35 indexed earnings.
  this.totalIndexedEarnings = 0;
  for (var i = 0; i < allIndexedValues.length && i < SSA_EARNINGS_YEARS; ++i) {
    this.totalIndexedEarnings += allIndexedValues[i].indexedEarning();
  }

  // SSA floors the monthly indexed earnings value. This floored value
  // is the basis for all following calculations. So, if you want to consider
  // your anual insurance amount, it's computed based on monthly values, ie:
  // 12 * floor(totalIndexedEarnings / 12)
  this.monthlyIndexedEarnings =
    Math.floor(this.totalIndexedEarnings / 12 / SSA_EARNINGS_YEARS);
  
  // From the monthlyIndexedEarnings, compute this user's primary insurance
  // amount.
  this.primaryInsuranceAmountValue =
    colaAdjustment(this.dateAtYearsOld(62).year(),
        this.primaryInsuranceAmountUnadjusted());
};


/**
 * Returns the number of years for which we have earnings records.
 * @return {number}
 */
Recipient.prototype.numEarningsYears = function() {
  var nonNegativeRecords = 0;
  for (var i = 0; i < this.earningsRecords_.length; ++i) {
    if (this.earningsRecords_[i].taxedEarnings >= 0)
      nonNegativeRecords += 1;
  }
  
  return nonNegativeRecords + this.futureEarningsRecords_.length;
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
  return this.dateAtYearsOld(62).year() <= CURRENT_YEAR;
};

/**
 * Returns an array of adjustments to be displayed to the user. Each record
 * has the year, the adjustment rate, and the starting/ending values.
 * @return {Array<Object>}
 */
Recipient.prototype.colaAdjustments = function() {
  const years = colaAdjustmentYears(this.dateAtYearsOld(62).year());
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
  // Handle user input in the spousal case. Angular enforces that the input is
  // a number-formatted string, but not that it's a number.
  parsed = parseFloat(this.primaryInsuranceAmountValue);
  if (isNaN(parsed))
    return 0;
  // Primary Insurance amounts are always rounded down the the nearest dime.
  // Who decided this was an important step?
  return Math.floor(parsed * 10) / 10;  
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
 * Returns the normal retirement age given the current birthdate.
 * @return {MonthDuration}
 */
Recipient.prototype.normalRetirementAge = function() {
  return new MonthDuration().initFromYearsMonths(
      this.normalRetirement.ageYears,
      this.normalRetirement.ageMonths);
}

/**
 * Returns benefit multiplier at a given age.
 * @param {MonthDuration} age
 * @return {number}
 */
Recipient.prototype.benefitMultiplierAtAge = function(age) {
  const nra = this.normalRetirementAge();
  // Compute the number of total months between birth and full retirement age.
  if (nra.greaterThan(age)) {
    // Reduced benefits due to taking benefits early.
    var before = nra.subtract(age);
    return -1.0 * ((Math.min(36, before.asMonths()) * 5.0 / 900.0) +
                   (Math.max(0, before.asMonths() - 36) * 5.0 / 1200.0));
  } else {
    // Increased benefits due to taking benefits late.
    const after = age.subtract(nra);
    return this.delayIncreaseRate() / 12 * after.asMonths();
  }
};

/**
 * Returns personal benefit amount if starting benefits at a given age.
 * @param {MonthDuration} age
 * @return {number}
 */
Recipient.prototype.benefitAtAge = function(age) {
  return Math.floor(
      this.primaryInsuranceAmountFloored() *
      (1 + this.benefitMultiplierAtAge(age)));
};

/**
 * @param {Recipient} spouse
 */
Recipient.prototype.setSpouse = function(spouse) {
  this.spouse = spouse;
};

/**
 * Returns spousal benefit multiplier at a given age.
 * @param {MonthDuration} age
 * @return {number}
 */
Recipient.prototype.spousalBenefitMultiplierAtAge = function(age) {
  // Compute the number of total months between birth and full retirement age.
  const nra = this.normalRetirementAge();
  if (nra.greaterThan(age)) {
    // Reduced benefits due to taking benefits early.
    var before = nra.subtract(age);
    return -1.0 * ((Math.min(36, before.asMonths()) * 25.0 / 3600.0) +
                   (Math.max(0, before.asMonths() - 36) * 5.0 / 1200.0));
  } else {
    // No increased benefits from taking spousal benefits later than full
    // retirement age.
    return 0.0;
  }
};

/**
 * Returns the final total benefit amount (personal + spousal) based on both
 * the recipient's start age and recipient's age when spousal benefits start.
 * Age is specified as a year and month index (0-11) since birth.
 * @param {MonthDuration} startAge
 */
Recipient.prototype.totalBenefitWithSpousal = function(startAge,
                                                       spousalStartAge) {
  const personalBenefit = this.benefitAtAge(startAge);

  // The spousal benefit at full retirement is half the spouse's PIA minus
  // the spouses PIA, or 0.
  const maxBenefitWithSpousal = this.spouse.primaryInsuranceAmount() / 2.0;
  const spousalBenefitAtFRA = 
      Math.max(0, maxBenefitWithSpousal - this.primaryInsuranceAmount());

  const spousalBenefitMultiplier = this.spousalBenefitMultiplierAtAge(
      spousalStartAge);
  const spousalBenefit = spousalBenefitAtFRA * (1 + spousalBenefitMultiplier);


  // You can't go above spousalBenefitAtFRA with a spousal benefit. If your
  // personal benefit is already higher than spousalBenefitAtFRA, you get your
  // personal benefit. If your combined benefit is greater than the
  // spousalBenefitAtFRA you cap out at spousalBenefitAtFRA. If not, you get
  // the sum.
  if (personalBenefit > maxBenefitWithSpousal) {
    return Math.floor(personalBenefit);
  } else if ((personalBenefit + spousalBenefit) > maxBenefitWithSpousal) {
    return Math.floor(maxBenefitWithSpousal)
  } else {
    return Math.floor(personalBenefit + spousalBenefit);
  }
}

/**
 * For delayed retirement credits only, you only collect your credits for the
 * first year you were recieving benefits for the entire year, with the
 * exception of when you turn 70. This method computes the personal benefits at
 * a given date, given also what date you filed. Does not compute spousal
 * effects.
 * @param {MonthDate} atDate date of the received benefits.
 * @param {MonthDate} filingDate date that this recipient filed.
 */
Recipient.prototype.benefitAtDateGivenFiling = function(atDate, filingDate) {
  // If recipient hasn't filed yet, no benefit:
  if (filingDate.greaterThan(atDate))
    return 0;
  // 70 is an explicit exception because the SSA likes to make my life harder.
  if (this.ageAtDate(filingDate).years() >= 70)
    return this.benefitAtAge(this.ageAtDate(filingDate));
  // If you are filing before normal retirement, no delayed credits anyway.
  if (filingDate.lessThanOrEqual(this.normalRetirementDate()))
    return this.benefitAtAge(this.ageAtDate(filingDate));
  // If you file in January, you are receiving benefits for the entire year.
  if (filingDate.monthIndex() === 0)
    return this.benefitAtAge(this.ageAtDate(filingDate));
  // If this is the year after filing, you are receiving benefits for this
  // entire year.
  if (filingDate.year() < atDate.year())
    return this.benefitAtAge(this.ageAtDate(filingDate));
  // Otherwise, you only get credits up to January of this year,
  // or NRA, whichever is later.
  var thisJan =
      new MonthDate().initFromYearsMonths(filingDate.year(), 0);
  var benefitComputationDate = 
    this.normalRetirementDate().greaterThan(thisJan) ?
        this.normalRetirementDate() : thisJan;
  return this.benefitAtAge(this.ageAtDate(benefitComputationDate));
}

/**
 * Computes the total benefit amount for this recipient at the date `atDate`
 * given their spouse's data, and each recipient's filing date.
 * @param {MonthDate} atDate date of the received benefits.
 * @param {MonthDate} filingDate date that this recipient filed.
 * @param {MonthDate} spouseFilingDAte date that the spouse filed.
 */
Recipient.prototype.totalBenefitAtDate = function(
    atDate, filingDate, spouseFilingDate) {
  // Each recipient should file between 62 and 70 inclusive. If their PIA is 0,
  // they should file sometime after 62, since they may just file at the date
  // the spouse files.
  console.assert(
      this.ageAtDate(filingDate).greaterThan(new MonthDuration(61, 11)));
  if (this.primaryInsuranceAmountFloored() > 0)
    console.assert(this.ageAtDate(filingDate)
        .lessThan(new MonthDuration().initFromYearsMonths(70, 1)));
  console.assert(this.spouse.ageAtDate(spouseFilingDate)
      .greaterThan(new MonthDuration(61, 11)));
  if (this.spouse.primaryInsuranceAmountFloored() > 0)
    console.assert(this.spouse.ageAtDate(spouseFilingDate).lessThan(
          new MonthDuration().initFromYearsMonths(70, 1)));

  // If recipient hasn't filed yet, no benefit:
  if (filingDate.greaterThan(atDate))
    return 0;

  // Simple case, no spousal effects. My earnings are greater than spouse's.
  if (this.primaryInsuranceAmount() >= this.spouse.primaryInsuranceAmount()) {
    return this.benefitAtDateGivenFiling(atDate, filingDate);
  }
 
  if (spouseFilingDate.greaterThan(atDate)) {
    // Only this recipient has filed, no spousal effects.
    return this.benefitAtDateGivenFiling(atDate, filingDate);
  }

  // Both earners have filed. Spousal benefits begin at the later of the two
  // filing dates
  var spousalDate = filingDate.greaterThan(spouseFilingDate) ?
    filingDate : spouseFilingDate;
  
  // This is complicated. If the total is just half of the spouse's PIA
  // or no delayed retirement credits are involved, then the total is correct.
  const maxBenefitWithSpousal = Math.floor(
      this.spouse.primaryInsuranceAmount() / 2.0);
  var total = this.totalBenefitWithSpousal(this.ageAtDate(filingDate),
                                           this.ageAtDate(spousalDate));
  if (total == maxBenefitWithSpousal ||
      filingDate.lessThanOrEqual(this.normalRetirementDate()))
    return total;
  // Otherwise, this is a user with delayed retirement credits in play, so we
  // may need to reduce the benefit for the first year.
  var justPersonal = this.benefitAtDateGivenFiling(atDate, filingDate);
  if (justPersonal > maxBenefitWithSpousal)
    return justPersonal;
  // But this should drop them back below the spousal rate.
  return maxBenefitWithSpousal;
}

Recipient.prototype.getEarningsPerCreditForYear = function(year) {
  if (year > CURRENT_YEAR)
    year = CURRENT_YEAR;
  if (year > 1978)
    return EARNINGS_PER_CREDIT[year];

  return 50;
}

Recipient.prototype.calculateCredits = function(earnings, year) {
  if (year === undefined)
    year = CURRENT_YEAR;
  // This can happen if the input contains a year with "Not yet recorded" in
  // the earnings column, and we set a sentinel of -1.
  if (earnings <= 0)
    return 0;
  return Math.min(4, 
      Math.floor(earnings / this.getEarningsPerCreditForYear(year)));
}

Recipient.prototype.isEligible = function() {
  return this.totalCredits_ >= 40;
}
