import { describe, expect, it } from 'vitest';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  emptyWidowedInput,
  type WidowedInput,
} from '$lib/strategy/calculations/late-spouse';
import {
  type StrategyShareInputs,
  strategyShareUrl,
} from '$lib/strategy/ui/share-url';
import { UrlParams } from '$lib/url-params';

const month = (years: number, monthIndex: number) =>
  MonthDate.initFromYearsMonths({ years, months: monthIndex });

function inputs(overrides: Partial<StrategyShareInputs>): StrategyShareInputs {
  const self = new Recipient();
  self.name = 'Self';
  const spouse = new Recipient();
  spouse.name = 'Spouse';
  return {
    mode: 'couple',
    recipients: [self, spouse],
    piaValues: [1800, 2400],
    birthdateInputs: ['1963-07-20', '1961-09-05'],
    alreadyFiled: [null, null],
    widowed: emptyWidowedInput(),
    ...overrides,
  };
}

function parsed(url: string): UrlParams {
  return new UrlParams(url.slice(url.indexOf('#')));
}

function widowedWith(overrides: Partial<WidowedInput>): WidowedInput {
  return { ...emptyWidowedInput(), deathMonth: month(2024, 1), ...overrides };
}

describe('strategyShareUrl', () => {
  it('is empty until person 1 has a birthdate and PIA', () => {
    expect(strategyShareUrl(inputs({ piaValues: [null, 2400] }))).toBe('');
    expect(
      strategyShareUrl(inputs({ birthdateInputs: ['', '1961-09-05'] }))
    ).toBe('');
  });

  it('links only person 1 in single mode', () => {
    const url = strategyShareUrl(inputs({ mode: 'single' }));
    expect(url.startsWith('https://ssa.tools/strategy#')).toBe(true);
    expect(parsed(url).getSpousePia()).toBe(null);
  });

  it('links both people and their filed months in couple mode', () => {
    const url = strategyShareUrl(
      inputs({ alreadyFiled: [month(2025, 7), month(2024, 3)] })
    );
    const params = parsed(url);
    expect(params.getSpousePia()).toBe(2400);
    expect(params.getRecipientFiledMonth()?.toString()).toBe(
      month(2025, 7).toString()
    );
    expect(params.getSpouseFiledMonth()?.toString()).toBe(
      month(2024, 3).toString()
    );
    expect(params.getSpouseDeathMonth()).toBe(null);
  });

  it('links the late spouse and both start months in widowed mode', () => {
    const url = strategyShareUrl(
      inputs({
        mode: 'widowed',
        // Couple-mode filings left over from another mode must not leak in.
        alreadyFiled: [month(2020, 0), month(2020, 0)],
        widowed: widowedWith({
          claimKind: 'retirement',
          retirementStartedAt: month(2024, 0),
          survivorFiledAt: month(2024, 3),
          ownFiledAt: month(2025, 7),
        }),
      })
    );
    const params = parsed(url);
    expect(params.getSpouseDeathMonth()?.toString()).toBe(
      month(2024, 1).toString()
    );
    expect(params.getSpouseFiledMonth()?.toString()).toBe(
      month(2024, 0).toString()
    );
    expect(params.getRecipientSurvivorFiledMonth()?.toString()).toBe(
      month(2024, 3).toString()
    );
    expect(params.getRecipientFiledMonth()?.toString()).toBe(
      month(2025, 7).toString()
    );
    expect(params.getSpouseDisabled()).toBe(false);
    expect(params.getSpouseName()).toBe(null);
  });

  it('marks a late spouse on disability benefits', () => {
    const params = parsed(
      strategyShareUrl(
        inputs({
          mode: 'widowed',
          widowed: widowedWith({ claimKind: 'disability' }),
        })
      )
    );
    expect(params.getSpouseDisabled()).toBe(true);
    expect(params.getSpouseFiledMonth()).toBe(null);
  });

  it('drops a retirement start month once the claim kind changes', () => {
    const params = parsed(
      strategyShareUrl(
        inputs({
          mode: 'widowed',
          widowed: widowedWith({
            claimKind: 'none',
            retirementStartedAt: month(2024, 0),
          }),
        })
      )
    );
    expect(params.getSpouseFiledMonth()).toBe(null);
  });

  it('leaves out a late spouse with no death month, which would read back as a couple', () => {
    const params = parsed(
      strategyShareUrl(
        inputs({ mode: 'widowed', widowed: emptyWidowedInput() })
      )
    );
    expect(params.getSpousePia()).toBe(null);
  });
});
