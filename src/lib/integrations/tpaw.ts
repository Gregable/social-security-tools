/**
 * Social Security income entries for TPAW Planner (tpawplanner.com).
 *
 * TPAW's "Income During Retirement" section takes one entry per income
 * stream: a label, a monthly amount in today's dollars, and a start and end
 * month. A start can be a person's age in years and months ("When you are",
 * "When your partner is"), and an end can be that person's max age, so each
 * benefit maps to one entry owned by the person who receives it.
 */

import type { IntegrationContext } from '$lib/components/integrations/integration-context';
import type { Money } from '$lib/money';
import { MonthDate, type MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';

/** The two people in a TPAW plan, as TPAW labels them. */
export type TpawPerson = 'you' | 'partner';

export type TpawEntryKind = 'personal' | 'spousal';

/**
 * When an entry starts, as the recipient's age in that month.
 *
 * TPAW's Start menu has no "now" option, so a benefit that has already
 * started begins at the recipient's age in the current month.
 */
export interface TpawIncomeStart {
  /** Age as TPAW counts it, see {@link tpawAge}. */
  readonly age: MonthDuration;
  /** The calendar month the entry starts. */
  readonly month: MonthDate;
  /** True when the benefit began before the current month. */
  readonly alreadyStarted: boolean;
}

export interface TpawIncomeEntry {
  readonly kind: TpawEntryKind;
  /** The person who receives this benefit. */
  readonly recipient: Recipient;
  /** Which TPAW person the entry belongs to. Its end is their max age. */
  readonly person: TpawPerson;
  /** Monthly benefit in today's dollars, rounded to whole dollars. */
  readonly monthlyAmount: Money;
  readonly start: TpawIncomeStart;
}

export interface TpawEntryInputs {
  readonly context: IntegrationContext;
  /** The recipient's chosen filing month, or null if none is chosen. */
  readonly recipientFilingDate: MonthDate | null;
  /** The spouse's chosen filing month, or null if none or no spouse. */
  readonly spouseFilingDate: MonthDate | null;
  /** The household member who is "You" in TPAW. The other is "Partner". */
  readonly you: Recipient;
  /** The current month. Benefits that began earlier start here. */
  readonly now: MonthDate;
}

/**
 * The person's "Month of Birth" as TPAW's Age section takes it: the calendar
 * month they were born in.
 */
export function tpawBirthMonth(r: Recipient): MonthDate {
  return MonthDate.initFromYearsMonths({
    years: r.birthdate.layBirthYear(),
    months: r.birthdate.layBirthMonth(),
  });
}

/**
 * A person's age in a given month as TPAW counts it: whole months since
 * their calendar birth month.
 *
 * TPAW stores only a month of birth, so this is deliberately not SSA's
 * attained age. SSA treats a person as attaining an age the day before their
 * birthday, which puts someone born on the 1st a month ahead of TPAW.
 */
export function tpawAge(r: Recipient, month: MonthDate): MonthDuration {
  return month.subtractDate(tpawBirthMonth(r));
}

function startFor(
  r: Recipient,
  benefitStart: MonthDate,
  now: MonthDate
): TpawIncomeStart {
  const alreadyStarted = benefitStart.lessThan(now);
  const month = alreadyStarted ? now : benefitStart;
  return { age: tpawAge(r, month), month, alreadyStarted };
}

function personFor(inputs: TpawEntryInputs, r: Recipient): TpawPerson {
  return r === inputs.you ? 'you' : 'partner';
}

function filingDateFor(
  inputs: TpawEntryInputs,
  r: Recipient
): MonthDate | null {
  return r === inputs.context.recipient
    ? inputs.recipientFilingDate
    : inputs.spouseFilingDate;
}

function personalEntry(
  inputs: TpawEntryInputs,
  r: Recipient
): TpawIncomeEntry | null {
  const { context, now } = inputs;
  const filingDate = filingDateFor(inputs, r);
  if (filingDate === null) return null;

  const monthlyAmount =
    context.higherEarner() === r
      ? context.getHigherEarnerPersonalBenefit(filingDate)
      : context.getLowerEarnerPersonalBenefit(filingDate);
  if (monthlyAmount.cents() <= 0) return null;

  return {
    kind: 'personal',
    recipient: r,
    person: personFor(inputs, r),
    monthlyAmount,
    start: startFor(r, filingDate, now),
  };
}

function spousalEntry(inputs: TpawEntryInputs): TpawIncomeEntry | null {
  const { context, now } = inputs;
  const lowerEarner = context.lowerEarner();
  if (lowerEarner === null) return null;

  const higherFilingDate = filingDateFor(inputs, context.higherEarner());
  const lowerFilingDate = filingDateFor(inputs, lowerEarner);
  if (higherFilingDate === null || lowerFilingDate === null) return null;

  const spousal = context.spousalBenefitFor(higherFilingDate, lowerFilingDate);
  if (spousal === null) return null;

  return {
    kind: 'spousal',
    recipient: lowerEarner,
    person: personFor(inputs, lowerEarner),
    monthlyAmount: spousal.monthlyBenefit.roundToDollar(),
    start: startFor(lowerEarner, spousal.startDate, now),
  };
}

/**
 * The TPAW income entries for the household's filing dates: each person's
 * own benefit ("You" first, then "Partner"), then the lower earner's spousal
 * benefit when there is one. Benefits of $0 are left out.
 */
export function buildTpawIncomeEntries(
  inputs: TpawEntryInputs
): TpawIncomeEntry[] {
  const { context, you } = inputs;
  const partner =
    you === context.recipient ? context.spouse : context.recipient;
  const household = partner === null ? [you] : [you, partner];
  const entries = [
    ...household.map((r) => personalEntry(inputs, r)),
    spousalEntry(inputs),
  ];
  return entries.filter((e): e is TpawIncomeEntry => e !== null);
}

/** The label to type into TPAW for an entry. */
export function tpawLabel(
  entry: Pick<TpawIncomeEntry, 'kind' | 'recipient'>,
  isCouple: boolean
): string {
  const base =
    entry.kind === 'personal' ? 'Social Security' : 'Spousal benefit';
  return isCouple ? `${base} (${entry.recipient.name})` : base;
}

/**
 * An age in TPAW's display format, e.g. "67 years, 0 months". TPAW shows
 * the months even when they are zero.
 */
export function formatTpawAge(age: MonthDuration): string {
  const years = age.years();
  const months = age.modMonths();
  return `${years} year${years === 1 ? '' : 's'}, ${months} month${months === 1 ? '' : 's'}`;
}

/** The text of TPAW's Start setting for an entry. */
export function tpawStartText(entry: TpawIncomeEntry): string {
  const option =
    entry.person === 'you' ? 'When you are' : 'When your partner is';
  return `${option} ${formatTpawAge(entry.start.age)}`;
}

/** The text of TPAW's End setting for an entry. */
export function tpawEndText(entry: TpawIncomeEntry): string {
  return entry.person === 'you'
    ? 'At your max age'
    : "At your partner's max age";
}
