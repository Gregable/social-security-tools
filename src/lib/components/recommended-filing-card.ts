import type { DeathProbability } from '$lib/life-tables';
import { getDeathProbabilityDistribution } from '$lib/life-tables';
import { MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import {
  type AlreadyFiled,
  NOT_FILED,
} from '$lib/strategy/calculations/already-filed';
import type {
  CoupleFilingAgeResult,
  FilingAgeResult,
} from '$lib/strategy/calculations/expected-npv';
import {
  expectedNPVCoupleOptimized,
  expectedNPVSingle,
} from '$lib/strategy/calculations/expected-npv';
import { filingAgeRange } from '$lib/strategy/calculations/strategy-calc';
import { fetchRecommendedDiscountRate } from '$lib/strategy/data';
import type { StrategyMode } from '$lib/strategy/ui/strategy-mode';
import { buildStrategyHash } from '$lib/url-params';

/**
 * Discount rate used until the live 20-year Treasury rate arrives, and when
 * it cannot be fetched at all. Matches the strategy optimizer's fallback,
 * which is spelled out as literals in treasury-yields.ts and
 * DiscountRateInput.svelte; changing this constant alone will not change it.
 */
export const DEFAULT_DISCOUNT_RATE = 0.025;

/**
 * The discount rate the card computed with, and where it came from, so the
 * card's copy can say "the current 20-year Treasury rate" only when that is
 * actually true.
 */
export interface DiscountRateAssumption {
  readonly rate: number;
  readonly source: 'treasury' | 'default';
}

/** The assumption used before the Treasury fetch resolves and whenever it fails. */
export const DEFAULT_DISCOUNT_RATE_ASSUMPTION: DiscountRateAssumption = {
  rate: DEFAULT_DISCOUNT_RATE,
  source: 'default',
};

/**
 * The range of annual discount rates the strategy page's input accepts
 * (0% to 50%). Kept in step with DiscountRateInput.svelte so a rate the card
 * shows is always one the optimizer will run with when the user clicks
 * through. The 20-year real yield was negative for stretches of 2020-2022.
 */
const MIN_DISCOUNT_RATE = 0;
const MAX_DISCOUNT_RATE = 0.5;

/**
 * Rounds an annual rate to two decimal places of a percent (0.031249 to
 * 0.0312), which is what the strategy page's input does to the fetched rate
 * before running the optimizer. Rounding here too keeps both surfaces
 * computing with the identical number.
 */
function roundToOptimizerPrecision(rate: number): number {
  return Number((rate * 100).toFixed(2)) / 100;
}

/** 0.0312 -> "3.12%"; trailing zeros dropped so 0.025 -> "2.5%". */
export function formatDiscountRatePercent(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`;
}

/**
 * Loads the current 20-year Treasury real yield, the same rate the strategy
 * optimizer preselects. Never throws: on any failure, or a rate outside the
 * range the optimizer accepts, it returns the default assumption so the card
 * can still render.
 */
export async function loadDiscountRateAssumption(): Promise<DiscountRateAssumption> {
  try {
    const data = await fetchRecommendedDiscountRate();
    if (!data.success) return DEFAULT_DISCOUNT_RATE_ASSUMPTION;
    const rate = roundToOptimizerPrecision(data.rate);
    if (
      !Number.isFinite(rate) ||
      rate < MIN_DISCOUNT_RATE ||
      rate > MAX_DISCOUNT_RATE
    ) {
      console.warn(
        'RecommendedFilingCard: fetched discount rate outside optimizer range, using default',
        data.rate
      );
      return DEFAULT_DISCOUNT_RATE_ASSUMPTION;
    }
    return { rate, source: 'treasury' };
  } catch (e) {
    // fetchRecommendedDiscountRate is documented never to throw, so reaching
    // here is a bug rather than a routine network fallback.
    console.error('RecommendedFilingCard: unexpected discount rate failure', e);
    return DEFAULT_DISCOUNT_RATE_ASSUMPTION;
  }
}

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
 * Why a recipient has no filing age left to choose:
 * - `filed`: their benefits have already started.
 * - `spousal-only`: they have no benefit on their own record, so filing only
 *   starts a spousal benefit on their spouse's, and they are past full
 *   retirement age, where spousal benefits stop growing.
 * - `past-seventy`: they are past 70, where delayed retirement credits stop.
 */
export type NoChoiceReason = 'filed' | 'spousal-only' | 'past-seventy';

/**
 * Why `recipient` has no filing age left to choose as of `currentDate`, or
 * null while they still have one. `filedAt` is the month their benefits
 * started, or null; it must pass `validateFiledMonth` (see
 * `filingAgeRange`, which throws otherwise).
 */
export function noChoiceReason(
  recipient: Recipient,
  spouse: Recipient | null,
  currentDate: MonthDate,
  filedAt: MonthDate | null
): NoChoiceReason | null {
  const range = filingAgeRange(recipient, currentDate, filedAt);
  if (filedAt !== null) return 'filed';
  const hasOwnBenefit = recipient.pia().primaryInsuranceAmount().cents() > 0;
  const hasSpousalBenefit =
    spouse !== null && spouse.pia().primaryInsuranceAmount().cents() > 0;
  if (
    !hasOwnBenefit &&
    hasSpousalBenefit &&
    !currentDate.lessThan(recipient.normalRetirementDate())
  ) {
    return 'spousal-only';
  }
  return range.hasChoice ? null : 'past-seventy';
}

/**
 * When a spouse whose reason is `spousal-only` should file. Their spousal
 * benefit has stopped growing and can start only once the other spouse's
 * benefits have, so it starts with them: in the month they start, or, once
 * that has passed, now, backdated as far as SSA pays (20 CFR 404.621): up to
 * six months, but not before the other spouse's benefits started or before
 * their own full retirement age, which would add reduction.
 */
export type SpousalOnlyAdvice =
  | { readonly kind: 'file-in'; readonly month: MonthDate }
  | { readonly kind: 'file-now'; readonly backdateTo: MonthDate };

const MAX_RETROACTIVE = MonthDuration.initFromYearsMonths({
  years: 0,
  months: 6,
});

/** See `SpousalOnlyAdvice`; `otherStart` is when the other spouse's benefits start. */
export function spousalOnlyAdvice(
  recipient: Recipient,
  otherStart: MonthDate,
  currentDate: MonthDate
): SpousalOnlyAdvice {
  if (!otherStart.lessThan(currentDate)) {
    return { kind: 'file-in', month: otherStart };
  }
  const earliest = MonthDate.max(
    MonthDate.max(otherStart, currentDate.subtractDuration(MAX_RETROACTIVE)),
    recipient.normalRetirementDate()
  );
  return earliest.lessThan(currentDate)
    ? { kind: 'file-now', backdateTo: earliest }
    : { kind: 'file-in', month: currentDate };
}

/**
 * Whether each recipient still has a filing age to choose, as of
 * `currentDate`: false for every reason in `NoChoiceReason`, since
 * presenting a filing date to them would imply a decision they no longer
 * have. Index 1 is always true when there is no second recipient, so
 * single-recipient callers can ignore it.
 *
 * Shared so the two surfaces that render a recommendation, the strategy page
 * and the calculator's card, cannot disagree about who still has a choice.
 */
export function filingChoices(
  recipient: Recipient,
  spouse: Recipient | null,
  currentDate: MonthDate = currentMonthDate(),
  alreadyFiled: AlreadyFiled = NOT_FILED
): [boolean, boolean] {
  return [
    noChoiceReason(recipient, spouse, currentDate, alreadyFiled[0]) === null,
    spouse
      ? noChoiceReason(spouse, recipient, currentDate, alreadyFiled[1]) === null
      : true,
  ];
}

/**
 * Whether anyone still has a filing age to choose, from `filingChoices`. A
 * single person's answer is the first entry alone, since the second is
 * always true without a second recipient. Once nobody has a choice, the
 * advice is the same however long anyone lives and whatever the discount
 * rate, so the surfaces showing it leave out what only those assumptions
 * would change.
 */
export function anyFilingChoice(
  isSingle: boolean,
  choices: readonly [boolean, boolean]
): boolean {
  return isSingle ? choices[0] : choices[0] || choices[1];
}

/**
 * `anyFilingChoice` for the strategy page's results in any mode. In widowed
 * mode it is the recommendation's `hasChoice` (see `widowedHasChoice`),
 * taken as true until there is a widowed result, so nothing is hidden
 * before there is anything to show.
 */
export function anyChoiceLeft(
  mode: StrategyMode,
  hasFilingChoice: readonly [boolean, boolean],
  widowed: { readonly hasChoice: boolean } | undefined
): boolean {
  if (mode === 'widowed') return widowed?.hasChoice ?? true;
  return anyFilingChoice(mode === 'single', hasFilingChoice);
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
