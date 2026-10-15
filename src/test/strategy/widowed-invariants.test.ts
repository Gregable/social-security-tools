/**
 * Rules the widowed calculations must follow for any input, checked on
 * random widow(er)s from 51 to 91 years old, every kind of late-spouse
 * claim, and benefits already started or not.
 */

import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { earliestFilingDate } from '$lib/strategy/calculations/already-filed';
import {
  earliestSurvivorBenefitDate,
  type LateSpouse,
  type LateSpouseClaim,
  lateSpouseSurvivorBasis,
  type WidowedFiled,
} from '$lib/strategy/calculations/late-spouse';
import {
  strategySumCentsWidowed,
  type WidowedStrategy,
  widowedSurvivorBenefit,
} from '$lib/strategy/calculations/widowed-benefits';
import {
  createWidowedContext,
  expectedNPVWidowed,
  optimalStrategyWidowed,
  type WidowedContext,
  widowedExpectedNPVCents,
  widowedHasChoice,
  widowedNPVCents,
} from '$lib/strategy/calculations/widowed-optimizer';
import {
  type OwnClaimAdvice,
  type WidowedAdvice,
  widowedAlternatives,
  widowedRecommendation,
} from '$lib/strategy/ui/widowed-advice';

const currentDate = MonthDate.initFromYearsMonths({ years: 2026, months: 9 });
const months = (n: number) => new MonthDuration(n);

// Seedable PRNG (mulberry32), as in the golden generators.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRecipient(piaCents: number, birthdate: Birthdate): Recipient {
  const r = new Recipient();
  r.birthdate = birthdate;
  r.setPia(Money.fromCents(piaCents));
  return r;
}

interface Scenario {
  readonly survivor: Recipient;
  readonly lateSpouse: LateSpouse;
  readonly filed: WidowedFiled;
  readonly discountRate: number;
}

/** `piaScale` multiplies both PIAs, for the scaling check. */
function randomScenario(rng: () => number, piaScale = 1): Scenario {
  const int = (lo: number, hi: number) =>
    lo + Math.floor(rng() * (hi - lo + 1));
  const survivor = makeRecipient(
    (rng() < 0.15 ? 0 : int(800, 3500) * 100 + int(0, 99)) * piaScale,
    Birthdate.FromYMD(int(1935, 1975), int(0, 11), int(1, 28))
  );
  const spouse = makeRecipient(
    (int(800, 4000) * 100 + int(0, 99)) * piaScale,
    Birthdate.FromYMD(
      survivor.birthdate.layBirthYear() + int(-8, 8),
      int(0, 11),
      int(1, 28)
    )
  );
  const at45 = spouse.birthdate
    .dateAtSsaAge(months(45 * 12))
    .monthsSinceEpoch();
  const now = currentDate.monthsSinceEpoch();
  const deathDate = new MonthDate(int(Math.min(at45, now), now));
  const spouseEarliest = earliestFilingDate(spouse.birthdate);
  let claim: LateSpouseClaim = { kind: 'none' };
  const roll = rng();
  if (roll < 0.15) {
    claim = { kind: 'disability' };
  } else if (roll < 0.6 && spouseEarliest.lessThan(deathDate)) {
    claim = {
      kind: 'retirement',
      startedAt: new MonthDate(
        int(spouseEarliest.monthsSinceEpoch(), deathDate.monthsSinceEpoch() - 1)
      ),
    };
  }
  const survivorEarliest = earliestSurvivorBenefitDate(
    survivor.birthdate,
    deathDate
  ).monthsSinceEpoch();
  const ownEarliest = earliestFilingDate(survivor.birthdate).monthsSinceEpoch();
  return {
    survivor,
    lateSpouse: { recipient: spouse, deathDate, claim },
    filed: {
      survivor:
        rng() < 0.2 && survivorEarliest <= now
          ? new MonthDate(int(survivorEarliest, now))
          : null,
      own:
        rng() < 0.2 && ownEarliest <= now
          ? new MonthDate(int(ownEarliest, now))
          : null,
    },
    discountRate: [0, 0.01, 0.025, 0.05][int(0, 3)],
  };
}

function contextFor(s: Scenario): WidowedContext {
  return createWidowedContext(
    s.survivor,
    s.lateSpouse,
    currentDate,
    s.discountRate,
    s.filed
  );
}

