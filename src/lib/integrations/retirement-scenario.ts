/**
 * Social Security inputs for Retirement Scenario Explorer
 * (retirementscenario.com).
 *
 * Retirement Scenario's Social Security section takes, for each person, a
 * monthly "benefit at FRA (age 67)" in today's dollars and a whole-year claim
 * age, or, for someone already paid, the current monthly benefit and the age
 * they started. It works out early and delayed amounts, spousal top-ups and
 * survivor benefits itself, using a full retirement age of 67 for everyone.
 *
 * Its app reads a whole plan from `#plan=<base64 JSON>`, merging the fields
 * given over its defaults, and `?goto=social-security` opens its Inputs tab
 * at the Social Security section once the visitor leaves the shared-plan
 * card ("Explore This Plan"). A visitor who already has a plan saved sees the
 * linked plan as a separate copy, with "Replace my plan with this" and "Back
 * to my plan", so the report also lists the values to enter by hand.
 */

import { benefitOnDate } from '$lib/benefit-calculator';
import type { IntegrationContext } from '$lib/components/integrations/integration-context';
import type { Money } from '$lib/money';
import { type MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';

export const RETIREMENT_SCENARIO_APP_URL =
  'https://app.retirementscenario.com/?goto=social-security';

/** Retirement Scenario's full retirement age, used for everyone. */
const RS_FRA_YEARS = 67;
const RS_MIN_CLAIM_AGE = 62;
const RS_MAX_CLAIM_AGE = 70;

/**
 * The two people in a Retirement Scenario household plan. The higher earner
 * is "you", since only the spouse can take Retirement Scenario's spousal-only
 * estimate.
 */
export type RsRole = 'you' | 'spouse';

/** How one person's Social Security is entered in Retirement Scenario. */
export type RsBenefitInput =
  | {
      /** Not yet paid: a benefit at age 67 and a planned claim age. */
      readonly kind: 'planned';
      /** Monthly benefit for filing at SSA age 67, in whole dollars. */
      readonly benefitAt67: Money;
    }
  | {
      /** Already paid: the current benefit and the age it started. */
      readonly kind: 'claiming';
      /** Current monthly benefit, in whole dollars. */
      readonly currentBenefit: Money;
    }
  | {
      /**
       * No benefit on their own record: Retirement Scenario's "Estimate as
       * 50% of your FRA benefit" option. Only the spouse can use it.
       */
      readonly kind: 'spousal-only';
    };

export interface RsPerson {
  readonly role: RsRole;
  readonly recipient: Recipient;
  /** Calendar year of birth. */
  readonly birthYear: number;
  /** Calendar month of birth, January = 1, as Retirement Scenario stores it. */
  readonly birthMonth: number;
  /** SSA age at the filing month. */
  readonly filingAge: MonthDuration;
  /** The filing age in whole years, as Retirement Scenario takes it. */
  readonly claimAge: number;
  readonly benefit: RsBenefitInput;
}

export interface RsHousehold {
  readonly you: RsPerson;
  /** Null for a single person. */
  readonly spouse: RsPerson | null;
}

export interface RsHouseholdInputs {
  readonly context: IntegrationContext;
  /** The filing month of `context.recipient`, or null if none is chosen. */
  readonly recipientFilingDate: MonthDate | null;
  /** The filing month of `context.spouse`, or null if none or no spouse. */
  readonly spouseFilingDate: MonthDate | null;
  /**
   * The current month. Benefits that began earlier are already claiming,
   * except a $0-PIA spouse's, which is always the spousal-only estimate.
   */
  readonly now: MonthDate;
}

/**
 * Retirement Scenario's adjustment for claiming at a whole-year age, relative
 * to its age-67 benefit: 5/9% a month for the first 36 months early, 5/12%
 * a month beyond that, and 2/3% a month of delay up to 70.
 */
export function rsClaimAgeFactor(claimAge: number): number {
  const monthsFromFra = (claimAge - RS_FRA_YEARS) * 12;
  if (monthsFromFra >= 0) return 1 + (monthsFromFra * 2) / 3 / 100;
  const early = -monthsFromFra;
  return (
    1 -
    (Math.min(early, 36) * 5) / 9 / 100 -
    (Math.max(0, early - 36) * 5) / 12 / 100
  );
}

/** A filing age rounded to the nearest whole year, within 62 to 70. */
export function rsClaimAge(filingAge: MonthDuration): number {
  const years = Math.round(filingAge.asMonths() / 12);
  return Math.min(RS_MAX_CLAIM_AGE, Math.max(RS_MIN_CLAIM_AGE, years));
}

function hasZeroPia(r: Recipient): boolean {
  return r.pia().primaryInsuranceAmount().cents() <= 0;
}

function filingDateFor(
  inputs: RsHouseholdInputs,
  r: Recipient
): MonthDate | null {
  return r === inputs.context.recipient
    ? inputs.recipientFilingDate
    : inputs.spouseFilingDate;
}

function benefitAt67(r: Recipient): Money {
  const at67 = r.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: RS_FRA_YEARS, months: 0 })
  );
  return benefitOnDate(r, at67, at67.addDuration(MonthDuration.OneYear()));
}

function benefitInput(
  inputs: RsHouseholdInputs,
  r: Recipient,
  role: RsRole,
  filingDate: MonthDate
): RsBenefitInput {
  const { context, now } = inputs;
  if (role === 'spouse' && hasZeroPia(r)) return { kind: 'spousal-only' };
  if (filingDate.lessThan(now)) {
    const currentBenefit =
      context.higherEarner() === r
        ? context.getHigherEarnerPersonalBenefit(filingDate)
        : context.getLowerEarnerPersonalBenefit(filingDate);
    return { kind: 'claiming', currentBenefit };
  }
  return { kind: 'planned', benefitAt67: benefitAt67(r) };
}

