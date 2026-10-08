import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { earliestFilingDate } from '$lib/strategy/calculations/already-filed';
import { BenefitType } from '$lib/strategy/calculations/benefit-period';
import { expectedNPVSingle } from '$lib/strategy/calculations/expected-npv';
import {
  earliestSurvivorBenefitDate,
  type LateSpouse,
  type LateSpouseClaim,
  NOT_FILED_WIDOWED,
  type WidowedFiled,
} from '$lib/strategy/calculations/late-spouse';
import { optimalStrategySingle } from '$lib/strategy/calculations/strategy-calc';
import {
  strategySumCentsWidowed,
  strategySumPeriodsWidowed,
  type WidowedStrategy,
} from '$lib/strategy/calculations/widowed-benefits';
import {
  createWidowedContext,
  expectedNPVWidowed,
  optimalStrategyWidowed,
  type WidowedContext,
  widowedAmounts,
  widowedBenefitUse,
  widowedExpectedNPVCents,
  widowedNPVCents,
} from '$lib/strategy/calculations/widowed-optimizer';

const month = (years: number, monthIndex: number) =>
  MonthDate.initFromYearsMonths({ years, months: monthIndex });
const age = (years: number, months: number) =>
  MonthDuration.initFromYearsMonths({ years, months });

function makeRecipient(
  piaDollars: number,
  year: number,
  monthIndex: number,
  day: number
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(year, monthIndex, day);
  r.setPia(Money.from(piaDollars));
  return r;
}

const currentDate = month(2026, 9); // October 2026

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

interface Scenario {
  readonly survivor: Recipient;
  readonly lateSpouse: LateSpouse;
  readonly filed: WidowedFiled;
  readonly discountRate: number;
}

