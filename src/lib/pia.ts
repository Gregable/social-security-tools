import * as constants from './constants';
import { Money } from './money';
import type { Recipient } from './recipient';

/**
 * A PrimaryInsuranceAmount object manages calculating the user's Primary
 * Insurance Amount (PIA).
 *
 * The PIA is the basis for most Social Security benefit calculations. It
 * represents the amount a beneficiary would receive if they elected to begin
 * receiving retirement benefits at their Normal Retirement Age (NRA).
 */
export class PrimaryInsuranceAmount {
  /**
   * The recipient for whom the PIA is being calculated.
   * Contains all the personal information and earnings history needed for PIA.
   * @private
   */
  private recipient_: Recipient;

  constructor(recipient: Recipient) {
    this.recipient_ = recipient;
  }

  /**
   * Calculates the ratio of the average wage in indexingYear to the
   * average wage in 1977.
   *
   * This ratio is used to adjust the bend points in the PIA formula.
   *
   * @returns {number} The wage ratio used for indexing calculations
   * @private
   */
  private wageRatio(): number {
    // If the indexing year is beyond the WAGE_INDICES data range, use the
    // maximum year in the data range.
    const effectiveIndexingYear = Math.min(
      this.recipient_.indexingYear(),
      constants.MAX_WAGE_INDEX_YEAR
    );
    const wage_in_1977: Money = constants.WAGE_INDICES[1977];
    const wage: Money = constants.WAGE_INDICES[effectiveIndexingYear];
    return wage.div$(wage_in_1977);
  }

  /**
   * Calculates the first monthly bend point in the PIA formula.
   *
   * Bend points are the income thresholds in the PIA formula where the benefit
   * percentage changes. The first bend point marks where the rate changes
   * from 90% to 32% of AIME.
   *
   * @returns {Money} The first bend point amount adjusted for wage growth
   */
  firstBendPoint(): Money {
    return constants.BENDPOINT1_IN_1977.times(this.wageRatio()).roundToDollar();
  }

  /**
   * Calculates the second monthly bend point in the PIA formula.
   *
   * The second bend point marks where the benefit rate changes from 32% to 15%
   * of AIME.
   *
   * @returns {Money} The second bend point amount adjusted for wage growth
   */
  secondBendPoint(): Money {
    return constants.BENDPOINT2_IN_1977.times(this.wageRatio()).roundToDollar();
  }

  /**
   * Calculates the PIA component for a specific bend point bracket based on
   * the recipient's monthly indexed earnings.
   *
   * The PIA formula has three brackets with different benefit percentages:
   * - Bracket 0: 90% of AIME up to the first bend point
   * - Bracket 1: 32% of AIME between the first and second bend points
   * - Bracket 2: 15% of AIME above the second bend point
   *
   * @param {number} bracket - Which component: Must be 0, 1 or 2
   * @returns {Money} The benefit amount from the specified bracket
   * @throws {Error} If invalid bracket or if recipient is PIA-only
   */
  primaryInsuranceAmountByBracket(bracket: number): Money {
    if (bracket !== 0 && bracket !== 1 && bracket !== 2) {
      throw new Error(`Invalid bracket: ${bracket}`);
    }
    if (this.recipient_.isPiaOnly) {
      throw new Error('Cannot calculate PIA brackets for PIA-only recipient');
    }
    // If the recipient is not eligible for benefits, return $0.
    if (!this.recipient_.isEligible()) {
      return Money.from(0);
    }

    const aime = this.recipient_.monthlyIndexedEarnings().roundToDollar();
    const firstBend = this.firstBendPoint();
    const secondBend = this.secondBendPoint();

    if (bracket === 0) {
      return Money.min(aime, firstBend).times(
        constants.BEFORE_BENDPOINT1_MULTIPLIER
      );
    } else if (bracket === 1) {
      return Money.max(
        Money.from(0),
        Money.min(aime, secondBend).sub(firstBend)
      ).times(constants.BEFORE_BENDPOINT2_MULTIPLIER);
    } else if (bracket === 2) {
      return Money.max(Money.from(0), aime.sub(secondBend)).times(
        constants.AFTER_BENDPOINT2_MULTIPLIER
      );
    }
  }

  /**
   * Calculates the total monthly full benefit summed across all benefit brackets,
   * not adjusted for cost of living increases (COLAs).
   *
   * This is the initial PIA value before any COLA adjustments are applied.
   *
   * @returns {Money} The unadjusted PIA amount, rounded down to the nearest dime
   * @throws {Error} If recipient is PIA-only
   */
  primaryInsuranceAmountUnadjusted(): Money {
    if (this.recipient_.isPiaOnly) {
      throw new Error('Cannot calculate unadjusted PIA for PIA-only recipient');
    }
    let sum = Money.from(0);
    for (let i = 0; i < 3; ++i)
      sum = sum.plus(this.primaryInsuranceAmountByBracket(i));
    // Primary Insurance amounts are always rounded down the the nearest dime.
    // Who decided this was an important step?
    return sum.floorToDime();
  }