function randomStrategy(
  context: WidowedContext,
  rng: () => number
): WidowedStrategy {
  const pick = (from: MonthDuration, to: MonthDuration) =>
    months(
      from.asMonths() +
        Math.floor(rng() * (to.asMonths() - from.asMonths() + 1))
    );
  return {
    survivorStart: pick(
      context.survivorRange.earliest,
      context.survivorRange.latest
    ),
    ownStart: pick(context.ownRange.earliest, context.ownRange.latest),
  };
}

/** A death distribution from the current age to 112, thinning out. */
function deathDistribution(s: Scenario): DeathProbability[] {
  const fromAge = Math.max(
    currentDate.year() - s.survivor.birthdate.layBirthYear(),
    50
  );
  const out: DeathProbability[] = [];
  let alive = 1;
  for (let a = fromAge; a < 112; a++) {
    const q = Math.min(1, 0.004 * 1.09 ** (a - 60));
    out.push({ age: a, probability: alive * q });
    alive *= 1 - q;
  }
  out.push({ age: 112, probability: alive });
  return out;
}

const close = (a: number, b: number, relative = 1e-6) =>
  Math.abs(a - b) <= relative * Math.max(1, Math.abs(b));

/**
 * Whether any two plans the context searches pay differently for some death
 * month, checked a year apart up to age 110.
 */
function plansCanDiffer(context: WidowedContext, s: Scenario): boolean {
  const last = s.survivor.birthdate
    .dateAtLayAge(months(110 * 12))
    .monthsSinceEpoch();
  const { survivorRange, ownRange } = context;
  for (let d = currentDate.monthsSinceEpoch(); d <= last; d += 12) {
    const finalDate = new MonthDate(d);
    let first: number | null = null;
    for (
      let a = survivorRange.earliest.asMonths();
      a <= survivorRange.latest.asMonths();
      a++
    ) {
      for (
        let b = ownRange.earliest.asMonths();
        b <= ownRange.latest.asMonths();
        b++
      ) {
        const value = widowedNPVCents(
          context,
          { survivorStart: months(a), ownStart: months(b) },
          finalDate
        );
        if (first === null) first = value;
        else if (value !== first) return true;
      }
    }
  }
  return false;
}

/** What a recommendation advises, as text that compares exactly. */
function adviceText(advice: WidowedAdvice): string {
  const one = (a: OwnClaimAdvice): string => {
    switch (a.kind) {
      case 'started':
      case 'file-in':
        return `${a.kind} ${a.month.toString()}`;
      case 'file-now':
        return `file-now ${a.backdateTo.toString()}`;
      default:
        return a.kind;
    }
  };
  return `${one(advice.survivor)}; ${one(advice.own)}; first ${advice.first}`;
}

