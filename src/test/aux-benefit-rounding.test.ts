/**
 * Spousal and survivor benefits follow SSA's rounding: every amount along
 * the way is truncated to the dime, and only the final monthly benefit is
 * truncated to the dollar (POMS RS 00601.020; Act 215(g)). In particular:
 *
 * - The spousal original benefit is half the worker's PIA, truncated to the
 *   dime, and its excess over the spouse's own PIA is what an early claim
 *   reduces (RS 00202.020, RS 00615.201, RS 00615.250).
 * - A spouse whose own benefit carries delayed credits is paid the original
 *   benefit minus that own benefit at the dime, not after dollar rounding
 *   (RS 00615.694; RS 00601.020 D.2).
 * - A survivor's base is the deceased's benefit at the dime, the age
 *   reduction is exact (20 CFR 404.410(c)), and the widow(er)'s limit is
 *   82.5% of the PIA truncated to the dime or the deceased's reduced benefit
 *   at the dime, applied after the age reduction (RS 00615.320).
 */

import { describe, expect, it } from 'vitest';
import { spousalBenefitOnDate, survivorBenefit } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { type MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

const age = (years: number, months = 0) =>
  MonthDuration.initFromYearsMonths({ years, months });

/** A PIA-only recipient born 2 January of `year`. */
function person(piaCents: number, year: number): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(year, 0, 2);
  r.setPia(Money.fromCents(piaCents));
  return r;
}

const at = (r: Recipient, years: number, months = 0): MonthDate =>
  r.birthdate.dateAtSsaAge(age(years, months));

/** Spousal benefit for a dependent claiming at `claimAge` (earner at 62). */
function spousal(
  earner: Recipient,
  dependent: Recipient,
  claimAge: MonthDuration,
  monthsLater = 0
): number {
  const filing = dependent.birthdate.dateAtSsaAge(claimAge);
  return spousalBenefitOnDate(
    dependent,
    earner,
    at(earner, 62),
    filing,
    filing.addDuration(new MonthDuration(monthsLater))
  ).cents();
}

describe("spousal benefits follow SSA's rounding", () => {
  it('matches 20 CFR 404.410(b): $412.40 reduced for 28 months is $332', () => {
    // $412.40 x 116/144 = $332.21, truncated to $332.20, paid as $332.
    const earner = person(82480, 1960);
    const dependent = person(0, 1962); // FRA 67
    expect(spousal(earner, dependent, age(64, 8))).toBe(33200);
  });

  it('truncates half the PIA to the dime before reducing the excess', () => {
    // Half of $1,001.30 is $500.65, truncated to $500.60; less $250.60 own
    // PIA is $250.00; 15 months early: x 129/144 = $223.96 -> $223.
    // Keeping the half-dime would give $250.05 x 129/144 = $224.00 -> $224.
    const earner = person(100130, 1960);
    const dependent = person(25060, 1962);
    expect(spousal(earner, dependent, age(65, 9))).toBe(22300);
  });

  it('subtracts an own benefit with delayed credits at the dime', () => {
    // Own PIA $400.00 claimed at 67y1m: $400 x 12080/12000 = $402.60.
    // Spousal: $600.00 (half of $1,200.10, truncated) - $402.60 = $197.40,
    // paid as $197. Subtracting the dollar-rounded $402 would give $198.
    const earner = person(120010, 1958);
    const dependent = person(40000, 1960);
    expect(spousal(earner, dependent, age(67, 1), 12)).toBe(19700);
  });
});

/** Survivor benefit when the deceased died before filing, before FRA. */
function survivorOfEarlyDeath(
  piaCents: number,
  birthYear: number,
  deathAge: MonthDuration,
  claimAge: MonthDuration
): number {
  const deceased = person(piaCents, birthYear);
  const survivor = person(0, birthYear);
  const death = deceased.birthdate.dateAtSsaAge(deathAge);
  return survivorBenefit(
    survivor,
    deceased,
    death,
    death,
    survivor.birthdate.dateAtSsaAge(claimAge)
  ).cents();
}

