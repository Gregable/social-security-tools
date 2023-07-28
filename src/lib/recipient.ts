import {Birthdate} from './birthday';
import * as constants from './constants';
import {EarningRecord} from './earning-record';
import {Money} from './money';
import {MonthDate, MonthDuration} from './month-time';
import {PrimaryInsuranceAmount} from './pia';


/**
 * A Recipient object manages calculating a user's SSA and IRS data.
 */
export class Recipient {
  /**
   * Creates a Recipient object.
   */
  constructor() {}

  /**
   * Subscribers to call back for changes to this Recipient.
   */
  private subscribers_: Array<(recipient: Recipient) => void> = [];

  /**
   * Registers a callback to be called when this Recipient changes.
   * @param callback The callback to call when this Recipient changes.
   * @return A function that can be called to unsubscribe the callback.
   * @see https://svelte.dev/docs#Store_contract
   */
  subscribe(callback: (recipient: Recipient) => void): () => void {
    this.subscribers_.push(callback);
    callback(this);
    // Return an unsubscribe function.
    return () => {
      const index = this.subscribers_.indexOf(callback);
      if (index !== -1) {
        this.subscribers_.splice(index, 1);
      }
    };
  };

  private publish_() {
    this.subscribers_.forEach((callback) => {
      callback(this);
    });
  }

  /** The recipient's name. */
  private name_: string;
  get name(): string {
    return this.name_;
  }
  set name(name: string) {
    this.name_ = name;
    this.publish_();
  }

  /**
   * Returns a shortened version of the recipient's name, if necessary.
   * @param length The maximum character length of the output.
   * @returns
   */
  shortName(length: number): string {
    if (this.name_.length <= length) return this.name_;
    return this.name_.substring(0, length - 1) + '…';
  }

  /** True if this is the only recipient, false if there are two. */
  private only_: boolean = true;
  /** True if this is the only recipient or the first recipient. */
  private first_: boolean = true;
  get only(): boolean {
    return this.only_;
  }
  get first(): boolean {
    return this.first_;
  }
  markFirst() {
    this.only_ = false;
    this.first_ = true;
    this.publish_();
  }
  markSecond() {
    this.only_ = false;
    this.first_ = false;
    this.publish_();
  }


  /**
   * The recipient's earning records over all years in the SSA database, if
   * any.
   */
  private earningsRecords_: Array<EarningRecord> = [];
  get earningsRecords(): Array<EarningRecord> {
    return this.earningsRecords_;
  }
  set earningsRecords(earningsRecords: Array<EarningRecord>) {
    this.earningsRecords_ = earningsRecords;
    // Update the indexing year for the new records.
    this.updateEarningsRecords_();
  }

  /**
   * The recipient's planned future earning records, if any.
   */
  private futureEarningsRecords_: Array<EarningRecord> = [];
  get futureEarningsRecords(): Array<EarningRecord> {
    return this.futureEarningsRecords_;
  }
  set futureEarningsRecords(futureEarningsRecords: Array<EarningRecord>) {
    this.futureEarningsRecords_ = futureEarningsRecords;
    // Update the indexing year for the new records.
    this.updateEarningsRecords_();
  }

  /**
   * Creates future earning records for the specified number of years.
   * @param numYears The number of years to simulate.
   * @param wage The wage to use for the simulation.
   */
  simulateFutureEarningsYears(numYears: number, wage: Money) {
    this.futureEarningsRecords_ = [];

    // We can't simulate the past, so start the simulation at the current
    // year. However, if there are records for this year or future years,
    // start the simulation at the next year not in the records as long as
    // that record is complete.
    let startYear = constants.CURRENT_YEAR;
    if (this.earningsRecords_.length > 0) {
      const lastRecord =
          this.earningsRecords_[this.earningsRecords_.length - 1];
      if (lastRecord.year == constants.CURRENT_YEAR - 1 &&
          lastRecord.incomplete) {
        // If the previous year's record is listed as incomplete, we allow the
        // user to simulate that year as well.
        startYear = constants.CURRENT_YEAR - 1;
      } else if (lastRecord.year >= constants.CURRENT_YEAR) {
        // If the user has already input earnings for this year or a future
        // year, we start the simulation at the next year.
        startYear = lastRecord.year + 1;
      }
    }

    // Add the simulated records for the number of years requested.
    for (let i = 0; i < numYears; ++i) {
      this.futureEarningsRecords_.push(new EarningRecord({
        year: startYear + i,
        taxedEarnings: wage,
        taxedMedicareEarnings: wage
      }));
    }
    // Update the indexing year for the new records.
    this.updateEarningsRecords_();
  }

