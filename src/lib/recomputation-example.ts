/**
 * Worked examples for the working-past-full-retirement-age guide.
 *
 * Each example builds a synthetic worker who is past full retirement age in
 * the latest year the constants cover, gives them a career, and then adds
 * one more year of earnings. The difference between the two PIAs is the
 * raise Social Security's automatic recomputation would produce.
 *
 * Every figure this module returns is derived from constants.ts, so the
 * guide's table follows the annual update. The guide's *prose* does not:
 * the salary inputs it passes in, and any sentence naming a bend-point
 * percentage or a ratio between rows, are hand-written and still need a
 * read each year. `aimeWithinSecondBracket` exists so one of those
 * sentences fails a test rather than going quietly stale.
 */

import { benefitAtAge } from './benefit-calculator';
import { Birthdate } from './birthday';
import * as constants from './constants';
import { EarningRecord } from './earning-record';
import { Money } from './money';
import { MonthDuration } from './month-time';
import { Recipient } from './recipient';

/**
 * How the synthetic career's indexed earnings move over time. A rising
 * career starts at half the wage and climbs to the wage in its final year,
 * which is the usual shape and the reason the year it displaces is a low
 * one. A flat career earns the same indexed amount every year. A
 * single-year career is flat whichever shape is asked for, since there is
 * nothing to rise from.
 */
export type CareerShape = 'rising' | 'flat';

export interface RecomputationExampleInput {
  /** Years of earnings before the extra year. A positive integer. */
  readonly careerYears: number;
  /**
   * Indexed earnings target for the final career year. Because that year
   * falls after the worker's age-60 year, where the index factor is 1.0,
   * it is also that year's nominal salary. Earlier years are scaled so
   * they index to the same target (or to the rising ramp toward it).
   *
   * A target above a year's taxable maximum cannot be reached: the record
   * is capped at the maximum, so the career becomes a maximum-earnings
   * career for every year where the target exceeds the cap.
   */
  readonly wage: Money;
  /** Salary in the extra year. Defaults to wage. */
  readonly extraYearWage?: Money;
  readonly shape?: CareerShape;
}

export interface RecomputationExample {
  /** Echoed so a caller's labels can track the figures. */
  readonly careerYears: number;
  readonly shape: CareerShape;
  readonly birthYear: number;
  readonly extraYear: number;
  /** The extra year's earnings after the taxable-maximum cap. */
  readonly extraYearWage: Money;
  readonly piaBefore: Money;
  readonly piaAfter: Money;
  /** Always non-negative: a new year never lowers a benefit. */
  readonly monthlyIncrease: Money;
  /** How much the extra year raises the 35-year monthly average. */
  readonly aimeIncrease: Money;
  /**
   * The raise the benefit formula alone produces, before the
   * cost-of-living adjustments since the worker turned 62. The guide walks
   * a reader through the formula, so it needs the intermediate figure to
   * avoid an arithmetic gap the reader cannot close.
   */
  readonly unadjustedIncrease: Money;
  /**
   * Indexed earnings of the year the extra year displaces: the lowest of
   * the 35 that counted. Null when the career is shorter than 35 years,
   * where the extra year fills an empty slot instead of displacing
   * anything. Null rather than $0, because $0 is itself a legal value.
   */
  readonly displacedYear: Money | null;
  /** The same raise as it reaches a check claimed at 62 and at 70. */
  readonly increaseIfClaimedAt62: Money;
  readonly increaseIfClaimedAt70: Money;
  /**
   * Whether the pre-recomputation AIME sits in the PIA formula's second
   * bracket, where 32 cents of each extra dollar is kept. The guide says
   * so in prose; this lets a test hold it.
   */
  readonly aimeWithinSecondBracket: boolean;
}

const RISING_START_FRACTION = 0.5;

/** Age of the example worker in the extra year. */
const EXAMPLE_WORKER_AGE = 68;

/**
 * A worker who reached full retirement age comfortably before the extra
 * year and is still short of 70, so both recomputation and delayed credits
 * apply. 68 rather than 67 keeps a full retirement age of exactly 67, which
 * later birth cohorts have, from landing inside the extra year itself.
 * Born mid-month to keep clear of the day-before-birthday rule.
 */
export function exampleWorker(): Recipient {
  const worker = new Recipient();
  worker.birthdate = Birthdate.FromYMD(
    constants.MAX_YEAR - EXAMPLE_WORKER_AGE,
    0,
    15
  );
  return worker;
}

/**
 * The nominal earnings that index to `target` in `year`, for a worker with
 * the given indexing year.
 *
 * This inverts the ratio in EarningRecord.indexFactor: years from the
 * indexing year on, and years past the wage index data, carry a factor of
 * 1.0, so their nominal and indexed amounts are equal. It deliberately does
 * not mirror that method's `year <= 1950` branch, which returns a factor of
 * 0.0 and cannot be inverted; recomputationExample rejects careers reaching
 * that far back instead.
 *
 * The result is a pre-cap amount. EarningRecord caps earnings at the year's
 * taxable maximum before indexing, so a target above that cap yields a
 * maximum-earnings year rather than the target.
 */
function nominalForIndexed(
  target: Money,
  year: number,
  indexingYear: number
): Money {
  if (year >= indexingYear || year > constants.MAX_WAGE_INDEX_YEAR) {
    return target;
  }
  const effectiveIndexingYear = Math.min(
    indexingYear,
    constants.MAX_WAGE_INDEX_YEAR
  );
  const ratio = constants.WAGE_INDICES[year].div$(
    constants.WAGE_INDICES[effectiveIndexingYear]
  );
  return target.times(ratio);
}