describe("survivor benefits follow SSA's rounding", () => {
  it('matches 20 CFR 404.410(c): $785.70, 16 of 64 months early, is $729', () => {
    // Survivor born 1941: survivor FRA 65y4m, 64 months from 60.
    // $785.70 x (1 - 0.285 x 16/64) = $729.72 -> $729.70 -> $729.
    expect(survivorOfEarlyDeath(78570, 1941, age(63), age(64))).toBe(72900);
  });

  it('matches POMS RS 00615.301: $987.60, 37 of 62 months early, is $819', () => {
    // Survivor born 1940: survivor FRA 65y2m, 62 months from 60.
    // $987.60 - $168.00 reduction = $819.60 -> $819.
    expect(survivorOfEarlyDeath(98760, 1940, age(61), age(62, 1))).toBe(81900);
  });

  it('truncates an age-reduced amount just below a whole dollar', () => {
    // $501.40 x (1 - 0.285 x 2/84) = $497.9979, paid as $497, not $498.
    expect(survivorOfEarlyDeath(50140, 1962, age(64), age(66, 10))).toBe(49700);
  });

  it("reduces the deceased's benefit with delayed credits at the dime", () => {
    // Deceased born 1955 (FRA 66y2m), PIA $1,003.40, claimed at 70: 46
    // months of credits, $1,311.12 -> $1,311.10. Survivor born 1965 claims
    // 9 of 84 months early: $1,311.10 x 0.9694643 = $1,271.06 -> $1,271.
    // Reducing the dollar-rounded $1,311 instead would give $1,270.
    const deceased = person(100340, 1955);
    const survivor = person(0, 1965);
    expect(
      survivorBenefit(
        survivor,
        deceased,
        at(deceased, 70),
        at(deceased, 75),
        at(survivor, 66, 3)
      ).cents()
    ).toBe(127100);
  });

  it("truncates 82.5% of the PIA to the dime for the widow(er)'s limit", () => {
    // Deceased born 1960, PIA $1,020.60, claimed at 62 ($714.40). Survivor
    // born 1965 claims at survivor FRA; the limit is the larger of $714.40
    // and 82.5% of $1,020.60 = $841.995, truncated to $841.90: $841.
    const deceased = person(102060, 1960);
    const survivor = person(0, 1965);
    expect(
      survivorBenefit(
        survivor,
        deceased,
        at(deceased, 62),
        at(deceased, 70),
        at(survivor, 67)
      ).cents()
    ).toBe(84100);
  });
});

// ---------------------------------------------------------------------------
// Sweeps against an independent BigInt implementation of SSA's rules.
// ---------------------------------------------------------------------------

/** floor(n / d) for non-negative BigInts, as a whole multiple of `unit`. */
const floorTo = (n: bigint, d: bigint, unit: bigint): bigint =>
  (n / (d * unit)) * unit;

/** Own benefit at the dime: early 5/9% then 5/12% a month, late 2/3%. */
function ssaRibDimes(pia: bigint, fra: number, claim: number): bigint {
  if (claim < fra) {
    const k = BigInt(fra - claim);
    const first = k < 36n ? k : 36n;
    const beyond = k > 36n ? k - 36n : 0n;
    return floorTo(pia * (3600n - 20n * first - 15n * beyond), 3600n, 10n);
  }
  const n = BigInt(Math.min(claim, 840) - fra);
  return floorTo(pia * (12000n + 80n * n), 12000n, 10n);
}

function ssaSpousalEarly(earner: bigint, own: bigint, m: number): bigint {
  const excess = floorTo(earner, 2n, 10n) - own;
  if (excess <= 0n) return 0n;
  const reduced =
    m <= 36
      ? floorTo(excess * BigInt(144 - m), 144n, 10n)
      : floorTo(excess * BigInt(180 - (m - 36)), 240n, 10n);
  return floorTo(reduced, 1n, 100n);
}

function ssaSurvivor(
  base: bigint,
  monthsEarly: number,
  span: number,
  limit: bigint | null
): bigint {
  let reduced = base;
  if (monthsEarly > 0) {
    const d = BigInt(1000 * span);
    reduced = floorTo(base * (d - 285n * BigInt(monthsEarly)), d, 10n);
  }
  if (limit !== null && reduced > limit) reduced = limit;
  return floorTo(reduced, 1n, 100n);
}

