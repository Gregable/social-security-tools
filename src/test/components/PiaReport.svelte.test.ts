import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import PiaReport from '$lib/components/PiaReport.svelte';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';

describe('PiaReport', () => {
  const cleanups: (() => void)[] = [];

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  function render(recipient: Recipient): HTMLElement {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(PiaReport, { target, props: { recipient } });
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    flushSync();
    return target;
  }

  it('renders a provided PIA without computing its COLA history', () => {
    // The calculator's manual entry path: a PIA and a birthdate, no earnings.
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1960, 3, 15);
    r.setPia(Money.from(2500));

    const text = render(r).textContent ?? '';
    expect(text).toContain('$2,500.00');
    expect(text).toContain('The amount above is the value you provided.');
  });
});
