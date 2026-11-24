/**
 * Social Security inputs for Retirement Chartplotter
 * (retirementchartplotter.com).
 *
 * Chartplotter's Guided Setup ("Set Up My Plan") takes, on its Income step,
 * each person's own benefit at full retirement age ("Gross SS/mo at Full
 * Retirement Age") and a claim: a whole claim age plus a "Benefit Start
 * Month". Chartplotter derives the amounts for claim ages 62 to 70 from the
 * full-retirement-age amount with SSA's reduction and delayed-credit factors,
 * keeps its other plan settings, and works out spousal and survivor benefits
 * itself.
 *
 * The claim month is the start month of the year the person turns the claim
 * age (birth year + age). Any filing month from the first eligible month at
 * 62 to the age-70 month can be entered exactly.
 *
 * Someone already receiving benefits has to be switched to receiving mode in
 * the regular Social Security panel afterwards; rcpReceivingFields lists those
 * settings.
 *
 * Chartplotter has no link prefill, and its "Import Plan" needs a complete
 * plan file including its tax tables, so the report lists values to enter.
 */

import { benefitOnDate } from '$lib/benefit-calculator';
import type { IntegrationContext } from '$lib/components/integrations/integration-context';
import type { Money } from '$lib/money';
import { type MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';

export const RETIREMENT_CHARTPLOTTER_URL =
  'https://www.retirementchartplotter.com/#planner';

/**
 * The first month Chartplotter accepts a claim: the first month the person is
 * 62 all month, which is the birthday month for people born on the 1st or 2nd
 * and the month after otherwise.
 */
export function rcpEarliestClaimMonth(r: Recipient): MonthDate {
  const months = r.birthdate.layBirthDayOfMonth() > 2 ? 1 : 0;
  return r.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({ years: 62, months })
  );
}

/** The last month Chartplotter accepts a claim: the month SSA counts age 70. */
export function rcpLatestClaimMonth(r: Recipient): MonthDate {
  return r.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
  );
}

/** A claim month as Chartplotter takes it. */
export interface RcpClaim {
  /** The claim year minus the birth year, 62 to 70. */
  readonly age: number;
  /** The claim month; its calendar month is the "Benefit Start Month". */
  readonly month: MonthDate;
  /**
   * True when the filing month was outside the months Chartplotter accepts
   * (its first eligible month at 62 to the age-70 month) and was moved to the
   * nearest one.
   */
  readonly moved: boolean;
}

/** The claim for a filing month, within the months Chartplotter accepts. */
export function rcpClaim(r: Recipient, filingDate: MonthDate): RcpClaim {
  const earliest = rcpEarliestClaimMonth(r);
  const latest = rcpLatestClaimMonth(r);
  const early = filingDate.lessThan(earliest);
  const late = filingDate.greaterThan(latest);
  let claimMonth = filingDate;
  if (early) {
    claimMonth = earliest;
  } else if (late) {
    claimMonth = latest;
  }
  return {
    age: claimMonth.year() - r.birthdate.layBirthYear(),
    month: claimMonth,
    moved: early || late,
  };
}

export type RcpRole = 'primary' | 'spouse';

export interface RcpPerson {
  readonly role: RcpRole;
  readonly recipient: Recipient;
  readonly claim: RcpClaim;
  /** Own PIA rounded down to the dollar; $0 is allowed. */
  readonly fraBenefit: Money;
  /**
   * The current gross monthly benefit on their own record, in whole dollars,
   * when the benefit began before this month. Null when not yet receiving.
   */
  readonly currentBenefit: Money | null;
}

export interface RcpHousehold {
  /** The higher earner: Chartplotter's primary person. */
  readonly primary: RcpPerson;
  /** Null for a single person. */
  readonly spouse: RcpPerson | null;
  /** "Benefit Year": amounts are in its dollars. */
  readonly year: number;
}

export interface RcpHouseholdInputs {
  readonly context: IntegrationContext;
  /** The filing month of `context.recipient`, or null if none is chosen. */
  readonly recipientFilingDate: MonthDate | null;
  /** The filing month of `context.spouse`, or null if none or no spouse. */
  readonly spouseFilingDate: MonthDate | null;
  /** The current month. Benefits that began earlier are already paid. */
  readonly now: MonthDate;
}

function hasZeroPia(r: Recipient): boolean {
  return r.pia().primaryInsuranceAmount().cents() <= 0;
}