function person(
  inputs: RsHouseholdInputs,
  r: Recipient,
  role: RsRole
): RsPerson | null {
  const filingDate = filingDateFor(inputs, r);
  if (filingDate === null) return null;
  const filingAge = r.birthdate.ageAtSsaDate(filingDate);
  const benefit = benefitInput(inputs, r, role, filingDate);
  const claimAge = rsClaimAge(filingAge);
  return {
    role,
    recipient: r,
    birthYear: r.birthdate.layBirthYear(),
    birthMonth: r.birthdate.layBirthMonth() + 1,
    filingAge,
    // Retirement Scenario caps the spousal-only claim age at 67.
    claimAge:
      benefit.kind === 'spousal-only'
        ? Math.min(claimAge, RS_FRA_YEARS)
        : claimAge,
    benefit,
  };
}

/**
 * The household as Retirement Scenario takes it, for the chosen filing
 * dates. Returns null when there is nothing to enter: the higher (so every)
 * PIA is $0, or a filing date is missing.
 */
export function buildRsHousehold(
  inputs: RsHouseholdInputs
): RsHousehold | null {
  const { context } = inputs;
  const higher = context.higherEarner();
  const lower = context.lowerEarner();
  if (hasZeroPia(higher)) return null;

  const you = person(inputs, higher, 'you');
  if (you === null) return null;
  if (lower === null) return { you, spouse: null };

  const spouse = person(inputs, lower, 'spouse');
  return spouse === null ? null : { you, spouse };
}

/** Retirement Scenario plan fields for one person, by role. */
function personFields(p: RsPerson): Record<string, number | boolean> {
  const isYou = p.role === 'you';
  const key = (youKey: string, spouseKey: string) =>
    isYou ? youKey : spouseKey;
  const fields: Record<string, number | boolean> = {
    [key('birthYear', 'spouseBirthYear')]: p.birthYear,
    [key('birthMonth', 'spouseBirthMonth')]: p.birthMonth,
    [key('ssClaimAge', 'spouseSsClaimAge')]: p.claimAge,
  };
  const fraKey = key('ssFRABenefit', 'spouseSsFRABenefit');
  switch (p.benefit.kind) {
    case 'planned':
      fields[fraKey] = p.benefit.benefitAt67.value();
      break;
    case 'claiming':
      // Retirement Scenario stores a current benefit as the age-67 amount
      // that its formula turns into that benefit at the claim age. Cents are
      // kept so it shows the current benefit back to the dollar.
      fields[fraKey] = p.benefit.currentBenefit
        .div(rsClaimAgeFactor(p.claimAge))
        .value();
      fields[key('ssAlreadyClaiming', 'spouseSsAlreadyClaiming')] = true;
      break;
    case 'spousal-only':
      fields.spouseUse50pct = true;
      break;
  }
  return fields;
}

/** The `#plan=` JSON for a household: only its Social Security and ages. */
export function rsPlanFields(
  household: RsHousehold
): Record<string, string | number | boolean> {
  const { you, spouse } = household;
  return {
    planType: spouse === null ? 'solo_single' : 'household',
    filingStatus: spouse === null ? 'single' : 'married',
    ...personFields(you),
    ...(spouse === null ? {} : personFields(spouse)),
  };
}

/**
 * One setting in Retirement Scenario's Inputs, for entering a person by hand.
 * `copyValue` is set for amounts and ages worth copying.
 */
export interface RsField {
  readonly label: string;
  readonly value: string;
  readonly copyValue?: string;
}

/**
 * The Social Security settings to enter for a person in Retirement Scenario,
 * labeled as its Inputs tab labels them. Birthdays are left out: a plan the
 * visitor already has is assumed to have them.
 */
export function rsFields(p: RsPerson): readonly RsField[] {
  const isYou = p.role === 'you';
  const claimAge = String(p.claimAge);
  switch (p.benefit.kind) {
    case 'planned': {
      const amount = p.benefit.benefitAt67;
      return [
        {
          label: isYou
            ? 'Your benefit at FRA (age 67)'
            : 'Spouse benefit at FRA (age 67)',
          value: amount.wholeDollars(),
          copyValue: amount.value().toFixed(0),
        },
        {
          label: isYou ? 'Your planned claim age' : 'Spouse planned claim age',
          value: claimAge,
          copyValue: claimAge,
        },
      ];
    }
    case 'claiming': {
      const amount = p.benefit.currentBenefit;
      return [
        {
          label: isYou
            ? "I'm already receiving Social Security"
            : 'Spouse is already receiving Social Security',
          value: 'Checked',
        },
        {
          label: isYou
            ? 'Current Monthly Benefit'
            : 'Spouse Current Monthly Benefit',
          value: amount.wholeDollars(),
          copyValue: amount.value().toFixed(0),
        },
        {
          label: isYou
            ? 'Started Claiming at Age'
            : 'Spouse Started Claiming at Age',
          value: claimAge,
          copyValue: claimAge,
        },
      ];
    }
    case 'spousal-only':
      return [
        { label: 'Estimate as 50% of your FRA benefit', value: 'Checked' },
        {
          label: 'Spouse planned claim age',
          value: claimAge,
          copyValue: claimAge,
        },
      ];
  }
}

/** A link that opens Retirement Scenario with the household's benefits. */
export function retirementScenarioUrl(household: RsHousehold): string {
  // Every field is ASCII, so btoa encodes the JSON directly.
  const json = JSON.stringify(rsPlanFields(household));
  return `${RETIREMENT_SCENARIO_APP_URL}#plan=${btoa(json)}`;
}