  /**
   * Calculates the total monthly full benefit summed across all benefit brackets,
   * then adjusted for cost of living increases (COLAs).
   *
   * This is the final PIA value that would be used to determine actual benefit
   * payments. COLAs are applied starting from the year the recipient turns 62.
   *
   * @returns {Money} The final PIA amount after all applicable COLA adjustments
   */
  primaryInsuranceAmount(): Money {
    if (this.recipient_.isPiaOnly) {
      return this.recipient_.overridePia;
    }

    const pia = this.primaryInsuranceAmountUnadjusted();
    return this.applyColaAdjustments(pia);
  }

  /**
   * Calculates the Primary Insurance Amount for this recipient as though they
   * had an AIME of the given amount.
   *
   * This method is useful for simulating different earnings scenarios without
   * changing the recipient's actual earnings record.
   *
   * @param {Money} aime - The AIME to use for the simulated calculation
   * @returns {Money} The PIA that would result from the specified AIME
   */
  piaFromAIME(aime: Money): Money {
    aime = aime.roundToDollar();

    let pia = Money.from(0);

    const firstBend = this.firstBendPoint();
    const secondBend = this.secondBendPoint();

    // First compute the unadjusted PIA from all 3 brackets.
    pia = pia.plus(
      Money.min(aime, firstBend).times(constants.BEFORE_BENDPOINT1_MULTIPLIER)
    );
    pia = pia.plus(
      Money.max(
        Money.from(0),
        Money.min(aime, secondBend).sub(firstBend)
      ).times(constants.BEFORE_BENDPOINT2_MULTIPLIER)
    );
    pia = pia.plus(
      Money.max(Money.from(0), aime.sub(secondBend)).times(
        constants.AFTER_BENDPOINT2_MULTIPLIER
      )
    );

    // Round to nearest dime.
    pia = pia.floorToDime();

    return this.applyColaAdjustments(pia);
  }

  /**
   * Applies COLA adjustments to a PIA value from the year the recipient turns 62
   * through the current year. Each year's adjustment is rounded down to the
   * nearest dime per SSA rules.
   *
   * @param pia - The unadjusted PIA to apply COLA to
   * @returns The COLA-adjusted PIA
   */
  private applyColaAdjustments(pia: Money): Money {
    let adjusted = pia;
    for (
      let year = this.recipient_.birthdate.yearTurningSsaAge(62);
      year < constants.CURRENT_YEAR;
      ++year
    ) {
      adjusted = adjusted.times(1 + constants.COLA[year] / 100.0);
      // Primary Insurance amounts are rounded down to the nearest dime.
      adjusted = adjusted.floorToDime();
    }
    return adjusted;
  }

  /**
   * Determines if the recipient is old enough (62+) to receive COLA adjustments.
   *
   * COLA adjustments are applied to the PIA starting from the year a person
   * turns 62, even if they don't claim benefits until later.
   *
   * @returns {boolean} True if eligible for COLA adjustments, false otherwise
   */
  shouldAdjustForCOLA(): boolean {
    return (
      this.recipient_.birthdate.yearTurningSsaAge(62) <= constants.MAX_COLA_YEAR
    );
  }

  /**
   * Generates a detailed breakdown of all COLA adjustments applied to the
   * recipient's PIA.
   *
   * This method calculates each year's COLA adjustment separately and returns
   * the information in a format suitable for display to the user.
   *
   * @returns {Array<ColaAdjustment>} Array of COLA adjustment records
   */
  colaAdjustments(): Array<ColaAdjustment> {
    let adjusted = this.primaryInsuranceAmountUnadjusted();

    const adjustments: Array<ColaAdjustment> = [];
    for (
      let year = this.recipient_.birthdate.yearTurningSsaAge(62);
      year <= constants.CURRENT_YEAR;
      ++year
    ) {
      if (constants.COLA[year] !== undefined) {
        let newadjusted = adjusted.times(1 + constants.COLA[year] / 100.0);
        // Primary Insurance amounts are rounded down to the nearest dime.
        newadjusted = newadjusted.floorToDime();

        const adjustment = new ColaAdjustment();
        adjustment.year = year;
        adjustment.cola = constants.COLA[year];
        adjustment.start = adjusted;
        adjustment.end = newadjusted;
        adjustments.push(adjustment);

        adjusted = newadjusted;
      }
    }
    return adjustments;
  }
}

/**
 * Represents a single Cost of Living Adjustment (COLA) applied to a
 * recipient's PIA.
 *
 * This class is used to store the details of each annual COLA adjustment
 * for display purposes, showing how a recipient's PIA changes over time
 * due to inflation adjustments.
 */
class ColaAdjustment {
  /**
   * The calendar year in which the COLA adjustment was applied.
   * @type {number}
   */
  year: number;
  /**
   * The COLA rate for the year, expressed as a percentage (e.g., 2.8 for 2.8%).
   * This value comes from the SSA's official COLA announcements.
   * @type {number}
   */
  cola: number;
  /**
   * The value of the recipient's PIA before applying this year's COLA.
   * @type {Money}
   */
  start: Money;
  /**
   * The value of the recipient's PIA after applying this year's COLA.
   * This amount becomes the starting value for the next year's adjustment.
   * @type {Money}
   */
  end: Money;
}
