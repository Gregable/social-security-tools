import { Birthdate } from '$lib/birthday';
import { MAX_YEAR, MAXIMUM_EARNINGS } from '$lib/constants';
import { EarningRecord } from '$lib/earning-record';
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
