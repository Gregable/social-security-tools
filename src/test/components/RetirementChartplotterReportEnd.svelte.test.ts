import posthog from 'posthog-js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Birthdate } from '$lib/birthday';
import ReportEnd from '$lib/components/integrations/retirementchartplotter.com/ReportEnd.svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

function person(name: string, pia: number, birthdate: Birthdate): Recipient {
  const r = new Recipient();
  r.name = name;
  r.setPia(Money.from(pia));
  r.birthdate = birthdate;
  return r;
}

function atAge(r: Recipient, years: number, months = 0): MonthDate {
  return r.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years, months })
  );
}

/** Text with whitespace runs collapsed, independent of template layout. */
function text(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** "label: value" for each field in one fieldset. */
function fieldRows(fieldset: Element): string[] {
  return Array.from(fieldset.querySelectorAll('.rcp-field')).map(
    (field) =>
      `${text(field.querySelector('.rcp-label'))}: ${text(field.querySelector('.value'))}`
  );
}

/** Field rows per person in the Guided Setup step. */
function rows(target: HTMLElement): string[][] {
  return Array.from(target.querySelectorAll('.rcp-fieldset.guided')).map(
    fieldRows
  );
}

describe('Retirement Chartplotter report end', () => {
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

  it('lists the three Guided Setup rows for a single person', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    recipientFilingDate.set(atAge(alex, 67));
    const target = render({ recipient: alex, spouse: null });
    expect(rows(target)).toEqual([
      [
        'Gross SS/mo at Full Retirement Age: $2,000',
        'Initially Selected Claim Age: 67',
        'Benefit Start Month: March',
      ],
    ]);
    expect(target.querySelectorAll('.rcp-fieldset.receiving')).toHaveLength(0);
    expect(text(target)).not.toContain('Already receiving benefits');
    expect(text(target)).toContain('Set Up My Plan');
  });

  it('lists the higher earner as primary and the other as spouse', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    const chris = person('Chris', 900, Birthdate.FromYMD(1966, 6, 20));
    recipientFilingDate.set(atAge(chris, 64, 3));
    spouseFilingDate.set(atAge(alex, 67));
    const target = render({ recipient: chris, spouse: alex });
    const legends = Array.from(
      target.querySelectorAll('.rcp-fieldset.guided legend')
    ).map(text);
    expect(legends).toEqual([
      'Primary Social Security (Alex)',
      'Spouse Social Security (Chris)',
    ]);
    expect(rows(target)[1]).toEqual([
      'Gross SS/mo at Full Retirement Age: $900',
      'Selected Claim Age: 64',
      'Spouse Benefit Start Month: October',
    ]);
  });

  it('updates when the filing date changes', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    recipientFilingDate.set(atAge(alex, 67));
    const target = render({ recipient: alex, spouse: null });
    expect(rows(target)[0]).toContain('Benefit Start Month: March');
    recipientFilingDate.set(atAge(alex, 67, 3));
    flushSync();
    expect(rows(target)[0]).toContain('Benefit Start Month: June');
  });

  it('notes a filing month Chartplotter cannot take', () => {
    // Born on the 1st; ssa.tools' earliest month is December 2027.
    const alex = person('Alex', 2000, Birthdate.FromYMD(1966, 0, 1));
    recipientFilingDate.set(
      MonthDate.initFromYearsMonths({ years: 2027, months: 11 })
    );
    const target = render({ recipient: alex, spouse: null });
    expect(text(target)).toContain('entered as January 2028');
  });

  it('lists receiving-benefit settings for someone already paid', () => {
    const alex = person('Alex', 2400, Birthdate.FromYMD(1958, 4, 10));
    recipientFilingDate.set(atAge(alex, 66));
    const target = render({ recipient: alex, spouse: null });
    expect(text(target)).toContain('Already receiving benefits');
    const fieldsets = target.querySelectorAll('.rcp-fieldset.receiving');
    expect(fieldsets).toHaveLength(1);
    expect(fieldRows(fieldsets[0])).toEqual([
      'Benefit Values: Receiving Benefits',
      'Original Benefit Start Month: May',
      'Original Claim Age: 66',
      'Gross SS/mo (before Medicare): $2,293',
      'Benefit Year: 2026',
    ]);
    expect(text(target)).not.toContain('Scenario Summary');
  });

  it('names the primary person and Plan For only for couples', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    const chris = person('Chris', 900, Birthdate.FromYMD(1966, 6, 20));
    recipientFilingDate.set(atAge(chris, 64, 3));
    spouseFilingDate.set(atAge(alex, 67));
    const couple = render({ recipient: chris, spouse: alex });
    expect(text(couple)).toContain(
      'Alex, the higher earner, is the primary person. If there is no Spouse Social Security section, set Plan For to Married Couple.'
    );

    const single = person('Dana', 2000, Birthdate.FromYMD(1965, 2, 15));
    recipientFilingDate.set(atAge(single, 67));
    const solo = render({ recipient: single, spouse: null });
    expect(text(solo)).not.toContain('Plan For');
    expect(
      Array.from(solo.querySelectorAll('.rcp-fieldset.guided legend')).map(text)
    ).toEqual(['Social Security']);
  });

  it('asks for a filing date when none is chosen', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    const target = render({ recipient: alex, spouse: null });
    expect(text(target)).toContain('Choose a filing date');
  });

  it('says there is nothing to enter with a $0 PIA', () => {
    const alex = person('Alex', 0, Birthdate.FromYMD(1965, 2, 15));
    const target = render({ recipient: alex, spouse: null });
    expect(text(target)).toContain('$0 Primary Insurance Amount');
  });

  it('records clicks on the Retirement Chartplotter link', () => {
    const alex = person('Alex', 2000, Birthdate.FromYMD(1965, 2, 15));
    recipientFilingDate.set(atAge(alex, 67));
    const target = render({ recipient: alex, spouse: null });
    const a = target.querySelector<HTMLAnchorElement>('.howto a');
    expect(a?.href).toBe('https://www.retirementchartplotter.com/#planner');
    a?.addEventListener('click', (e) => e.preventDefault());
    a?.click();
    expect(posthog.capture).toHaveBeenCalledWith('Outbound: Clicked', {
      destination: 'retirementchartplotter',
      placement: 'integration-report-end',
    });
  });
});
