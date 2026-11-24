import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { IntegrationContext } from '$lib/components/integrations/integration-context';
import {
  buildRcpHousehold,
  type RcpField,
  type RcpHousehold,
  type RcpHouseholdInputs,
  rcpClaim,
  rcpEarliestClaimMonth,
  rcpGuidedFields,
  rcpLatestClaimMonth,
  rcpReceivingFields,
} from '$lib/integrations/retirement-chartplotter';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

/** months is the 0-based month index: 0 = January. */
function month(years: number, months: number): MonthDate {
  return MonthDate.initFromYearsMonths({ years, months });
}

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

describe('rcpEarliestClaimMonth / rcpLatestClaimMonth', () => {
  it('uses the month after the birthday month at 62 for most birthdays', () => {
    const r = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    expect(rcpEarliestClaimMonth(r)).toEqual(month(2027, 3)); // April
    expect(rcpLatestClaimMonth(r)).toEqual(month(2035, 2)); // March
  });

  it('uses the birthday month at 62 for people born on the 2nd', () => {
    const r = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 2));
    expect(rcpEarliestClaimMonth(r)).toEqual(month(2027, 2));
    expect(rcpLatestClaimMonth(r)).toEqual(month(2035, 2));
  });

  it('uses the birthday month at 62 but the month before at 70 for the 1st', () => {
    const r = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 1));
    expect(rcpEarliestClaimMonth(r)).toEqual(month(2027, 2)); // March
    expect(rcpLatestClaimMonth(r)).toEqual(month(2035, 1)); // February
  });
});

describe('rcpClaim', () => {
  it('gives the filing month as a calendar-year age and start month', () => {
    const r = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    const filing = r.birthdate.dateAtSsaAge(age(64, 3)); // June 2029
    expect(rcpClaim(r, filing)).toEqual({
      age: 64,
      month: month(2029, 5),
      moved: false,
    });
  });

  it('moves a filing month before Chartplotter allows to its first month', () => {
    // Born on the 1st: ssa.tools allows December 2025, Chartplotter starts in
    // January 2026.
    const r = person('Alex', 2000, Birthdate.FromYMD(1964, 0, 1));
    expect(rcpClaim(r, month(2025, 11))).toEqual({
      age: 62,
      month: month(2026, 0),
      moved: true,
    });
  });

  it('counts the claim year minus the birth year for a January 1 birthday', () => {
    // The age-70 month for someone born on Jan 1 is December of the year
    // before, so the claim age (claim year minus birth year) is 69.
    const r = person('Alex', 2000, Birthdate.FromYMD(1964, 0, 1));
    expect(rcpClaim(r, month(2034, 5))).toEqual({
      age: 69,
      month: month(2033, 11),
      moved: true,
    });
  });

  it('counts the claim year minus the birth year for a late-December birthday', () => {
    // Born December 15: the first eligible month is January 2028, in the year
    // she turns 63.
    const r = person('Alex', 2000, Birthdate.FromYMD(1965, 11, 15));
    const earliest = rcpEarliestClaimMonth(r);
    expect(earliest).toEqual(month(2028, 0));
    expect(rcpClaim(r, earliest)).toEqual({
      age: 63,
      month: month(2028, 0),
      moved: false,
    });
  });

  it('does not move the first and last months Chartplotter accepts', () => {
    for (const day of [1, 2, 15]) {
      const r = person('Alex', 2000, Birthdate.FromYMD(1965, 2, day));
      expect(rcpClaim(r, rcpEarliestClaimMonth(r)).moved).toBe(false);
      expect(rcpClaim(r, rcpLatestClaimMonth(r)).moved).toBe(false);
    }
  });

  it('moves a filing month after age 70 back to the age-70 month', () => {
    const r = person('Alex', 2000, Birthdate.FromYMD(1955, 5, 15));
    expect(rcpClaim(r, month(2025, 8))).toEqual({
      age: 70,
      month: month(2025, 5),
      moved: true,
    });
  });
});

const NOW = month(2026, 10); // November 2026

function single(
  r: Recipient,
  filingDate: MonthDate | null
): RcpHouseholdInputs {
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
): RcpHouseholdInputs {
  return {
    context: new IntegrationContext(recipient, spouse),
    recipientFilingDate,
    spouseFilingDate,
    now: NOW,
  };
}

function build(inputs: RcpHouseholdInputs): RcpHousehold {
  const household = buildRcpHousehold(inputs);
  if (household === null) throw new Error('expected a household');
  return household;
}

