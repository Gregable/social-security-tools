import { afterEach, describe, expect, it, vi } from 'vitest';

import { Birthdate } from '$lib/birthday';
import {
  buildStrategyUrl,
  currentMonthDate,
  DEFAULT_DISCOUNT_RATE,
  loadDeathDistributions,
  recommendedFromDistributions,
} from '$lib/components/recommended-filing-card';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  expectedNPVCoupleOptimized,
  expectedNPVSingle,
} from '$lib/strategy/calculations/expected-npv';

vi.mock('$lib/life-tables', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/life-tables')>();
  return { ...actual, getDeathProbabilityDistribution: vi.fn() };
});

import { getDeathProbabilityDistribution } from '$lib/life-tables';

// Filing window is fixed at 62-70 when "now" is before the birthdate, matching
// the existing expected-npv tests (FAR_PAST removes the "filing in the past"
// truncation so results are deterministic).
const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

function makeRecipient(
  piaDollars: number,
  birthYear: number,
  opts: { name?: string; gender?: 'male' | 'female' | 'blended' } = {}
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(birthYear, 3, 15);
  r.setPia(Money.from(piaDollars));
  if (opts.name) r.name = opts.name;
  if (opts.gender) r.gender = opts.gender;
  return r;
}

describe('DEFAULT_DISCOUNT_RATE', () => {
  it('is 2.5%', () => {
    expect(DEFAULT_DISCOUNT_RATE).toBe(0.025);
  });
});

describe('currentMonthDate', () => {
  it('maps a JS Date to a MonthDate (month is 0-based)', () => {
    const md = currentMonthDate(new Date(2025, 0, 15));
    expect(md.year()).toBe(2025);
    expect(md.monthName()).toBe('Jan');
  });

  it('maps December correctly (month index 11)', () => {
    const md = currentMonthDate(new Date(2025, 11, 1));
    expect(md.year()).toBe(2025);
    expect(md.monthName()).toBe('Dec');
  });
});

describe('loadDeathDistributions', () => {
  afterEach(() => vi.clearAllMocks());

  it('single: loads only the recipient, dist2 is null', async () => {
    const r = makeRecipient(1500, 1960);
    const marker = [{ age: 80, probability: 1 }];
    vi.mocked(getDeathProbabilityDistribution).mockResolvedValue(marker);

    const { dist1, dist2 } = await loadDeathDistributions(r, null, 2025);

    expect(dist1).toBe(marker);
    expect(dist2).toBeNull();
    expect(getDeathProbabilityDistribution).toHaveBeenCalledTimes(1);
    expect(getDeathProbabilityDistribution).toHaveBeenCalledWith(r, 2025);
  });

  it('couple: loads both recipient and spouse', async () => {
    const r1 = makeRecipient(2000, 1960);
    const r2 = makeRecipient(800, 1962);
    const m1 = [{ age: 80, probability: 1 }];
    const m2 = [{ age: 82, probability: 1 }];
    vi.mocked(getDeathProbabilityDistribution).mockImplementation(
      async (rec) => (rec === r1 ? m1 : m2)
    );

    const { dist1, dist2 } = await loadDeathDistributions(r1, r2, 2025);

    expect(dist1).toBe(m1);
    expect(dist2).toBe(m2);
    expect(getDeathProbabilityDistribution).toHaveBeenCalledTimes(2);
  });
});

