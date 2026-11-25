import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { IntegrationContext } from '$lib/components/integrations/integration-context';
import {
  retirementFiguresPeople,
  retirementFiguresUrl,
} from '$lib/integrations/retirement-figures';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';

const BASE = 'https://retirementfigures.com/social-security-calculator/';

function person(name: string, pia: number, birthdate: Birthdate): Recipient {
  const r = new Recipient();
  r.name = name;
  r.setPia(Money.from(pia));
  r.birthdate = birthdate;
  return r;
}

function urlFor(recipient: Recipient, spouse: Recipient | null): string {
  return retirementFiguresUrl(
    retirementFiguresPeople(new IntegrationContext(recipient, spouse))
  );
}

const alex = () => person('Alex', 2547, Birthdate.FromYMD(1965, 8, 21));
const chris = () => person('Chris', 599, Birthdate.FromYMD(1966, 2, 2));

describe('retirementFiguresUrl', () => {
  it('matches the example link Retirement Figures gave for a couple', () => {
    expect(urlFor(alex(), chris())).toBe(
      `${BASE}#from=ssa.tools&pia1=2547&dob1=1965-09-21&pia2=599&dob2=1966-03-02`
    );
  });

  it('sends only person 1 for a single person', () => {
    expect(urlFor(alex(), null)).toBe(
      `${BASE}#from=ssa.tools&pia1=2547&dob1=1965-09-21`
    );
  });

  it('puts the higher earner first when the spouse earns more', () => {
    expect(urlFor(chris(), alex())).toBe(
      `${BASE}#from=ssa.tools&pia1=2547&dob1=1965-09-21&pia2=599&dob2=1966-03-02`
    );
  });

  it('sends pia2=0 for a spouse with spousal benefits only', () => {
    const spouse = person('Chris', 0, Birthdate.FromYMD(1966, 2, 2));
    expect(urlFor(alex(), spouse)).toBe(
      `${BASE}#from=ssa.tools&pia1=2547&dob1=1965-09-21&pia2=0&dob2=1966-03-02`
    );
  });

  it('makes a $0-PIA recipient person 2 when the spouse has a benefit', () => {
    const recipient = person('Chris', 0, Birthdate.FromYMD(1966, 2, 2));
    expect(urlFor(recipient, alex())).toBe(
      `${BASE}#from=ssa.tools&pia1=2547&dob1=1965-09-21&pia2=0&dob2=1966-03-02`
    );
  });

  it('rounds a PIA with cents down to the dollar', () => {
    const r = person('Alex', 2547.9, Birthdate.FromYMD(1965, 8, 21));
    expect(urlFor(r, null)).toBe(
      `${BASE}#from=ssa.tools&pia1=2547&dob1=1965-09-21`
    );
  });

  it('sends the calendar birthdate for someone born on the 1st', () => {
    const r = person('Alex', 2000, Birthdate.FromYMD(1960, 0, 1));
    expect(urlFor(r, null)).toBe(
      `${BASE}#from=ssa.tools&pia1=2000&dob1=1960-01-01`
    );
  });
});

describe('retirementFiguresPeople', () => {
  it('lists the higher earner first with their whole-dollar PIA', () => {
    const a = alex();
    const c = chris();
    const people = retirementFiguresPeople(new IntegrationContext(c, a));
    expect(people.map((p) => p.recipient)).toEqual([a, c]);
    expect(people.map((p) => p.pia.value())).toEqual([2547, 599]);
  });

  it('lists one person when single', () => {
    const a = alex();
    const people = retirementFiguresPeople(new IntegrationContext(a, null));
    expect(people.map((p) => p.recipient)).toEqual([a]);
  });
});