  /**
   * Top constants.SSA_EARNINGS_YEARS (35) years of earning records.
   *
   * Updated in updateEarningsRecords_().
   */
  private top35IndexedEarnings_: Array<EarningRecord> = [];

  /**
   * Total indexed earnings over the top 35 years.
   *
   * Updated in updateEarningsRecords_().
   */
  private totalIndexedEarnings_: Money = Money.from(0);
  totalIndexedEarnings(): Money {
    return this.totalIndexedEarnings_;
  }

  /**
   * The recipient's birthdate.
   */
  private birthdate_: Birthdate = new Birthdate();
  get birthdate(): Birthdate {
    return this.birthdate_;
  }
  set birthdate(birthdate: Birthdate) {
    this.birthdate_ = birthdate;
    // Update the indexing year for the all records based on the new
    // birthdate.
    this.updateEarningsRecords_();
  }

  private retirementAgeBracket(): {
    minYear: number,
    maxYear: number,
    ageYears: number,
    ageMonths: number,
    delayedIncreaseAnnual: number
  } {
    // Find the retirement age bracket data for this recipient.
    let retirementAgeBracket = undefined;
    for (let i = 0; i < constants.FULL_RETIREMENT_AGE.length; ++i) {
      let ageBracket = constants.FULL_RETIREMENT_AGE[i];
      if (this.birthdate_.ssaBirthYear() >= ageBracket.minYear &&
          this.birthdate_.ssaBirthYear() <= ageBracket.maxYear) {
        retirementAgeBracket = ageBracket;
      }
    }
    console.assert(retirementAgeBracket !== undefined);
    return retirementAgeBracket;
  }

  /*
   * Recipient's normal retirement age.
   */
  normalRetirementAge(): MonthDuration {
    return MonthDuration.initFromYearsMonths({
      years: this.retirementAgeBracket().ageYears,
      months: this.retirementAgeBracket().ageMonths
    });
  }

  delayedRetirementIncrease(): number {
    return this.retirementAgeBracket().delayedIncreaseAnnual;
  }

  /*
   * Recipient's normal retirement date.
   */
  normalRetirementDate(): MonthDate {
    return this.birthdate_.ssaBirthMonthDate().addDuration(
        this.normalRetirementAge());
  }

  /**
   * The early retirement reduction factor changes from 6.67%/yr for years
   * earlier than 3 years before normal retirement age to 5%/yr for the 3 years
   * immediately before normal retirement age. This function returns the age at
   * which the reduction factor changes.
   */
  earlyRetirementInflectionAge(): MonthDuration {
    return this.normalRetirementAge().subtract(new MonthDuration(36));
  }

  /**
   * The early retirement reduction factor changes from 6.67%/yr for years
   * earlier than 3 years before normal retirement age to 5%/yr for the 3 years
   * immediately before normal retirement age. This function returns the date at
   * which the reduction factor changes.
   */
  earlyRetirementInflectionDate(): MonthDate {
    return this.normalRetirementDate().subtractDuration(new MonthDuration(36));
  }


  /**
   * The year from which benefits are indexed for the PIA calculation.
   *
   * From https://www.ssa.gov/oact/cola/piaformula.html, the PIA calculation
   * depends on the year at which an individual first becomes eligible for
   * benefits, (when they turn 62). The computation is based on the wage
   * index from two years prior (when they turn 60).
   */
  indexingYear(): number {
    return this.birthdate_
        .dateAtSsaAge(MonthDuration.initFromYearsMonths({years: 60, months: 0}))
        .year();
  };

