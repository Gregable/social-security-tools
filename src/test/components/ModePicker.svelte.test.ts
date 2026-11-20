import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { StrategyMode } from '$lib/strategy/ui';
import ModePicker from '../../routes/strategy/components/ModePicker.svelte';

/**
 * The first step of /strategy. The names are spelled out here, not read
 * from the constants the picker loops over, so a choice that is dropped,
 * renamed or wired to the wrong mode fails a test.
 */
describe('ModePicker', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  function mountPicker(): {
    selected: StrategyMode[];
    buttons: HTMLElement[];
  } {
    const selected: StrategyMode[] = [];
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(ModePicker, {
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

  it('offers the three modes, each with its name and gloss', () => {
    const { buttons } = mountPicker();
    const labels = buttons.map((button) => [
      button.querySelector('.title')?.textContent,
      button.querySelector('.sub')?.textContent,
    ]);
    expect(labels).toEqual([
      ['Just me', 'Single filer'],
      ['Married couple', 'Two filers'],
      ['Widowed', 'Surviving spouse'],
    ]);
  });

  it('selects the mode of the choice that is clicked', () => {
    const { selected, buttons } = mountPicker();
    for (const button of buttons) {
      button.click();
    }
    flushSync();
    expect(selected).toEqual(['single', 'couple', 'widowed']);
  });
});