describe('buildRcpHousehold', () => {
  const alex = () => person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
  const chris = () => person('Chris', 900, Birthdate.FromYMD(1966, 6, 20));

  it('gives a single person their PIA and claim', () => {
    const r = alex();
    const h = build(single(r, r.birthdate.dateAtSsaAge(age(67, 0))));
    expect(h.primary.recipient).toBe(r);
    expect(h.primary.role).toBe('primary');
    expect(h.primary.fraBenefit).toEqual(Money.from(2000));
    expect(h.primary.currentBenefit).toBeNull();
    expect(h.primary.claim.age).toBe(67);
    expect(h.primary.claim.month.monthFullName()).toBe('March');
    expect(h.spouse).toBeNull();
    expect(h.year).toBe(2026);
  });

  it('makes the higher earner primary and gives the spouse their PIA', () => {
    const a = alex();
    const c = chris();
    const h = build(
      couple(
        c,
        c.birthdate.dateAtSsaAge(age(64, 3)),
        a,
        a.birthdate.dateAtSsaAge(age(67, 0))
      )
    );
    expect(h.primary.recipient).toBe(a);
    expect(h.spouse?.recipient).toBe(c);
    expect(h.spouse?.role).toBe('spouse');
    expect(h.spouse?.fraBenefit).toEqual(Money.from(900));
    // Chris: July 1966 + 64y3m = October 2030.
    expect(h.spouse?.claim.age).toBe(64);
    expect(h.spouse?.claim.month.monthFullName()).toBe('October');
  });

  it('rounds the PIA down to the dollar', () => {
    const a = alex();
    const c = person('Chris', 900.7, Birthdate.FromYMD(1966, 6, 20));
    const h = build(
      couple(
        a,
        a.birthdate.dateAtSsaAge(age(67, 0)),
        c,
        c.birthdate.dateAtSsaAge(age(67, 0))
      )
    );
    expect(h.spouse?.fraBenefit).toEqual(Money.from(900));
  });

  it('lists a $0-PIA spouse at $0, even with a past filing date', () => {
    const a = alex();
    const c = person('Chris', 0, Birthdate.FromYMD(1962, 6, 20));
    const h = build(
      couple(a, a.birthdate.dateAtSsaAge(age(67, 0)), c, month(2025, 0))
    );
    expect(h.spouse?.fraBenefit).toEqual(Money.from(0));
    expect(h.spouse?.currentBenefit).toBeNull();
  });

  it('gives the current benefit for someone already claiming', () => {
    // FRA 66y8m: filing at 66y0m is 8 months early, 2400 * (1 - 8 * 5/900)
    // = 2293.33.
    const r = person('Alex', 2400, Birthdate.FromYMD(1958, 4, 10));
    const h = build(single(r, r.birthdate.dateAtSsaAge(age(66, 0))));
    expect(h.primary.currentBenefit).toEqual(Money.from(2293));
    expect(h.primary.fraBenefit).toEqual(Money.from(2400));
    expect(h.primary.claim.age).toBe(66);
    expect(h.primary.claim.month.monthFullName()).toBe('May');
  });

  it('gives the benefit with delayed credits for someone who filed after FRA', () => {
    // FRA 66y8m: filing at 68y0m (May 2026) is 16 months late, so
    // 2400 * (1 + 16 * 2/300) = 2656. Evaluated at the filing month itself the
    // credits would not all count yet ($2,592).
    const r = person('Alex', 2400, Birthdate.FromYMD(1958, 4, 10));
    const h = build(single(r, r.birthdate.dateAtSsaAge(age(68, 0))));
    expect(h.primary.currentBenefit).toEqual(Money.from(2656));
  });

  it('treats a filing date in the current month as not yet claiming', () => {
    const r = person('Alex', 2400, Birthdate.FromYMD(1960, 10, 15));
    const h = build(single(r, NOW));
    expect(h.primary.currentBenefit).toBeNull();
  });

  it('gives the spouse their current benefit when already claiming', () => {
    // FRA 66y8m: 900 * (1 - 8 * 5/900) = 860.
    const a = alex();
    const c = person('Chris', 900, Birthdate.FromYMD(1958, 4, 10));
    const h = build(
      couple(
        a,
        a.birthdate.dateAtSsaAge(age(67, 0)),
        c,
        c.birthdate.dateAtSsaAge(age(66, 0))
      )
    );
    expect(h.spouse?.currentBenefit).toEqual(Money.from(860));
  });

  it('returns null when every PIA is $0 or a filing date is missing', () => {
    const zero = person('Alex', 0, Birthdate.FromYMD(1965, 2, 15));
    expect(buildRcpHousehold(single(zero, month(2032, 2)))).toBeNull();
    expect(buildRcpHousehold(single(alex(), null))).toBeNull();
    const a = alex();
    expect(
      buildRcpHousehold(
        couple(a, a.birthdate.dateAtSsaAge(age(67, 0)), chris(), null)
      )
    ).toBeNull();
  });
});