function indexedTarget(
  wage: Money,
  careerYears: number,
  shape: CareerShape,
  position: number
): Money {
  if (shape === 'flat' || careerYears === 1) return wage;
  const progress = position / (careerYears - 1);
  return wage.times(
    RISING_START_FRACTION + (1 - RISING_START_FRACTION) * progress
  );
}

/** The earnings years before the extra year, oldest first. */
function careerRecords(
  input: RecomputationExampleInput,
  shape: CareerShape,
  indexingYear: number
): EarningRecord[] {
  const lastYear = constants.MAX_YEAR - 1;
  const firstYear = lastYear - input.careerYears + 1;
  const records: EarningRecord[] = [];
  for (let year = firstYear; year <= lastYear; year++) {
    const target = indexedTarget(
      input.wage,
      input.careerYears,
      shape,
      year - firstYear
    );
    records.push(record(year, nominalForIndexed(target, year, indexingYear)));
  }
  return records;
}

/**
 * Rejects inputs that would produce a plausible-looking wrong answer. The
 * guide renders these figures as fact, so a degenerate career must fail
 * here rather than publish a number.
 */
function validate(input: RecomputationExampleInput): void {
  if (!Number.isInteger(input.careerYears) || input.careerYears < 1) {
    throw new Error(
      `careerYears must be a positive integer, got ${input.careerYears}`
    );
  }
  // Earnings cannot predate the wage index data, which nominalForIndexed
  // needs, nor the worker's own birth.
  const firstYear = constants.MAX_YEAR - input.careerYears;
  if (firstYear < constants.MIN_WAGE_INDEX_YEAR) {
    throw new Error(
      `careerYears of ${input.careerYears} reaches back to ${firstYear}, ` +
        `before wage index data begins in ${constants.MIN_WAGE_INDEX_YEAR}`
    );
  }
  if (input.careerYears >= EXAMPLE_WORKER_AGE) {
    throw new Error(
      `careerYears of ${input.careerYears} predates the example worker's birth`
    );
  }
  if (!input.wage.greaterThan(Money.from(0))) {
    throw new Error(`wage must be positive, got ${input.wage.string()}`);
  }
  if (input.extraYearWage?.lessThan(Money.from(0))) {
    throw new Error(
      `extraYearWage cannot be negative, got ${input.extraYearWage.string()}`
    );
  }
}

/** A wage year. Medicare earnings play no part in the PIA. */
function record(year: number, taxedEarnings: Money): EarningRecord {
  return new EarningRecord({
    year,
    taxedEarnings,
    taxedMedicareEarnings: taxedEarnings,
  });
}

export function recomputationExample(
  input: RecomputationExampleInput
): RecomputationExample {
  validate(input);
  const shape = input.shape ?? 'rising';

  const before = exampleWorker();
  const indexingYear = before.indexingYear();
  before.earningsRecords = careerRecords(input, shape, indexingYear);

  // A fresh set of records rather than the same instances: EarningsManager
  // rewrites each record in place when it reindexes, so sharing them would
  // leave `before` holding the 36-year top-35 selection.
  const after = exampleWorker();
  const extraYearWage = input.extraYearWage ?? input.wage;
  const extraRecord = record(constants.MAX_YEAR, extraYearWage);
  after.earningsRecords = [
    ...careerRecords(input, shape, indexingYear),
    extraRecord,
  ];

  // Below 40 credits no benefit is payable at all, so the difference
  // between the two careers would be the whole benefit becoming payable
  // rather than a recomputation raise: a different phenomenon, and roughly
  // twenty times larger.
  if (!before.isEligible()) {
    throw new Error(
      `a ${input.careerYears}-year career leaves the worker uninsured ` +
        `(${before.earnedCredits()} of ${constants.MAX_CREDITS} credits), ` +
        'so the difference would not be a recomputation'
    );
  }

  const piaBefore = before.pia().primaryInsuranceAmount();
  const piaAfter = after.pia().primaryInsuranceAmount();
  const age = (years: number) =>
    MonthDuration.initFromYearsMonths({ years, months: 0 });
  const aime = before.monthlyIndexedEarnings();

  return {
    careerYears: input.careerYears,
    shape,
    birthYear: before.birthdate.ssaBirthYear(),
    extraYear: constants.MAX_YEAR,
    extraYearWage: Money.min(extraYearWage, extraRecord.earningsCap()),
    piaBefore,
    piaAfter,
    monthlyIncrease: piaAfter.sub(piaBefore),
    aimeIncrease: after.monthlyIndexedEarnings().sub(aime),
    unadjustedIncrease: after
      .pia()
      .primaryInsuranceAmountUnadjusted()
      .sub(before.pia().primaryInsuranceAmountUnadjusted()),
    displacedYear:
      input.careerYears < constants.SSA_EARNINGS_YEARS
        ? null
        : before.cutoffIndexedEarnings(),
    increaseIfClaimedAt62: benefitAtAge(after, age(62)).sub(
      benefitAtAge(before, age(62))
    ),
    increaseIfClaimedAt70: benefitAtAge(after, age(70)).sub(
      benefitAtAge(before, age(70))
    ),
    aimeWithinSecondBracket:
      aime.greaterThan(before.pia().firstBendPoint()) &&
      aime.lessThan(before.pia().secondBendPoint()),
  };
}
