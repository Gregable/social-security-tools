import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import type { DeathProbability } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  optimalStrategySingle,
  strategySumCentsSingle,
} from '$lib/strategy/calculations';
import { expectedNPVSingle } from '$lib/strategy/calculations/expected-npv';

function makeRecipient(piaDollars: number, birthYear: number): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(birthYear, 3, 15);
  r.setPia(Money.from(piaDollars));
  return r;
}

const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

describe('expectedNPVSingle', () => {
  it('certain death at 80 produces valid results', () => {
    const recipient = makeRecipient(1500, 1960);
    const deathProbs: DeathProbability[] = [{ age: 80, probability: 1.0 }];

    const results = expectedNPVSingle(recipient, FAR_PAST, 0, deathProbs);

    expect(results.length).toBeGreaterThan(0);
    const best = results[0];
    expect(best.filingAge.asMonths()).toBeGreaterThanOrEqual(62 * 12);
    expect(best.filingAge.asMonths()).toBeLessThanOrEqual(70 * 12);
    expect(best.expectedNPVCents).toBeGreaterThan(0);
  });

  it('all probability at very early death yields earliest filing', () => {
    const recipient = makeRecipient(1500, 1960);
    const deathProbs: DeathProbability[] = [{ age: 63, probability: 1.0 }];

    const results = expectedNPVSingle(recipient, FAR_PAST, 0, deathProbs);

    const best = results[0];
    expect(best.filingAge.asMonths()).toBeLessThanOrEqual(62 * 12 + 2);
  });

  it('returns results sorted by expectedNPV descending', () => {
    const recipient = makeRecipient(1500, 1960);
    const deathProbs: DeathProbability[] = [
      { age: 75, probability: 0.3 },
      { age: 85, probability: 0.5 },
      { age: 95, probability: 0.2 },
    ];

    const results = expectedNPVSingle(recipient, FAR_PAST, 0, deathProbs);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].expectedNPVCents).toBeGreaterThanOrEqual(
        results[i].expectedNPVCents
      );
    }
  });

  it('with discount rate, later filing becomes less attractive', () => {
    const recipient = makeRecipient(1500, 1960);
    const deathProbs: DeathProbability[] = [
      { age: 85, probability: 0.5 },
      { age: 95, probability: 0.5 },
    ];

    const noDiscount = expectedNPVSingle(recipient, FAR_PAST, 0, deathProbs);
    const withDiscount = expectedNPVSingle(
      recipient,
      FAR_PAST,
      0.05,
      deathProbs
    );

    expect(withDiscount[0].filingAge.asMonths()).toBeLessThanOrEqual(
      noDiscount[0].filingAge.asMonths()
    );
  });

  it('handles empty death probability distribution', () => {
    const recipient = makeRecipient(1500, 1960);
    const results = expectedNPVSingle(recipient, FAR_PAST, 0, []);
    expect(results).toEqual([]);
  });
});

describe('expectedNPVSingle cross-validation', () => {
  it('with certain death at age 80, optimal matches deterministic', () => {
    const recipient = makeRecipient(1500, 1960);
    const deathProbs: DeathProbability[] = [{ age: 80, probability: 1.0 }];

    const probResults = expectedNPVSingle(recipient, FAR_PAST, 0, deathProbs);

    const deathDate = recipient.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: 80, months: 6 })
    );
    const [detOptimalAge, detOptimalNPV] = optimalStrategySingle(
      recipient,
      deathDate,
      FAR_PAST,
      0
    );

    expect(probResults[0].filingAge.asMonths()).toBe(detOptimalAge.asMonths());
    expect(probResults[0].expectedNPVCents).toBeCloseTo(detOptimalNPV, -2);
  });

  it('with certain death at age 95, optimal matches deterministic', () => {
    const recipient = makeRecipient(2000, 1960);
    const deathProbs: DeathProbability[] = [{ age: 95, probability: 1.0 }];

    const probResults = expectedNPVSingle(
      recipient,
      FAR_PAST,
      0.03,
      deathProbs
    );

    const deathDate = recipient.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: 95, months: 6 })
    );
    const [detOptimalAge, detOptimalNPV] = optimalStrategySingle(
      recipient,
      deathDate,
      FAR_PAST,
      0.03
    );

    expect(probResults[0].filingAge.asMonths()).toBe(detOptimalAge.asMonths());
    expect(probResults[0].expectedNPVCents).toBeCloseTo(detOptimalNPV, -2);
  });

  it('expected NPV is weighted average of deterministic NPVs', () => {
    const recipient = makeRecipient(1500, 1960);
    const filingAge = MonthDuration.initFromYearsMonths({
      years: 66,
      months: 0,
    });

    const deathProbs: DeathProbability[] = [
      { age: 75, probability: 0.4 },
      { age: 85, probability: 0.6 },
    ];

    const results = expectedNPVSingle(recipient, FAR_PAST, 0, deathProbs);

    const result66 = results.find(
      (r) => r.filingAge.asMonths() === filingAge.asMonths()
    );
    expect(result66).toBeDefined();

    const deathDate75 = recipient.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: 75, months: 6 })
    );
    const deathDate85 = recipient.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 6 })
    );

    const npv75 = strategySumCentsSingle(
      recipient,
      deathDate75,
      FAR_PAST,
      0,
      filingAge
    );
    const npv85 = strategySumCentsSingle(
      recipient,
      deathDate85,
      FAR_PAST,
      0,
      filingAge
    );

    const expectedWeighted = 0.4 * npv75 + 0.6 * npv85;
    expect(result66!.expectedNPVCents).toBeCloseTo(expectedWeighted, 0);
  });
});
