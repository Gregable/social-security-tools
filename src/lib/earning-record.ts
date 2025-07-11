import * as constants from '$lib/constants';
import { Money } from '$lib/money';

/**
 * EarningRecord class
 */
export class EarningRecord {
  /** Year of the record */
  year: number;
  /** Taxed earnings entry */
  taxedEarnings: Money;
  /** Taxed Medicare earnings entry */
  taxedMedicareEarnings: Money;

  /**
   * The year from which benefits are indexed for the PIA calculation.
   *
   * This is the year in which the worker turns 60. The value will be set
   * by the Recipient class when the worker's birthdate is known or updated.
   */
  indexingYear: number = -1;

  /**
   * The recipient's age in the year of the earnings record. This is the
   * SSA's definition of age, and will be the age of the recipient at the
   * end of the year. e.g. in the year they are born, their age will be 0.
   */
  age: number = -1;

  /** Is this one of the top 35 earnings years */
  isTop35EarningsYear: boolean = false;

  /**
   * ssa.gov records a specific sentinel string if the last year has
   * incomplete records, usually early in the year when taxes
   * have yet to be filed. If this is the case, we still record a record
   * to indicate a difference from a year with no earnings, however the
   * record is marked as incomplete.
   */
  incomplete: boolean = false;

  constructor(input: EarningRecordInput) {
    this.year = input.year;
    this.taxedEarnings = input.taxedEarnings;
    this.taxedMedicareEarnings = input.taxedMedicareEarnings;
  }

  /**
   * @return maximum earnings cap for the year of the record.
   */
  earningsCap(): Money {
    if (this.year < constants.MIN_MAXIMUM_EARNINGS_YEAR) {
      return constants.MAXIMUM_EARNINGS[constants.MIN_MAXIMUM_EARNINGS_YEAR];
    } else if (this.year <= constants.MAX_MAXIMUM_EARNINGS_YEAR) {
      return constants.MAXIMUM_EARNINGS[this.year];
    } else {
      return constants.MAXIMUM_EARNINGS[constants.MAX_MAXIMUM_EARNINGS_YEAR];
    }
  }

  /**
   * @return amount of earnings in a given year required to earn one credit.
   */
  earningsRequiredPerCredit(): Money {
    if (this.year < 1978) {
      return constants.EARNINGS_PER_CREDIT_BEFORE_1978;
    } else if (this.year > constants.MAX_YEAR) {
      return constants.EARNINGS_PER_CREDIT[constants.MAX_YEAR];
    } else {
      return constants.EARNINGS_PER_CREDIT[this.year];
    }
  }

  /**
   * @return number of credits earned in the year of the record.
   */
  credits(): number {
    return Math.min(
      4,
      Math.floor(this.taxedEarnings.div$(this.earningsRequiredPerCredit()))
    );
  }

  /**
   * Returns the index factor for the year of the record. If the user is
   * over 60, the index factor is 1.0. Otherwise, the index factor is the
   * ratio of the average wage index for the year of the record to the
   * average wage index for the year of the PIA calculation.
   */
  indexFactor(): number {
    if (this.indexingYear < 0) {
      throw new Error('EarningRecord not initialized with indexingYear');
    }

    if (this.year >= this.indexingYear) {
      // Years after the indexing year are always indexed at 1.0.
      return 1.0;
    } else if (this.year <= 1950) {
      // Years before 1950 are not indexed. I'm not certain, but I don't
      // think they are used in the PIA calculation. I suspect this is moot
      // as they won't appear in the earnings record either.
      return 0.0;
    } else if (this.year > constants.MAX_WAGE_INDEX_YEAR) {
      // The year is beyond the WAGE_INDICES data range which is ~2 years
      // behind the current year. The indices aren't known until all tax
      // returns are in during the following year, which doesn't happen until
      // the end of the year, effectively making the data 2 years behind.
      // Assume the index factor is 1.0.
      return 1.0;
    } else {
      // If the indexing year is beyond the WAGE_INDICES data range, use the
      // maximum year in the data range.
      const effectiveIndexingYear = Math.min(
        this.indexingYear,
        constants.MAX_WAGE_INDEX_YEAR
      );

      // The year is in the WAGE_INDICES data range and is before the indexing
      // year. Compute the index factor.
      return constants.WAGE_INDICES[effectiveIndexingYear].div$(
        constants.WAGE_INDICES[this.year]
      );
    }
  }

  /**
   * @return indexed earnings for this record.
   */
  indexedEarnings(): Money {
    if (this.indexingYear < 0) {
      throw new Error('EarningRecord not initialized with indexingYear');
    }

    const cappedEarning: Money = Money.min(
      this.earningsCap(),
      this.taxedEarnings
    );
    const factor: number = this.indexFactor();
    return cappedEarning.times(factor);
  }
}

/**
 * Input for EarningRecord constructor
 */
interface EarningRecordInput {
  year: number;
  taxedEarnings: Money;
  taxedMedicareEarnings: Money;
}
