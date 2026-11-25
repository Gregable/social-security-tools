/**
 * Link back to the Retirement Figures Social Security calculator
 * (retirementfigures.com).
 *
 * That calculator takes each person's birth date and monthly benefit at full
 * retirement age, and works out the amounts for claiming at 62 to 70,
 * including spousal benefits, itself. It reads them from the URL fragment:
 *
 *   #from=ssa.tools&pia1=2547&dob1=1965-09-21&pia2=599&dob2=1966-03-02
 *
 * `pia2=0` marks a spouse with spousal benefits only, so the higher earner is
 * always person 1. `from=ssa.tools` lets Retirement Figures say where the
 * figures came from. The fragment is not sent to any server.
 */

import type { IntegrationContext } from '$lib/components/integrations/integration-context';
import type { Money } from '$lib/money';
import type { Recipient } from '$lib/recipient';

export const RETIREMENT_FIGURES_CALCULATOR_URL =
  'https://retirementfigures.com/social-security-calculator/';

/** One person as sent to Retirement Figures. */
export interface RfPerson {
  readonly recipient: Recipient;
  /** Primary Insurance Amount, rounded down to the dollar. */
  readonly pia: Money;
}

/** The household's people, higher earner first. */
export function retirementFiguresPeople(
  context: IntegrationContext
): readonly RfPerson[] {
  const lower = context.lowerEarner();
  const recipients =
    lower === null ? [context.higherEarner()] : [context.higherEarner(), lower];
  return recipients.map((recipient) => ({
    recipient,
    pia: recipient.pia().primaryInsuranceAmount().floorToDollar(),
  }));
}

/** The calculator link with each person's PIA and birth date filled in. */
export function retirementFiguresUrl(people: readonly RfPerson[]): string {
  const params = new URLSearchParams({ from: 'ssa.tools' });
  people.forEach((p, i) => {
    params.set(`pia${i + 1}`, String(p.pia.value()));
    params.set(`dob${i + 1}`, p.recipient.birthdate.layBirthdateIsoString());
  });
  return `${RETIREMENT_FIGURES_CALCULATOR_URL}#${params.toString()}`;
}
