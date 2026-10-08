import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  earliestSurvivorBenefitDate,
  emptyWidowedInput,
  isEligibleToHaveFiledForSurvivor,
  type LateSpouse,
  lateSpouseProblem,
  lateSpouseSurvivorBasis,
  validateDeathMonth,
  validateLateSpouseFiledMonth,
  validateSurvivorFiledMonth,
  type WidowedInput,
  type WidowedSnapshot,
  widowedSnapshot,
} from '$lib/strategy/calculations/late-spouse';

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

describe('validateDeathMonth', () => {
  const birthdate = Birthdate.FromYMD(1958, 4, 15);

  it('accepts a past month', () => {
    expect(validateDeathMonth(birthdate, month(2024, 2), currentDate)).toBe(
      null
    );
  });

  it('accepts the current month', () => {
    expect(validateDeathMonth(birthdate, currentDate, currentDate)).toBe(null);
  });

  it('rejects a future month', () => {
    expect(validateDeathMonth(birthdate, month(2026, 10), currentDate)).toMatch(
      /future/
    );
  });

  it('rejects a month before they were born', () => {
    expect(validateDeathMonth(birthdate, month(1958, 3), currentDate)).toMatch(
      /born/
    );
  });
});

describe('validateLateSpouseFiledMonth', () => {
  // Born 15 May 1958: SSA attains 62 on 14 May 2020, so the first full month
  // at 62 is June 2020.
  const birthdate = Birthdate.FromYMD(1958, 4, 15);
  const death = month(2024, 2);

  it('accepts a month between age 62 and the death', () => {
    expect(validateLateSpouseFiledMonth(birthdate, month(2021, 0), death)).toBe(
      null
    );
  });

  it('rejects a month before the first full month at 62', () => {
    expect(
      validateLateSpouseFiledMonth(birthdate, month(2020, 4), death)
    ).toMatch(/June 2020/);
  });

  it('rejects the month of death and later', () => {
    // No retirement benefit is payable for the month of death.
    expect(validateLateSpouseFiledMonth(birthdate, death, death)).toMatch(
      /before the month they died/
    );
    expect(
      validateLateSpouseFiledMonth(birthdate, month(2024, 5), death)
    ).toMatch(/before the month they died/);
  });
});

describe('earliestSurvivorBenefitDate', () => {
  it('is the month the survivor attains 60 when the death came earlier', () => {
    // Born 15 Aug 1966: attains 60 on 14 Aug 2026. There is no "throughout
    // the month" rule for survivors (POMS RS 00207.001).
    const survivor = Birthdate.FromYMD(1966, 7, 15);
    expect(
      earliestSurvivorBenefitDate(survivor, month(2020, 0)).monthsSinceEpoch()
    ).toBe(month(2026, 7).monthsSinceEpoch());
  });

  it('is the month before the 60th birthday for someone born on the 1st', () => {
    // Born 1 Aug 1966: attains 60 on 31 Jul 2026, so July 2026.
    const survivor = Birthdate.FromYMD(1966, 7, 1);
    expect(
      earliestSurvivorBenefitDate(survivor, month(2020, 0)).monthsSinceEpoch()
    ).toBe(month(2026, 6).monthsSinceEpoch());
  });

  it('is the month of death when the survivor was already 60', () => {
    // Survivor benefits can begin with the month of death (20 CFR
    // 404.621(a)(4)(ii)).
    const survivor = Birthdate.FromYMD(1955, 0, 15);
    expect(
      earliestSurvivorBenefitDate(survivor, month(2024, 2)).monthsSinceEpoch()
    ).toBe(month(2024, 2).monthsSinceEpoch());
  });
});

describe('isEligibleToHaveFiledForSurvivor', () => {
  const death = month(2024, 2);

  it('is true once the earliest survivor month has arrived', () => {
    const survivor = Birthdate.FromYMD(1960, 0, 15);
    expect(isEligibleToHaveFiledForSurvivor(survivor, death, currentDate)).toBe(
      true
    );
  });

  it('is false for a survivor not yet 60', () => {
    const survivor = Birthdate.FromYMD(1970, 0, 15);
    expect(isEligibleToHaveFiledForSurvivor(survivor, death, currentDate)).toBe(
      false
    );
  });
});