  /**
   * The total number of credits the recipient has earned so far.
   *
   * This does not include future credits.
   */
  earnedCredits(): number {
    let credits: number = 0;
    for (let i = 0; i < this.earningsRecords_.length; ++i) {
      credits += this.earningsRecords_[i].credits();
    }
    return Math.min(40, credits);
  }

  /**
   * The total number of credits the recipient has earned or will earn.
   */
  totalCredits(): number {
    let credits: number = 0;
    for (let i = 0; i < this.earningsRecords_.length; ++i) {
      credits += this.earningsRecords_[i].credits();
    }
    for (let i = 0; i < this.futureEarningsRecords_.length; ++i) {
      credits += this.futureEarningsRecords_[i].credits();
    }

    return Math.min(40, credits);
  }

  /**
   * Populates the indexingYear field of each earnings record.
   * Sorts the earnings records by year ascending.
   */
  private updateEarningsRecords_() {
    const indexingYear = this.indexingYear();

    this.earningsRecords_.sort((a, b) => a.year - b.year);
    for (let i = 0; i < this.earningsRecords_.length; ++i) {
      this.earningsRecords_[i].indexingYear = indexingYear;
      this.earningsRecords_[i].age =
          this.earningsRecords_[i].year - this.birthdate_.ssaBirthYear();
      this.earningsRecords_[i].isTop35EarningsYear = false;
    }

    this.futureEarningsRecords_.sort((a, b) => a.year - b.year);
    for (let i = 0; i < this.futureEarningsRecords_.length; ++i) {
      this.futureEarningsRecords_[i].indexingYear = indexingYear;
      this.futureEarningsRecords_[i].age =
          this.futureEarningsRecords_[i].year - this.birthdate_.ssaBirthYear();
      this.futureEarningsRecords_[i].isTop35EarningsYear = false;
    }

    this.top35IndexedEarnings_ =
        this.earningsRecords_.concat(this.futureEarningsRecords_);
    this.top35IndexedEarnings_.sort((a, b) => {
      // Prefer higher indexed earnings, break ties by by older years.
      if (a.indexedEarnings().value() != b.indexedEarnings().value()) {
        return b.indexedEarnings().value() - a.indexedEarnings().value();
      } else {
        return a.year - b.year;
      }
    });
    // Remove all but the top 35 years.
    this.top35IndexedEarnings_.splice(constants.SSA_EARNINGS_YEARS);
    // Calculate the total indexed earnings and mark the top 35 years.
    this.totalIndexedEarnings_ = Money.from(0);
    for (let i = 0; i < this.top35IndexedEarnings_.length; ++i) {
      this.top35IndexedEarnings_[i].isTop35EarningsYear = true;
      this.totalIndexedEarnings_ = this.totalIndexedEarnings_.plus(
          this.top35IndexedEarnings_[i].indexedEarnings());
    }

    this.publish_();
  }

  hasEarningsBefore1978(): boolean {
    // Only check the first earnings record. Future records are after 1978.
    return this.earningsRecords_.length == 0 ?
        false :
        this.earningsRecords_[0].year < 1978;
  }

  /**
   * Minimum indexed earnings needed to affect the top 35 years of earnings.
   * If fewer than 35 years of earnings, this is always 0.
   */
  cutoffIndexedEarnings(): Money {
    return this.top35IndexedEarnings_.length < constants.SSA_EARNINGS_YEARS ?
        Money.from(0) :
        this.top35IndexedEarnings_[this.top35IndexedEarnings_.length - 1]
            .indexedEarnings();
  }

  /**
   * Monthly indexed earnings for the top 35 years of earnings.
   */
  monthlyIndexedEarnings(): Money {
    return this.totalIndexedEarnings_.div(12)
        .div(constants.SSA_EARNINGS_YEARS)
        .floorToDollar();
  }