/**
 * The current benefit when the filing month is before `now`, in whole dollars.
 * Evaluated a year after filing so delayed credits for the filing year are
 * included.
 */
function currentBenefitFor(
  r: Recipient,
  filingDate: MonthDate,
  now: MonthDate
): Money | null {
  if (hasZeroPia(r) || !filingDate.lessThan(now)) return null;
  return benefitOnDate(
    r,
    filingDate,
    filingDate.addDuration(MonthDuration.OneYear())
  ).roundToDollar();
}

function rcpPerson(
  inputs: RcpHouseholdInputs,
  r: Recipient,
  role: RcpRole
): RcpPerson | null {
  const filingDate =
    r === inputs.context.recipient
      ? inputs.recipientFilingDate
      : inputs.spouseFilingDate;
  if (filingDate === null) return null;
  return {
    role,
    recipient: r,
    claim: rcpClaim(r, filingDate),
    fraBenefit: r.pia().primaryInsuranceAmount().floorToDollar(),
    currentBenefit: currentBenefitFor(r, filingDate, inputs.now),
  };
}

/**
 * The household as Chartplotter takes it, for the chosen filing dates.
 * Returns null when there is nothing to enter: the higher (so every) PIA is
 * $0, or a filing date is missing.
 */
export function buildRcpHousehold(
  inputs: RcpHouseholdInputs
): RcpHousehold | null {
  const { context } = inputs;
  const higher = context.higherEarner();
  const lower = context.lowerEarner();
  if (hasZeroPia(higher)) return null;

  const primary = rcpPerson(inputs, higher, 'primary');
  if (primary === null) return null;
  const year = inputs.now.year();
  if (lower === null) return { primary, spouse: null, year };

  const spouse = rcpPerson(inputs, lower, 'spouse');
  return spouse === null ? null : { primary, spouse, year };
}

/**
 * One setting in Chartplotter. `copyValue` is set for values worth copying
 * into a text field; ages and months are dropdowns there, so they have none.
 */
export interface RcpField {
  readonly label: string;
  readonly value: string;
  readonly copyValue?: string;
}

function amountField(label: string, amount: Money): RcpField {
  return {
    label,
    value: amount.wholeDollars(),
    copyValue: amount.value().toFixed(0),
  };
}

/**
 * The Income-step settings of Guided Setup for a person, labeled and ordered
 * as in Chartplotter.
 */
export function rcpGuidedFields(p: RcpPerson): readonly RcpField[] {
  const isPrimary = p.role === 'primary';
  return [
    amountField('Gross SS/mo at Full Retirement Age', p.fraBenefit),
    {
      label: isPrimary ? 'Initially Selected Claim Age' : 'Selected Claim Age',
      value: String(p.claim.age),
    },
    {
      label: isPrimary ? 'Benefit Start Month' : 'Spouse Benefit Start Month',
      value: p.claim.month.monthFullName(),
    },
  ];
}

/**
 * The receiving-benefits settings in the Social Security panel, for a person
 * whose benefit has already begun. Empty for anyone else. The claim is the
 * original claim; the full-retirement-age amount is already set by Guided
 * Setup.
 */
export function rcpReceivingFields(
  p: RcpPerson,
  household: RcpHousehold
): readonly RcpField[] {
  if (p.currentBenefit === null) return [];
  const claimAge = String(p.claim.age);
  const startMonth = p.claim.month.monthFullName();
  const originalClaimAge: RcpField = {
    label: 'Original Claim Age',
    value: claimAge,
    copyValue: claimAge,
  };
  const ownBenefitOnly: RcpField = {
    label: 'Current Benefit Includes',
    value: 'Own Retirement Benefit Only',
  };
  const benefitYear: RcpField = {
    label: 'Benefit Year',
    value: String(household.year),
  };
  if (p.role === 'spouse') {
    return [
      { label: 'Benefit Status', value: 'Already Receiving Benefits' },
      { label: 'Spouse Original Benefit Start Month', value: startMonth },
      amountField('Gross SS/mo', p.currentBenefit),
      ownBenefitOnly,
      originalClaimAge,
      benefitYear,
    ];
  }
  return [
    { label: 'Benefit Values', value: 'Receiving Benefits' },
    { label: 'Original Benefit Start Month', value: startMonth },
    originalClaimAge,
    amountField('Gross SS/mo (before Medicare)', p.currentBenefit),
    ...(household.spouse === null ? [] : [ownBenefitOnly]),
    benefitYear,
  ];
}
