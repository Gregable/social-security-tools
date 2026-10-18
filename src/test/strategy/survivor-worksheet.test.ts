/**
 * Checks the survivor benefit against SSA's own worksheet for a widow(er)
 * whose late spouse took a reduced retirement benefit (POMS RS 00615.322):
 *
 * - C. Widow(er) at full retirement age: the higher of the late spouse's
 *   reduced benefit and 82.5% of their PIA.
 * - D. Widow(er) under full retirement age: put three amounts in order (the
 *   survivor benefit reduced for age from 100% of the PIA, 82.5% of the PIA,
 *   and the late spouse's reduced benefit) and pay the one SSA's chart marks
 *   for that order.
 *
 * The chart below is copied from the worksheet, so these tests check the code
 * against SSA's procedure rather than against a restatement of it. The three
 * amounts themselves come from the benefit primitives at the dime, which
 * other tests check against hand-worked figures; what is under test here is
 * which amount is paid. RS 00615.320 adds a worked example.
 */

import { describe, expect, it } from 'vitest';
import {
  benefitOnDate,
  reducedSurvivorBenefit,
  survivorBenefit,
} from '$lib/benefit-calculator';
import { benefitDimesAtAge } from '$lib/benefit-rounding';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { earliestFilingDate } from '$lib/strategy/calculations/already-filed';
import { widowedSurvivorBenefit } from '$lib/strategy/calculations/widowed-benefits';

/** The three amounts the worksheet compares. */
type WorksheetAmount = 'reducedWib' | 'pct825' | 'rib';

/**
 * RS 00615.322 D.5: for each order of the three amounts, lowest first, the
 * one that is paid.
 */
const PAYABLE_BY_ORDER = new Map<string, WorksheetAmount>([
  ['reducedWib,pct825,rib', 'reducedWib'], // Sequence 1
  ['reducedWib,rib,pct825', 'reducedWib'], // Sequence 2
  ['pct825,reducedWib,rib', 'reducedWib'], // Sequence 3
  ['pct825,rib,reducedWib', 'rib'], // Sequence 4
  ['rib,reducedWib,pct825', 'reducedWib'], // Sequence 5
  ['rib,pct825,reducedWib', 'pct825'], // Sequence 6
]);

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

function makeRecipient(pia: Money, birthdate: Birthdate): Recipient {
  const r = new Recipient();
  r.birthdate = birthdate;
  r.setPia(pia);
  return r;
}

const months = (n: number) => new MonthDuration(n);

interface Case {
  readonly survivor: Recipient;
  readonly deceased: Recipient;
  /** When the late spouse's reduced retirement benefit started. */
  readonly filedAt: MonthDate;
  readonly diedIn: MonthDate;
  /** When the survivor benefit starts. */
  readonly startsIn: MonthDate;
}

/** A late spouse who claimed before full retirement age, and a survivor. */
function randomCase(rng: () => number): Case {
  const int = (lo: number, hi: number) =>
    lo + Math.floor(rng() * (hi - lo + 1));
  const deceased = makeRecipient(
    Money.fromCents(int(500, 4000) * 100 + int(0, 99)),
    Birthdate.FromYMD(int(1945, 1975), int(0, 11), int(1, 28))
  );
  // Claimed in some month from 62 up to the month before full retirement age.
  const earliest = earliestFilingDate(deceased.birthdate).monthsSinceEpoch();
  const lastEarly = deceased.normalRetirementDate().monthsSinceEpoch() - 1;
  const filedAt = new MonthDate(int(earliest, lastEarly));

  // Most starts fall before survivor full retirement age, where the chart
  // applies; the rest up to two years past it. A start comes at least two
  // months after the claim, leaving room for the death between them, so a
  // survivor too old for any start in that window is redrawn.
  for (;;) {
    const survivor = makeRecipient(
      Money.from(int(0, 3000)),
      Birthdate.FromYMD(
        deceased.birthdate.layBirthYear() + int(-8, 8),
        int(0, 11),
        int(1, 28)
      )
    );
    const latestStart = survivor.survivorNormalRetirementAge().asMonths() + 24;
    const earliestStart = Math.max(
      60 * 12,
      survivor.birthdate.ageAtSsaDate(filedAt.addDuration(months(2))).asMonths()
    );
    if (earliestStart > latestStart) continue;
    const startsIn = survivor.birthdate.dateAtSsaAge(
      months(int(earliestStart, latestStart))
    );
    const diedIn = new MonthDate(
      int(filedAt.monthsSinceEpoch() + 1, startsIn.monthsSinceEpoch() - 1)
    );
    return { survivor, deceased, filedAt, diedIn, startsIn };
  }
}

/**
 * 82.5% of the PIA and the late spouse's reduced benefit, at the dime: SSA
 * compares amounts before rounding the payable one to the dollar (POMS RS
 * 00601.020 D.2), and truncates 82.5% of the PIA to the dime (RS 00615.320's
 * examples: $374.90 gives $309.20).
 */
function limitAmounts(c: Case): { pct825: Money; rib: Money } {
  const piaCents = c.deceased.pia().primaryInsuranceAmount().cents();
  return {
    pct825: Money.fromCents(Math.floor((piaCents * 825) / 10000) * 10),
    // Claimed before full retirement age, so no credits ever apply.
    rib: Money.fromCents(
      benefitDimesAtAge(
        piaCents,
        c.deceased.normalRetirementAge().asMonths(),
        c.deceased.delayedRetirementIncrease(),
        c.deceased.birthdate.ageAtSsaDate(c.filedAt).asMonths()
      )
    ),
  };
}

