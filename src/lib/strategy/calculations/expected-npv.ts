/**
 * Expected NPV across all possible death ages.
 *
 * ## Problem
 *
 * For each candidate filing age (or filing-age pair for couples), compute the
 * probability-weighted expected net present value (NPV) of Social Security
 * benefits, where the weighting is over the distribution of possible death
 * ages. Recipients pick the filing age with the highest expected NPV.
 *
 *   E[NPV](filing) = Σ_d P(death at d) * NPV(filing, death=d)
 *
 * For couples, deaths are assumed independent:
 *
 *   E[NPV](f_e, f_d) = Σ_{d_e} Σ_{d_d} P(d_e) * P(d_d) * NPV(f_e, f_d, d_e, d_d)
 *
 * ## Two implementations
 *
 * This file exposes two couple functions that compute the same answer:
 *
 *   expectedNPVCouple           — EXACT reference (slow path). Brute-force
 *                                 double sum over all (d_e, d_d) pairs,
 *                                 delegating each NPV to strategySumCentsCouple.
 *                                 Kept for golden-test generation and as the
 *                                 ground truth for the optimized version.
 *
 *   expectedNPVCoupleOptimized  — FAST path used by the UI. Uses a
 *                                 suffix-sum decomposition of the annuity
 *                                 formula to collapse the inner O(D²) loop
 *                                 into O(D) work per earner death. Validated
 *                                 against the exact version via 1,000 golden
 *                                 test cases (see expected-npv-couple-goldens.test.ts).
 *
 * For typical UI inputs (F≈96 filing ages, D≈60 death ages), the exact
 * version does ~33M NPV computations per evaluation (~500ms); the optimized
 * version does ~550K (~70ms).
 *
 * The single-recipient case is much smaller (just O(F×D)) so only the simple
 * form is provided.
 */

