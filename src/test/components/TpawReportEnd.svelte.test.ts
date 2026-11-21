import posthog from 'posthog-js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Birthdate } from '$lib/birthday';
import ReportEnd from '$lib/components/integrations/tpawplanner.com/ReportEnd.svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

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

/** Collapses runs of whitespace so assertions don't depend on markup. */
function text(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function entryTexts(target: HTMLElement): string[] {
  return Array.from(target.querySelectorAll('.entry-item')).map(text);
}

describe('TPAW Planner report end', () => {
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    vi.mocked(posthog.capture).mockClear();
    recipientFilingDate.set(null);
    spouseFilingDate.set(null);
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
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

  // Born in 1990 and 1992, so the chosen filing months stay in the future.
  const alexBirth = Birthdate.FromYMD(1990, 0, 15); // Jan 15, 1990
  const chrisBirth = Birthdate.FromYMD(1992, 5, 20); // Jun 20, 1992

  function renderCouple(): HTMLElement {
    const alex = person('Alex', 3000, alexBirth);
    const chris = person('Chris', 1000, chrisBirth);
    alex.markFirst();
    chris.markSecond();
    recipientFilingDate.set(month(2057, 0)); // Alex at 67
    spouseFilingDate.set(month(2059, 5)); // Chris at 67
    return render({ recipient: alex, spouse: chris });
  }

  it('shows one entry for a single person, without the person choice', () => {
    const alex = person('Alex', 3000, alexBirth);
    recipientFilingDate.set(month(2057, 3)); // Alex at 67 years 3 months
    const target = render({ recipient: alex, spouse: null });

    const entries = entryTexts(target);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain('Social Security');
    expect(entries[0]).toContain('Start: When you are 67 years, 3 months');
    expect(entries[0]).toContain('(April 2057)');
    expect(entries[0]).toContain('End: At your max age');
    expect(text(target.querySelector('.age-check'))).toContain(
      'a month of birth of January 1990'
    );
    expect(target.querySelector('.you-choice')).toBeNull();
    expect(target.querySelector('.note')).toBeNull();
  });

  it("lists a couple's entries and the survivor note", () => {
    const target = renderCouple();

    const entries = entryTexts(target);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toContain('Social Security (Alex)');
    expect(entries[0]).toContain('When you are 67 years, 0 months');
    expect(entries[1]).toContain('Social Security (Chris)');
    expect(entries[1]).toContain('When your partner is 67 years, 0 months');
    expect(entries[2]).toContain('Spousal benefit (Chris)');
    expect(entries[2]).toContain("At your partner's max age");
    expect(text(target.querySelector('.age-check'))).toContain(
      'January 1990 for you (Alex) and June 1992 for your partner (Chris)'
    );
    expect(text(target.querySelector('.note'))).toContain('survivor benefit');
  });

  it('swaps "you" and "your partner" when the other person is chosen', () => {
    const target = renderCouple();

    const radios = target.querySelectorAll<HTMLInputElement>(
      '.you-choice input[type="radio"]'
    );
    radios[1].click();
    flushSync();

    const entries = entryTexts(target);
    expect(entries[0]).toContain('Social Security (Chris)');
    expect(entries[0]).toContain('When you are 67 years, 0 months');
    expect(entries[1]).toContain('Social Security (Alex)');
    expect(entries[1]).toContain("At your partner's max age");
    expect(text(target.querySelector('.age-check'))).toContain(
      'June 1992 for you (Chris) and January 1990 for your partner (Alex)'
    );
  });

  it('updates when a filing date changes', () => {
    const alex = person('Alex', 3000, alexBirth);
    recipientFilingDate.set(month(2057, 0));
    const target = render({ recipient: alex, spouse: null });
    expect(entryTexts(target)[0]).toContain('$3,000');

    recipientFilingDate.set(month(2060, 0)); // Alex at 70
    flushSync();
    expect(entryTexts(target)[0]).toContain('$3,720');
    expect(entryTexts(target)[0]).toContain('When you are 70 years, 0 months');
  });

  it('records a click on the TPAW link without benefit values', () => {
    const alex = person('Alex', 3000, alexBirth);
    recipientFilingDate.set(month(2057, 0));
    const target = render({ recipient: alex, spouse: null });

    const link = target.querySelector<HTMLAnchorElement>('.visit-link a');
    expect(link?.href).toBe(
      'https://tpawplanner.com/plan?section=income-during-retirement'
    );
    link?.addEventListener('click', (e) => e.preventDefault());
    link?.click();

    expect(posthog.capture).toHaveBeenCalledWith('Outbound: Clicked', {
      destination: 'tpawplanner',
      placement: 'integration-report-end',
    });
  });
});
