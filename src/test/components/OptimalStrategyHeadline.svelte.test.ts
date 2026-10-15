import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import OptimalStrategyHeadline from '$lib/components/OptimalStrategyHeadline.svelte';
import type { NoChoiceReasons } from '$lib/components/recommended-filing-card';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  type AlreadyFiled,
  NOT_FILED,
} from '$lib/strategy/calculations/already-filed';

/** October 2026. */
const currentDate = MonthDate.initFromYearsMonths({ years: 2026, months: 9 });

/** Born on the 15th of `monthIndex` (January unless given). */
function recipient(
  pia: number,
  year: number,
  name: string,
  monthIndex = 0
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(year, monthIndex, 15);
  r.setPia(Money.from(pia));
  r.name = name;
  return r;
}

const age = (years: number) =>
  MonthDuration.initFromYearsMonths({ years, months: 0 });
const month = (year: number, monthIndex: number) =>
  MonthDate.initFromYearsMonths({ years: year, months: monthIndex });

describe('OptimalStrategyHeadline', () => {
  const cleanups: (() => void)[] = [];

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  interface Case {
    readonly recipients: [Recipient, Recipient];
    readonly noChoiceReasons: NoChoiceReasons;
    readonly isSingle?: boolean;
    readonly alreadyFiled?: AlreadyFiled;
    readonly showInfoTip?: boolean;
  }

  function render(c: Case): HTMLElement {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const isSingle = c.isSingle ?? false;
    const component = mount(OptimalStrategyHeadline, {
      target,
      props: {
        isSingle,
        singleResult: isSingle
          ? { filingAge: age(70), expectedNPVCents: 50_000_000 }
          : undefined,
        coupleResult: isSingle
          ? undefined
          : { filingAges: [age(70), age(70)], expectedNPVCents: 90_000_000 },
        recipients: c.recipients,
        noChoiceReasons: c.noChoiceReasons,
        currentDate,
        alreadyFiled: c.alreadyFiled ?? NOT_FILED,
        showInfoTip: c.showInfoTip ?? true,
      },
    });
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    flushSync();
    return target;
  }

  function explanation(target: HTMLElement): string {
    return (target.querySelector('.explanation')?.textContent ?? '').replace(
      /\s+/g,
      ' '
    );
  }

  /** The text of the card headed by `name`. */
  function card(target: HTMLElement, name: string): string {
    const cards = Array.from(target.querySelectorAll('.result'));
    const match = cards.find(
      (el) => el.querySelector('.person-name')?.textContent?.trim() === name
    );
    return (match?.textContent ?? '').replace(/\s+/g, ' ');
  }

  const young = () => recipient(2000, 1964, 'Alex');
  const old = () => recipient(2000, 1950, 'Alex');
  const oldSpouse = () => recipient(1500, 1952, 'Chris');
  /** No benefit of their own; full retirement age was September 2024. */
  const spousalOnly = () => recipient(0, 1958, 'Chris');

  /** Two recipients, marked the way couple mode marks them. */
  function couple(first: Recipient, second: Recipient): [Recipient, Recipient] {
    first.markFirst();
    second.markSecond();
    return [first, second];
  }

  it('gives the expected lifetime benefit while a filing age is left to choose', () => {
    const target = render({
      recipients: couple(young(), oldSpouse()),
      noChoiceReasons: [null, 'past-seventy'],
    });
    expect(target.querySelector('.npv-line')?.textContent).toContain(
      '$900,000'
    );
  });

  it('leaves out the expected lifetime benefit for a single person past 70', () => {
    const target = render({
      isSingle: true,
      recipients: [old(), oldSpouse()],
      noChoiceReasons: ['past-seventy', null],
    });
    expect(target.querySelector('.npv-line')).toBeNull();
    expect(explanation(target)).toContain('Delayed retirement credits stop');
  });

  it('says a couple both receiving benefits have nothing left to decide, without pointing at a figure', () => {
    const target = render({
      recipients: couple(old(), oldSpouse()),
      noChoiceReasons: ['filed', 'filed'],
      // February is each one's first full month at 62 or later.
      alreadyFiled: [month(2015, 1), month(2014, 1)],
    });
    expect(target.querySelector('.npv-line')).toBeNull();
    expect(explanation(target)).toContain(
      'You are both already receiving benefits, so there is no filing decision left here.'
    );
    expect(explanation(target)).not.toMatch(/figure|expected value/);
  });

  it('says a couple both past 70 have nothing left to decide', () => {
    const target = render({
      recipients: couple(old(), oldSpouse()),
      noChoiceReasons: ['past-seventy', 'past-seventy'],
    });
    expect(target.querySelector('.npv-line')).toBeNull();
    expect(explanation(target)).toContain(
      'You are both past 70, where delayed retirement credits stop, so there is no filing decision left here.'
    );
  });

  it.each([
    {
      filed: 'Chris',
      pastSeventy: 'Alex',
      noChoiceReasons: ['past-seventy', 'filed'] as NoChoiceReasons,
      alreadyFiled: [null, month(2014, 1)] as AlreadyFiled,
    },
    {
      filed: 'Alex',
      pastSeventy: 'Chris',
      noChoiceReasons: ['filed', 'past-seventy'] as NoChoiceReasons,
      alreadyFiled: [month(2015, 1), null] as AlreadyFiled,
    },
  ])(
    'says $filed has filed and $pastSeventy is past 70 when neither has a choice left',
    ({ filed, pastSeventy, noChoiceReasons, alreadyFiled }) => {
      const target = render({
        recipients: couple(old(), oldSpouse()),
        noChoiceReasons,
        alreadyFiled,
      });
      expect(target.querySelector('.npv-line')).toBeNull();
      expect(explanation(target)).toContain(
        `${filed} already receives benefits, and ${pastSeventy} is past 70`
      );
      expect(explanation(target)).toContain('no filing decision left here');
    }
  );

  describe('with a spouse who has no benefit of their own past full retirement age', () => {
    it('names them beside a spouse already filed', () => {
      const target = render({
        recipients: couple(old(), spousalOnly()),
        noChoiceReasons: ['filed', 'spousal-only'],
        alreadyFiled: [month(2015, 1), null],
      });
      expect(target.querySelector('.npv-line')).toBeNull();
      const text = explanation(target);
      expect(text).toContain(
        'Alex already receives benefits, and Chris has no retirement benefit of their own and has reached full retirement age, where spousal benefits stop growing'
      );
      expect(text).toContain('no filing decision left here');
    });

    it('names them beside a spouse past 70, in either order', () => {
      const second = explanation(
        render({
          recipients: couple(old(), spousalOnly()),
          noChoiceReasons: ['past-seventy', 'spousal-only'],
        })
      );
      expect(second).toContain(
        'Alex is past 70, where delayed retirement credits stop, and Chris has no retirement benefit of their own'
      );
      const first = explanation(
        render({
          recipients: couple(spousalOnly(), old()),
          noChoiceReasons: ['spousal-only', 'past-seventy'],
        })
      );
      expect(first).toContain(
        'Chris has no retirement benefit of their own and has reached full retirement age, where spousal benefits stop growing, and Alex is past 70'
      );
    });

    it('has them file when the other spouse is to file', () => {
      // Alex, born January 1964, is recommended to file at 70, in January
      // 2034; the spousal benefit cannot start before that.
      const target = render({
        recipients: couple(young(), spousalOnly()),
        noChoiceReasons: [null, 'spousal-only'],
      });
      const chris = card(target, 'Chris');
      expect(chris).toContain('January 2034');
      expect(chris).toContain("when Alex's benefits start");
      expect(chris).not.toContain('Past 70');
    });

    it('has them backdate six months once the other spouse has long been paid', () => {
      const target = render({
        recipients: couple(old(), spousalOnly()),
        noChoiceReasons: ['filed', 'spousal-only'],
        alreadyFiled: [month(2015, 1), null],
      });
      const chris = card(target, 'Chris');
      expect(chris).toContain(
        'backdate the claim to April 2026; they can pay up to six months retroactively'
      );
      expect(chris).not.toContain('Past 70');
    });

    it('has them backdate no further than the month the other spouse started', () => {
      const target = render({
        recipients: couple(young(), spousalOnly()),
        noChoiceReasons: ['filed', 'spousal-only'],
        alreadyFiled: [month(2026, 6), null],
      });
      expect(card(target, 'Chris')).toContain(
        "backdate the claim to July 2026, when Alex's benefits started"
      );
    });

    it("has them backdate as far as the other spouse's own claim goes when that is still to make", () => {
      // Alex, born July 1956, is 70 in July 2026 and is recommended to file
      // now, backdated to then; he has not filed yet.
      const target = render({
        recipients: couple(recipient(2000, 1956, 'Alex', 6), spousalOnly()),
        noChoiceReasons: [null, 'spousal-only'],
      });
      const chris = card(target, 'Chris');
      expect(chris).toContain(
        "backdate the claim to July 2026, as far back as Alex's own claim"
      );
      expect(chris).not.toContain('benefits started');
    });

    it('has them file now, with nothing to backdate, when the other spouse started this month', () => {
      const target = render({
        recipients: couple(young(), spousalOnly()),
        noChoiceReasons: ['filed', 'spousal-only'],
        alreadyFiled: [currentDate, null],
      });
      const chris = card(target, 'Chris');
      expect(chris).toContain("Alex's benefits start this month");
      expect(chris).not.toContain('backdate');
    });

    it('has them file now, with nothing to backdate, in the month of full retirement age', () => {
      // Born December 1959: full retirement age, 66 and 10 months, is
      // October 2026.
      const target = render({
        recipients: couple(old(), recipient(0, 1959, 'Chris', 11)),
        noChoiceReasons: ['filed', 'spousal-only'],
        alreadyFiled: [month(2015, 1), null],
      });
      const chris = card(target, 'Chris');
      expect(chris).toContain('Full retirement age is this month');
      expect(chris).not.toContain("Alex's benefits start");
    });

    it('finds their card whichever spouse comes first', () => {
      const target = render({
        recipients: couple(spousalOnly(), young()),
        noChoiceReasons: ['spousal-only', null],
      });
      expect(card(target, 'Chris')).toContain("when Alex's benefits start");
      expect(card(target, 'Alex')).not.toContain('benefits start');
    });
  });

  it('drops the calculator card note on assumptions once nothing is left to choose', () => {
    const withChoice = explanation(
      render({
        isSingle: true,
        recipients: [young(), oldSpouse()],
        noChoiceReasons: [null, null],
        showInfoTip: false,
      })
    );
    expect(withChoice).toContain('Open the optimizer to adjust.');
    const pastSeventy = explanation(
      render({
        isSingle: true,
        recipients: [old(), oldSpouse()],
        noChoiceReasons: ['past-seventy', null],
        showInfoTip: false,
      })
    );
    expect(pastSeventy).not.toContain('Open the optimizer to adjust.');
  });
});
