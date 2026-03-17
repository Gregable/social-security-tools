import * as constants from '$lib/constants';
import {
  EarningRecord,
  type SerializedEarningRecord,
} from '$lib/earning-record';
import { Money } from '$lib/money';

/**
 * Manages earnings records and computes indexed earnings, top-35 years,
 * and future earnings simulation for a Social Security recipient.
 *
 * This class holds all earnings state and computation logic, separated from
 * the Recipient domain model and its pub/sub store contract.
 */
export class EarningsManager {
  private earningsRecords_: Array<EarningRecord> = [];
  private futureEarningsRecords_: Array<EarningRecord> = [];
  private top35IndexedEarnings_: Array<EarningRecord> = [];
  private totalIndexedEarnings_: Money = Money.from(0);

  get earningsRecords(): ReadonlyArray<EarningRecord> {
    return this.earningsRecords_;
  }
  set earningsRecords(records: ReadonlyArray<EarningRecord>) {
    this.earningsRecords_ = [...records];
  }

  get futureEarningsRecords(): ReadonlyArray<EarningRecord> {
    return this.futureEarningsRecords_;
  }
  set futureEarningsRecords(records: ReadonlyArray<EarningRecord>) {
    this.futureEarningsRecords_ = [...records];
  }

  /**
   * Initializes an array of earnings records with indexing year and age.
   * Sorts the records by year ascending and resets isTop35EarningsYear.
   */
  private initializeRecords_(
    records: EarningRecord[],
    indexingYear: number,
    birthYear: number
  ): void {
    records.sort((a, b) => a.year - b.year);
    for (const record of records) {
      record.indexingYear = indexingYear;
      record.age = record.year - birthYear;
      record.isTop35EarningsYear = false;
    }
  }

  /**
   * Reindexes all earnings records and recalculates the top 35 years.
   * Must be called after any change to earnings records or birthdate.
   *
   * @param indexingYear The year used for wage indexing (age 60 year)
   * @param birthYear The recipient's SSA birth year
   */
  reindex(indexingYear: number, birthYear: number): void {
    this.initializeRecords_(this.earningsRecords_, indexingYear, birthYear);
    this.initializeRecords_(
      this.futureEarningsRecords_,
      indexingYear,
      birthYear
    );

    this.top35IndexedEarnings_ = this.earningsRecords_.concat(
      this.futureEarningsRecords_
    );
    this.top35IndexedEarnings_.sort((a, b) => {
      // Prefer higher indexed earnings, break ties by older years.
      const aEarnings = a.indexedEarnings();
      const bEarnings = b.indexedEarnings();
      if (!aEarnings.equals(bEarnings)) {
        return bEarnings.cents() - aEarnings.cents();
      }
      return a.year - b.year;
    });
    // Remove all but the top 35 years.
    this.top35IndexedEarnings_.splice(constants.SSA_EARNINGS_YEARS);
    // Calculate the total indexed earnings and mark the top 35 years.
    this.totalIndexedEarnings_ = Money.from(0);
    for (let i = 0; i < this.top35IndexedEarnings_.length; ++i) {
      this.top35IndexedEarnings_[i].isTop35EarningsYear = true;
      this.totalIndexedEarnings_ = this.totalIndexedEarnings_.plus(
        this.top35IndexedEarnings_[i].indexedEarnings()
      );
    }
  }

  /**
   * Total indexed earnings over the top 35 years.
   */
  totalIndexedEarnings(): Money {
    return this.totalIndexedEarnings_;
  }

  /**
   * Monthly indexed earnings for the top 35 years of earnings.
   */
  monthlyIndexedEarnings(): Money {
    return this.totalIndexedEarnings_
      .div(12)
      .div(constants.SSA_EARNINGS_YEARS)
      .floorToDollar();
  }

  /**
   * Minimum indexed earnings needed to affect the top 35 years of earnings.
   * If fewer than 35 years of earnings, this is always 0.
   */
  cutoffIndexedEarnings(): Money {
    return this.top35IndexedEarnings_.length < constants.SSA_EARNINGS_YEARS
      ? Money.from(0)
      : this.top35IndexedEarnings_[
          this.top35IndexedEarnings_.length - 1
        ].indexedEarnings();
  }

  hasEarningsBefore1978(): boolean {
    // Only check the first earnings record. Future records are after 1978.
    return this.earningsRecords_.length === 0
      ? false
      : this.earningsRecords_[0].year < 1978;
  }

  /**
   * The total number of credits earned from past earnings records.
   */
  earnedCredits(): number {
    const credits = this.earningsRecords_.reduce(
      (sum, record) => sum + record.credits(),
      0
    );
    return Math.min(40, credits);
  }

  /**
   * The total number of credits earned or to be earned from all records.
   */
  totalCredits(): number {
    const credits =
      this.earnedCredits() +
      this.futureEarningsRecords_.reduce(
        (sum, record) => sum + record.credits(),
        0
      );
    return Math.min(40, credits);
  }

  /**
   * Whether the recipient is eligible based on credits alone.
   */
  isEligible(): boolean {
    return this.totalCredits() >= 40;
  }

  /**
   * Calculates the start year for future earnings simulation.
   * @returns The year to start simulating future earnings from.
   */
  futureEarningsStartYear(): number {
    let startYear = constants.CURRENT_YEAR;
    if (this.earningsRecords_.length > 0) {
      const lastRecord =
        this.earningsRecords_[this.earningsRecords_.length - 1];
      if (
        lastRecord.year === constants.CURRENT_YEAR - 1 &&
        lastRecord.incomplete
      ) {
        startYear = constants.CURRENT_YEAR - 1;
      } else if (lastRecord.year >= constants.CURRENT_YEAR) {
        startYear = lastRecord.year + 1;
      }
    }
    return startYear;
  }

  /**
   * Caps a wage to the maximum earnings for a given year.
   */
  private capWageForYear_(wage: Money, year: number): Money {
    if (year <= constants.MAX_MAXIMUM_EARNINGS_YEAR) {
      return Money.min(wage, constants.MAXIMUM_EARNINGS[year]);
    }
    return Money.min(
      wage,
      constants.MAXIMUM_EARNINGS[constants.MAX_MAXIMUM_EARNINGS_YEAR]
    );
  }

  /**
   * Creates future earning records for the specified number of years.
   * @param numYears The number of years to simulate.
   * @param wage The wage to use for the simulation.
   */
  simulateFutureEarningsYears(numYears: number, wage: Money): void {
    this.futureEarningsRecords_ = [];
    const startYear = this.futureEarningsStartYear();

    for (let i = 0; i < numYears; ++i) {
      const cappedWage = this.capWageForYear_(wage, startYear + i);
      this.futureEarningsRecords_.push(
        new EarningRecord({
          year: startYear + i,
          taxedEarnings: cappedWage,
          taxedMedicareEarnings: cappedWage,
        })
      );
    }
  }

  /**
   * Sets custom future earnings records directly.
   * Used when user manually edits individual year values.
   * @param records Array of {year, wage} objects.
   */
  setCustomFutureEarnings(records: Array<{ year: number; wage: Money }>): void {
    this.futureEarningsRecords_ = [];

    for (const record of records) {
      const cappedWage = this.capWageForYear_(record.wage, record.year);
      this.futureEarningsRecords_.push(
        new EarningRecord({
          year: record.year,
          taxedEarnings: cappedWage,
          taxedMedicareEarnings: cappedWage,
        })
      );
    }
  }

  /**
   * Serializes earnings records for session storage.
   */
  serializeEarnings(): SerializedEarningRecord[] {
    return this.earningsRecords_.map((er) => er.serialize());
  }
}
