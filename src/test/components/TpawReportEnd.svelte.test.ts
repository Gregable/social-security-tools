import posthog from 'posthog-js';
import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Birthdate } from '$lib/birthday';
import ReportEnd from '$lib/components/integrations/tpawplanner.com/ReportEnd.svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

const TPAW_URL =
  'https://tpawplanner.com/plan?section=income-during-retirement';

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

function entries(target: HTMLElement): Element[] {
  return Array.from(target.querySelectorAll('ol > li'));
}

function entryTexts(target: HTMLElement): string[] {
  return entries(target).map(text);
}

function headings(target: HTMLElement): string[] {
  return entries(target).map((li) => text(li.querySelector('h3')));
}

function radioFor(target: HTMLElement, name: string): HTMLInputElement {
  const label = Array.from(target.querySelectorAll('fieldset label')).find(
    (l) => text(l) === name
  );
  const input = label?.querySelector<HTMLInputElement>('input[type="radio"]');
  if (!input) throw new Error(`no radio labeled ${name}`);
  return input;
}

describe('TPAW Planner report end', () => {
  const cleanups: Array<() => void> = [];
  const originalClipboard = Object.getOwnPropertyDescriptor(
    navigator,
    'clipboard'
  );
  const writeText = vi.fn<(value: string) => Promise<void>>();

  beforeEach(() => {
    vi.mocked(posthog.capture).mockClear();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    recipientFilingDate.set(null);
    spouseFilingDate.set(null);
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
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

    expect(headings(target)).toEqual(['Your Social Security']);
    const [entry] = entryTexts(target);
    expect(entry).toContain('Label Social Security Amount per Month');
    expect(entry).toContain('Start: When you are 67 years, 3 months');
    expect(entry).toContain('(April 2057)');
    expect(entry).toContain('End: At your max age');
    expect(text(target.querySelector('.age-check'))).toContain(
      'a month of birth of January 1990'
    );
    expect(target.querySelector('fieldset')).toBeNull();
    expect(target.querySelector('.note')).toBeNull();
  });

  it('shows the calendar birth month for someone born on the 1st', () => {
    const sam = person('Sam', 3000, Birthdate.FromYMD(1990, 5, 1)); // Jun 1
    recipientFilingDate.set(month(2057, 4)); // SSA age 67 in May
    const target = render({ recipient: sam, spouse: null });

    expect(text(target.querySelector('.age-check'))).toContain(
      'a month of birth of June 1990'
    );
    expect(entryTexts(target)[0]).toContain('When you are 66 years, 11 months');
  });

  it("lists a couple's entries and the survivor note", () => {
    const target = renderCouple();

    expect(headings(target)).toEqual([
      "Alex's Social Security",
      "Chris's Social Security",
      "Chris's spousal benefit",
    ]);
    const [alexOwn, chrisOwn, chrisSpousal] = entryTexts(target);
    expect(alexOwn).toContain('Social Security (Alex)');
    expect(alexOwn).toContain('When you are 67 years, 0 months');
    expect(chrisOwn).toContain('Social Security (Chris)');
    expect(chrisOwn).toContain('When your partner is 67 years, 0 months');
    expect(chrisSpousal).toContain('Spousal benefit (Chris)');
    expect(chrisSpousal).toContain("At your partner's max age");
    expect(text(target.querySelector('.age-check'))).toContain(
      'January 1990 for you (Alex) and June 1992 for your partner (Chris)'
    );
    expect(text(target.querySelector('.note'))).toContain('survivor benefit');
  });

  it('swaps "you" and "your partner" when the other person is chosen', () => {
    const target = renderCouple();

    radioFor(target, 'Chris').click();
    flushSync();

    expect(headings(target)).toEqual([
      "Chris's Social Security",
      "Alex's Social Security",
      "Chris's spousal benefit",
    ]);
    const [chrisOwn, alexOwn] = entryTexts(target);
    expect(chrisOwn).toContain('When you are 67 years, 0 months');
    expect(alexOwn).toContain("At your partner's max age");
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

  it('marks a benefit that has already started', () => {
    const lee = person('Lee', 2000, Birthdate.FromYMD(1950, 0, 15));
    recipientFilingDate.set(month(2017, 0)); // Lee at 67
    const target = render({ recipient: lee, spouse: null });

    expect(entryTexts(target)[0]).toContain(
      `(${MonthDate.initFromNow().toFullString()}; already started)`
    );
  });

  it('copies the plain amount and the label', async () => {
    const target = renderCouple();
    const [first] = entries(target);

    first
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Copy amount for Social Security (Alex)"]'
      )
      ?.click();
    first
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Copy label for Social Security (Alex)"]'
      )
      ?.click();
    await tick();

    expect(writeText.mock.calls).toEqual([
      ['3000'],
      ['Social Security (Alex)'],
    ]);
  });

  it('says there is nothing to add when every PIA is $0', () => {
    const alex = person('Alex', 0, alexBirth);
    const target = render({ recipient: alex, spouse: null });

    expect(text(target)).toContain(
      'there is no Social Security retirement benefit to add to TPAW'
    );
    expect(text(target)).not.toContain('Choose a filing date');
    expect(entries(target)).toHaveLength(0);
  });

  it('records a click on the TPAW link without benefit values', () => {
    const alex = person('Alex', 3000, alexBirth);
    recipientFilingDate.set(month(2057, 0));
    const target = render({ recipient: alex, spouse: null });

    const link = target.querySelector<HTMLAnchorElement>(
      `a[href="${TPAW_URL}"]`
    );
    expect(link).not.toBeNull();
    link?.addEventListener('click', (e) => e.preventDefault());
    link?.click();

    expect(posthog.capture).toHaveBeenCalledWith('Outbound: Clicked', {
      destination: 'tpawplanner',
      placement: 'integration-report-end',
    });
  });
});