import { eligibleForSpousalBenefit } from '$lib/benefit-calculator';
import type { DeathProbability } from '$lib/life-tables';
import { type MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import { classifyEarnerDependent } from './earner-dependent.js';
import {
  calculateMonthlyDiscountRate,
  earliestFiling,
  strategySumCentsCouple,
  strategySumCentsSingle,
} from './strategy-calc.js';

// ═════════════════════════════════════════════════════════════════════════
// SINGLE RECIPIENT
// ═════════════════════════════════════════════════════════════════════════

export interface FilingAgeResult {
  readonly filingAge: MonthDuration;
  readonly expectedNPVCents: number;
}

/**
 * Computes the probability-weighted expected NPV for every candidate filing
 * age for a single recipient.
 *
 * For each filing age, iterates over all death ages in the probability
 * distribution, computing NPV via the existing strategySumCentsSingle and
 * weighting by P(death at that age).
 *
 * @returns Array of {filingAge, expectedNPVCents} sorted descending by
 *          expectedNPVCents. The first element is the optimal filing age.
 */
export function expectedNPVSingle(
  recipient: Recipient,
  currentDate: MonthDate,
  discountRate: number,
  deathProbDist: DeathProbability[]
): FilingAgeResult[] {
  if (deathProbDist.length === 0) return [];

  const startFilingMonths = earliestFiling(recipient, currentDate).asMonths();
  const endFilingMonths = 70 * 12;

  const results: FilingAgeResult[] = [];

  for (let f = startFilingMonths; f <= endFilingMonths; f++) {
    const filingAge = new MonthDuration(f);
    let expectedNPVCents = 0;

    for (const { age: deathAge, probability } of deathProbDist) {
      if (probability === 0) continue;

      // Convert death age (yearly) to a MonthDate
      // Use mid-year (6 months) as the representative death month
      const deathAgeDuration = MonthDuration.initFromYearsMonths({
        years: deathAge,
        months: 6,
      });
      const finalDate = recipient.birthdate.dateAtLayAge(deathAgeDuration);

      // If death occurs before filing, NPV is 0 for this scenario
      const filingDate = recipient.birthdate.dateAtSsaAge(filingAge);
      if (finalDate.lessThan(filingDate)) continue;

      const npvCents = strategySumCentsSingle(
        recipient,
        finalDate,
        currentDate,
        discountRate,
        filingAge
      );

      expectedNPVCents += probability * npvCents;
    }

    results.push({ filingAge, expectedNPVCents });
  }

  results.sort((a, b) => b.expectedNPVCents - a.expectedNPVCents);
  return results;
}

export interface CoupleFilingAgeResult {
  readonly filingAges: [MonthDuration, MonthDuration];
  readonly expectedNPVCents: number;
}

// ═════════════════════════════════════════════════════════════════════════
// COUPLE — FAST PATH (optimized)
// ═════════════════════════════════════════════════════════════════════════
//
// The helpers below replicate the same arithmetic as strategySumPeriodsCouple
// in strategy-calc.ts, but operate on raw `number` values (cents, epoch
// months) instead of allocating Money / MonthDate / MonthDuration objects.
// They are used by `expectedNPVCoupleOptimized` below.
//
// Correctness note: the formulas here MUST match the object-oriented
// implementations in benefit-calculator.ts / strategy-calc.ts to the last
// rounding step. Any divergence will show up as a golden-test failure.

/**
 * Personal benefit at a given filing age, in cents.
 *
 * Replicates benefitAtAge (benefit-calculator.ts):
 *   PIA.floorToDollar().times(1 + multiplier).floorToDollar()
 *
 * The multiplier is SSA's piecewise-linear schedule around NRA:
 *   - Filed early: reduction of 5/9% per month for the first 36 months
 *                  before NRA, 5/12% per month beyond that.
 *   - Filed late:  delayed retirement credit of DRI/12 per month past NRA.
 */
function benefitCentsAtAge(
  piaDollarCents: number,
  nraMonths: number,
  delayedRetirementIncrease: number,
  ageMonths: number
): number {
  let mult: number;
  if (nraMonths > ageMonths) {
    const before = nraMonths - ageMonths;
    mult = -(
      (Math.min(36, before) * 5) / 900 +
      (Math.max(0, before - 36) * 5) / 1200
    );
  } else {
    const after = ageMonths - nraMonths;
    mult = (delayedRetirementIncrease / 12) * after;
  }
  return Math.floor(Math.round(piaDollarCents * (1 + mult)) / 100) * 100;
}

/**
 * Personal benefit during the filing year, in cents.
 *
 * Replicates benefitOnDateCore(r, fd, fd, age) from benefit-calculator.ts.
 *
 * The "January bump": for recipients filing after NRA but before age 70 in
 * a non-January month, SSA only grants delayed credits up to the previous
 * January. Full credits kick in the following January. This helper returns
 * the *reduced* amount that applies during the filing year; the full amount
 * is `benefitCentsAtAge` of the filing age.
 *
 * When the bump doesn't apply (filed before/at NRA, at 70, or in January),
 * returns the same value as `benefitCentsAtAge`.
 */
function filingYearCents(
  piaDollarCents: number,
  nraMonths: number,
  delayedRetirementIncrease: number,
  ageMonths: number,
  ssaBirthEpoch: number,
  nraEpoch: number
): number {
  const filingEpoch = ssaBirthEpoch + ageMonths;
  if (filingEpoch <= nraEpoch || ageMonths >= 840 || filingEpoch % 12 === 0)
    return benefitCentsAtAge(
      piaDollarCents,
      nraMonths,
      delayedRetirementIncrease,
      ageMonths
    );

  const thisJan = filingEpoch - (filingEpoch % 12);
  const compAge = Math.max(nraEpoch, thisJan) - ssaBirthEpoch;
  return benefitCentsAtAge(
    piaDollarCents,
    nraMonths,
    delayedRetirementIncrease,
    compAge
  );
}

/**
 * Spousal benefit in cents for a given filing pair.
 *
 * Replicates spousalBenefitOnDate (benefit-calculator.ts) at the spousal
 * period's start date. The amount is the excess of half the earner's PIA
 * over the dependent's own benefit, with two reduction schedules:
 *
 *   - If the spousal period starts before the dependent's NRA, apply an
 *     early-filing reduction to the excess.
 *   - If the dependent filed *after* their own NRA (accruing DRC), the
 *     personal benefit amount is higher, shrinking the remaining spousal
 *     excess.
 *
 * Returns 0 if the dependent has higher earnings or the excess is non-positive.
 */
function spousalCentsForPair(
  depPiaRaw: number,
  earnerPiaRaw: number,
  depFilingEpoch: number,
  depNraEpoch: number,
  spousalStartEpoch: number,
  depFYCents: number,
  depPJCents: number
): number {
  const base = earnerPiaRaw / 2 - depPiaRaw;
  if (base <= 0) return 0;

  if (spousalStartEpoch >= depNraEpoch) {
    if (depFilingEpoch <= depNraEpoch) return Math.floor(base / 100) * 100;
    const startYear = Math.floor(spousalStartEpoch / 12);
    const filingYear = Math.floor(depFilingEpoch / 12);
    const personal = startYear > filingYear ? depPJCents : depFYCents;
    const excess = earnerPiaRaw / 2 - personal;
    return excess <= 0 ? 0 : Math.floor(excess / 100) * 100;
  }

  const mBefore = depNraEpoch - spousalStartEpoch;
  if (mBefore <= 36)
    return Math.floor((base * (1 - mBefore / 144)) / 100) * 100;

  const r1 = base * 0.25;
  const r2 = base * ((mBefore - 36) / 240);
  return Math.floor((base - r1 - r2) / 100) * 100;
}

/**
 * Survivor benefit in cents. Replicates survivorBenefit (benefit-calculator.ts).
 *
 * Cases:
 *   1. Earner died before filing and before NRA: survivor base = earner's PIA.
 *   2. Earner died before filing but after NRA: base = benefit as if earner
 *      filed at min(death age, 70).
 *   3. Earner filed before death: base = max(82.5% of PIA, earner's actual
 *      benefit at filing).
 *
 * The base is then reduced if the survivor starts collecting before their
 * own survivor-NRA (minimum 71.5% ratio at age 60, linearly to 100% at NRA).
 */
function survivorCentsCalc(
  earnerPiaRaw: number,
  earnerPiaDollar: number,
  earnerNra: number,
  earnerDelayedRetirementIncrease: number,
  earnerSsaBirth: number,
  earnerNraEpoch: number,
  earnerFilingEpoch: number,
  earnerDeathEpoch: number,
  earner70Epoch: number,
  depSurvNra: number,
  survStartEpoch: number,
  depSsaBirth: number
): number {
  let base: number;
  if (earnerFilingEpoch >= earnerDeathEpoch) {
    if (earnerDeathEpoch < earnerNraEpoch) {
      base = earnerPiaRaw;
    } else {
      const effEpoch = Math.min(earnerDeathEpoch, earner70Epoch);
      base = benefitCentsAtAge(
        earnerPiaDollar,
        earnerNra,
        earnerDelayedRetirementIncrease,
        effEpoch - earnerSsaBirth
      );
    }
  } else {
    const pct825 = Math.round(earnerPiaRaw * 0.825);
    const eBenefit = benefitCentsAtAge(
      earnerPiaDollar,
      earnerNra,
      earnerDelayedRetirementIncrease,
      earnerFilingEpoch - earnerSsaBirth
    );
    base = Math.floor(Math.max(pct825, eBenefit));
  }

  const survAge = survStartEpoch - depSsaBirth;
  if (survAge >= depSurvNra) return Math.floor(base / 100) * 100;

  const m60toNRA = depSurvNra - 720;
  const m60toAge = survAge - 720;
  const ratio = 0.715 + 0.285 * Math.max(0, m60toAge / m60toNRA);
  return Math.floor(Math.round(base * ratio) / 100) * 100;
}

/**
 * Optimized expectedNPVCouple — produces identical results to the exact
 * version but in ~1/8 the time for typical UI inputs.
 *
 * ## Key optimizations
 *
 * 1. Raw numbers in the hot loop. Filing dates, death dates, and benefit
 *    amounts are stored as epoch-months (Int32) and cents (Float64) rather
 *    than Money / MonthDate objects. No allocations inside the loop.
 *
 * 2. Pre-tabulated PV and discount factors. `pvF[n]` and `dkF[k]` are
 *    computed once up front (O(maxMonths)) and read by index, replacing
 *    millions of `Math.pow` calls with array lookups.
 *
 * 3. Suffix-sum decomposition (the main algorithmic win). The exact version
 *    is O(F² × D²) because for every filing pair (f_e, f_d) it iterates
 *    every (d_e, d_d) death pair. We reduce this to O(F² × D) using:
 *
 *        pvF[n] * dkF[k]  =  (dkF[k] - dkF[k+n]) / r
 *
 *    This identity means a probability-weighted sum of NPVs with varying
 *    period lengths collapses to a difference of two pre-computed suffix
 *    sums over the dep-death distribution. We no longer loop over dep
 *    deaths inside the earner-death loop.
 *
 * 4. Earner personal NPV factored out. Since it depends only on the earner's
 *    death (not the dep's), it moves outside the conceptual inner sum
 *    (using the fact that Σ P(d_d) = 1).
 *
 * ## Result layout
 *
 * Results are sorted descending by NPV. `filingAges` is indexed in the
 * original recipient order (not earner/dependent order) — `filingAges[0]`
 * is for `recipients[0]`. Validated against the exact version by 1,000
 * golden test cases in `expected-npv-couple-goldens.test.ts`.
 */
export function expectedNPVCoupleOptimized(
  recipients: [Recipient, Recipient],
  currentDate: MonthDate,
  discountRate: number,
  deathProbDists: [DeathProbability[], DeathProbability[]]
): CoupleFilingAgeResult[] {
  if (deathProbDists[0].length === 0 || deathProbDists[1].length === 0)
    return [];

  // ── Classify earner/dependent ──
  const { earner, dependent, earnerIndex, dependentIndex } =
    classifyEarnerDependent(recipients);

  // ── Recipient constants ──
  const ePiaRaw = earner.pia().primaryInsuranceAmount().cents();
  const ePiaDol = Math.floor(ePiaRaw / 100) * 100;
  const eNra = earner.normalRetirementAge().asMonths();
  const eDri = earner.delayedRetirementIncrease();
  const eSsaBirth = earner.birthdate
    .dateAtSsaAge(new MonthDuration(0))
    .monthsSinceEpoch();
  const eNraEpoch = eSsaBirth + eNra;
  const e70Epoch = eSsaBirth + 840;

  const dPiaRaw = dependent.pia().primaryInsuranceAmount().cents();
  const dPiaDol = Math.floor(dPiaRaw / 100) * 100;
  const dNra = dependent.normalRetirementAge().asMonths();
  const dDri = dependent.delayedRetirementIncrease();
  const dSsaBirth = dependent.birthdate
    .dateAtSsaAge(new MonthDuration(0))
    .monthsSinceEpoch();
  const dNraEpoch = dSsaBirth + dNra;
  const dSurvNra = dependent.survivorNormalRetirementAge().asMonths();

  // survivorCentsCalc divides by (dSurvNra - 720). SSA survivor NRA is
  // 780-804 months for all valid cohorts; guard in case of future data bugs.
  if (dSurvNra <= 720) {
    throw new Error(
      `survivorNormalRetirementAge must exceed 720 months; got ${dSurvNra}`
    );
  }

  const depZeroPia = dPiaRaw === 0;
  const spEligible = eligibleForSpousalBenefit(dependent, earner);

  const mRate = calculateMonthlyDiscountRate(discountRate);
  // The suffix-sum decomposition divides by mRate. In practice mRate is
  // either exactly 0 (handled separately) or >~1e-4 (1% annual rate).
  // Tiny positive values would cause catastrophic cancellation. NaN slips
  // past `!== 0 && < 1e-9` silently, so check finiteness explicitly.
  if (!Number.isFinite(mRate)) {
    throw new Error(`monthlyDiscountRate must be finite; got ${mRate}`);
  }
  if (mRate !== 0 && mRate < 1e-9) {
    throw new Error(
      `monthlyDiscountRate must be either exactly 0 or >= 1e-9; got ${mRate}`
    );
  }
  const curEpoch = currentDate.monthsSinceEpoch();
  const curP1 = curEpoch + 1;

  // ── Death data (mapped to earner/dependent roles) ──
  const eDeathProbs = deathProbDists[earnerIndex];
  const dDeathProbs = deathProbDists[dependentIndex];
  const nED = eDeathProbs.length;
  const nDD = dDeathProbs.length;

  const edE = new Int32Array(nED);
  const edP = new Float64Array(nED);
  let maxDeath = 0;
  for (let i = 0; i < nED; i++) {
    edE[i] = earner.birthdate
      .dateAtLayAge(
        MonthDuration.initFromYearsMonths({
          years: eDeathProbs[i].age,
          months: 6,
        })
      )
      .monthsSinceEpoch();
    edP[i] = eDeathProbs[i].probability;
    if (edE[i] > maxDeath) maxDeath = edE[i];
  }

  const ddE = new Int32Array(nDD);
  const ddP = new Float64Array(nDD);
  for (let i = 0; i < nDD; i++) {
    ddE[i] = dependent.birthdate
      .dateAtLayAge(
        MonthDuration.initFromYearsMonths({
          years: dDeathProbs[i].age,
          months: 6,
        })
      )
      .monthsSinceEpoch();
    ddP[i] = dDeathProbs[i].probability;
    if (ddE[i] > maxDeath) maxDeath = ddE[i];
  }

  // ── Filing ranges ──
  const eStart = earliestFiling(earner, currentDate).asMonths();
  const dStart = earliestFiling(dependent, currentDate).asMonths();

  // dkF[kSp] is indexed up to (maxFiling + 1 - curEpoch). The pvF/dkF tables
  // are sized from maxDeath. Ensure death distribution extends past any
  // filing epoch (normally holds: SSA life tables go to age 120, filings
  // cap at age 70).
  const maxFilingEpoch =
    eSsaBirth + 840 > dSsaBirth + 840 ? eSsaBirth + 840 : dSsaBirth + 840;
  if (maxDeath < maxFilingEpoch) {
    throw new Error(
      `death distribution max epoch (${maxDeath}) must reach at least max ` +
        `filing epoch (${maxFilingEpoch}); life table may be truncated`
    );
  }
  const endF = 840;
  const nEF = endF - eStart + 1;
  const nDF = endF - dStart + 1;

  // ── Pre-compute benefit amounts per filing age ──
  const eFY = new Float64Array(nEF);
  const ePJ = new Float64Array(nEF);
  for (let i = 0; i < nEF; i++) {
    const age = eStart + i;
    ePJ[i] = benefitCentsAtAge(ePiaDol, eNra, eDri, age);
    eFY[i] = filingYearCents(ePiaDol, eNra, eDri, age, eSsaBirth, eNraEpoch);
  }

  const dFY = new Float64Array(nDF);
  const dPJ = new Float64Array(nDF);
  for (let i = 0; i < nDF; i++) {
    const age = dStart + i;
    dPJ[i] = benefitCentsAtAge(dPiaDol, dNra, dDri, age);
    dFY[i] = filingYearCents(dPiaDol, dNra, dDri, age, dSsaBirth, dNraEpoch);
  }

  // ── Pre-tabulate PV and discount factors ──
  const tableSize = maxDeath + 3 - curEpoch;
  const pvF = new Float64Array(tableSize);
  const dkF = new Float64Array(tableSize);
  if (mRate === 0) {
    for (let i = 0; i < tableSize; i++) {
      pvF[i] = i;
      dkF[i] = 1;
    }
  } else {
    pvF[0] = 0;
    dkF[0] = 1;
    const inv = 1 / (1 + mRate);
    let pw = 1;
    for (let i = 1; i < tableSize; i++) {
      pw *= inv;
      pvF[i] = (1 - pw) / mRate;
      dkF[i] = pw;
    }
  }

  // ── Suffix sums over dep death distribution (enables O(1) inner loop) ──
  // cumP[j]     = Σ_{i>=j} P(i)                              (tail probability)
  // cumPdkF2[j] = Σ_{i>=j} P(i) * dkF[ddE[i]+2-curEpoch]    (for NPV decomposition)
  // cumPdd[j]   = Σ_{i>=j} P(i) * ddE[i]                     (for mRate=0 case)
  const cumP = new Float64Array(nDD + 1);
  const cumPdkF2 = new Float64Array(nDD + 1);
  const cumPdd = new Float64Array(nDD + 1);
  for (let i = nDD - 1; i >= 0; i--) {
    cumP[i] = cumP[i + 1] + ddP[i];
    cumPdkF2[i] = cumPdkF2[i + 1] + ddP[i] * dkF[ddE[i] + 2 - curEpoch];
    cumPdd[i] = cumPdd[i + 1] + ddP[i] * ddE[i];
  }

  // ── Pre-compute dep personal NPV table + probability-weighted suffix sums ──
  const depNPVTable = depZeroPia ? null : new Float64Array(nDF * nDD);
  const depNPVSuffixSum = depZeroPia ? null : new Float64Array(nDF * (nDD + 1));
  if (depNPVTable && depNPVSuffixSum) {
    for (let fdI = 0; fdI < nDF; fdI++) {
      const fdAge = dStart + fdI;
      const depFileEpoch = dSsaBirth + fdAge;
      const depFilingYearCents = dFY[fdI];
      const depPostJanCents = dPJ[fdI];
      const depJanEpoch = depFileEpoch + (12 - (depFileEpoch % 12));
      const tableBase = fdI * nDD;
      const suffixBase = fdI * (nDD + 1);
      for (let di = 0; di < nDD; di++) {
        const dDeath = ddE[di];
        let npv = 0;
        if (dDeath >= depFileEpoch) {
          const dp1End = depJanEpoch - 1 < dDeath ? depJanEpoch - 1 : dDeath;
          if (depFilingYearCents !== 0) {
            const fp = depFileEpoch + 1;
            const lp = dp1End + 1;
            const es = curP1 > fp ? curP1 : fp;
            if (es <= lp)
              npv += depFilingYearCents * pvF[lp - es + 1] * dkF[es - curEpoch];
          }
          if (dDeath >= depJanEpoch && depPostJanCents !== 0) {
            const fp = depJanEpoch + 1;
            const lp = dDeath + 1;
            const es = curP1 > fp ? curP1 : fp;
            if (es <= lp)
              npv += depPostJanCents * pvF[lp - es + 1] * dkF[es - curEpoch];
          }
        }
        depNPVTable[tableBase + di] = npv;
      }
      // Build suffix sum: depNPVSuffixSum[j] = Σ_{i>=j} P(i) * depNPV[i]
      depNPVSuffixSum[suffixBase + nDD] = 0;
      for (let i = nDD - 1; i >= 0; i--) {
        depNPVSuffixSum[suffixBase + i] =
          depNPVSuffixSum[suffixBase + i + 1] +
          ddP[i] * depNPVTable[tableBase + i];
      }
    }
  }

  // Binary search over ddE: first index where ddE[i] >= target.
  // Specialized to ddE (the only array we ever search) so that hi=nDD is
  // always the correct bound; don't add an arr parameter without also
  // deriving hi from it.
  function lowerBound(target: number): number {
    let lo = 0;
    let hi = nDD;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ddE[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  // Compute Σ_{jLo <= i < jHi} P(i) * amt * pvF[n_i] * dkF[kSp]
  // — the probability-weighted spousal NPV over a range of dep deaths —
  // in O(1) using pre-computed suffix sums.
  //
  // Derivation: for each dep death i in the range, the spousal period ends
  // at ddE[i] and has length n_i = ddE[i] + 2 - (curEpoch + kSp). Using the
  // identity pvF[n] * dkF[k] = (dkF[k] - dkF[k+n]) / r, the NPV per death
  // becomes amt * (dkF[kSp] - dkF[ddE[i] + 2 - curEpoch]) / r, and the
  // probability-weighted sum reduces to a subtraction of suffix-sum slices.
  function spousalSum(
    amt: number,
    kSp: number,
    jLo: number,
    jHi: number
  ): number {
    if (amt === 0 || jLo >= jHi) return 0;
    const pSlice = cumP[jLo] - cumP[jHi];
    if (mRate > 0) {
      const pdkSlice = cumPdkF2[jLo] - cumPdkF2[jHi];
      return (amt / mRate) * (dkF[kSp] * pSlice - pdkSlice);
    }
    // mRate === 0 degenerate case: pvF[n] = n, dkF = 1, so each NPV is
    // amt * n_i = amt * (ddE[i] + 2 - curEpoch - kSp). Sum distributes
    // into Σ P * ddE and Σ P, both available as suffix sums.
    const pddSlice = cumPdd[jLo] - cumPdd[jHi];
    return amt * (pddSlice + (2 - curEpoch - kSp) * pSlice);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Main loop — iterate filing-age pairs, collapse dep-death dimension
  // ═══════════════════════════════════════════════════════════════════════
  //
  // For each filing pair (f0, f1), we compute E[NPV] weighted across all
  // (d_e, d_d) death pairs. Per earner death d_e, the dep-death sum
  // decomposes into three possible contributions based on how d_d relates
  // to svStart = max(earnerDeath + 1, depFiling):
  //
  //   Group      Condition                             Components
  //   ───────────────────────────────────────────────────────────────────
  //   ABOVE      dd > svStart AND survivor applies     fixedDep + fixedSp + survivor
  //              (dep outlives earner, takes survivor   benefit)
  //   ABOVE'     dd >= svStart AND survivor not apply  depTable + fixedSp
  //              (dep outlives but personal > survivor)
  //   BELOW      dd <  svStart                         depTable + spByDeath
  //              (dep dies first; spousal ends at d_d)
  //
  // fixedDep, fixedSp are constant for a given (filing pair, earner death).
  // depTable is pre-computed; spByDeath is computed via suffix-sum trick.
  // Survivor NPV sum uses the dkF decomposition to fold the d_d loop into O(1).
  //
  // We iterate f0/f1 (not fe/fd) so the push order matches the exact
  // reference — this gives identical tie-breaking under stable sort when
  // multiple filing pairs produce identical NPVs.
  const results: CoupleFilingAgeResult[] = [];
  const sf0 = earnerIndex === 0 ? eStart : dStart;
  const sf1 = earnerIndex === 0 ? dStart : eStart;

  for (let f0 = sf0; f0 <= endF; f0++) {
    for (let f1 = sf1; f1 <= endF; f1++) {
      const fe = earnerIndex === 0 ? f0 : f1;
      const fd = earnerIndex === 0 ? f1 : f0;
      const feI = fe - eStart;
      const fdI = fd - dStart;

      const eFile = eSsaBirth + fe;
      const efy = eFY[feI];
      const epj = ePJ[feI];
      const eJan = eFile + (12 - (eFile % 12));

      let dFile = dSsaBirth + fd;
      if (depZeroPia && dFile < eFile) dFile = eFile;

      const dfy = depZeroPia ? 0 : dFY[fdI];
      const dpj = depZeroPia ? 0 : dPJ[fdI];
      const dJan = dFile + (12 - (dFile % 12));

      let spAmt = 0;
      const spStart = eFile > dFile ? eFile : dFile;
      if (spEligible) {
        spAmt = spousalCentsForPair(
          dPiaRaw,
          ePiaRaw,
          dFile,
          dNraEpoch,
          spStart,
          dfy,
          dpj
        );
      }

      const depFinalPersonal = dpj;
      const depNPVSuffixBase = fdI * (nDD + 1);
      const totalDepNPV = depNPVSuffixSum
        ? depNPVSuffixSum[depNPVSuffixBase]
        : 0;
      const kSp = (curP1 > spStart + 1 ? curP1 : spStart + 1) - curEpoch;
      const jSp = lowerBound(spStart); // first dep death >= spStart
      let expNPV = 0;

      for (let ei = 0; ei < nED; ei++) {
        const pe = edP[ei];
        if (pe === 0) continue;
        const eDeath = edE[ei];

        // Earner personal NPV -- independent of dep death, factor out
        let eNPV = 0;
        if (eDeath >= eFile) {
          const p1End = eJan - 1 < eDeath ? eJan - 1 : eDeath;
          if (efy !== 0) {
            const fp = eFile + 1;
            const lp = p1End + 1;
            const es = curP1 > fp ? curP1 : fp;
            if (es <= lp) eNPV += efy * pvF[lp - es + 1] * dkF[es - curEpoch];
          }
          if (eDeath >= eJan && epj !== 0) {
            const fp = eJan + 1;
            const lp = eDeath + 1;
            const es = curP1 > fp ? curP1 : fp;
            if (es <= lp) eNPV += epj * pvF[lp - es + 1] * dkF[es - curEpoch];
          }
        }
        expNPV += pe * eNPV;

        // Survivor pre-computation (per earner death)
        const svStart = eDeath + 1 > dFile ? eDeath + 1 : dFile;
        const svAmt = survivorCentsCalc(
          ePiaRaw,
          ePiaDol,
          eNra,
          eDri,
          eSsaBirth,
          eNraEpoch,
          eFile,
          eDeath,
          e70Epoch,
          dSurvNra,
          svStart,
          dSsaBirth
        );
        const svExceeds = depFinalPersonal < svAmt;

        // j0: first dep death index > svStart (survivor eligible)
        // jEq: first dep death index >= svStart (spousal bounded by earner death)
        const j0 = lowerBound(svStart + 1);
        const jEq = lowerBound(svStart);

        if (svExceeds) {
          // Fixed dep personal NPV (ends at svStart-1)
          let fixedDepNPV = 0;
          const fixedEnd = svStart - 1;
          if (fixedEnd >= dFile) {
            const dp1End = dJan - 1 < fixedEnd ? dJan - 1 : fixedEnd;
            if (dfy !== 0) {
              const fp = dFile + 1;
              const lp = dp1End + 1;
              const es = curP1 > fp ? curP1 : fp;
              if (es <= lp)
                fixedDepNPV += dfy * pvF[lp - es + 1] * dkF[es - curEpoch];
            }
            if (fixedEnd >= dJan && dpj !== 0) {
              const fp = dJan + 1;
              const lp = fixedEnd + 1;
              const es = curP1 > fp ? curP1 : fp;
              if (es <= lp)
                fixedDepNPV += dpj * pvF[lp - es + 1] * dkF[es - curEpoch];
            }
          }

          // Fixed spousal NPV (ends at svStart-1)
          let fixedSpNPV = 0;
          if (spAmt > 0 && fixedEnd >= spStart) {
            const fp = spStart + 1;
            const lp = fixedEnd + 1;
            const es = curP1 > fp ? curP1 : fp;
            if (es <= lp)
              fixedSpNPV = spAmt * pvF[lp - es + 1] * dkF[es - curEpoch];
          }

          // Above group (dd > svStart): survivor active
          const aboveP = cumP[j0];
          const aboveFixed = (fixedDepNPV + fixedSpNPV) * aboveP;

          // Survivor NPV sum via decomposition:
          // Σ P * svAmt * pvF[n] * dkF[k] = (svAmt/r) * (dkF[k]*ΣP - ΣP*dkF[dd+2-cur])
          const svK = (curP1 > svStart + 1 ? curP1 : svStart + 1) - curEpoch;
          let aboveSurv = 0;
          if (svAmt > 0 && aboveP > 0) {
            if (mRate > 0) {
              aboveSurv = (svAmt / mRate) * (dkF[svK] * aboveP - cumPdkF2[j0]);
            } else {
              aboveSurv = svAmt * (cumPdd[j0] + (2 - curEpoch - svK) * aboveP);
            }
          }

          // Below group (dd <= svStart): no survivor
          // Split at jEq: ddE < svStart uses spousal end=dDeath,
          // ddE = svStart uses spousal end=svStart-1 (= fixedSpNPV)
          const belowDep = depNPVSuffixSum
            ? depNPVSuffixSum[depNPVSuffixBase] -
              depNPVSuffixSum[depNPVSuffixBase + j0]
            : 0;
          const belowSp_under = spousalSum(
            spAmt,
            kSp,
            jSp < jEq ? jSp : jEq,
            jEq
          );
          const belowSp_at = fixedSpNPV * (cumP[jEq] - cumP[j0]);
          const belowSp = belowSp_under + belowSp_at;

          expNPV += pe * (aboveFixed + aboveSurv + belowDep + belowSp);
        } else {
          // No survivor switch for any dep death
          // Dep personal: sum over ALL dep deaths (depEnd = dDeath always)
          // Spousal: below jEq uses end=dDeath, at/above jEq uses end=svStart-1

          let fixedSpNPV = 0;
          if (spAmt > 0 && svStart - 1 >= spStart) {
            const fp = spStart + 1;
            const lp = svStart;
            const es = curP1 > fp ? curP1 : fp;
            if (es <= lp)
              fixedSpNPV = spAmt * pvF[lp - es + 1] * dkF[es - curEpoch];
          }

          const belowSp = spousalSum(spAmt, kSp, jSp < jEq ? jSp : jEq, jEq);
          const aboveSp = fixedSpNPV * cumP[jEq];

          expNPV += pe * (totalDepNPV + belowSp + aboveSp);
        }
      }

      results.push({
        filingAges: [new MonthDuration(f0), new MonthDuration(f1)],
        expectedNPVCents: expNPV,
      });
    }
  }

  results.sort((a, b) => b.expectedNPVCents - a.expectedNPVCents);
  return results;
}

// ═════════════════════════════════════════════════════════════════════════
// COUPLE — SLOW PATH (exact reference, brute-force double sum)
// ═════════════════════════════════════════════════════════════════════════

/**
 * Exact probability-weighted expected NPV for every candidate filing-age
 * pair. Brute-force iterates all (earnerDeath, depDeath) pairs, delegating
 * each NPV to strategySumCentsCouple (which uses precise monthly benefit
 * periods with Money / MonthDate objects).
 *
 * Kept for:
 *   - Golden test generation (see generate-goldens.test.ts)
 *   - Ground truth for validating `expectedNPVCoupleOptimized`
 *
 * Not used by the UI — it is ~8x slower than the optimized version.
 * For typical inputs (F≈96, D≈60), this function performs ~33M calls to
 * strategySumCentsCouple, each allocating multiple objects. That is the
 * cost we eliminate in the optimized path.
 *
 * Deaths are assumed independent (standard actuarial assumption).
 *
 * @returns Array of {filingAges, expectedNPVCents} sorted descending by
 *          expectedNPVCents. The first element is the optimal filing pair.
 */
export function expectedNPVCouple(
  recipients: [Recipient, Recipient],
  currentDate: MonthDate,
  discountRate: number,
  deathProbDists: [DeathProbability[], DeathProbability[]]
): CoupleFilingAgeResult[] {
  if (deathProbDists[0].length === 0 || deathProbDists[1].length === 0) {
    return [];
  }

  const startFiling0 = earliestFiling(recipients[0], currentDate).asMonths();
  const startFiling1 = earliestFiling(recipients[1], currentDate).asMonths();
  const endFiling = 70 * 12;

  // Pre-compute death dates for each death age to avoid repeated allocation
  const deathDates: [MonthDate[], MonthDate[]] = [[], []];
  for (let i = 0; i < 2; i++) {
    for (const { age } of deathProbDists[i]) {
      deathDates[i].push(
        recipients[i].birthdate.dateAtLayAge(
          MonthDuration.initFromYearsMonths({ years: age, months: 6 })
        )
      );
    }
  }

  const results: CoupleFilingAgeResult[] = [];

  for (let f0 = startFiling0; f0 <= endFiling; f0++) {
    const filingAge0 = new MonthDuration(f0);

    for (let f1 = startFiling1; f1 <= endFiling; f1++) {
      const filingAge1 = new MonthDuration(f1);
      const strats: [MonthDuration, MonthDuration] = [filingAge0, filingAge1];

      let expectedNPVCents = 0;

      for (let ei = 0; ei < deathProbDists[0].length; ei++) {
        const pe = deathProbDists[0][ei].probability;
        if (pe === 0) continue;

        for (let di = 0; di < deathProbDists[1].length; di++) {
          const pd = deathProbDists[1][di].probability;
          if (pd === 0) continue;

          const npv = strategySumCentsCouple(
            recipients,
            [deathDates[0][ei], deathDates[1][di]],
            currentDate,
            discountRate,
            strats
          );

          expectedNPVCents += pe * pd * npv;
        }
      }

      results.push({
        filingAges: [filingAge0, filingAge1],
        expectedNPVCents,
      });
    }
  }

  results.sort((a, b) => b.expectedNPVCents - a.expectedNPVCents);
  return results;
}