function randomScenario(rng: () => number): Scenario {
  const int = (lo: number, hi: number) =>
    lo + Math.floor(rng() * (hi - lo + 1));
  const survivor = makeRecipient(
    rng() < 0.15 ? 0 : int(300, 3500),
    int(1935, 1975),
    int(0, 11),
    int(1, 28)
  );
  const spouse = makeRecipient(
    int(500, 4000),
    survivor.birthdate.layBirthYear() + int(-8, 8),
    int(0, 11),
    int(1, 28)
  );
  // Died sometime between age 45 and now.
  const at45 = spouse.birthdate.dateAtSsaAge(age(45, 0)).monthsSinceEpoch();
  const deathEpoch = int(
    Math.min(at45, currentDate.monthsSinceEpoch()),
    currentDate.monthsSinceEpoch()
  );
  const deathDate = new MonthDate(deathEpoch);
  const spouseEarliest = earliestFilingDate(spouse.birthdate);
  let claim: LateSpouseClaim = { kind: 'none' };
  const roll = rng();
  if (roll < 0.15) {
    claim = { kind: 'disability' };
  } else if (roll < 0.6 && spouseEarliest.lessThan(deathDate)) {
    const startedAt = new MonthDate(
      int(spouseEarliest.monthsSinceEpoch(), deathEpoch - 1)
    );
    claim = { kind: 'retirement', startedAt };
  }
  const lateSpouse: LateSpouse = { recipient: spouse, deathDate, claim };

  // Sometimes record benefits that have already started.
  const survivorEarliest = earliestSurvivorBenefitDate(
    survivor.birthdate,
    deathDate
  );
  const survivorFiled =
    rng() < 0.2 && !survivorEarliest.greaterThan(currentDate)
      ? new MonthDate(
          int(
            survivorEarliest.monthsSinceEpoch(),
            currentDate.monthsSinceEpoch()
          )
        )
      : null;
  const ownEarliest = earliestFilingDate(survivor.birthdate);
  const ownFiled =
    rng() < 0.2 && !ownEarliest.greaterThan(currentDate)
      ? new MonthDate(
          int(ownEarliest.monthsSinceEpoch(), currentDate.monthsSinceEpoch())
        )
      : null;

  return {
    survivor,
    lateSpouse,
    filed: { survivor: survivorFiled, own: ownFiled },
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

/** Every strategy the context searches. */
function allStrategies(context: WidowedContext): WidowedStrategy[] {
  const out: WidowedStrategy[] = [];
  const { survivorRange, ownRange } = context;
  for (
    let s = survivorRange.earliest.asMonths();
    s <= survivorRange.latest.asMonths();
    s++
  ) {
    for (
      let o = ownRange.earliest.asMonths();
      o <= ownRange.latest.asMonths();
      o++
    ) {
      out.push({
        survivorStart: new MonthDuration(s),
        ownStart: new MonthDuration(o),
      });
    }
  }
  return out;
}

function slowNPV(s: Scenario, strategy: WidowedStrategy, finalDate: MonthDate) {
  return strategySumCentsWidowed(
    s.survivor,
    s.lateSpouse,
    finalDate,
    currentDate,
    s.discountRate,
    strategy
  );
}

/** A synthetic distribution: deaths from `fromAge`, thinning out with age. */
function syntheticDistribution(fromAge: number): DeathProbability[] {
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

function deathDateFor(survivor: Recipient, ageYears: number): MonthDate {
  return survivor.birthdate.dateAtLayAge(age(ageYears, 6));
}

const closeTo = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    1e-6 * Math.max(1, Math.abs(expected))
  );

describe('widowedNPVCents', () => {
  it('matches the benefit-period NPV for random strategies and deaths', () => {
    const rng = mulberry32(7);
    for (let n = 0; n < 200; n++) {
      const s = randomScenario(rng);
      const context = contextFor(s);
      const strategies = allStrategies(context);
      const strategy = strategies[Math.floor(rng() * strategies.length)];
      const finalDate = deathDateFor(s.survivor, 55 + Math.floor(rng() * 55));
      closeTo(
        widowedNPVCents(context, strategy, finalDate),
        slowNPV(s, strategy, finalDate)
      );
    }
  });
});

describe('optimalStrategyWidowed', () => {
  it('finds the best strategy that brute force over the slow NPV finds', () => {
    const rng = mulberry32(11);
    for (let n = 0; n < 16; n++) {
      const s = randomScenario(rng);
      const context = contextFor(s);
      const finalDate = deathDateFor(s.survivor, 62 + Math.floor(rng() * 40));
      const best = optimalStrategyWidowed(context, finalDate);
      let bruteForceMax = Number.NEGATIVE_INFINITY;
      for (const strategy of allStrategies(context)) {
        bruteForceMax = Math.max(
          bruteForceMax,
          slowNPV(s, strategy, finalDate)
        );
      }
      closeTo(best.npvCents, bruteForceMax);
      closeTo(slowNPV(s, best.strategy, finalDate), bruteForceMax);
    }
  });

  // Classic strategies, at a 0% discount rate and a long life (to 95).
  // Survivor born 15 Mar 1968 (FRA 67, earliest own claim 62y1m); spouse
  // died in November 2025 at 61 without claiming.
  const spouse = (pia: number, claim: LateSpouseClaim = { kind: 'none' }) => ({
    recipient: makeRecipient(pia, 1964, 4, 10),
    deathDate: month(2025, 10),
    claim,
  });

  function bestAt95(ownPia: number, lateSpouse: LateSpouse) {
    const survivor = makeRecipient(ownPia, 1968, 2, 15);
    const context = createWidowedContext(
      survivor,
      lateSpouse,
      currentDate,
      0,
      NOT_FILED_WIDOWED
    );
    return optimalStrategyWidowed(context, deathDateFor(survivor, 95)).strategy;
  }

  it('takes the survivor benefit at 60 and switches to a larger own benefit at 70', () => {
    const best = bestAt95(2500, spouse(1500));
    expect(best.survivorStart.toFullAgeString()).toBe(
      age(60, 0).toFullAgeString()
    );
    expect(best.ownStart.toFullAgeString()).toBe(age(70, 0).toFullAgeString());
  });

  it('takes a small own benefit early and switches to the full survivor benefit at FRA', () => {
    const best = bestAt95(800, spouse(2500));
    expect(best.ownStart.toFullAgeString()).toBe(age(62, 1).toFullAgeString());
    expect(best.survivorStart.toFullAgeString()).toBe(
      age(67, 0).toFullAgeString()
    );
  });

  it('stops waiting near where the limit caps the survivor benefit, bridged by a small own benefit', () => {
    // Spouse claimed at 62 and died in June 2026: the survivor benefit tops
    // out at $1,650 from 62y9m. Without the limit it would keep rising to
    // $2,000 at 67, and a long life would favor waiting for it.
    //
    // At 62y8m it is already $1,647. Starting a month earlier than the cap
    // swaps one $352 own payment for $1,647 (+$1,295) and costs $3 a month
    // for the 394 months after (-$1,182), so 62y8m wins; a month earlier
    // still costs $7 a month (-$2,765). A $500 PIA pays $352 from 62y1m,
    // which bridges the months before.
    const claimedEarly: LateSpouse = {
      recipient: makeRecipient(2000, 1960, 0, 2),
      deathDate: month(2026, 5),
      claim: { kind: 'retirement', startedAt: month(2022, 0) },
    };
    const best = bestAt95(500, claimedEarly);
    expect(best.survivorStart.toFullAgeString()).toBe(
      age(62, 8).toFullAgeString()
    );
    expect(best.ownStart.toFullAgeString()).toBe(age(62, 1).toFullAgeString());
  });
});

describe('own benefits already started', () => {
  // Own benefits since April 2024 at 62y1m: $704 on a $1,000 PIA. The
  // survivor benefit on the late spouse's $2,000 PIA is $1,803 now, at
  // 64y7m (9.84% reduced), and $2,000 from survivor FRA, 67.
  const survivor = makeRecipient(1000, 1962, 2, 15);
  const contextAt = (discountRate: number) =>
    createWidowedContext(
      survivor,
      {
        recipient: makeRecipient(2000, 1961, 2, 15),
        deathDate: month(2025, 10),
        claim: { kind: 'none' },
      },
      currentDate,
      discountRate,
      { survivor: null, own: month(2024, 3) }
    );

  it('waits for the full survivor benefit over a long, undiscounted life', () => {
    const context = contextAt(0);
    const best = optimalStrategyWidowed(context, deathDateFor(survivor, 95));
    expect(best.strategy.ownStart.asMonths()).toBe(age(62, 1).asMonths());
    expect(best.strategy.survivorStart.asMonths()).toBe(age(67, 0).asMonths());
    expect(widowedAmounts(context, best.strategy).survivor.value()).toBe(2000);
  });

  it('takes the survivor benefit now over a short, discounted life', () => {
    const context = contextAt(0.05);
    const best = optimalStrategyWidowed(context, deathDateFor(survivor, 75));
    expect(best.strategy.survivorStart.asMonths()).toBe(age(64, 7).asMonths());
    expect(widowedAmounts(context, best.strategy).survivor.value()).toBe(1803);
  });
});

describe('with no survivor benefit to plan around', () => {
  // A late spouse with a $0 PIA leaves only the survivor's own benefit, so
  // widowed mode must agree with single mode: the same start ages and the
  // same values. Both paths share the payment timing and the treatment of
  // the death month, so a drift in either shows up here.
  const survivor = makeRecipient(2000, 1968, 2, 15);
  const context = createWidowedContext(
    survivor,
    {
      recipient: makeRecipient(0, 1966, 4, 10),
      deathDate: month(2025, 10),
      claim: { kind: 'none' },
    },
    currentDate,
    0.025,
    NOT_FILED_WIDOWED
  );

  it('picks the single-mode filing age and NPV for each death age', () => {
    for (let deathAge = 63; deathAge <= 100; deathAge += 3) {
      const finalDate = deathDateFor(survivor, deathAge);
      const [singleAge, singleNPV] = optimalStrategySingle(
        survivor,
        finalDate,
        currentDate,
        0.025
      );
      const widowed = optimalStrategyWidowed(context, finalDate);
      expect(widowed.strategy.ownStart.asMonths()).toBe(singleAge.asMonths());
      closeTo(widowed.npvCents, singleNPV);
    }
  });

  it('picks the single-mode filing age and expected NPV', () => {
    const dist = syntheticDistribution(58);
    const [single] = expectedNPVSingle(survivor, currentDate, 0.025, dist);
    const widowed = expectedNPVWidowed(context, dist);
    expect(widowed.strategy.ownStart.asMonths()).toBe(
      single.filingAge.asMonths()
    );
    closeTo(widowed.npvCents, single.expectedNPVCents);
  });
});

describe('expectedNPVWidowed', () => {
  it('matches the probability-weighted slow NPV of the strategies it scores', () => {
    const rng = mulberry32(23);
    for (let n = 0; n < 25; n++) {
      const s = randomScenario(rng);
      const context = contextFor(s);
      const currentAge =
        currentDate.year() - s.survivor.birthdate.layBirthYear();
      const dist = syntheticDistribution(Math.max(currentAge, 50));
      const strategies = allStrategies(context);
      const strategy = strategies[Math.floor(rng() * strategies.length)];
      let slow = 0;
      for (const { age: a, probability } of dist) {
        slow += probability * slowNPV(s, strategy, deathDateFor(s.survivor, a));
      }
      closeTo(widowedExpectedNPVCents(context, dist, strategy), slow);
    }
  });

  it('returns the strategy with the highest expected NPV', () => {
    const rng = mulberry32(31);
    for (let n = 0; n < 20; n++) {
      const s = randomScenario(rng);
      const context = contextFor(s);
      const dist = syntheticDistribution(60);
      const best = expectedNPVWidowed(context, dist);
      for (const strategy of allStrategies(context)) {
        expect(
          widowedExpectedNPVCents(context, dist, strategy)
        ).toBeLessThanOrEqual(
          best.npvCents + 1e-6 * Math.max(1, best.npvCents)
        );
      }
      closeTo(
        widowedExpectedNPVCents(context, dist, best.strategy),
        best.npvCents
      );
    }
  });
});

describe('createWidowedContext', () => {
  it('pins a benefit that has already started', () => {
    const survivor = makeRecipient(1200, 1962, 2, 15);
    const lateSpouse: LateSpouse = {
      recipient: makeRecipient(2400, 1960, 5, 10),
      deathDate: month(2024, 3),
      claim: { kind: 'none' },
    };
    const context = createWidowedContext(
      survivor,
      lateSpouse,
      currentDate,
      0.025,
      {
        survivor: month(2024, 5),
        own: null,
      }
    );
    expect(context.survivorRange.hasChoice).toBe(false);
    expect(context.survivorRange.earliest.toFullAgeString()).toBe(
      survivor.birthdate.ageAtSsaDate(month(2024, 5)).toFullAgeString()
    );
    expect(context.ownRange.hasChoice).toBe(true);
  });

  // The form checks these, but a plan built from them anyway would look
  // plausible, so the calculation refuses them too.
  it('refuses a late spouse who died in the future', () => {
    const lateSpouse: LateSpouse = {
      recipient: makeRecipient(2400, 1960, 5, 10),
      deathDate: month(2027, 0),
      claim: { kind: 'none' },
    };
    expect(() =>
      createWidowedContext(
        makeRecipient(1200, 1962, 2, 15),
        lateSpouse,
        currentDate,
        0.025,
        NOT_FILED_WIDOWED
      )
    ).toThrow(/future/);
  });

  it('refuses a retirement claim that started after the death', () => {
    const lateSpouse: LateSpouse = {
      recipient: makeRecipient(2400, 1960, 5, 10),
      deathDate: month(2024, 3),
      claim: { kind: 'retirement', startedAt: month(2024, 6) },
    };
    expect(() =>
      createWidowedContext(
        makeRecipient(1200, 1962, 2, 15),
        lateSpouse,
        currentDate,
        0.025,
        NOT_FILED_WIDOWED
      )
    ).toThrow(/before the month they died/);
  });
});

describe('widowedBenefitUse', () => {
  const survivorFor = (pia: number) => makeRecipient(pia, 1968, 2, 15);
  const lateSpouse: LateSpouse = {
    recipient: makeRecipient(2000, 1964, 4, 10),
    deathDate: month(2025, 10),
    claim: { kind: 'none' },
  };

  function use(ownPia: number, strategy: WidowedStrategy) {
    const survivor = survivorFor(ownPia);
    const context = createWidowedContext(
      survivor,
      lateSpouse,
      currentDate,
      0.025,
      NOT_FILED_WIDOWED
    );
    return widowedBenefitUse(context, strategy, deathDateFor(survivor, 95));
  }

  it('uses both when the plan switches from one to the other', () => {
    expect(
      use(2500, { survivorStart: age(60, 0), ownStart: age(70, 0) })
    ).toEqual({ survivor: true, own: true });
  });

  it('does not use an own benefit that never exceeds the survivor benefit', () => {
    // $600 PIA: at most $744 at 70, under the $1,430 survivor benefit.
    expect(
      use(600, { survivorStart: age(60, 0), ownStart: age(70, 0) })
    ).toEqual({ survivor: true, own: false });
  });

  it('counts a benefit already started as used, even once the other pays more', () => {
    // Survivor benefits since June 2024 at 62y3m: $1,209 on a $1,500 PIA.
    // Own benefit from now, 64y7m, on a $2,500 PIA: $2,097, so the survivor
    // benefit pays nothing more from here on. It has still started.
    const survivor = makeRecipient(2500, 1962, 2, 15);
    const context = createWidowedContext(
      survivor,
      {
        recipient: makeRecipient(1500, 1960, 4, 10),
        deathDate: month(2024, 3),
        claim: { kind: 'none' },
      },
      currentDate,
      0.025,
      { survivor: month(2024, 5), own: null }
    );
    expect(
      widowedBenefitUse(
        context,
        { survivorStart: context.survivorRange.earliest, ownStart: age(64, 7) },
        deathDateFor(survivor, 66)
      )
    ).toEqual({ survivor: true, own: true });
  });

  it('does not use an own benefit that would start after the death', () => {
    // Dies at 61y6m, before the own benefit's 62y1m start.
    const survivor = survivorFor(2500);
    const context = createWidowedContext(
      survivor,
      lateSpouse,
      currentDate,
      0.025,
      NOT_FILED_WIDOWED
    );
    expect(
      widowedBenefitUse(
        context,
        { survivorStart: age(60, 0), ownStart: age(62, 1) },
        survivor.birthdate.dateAtLayAge(age(61, 6))
      )
    ).toEqual({ survivor: true, own: false });
  });

  it('agrees with the payment timeline for random plans and deaths', () => {
    // A benefit is used if it had already started, or if the timeline pays
    // it in some month from now through the death.
    const rng = mulberry32(41);
    for (let n = 0; n < 300; n++) {
      const s = randomScenario(rng);
      const context = contextFor(s);
      const strategies = allStrategies(context);
      const strategy = strategies[Math.floor(rng() * strategies.length)];
      const finalDate = deathDateFor(s.survivor, 55 + Math.floor(rng() * 50));
      const periods = strategySumPeriodsWidowed(
        s.survivor,
        s.lateSpouse,
        finalDate,
        strategy
      );
      const paysFromNow = (type: BenefitType) =>
        periods.some(
          (p) =>
            p.benefitType === type &&
            !p.endDate.lessThan(currentDate) &&
            !p.startDate.greaterThan(finalDate)
        );
      expect(widowedBenefitUse(context, strategy, finalDate)).toEqual({
        survivor:
          s.filed.survivor !== null || paysFromNow(BenefitType.Survivor),
        own: s.filed.own !== null || paysFromNow(BenefitType.Personal),
      });
    }
  });

  it('does not use a survivor benefit that starts after a larger own benefit', () => {
    // Own benefit at 62y1m on a $3,000 PIA is $2,112, over the $2,000
    // survivor benefit even at FRA.
    expect(
      use(3000, { survivorStart: age(67, 0), ownStart: age(62, 1) })
    ).toEqual({ survivor: false, own: true });
  });
});
