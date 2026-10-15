import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import FiledMonthInput from '../../routes/strategy/components/FiledMonthInput.svelte';

/**
 * Couple mode's "already receives benefits" control. Its month re-validates
 * when the birthdate changes, and the validity it reports must follow.
 */

function month(year: number, monthIndex: number): MonthDate {
  return MonthDate.initFromYearsMonths({ years: year, months: monthIndex });
}

/** Born 15 March 1960: first full month at 62 is April 2022. */
const BORN_1960 = Birthdate.FromYMD(1960, 2, 15);
/** Born 15 March 1964: first full month at 62 is April 2026. */
const BORN_1964 = Birthdate.FromYMD(1964, 2, 15);

describe('FiledMonthInput', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  it('reports a started month a new birthdate rules out, and again once it is fine', () => {
    const validity: boolean[] = [];
    const props = $state({
      recipient: new Recipient(),
      birthdate: BORN_1960,
      currentDate: month(2026, 9),
      inputId: 'filed0',
      yearRange: { min: 1900, max: 2100 },
      value: month(2024, 5) as MonthDate | null,
      onvaliditychange: (isValid: boolean) => validity.push(isValid),
    });
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(FiledMonthInput, { target, props });
    cleanup = () => {
      unmount(component);
      target.remove();
    };
    flushSync();
    expect(validity.at(-1)).toBe(true);

    props.birthdate = BORN_1964;
    flushSync();
    expect(target.textContent).toContain('April 2026');
    expect(validity.at(-1)).toBe(false);

    props.birthdate = BORN_1960;
    flushSync();
    expect(target.textContent).not.toContain('April 2026');
    expect(validity.at(-1)).toBe(true);
  });
});
