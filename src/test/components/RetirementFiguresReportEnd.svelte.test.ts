import posthog from 'posthog-js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Birthdate } from '$lib/birthday';
import ReportEnd from '$lib/components/integrations/retirementfigures.com/ReportEnd.svelte';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

const BASE = 'https://retirementfigures.com/social-security-calculator/';

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

function link(target: HTMLElement): HTMLAnchorElement | null {
  return target.querySelector<HTMLAnchorElement>('.visit-link a');
}

/** "name: figures" for each row of the figures list. */
function figures(target: HTMLElement): string[] {
  return Array.from(target.querySelectorAll('.figure')).map(
    (row) =>
      `${text(row.querySelector('dt'))}: ${text(row.querySelector('dd'))}`
  );
}

describe('Retirement Figures report end', () => {
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    vi.mocked(posthog.capture).mockClear();
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

  it('links a single person with their PIA and birth date', () => {
    const alex = person('Alex', 2547.3, Birthdate.FromYMD(1965, 8, 21));
    const target = render({ recipient: alex, spouse: null });

    expect(link(target)?.href).toBe(
      `${BASE}#from=ssa.tools&pia1=2547&dob1=1965-09-21`
    );
    expect(figures(target)).toEqual([
      'Primary Insurance Amount: $2,547 born Sep 21, 1965',
    ]);
  });

  it('lists a couple higher earner first, marking a spousal-only spouse', () => {
    const chris = person('Chris', 0, Birthdate.FromYMD(1966, 2, 2));
    const alex = person('Alex', 2547, Birthdate.FromYMD(1965, 8, 21));
    const target = render({ recipient: chris, spouse: alex });

    expect(link(target)?.href).toBe(
      `${BASE}#from=ssa.tools&pia1=2547&dob1=1965-09-21&pia2=0&dob2=1966-03-02`
    );
    expect(figures(target)).toEqual([
      'Alex: $2,547 born Sep 21, 1965',
      'Chris: $0 (spousal benefits only) born Mar 2, 1966',
    ]);
    expect(text(target)).toContain('including spousal benefits');
  });

  it('records a click on the link', () => {
    const alex = person('Alex', 2547, Birthdate.FromYMD(1965, 8, 21));
    const target = render({ recipient: alex, spouse: null });
    const a = link(target);
    if (!a) throw new Error('no link');

    a.addEventListener('click', (e) => e.preventDefault());
    a.click();
    expect(posthog.capture).toHaveBeenCalledWith('Outbound: Clicked', {
      destination: 'retirementfigures',
      placement: 'integration-report-end',
    });
  });

  it('shows no link when every PIA is $0', () => {
    const alex = person('Alex', 0, Birthdate.FromYMD(1965, 8, 21));
    const chris = person('Chris', 0, Birthdate.FromYMD(1966, 2, 2));
    const target = render({ recipient: alex, spouse: chris });

    expect(link(target)).toBeNull();
    expect(text(target)).toContain('no Social Security retirement benefit');
  });
});