/** What the worksheet says is paid, and which part of it applied. */
function worksheet(c: Case): {
  readonly dollars: number;
  readonly part: string;
} {
  const pia = c.deceased.pia().primaryInsuranceAmount();
  const amounts: Record<WorksheetAmount, Money> = {
    // Truncated to the dollar, which can only reorder it against an amount
    // in the same dollar; either way the chart then pays that dollar.
    reducedWib: reducedSurvivorBenefit(
      c.survivor,
      { base: pia, limit: null },
      c.startsIn
    ),
    ...limitAmounts(c),
  };
  const atFra = c.survivor.birthdate
    .ageAtSsaDate(c.startsIn)
    .greaterThanOrEqual(c.survivor.survivorNormalRetirementAge());
  if (atFra) {
    const higher = Money.max(amounts.rib, amounts.pct825);
    return { dollars: higher.floorToDollar().value(), part: 'C' };
  }
  // Equal amounts can be ordered either way; the chart pays the same amount.
  const order = (Object.keys(amounts) as WorksheetAmount[]).sort(
    (a, b) => amounts[a].cents() - amounts[b].cents()
  );
  const payable = PAYABLE_BY_ORDER.get(order.join(','));
  if (payable === undefined) throw new Error(`no row for ${order.join(',')}`);
  return {
    dollars: amounts[payable].floorToDollar().value(),
    part: `D:${order.join(',')}`,
  };
}

/** The cap-then-reduce order the code used before the fix, on today's amounts. */
function capThenReduce(c: Case): number {
  const { pct825, rib } = limitAmounts(c);
  return reducedSurvivorBenefit(
    c.survivor,
    { base: Money.max(pct825, rib), limit: null },
    c.startsIn
  ).value();
}

describe("SSA's worksheet for a late spouse who claimed early (RS 00615.322)", () => {
  const rng = mulberry32(615322);
  const cases = Array.from({ length: 3000 }, () => randomCase(rng));

  it('pays what the worksheet pays, in survivorBenefit and in widowed mode', () => {
    const parts = new Map<string, number>();
    for (const c of cases) {
      const expected = worksheet(c);
      parts.set(expected.part, (parts.get(expected.part) ?? 0) + 1);
      const context = `${expected.part} for ${JSON.stringify({
        pia: c.deceased.pia().primaryInsuranceAmount().value(),
        filed: c.filedAt.toString(),
        died: c.diedIn.toString(),
        start: c.startsIn.toString(),
      })}`;
      expect(
        survivorBenefit(
          c.survivor,
          c.deceased,
          c.filedAt,
          c.diedIn,
          c.startsIn
        ).value(),
        context
      ).toBe(expected.dollars);
      expect(
        widowedSurvivorBenefit(
          c.survivor,
          {
            recipient: c.deceased,
            deathDate: c.diedIn,
            claim: { kind: 'retirement', startedAt: c.filedAt },
          },
          c.startsIn
        ).value(),
        context
      ).toBe(expected.dollars);
    }
    // Every row of the chart, and the at-FRA rule, came up.
    expect([...parts.keys()].sort()).toEqual(
      ['C', ...[...PAYABLE_BY_ORDER.keys()].map((order) => `D:${order}`)].sort()
    );
  });

  it('disagrees with the old cap-then-reduce order, so it would have caught it', () => {
    // Before full retirement age, reducing the capped amount always comes
    // out lower, except where both round to the same dollar.
    const beforeFra = cases.filter((c) => worksheet(c).part.startsWith('D'));
    expect(beforeFra.length).toBeGreaterThan(cases.length / 2);
    const disagreements = beforeFra.filter(
      (c) => capThenReduce(c) !== worksheet(c).dollars
    ).length;
    expect(disagreements).toBeGreaterThan(beforeFra.length * 0.9);
  });
});

describe("RS 00615.320's example", () => {
  it('pays a widow(er) at full retirement age the late spouse’s $350, over 82.5% of PIA', () => {
    // The example: a reduced benefit of $350 on a $374.90 PIA, and a widow
    // past full retirement age, who gets the higher of $350 and 82.5% of
    // the PIA. Under today's ages: born 2 March 1950 (full retirement age
    // 66), claiming at 65 is 12 months early, a 6 2/3% reduction, and a
    // $375.01 PIA reduces to $350.
    const deceased = makeRecipient(
      Money.fromCents(37501),
      Birthdate.FromYMD(1950, 2, 2)
    );
    const filedAt = deceased.birthdate.dateAtSsaAge(months(65 * 12));
    const diedIn = filedAt.addDuration(months(3));
    const survivor = makeRecipient(
      Money.from(0),
      Birthdate.FromYMD(1950, 5, 10)
    );
    const startsIn = survivor.birthdate.dateAtSsaAge(months(66 * 12));
    expect(
      benefitOnDate(deceased, filedAt, filedAt.addDuration(months(12))).value()
    ).toBe(350);
    expect(
      survivorBenefit(survivor, deceased, filedAt, diedIn, startsIn).value()
    ).toBe(350);
  });
});
