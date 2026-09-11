import type { DeathProbability } from '$lib/life-tables';
import { getDeathProbabilityDistribution } from '$lib/life-tables';
import { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import type {
  CoupleFilingAgeResult,
  FilingAgeResult,
} from '$lib/strategy/calculations/expected-npv';
import {
  expectedNPVCoupleOptimized,
  expectedNPVSingle,
} from '$lib/strategy/calculations/expected-npv';
import { filingAgeRange } from '$lib/strategy/calculations/strategy-calc';
import { buildStrategyHash } from '$lib/url-params';

/** Default assumptions matching the strategy optimizer's initial state. */
export const DEFAULT_DISCOUNT_RATE = 0.025;

export interface RecommendedFiling {
  readonly isSingle: boolean;
  readonly single?: FilingAgeResult;
  readonly couple?: CoupleFilingAgeResult;
}

/** Today's date as a MonthDate (SSA calculations operate on months). */
export function currentMonthDate(now: Date = new Date()): MonthDate {
  return MonthDate.initFromYearsMonths({
    years: now.getFullYear(),
    months: now.getMonth(),
  });
}

/**
 * Whether each recipient still has a filing age to choose, as of `currentDate`.
 *
 * False once a recipient is past 70: delayed retirement credits have stopped,
 * so filing now is their only remaining option and presenting a filing date
 * would imply a decision they no longer have. Index 1 is always true when
 * there is no second recipient, so single-recipient callers can ignore it.
 *
 * Shared so the two surfaces that render a recommendation — the strategy page
 * and the calculator's card — cannot disagree about who still has a choice.
 */
export function filingChoices(
  recipient: Recipient,
  spouse: Recipient | null,
  currentDate: MonthDate = currentMonthDate()
): [boolean, boolean] {
  return [
    filingAgeRange(recipient, currentDate).hasChoice,
    spouse ? filingAgeRange(spouse, currentDate).hasChoice : true,
  ];
}

/**
 * Loads mortality (death-probability) distributions for the recipient and, if
 * present, the spouse. The result depends on birth year, gender, and health
 * multiplier (not PIA), so callers can cache it and skip reloading when only
 * PIA changes.
 */
export async function loadDeathDistributions(
  recipient: Recipient,
  spouse: Recipient | null,
  currentYear: number = new Date().getFullYear()
): Promise<{ dist1: DeathProbability[]; dist2: DeathProbability[] | null }> {
  if (!spouse) {
    const dist1 = await getDeathProbabilityDistribution(recipient, currentYear);
    return { dist1, dist2: null };
  }
  const [dist1, dist2] = await Promise.all([
    getDeathProbabilityDistribution(recipient, currentYear),
    getDeathProbabilityDistribution(spouse, currentYear),
  ]);
  return { dist1, dist2 };
}

/**
 * Computes the single best filing recommendation from already-loaded
 * distributions. Pure and synchronous so it is cheap to re-run on PIA changes.
 * Returns null when inputs are insufficient or the optimizer yields nothing.
 */
export function recommendedFromDistributions(
  recipient: Recipient,
  spouse: Recipient | null,
  dist1: DeathProbability[],
  dist2: DeathProbability[] | null,
  currentDate: MonthDate,
  discountRate: number = DEFAULT_DISCOUNT_RATE
): RecommendedFiling | null {
  if (!spouse) {
    const results = expectedNPVSingle(
      recipient,
      currentDate,
      discountRate,
      dist1
    );
    if (results.length === 0) return null;
    return { isSingle: true, single: results[0] };
  }
  if (!dist2) return null;
  const results = expectedNPVCoupleOptimized(
    [recipient, spouse],
    currentDate,
    discountRate,
    [dist1, dist2]
  );
  if (results.length === 0) return null;
  return { isSingle: false, couple: results[0] };
}

function formatDob(r: Recipient): string {
  const bd = r.birthdate;
  const y = bd.layBirthYear();
  const m = (bd.layBirthMonth() + 1).toString().padStart(2, '0');
  const d = bd.layBirthDayOfMonth().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Builds the pre-filled `/strategy` URL for the recipient (and optional spouse).
 * Shared by RecommendedFilingCard and StrategyPromo so both links stay in sync.
 */
export function buildStrategyUrl(
  recipient: Recipient,
  spouse: Recipient | null
): string {
  const isSingle = !spouse;
  const name1 =
    recipient.name && recipient.name !== 'Self' ? recipient.name : undefined;
  const name2 =
    spouse?.name && spouse.name !== 'Spouse' ? spouse.name : undefined;
  const hash = buildStrategyHash({
    isSingle,
    pia1: recipient.pia().primaryInsuranceAmount().roundToDollar().value(),
    dob1: formatDob(recipient),
    name1,
    gender1:
      recipient.gender === 'male' || recipient.gender === 'female'
        ? recipient.gender
        : 'blended',
    pia2: spouse
      ? spouse.pia().primaryInsuranceAmount().roundToDollar().value()
      : undefined,
    dob2: spouse ? formatDob(spouse) : undefined,
    name2,
    gender2: spouse
      ? spouse.gender === 'male' || spouse.gender === 'female'
        ? spouse.gender
        : 'blended'
      : undefined,
  });
  return `/strategy${hash}`;
}
