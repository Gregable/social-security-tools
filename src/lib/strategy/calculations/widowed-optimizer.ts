/**
 * Optimizers for widowed mode: the best (survivor start, own start) pair for
 * a known death month, and the pair with the highest expected NPV across a
 * death distribution.
 *
 * ## Approach
 *
 * Each month pays the larger of the own benefit and the survivor benefit,
 * and both are step functions of time. The survivor benefit is $0 until it
 * starts and constant after. The own benefit is $0, then its filing-year
 * amount, then, from the January after a mid-year claim past full
 * retirement age, its full amount. So every strategy pays at most three
 * constant amounts in turn. The NPV of a constant amount over a run of
 * months is a difference of two entries in a prefix table of per-month
 * weights, which makes each strategy O(1) to value.
 *
 * The amounts are precomputed per start age with the same functions the
 * benefit periods use (`widowedSurvivorBenefit`, `benefitOnDateOptimized`),
 * so only the discounting arithmetic differs from `strategySumCentsWidowed`.
 * Tests check that the two agree.
 *
 * For a known death month, the weight of benefit month t is its discount
 * factor, (1+r)^-(t+2-now) (see PAYMENT_DISCOUNT_LAG), and only months from
 * now on count. For the expected NPV, the weight also includes the
 * probability of being alive in month t, P(death month >= t). That is
 * Σ_d P(d) × NPV(d) with the two sums swapped.
 *
 * ## Ties
 *
 * Many strategies pay exactly the same stream, for example every survivor
 * start age once a larger own benefit is being paid. Runs of equal amounts
 * are merged before they are valued, so identical streams are valued with
 * identical arithmetic and tie exactly. The searches try every pair, with
 * survivor start ages in the outer loop and own start ages in the inner one,
 * both from youngest, and keep the first of a tie: the youngest survivor
 * start, then the youngest own start. `widowedBenefitUse` tells the UI when
 * a benefit in the chosen strategy never actually pays.
 *
 * As in the other modes' NPVs, the death month itself is paid; see
 * `filedBeforeDeath` for that model limitation.
 */

