import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { strategySumCentsCouple } from '$lib/strategy/calculations';
import { expectedNPVCouple } from '$lib/strategy/calculations/expected-npv';

function makeRecipient(
  piaDollars: number,
  birthYear: number,
  birthMonth: number = 3,
  birthDay: number = 15
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(birthYear, birthMonth, birthDay);
  r.setPia(Money.from(piaDollars));
  return r;
}

const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

describe('expectedNPVCouple', () => {
  it('certain death at fixed ages produces valid results', () => {
    const earner = makeRecipient(2000, 1960);
    const dependent = makeRecipient(800, 1962);
    const recipients: [Recipient, Recipient] = [earner, dependent];

    const earnerDeathProbs: DeathProbability[] = [
      { age: 80, probability: 1.0 },
    ];
    const depDeathProbs: DeathProbability[] = [{ age: 85, probability: 1.0 }];

    const results = expectedNPVCouple(recipients, FAR_PAST, 0, [
      earnerDeathProbs,
      depDeathProbs,
    ]);

    expect(results.length).toBeGreaterThan(0);
    const best = results[0];
    expect(best.expectedNPVCents).toBeGreaterThan(0);
    expect(best.filingAges[0].asMonths()).toBeGreaterThanOrEqual(62 * 12);
    expect(best.filingAges[1].asMonths()).toBeGreaterThanOrEqual(62 * 12);
  });

  it('returns results sorted descending by expectedNPV', () => {
    const r0 = makeRecipient(1500, 1960);
    const r1 = makeRecipient(600, 1960);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const deathProbs: DeathProbability[] = [
      { age: 80, probability: 0.5 },
      { age: 90, probability: 0.5 },
    ];

    const results = expectedNPVCouple(recipients, FAR_PAST, 0, [
      deathProbs,
      deathProbs,
    ]);

    for (let i = 1; i < Math.min(results.length, 20); i++) {
      expect(results[i - 1].expectedNPVCents).toBeGreaterThanOrEqual(
        results[i].expectedNPVCents
      );
    }
  });

  it('both dying late favors delayed filing for earner', () => {
    const r0 = makeRecipient(2000, 1960);
    const r1 = makeRecipient(500, 1960);
    const recipients: [Recipient, Recipient] = [r0, r1];

    // Both live to old age with certainty
    const deathProbs: DeathProbability[] = [{ age: 90, probability: 1.0 }];

    const results = expectedNPVCouple(recipients, FAR_PAST, 0, [
      deathProbs,
      deathProbs,
    ]);

    const best = results[0];
    // Earner (r0 has higher PIA) should delay filing to maximize benefit
    // since both live long and delayed credits increase earner + survivor benefit
    const earnerFilingAge = best.filingAges[0];
    expect(earnerFilingAge.asMonths()).toBeGreaterThanOrEqual(67 * 12);
  });

  it('handles zero-PIA dependent (spousal-only)', () => {
    const earner = makeRecipient(2000, 1960);
    const dependent = makeRecipient(0, 1960);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const deathProbs: DeathProbability[] = [{ age: 85, probability: 1.0 }];

    const results = expectedNPVCouple(recipients, FAR_PAST, 0, [
      deathProbs,
      deathProbs,
    ]);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].expectedNPVCents).toBeGreaterThan(0);
  });

  it('handles empty death probability distributions', () => {
    const r0 = makeRecipient(1500, 1960);
    const r1 = makeRecipient(800, 1960);

    const results = expectedNPVCouple([r0, r1], FAR_PAST, 0, [[], []]);
    expect(results).toEqual([]);
  });
});

describe('expectedNPVCouple cross-validation', () => {
  it('with certain death ages, expected NPV approximates deterministic NPV', () => {
    const r0 = makeRecipient(2000, 1960);
    const r1 = makeRecipient(800, 1962);
    const recipients: [Recipient, Recipient] = [r0, r1];

    const earnerDeathProbs: DeathProbability[] = [
      { age: 82, probability: 1.0 },
    ];
    const depDeathProbs: DeathProbability[] = [{ age: 88, probability: 1.0 }];

    const probResults = expectedNPVCouple(recipients, FAR_PAST, 0, [
      earnerDeathProbs,
      depDeathProbs,
    ]);

    const filingAge0 = MonthDuration.initFromYearsMonths({
      years: 67,
      months: 0,
    });
    const filingAge1 = MonthDuration.initFromYearsMonths({
      years: 65,
      months: 0,
    });

    const probResult = probResults.find(
      (r) =>
        r.filingAges[0].asMonths() === filingAge0.asMonths() &&
        r.filingAges[1].asMonths() === filingAge1.asMonths()
    );

    const deathDate0 = r0.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: 82, months: 6 })
    );
    const deathDate1 = r1.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: 88, months: 6 })
    );

    const detNPV = strategySumCentsCouple(
      recipients,
      [deathDate0, deathDate1],
      FAR_PAST,
      0,
      [filingAge0, filingAge1]
    );

    expect(probResult).toBeDefined();
    // Allow 15% tolerance: monthly simulation uses yearly death probabilities
    // spread across 12 months, while deterministic uses exact monthly periods.
    const tolerance = Math.abs(detNPV) * 0.15;
    expect(Math.abs(probResult!.expectedNPVCents - detNPV)).toBeLessThan(
      tolerance
    );
  });
});
