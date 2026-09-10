import { COLA, MAX_COLA_YEAR } from './constants';

/**
 * Last year in which a COLA took effect mid-year rather than in December.
 *
 * Adjustments announced for 1975 through 1982 took effect with benefits
 * payable for June of the same year. From 1983 on, a COLA takes effect with
 * benefits payable for December, which beneficiaries receive the following
 * January.
 */
const LAST_MIDYEAR_COLA_YEAR = 1982;

/**
 * One annual cost-of-living adjustment, carrying both of the years people use
 * to name it.
 *
 * `constants.COLA` is keyed the way SSA publishes its series, by the year an
 * adjustment is announced and takes effect. The public names an adjustment
 * after the year the larger payment actually arrives instead: the increase
 * announced in October 2025 is "the 2026 COLA". Readers search for that later
 * year, so anything user-facing should show `paymentYear`.
 */
export interface ColaAdjustment {
  /** Year SSA announced the adjustment. The key in `constants.COLA`. */
  readonly announcementYear: number;
  /** Calendar year in which the larger payment first arrives. */
  readonly paymentYear: number;
  /** Increase in whole percent, e.g. 2.8 for 2.8%. */
  readonly percent: number;
}

function toAdjustment(announcementYear: number): ColaAdjustment {
  return {
    announcementYear,
    paymentYear:
      announcementYear <= LAST_MIDYEAR_COLA_YEAR
        ? announcementYear
        : announcementYear + 1,
    percent: COLA[announcementYear],
  };
}

/** Every COLA on record, oldest first. */
export function colaHistory(): ColaAdjustment[] {
  return Object.keys(COLA)
    .map(Number)
    .sort((a, b) => a - b)
    .map(toAdjustment);
}

/** The most recent COLA, which is the increase currently being paid. */
export function latestCola(): ColaAdjustment {
  return toAdjustment(MAX_COLA_YEAR);
}

/** Arithmetic mean of every COLA on record, in whole percent. */
export function averageCola(): number {
  const percents = Object.values(COLA);
  return percents.reduce((sum, percent) => sum + percent, 0) / percents.length;
}
