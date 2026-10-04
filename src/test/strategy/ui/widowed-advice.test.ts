import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  type LateSpouse,
  NOT_FILED_WIDOWED,
  type WidowedFiled,
} from '$lib/strategy/calculations/late-spouse';
import {
  createWidowedContext,
  earliestModelableDeathAgeWidowed,
  expectedNPVWidowed,
  widowedAmounts,
} from '$lib/strategy/calculations/widowed-optimizer';
import {
  isClaimToMake,
  widowedAdvice,
  widowedAlternatives,
  widowedRecommendation,
} from '$lib/strategy/ui/widowed-advice';

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

// Died November 2025 at 61 without claiming: 100% of a $1,500 PIA.
const lateSpouse: LateSpouse = {
  recipient: makeRecipient(1500, 1964, 4, 10),
  deathDate: month(2025, 10),
  claim: { kind: 'none' },
};

function contextFor(
  survivor: Recipient,
  filed: WidowedFiled = NOT_FILED_WIDOWED,
  spouse: LateSpouse = lateSpouse
) {
  return createWidowedContext(survivor, spouse, currentDate, 0.025, filed);
}

/** A smooth death distribution from `fromAge`, thinning out with age. */
function deathDistribution(fromAge: number): DeathProbability[] {
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

const startAges = (
  alternatives: readonly {
    strategy: { survivorStart: MonthDuration; ownStart: MonthDuration };
  }[]
) =>
  alternatives.map(
    (a) =>
      `${a.strategy.survivorStart.toAgeString()} ${a.strategy.ownStart.toAgeString()}`
  );

describe('widowedAmounts', () => {
  it('reports each benefit at its start age, the own one after any January step-up', () => {
    // Born 15 Mar 1968: survivor benefit at 60 is 71.5% of $1,500; own at 70
    // is 124% of $2,500.
    const context = contextFor(makeRecipient(2500, 1968, 2, 15));
    const amounts = widowedAmounts(context, {
      survivorStart: age(60, 0),
      ownStart: age(70, 0),
    });
    expect(amounts.survivor.value()).toBe(1072);
    expect(amounts.own.value()).toBe(3100);
  });
});

describe('earliestModelableDeathAgeWidowed', () => {
  it('is the first month either benefit could start, for someone under 60', () => {
    const context = contextFor(makeRecipient(2500, 1968, 2, 15));
    expect(earliestModelableDeathAgeWidowed(context).toFullAgeString()).toBe(
      age(60, 0).toFullAgeString()
    );
  });

  it('is the current age once a benefit could already have started', () => {
    // Born 15 Mar 1964: 62y7m in October 2026.
    const context = contextFor(makeRecipient(2500, 1964, 2, 15));
    expect(earliestModelableDeathAgeWidowed(context).toFullAgeString()).toBe(
      age(62, 7).toFullAgeString()
    );
  });
});

describe('widowedAdvice', () => {
  it('advises the survivor benefit first and a switch to the own benefit', () => {
    const context = contextFor(makeRecipient(2500, 1968, 2, 15));
    const advice = widowedAdvice(context, {
      survivorStart: age(60, 0),
      ownStart: age(70, 0),
    });
    expect(advice.first).toBe('survivor');
    expect(advice.survivor).toMatchObject({ kind: 'file-in' });
    expect(advice.own).toMatchObject({ kind: 'file-in' });
    if (advice.survivor.kind !== 'file-in' || advice.own.kind !== 'file-in') {
      throw new Error('unreachable');
    }
    expect(advice.survivor.month.toString()).toBe(month(2028, 2).toString());
    expect(advice.survivor.amount.value()).toBe(1072);
    expect(advice.own.age.toFullAgeString()).toBe(age(70, 0).toFullAgeString());
    expect(advice.own.amount.value()).toBe(3100);
  });

  it('advises the own benefit first and a switch to the survivor benefit', () => {
    // A $1,000 PIA pays about $705 from 62y1m; the survivor benefit is the
    // full $1,500 from survivor FRA, 67.
    const context = contextFor(makeRecipient(1000, 1968, 2, 15));
    const advice = widowedAdvice(context, {
      survivorStart: age(67, 0),
      ownStart: age(62, 1),
    });
    expect(advice.first).toBe('own');
    expect(advice.survivor).toMatchObject({ kind: 'file-in' });
    expect(advice.own).toMatchObject({ kind: 'file-in' });
  });

  it('calls an own benefit that never exceeds the survivor benefit not needed', () => {
    // $500 PIA: at most $620 at 70, under the $1,072 survivor benefit at 60.
    const context = contextFor(makeRecipient(500, 1968, 2, 15));
    const advice = widowedAdvice(context, {
      survivorStart: age(60, 0),
      ownStart: age(70, 0),
    });
    expect(advice.own.kind).toBe('not-needed');
    expect(advice.survivor.kind).toBe('file-in');
    expect(advice.first).toBe(null);
  });

  it('pays the own benefit when the two are equal, so the survivor benefit is not needed', () => {
    // Both $2,000 at 67, the full retirement age for each.
    const context = contextFor(
      makeRecipient(2000, 1968, 2, 15),
      NOT_FILED_WIDOWED,
      { ...lateSpouse, recipient: makeRecipient(2000, 1964, 4, 10) }
    );
    const advice = widowedAdvice(context, {
      survivorStart: age(67, 0),
      ownStart: age(67, 0),
    });
    expect(advice.survivor.kind).toBe('not-needed');
    expect(advice.own.kind).toBe('file-in');
  });

  it('says there is no own benefit for someone with no record', () => {
    const context = contextFor(makeRecipient(0, 1968, 2, 15));
    const advice = widowedAdvice(context, {
      survivorStart: age(67, 0),
      ownStart: context.ownRange.earliest,
    });
    expect(advice.own.kind).toBe('no-benefit');
  });

  it('states a benefit that has already started as a fact', () => {
    // Born 15 Mar 1964; survivor benefits started December 2025 (61y9m).
    const context = contextFor(makeRecipient(800, 1964, 2, 15), {
      survivor: month(2025, 11),
      own: null,
    });
    const advice = widowedAdvice(context, {
      survivorStart: context.survivorRange.earliest,
      ownStart: age(70, 0),
    });
    expect(advice.survivor).toMatchObject({ kind: 'started' });
    if (advice.survivor.kind !== 'started') throw new Error('unreachable');
    expect(advice.survivor.month.toString()).toBe(month(2025, 11).toString());
  });

  it('says to file this month, not to backdate, when the best start is now', () => {
    // Born 15 Mar 1964, 62y7m now, 53 months before survivor FRA: the
    // survivor benefit on a $2,600 PIA is reduced 17.98%, to $2,132.
    const context = contextFor(
      makeRecipient(800, 1964, 2, 15),
      NOT_FILED_WIDOWED,
      { ...lateSpouse, recipient: makeRecipient(2600, 1961, 2, 15) }
    );
    const advice = widowedAdvice(context, {
      survivorStart: age(62, 7),
      ownStart: age(70, 0),
    });
    expect(advice.survivor).toMatchObject({ kind: 'file-in' });
    if (advice.survivor.kind !== 'file-in') throw new Error('unreachable');
    expect(advice.survivor.month.toString()).toBe(currentDate.toString());
    expect(advice.survivor.amount.value()).toBe(2132);
  });

  it('says to file now, backdated, when the best start month has passed', () => {
    // Born 15 Mar 1957: survivor FRA 66y2m, 69y7m now. The spouse died in
    // January 2026, so SSA can pay back to April 2026, six months back.
    const context = contextFor(
      makeRecipient(800, 1957, 2, 15),
      NOT_FILED_WIDOWED,
      {
        ...lateSpouse,
        deathDate: month(2026, 0),
      }
    );
    const advice = widowedAdvice(context, {
      survivorStart: context.survivorRange.earliest,
      ownStart: context.ownRange.earliest,
    });
    expect(advice.survivor).toMatchObject({ kind: 'file-now' });
    if (advice.survivor.kind !== 'file-now') throw new Error('unreachable');
    expect(advice.survivor.backdateTo.toString()).toBe(
      month(2026, 3).toString()
    );
  });
});

describe('widowedRecommendation', () => {
  it('advises the plan with the highest expected NPV, and gives that NPV', () => {
    const context = contextFor(makeRecipient(2500, 1968, 2, 15));
    const dist = deathDistribution(58);
    const best = expectedNPVWidowed(context, dist);
    const recommendation = widowedRecommendation(context, dist);
    expect(recommendation.expectedNPVCents).toBe(best.npvCents);
    expect(recommendation).toMatchObject(widowedAdvice(context, best.strategy));
  });

  it('keeps the first of a tie and calls the unused benefit not needed', () => {
    // Own benefits since April 2026 pay $2,112 on a $3,000 PIA, more than
    // the $2,000 survivor benefit ever could, so every survivor start ties.
    const context = contextFor(
      makeRecipient(3000, 1964, 2, 15),
      { survivor: null, own: month(2026, 3) },
      { ...lateSpouse, recipient: makeRecipient(2000, 1961, 2, 15) }
    );
    const recommendation = widowedRecommendation(
      context,
      deathDistribution(62)
    );
    expect(recommendation.survivor.kind).toBe('not-needed');
    expect(recommendation.own.kind).toBe('started');
    expect(
      expectedNPVWidowed(
        context,
        deathDistribution(62)
      ).strategy.survivorStart.asMonths()
    ).toBe(context.survivorRange.earliest.asMonths());
  });
});

describe('isClaimToMake', () => {
  it('is true only for a claim still to make', () => {
    const amount = Money.from(1000);
    expect(
      isClaimToMake({
        kind: 'file-in',
        month: currentDate,
        age: age(62, 0),
        amount,
      })
    ).toBe(true);
    expect(
      isClaimToMake({ kind: 'file-now', backdateTo: currentDate, amount })
    ).toBe(true);
    expect(isClaimToMake({ kind: 'not-needed' })).toBe(false);
    expect(isClaimToMake({ kind: 'no-benefit' })).toBe(false);
    expect(
      isClaimToMake({
        kind: 'started',
        month: currentDate,
        age: age(62, 0),
        amount,
      })
    ).toBe(false);
  });
});

describe('widowedAlternatives', () => {
  it('values the common approaches against the best for one death age', () => {
    const survivor = makeRecipient(2500, 1968, 2, 15);
    const context = contextFor(survivor);
    const finalDate = survivor.birthdate.dateAtLayAge(age(90, 6));
    const alternatives = widowedAlternatives(context, finalDate);
    // Survivor first and own at 70; own first and survivor at FRA; both as
    // soon as possible.
    expect(startAges(alternatives)).toEqual([
      '60 70',
      '67 62y 1m',
      '60 62y 1m',
    ]);
    for (const alternative of alternatives) {
      expect(alternative.npvCents).toBeGreaterThan(0);
    }
  });

  it('lists approaches that pay the same stream once', () => {
    // Born 15 Mar 1964 (62y7m now) with a $1,200 PIA; the spouse's $2,600
    // PIA makes the survivor benefit at 62y7m ($2,132) larger than the own
    // benefit at any age, so "survivor first, own at 70" and "both now" both
    // amount to the survivor benefit alone, from now. The first is kept.
    const survivor = makeRecipient(1200, 1964, 2, 15);
    const context = contextFor(survivor, NOT_FILED_WIDOWED, {
      ...lateSpouse,
      recipient: makeRecipient(2600, 1961, 2, 15),
    });
    const finalDate = survivor.birthdate.dateAtLayAge(age(84, 8));
    expect(startAges(widowedAlternatives(context, finalDate))).toEqual([
      '62y 7m 70',
      '67 62y 7m',
    ]);
  });

  it('drops duplicates when a benefit has no choice left', () => {
    // No own record: every approach differs only in the survivor start.
    const survivor = makeRecipient(0, 1968, 2, 15);
    const context = contextFor(survivor);
    const finalDate = survivor.birthdate.dateAtLayAge(age(90, 6));
    expect(startAges(widowedAlternatives(context, finalDate))).toEqual([
      '60 62y 1m',
      '67 62y 1m',
    ]);
  });
});
