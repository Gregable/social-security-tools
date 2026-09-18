/**
 * Worked examples for the working-past-full-retirement-age guide.
 *
 * Each example builds a synthetic worker who is past full retirement age in
 * the latest year the constants cover, gives them a career, and then adds
 * one more year of earnings. The difference between the two PIAs is the
 * raise Social Security's automatic recomputation would produce. Because
 * the numbers come from the same code as the calculator, the guide's
 * figures track constants.ts instead of going stale.
 */

import { Birthdate } from './birthday';
import * as constants from './constants';
import { EarningRecord } from './earning-record';
import { Money } from './money';
import { Recipient } from './recipient';

/**
 * How the synthetic career's indexed earnings move over time. A rising
 * career starts at half the wage and climbs to the wage in its final year,
 * which is the usual shape and the reason one more year normally helps. A
 * flat career earns the same indexed amount every year.
 */
export type CareerShape = 'rising' | 'flat';

export interface RecomputationExampleInput {
  /** Years of earnings before the extra year. */
  readonly careerYears: number;
  /** Salary in the final career year, in that year's dollars. */
  readonly wage: Money;
  /** Salary in the extra year. Defaults to wage. */
  readonly extraYearWage?: Money;
  readonly shape?: CareerShape;
}

export interface RecomputationExample {
  readonly birthYear: number;
  readonly extraYear: number;
  readonly extraYearWage: Money;
  readonly piaBefore: Money;
  readonly piaAfter: Money;
  readonly monthlyIncrease: Money;
  /**
   * Indexed earnings of the lowest year that counted before the extra year:
   * the 35th-highest year, or $0 when the career is shorter than 35 years.
   */
  readonly lowestCountedYear: Money;
}

const RISING_START_FRACTION = 0.5;

/**
 * A worker who reached full retirement age before the extra year and is
 * still short of 70, so both recomputation and delayed credits apply.
 * Born mid-month to keep clear of the day-before-birthday rule.
 */
export function exampleWorker(): Recipient {
  const worker = new Recipient();
  worker.birthdate = Birthdate.FromYMD(constants.MAX_YEAR - 67, 0, 15);
  return worker;
}

/**
 * The nominal earnings that index to `target` in `year` for a worker with
 * the given indexing year. Mirrors EarningRecord.indexFactor: years from the
 * indexing year on, and years past the wage index data, carry a factor of
 * 1.0, so their nominal and indexed amounts are the same.
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
  input: RecomputationExampleInput,
  position: number
): Money {
  if ((input.shape ?? 'rising') === 'flat' || input.careerYears < 2) {
    return input.wage;
  }
  const progress = position / (input.careerYears - 1);
  return input.wage.times(
    RISING_START_FRACTION + (1 - RISING_START_FRACTION) * progress
  );
}

/** A wage year. Medicare earnings play no part in the PIA. */
function record(year: number, taxedEarnings: Money): EarningRecord {
  return new EarningRecord({
    year,
    taxedEarnings,
    taxedMedicareEarnings: taxedEarnings,
  });
}

function careerRecords(
  input: RecomputationExampleInput,
  indexingYear: number
): EarningRecord[] {
  const lastYear = constants.MAX_YEAR - 1;
  const firstYear = lastYear - input.careerYears + 1;
  const records: EarningRecord[] = [];
  for (let year = firstYear; year <= lastYear; year++) {
    const target = indexedTarget(input, year - firstYear);
    records.push(record(year, nominalForIndexed(target, year, indexingYear)));
  }
  return records;
}

function lowestCountedYear(worker: Recipient): Money {
  const indexed = worker.earningsRecords
    .map((record) => record.indexedEarnings())
    .sort((a, b) => b.cents() - a.cents());
  return indexed[constants.SSA_EARNINGS_YEARS - 1] ?? Money.from(0);
}

function pia(worker: Recipient): Money {
  return worker.pia().primaryInsuranceAmount();
}

export function recomputationExample(
  input: RecomputationExampleInput
): RecomputationExample {
  const before = exampleWorker();
  const career = careerRecords(input, before.indexingYear());
  before.earningsRecords = career;

  const extraYearWage = input.extraYearWage ?? input.wage;
  const after = exampleWorker();
  after.earningsRecords = [
    ...career,
    record(constants.MAX_YEAR, extraYearWage),
  ];

  const piaBefore = pia(before);
  const piaAfter = pia(after);
  return {
    birthYear: before.birthdate.ssaBirthYear(),
    extraYear: constants.MAX_YEAR,
    extraYearWage,
    piaBefore,
    piaAfter,
    monthlyIncrease: piaAfter.sub(piaBefore),
    lowestCountedYear: lowestCountedYear(before),
  };
}