describe('validateSurvivorFiledMonth', () => {
  const survivor = Birthdate.FromYMD(1962, 5, 15); // attains 60 in June 2022
  const death = month(2024, 2);

  it('accepts a month from the death to now', () => {
    expect(
      validateSurvivorFiledMonth(survivor, month(2024, 2), death, currentDate)
    ).toBe(null);
    expect(
      validateSurvivorFiledMonth(survivor, currentDate, death, currentDate)
    ).toBe(null);
  });

  it('rejects a month before the death', () => {
    expect(
      validateSurvivorFiledMonth(survivor, month(2024, 1), death, currentDate)
    ).toMatch(/March 2024/);
  });

  it('rejects a month before the survivor reached 60', () => {
    const young = Birthdate.FromYMD(1964, 5, 15); // attains 60 in June 2024
    expect(
      validateSurvivorFiledMonth(young, month(2024, 4), death, currentDate)
    ).toMatch(/June 2024/);
  });

  it('rejects a future month', () => {
    expect(
      validateSurvivorFiledMonth(survivor, month(2026, 10), death, currentDate)
    ).toMatch(/future/);
  });
});

describe('widowedSnapshot', () => {
  /** Born 15 March 1960: 66 now, 62 in April 2022's first full month. */
  const survivor = makeRecipient(1200, 1960, 2, 15);
  /** Born 2 January 1960: first full month at 62 is January 2022. */
  const spouse = makeRecipient(2000, 1960, 0, 2);

  function input(fields: Partial<WidowedInput>): WidowedInput {
    return { ...emptyWidowedInput(), deathMonth: month(2024, 2), ...fields };
  }

  function snapshotOf(fields: Partial<WidowedInput>): WidowedSnapshot {
    const result = widowedSnapshot(
      survivor,
      spouse,
      input(fields),
      currentDate
    );
    if (result.kind === 'problem') {
      throw new Error(`unexpected problem: ${result.problem}`);
    }
    return result.snapshot;
  }

  function problemOf(fields: Partial<WidowedInput>): string {
    const result = widowedSnapshot(
      survivor,
      spouse,
      input(fields),
      currentDate
    );
    if (result.kind === 'ok') throw new Error('expected a problem');
    return result.problem;
  }

  it('describes a spouse who never claimed', () => {
    expect(snapshotOf({})).toEqual({
      lateSpouse: {
        recipient: spouse,
        deathDate: month(2024, 2),
        claim: { kind: 'none' },
      },
      filed: { survivor: null, own: null },
    });
  });

  it('carries the start month of a retirement claim', () => {
    expect(
      snapshotOf({
        claimKind: 'retirement',
        retirementStartedAt: month(2022, 0),
      }).lateSpouse.claim
    ).toEqual({ kind: 'retirement', startedAt: month(2022, 0) });
  });

  it('describes a disability claim, ignoring a start month left from retirement', () => {
    expect(
      snapshotOf({
        claimKind: 'disability',
        retirementStartedAt: month(2022, 0),
      }).lateSpouse.claim
    ).toEqual({ kind: 'disability' });
  });

  it('ignores a start month left from retirement when they never claimed', () => {
    expect(
      snapshotOf({ claimKind: 'none', retirementStartedAt: month(2022, 0) })
        .lateSpouse.claim
    ).toEqual({ kind: 'none' });
  });

  it('carries the benefits the survivor has already started', () => {
    expect(
      snapshotOf({
        survivorFiledAt: month(2024, 5),
        ownFiledAt: month(2024, 8),
      }).filed
    ).toEqual({ survivor: month(2024, 5), own: month(2024, 8) });
  });

  it('needs the death month', () => {
    expect(problemOf({ deathMonth: null })).toMatch(/month .* died/);
  });

  it('needs the start month of a retirement claim', () => {
    expect(problemOf({ claimKind: 'retirement' })).toMatch(/started/);
  });

  // A share link restores months the form has not yet checked.
  it('rejects a death month in the future', () => {
    expect(problemOf({ deathMonth: month(2026, 10) })).toMatch(/future/);
  });

  it('rejects a death month before they were born', () => {
    expect(problemOf({ deathMonth: month(1959, 0) })).toMatch(/born/);
  });

  it('rejects a retirement start in the month of death', () => {
    expect(
      problemOf({
        claimKind: 'retirement',
        retirementStartedAt: month(2024, 2),
      })
    ).toMatch(/before the month they died/);
  });

  it('rejects survivor benefits that started before the death', () => {
    expect(problemOf({ survivorFiledAt: month(2024, 1) })).toMatch(
      /before the month of death/
    );
  });

  it('rejects own benefits that started before 62', () => {
    expect(problemOf({ ownFiledAt: month(2022, 2) })).toMatch(/April 2022/);
  });

  it('starts each form fresh', () => {
    const a = emptyWidowedInput();
    a.deathMonth = month(2024, 2);
    expect(emptyWidowedInput().deathMonth).toBe(null);
  });
});