describe('widowed invariants', () => {
  it(
    'a later survivor start never pays less, up to the cap or full retirement age',
    { timeout: 60_000 },
    () => {
      const rng = mulberry32(1);
      for (let n = 0; n < 400; n++) {
        const s = randomScenario(rng);
        const basis = lateSpouseSurvivorBasis(s.lateSpouse);
        const ceiling = (
          basis.limit === null ? basis.base : Money.min(basis.base, basis.limit)
        ).floorToDollar();
        const fra = s.survivor.survivorNormalRetirementAge().asMonths();
        const first = s.survivor.birthdate
          .ageAtSsaDate(
            earliestSurvivorBenefitDate(
              s.survivor.birthdate,
              s.lateSpouse.deathDate
            )
          )
          .asMonths();
        let previous = 0;
        for (let age = first; age <= Math.max(first, 70 * 12); age++) {
          const cents = widowedSurvivorBenefit(
            s.survivor,
            s.lateSpouse,
            s.survivor.birthdate.dateAtSsaAge(months(age))
          ).cents();
          expect(cents).toBeGreaterThanOrEqual(previous);
          expect(cents).toBeLessThanOrEqual(ceiling.cents());
          if (age >= fra) expect(cents).toBe(ceiling.cents());
          previous = cents;
        }
      }
    }
  );

  it('a plan is worth no less for a longer life', () => {
    const rng = mulberry32(2);
    for (let n = 0; n < 150; n++) {
      const s = randomScenario(rng);
      const context = contextFor(s);
      const strategy = randomStrategy(context, rng);
      let previous = 0;
      for (let age = 61; age <= 110; age += 3) {
        const value = widowedNPVCents(
          context,
          strategy,
          s.survivor.birthdate.dateAtLayAge(months(age * 12))
        );
        expect(value).toBeGreaterThanOrEqual(previous - 1e-6);
        previous = value;
      }
    }
  });

  it(
    'the recommended plan is worth at least the common approaches and any other sampled plan',
    { timeout: 60_000 },
    () => {
      const rng = mulberry32(3);
      for (let n = 0; n < 120; n++) {
        const s = randomScenario(rng);
        const context = contextFor(s);
        const dist = deathDistribution(s);
        const best = expectedNPVWidowed(context, dist);
        const candidates = [
          ...widowedAlternatives(context, currentDate).map((a) => a.strategy),
          ...Array.from({ length: 20 }, () => randomStrategy(context, rng)),
        ];
        for (const strategy of candidates) {
          expect(
            widowedExpectedNPVCents(context, dist, strategy)
          ).toBeLessThanOrEqual(
            best.npvCents + 1e-6 * Math.max(1, best.npvCents)
          );
        }
      }
    }
  );

  it('keeps benefits already started at their actual start ages', () => {
    const rng = mulberry32(4);
    for (let n = 0; n < 300; n++) {
      const s = randomScenario(rng);
      if (s.filed.survivor === null && s.filed.own === null) continue;
      const context = contextFor(s);
      const plans = [
        expectedNPVWidowed(context, deathDistribution(s)).strategy,
        optimalStrategyWidowed(
          context,
          s.survivor.birthdate.dateAtLayAge(months(90 * 12))
        ).strategy,
      ];
      for (const plan of plans) {
        if (s.filed.survivor !== null) {
          expect(plan.survivorStart.asMonths()).toBe(
            s.survivor.birthdate.ageAtSsaDate(s.filed.survivor).asMonths()
          );
        }
        if (s.filed.own !== null) {
          expect(plan.ownStart.asMonths()).toBe(
            s.survivor.birthdate.ageAtSsaDate(s.filed.own).asMonths()
          );
        }
      }
    }
  });

  it(
    'doubling both PIAs doubles what the best plan is worth, up to dollar rounding',
    { timeout: 60_000 },
    () => {
      for (let n = 0; n < 120; n++) {
        // The same draws at both scales, so only the PIAs differ.
        const once = randomScenario(mulberry32(1000 + n), 1);
        const twice = randomScenario(mulberry32(1000 + n), 2);
        const value = (s: Scenario) =>
          expectedNPVWidowed(contextFor(s), deathDistribution(s)).npvCents;
        const single = value(once);
        if (single === 0) continue;
        // Each month's amount is rounded down to the dollar at both scales.
        expect(close(value(twice), 2 * single, 5e-3)).toBe(true);
      }
    }
  );

  it(
    'the fast and slow paths value plans the same, on 3,000 more random cases',
    { timeout: 60_000 },
    () => {
      const rng = mulberry32(5);
      for (let n = 0; n < 3000; n++) {
        const s = randomScenario(rng);
        const context = contextFor(s);
        const strategy = randomStrategy(context, rng);
        const finalDate = s.survivor.birthdate.dateAtLayAge(
          months(Math.floor(60 * 12 + rng() * 50 * 12))
        );
        if (finalDate.lessThan(currentDate)) continue;
        const slow = strategySumCentsWidowed(
          s.survivor,
          s.lateSpouse,
          finalDate,
          currentDate,
          s.discountRate,
          strategy
        );
        expect(close(widowedNPVCents(context, strategy, finalDate), slow)).toBe(
          true
        );
      }
    }
  );

  it(
    'leaves a start date to choose exactly when two plans can pay differently, and otherwise advises the same at any discount rate',
    { timeout: 60_000 },
    () => {
      const rng = mulberry32(11);
      let withChoice = 0;
      let withoutChoice = 0;
      for (let n = 0; n < 150; n++) {
        const s = randomScenario(rng);
        const context = contextFor(s);
        const hasChoice = widowedHasChoice(context);
        expect(hasChoice, `scenario ${n}`).toBe(plansCanDiffer(context, s));
        if (hasChoice) {
          withChoice++;
          continue;
        }
        withoutChoice++;
        const advice = [0, 0.025, 0.08].map((rate) => {
          const atRate = createWidowedContext(
            s.survivor,
            s.lateSpouse,
            currentDate,
            rate,
            s.filed
          );
          expect(widowedHasChoice(atRate), `scenario ${n}`).toBe(false);
          return adviceText(
            widowedRecommendation(atRate, deathDistribution(s))
          );
        });
        expect(new Set(advice).size, `scenario ${n}: ${advice}`).toBe(1);
      }
      expect(withChoice).toBeGreaterThan(20);
      expect(withoutChoice).toBeGreaterThan(20);
    }
  );
});
