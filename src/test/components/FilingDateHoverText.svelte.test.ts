import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import FilingDateHoverText from '$lib/components/FilingDateHoverText.svelte';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

describe('FilingDateHoverText', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  // Born in October 1984, so normal retirement age (67) is October 2051.
  function recipientWithPia(): Recipient {
    const recipient = new Recipient();
    recipient.birthdate = Birthdate.FromYMD(1984, 9, 15);
    recipient.setPia(Money.from(2135));
    return recipient;
  }

  const filingDate = MonthDate.initFromYearsMonths({ years: 2051, months: 9 });

  function textFor(recipient: Recipient, hoverDate: MonthDate): string {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(FilingDateHoverText, {
      target,
      props: {
        recipient,
        filingDate,
        filingDateText: 'Oct 2051',
        hoverDate,
      },
    });
    cleanup = () => {
      unmount(component);
      target.remove();
    };
    flushSync();
    return (target.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  it('says the benefit has not started for a month before the filing date', () => {
    const text = textFor(
      recipientWithPia(),
      MonthDate.initFromYearsMonths({ years: 2051, months: 4 })
    );
    expect(text).toBe(
      'If filing for benefits in Oct 2051, ' +
        'In May 2051, your benefit has not started yet.'
    );
  });

  it('says the benefit starts in the filing month', () => {
    const text = textFor(recipientWithPia(), filingDate);
    expect(text).toBe(
      'If filing for benefits in Oct 2051, ' +
        'your benefit starts that month at $2,135.'
    );
  });

  it('gives the benefit for a month after the filing date', () => {
    const text = textFor(
      recipientWithPia(),
      MonthDate.initFromYearsMonths({ years: 2053, months: 6 })
    );
    expect(text).toBe(
      'If filing for benefits in Oct 2051, ' +
        'In Jul 2053, your benefit will be: $2,135'
    );
  });

  it('does not show $0 before the filing date', () => {
    const text = textFor(
      recipientWithPia(),
      MonthDate.initFromYearsMonths({ years: 2051, months: 4 })
    );
    expect(text).not.toContain('$');
  });

  it('names the recipient when there are two', () => {
    const recipient = recipientWithPia();
    recipient.name = 'Alex';
    recipient.markFirst();
    const text = textFor(
      recipient,
      MonthDate.initFromYearsMonths({ years: 2051, months: 4 })
    );
    expect(text).toContain("Alex's benefit has not started yet.");
  });
});
