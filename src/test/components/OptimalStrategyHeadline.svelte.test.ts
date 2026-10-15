import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import OptimalStrategyHeadline from '$lib/components/OptimalStrategyHeadline.svelte';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  type AlreadyFiled,
  NOT_FILED,
} from '$lib/strategy/calculations/already-filed';

const currentDate = MonthDate.initFromYearsMonths({ years: 2026, months: 9 });

function recipient(pia: number, year: number, name: string): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(year, 0, 15);
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
    readonly hasFilingChoice: [boolean, boolean];
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
        hasFilingChoice: c.hasFilingChoice,
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

  const young = () => recipient(2000, 1964, 'Alex');
  const old = () => recipient(2000, 1950, 'Alex');
  const oldSpouse = () => recipient(1500, 1952, 'Chris');

  /** Two recipients, marked the way couple mode marks them. */
  function couple(first: Recipient, second: Recipient): [Recipient, Recipient] {
    first.markFirst();
    second.markSecond();
    return [first, second];
  }

  it('gives the expected lifetime benefit while a filing age is left to choose', () => {
    const target = render({
      recipients: couple(young(), oldSpouse()),
      hasFilingChoice: [true, false],
    });
    expect(target.querySelector('.npv-line')?.textContent).toContain(
      '$900,000'
    );
  });

  it('leaves out the expected lifetime benefit for a single person past 70', () => {
    const target = render({
      isSingle: true,
      recipients: [old(), oldSpouse()],
      hasFilingChoice: [false, true],
    });
    expect(target.querySelector('.npv-line')).toBeNull();
    expect(explanation(target)).toContain('Delayed retirement credits stop');
  });

  it('says a couple both receiving benefits have nothing left to decide, without pointing at a figure', () => {
    const target = render({
      recipients: couple(old(), oldSpouse()),
      hasFilingChoice: [false, false],
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
      hasFilingChoice: [false, false],
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
      alreadyFiled: [null, month(2014, 1)] as AlreadyFiled,
    },
    {
      filed: 'Alex',
      pastSeventy: 'Chris',
      alreadyFiled: [month(2015, 1), null] as AlreadyFiled,
    },
  ])(
    'says $filed has filed and $pastSeventy is past 70 when neither has a choice left',
    ({ filed, pastSeventy, alreadyFiled }) => {
      const target = render({
        recipients: couple(old(), oldSpouse()),
        hasFilingChoice: [false, false],
        alreadyFiled,
      });
      expect(target.querySelector('.npv-line')).toBeNull();
      expect(explanation(target)).toContain(
        `${filed} already receives benefits`
      );
      expect(explanation(target)).toContain(`${pastSeventy} is past 70`);
      expect(explanation(target)).toContain('no filing decision left here');
    }
  );

  it('drops the calculator card note on assumptions once nothing is left to choose', () => {
    const withChoice = explanation(
      render({
        isSingle: true,
        recipients: [young(), oldSpouse()],
        hasFilingChoice: [true, true],
        showInfoTip: false,
      })
    );
    expect(withChoice).toContain('Open the optimizer to adjust.');
    const pastSeventy = explanation(
      render({
        isSingle: true,
        recipients: [old(), oldSpouse()],
        hasFilingChoice: [false, true],
        showInfoTip: false,
      })
    );
    expect(pastSeventy).not.toContain('Open the optimizer to adjust.');
  });
});
