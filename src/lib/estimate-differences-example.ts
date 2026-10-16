/**
 * Worked examples for the guide on why a Social Security benefit differs
 * from the estimate.
 *
 * Each function isolates one reason a figure from Social Security and the
 * check that arrives can disagree: an estimate that assumes you keep
 * working, cost-of-living adjustments that accrue from 62, the Medicare
 * premium taken out of the payment, and a spousal benefit based on the
 * worker's full-retirement-age amount rather than their actual check.
 *
 * Every figure is derived from constants.ts and the benefit calculator, so
 * the guide's numbers follow the annual update. The example inputs and any
 * sentence in the guide naming a bracket or a percentage are hand-written,
 * and the golden test pins the figures so a constants change prompts a
 * re-read of that prose.
 */

import { benefitAtAge, spousalBenefitOnDate } from './benefit-calculator';
import { Birthdate } from './birthday';
import * as constants from './constants';
import { EarningRecord } from './earning-record';
import { Money } from './money';
import { type MonthDate, MonthDuration } from './month-time';
import { applyColas } from './pia';
import { Recipient } from './recipient';
import { nominalForIndexed } from './recomputation-example';

/** A round monthly amount the guide can reason about aloud. */
export const EXAMPLE_PIA: Money = Money.from(2000);

// ---------------------------------------------------------------------------
// Stopping work before the estimate assumes
// ---------------------------------------------------------------------------

/** Age of the stop-working example in the latest year the constants cover. */
const STOP_WORKING_AGE = 55;

/** Years of earnings already on the record, ending last year. */
const STOP_WORKING_CAREER_YEARS = 30;

/** A steady salary, in the latest year's wage level. */
export const STOP_WORKING_WAGE: Money = Money.from(80000);

export interface StopWorkingExample {
  readonly birthYear: number;
  readonly careerYears: number;
  readonly wage: Money;
  /** The year the worker reaches full retirement age. */
  readonly fraYear: number;
  /**
   * Years of future earnings the estimate assumes: this year through the
   * full-retirement-age year, inclusive, the same projection the calculator
   * starts from.
   */
  readonly projectedYears: number;
  /** Years of the 35 that count which hold $0 if the worker stops now. */
  readonly missingYearsIfStopped: number;
  /** The full-retirement-age benefit, in today's dollars, either way. */
  readonly piaIfKeepWorking: Money;
  readonly piaIfStopNow: Money;
  readonly difference: Money;
  /**
   * Whether both monthly averages sit between the bend points, where 32
   * cents of each dollar becomes benefit. The guide says so in prose.
   */
  readonly bothInSecondBracket: boolean;
}

/** A wage year. Medicare earnings play no part in the PIA. */
function record(year: number, taxedEarnings: Money): EarningRecord {
  return new EarningRecord({
    year,
    taxedEarnings,
    taxedMedicareEarnings: taxedEarnings,
  });
}

/**
 * A worker of STOP_WORKING_AGE with a flat career: every past year indexes
 * to STOP_WORKING_WAGE. Born mid-month to keep clear of the
 * day-before-birthday rule.
 */
function stopWorkingWorker(projectedYears: number): Recipient {
  const worker = new Recipient();
  worker.birthdate = Birthdate.FromYMD(
    constants.MAX_YEAR - STOP_WORKING_AGE,
    0,
    15
  );
  const indexingYear = worker.indexingYear();
  const lastPosted = constants.MAX_YEAR - 1;
  const records: EarningRecord[] = [];
  for (
    let year = lastPosted - STOP_WORKING_CAREER_YEARS + 1;
    year <= lastPosted;
    year++
  ) {
    records.push(
      record(year, nominalForIndexed(STOP_WORKING_WAGE, year, indexingYear))
    );
  }
  for (let i = 0; i < projectedYears; i++) {
    records.push(record(constants.MAX_YEAR + i, STOP_WORKING_WAGE));
  }
  worker.earningsRecords = records;
  return worker;
}

/**
 * The full-retirement-age benefit with and without the future earnings a
 * Social Security estimate assumes. Both are unadjusted PIAs: the worker is
 * years from 62, so no cost-of-living adjustment applies yet and the
 * figures are in today's dollars, as the estimate is.
 */
export function stopWorkingExample(): StopWorkingExample {
  const probe = stopWorkingWorker(0);
  const fraYear = probe.normalRetirementDate().year();
  const projectedYears = fraYear - constants.MAX_YEAR + 1;
  const keepWorking = stopWorkingWorker(projectedYears);
  const stopNow = probe;

  const inSecondBracket = (worker: Recipient): boolean => {
    const aime = worker.monthlyIndexedEarnings();
    return (
      aime.greaterThan(worker.pia().firstBendPoint()) &&
      aime.lessThan(worker.pia().secondBendPoint())
    );
  };

  const piaIfKeepWorking = keepWorking.pia().primaryInsuranceAmountUnadjusted();
  const piaIfStopNow = stopNow.pia().primaryInsuranceAmountUnadjusted();
  return {
    birthYear: stopNow.birthdate.ssaBirthYear(),
    careerYears: STOP_WORKING_CAREER_YEARS,
    wage: STOP_WORKING_WAGE,
    fraYear,
    projectedYears,
    missingYearsIfStopped: Math.max(
      0,
      constants.SSA_EARNINGS_YEARS - STOP_WORKING_CAREER_YEARS
    ),
    piaIfKeepWorking,
    piaIfStopNow,
    difference: piaIfKeepWorking.sub(piaIfStopNow),
    bothInSecondBracket:
      inSecondBracket(keepWorking) && inSecondBracket(stopNow),
  };
}

