import posthog from 'posthog-js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Birthdate } from '$lib/birthday';
import ReportEnd from '$lib/components/integrations/retirementscenario.com/ReportEnd.svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

const PLAN_PREFIX =
  'https://app.retirementscenario.com/?goto=social-security#plan=';

function month(years: number, months: number): MonthDate {
  return MonthDate.initFromYearsMonths({ years, months });
}

function person(name: string, pia: number, birthdate: Birthdate): Recipient {
  const r = new Recipient();
  r.name = name;
  r.setPia(Money.from(pia));
  r.birthdate = birthdate;
  return r;
}

/** Text with whitespace runs collapsed, independent of template layout. */
function text(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function link(target: HTMLElement): HTMLAnchorElement {
  const a = target.querySelector<HTMLAnchorElement>('.visit-link a');
  if (!a) throw new Error('no link');
  return a;
}

function planOf(target: HTMLElement): Record<string, unknown> {
  const href = link(target).href;
  expect(href.startsWith(PLAN_PREFIX)).toBe(true);
  return JSON.parse(atob(href.slice(PLAN_PREFIX.length)));
}

/** "label: value" for each setting row, per person block. */
function rows(target: HTMLElement): string[][] {
  return Array.from(target.querySelectorAll('.person')).map((block) =>
    Array.from(block.querySelectorAll('.step')).map(
      (step) =>
        `${text(step.querySelector('dt'))}: ${text(step.querySelector('.value'))}`
    )
  );
}

describe('Retirement Scenario report end', () => {
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 15)));
    vi.mocked(posthog.capture).mockClear();
    recipientFilingDate.set(null);
    spouseFilingDate.set(null);
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
    vi.useRealTimers();
  });

  function render(props: {
    recipient: Recipient;
    spouse: Recipient | null;
  }): HTMLElement {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(ReportEnd, { target, props });
    flushSync();
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    return target;
  }

  it('links a single person with their benefit and claim age', () => {
    const alex = person('Alex', 2400, Birthdate.FromYMD(1965, 3, 15));
    recipientFilingDate.set(month(2033, 3)); // Alex at 68
    const target = render({ recipient: alex, spouse: null });

    expect(planOf(target)).toEqual({
      planType: 'solo_single',
      filingStatus: 'single',
      birthYear: 1965,
      birthMonth: 4,
      ssClaimAge: 68,
      ssFRABenefit: 2400,
    });
    expect(rows(target)).toEqual([
      ['Your benefit at FRA (age 67): $2,400', 'Your planned claim age: 68'],
    ]);
    expect(target.querySelector('.person h4')).toBeNull();
    expect(target.querySelector('.note')).toBeNull();
  });

  it('records a click on the link', () => {
    const alex = person('Alex', 2400, Birthdate.FromYMD(1965, 3, 15));
    recipientFilingDate.set(month(2032, 3));
    const target = render({ recipient: alex, spouse: null });

    link(target).addEventListener('click', (e) => e.preventDefault());
    link(target).click();
    expect(posthog.capture).toHaveBeenCalledWith('Outbound: Clicked', {
      destination: 'retirementscenario',
      placement: 'integration-report-end',
    });
  });

  it('puts the higher earner first in a couple', () => {
    const alex = person('Alex', 900, Birthdate.FromYMD(1966, 0, 10));
    const chris = person('Chris', 2600, Birthdate.FromYMD(1964, 7, 20));
    alex.markFirst();
    chris.markSecond();
    recipientFilingDate.set(month(2031, 0)); // Alex at 65
    spouseFilingDate.set(month(2034, 7)); // Chris at 70
    const target = render({ recipient: alex, spouse: chris });

    expect(planOf(target)).toMatchObject({
      planType: 'household',
      ssFRABenefit: 2600,
      ssClaimAge: 70,
      spouseSsFRABenefit: 900,
      spouseSsClaimAge: 65,
    });
    expect(text(target)).toContain(
      'Enter Chris as "you" and Alex as your spouse.'
    );
    expect(Array.from(target.querySelectorAll('.person h4')).map(text)).toEqual(
      ['Chris (you)', 'Alex (your spouse)']
    );
    expect(rows(target)[1]).toEqual([
      'Spouse benefit at FRA (age 67): $900',
      'Spouse planned claim age: 65',
    ]);
  });

  it('lists the current benefit for someone already claiming', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1958, 5, 15));
    recipientFilingDate.set(month(2022, 5)); // Alex at 64
    const target = render({ recipient: alex, spouse: null });

    expect(rows(target)).toEqual([
      [
        "I'm already receiving Social Security: Checked",
        'Current Monthly Benefit: $1,644',
        'Started Claiming at Age: 64',
      ],
    ]);
    expect(planOf(target)).toMatchObject({ ssAlreadyClaiming: true });
  });

  it('explains a rounded claim age and an earlier full retirement age', () => {
    // Born June 1958: full retirement age 66 and 8 months.
    const alex = person('Alex', 2000, Birthdate.FromYMD(1958, 5, 15));
    recipientFilingDate.set(month(2027, 1)); // Alex at 68 and 8 months
    const target = render({ recipient: alex, spouse: null });

    const notes = Array.from(target.querySelectorAll('.note')).map(text);
    expect(notes).toEqual([
      'Retirement Scenario takes claim ages in whole years, so a filing age of 68 years 8 months is entered as 69.',
      "Retirement Scenario uses 67 as everyone's full retirement age. Your full retirement age is 66 years 8 months, so the age-67 amount above includes delayed retirement credits.",
    ]);
    expect(rows(target)[0][0]).toBe('Your benefit at FRA (age 67): $2,053');
  });

  it('says there is nothing to add with a $0 PIA', () => {
    const alex = person('Alex', 0, Birthdate.FromYMD(1965, 3, 15));
    recipientFilingDate.set(month(2032, 3));
    const target = render({ recipient: alex, spouse: null });

    expect(text(target)).toContain('there is no Social Security');
    expect(target.querySelector('.visit-link')).toBeNull();
  });

  it('asks for a filing date when none is chosen', () => {
    const alex = person('Alex', 2400, Birthdate.FromYMD(1965, 3, 15));
    const target = render({ recipient: alex, spouse: null });

    expect(text(target)).toContain('Choose a filing date');
    expect(target.querySelector('.visit-link')).toBeNull();
  });
});
