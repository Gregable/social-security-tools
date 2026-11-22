import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { IntegrationContext } from '$lib/components/integrations/integration-context';
import {
  buildRsHousehold,
  type RsHousehold,
  type RsHouseholdInputs,
  retirementScenarioUrl,
  rsClaimAge,
  rsClaimAgeFactor,
  rsFields,
  rsPlanFields,
} from '$lib/integrations/retirement-scenario';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

const NOW = MonthDate.initFromYearsMonths({ years: 2026, months: 10 });

function age(years: number, months: number): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

function person(name: string, pia: number, birthdate: Birthdate): Recipient {
  const r = new Recipient();
  r.name = name;
  r.setPia(Money.from(pia));
  r.birthdate = birthdate;
  return r;
}

function atAge(r: Recipient, years: number, months = 0): MonthDate {
  return r.birthdate.dateAtSsaAge(age(years, months));
}

function single(r: Recipient, filingDate: MonthDate | null): RsHouseholdInputs {
  return {
    context: new IntegrationContext(r, null),
    recipientFilingDate: filingDate,
    spouseFilingDate: null,
    now: NOW,
  };
}

function couple(
  recipient: Recipient,
  recipientFilingDate: MonthDate | null,
  spouse: Recipient,
  spouseFilingDate: MonthDate | null
): RsHouseholdInputs {
  return {
    context: new IntegrationContext(recipient, spouse),
    recipientFilingDate,
    spouseFilingDate,
    now: NOW,
  };
}

function build(inputs: RsHouseholdInputs): RsHousehold {
  const household = buildRsHousehold(inputs);
  if (household === null) throw new Error('expected a household');
  return household;
}

describe('rsClaimAgeFactor', () => {
  it("matches Retirement Scenario's formula at whole ages", () => {
    expect(rsClaimAgeFactor(62)).toBeCloseTo(0.7, 10);
    expect(rsClaimAgeFactor(64)).toBeCloseTo(0.8, 10);
    expect(rsClaimAgeFactor(65)).toBeCloseTo(13 / 15, 10);
    expect(rsClaimAgeFactor(67)).toBe(1);
    expect(rsClaimAgeFactor(68)).toBeCloseTo(1.08, 10);
    expect(rsClaimAgeFactor(70)).toBeCloseTo(1.24, 10);
  });
});

describe('rsClaimAge', () => {
  it('rounds to the nearest whole year', () => {
    expect(rsClaimAge(age(66, 5))).toBe(66);
    expect(rsClaimAge(age(66, 6))).toBe(67);
    expect(rsClaimAge(age(67, 0))).toBe(67);
  });

  it('stays within 62 to 70', () => {
    expect(rsClaimAge(age(61, 11))).toBe(62);
    expect(rsClaimAge(age(70, 4))).toBe(70);
  });
});

