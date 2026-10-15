import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { NoChoiceReasons } from '$lib/components/recommended-filing-card';
import ScenarioDetail from '../../routes/strategy/components/ScenarioDetail.svelte';
import {
  createBucket,
  createRecipientPair,
  createStrategyResult,
} from '../helpers/strategy-mocks';

/** One person's filing as the scenario shows it. */
interface ShownFiling {
  readonly age: string;
  readonly date: string;
}

describe('ScenarioDetail', () => {
  const cleanups: (() => void)[] = [];

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  /**
   * Alex files at 70; the scenario's own filing age for Jordan, two years
   * younger, is 62 and 1 month, years earlier.
   */
  function render(noChoiceReasons: NoChoiceReasons): ShownFiling[] {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(ScenarioDetail, {
      target,
      props: {
        recipients: createRecipientPair(),
        result: createStrategyResult({
          deathAge1: 90,
          deathAge2: 92,
          filingAgeMonths1: 70 * 12,
          filingAgeMonths2: 62 * 12 + 1,
          bucket1: createBucket(90),
          bucket2: createBucket(92),
        }),
        discountRate: 0.025,
        onBack: () => {},
        noChoiceReasons,
      },
    });
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    flushSync();
    const text = (el: Element | null) =>
      (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
    return Array.from(target.querySelectorAll('.filing-person'), (el) => ({
      age: text(el.querySelector('.filing-age')),
      date: text(el.querySelector('.filing-date')),
    }));
  }

  it("shows a spouse with no benefit of their own filing with the other, on the other's date", () => {
    const [alex, jordan] = render([null, 'spousal-only']);
    expect(alex.age).toBe('70 years');
    expect(jordan.age).toBe('With Alex');
    expect(jordan.date).toBe(alex.date);
  });

  it("shows anyone else's own filing age and date", () => {
    const [alex, jordan] = render([null, null]);
    expect(jordan.age).toBe('62 years 1 month');
    expect(jordan.date).not.toBe(alex.date);
  });
});
