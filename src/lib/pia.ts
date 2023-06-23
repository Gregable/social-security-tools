import * as constants from './constants';
import {Recipient} from './recipient';

/**
 * Floors a number to the nearest dime (1 significant figure).
 * e.g. 1.266 -> 1.20
 */
function nearestDime(input: number) {
  return Math.floor(input * 10) / 10;
}

/**
 * Floors a number to the nearest penny (2 significant figures).
 * e.g. 1.266 -> 1.26
 */
function nearestPenny(input: number): number {
  return Math.floor(input * 100) / 100;
}

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
    const effectiveIndexingYear =
        Math.min(this.recipient_.indexingYear(), constants.MAX_WAGE_INDEX_YEAR);
    const wage_in_1977 = constants.WAGE_INDICES[1977];
    const wage = constants.WAGE_INDICES[effectiveIndexingYear];
    return wage / wage_in_1977;
  }

  /**
   * Returns the first monthly bend point in the PIA formula.
   */
  firstBendPoint(): number {
    return Math.round(constants.BENDPOINT1_IN_1977 * this.wageRatio());
  }

  /**
   * Returns the second monthly bend point in the PIA formula.
   */
  secondBendPoint(): number {
    return Math.round(constants.BENDPOINT2_IN_1977 * this.wageRatio());
  }

  /**
   * Returns the PIA component for a specific breakpoint bracket for any
   * monthly indexed earnings.
   * @param totalIndexedEarnings monthly indexed earnings to compute
   * @param bracket Which component of the bend point: Must be 0, 1 or 2
   * @return benefit in that bracket for this earnings.
   */
  primaryInsuranceAmountForEarningsByBracket(
      totalIndexedEarnings: number, bracket: number): number {
    assert(bracket == 0 || bracket == 1 || bracket == 2);

    totalIndexedEarnings = Math.round(totalIndexedEarnings);
    let firstBend = this.firstBendPoint();
    let secondBend = this.secondBendPoint();

    if (bracket == 0) {
      return nearestPenny(
          Math.min(totalIndexedEarnings, firstBend) *
          constants.BEFORE_BENDPOINT1_MULTIPLIER);
    } else if (bracket == 1) {
      return nearestPenny(
          Math.max(
              0, (Math.min(totalIndexedEarnings, secondBend) - firstBend)) *
          constants.BEFORE_BENDPOINT2_MULTIPLIER);
    } else if (bracket == 2) {
      return nearestPenny(
          Math.max(0, totalIndexedEarnings - secondBend) *
          constants.AFTER_BENDPOINT2_MULTIPLIER);
    }
  };
};
