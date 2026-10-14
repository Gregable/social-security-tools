import { benefitAtAge } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { MAX_YEAR, MAXIMUM_EARNINGS } from '$lib/constants';
import { EarningRecord } from '$lib/earning-record';
import type { Money } from '$lib/money';
import type { MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

/**
 * Creates a Recipient with maximum earnings for every year starting at age 22.
 *
 * This is useful for calculating the maximum possible Social Security
 * benefit for someone born in a given year. Age 22 is used as a typical
 * starting age for someone entering the workforce after college.
 *
 * @param birthYear - The year the person was born
 * @param endYear - The last year to include earnings for (exclusive).
 *                  Defaults to MAX_YEAR from constants.
 * @returns A Recipient configured with maximum earnings records
 */
export function createMaxEarnerForBirthYear(
  birthYear: number,
  endYear: number = MAX_YEAR
): Recipient {
  const recipient = new Recipient();
  recipient.birthdate = Birthdate.FromYMD(birthYear, 0, 2);

  const records: EarningRecord[] = [];
  const startAge = 22;
  const start = birthYear + startAge;
  for (let y = start; y < endYear; y++) {
    if (MAXIMUM_EARNINGS[y]) {
      records.push(
        new EarningRecord({
          year: y,
          taxedEarnings: MAXIMUM_EARNINGS[y],
          taxedMedicareEarnings: MAXIMUM_EARNINGS[y],
        })
      );
    }
  }
  recipient.earningsRecords = records;
  return recipient;
}

/**
 * The monthly benefit of a maximum earner who reaches `age` in `year` and
 * files then, as SSA states it for retirement in January of that year.
 *
 * A COLA announced in October is first paid the following January, so a
 * benefit for `year` carries the COLAs through `year - 1` and no later ones.
 * Pinning that explicitly, rather than taking the COLAs applied as of today,
 * keeps past years from absorbing later increases and lets the newest year
 * include the COLA announced for it before January arrives.
 *
 * By default the worker is born in `year` minus `age` rounded to whole
 * years. A caller following a different cohort convention, such as SSA's
 * "worker reaching full retirement age" figure, passes `birthYear`.
 */
export function maximumBenefitInYear(
  age: MonthDuration,
  year: number,
  birthYear: number = year - age.roundedYears()
): Money {
  if (year > MAX_YEAR) {
    throw new Error(
      `no SSA figures for ${year} yet; constants run through MAX_YEAR ${MAX_YEAR}`
    );
  }
  const recipient = createMaxEarnerForBirthYear(birthYear, year);
  return benefitAtAge(recipient, age, year - 1);
}