describe('recommendedFromDistributions', () => {
  it('single: returns the top expectedNPVSingle result', () => {
    const r = makeRecipient(1500, 1960);
    const dist: DeathProbability[] = [
      { age: 80, probability: 0.5 },
      { age: 90, probability: 0.5 },
    ];

    const got = recommendedFromDistributions(r, null, dist, null, FAR_PAST, 0);
    const expected = expectedNPVSingle(r, FAR_PAST, 0, dist)[0];

    expect(got).not.toBeNull();
    expect(got!.isSingle).toBe(true);
    expect(got!.single!.filingAge.asMonths()).toBe(
      expected.filingAge.asMonths()
    );
    expect(got!.single!.expectedNPVCents).toBe(expected.expectedNPVCents);
  });

  it('couple: returns the top expectedNPVCoupleOptimized result', () => {
    const r1 = makeRecipient(2000, 1960);
    const r2 = makeRecipient(800, 1962);
    const dist1: DeathProbability[] = [
      { age: 80, probability: 0.5 },
      { age: 90, probability: 0.5 },
    ];
    const dist2: DeathProbability[] = [
      { age: 82, probability: 0.5 },
      { age: 92, probability: 0.5 },
    ];

    const got = recommendedFromDistributions(r1, r2, dist1, dist2, FAR_PAST, 0);
    const expected = expectedNPVCoupleOptimized([r1, r2], FAR_PAST, 0, [
      dist1,
      dist2,
    ])[0];

    expect(got).not.toBeNull();
    expect(got!.isSingle).toBe(false);
    expect(got!.couple!.filingAges[0].asMonths()).toBe(
      expected.filingAges[0].asMonths()
    );
    expect(got!.couple!.filingAges[1].asMonths()).toBe(
      expected.filingAges[1].asMonths()
    );
    expect(got!.couple!.expectedNPVCents).toBe(expected.expectedNPVCents);
  });

  it('couple with missing spouse distribution returns null', () => {
    const r1 = makeRecipient(2000, 1960);
    const r2 = makeRecipient(800, 1962);
    const dist1: DeathProbability[] = [{ age: 85, probability: 1.0 }];

    const got = recommendedFromDistributions(r1, r2, dist1, null, FAR_PAST, 0);
    expect(got).toBeNull();
  });

  it('single: returns null when the distribution is empty', () => {
    const r = makeRecipient(1500, 1960);
    const got = recommendedFromDistributions(r, null, [], null, FAR_PAST, 0);
    expect(got).toBeNull();
  });

  it('defaults the discount rate to DEFAULT_DISCOUNT_RATE when omitted', () => {
    const r = makeRecipient(1500, 1960);
    const dist: DeathProbability[] = [
      { age: 80, probability: 0.5 },
      { age: 90, probability: 0.5 },
    ];

    const withDefault = recommendedFromDistributions(
      r,
      null,
      dist,
      null,
      FAR_PAST
    );
    const withExplicit = recommendedFromDistributions(
      r,
      null,
      dist,
      null,
      FAR_PAST,
      DEFAULT_DISCOUNT_RATE
    );

    expect(withDefault).not.toBeNull();
    expect(withDefault!.single!.expectedNPVCents).toBe(
      withExplicit!.single!.expectedNPVCents
    );
  });
});

describe('buildStrategyUrl', () => {
  it('single: omits default name and blended gender', () => {
    const r = makeRecipient(2000, 1960, { name: 'Self', gender: 'blended' });
    expect(buildStrategyUrl(r, null)).toBe(
      '/strategy#pia1=2000&dob1=1960-04-15'
    );
  });

  it('couple: includes names and non-blended genders, pre-filled', () => {
    const r1 = makeRecipient(2000, 1960, { name: 'Alex', gender: 'male' });
    const r2 = makeRecipient(800, 1962, { name: 'Chris', gender: 'female' });
    expect(buildStrategyUrl(r1, r2)).toBe(
      '/strategy#pia1=2000&dob1=1960-04-15&name1=Alex&gender1=male' +
        '&pia2=800&dob2=1962-04-15&name2=Chris&gender2=female'
    );
  });

  it('couple: strips default "Spouse" name and blended gender', () => {
    const r1 = makeRecipient(2000, 1960, { name: 'Self', gender: 'blended' });
    const r2 = makeRecipient(800, 1962, { name: 'Spouse', gender: 'blended' });
    expect(buildStrategyUrl(r1, r2)).toBe(
      '/strategy#pia1=2000&dob1=1960-04-15&pia2=800&dob2=1962-04-15'
    );
  });
});
