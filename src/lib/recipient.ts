import {Birthdate} from './birthday';
import * as constants from './constants';
import {EarningRecord} from './earning-record';
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
  simulateFutureEarningsYears(numYears: number, wage: number) {
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
  private totalIndexedEarnings_: number = 0;
  totalIndexedEarnings(): number {
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

  /*
   * Recipient's normal retirement age.
   */
  normalRetirementAge(): MonthDuration {
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

    return MonthDuration.initFromYearsMonths({
      years: retirementAgeBracket.ageYears,
      months: retirementAgeBracket.ageMonths
    });
  }

  /*
   * Recipient's normal retirement date.
   */
  normalRetirementDate(): MonthDate {
    return this.birthdate_.ssaBirthMonthDate().addDuration(
        this.normalRetirementAge());
  };


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
      this.earningsRecords_[i].isTop35EarningsYear = false;
    }

    this.futureEarningsRecords_.sort((a, b) => a.year - b.year);
    for (let i = 0; i < this.futureEarningsRecords_.length; ++i) {
      this.futureEarningsRecords_[i].indexingYear = indexingYear;
      this.futureEarningsRecords_[i].isTop35EarningsYear = false;
    }

    this.top35IndexedEarnings_ =
        this.earningsRecords_.concat(this.futureEarningsRecords_);
    this.top35IndexedEarnings_.sort((a, b) => {
      // Prefer higher indexed earnings, break ties by by older years.
      if (a.indexedEarnings() != b.indexedEarnings()) {
        return b.indexedEarnings() - a.indexedEarnings();
      } else {
        return a.year - b.year;
      }
    });
    // Remove all but the top 35 years.
    this.top35IndexedEarnings_.splice(constants.SSA_EARNINGS_YEARS);
    // Calculate the total indexed earnings and mark the top 35 years.
    this.totalIndexedEarnings_ = 0;
    for (let i = 0; i < this.top35IndexedEarnings_.length; ++i) {
      this.top35IndexedEarnings_[i].isTop35EarningsYear = true;
      // Attempt to deal with floating point precision issues by operating
      // in integer cents, dividing by 100 at the end. This is not perfect.
      // TODO(issues/221): Use an arbitrary precision library.
      this.totalIndexedEarnings_ +=
          Math.round(100 * this.top35IndexedEarnings_[i].indexedEarnings());
    }
    this.totalIndexedEarnings_ /= 100;

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
  cutoffIndexedEarnings(): number {
    return this.top35IndexedEarnings_.length < constants.SSA_EARNINGS_YEARS ?
        0 :
        this.top35IndexedEarnings_[this.top35IndexedEarnings_.length - 1]
            .indexedEarnings();
  }

  /**
   * Monthly indexed earnings for the top 35 years of earnings.
   */
  monthlyIndexedEarnings(): number {
    return Math.floor(
        this.totalIndexedEarnings_ / 12 / constants.SSA_EARNINGS_YEARS);
  }

  /**
   * The Primary Insurance Amount (PIA) for this recipient.
   */
  pia(): PrimaryInsuranceAmount {
    return new PrimaryInsuranceAmount(this);
  }

}  // class Recipient
