import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import type { WidowedInput } from '$lib/strategy/calculations/late-spouse';
import WidowedInputs from '../../routes/strategy/components/WidowedInputs.svelte';

/**
 * The widowed form mounts with the values already entered whenever a share
 * link is restored or the Edit button is pressed, so these tests mount it
 * the same way and check what it keeps and what it reports.
 */

function month(year: number, monthIndex: number): MonthDate {
  return MonthDate.initFromYearsMonths({ years: year, months: monthIndex });
}

function recipient(pia: number, birthdate: Birthdate): Recipient {
  const r = new Recipient();
  r.birthdate = birthdate;
  r.setPia(Money.from(pia));
  return r;
}

/** Born 15 March 1960: 66 in October 2026. */
const SURVIVOR_BIRTHDATE = Birthdate.FromYMD(1960, 2, 15);
/** Born 10 June 1958: first full month at 62 is July 2020. */
const SPOUSE_BIRTHDATE = Birthdate.FromYMD(1958, 5, 10);

interface Mounted {
  readonly target: HTMLElement;
  readonly input: WidowedInput;
  /** Every validity the form has reported, in order. */
  readonly validity: boolean[];
  readonly destroy: () => void;
}

function mountForm(input: WidowedInput): Mounted {
  const validity: boolean[] = [];
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(WidowedInputs, {
    target,
    props: {
      recipients: [
        recipient(1200, SURVIVOR_BIRTHDATE),
        recipient(2400, SPOUSE_BIRTHDATE),
      ],
      piaValues: [1200, 2400],
      birthdateInputs: ['1960-03-15', '1958-06-10'],
      widowedInput: input,
      onValidityChange: (isValid: boolean) => validity.push(isValid),
    },
  });
  flushSync();
  return {
    target,
    input,
    validity,
    destroy: () => {
      unmount(component);
      target.remove();
    },
  };
}

function checkbox(target: HTMLElement, id: string): HTMLInputElement | null {
  return target.querySelector<HTMLInputElement>(`#${id}-check`);
}

/** Types into the death month's year field the way a person would. */
function typeDeathYear(target: HTMLElement, text: string): void {
  const year = target.querySelector<HTMLInputElement>('#death-month-year');
  if (year === null) throw new Error('death month year input not found');
  year.value = text;
  year.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

describe('WidowedInputs', () => {
  let mounted: Mounted | null = null;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15));
  });

  afterEach(() => {
    mounted?.destroy();
    mounted = null;
    vi.useRealTimers();
  });

  it('keeps benefits already started when it mounts with them', () => {
    mounted = mountForm({
      deathMonth: month(2024, 2),
      claimKind: 'none',
      retirementStartedAt: null,
      survivorFiledAt: month(2024, 5),
      ownFiledAt: month(2024, 8),
    });

    expect(mounted.input.survivorFiledAt).toEqual(month(2024, 5));
    expect(mounted.input.ownFiledAt).toEqual(month(2024, 8));
    expect(checkbox(mounted.target, 'survivor-filed')?.checked).toBe(true);
    expect(checkbox(mounted.target, 'own-filed')?.checked).toBe(true);
    expect(mounted.validity.at(-1)).toBe(true);
  });

  it('keeps a started survivor benefit while the death year is retyped', () => {
    mounted = mountForm({
      deathMonth: month(2024, 2),
      claimKind: 'none',
      retirementStartedAt: null,
      survivorFiledAt: month(2024, 5),
      ownFiledAt: null,
    });

    typeDeathYear(mounted.target, '');
    typeDeathYear(mounted.target, '2024');

    expect(mounted.input.deathMonth).toEqual(month(2024, 2));
    expect(mounted.input.survivorFiledAt).toEqual(month(2024, 5));
    expect(checkbox(mounted.target, 'survivor-filed')?.checked).toBe(true);
    expect(mounted.validity.at(-1)).toBe(true);
  });

  it('allows Continue again once a retyped death year makes the retirement start valid', () => {
    mounted = mountForm({
      deathMonth: month(2024, 2),
      claimKind: 'retirement',
      retirementStartedAt: month(2020, 6),
      survivorFiledAt: null,
      ownFiledAt: null,
    });
    expect(mounted.validity.at(-1)).toBe(true);

    typeDeathYear(mounted.target, '');
    expect(mounted.validity.at(-1)).toBe(false);

    typeDeathYear(mounted.target, '2024');
    expect(mounted.input.retirementStartedAt).toEqual(month(2020, 6));
    expect(mounted.validity.at(-1)).toBe(true);
  });

  it('holds Continue for a restored death month before the spouse was born', () => {
    mounted = mountForm({
      deathMonth: month(1950, 0),
      claimKind: 'none',
      retirementStartedAt: null,
      survivorFiledAt: null,
      ownFiledAt: null,
    });

    expect(mounted.target.textContent).toContain(
      'The month of death cannot be before they were born.'
    );
    expect(mounted.input.deathMonth).toBeNull();
    expect(mounted.validity.at(-1)).toBe(false);
  });
});