import { benefitOnDateOptimized } from '$lib/benefit-calculator';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { type MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import {
  type LateSpouse,
  lateSpouseProblem,
  type WidowedFiled,
} from './late-spouse';
import {
  calculateMonthlyDiscountRate,
  type FilingAgeRange,
} from './strategy-calc.js';
import {
  ownFilingRange,
  survivorFilingRange,
  type WidowedStrategy,
  widowedSurvivorBenefit,
} from './widowed-benefits';

/** A strategy and its value: an NPV, or an expected NPV, in cents. */
export interface WidowedResult {
  readonly strategy: WidowedStrategy;
  readonly npvCents: number;
}

/** Which of a strategy's two benefits is part of the plan. */
export interface WidowedBenefitUse {
  readonly survivor: boolean;
  readonly own: boolean;
}

/** What each of a strategy's two benefits pays a month, in today's dollars. */
export interface WidowedAmounts {
  readonly survivor: Money;
  readonly own: Money;
}

/**
 * Everything the optimizers need about one widow(er), computed once: the
 * start ages still open for each benefit and what each would pay.
 */
export interface WidowedContext {
  readonly survivor: Recipient;
  readonly lateSpouse: LateSpouse;
  readonly currentDate: MonthDate;
  /** Benefits that had already started, which pin their ranges. */
  readonly filed: WidowedFiled;
  readonly survivorRange: FilingAgeRange;
  readonly ownRange: FilingAgeRange;
  readonly tables: WidowedTables;
}

/**
 * Per-start-age amounts and per-month weights, indexed from the youngest
 * start age each range allows. Epochs count months since the epoch; start
 * ages are SSA ages in months.
 */
interface WidowedTables {
  readonly currentEpoch: number;
  readonly ssaBirthEpoch: number;
  readonly survivorStartAgeMonths: number;
  readonly ownStartAgeMonths: number;
  /** Survivor benefit, per survivor start age from the youngest. */
  readonly survivorCents: Float64Array;
  /** Own benefit until the January after the claim, per own start age. */
  readonly ownFilingYearCents: Float64Array;
  /** Own benefit from that January on, per own start age. */
  readonly ownCents: Float64Array;
  /** v^k for k months after now, where v = 1 / (1 + monthly rate). */
  readonly discount: Float64Array;
  /** Prefix sums of the discount weights; see `WeightedPrefix`. */
  readonly discountPrefix: Float64Array;
}

/**
 * Prefix sums of per-month weights: `prefix[k]` is the total weight of the
 * first k benefit months from now (now itself is month 0), so the weight of
 * months a through b is prefix[b + 1 - now] - prefix[a - now].
 * `lastEpochMonth` is the last month counted; the table can carry weight
 * past it (one discount table serves every death month), which is ignored.
 */
interface WeightedPrefix {
  readonly prefix: Float64Array;
  readonly lastEpochMonth: number;
}

/**
 * An age past any death a distribution can reach: life tables stop at 120,
 * and a death age is modelled at mid-year.
 */
const MAX_MODELED_AGE_YEARS = 122;

/**
 * How many months of discounting the benefit for a month gets, counted from
 * that month. It matches every other NPV in the optimizer: the benefit for
 * month t is paid at the end of the month, in t + 1, and
 * `calculatePeriodNPV` values a run of payments starting at t + 1 with an
 * annuity factor that discounts the first of them one month further. Using
 * the same lag keeps a widow(er)'s figures comparable with single and
 * couple results for the same benefits.
 */
const PAYMENT_DISCOUNT_LAG = 2;

/**
 * Builds the context for a widow(er) as of `currentDate`. `filed` pins a
 * benefit that has already started to its actual start month.
 *
 * Throws for a late spouse or a filed month the form would reject (see
 * `widowedSnapshot`): a death in the future, say, would otherwise give a
 * plausible-looking plan.
 */
export function createWidowedContext(
  survivor: Recipient,
  lateSpouse: LateSpouse,
  currentDate: MonthDate,
  discountRate: number,
  filed: WidowedFiled
): WidowedContext {
  const problem = lateSpouseProblem(lateSpouse, currentDate);
  if (problem !== null) throw new Error(`invalid late spouse: ${problem}`);
  const survivorRange = survivorFilingRange(
    survivor,
    lateSpouse,
    currentDate,
    filed.survivor
  );
  const ownRange = ownFilingRange(survivor, currentDate, filed.own);

  const survivorStartAgeMonths = survivorRange.earliest.asMonths();
  const survivorCents = new Float64Array(
    survivorRange.latest.asMonths() - survivorStartAgeMonths + 1
  );
  for (let i = 0; i < survivorCents.length; i++) {
    const startDate = survivor.birthdate.dateAtSsaAge(
      new MonthDuration(survivorStartAgeMonths + i)
    );
    survivorCents[i] = widowedSurvivorBenefit(
      survivor,
      lateSpouse,
      startDate
    ).cents();
  }

  // The same two amounts PersonalBenefitPeriods uses.
  const ownStartAgeMonths = ownRange.earliest.asMonths();
  const ownCount = ownRange.latest.asMonths() - ownStartAgeMonths + 1;
  const ownFilingYearCents = new Float64Array(ownCount);
  const ownCents = new Float64Array(ownCount);
  for (let i = 0; i < ownCount; i++) {
    const filingDate = survivor.birthdate.dateAtSsaAge(
      new MonthDuration(ownStartAgeMonths + i)
    );
    const janAfter = filingDate.addDuration(
      new MonthDuration(12 - filingDate.monthIndex())
    );
    ownFilingYearCents[i] = benefitOnDateOptimized(
      survivor,
      filingDate,
      filingDate
    ).cents();
    ownCents[i] = benefitOnDateOptimized(
      survivor,
      filingDate,
      janAfter
    ).cents();
  }

  const currentEpoch = currentDate.monthsSinceEpoch();
  const lastEpoch = survivor.birthdate
    .dateAtLayAge(
      MonthDuration.initFromYearsMonths({
        years: MAX_MODELED_AGE_YEARS,
        months: 0,
      })
    )
    .monthsSinceEpoch();
  const months = Math.max(1, lastEpoch - currentEpoch + 2);
  const monthlyRate = calculateMonthlyDiscountRate(discountRate);
  const discount = new Float64Array(months + 2);
  discount[0] = 1;
  for (let k = 1; k < discount.length; k++)
    discount[k] = discount[k - 1] / (1 + monthlyRate);
  // Benefit month now + j is weighted by discount[j + 2]; see
  // PAYMENT_DISCOUNT_LAG.
  const discountPrefix = new Float64Array(months + 1);
  for (let j = 0; j < months; j++) {
    discountPrefix[j + 1] =
      discountPrefix[j] + discount[j + PAYMENT_DISCOUNT_LAG];
  }

  return {
    survivor,
    lateSpouse,
    currentDate,
    filed,
    survivorRange,
    ownRange,
    tables: {
      currentEpoch,
      ssaBirthEpoch: survivor.birthdate
        .dateAtSsaAge(new MonthDuration(0))
        .monthsSinceEpoch(),
      survivorStartAgeMonths,
      ownStartAgeMonths,
      survivorCents,
      ownFilingYearCents,
      ownCents,
      discount,
      discountPrefix,
    },
  };
}

/**
 * The months, from the first payment on, at which the payment can change:
 * the two start months and the January after the own claim, in order and
 * without duplicates. Writes them into `out` and returns how many.
 */
function changeMonths(
  t: WidowedTables,
  survivorIndex: number,
  ownIndex: number,
  out: Int32Array
): number {
  const survivorEpoch =
    t.ssaBirthEpoch + t.survivorStartAgeMonths + survivorIndex;
  const ownEpoch = t.ssaBirthEpoch + t.ownStartAgeMonths + ownIndex;
  const janEpoch = ownEpoch + 12 - (ownEpoch % 12);
  if (survivorEpoch <= ownEpoch) {
    out[0] = survivorEpoch;
    if (survivorEpoch === ownEpoch) {
      out[1] = janEpoch;
      return 2;
    }
    out[1] = ownEpoch;
    out[2] = janEpoch;
    return 3;
  }
  out[0] = ownEpoch;
  if (survivorEpoch < janEpoch) {
    out[1] = survivorEpoch;
    out[2] = janEpoch;
    return 3;
  }
  out[1] = janEpoch;
  if (survivorEpoch === janEpoch) return 2;
  out[2] = survivorEpoch;
  return 3;
}

/** The survivor benefit payable in `epoch`: $0 until it starts. */
function survivorPaymentAt(
  t: WidowedTables,
  survivorIndex: number,
  epoch: number
): number {
  return epoch >= t.ssaBirthEpoch + t.survivorStartAgeMonths + survivorIndex
    ? t.survivorCents[survivorIndex]
    : 0;
}

/**
 * The own benefit payable in `epoch`: $0 until it starts, then its
 * filing-year amount until the January after the claim.
 */
function ownPaymentAt(
  t: WidowedTables,
  ownIndex: number,
  epoch: number
): number {
  const ownEpoch = t.ssaBirthEpoch + t.ownStartAgeMonths + ownIndex;
  if (epoch < ownEpoch) return 0;
  const janEpoch = ownEpoch + 12 - (ownEpoch % 12);
  return epoch < janEpoch
    ? t.ownFilingYearCents[ownIndex]
    : t.ownCents[ownIndex];
}

// Scratch space for changeMonths; the optimizers are synchronous, so one
// buffer serves every call.
const scratchMonths = new Int32Array(3);

/**
 * The value of one strategy: each month's payment, the larger of the two
 * benefits, times that month's weight, summed through `lastEpochMonth`.
 */
function strategyValue(
  t: WidowedTables,
  survivorIndex: number,
  ownIndex: number,
  weights: WeightedPrefix
): number {
  const count = changeMonths(t, survivorIndex, ownIndex, scratchMonths);
  const now = t.currentEpoch;
  const { prefix, lastEpochMonth } = weights;

  const runValue = (cents: number, from: number, to: number): number => {
    if (cents === 0) return 0;
    const a = from > now ? from : now;
    const b = to < lastEpochMonth ? to : lastEpochMonth;
    if (a > b) return 0;
    return cents * (prefix[b + 1 - now] - prefix[a - now]);
  };

  let total = 0;
  let runStart = scratchMonths[0];
  let runCents = Math.max(
    survivorPaymentAt(t, survivorIndex, runStart),
    ownPaymentAt(t, ownIndex, runStart)
  );
  for (let k = 1; k < count; k++) {
    const month = scratchMonths[k];
    const cents = Math.max(
      survivorPaymentAt(t, survivorIndex, month),
      ownPaymentAt(t, ownIndex, month)
    );
    if (cents !== runCents) {
      total += runValue(runCents, runStart, month - 1);
      runStart = month;
      runCents = cents;
    }
  }
  return total + runValue(runCents, runStart, lastEpochMonth);
}

function indexOf(context: WidowedContext, strategy: WidowedStrategy) {
  const t = context.tables;
  const survivorIndex =
    strategy.survivorStart.asMonths() - t.survivorStartAgeMonths;
  const ownIndex = strategy.ownStart.asMonths() - t.ownStartAgeMonths;
  if (
    survivorIndex < 0 ||
    survivorIndex >= t.survivorCents.length ||
    ownIndex < 0 ||
    ownIndex >= t.ownCents.length
  ) {
    throw new Error(
      `strategy (survivor ${strategy.survivorStart.toAgeString()}, own ` +
        `${strategy.ownStart.toAgeString()}) is outside the start ages this ` +
        `context searches (survivor ${context.survivorRange.earliest.toAgeString()}` +
        ` to ${context.survivorRange.latest.toAgeString()}, own ` +
        `${context.ownRange.earliest.toAgeString()} to ` +
        `${context.ownRange.latest.toAgeString()})`
    );
  }
  return { survivorIndex, ownIndex };
}

/** Discount weights through the death month. */
function discountWeights(
  context: WidowedContext,
  finalDate: MonthDate
): WeightedPrefix {
  const t = context.tables;
  const lastEpochMonth = finalDate.monthsSinceEpoch();
  if (lastEpochMonth + 1 - t.currentEpoch >= t.discountPrefix.length) {
    throw new Error(
      `death month ${finalDate.toString()} is beyond the modeled ages`
    );
  }
  return { prefix: t.discountPrefix, lastEpochMonth };
}

/** Discount weights times the probability of being alive in each month. */
function expectedWeights(
  context: WidowedContext,
  deathProbDist: readonly DeathProbability[]
): WeightedPrefix {
  const t = context.tables;
  const now = t.currentEpoch;
  const months = t.discountPrefix.length - 1;
  // alive[j] = P(death month >= now + j), built from a difference array.
  const alive = new Float64Array(months + 1);
  let lastEpochMonth = now - 1;
  for (const { age, probability } of deathProbDist) {
    if (probability === 0) continue;
    // A death age in years is modelled at mid-year, as in expectedNPVSingle.
    const deathMonth = context.survivor.birthdate
      .dateAtLayAge(
        MonthDuration.initFromYearsMonths({ years: age, months: 6 })
      )
      .monthsSinceEpoch();
    if (deathMonth < now) continue;
    if (deathMonth + 1 - now > months) {
      throw new Error(`death age ${age} is beyond the modeled ages`);
    }
    alive[0] += probability;
    alive[deathMonth + 1 - now] -= probability;
    if (deathMonth > lastEpochMonth) lastEpochMonth = deathMonth;
  }
  const prefix = new Float64Array(months + 1);
  let survival = 0;
  for (let j = 0; j < months; j++) {
    survival += alive[j];
    prefix[j + 1] = prefix[j] + t.discount[j + PAYMENT_DISCOUNT_LAG] * survival;
  }
  return { prefix, lastEpochMonth };
}

function bestStrategy(
  context: WidowedContext,
  weights: WeightedPrefix
): WidowedResult {
  const t = context.tables;
  let bestSurvivor = 0;
  let bestOwn = 0;
  let best = Number.NEGATIVE_INFINITY;
  for (let s = 0; s < t.survivorCents.length; s++) {
    for (let o = 0; o < t.ownCents.length; o++) {
      const value = strategyValue(t, s, o, weights);
      if (value > best) {
        best = value;
        bestSurvivor = s;
        bestOwn = o;
      }
    }
  }
  // Every value is a finite sum of finite amounts and weights; anything
  // else means the tables are broken, and must not reach the page as a plan.
  if (!Number.isFinite(best)) {
    throw new Error(`no strategy has a finite value (best ${best})`);
  }
  return {
    strategy: {
      survivorStart: new MonthDuration(t.survivorStartAgeMonths + bestSurvivor),
      ownStart: new MonthDuration(t.ownStartAgeMonths + bestOwn),
    },
    npvCents: best,
  };
}

/** The NPV in cents of `strategy` for a widow(er) who dies in `finalDate`. */
export function widowedNPVCents(
  context: WidowedContext,
  strategy: WidowedStrategy,
  finalDate: MonthDate
): number {
  const { survivorIndex, ownIndex } = indexOf(context, strategy);
  return strategyValue(
    context.tables,
    survivorIndex,
    ownIndex,
    discountWeights(context, finalDate)
  );
}

/** The strategy with the highest NPV for a widow(er) who dies in `finalDate`. */
export function optimalStrategyWidowed(
  context: WidowedContext,
  finalDate: MonthDate
): WidowedResult {
  return bestStrategy(context, discountWeights(context, finalDate));
}

/** The expected NPV in cents of `strategy` across `deathProbDist`. */
export function widowedExpectedNPVCents(
  context: WidowedContext,
  deathProbDist: readonly DeathProbability[],
  strategy: WidowedStrategy
): number {
  const { survivorIndex, ownIndex } = indexOf(context, strategy);
  return strategyValue(
    context.tables,
    survivorIndex,
    ownIndex,
    expectedWeights(context, deathProbDist)
  );
}

/** The strategy with the highest expected NPV across `deathProbDist`. */
export function expectedNPVWidowed(
  context: WidowedContext,
  deathProbDist: readonly DeathProbability[]
): WidowedResult {
  return bestStrategy(context, expectedWeights(context, deathProbDist));
}

/**
 * Which of a strategy's benefits is part of the plan: one already started,
 * or one that pays at some point between now and `finalDate`.
 *
 * A benefit that is never the larger of the two never changes a payment, so
 * the UI says it is not needed rather than showing a start date that the
 * search picked only as the first of a tie. A benefit already started is a
 * fact rather than a choice, so it counts even once the other pays more.
 * When the two are equal, the own benefit is the one paid (SSA pays it in
 * full, plus a $0 excess).
 */
export function widowedBenefitUse(
  context: WidowedContext,
  strategy: WidowedStrategy,
  finalDate: MonthDate
): WidowedBenefitUse {
  const t = context.tables;
  const { survivorIndex, ownIndex } = indexOf(context, strategy);
  const count = changeMonths(t, survivorIndex, ownIndex, scratchMonths);
  const now = t.currentEpoch;
  const last = finalDate.monthsSinceEpoch();
  let survivor = context.filed.survivor !== null;
  let own = context.filed.own !== null;
  for (let k = 0; k < count; k++) {
    const from = Math.max(scratchMonths[k], now);
    const to = k + 1 < count ? scratchMonths[k + 1] - 1 : last;
    if (from > Math.min(to, last)) continue;
    const survivorCents = survivorPaymentAt(t, survivorIndex, from);
    const ownCents = ownPaymentAt(t, ownIndex, from);
    if (survivorCents > ownCents) survivor = true;
    else if (ownCents > 0) own = true;
  }
  return { survivor, own };
}

/**
 * The monthly amount each benefit in `strategy` pays, in today's dollars:
 * the survivor benefit for its start age, and the own benefit once any
 * delayed credits from the claim year have arrived.
 */
export function widowedAmounts(
  context: WidowedContext,
  strategy: WidowedStrategy
): WidowedAmounts {
  const { survivorIndex, ownIndex } = indexOf(context, strategy);
  return {
    survivor: Money.fromCents(context.tables.survivorCents[survivorIndex]),
    own: Money.fromCents(context.tables.ownCents[ownIndex]),
  };
}

/**
 * The earliest death age worth modelling: the later of the current age and
 * the first age either benefit could start. Before that nothing is paid
 * whatever the strategy, so there is no strategy to find. Death-age buckets
 * must start here; see `earliestModelableDeathAge` for the single and
 * couple version.
 */
export function earliestModelableDeathAgeWidowed(
  context: WidowedContext
): MonthDuration {
  const current = context.survivor.birthdate
    .ageAtSsaDate(context.currentDate)
    .asMonths();
  const first = Math.min(
    context.survivorRange.earliest.asMonths(),
    context.ownRange.earliest.asMonths()
  );
  return new MonthDuration(Math.max(current, first));
}

/**
 * A month past any death a distribution can reach. Checking a plan's
 * benefits through it asks whether they pay at all, however long the
 * widow(er) lives.
 */
export function widowedHorizon(context: WidowedContext): MonthDate {
  return context.survivor.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({
      years: MAX_MODELED_AGE_YEARS,
      months: 0,
    })
  );
}