  /**
   * The Primary Insurance Amount (PIA) for this recipient.
   */
  pia(): PrimaryInsuranceAmount {
    return new PrimaryInsuranceAmount(this);
  }

  /**
   * Returns benefit multiplier at a given age.
   */
  benefitMultiplierAtAge(age: MonthDuration): number {
    const nra = this.normalRetirementAge();
    // Compute the number of total months between birth and full retirement age.
    if (nra.greaterThan(age)) {
      // Reduced benefits due to taking benefits early.
      let before = nra.subtract(age);
      return -1.0 *
          ((Math.min(36, before.asMonths()) * 5 / 900) +
           (Math.max(0, before.asMonths() - 36) * 5 / 1200));
    } else {
      // Increased benefits due to taking benefits late.
      const after = age.subtract(nra);
      return this.delayedRetirementIncrease() / 12 * after.asMonths();
    }
  };

  private testPrimaryInsuranceAmount_: Money|null = null;
  forceTestPia(pia: Money) {
    this.testPrimaryInsuranceAmount_ = pia;
  }

  /**
   * Returns personal benefit amount if starting benefits at a given age.
   */
  benefitAtAge(age: MonthDuration): Money {
    // Support overriding the PIA dollar amount for testing purposes, using
    // forceTestPia().
    let piaAmount: Money;
    if (this.testPrimaryInsuranceAmount_ != null) {
      piaAmount = this.testPrimaryInsuranceAmount_;
    } else {
      piaAmount = this.pia().primaryInsuranceAmount();
    }

    return piaAmount.floorToDollar()
        .times(1 + this.benefitMultiplierAtAge(age))
        .floorToDollar();
  };

  /**
   * Given a certain filing date and current date, returns the benefit amount
   * for the recipient on that date. Does not include spousal benefits.
   */
  benefitOnDate(filingDate: MonthDate, atDate: MonthDate): Money {
    // The filing date must be between 62 and 70:
    console.assert(this.birthdate.ageAtSsaDate(filingDate)
                       .greaterThanOrEqual(MonthDuration.initFromYearsMonths(
                           {years: 62, months: 0})));
    console.assert(this.birthdate.ageAtSsaDate(filingDate)
                       .lessThanOrEqual(MonthDuration.initFromYearsMonths(
                           {years: 70, months: 0})));

    // If the recipient hasn't filed yet, return $0:
    if (filingDate.greaterThan(atDate)) return Money.from(0);

    // This is the eventual benefit amount given a filing date. The actual
    // benefit may be lower, for example if the user has yet to realize full
    // delated credits.
    const filingAgeBenefit: Money =
        this.benefitAtAge(this.birthdate.ageAtSsaDate(filingDate));

    // 70 is an explicit exception because the SSA likes to make my life harder.
    // Normally, you'd need to wait until the next year to get delayed credits,
    // but not if you file at exactly 70.
    if (this.birthdate.ageAtSsaDate(filingDate).years() >= 70)
      return filingAgeBenefit;

    // If you are filing before normal retirement, no delayed credits apply.
    if (filingDate.lessThanOrEqual(this.normalRetirementDate()))
      return filingAgeBenefit;

    // If you file in January, delayed credits are fully applied.
    if (filingDate.monthIndex() === 0) return filingAgeBenefit;

    // If this is the year after filing, delayed credits are fully applied.
    if (filingDate.year() < atDate.year()) return filingAgeBenefit;

    // Otherwise, you only get credits up to January of this year,
    // or NRA, whichever is later.
    let thisJan =
        MonthDate.initFromYearsMonths({years: filingDate.year(), months: 0});
    let benefitComputationDate =
        this.normalRetirementDate().greaterThan(thisJan) ?
        this.normalRetirementDate() :
        thisJan;
    return this.benefitAtAge(
        this.birthdate.ageAtSsaDate(benefitComputationDate));
  }
}  // class Recipient