describe("SSA's rounding across a sweep of PIAs and claiming months", () => {
  it('spousal benefits claimed early', () => {
    const mismatches: string[] = [];
    for (let e = 200000; e <= 202000; e += 10) {
      const earner = person(e, 1960);
      const dependent = person(50030, 1962); // FRA 67 = 804 months
      for (let m = 1; m <= 60; m++) {
        const got = spousal(earner, dependent, new MonthDuration(804 - m));
        const want = Number(ssaSpousalEarly(BigInt(e), 50030n, m));
        if (got !== want) mismatches.push(`earner ${e}c, ${m} early: ${got}`);
      }
    }
    expect(mismatches.slice(0, 5)).toEqual([]);
  });

  it('spousal benefits after an own claim with delayed credits', () => {
    const mismatches: string[] = [];
    for (let own = 40000; own <= 42000; own += 10) {
      const earner = person(130010, 1958);
      const dependent = person(own, 1960);
      for (let n = 1; n <= 36; n++) {
        const got = spousal(earner, dependent, new MonthDuration(804 + n), 12);
        const rib = ssaRibDimes(BigInt(own), 804, 804 + n);
        const excess = floorTo(130010n, 2n, 10n) - rib;
        const want = excess <= 0n ? 0 : Number(floorTo(excess, 1n, 100n));
        if (got !== want) mismatches.push(`own ${own}c, ${n} late: ${got}`);
      }
    }
    expect(mismatches.slice(0, 5)).toEqual([]);
  });

  it('survivor benefits reduced from the PIA', () => {
    const mismatches: string[] = [];
    for (let p = 100000; p <= 101000; p += 10) {
      for (let k = 0; k <= 84; k++) {
        const got = survivorOfEarlyDeath(
          p,
          1962,
          age(59),
          age(67).subtract(new MonthDuration(k))
        );
        const want = Number(ssaSurvivor(BigInt(p), k, 84, null));
        if (got !== want) mismatches.push(`pia ${p}c, ${k} early: ${got}`);
      }
    }
    expect(mismatches.slice(0, 5)).toEqual([]);
  });

  it("survivor benefits under the widow(er)'s limit", () => {
    const mismatches: string[] = [];
    for (let p = 100000; p <= 110000; p += 10) {
      const deceased = person(p, 1960); // claimed at 62: 60 months early
      const survivor = person(0, 1967);
      const own = ssaRibDimes(BigInt(p), 804, 744);
      const eightyTwo = floorTo(BigInt(p) * 825n, 1000n, 10n);
      const limit = own > eightyTwo ? own : eightyTwo;
      for (const k of [0, 6, 12, 24, 48, 84]) {
        const got = survivorBenefit(
          survivor,
          deceased,
          at(deceased, 62),
          at(deceased, 66),
          survivor.birthdate.dateAtSsaAge(
            age(67).subtract(new MonthDuration(k))
          )
        ).cents();
        const want = Number(ssaSurvivor(BigInt(p), k, 84, limit));
        if (got !== want) mismatches.push(`pia ${p}c, ${k} early: ${got}`);
      }
    }
    expect(mismatches.slice(0, 5)).toEqual([]);
  });

  it("survivor benefits from a deceased's benefit with delayed credits", () => {
    const mismatches: string[] = [];
    for (let p = 100000; p <= 101000; p += 10) {
      const deceased = person(p, 1955); // FRA 66y2m = 794 months
      const survivor = person(0, 1971);
      const base = ssaRibDimes(BigInt(p), 794, 840);
      for (let k = 0; k <= 84; k += 3) {
        const got = survivorBenefit(
          survivor,
          deceased,
          at(deceased, 70),
          at(deceased, 75),
          survivor.birthdate.dateAtSsaAge(
            age(67).subtract(new MonthDuration(k))
          )
        ).cents();
        const want = Number(ssaSurvivor(base, k, 84, null));
        if (got !== want) mismatches.push(`pia ${p}c, ${k} early: ${got}`);
      }
    }
    expect(mismatches.slice(0, 5)).toEqual([]);
  });
});