describe('buildRsHousehold', () => {
  it('sends the PIA as the age-67 benefit for someone born in 1960 or later', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1965, 3, 15));
    const household = build(single(alex, atAge(alex, 68, 3)));

    expect(household.spouse).toBeNull();
    expect(household.you).toMatchObject({
      role: 'you',
      recipient: alex,
      birthYear: 1965,
      birthMonth: 4,
      claimAge: 68,
      benefit: { kind: 'planned' },
    });
    if (household.you.benefit.kind !== 'planned') {
      throw new Error('expected a planned benefit');
    }
    expect(household.you.benefit.benefitAt67.value()).toBe(2000);
    expect(household.you.filingAge).toEqual(age(68, 3));
  });

  it('includes delayed credits up to 67 when full retirement age is earlier', () => {
    // Born June 1958: full retirement age 66 and 8 months. Filing at 67 earns
    // 4 months of 2/3% credits: $2,000 * 1.02667 = $2,053.33, paid as $2,053.
    const alex = person('Alex', 2000, Birthdate.FromYMD(1958, 5, 15));
    const household = build(single(alex, atAge(alex, 69)));

    if (household.you.benefit.kind !== 'planned') {
      throw new Error('expected a planned benefit');
    }
    expect(household.you.benefit.benefitAt67.value()).toBe(2053);
    expect(household.you.claimAge).toBe(69);
  });

  it('enters a benefit that began before this month as already claiming', () => {
    // Born June 1958, filed at 64: 32 months early, 17.78% reduction.
    const alex = person('Alex', 2000, Birthdate.FromYMD(1958, 5, 15));
    const household = build(single(alex, atAge(alex, 64)));

    expect(household.you.claimAge).toBe(64);
    if (household.you.benefit.kind !== 'claiming') {
      throw new Error('expected a claiming benefit');
    }
    expect(household.you.benefit.currentBenefit.value()).toBe(1644);
  });

  it('makes the higher earner "you" and the lower earner the spouse', () => {
    const alex = person('Alex', 900, Birthdate.FromYMD(1966, 0, 10));
    const chris = person('Chris', 2600, Birthdate.FromYMD(1964, 7, 20));
    const household = build(
      couple(alex, atAge(alex, 65), chris, atAge(chris, 70))
    );

    expect(household.you.recipient).toBe(chris);
    expect(household.you.claimAge).toBe(70);
    expect(household.spouse?.recipient).toBe(alex);
    expect(household.spouse?.role).toBe('spouse');
    expect(household.spouse?.claimAge).toBe(65);
    expect(household.spouse?.benefit.kind).toBe('planned');
  });

  it('uses the spousal-only estimate for a spouse with a $0 PIA, capped at 67', () => {
    const alex = person('Alex', 2600, Birthdate.FromYMD(1964, 7, 20));
    const chris = person('Chris', 0, Birthdate.FromYMD(1966, 0, 10));
    const household = build(
      couple(alex, atAge(alex, 67), chris, atAge(chris, 68))
    );

    expect(household.spouse?.benefit.kind).toBe('spousal-only');
    expect(household.spouse?.claimAge).toBe(67);
  });

  it('counts a filing date in the current month as planned', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1959, 4, 15));
    const household = build(single(alex, NOW));
    expect(household.you.benefit.kind).toBe('planned');
  });

  it('uses the calendar birth month for people born on the 1st', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1965, 3, 1)); // Apr 1
    const household = build(single(alex, atAge(alex, 67)));
    expect(household.you).toMatchObject({ birthYear: 1965, birthMonth: 4 });
  });

  it('treats a January 1, 1960 birthday as born in 1959 for the age-67 amount', () => {
    // SSA counts January 1, 1960 as 1959: full retirement age 66 and 10
    // months, so filing at 67 earns 2 months of credits: $2,026.67 -> $2,026.
    const alex = person('Alex', 2000, Birthdate.FromYMD(1960, 0, 1));
    const household = build(single(alex, atAge(alex, 68)));
    expect(household.you).toMatchObject({ birthYear: 1960, birthMonth: 1 });
    if (household.you.benefit.kind !== 'planned') {
      throw new Error('expected a planned benefit');
    }
    expect(household.you.benefit.benefitAt67.value()).toBe(2026);
  });

  it('gives each already-claiming spouse their own current benefit', () => {
    // Both born June 1958 (full retirement age 66 and 8 months). Chris, the
    // higher earner, filed at full retirement age; Alex filed at 64, 32
    // months early: $1,000 * (1 - 17.78%) = $822.
    const alex = person('Alex', 1000, Birthdate.FromYMD(1958, 5, 15));
    const chris = person('Chris', 2600, Birthdate.FromYMD(1958, 5, 15));
    const household = build(
      couple(alex, atAge(alex, 64), chris, atAge(chris, 66, 8))
    );

    expect(household.you.recipient).toBe(chris);
    if (household.you.benefit.kind !== 'claiming') {
      throw new Error('expected a claiming benefit');
    }
    expect(household.you.benefit.currentBenefit.value()).toBe(2600);
    expect(household.spouse?.benefit).toMatchObject({ kind: 'claiming' });
    expect(rsPlanFields(household)).toMatchObject({
      ssClaimAge: 67,
      ssFRABenefit: 2600,
      ssAlreadyClaiming: true,
      spouseSsClaimAge: 64,
      spouseSsFRABenefit: 1027.5, // $822 / 0.8
      spouseSsAlreadyClaiming: true,
    });
  });

  it('keeps a $0-PIA spouse spousal-only after their filing date has passed', () => {
    const alex = person('Alex', 2600, Birthdate.FromYMD(1958, 5, 15));
    const chris = person('Chris', 0, Birthdate.FromYMD(1958, 5, 15));
    const household = build(
      couple(alex, atAge(alex, 66, 8), chris, atAge(chris, 68))
    );

    expect(household.spouse?.benefit.kind).toBe('spousal-only');
    expect(household.spouse?.claimAge).toBe(67);
    expect(rsPlanFields(household).spouseSsAlreadyClaiming).toBeUndefined();
  });

  it('returns null when every PIA is $0', () => {
    const alex = person('Alex', 0, Birthdate.FromYMD(1964, 7, 20));
    const chris = person('Chris', 0, Birthdate.FromYMD(1966, 0, 10));
    expect(
      buildRsHousehold(couple(alex, atAge(alex, 67), chris, atAge(chris, 67)))
    ).toBeNull();
    expect(buildRsHousehold(single(alex, atAge(alex, 67)))).toBeNull();
  });

  it('returns null without a filing date', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1965, 3, 15));
    const chris = person('Chris', 1200, Birthdate.FromYMD(1966, 0, 10));
    expect(buildRsHousehold(single(alex, null))).toBeNull();
    expect(
      buildRsHousehold(couple(alex, atAge(alex, 67), chris, null))
    ).toBeNull();
  });
});

