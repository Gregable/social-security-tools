import * as constants from "./constants";
import { Money } from "./money";
import type { Recipient } from "./recipient";

/**
 * A PrimaryInsuranceAmount object manages calculating the user's PIA.
 */
export class PrimaryInsuranceAmount {
  /**
   * The recipient for whom the PIA is being calculated.
   */
  private recipient_: Recipient;

  constructor(recipient: Recipient) {
    this.recipient_ = recipient;
  }

  /**
   * Returns the ratio of the average wage in indexingYear to the
   * average wage in 1977.
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
   * Returns the first monthly bend point in the PIA formula.
   */
  firstBendPoint(): Money {
    return constants.BENDPOINT1_IN_1977.times(this.wageRatio()).roundToDollar();
  }

  /**
   * Returns the second monthly bend point in the PIA formula.
   */
  secondBendPoint(): Money {
    return constants.BENDPOINT2_IN_1977.times(this.wageRatio()).roundToDollar();
  }

  /**
   * Returns the PIA component for a specific breakpoint bracket for any
   * monthly indexed earnings.
   * @param bracket Which component of the bend point: Must be 0, 1 or 2
   * @return benefit in that bracket for this earnings.
   */
  primaryInsuranceAmountByBracket(bracket: number): Money {
    if (bracket != 0 && bracket != 1 && bracket != 2) {
      throw new Error("Invalid bracket: " + bracket);
    }
    if (this.recipient_.isPiaOnly) {
      throw new Error("Cannot calculate PIA brackets for PIA-only recipient");
    }
    // If the recipient is not eligible for benefits, return $0.
    if (!this.recipient_.isEligible()) {
      return Money.from(0);
    }

    let aime = this.recipient_.monthlyIndexedEarnings().roundToDollar();
    let firstBend = this.firstBendPoint();
    let secondBend = this.secondBendPoint();

    if (bracket == 0) {
      return Money.min(aime, firstBend).times(
        constants.BEFORE_BENDPOINT1_MULTIPLIER
      );
    } else if (bracket == 1) {
      return Money.max(
        Money.from(0),
        Money.min(aime, secondBend).sub(firstBend)
      ).times(constants.BEFORE_BENDPOINT2_MULTIPLIER);
    } else if (bracket == 2) {
      return Money.max(Money.from(0), aime.sub(secondBend)).times(
        constants.AFTER_BENDPOINT2_MULTIPLIER
      );
    }
  }

  /**
   * Returns the total monthly full benefit summed across all benefit brackets,
   * not adjusted for cost of living.
   */
  primaryInsuranceAmountUnadjusted(): Money {
    if (this.recipient_.isPiaOnly) {
      throw new Error("Cannot calculate unadjusted PIA for PIA-only recipient");
    }
    let sum = Money.from(0);
    for (let i = 0; i < 3; ++i)
      sum = sum.plus(this.primaryInsuranceAmountByBracket(i));
    // Primary Insurance amounts are always rounded down the the nearest dime.
    // Who decided this was an important step?
    return sum.floorToDime();
  }

  /**
   * Returns the total monthly full benefit summed across all benefit brackets,
   * then adjusted for cost of living.
   */
  primaryInsuranceAmount(): Money {
    if (this.recipient_.isPiaOnly) {
      return this.recipient_.overridePia;
    }

    let pia = this.primaryInsuranceAmountUnadjusted();

    for (
      let year = this.recipient_.birthdate.yearTurningSsaAge(62);
      year < constants.CURRENT_YEAR;
      ++year
    ) {
      pia = pia.times(1 + constants.COLA[year] / 100.0);
      // Primary Insurance amounts are rounded down to the nearest dime.
      pia = pia.floorToDime();
    }
    return pia;
  }

  /**
   * Returns the Primary Insurance Amount for this recipient as though they
   * had an AIME of the given amount.
   * @param aime The AIME to use for the simulated calculation.
   */
  piaFromAIME(aime: Money): Money {
    aime = aime.roundToDollar();

    let pia = Money.from(0);

    let firstBend = this.firstBendPoint();
    let secondBend = this.secondBendPoint();

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

    // Now adjust for COLA.
    for (
      let year = this.recipient_.birthdate.yearTurningSsaAge(62);
      year < constants.CURRENT_YEAR;
      ++year
    ) {
      pia = pia.times(1 + constants.COLA[year] / 100.0);
      // Primary Insurance amounts are rounded down to the nearest dime.
      pia = pia.floorToDime();
    }
    return pia;
  }

  /**
   * Returns true if the recipient is old enough (62) to receive a COLA
   * adjustment.
   */
  shouldAdjustForCOLA(): boolean {
    return (
      this.recipient_.birthdate.yearTurningSsaAge(62) <= constants.MAX_COLA_YEAR
    );
  }

  /**
   * Returns an array of adjustments to be displayed to the user. Each record
   * has the year, the adjustment rate, and the starting/ending values.
   */
  colaAdjustments(): Array<ColaAdjustment> {
    let adjusted = this.primaryInsuranceAmountUnadjusted();

    let adjustments: Array<ColaAdjustment> = [];
    for (
      let year = this.recipient_.birthdate.yearTurningSsaAge(62);
      year <= constants.CURRENT_YEAR;
      ++year
    ) {
      if (constants.COLA[year] !== undefined) {
        let newadjusted = adjusted.times(1 + constants.COLA[year] / 100.0);
        // Primary Insurance amounts are rounded down to the nearest dime.
        newadjusted = newadjusted.floorToDime();

        let adjustment = new ColaAdjustment();
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
 * Return value for colaAdjustments() function. Stores fields describing
 * a single COLA adjustment.
 */
class ColaAdjustment {
  /**
   * The year of the adjustment.
   */
  year: number;
  /**
   * The COLA rate for the year, as a fraction.
   */
  cola: number;
  /**
   * The starting value for the user's PIA before the adjustment.
   */
  start: Money;
  /**
   * The ending value for the user's PIA after the adjustment.
   * This is also the `.start` value for the next year.
   */
  end: Money;
}
