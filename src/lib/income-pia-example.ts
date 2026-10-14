/**
 * Worked PIA examples for the income guides ($25k, $40k, $60k, $80k, $100k).
 *
 * Each guide assumes a worker whose 35 indexed years all equal one salary,
 * so the AIME is that salary over 12, and walks it through the benefit
 * formula using the bend points for workers first eligible in MAX_YEAR.
 * Every figure comes from constants.ts, so the guides follow the annual
 * update instead of quoting a year's bend points by hand.
 *
 * The walkthrough is the textbook formula on the exact AIME. It skips SSA's
 * rounding of the AIME down to the dollar and of the PIA down to the dime,
 * which would make the arithmetic on the page harder to follow for a
 * difference of under a dollar.
 */

import { Birthdate } from './birthday';
import * as constants from './constants';
import { Money } from './money';
import { PrimaryInsuranceAmount } from './pia';

/** One bracket of the PIA formula: the AIME it covers and what it pays. */
export interface PiaBracketLine {
  /** The portion of the AIME that falls in this bracket. */
  readonly base: Money;
  /** The bracket's replacement rate, e.g. 0.9 for 90%. */
  readonly rate: number;
  /** `base` times `rate`. */
  readonly amount: Money;
}

export interface IncomePiaExample {
  /** Year the worker turns 62, which fixes the bend points used. */
  readonly eligibilityYear: number;
  readonly annualIncome: Money;
  readonly aime: Money;
  readonly firstBendPoint: Money;
  readonly secondBendPoint: Money;
  /** 90% of the AIME up to the first bend point. */
  readonly firstBracket: PiaBracketLine;
  /** 32% of the AIME between the two bend points. */
  readonly secondBracket: PiaBracketLine;
  /** 15% of the AIME above the second bend point. */
  readonly thirdBracket: PiaBracketLine;
  /** Sum of the three brackets. */
  readonly pia: Money;
}

const MONTHS_PER_YEAR = 12;
const ELIGIBILITY_AGE = 62;
/** Earnings are indexed to the wage level of the year the worker turns 60. */
const YEARS_FROM_INDEXING_TO_ELIGIBILITY = 2;

function piaFormulaForEligibilityYear(year: number): PrimaryInsuranceAmount {
  return new PrimaryInsuranceAmount({
    isPiaOnly: false,
    overridePia: null,
    birthdate: Birthdate.FromYMD(year - ELIGIBILITY_AGE, 0, 15),
    indexingYear: () => year - YEARS_FROM_INDEXING_TO_ELIGIBILITY,
    monthlyIndexedEarnings: () => Money.zero(),
    isEligible: () => true,
  });
}

function bracket(base: Money, rate: number): PiaBracketLine {
  return { base, rate, amount: base.times(rate) };
}

export function incomePiaExample(annualIncome: Money): IncomePiaExample {
  if (annualIncome.value() < 0) {
    throw new Error(
      `annual income cannot be negative: ${annualIncome.string()}`
    );
  }
  const eligibilityYear = constants.MAX_YEAR;
  const formula = piaFormulaForEligibilityYear(eligibilityYear);
  const firstBendPoint = formula.firstBendPoint();
  const secondBendPoint = formula.secondBendPoint();
  const aime = annualIncome.div(MONTHS_PER_YEAR);
  const zero = Money.zero();

  const firstBracket = bracket(
    Money.min(aime, firstBendPoint),
    constants.BEFORE_BENDPOINT1_MULTIPLIER
  );
  const secondBracket = bracket(
    Money.max(zero, Money.min(aime, secondBendPoint).sub(firstBendPoint)),
    constants.BEFORE_BENDPOINT2_MULTIPLIER
  );
  const thirdBracket = bracket(
    Money.max(zero, aime.sub(secondBendPoint)),
    constants.AFTER_BENDPOINT2_MULTIPLIER
  );

  return {
    eligibilityYear,
    annualIncome,
    aime,
    firstBendPoint,
    secondBendPoint,
    firstBracket,
    secondBracket,
    thirdBracket,
    pia: firstBracket.amount
      .plus(secondBracket.amount)
      .plus(thirdBracket.amount),
  };
}
