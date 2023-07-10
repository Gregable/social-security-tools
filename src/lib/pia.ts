import * as constants from './constants';
import {Money} from './money';
import {Recipient} from './recipient';

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
   * @param totalIndexedEarnings monthly indexed earnings to compute
   * @param bracket Which component of the bend point: Must be 0, 1 or 2
   * @return benefit in that bracket for this earnings.
   */
  primaryInsuranceAmountForEarningsByBracket(
      totalIndexedEarnings: Money, bracket: number): Money {
    assert(bracket == 0 || bracket == 1 || bracket == 2);

    totalIndexedEarnings = totalIndexedEarnings.roundToDollar();
    let firstBend = this.firstBendPoint();
    let secondBend = this.secondBendPoint();

    if (bracket == 0) {
      return Money.min(totalIndexedEarnings, firstBend)
          .times(constants.BEFORE_BENDPOINT1_MULTIPLIER);
    } else if (bracket == 1) {
      return Money
          .max(
              Money.from(0),
              Money.min(totalIndexedEarnings, secondBend).sub(firstBend))
          .times(constants.BEFORE_BENDPOINT2_MULTIPLIER);
    } else if (bracket == 2) {
      return Money.max(Money.from(0), totalIndexedEarnings.sub(secondBend))
          .times(constants.AFTER_BENDPOINT2_MULTIPLIER);
    }
  };
};