describe('lateSpouseProblem', () => {
  const spouse = makeRecipient(2000, 1960, 0, 2);

  it('accepts a spouse who died after claiming', () => {
    expect(
      lateSpouseProblem(
        {
          recipient: spouse,
          deathDate: month(2024, 2),
          claim: { kind: 'retirement', startedAt: month(2022, 0) },
        },
        currentDate
      )
    ).toBe(null);
  });

  it('rejects a death in the future', () => {
    expect(
      lateSpouseProblem(
        {
          recipient: spouse,
          deathDate: month(2027, 0),
          claim: { kind: 'none' },
        },
        currentDate
      )
    ).toMatch(/future/);
  });

  it('rejects a retirement claim that starts after the death', () => {
    expect(
      lateSpouseProblem(
        {
          recipient: spouse,
          deathDate: month(2024, 2),
          claim: { kind: 'retirement', startedAt: month(2024, 5) },
        },
        currentDate
      )
    ).toMatch(/before the month they died/);
  });
});

describe('lateSpouseSurvivorBasis', () => {
  // Born 2 Jan 1962: FRA 67y0m (January 2029), PIA $2,000.
  const deceased = makeRecipient(2000, 1962, 0, 2);
  const dateAt = (a: MonthDuration) => deceased.birthdate.dateAtSsaAge(a);

  function basis(spouse: Omit<LateSpouse, 'recipient'>) {
    return lateSpouseSurvivorBasis({ recipient: deceased, ...spouse });
  }

  it('is 100% of PIA with no limit when they died before FRA without claiming', () => {
    const b = basis({ deathDate: dateAt(age(64, 0)), claim: { kind: 'none' } });
    expect(b.base.value()).toBe(2000);
    expect(b.limit).toBe(null);
  });

  it('includes delayed credits when they died after FRA without claiming', () => {
    // Died at 68y0m: credits for the 12 months from FRA up to the month of
    // death, 8%.
    const b = basis({ deathDate: dateAt(age(68, 0)), claim: { kind: 'none' } });
    expect(b.base.value()).toBe(2160);
    expect(b.limit).toBe(null);
  });

  it('is 100% of PIA with the widow(er)s limit when they claimed early', () => {
    // Claimed at 62: 70% of PIA, $1,400. Limit max($1,400, $1,650).
    const b = basis({
      deathDate: dateAt(age(66, 0)),
      claim: { kind: 'retirement', startedAt: dateAt(age(62, 0)) },
    });
    expect(b.base.value()).toBe(2000);
    expect(b.limit?.value()).toBe(1650);
  });

  it('is their increased benefit when they claimed after FRA', () => {
    const b = basis({
      deathDate: dateAt(age(70, 6)),
      claim: { kind: 'retirement', startedAt: dateAt(age(70, 0)) },
    });
    expect(b.base.value()).toBe(2480);
    expect(b.limit).toBe(null);
  });

  it('is 100% of PIA with no limit for a spouse on disability benefits', () => {
    // A disability benefit is not reduced and earns no delayed credits, even
    // after FRA, when it converts to a retirement benefit at the same rate.
    const b = basis({
      deathDate: dateAt(age(69, 0)),
      claim: { kind: 'disability' },
    });
    expect(b.base.value()).toBe(2000);
    expect(b.limit).toBe(null);
  });
});
