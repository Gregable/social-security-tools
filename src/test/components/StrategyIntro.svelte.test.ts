import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { StrategyMode } from '$lib/strategy/ui';
import { STRATEGY_MODE_LABELS, STRATEGY_MODES } from '$lib/strategy/ui';
import StrategyIntro from '../../routes/strategy/components/StrategyIntro.svelte';

/**
 * The intro is long, so it ends with the picker's choices again: a reader
 * who has scrolled to the bottom can start from there.
 */
describe('StrategyIntro closing choices', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  function mountIntro(): { selected: StrategyMode[]; buttons: HTMLElement[] } {
    const selected: StrategyMode[] = [];
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(StrategyIntro, {
      target,
      props: { onselect: (mode: StrategyMode) => selected.push(mode) },
    });
    cleanup = () => {
      unmount(component);
      target.remove();
    };
    flushSync();
    const buttons = [...target.querySelectorAll<HTMLElement>('button')];
    return { selected, buttons };
  }

  it('offers every mode, in the picker order', () => {
    const { buttons } = mountIntro();
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(
      STRATEGY_MODES.map((mode) => STRATEGY_MODE_LABELS[mode].title)
    );
  });

  it('selects the mode whose button is clicked', () => {
    const { selected, buttons } = mountIntro();
    for (const button of buttons) {
      button.click();
    }
    flushSync();
    expect(selected).toEqual([...STRATEGY_MODES]);
  });
});
