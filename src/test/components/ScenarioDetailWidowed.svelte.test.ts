import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { createWidowedContext } from '$lib/strategy/calculations/widowed-optimizer';
import { isWidowedResult } from '$lib/strategy/ui';
import { generateMonthlyBuckets } from '$lib/strategy/ui/grid-sizing';
import { widowedResultsByDeathAge } from '$lib/strategy/ui/widowed-results';
import ScenarioDetailWidowed from '../../routes/strategy/components/ScenarioDetailWidowed.svelte';

function recipient(pia: number, birthdate: Birthdate): Recipient {
  const r = new Recipient();
  r.birthdate = birthdate;
  r.setPia(Money.from(pia));
  return r;
}

function month(year: number, monthIndex: number): MonthDate {
  return MonthDate.initFromYearsMonths({ years: year, months: monthIndex });
}

describe('ScenarioDetailWidowed', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  it('shows a survivor benefit already started as started, not as not needed', () => {
    // Survivor benefits since June 2024 pay $1,209; the own benefit from
    // now, at 64y7m on a $2,500 PIA, pays $2,097 and takes over.
    const context = createWidowedContext(
      recipient(2500, Birthdate.FromYMD(1962, 2, 15)),
      {
        recipient: recipient(1500, Birthdate.FromYMD(1960, 4, 10)),
        deathDate: month(2024, 3),
        claim: { kind: 'none' },
      },
      month(2026, 9),
      0.025,
      { survivor: month(2024, 5), own: null }
    );
    const buckets = generateMonthlyBuckets(
      MonthDuration.initFromYearsMonths({ years: 66, months: 0 }).asMonths(),
      [{ age: 66, probability: 1 }]
    );
    const row = widowedResultsByDeathAge(context, buckets).get(0, 0);
    if (row === undefined || !isWidowedResult(row)) {
      throw new Error('expected a widowed row');
    }

    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(ScenarioDetailWidowed, {
      target,
      props: { context, result: row, onBack: () => {} },
    });
    cleanup = () => {
      unmount(component);
      target.remove();
    };
    flushSync();

    const plan = target.querySelector('.filing-summary')?.textContent ?? '';
    expect(plan).toContain('Started Jun 2024');
    expect(plan).not.toContain('Not needed');
  });
});