describe('rsPlanFields', () => {
  it('describes a single person', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1965, 3, 15));
    expect(rsPlanFields(build(single(alex, atAge(alex, 67))))).toEqual({
      planType: 'solo_single',
      filingStatus: 'single',
      birthYear: 1965,
      birthMonth: 4,
      ssClaimAge: 67,
      ssFRABenefit: 2000,
    });
  });

  it('describes a couple with the spouse already claiming', () => {
    const alex = person('Alex', 2600, Birthdate.FromYMD(1964, 7, 20));
    const chris = person('Chris', 1000, Birthdate.FromYMD(1962, 2, 10));
    const fields = rsPlanFields(
      build(couple(alex, atAge(alex, 70), chris, atAge(chris, 62, 1)))
    );

    expect(fields).toMatchObject({
      planType: 'household',
      filingStatus: 'married',
      birthYear: 1964,
      birthMonth: 8,
      ssClaimAge: 70,
      ssFRABenefit: 2600,
      spouseBirthYear: 1962,
      spouseBirthMonth: 3,
      spouseSsClaimAge: 62,
      spouseSsAlreadyClaiming: true,
    });
    expect(fields.ssAlreadyClaiming).toBeUndefined();
  });

  it('stores a current benefit so Retirement Scenario shows it back exactly', () => {
    // Retirement Scenario displays Math.round(ssFRABenefit * factor(claimAge)).
    const cases: Array<[number, number, number]> = [
      [1000, 62, 1],
      [1777, 63, 0],
      [2345, 64, 0],
      [3011, 65, 7],
    ];
    for (const [pia, years, months] of cases) {
      const alex = person('Alex', pia, Birthdate.FromYMD(1958, 5, 15));
      const household = build(single(alex, atAge(alex, years, months)));
      if (household.you.benefit.kind !== 'claiming') {
        throw new Error('expected a claiming benefit');
      }
      const fields = rsPlanFields(household);
      const shown = Math.round(
        (fields.ssFRABenefit as number) *
          rsClaimAgeFactor(household.you.claimAge)
      );
      expect(shown).toBe(household.you.benefit.currentBenefit.value());
    }
  });

  it('turns on the spousal-only estimate', () => {
    const alex = person('Alex', 2600, Birthdate.FromYMD(1964, 7, 20));
    const chris = person('Chris', 0, Birthdate.FromYMD(1966, 0, 10));
    const fields = rsPlanFields(
      build(couple(alex, atAge(alex, 67), chris, atAge(chris, 66)))
    );
    expect(fields.spouseUse50pct).toBe(true);
    expect(fields.spouseSsClaimAge).toBe(66);
    expect(fields.spouseSsFRABenefit).toBeUndefined();
  });
});

describe('retirementScenarioUrl', () => {
  it('encodes the plan fields as base64 JSON in the hash', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1965, 3, 15));
    const household = build(single(alex, atAge(alex, 67)));
    const url = retirementScenarioUrl(household);

    const prefix =
      'https://app.retirementscenario.com/?goto=social-security#plan=';
    expect(url.startsWith(prefix)).toBe(true);
    expect(JSON.parse(atob(url.slice(prefix.length)))).toEqual(
      rsPlanFields(household)
    );
  });
});

describe('rsFields', () => {
  it('copies plain digits for amounts and ages', () => {
    const alex = person('Alex', 2400, Birthdate.FromYMD(1965, 3, 15));
    expect(rsFields(build(single(alex, atAge(alex, 67))).you)).toEqual([
      {
        label: 'Your benefit at FRA (age 67)',
        value: '$2,400',
        copyValue: '2400',
      },
      { label: 'Your planned claim age', value: '67', copyValue: '67' },
    ]);
  });

  it('lists the spousal-only estimate for a spouse with a $0 PIA', () => {
    const alex = person('Alex', 2600, Birthdate.FromYMD(1964, 7, 20));
    const chris = person('Chris', 0, Birthdate.FromYMD(1966, 0, 10));
    const household = build(
      couple(alex, atAge(alex, 67), chris, atAge(chris, 66))
    );
    if (household.spouse === null) throw new Error('expected a spouse');
    expect(rsFields(household.spouse)).toEqual([
      { label: 'Estimate as 50% of your FRA benefit', value: 'Checked' },
      { label: 'Spouse planned claim age', value: '66', copyValue: '66' },
    ]);
  });

  it('labels a spouse who is already claiming', () => {
    const alex = person('Alex', 2600, Birthdate.FromYMD(1964, 7, 20));
    const chris = person('Chris', 1000, Birthdate.FromYMD(1962, 2, 10));
    const household = build(
      couple(alex, atAge(alex, 70), chris, atAge(chris, 62, 1))
    );
    if (household.spouse === null) throw new Error('expected a spouse');
    expect(rsFields(household.spouse).map((f) => f.label)).toEqual([
      'Spouse is already receiving Social Security',
      'Spouse Current Monthly Benefit',
      'Spouse Started Claiming at Age',
    ]);
  });
});
