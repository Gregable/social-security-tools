import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import WidowedHeadline from '../../routes/strategy/components/WidowedHeadline.svelte';
import {
  HEADLINE_SCENARIOS,
  widowedContextFor,
  widowedRecommendationFor,
} from '../helpers/widowed-mocks';

describe('WidowedHeadline', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  function render(scenario: keyof typeof HEADLINE_SCENARIOS): HTMLElement {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(WidowedHeadline, {
      target,
      props: {
        recommendation: widowedRecommendationFor(
          widowedContextFor(HEADLINE_SCENARIOS[scenario])
        ),
      },
    });
    cleanup = () => {
      unmount(component);
      target.remove();
    };
    flushSync();
    return target;
  }

  /** The spelled-out dates, which wide layouts show. */
  function fullDates(target: HTMLElement): string[] {
    return Array.from(
      target.querySelectorAll('.date-full'),
      (el) => el.textContent ?? ''
    );
  }

  it('spells out the month a benefit started', () => {
    // Survivor benefits filed for April 2024.
    expect(fullDates(render('alreadyReceivingSurvivor'))).toContain(
      'April 2024'
    );
  });

  it('spells out the months to file in', () => {
    // Born 15 March 1968: the survivor benefit at 60, the own benefit at 70.
    expect(fullDates(render('survivorFirstThenOwn'))).toEqual([
      'March 2028',
      'March 2038',
    ]);
  });

  it('names the month to backdate the claim to', () => {
    // As of October 2026, six months back is April 2026.
    const text = (render('fileNowBackdated').textContent ?? '').replace(
      /\s+/g,
      ' '
    );
    expect(text).toContain(
      'Ask SSA to backdate the claim to April 2026; they can pay up to six months retroactively.'
    );
  });
});