// ---------------------------------------------------------------------------
// Cost-of-living adjustments since 62
// ---------------------------------------------------------------------------

/** How many COLAs before the newest one the COLA example turns 62. */
const COLA_EXAMPLE_YEARS_BACK = 5;

export interface ColaYearRow {
  /** The year the COLA was announced. */
  readonly year: number;
  /** The COLA, in percent. */
  readonly cola: number;
  readonly piaBefore: Money;
  readonly piaAfter: Money;
  /** COLAs take effect with the December benefit, paid in January. */
  readonly firstPaidYear: number;
}

export interface ColaGrowthExample {
  readonly turned62In: number;
  readonly piaAt62: Money;
  readonly rows: readonly ColaYearRow[];
  /** The PIA after the newest published COLA. */
  readonly piaNow: Money;
  readonly increase: Money;
  /** In percent. */
  readonly percentIncrease: number;
}

/**
 * A worker whose PIA was EXAMPLE_PIA in the year they turned 62, followed
 * through every COLA since. A COLA applies from the year of eligibility
 * whether or not benefits have started.
 */
export function colaGrowthExample(): ColaGrowthExample {
  const turned62In = constants.MAX_COLA_YEAR - COLA_EXAMPLE_YEARS_BACK;
  const rows: ColaYearRow[] = [];
  let pia = EXAMPLE_PIA;
  for (let year = turned62In; year <= constants.MAX_COLA_YEAR; year++) {
    const after = applyColas(pia, year, year);
    rows.push({
      year,
      cola: constants.COLA[year],
      piaBefore: pia,
      piaAfter: after,
      firstPaidYear: year + 1,
    });
    pia = after;
  }
  const increase = pia.sub(EXAMPLE_PIA);
  return {
    turned62In,
    piaAt62: EXAMPLE_PIA,
    rows,
    piaNow: pia,
    increase,
    percentIncrease: increase.div$(EXAMPLE_PIA) * 100,
  };
}

// ---------------------------------------------------------------------------
// The Medicare premium comes out first
// ---------------------------------------------------------------------------

export interface MedicareDeductionExample {
  readonly benefit: Money;
  readonly premiumYear: number;
  readonly premium: Money;
  readonly deposit: Money;
}

/**
 * EXAMPLE_PIA as a monthly benefit, less the newest standard Part B premium.
 * Social Security deducts the premium first and then rounds the payment down
 * to a whole dollar, so the deposit never has cents.
 */
export function medicareDeductionExample(): MedicareDeductionExample {
  const premiumYear = Math.max(
    ...Object.keys(constants.MEDICARE_PART_B_PREMIUM).map(Number)
  );
  const premium = constants.MEDICARE_PART_B_PREMIUM[premiumYear];
  return {
    benefit: EXAMPLE_PIA,
    premiumYear,
    premium,
    deposit: EXAMPLE_PIA.sub(premium).floorToDollar(),
  };
}

// ---------------------------------------------------------------------------
// Spousal benefits use the full-retirement-age amount
// ---------------------------------------------------------------------------

export interface SpousalExample {
  readonly workerBirthYear: number;
  readonly spouseBirthYear: number;
  readonly workerPia: Money;
  readonly workerBenefitAt70: Money;
  /** What many people expect: half of the worker's actual check. */
  readonly halfOfWorkerCheck: Money;
  readonly spousalAtFra: Money;
  readonly spousalAt62: Money;
}

/**
 * A worker turning 70 in the latest year the constants cover, with a PIA of
 * EXAMPLE_PIA, who claims at 70, and a spouse eight years younger with no
 * benefit of their own. Both born on the 2nd of the month, so each is their
 * age for the whole birth month and can file in it. PIAs are set directly,
 * so no COLAs apply and the figures are in today's dollars.
 */
export function spousalExample(): SpousalExample {
  const worker = new Recipient();
  worker.birthdate = Birthdate.FromYMD(constants.MAX_YEAR - 70, 0, 2);
  worker.setPia(EXAMPLE_PIA);

  const spouse = new Recipient();
  spouse.birthdate = Birthdate.FromYMD(constants.MAX_YEAR - 62, 0, 2);
  spouse.setPia(Money.from(0));

  const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
  const age62 = MonthDuration.initFromYearsMonths({ years: 62, months: 0 });
  const workerFiling = worker.birthdate.dateAtSsaAge(age70);
  const workerBenefitAt70 = benefitAtAge(worker, age70);

  const spousalFiledOn = (filing: MonthDate): Money =>
    spousalBenefitOnDate(spouse, worker, workerFiling, filing, filing);

  return {
    workerBirthYear: worker.birthdate.ssaBirthYear(),
    spouseBirthYear: spouse.birthdate.ssaBirthYear(),
    workerPia: EXAMPLE_PIA,
    workerBenefitAt70,
    halfOfWorkerCheck: workerBenefitAt70.div(2).floorToDollar(),
    spousalAtFra: spousalFiledOn(spouse.normalRetirementDate()),
    spousalAt62: spousalFiledOn(spouse.birthdate.dateAtSsaAge(age62)),
  };
}