function rows(fields: readonly RcpField[]): string[] {
  return fields.map(
    (f) =>
      `${f.label}: ${f.value}${f.kind === 'number' ? ` [${f.copyValue}]` : ''}`
  );
}

describe('rcpGuidedFields', () => {
  it("lists the primary person's Guided Setup settings", () => {
    const r = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    const h = build(single(r, r.birthdate.dateAtSsaAge(age(64, 3))));
    expect(rows(rcpGuidedFields(h.primary))).toEqual([
      'Gross SS/mo at Full Retirement Age: $2,000 [2000]',
      'Initially Selected Claim Age: 64',
      'Benefit Start Month: June',
    ]);
  });

  it("lists the spouse's Guided Setup settings", () => {
    const a = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    const c = person('Chris', 900, Birthdate.FromYMD(1966, 6, 20));
    const h = build(
      couple(
        a,
        a.birthdate.dateAtSsaAge(age(67, 0)),
        c,
        c.birthdate.dateAtSsaAge(age(64, 3))
      )
    );
    if (h.spouse === null) throw new Error('expected a spouse');
    expect(rows(rcpGuidedFields(h.spouse))).toEqual([
      'Gross SS/mo at Full Retirement Age: $900 [900]',
      'Selected Claim Age: 64',
      'Spouse Benefit Start Month: October',
    ]);
  });
});

describe('rcpReceivingFields', () => {
  const receiver = () => person('Alex', 2400, Birthdate.FromYMD(1958, 4, 10));

  it('lists nothing for someone not yet receiving', () => {
    const r = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    const h = build(single(r, r.birthdate.dateAtSsaAge(age(67, 0))));
    expect(rcpReceivingFields(h.primary, h)).toEqual([]);
  });

  it('lists the settings for a single primary person', () => {
    const r = receiver();
    const h = build(single(r, r.birthdate.dateAtSsaAge(age(66, 0))));
    expect(rows(rcpReceivingFields(h.primary, h))).toEqual([
      'Benefit Values: Receiving Benefits',
      'Original Benefit Start Month: May',
      'Original Claim Age: 66 [66]',
      'Gross SS/mo (before Medicare): $2,293 [2293]',
      'Benefit Year: 2026',
    ]);
  });

  it('adds Current Benefit Includes for a primary person in a couple', () => {
    const a = receiver();
    const c = person('Chris', 900, Birthdate.FromYMD(1965, 2, 15));
    const h = build(
      couple(
        a,
        a.birthdate.dateAtSsaAge(age(66, 0)),
        c,
        c.birthdate.dateAtSsaAge(age(67, 0))
      )
    );
    expect(rows(rcpReceivingFields(h.primary, h))).toEqual([
      'Benefit Values: Receiving Benefits',
      'Original Benefit Start Month: May',
      'Original Claim Age: 66 [66]',
      'Gross SS/mo (before Medicare): $2,293 [2293]',
      'Current Benefit Includes: Own Retirement Benefit Only',
      'Benefit Year: 2026',
    ]);
    if (h.spouse === null) throw new Error('expected a spouse');
    expect(rcpReceivingFields(h.spouse, h)).toEqual([]);
  });

  it('lists the settings for a spouse', () => {
    const a = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    const c = person('Chris', 900, Birthdate.FromYMD(1958, 4, 10));
    const h = build(
      couple(
        a,
        a.birthdate.dateAtSsaAge(age(67, 0)),
        c,
        c.birthdate.dateAtSsaAge(age(66, 0))
      )
    );
    if (h.spouse === null) throw new Error('expected a spouse');
    expect(rows(rcpReceivingFields(h.spouse, h))).toEqual([
      'Benefit Status: Already Receiving Benefits',
      'Spouse Original Benefit Start Month: May',
      'Gross SS/mo: $860 [860]',
      'Current Benefit Includes: Own Retirement Benefit Only',
      'Original Claim Age: 66 [66]',
      'Benefit Year: 2026',
    ]);
  });
});
