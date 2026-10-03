/**
 * The late spouse in the strategy optimizer's widowed mode.
 *
 * A widow(er)'s survivor benefit depends on facts about the spouse who died:
 * their PIA, when they died, and what they had claimed on their own record.
 * This module owns that description, the rules for which months the form
 * accepts, and the survivor benefit basis it implies. Like already-filed.ts,
 * the validators depend only on `Birthdate` and `MonthDate` so the form can
 * use them before any `Recipient` exists.
 */

import {
  type SurvivorBenefitBasis,
  survivorBenefitBasis,
} from '$lib/benefit-calculator';
import type { Birthdate } from '$lib/birthday';
import { type MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import { earliestFilingDate } from './already-filed';

/** What the late spouse was receiving on their own record when they died. */
export type LateSpouseClaim =
  | { readonly kind: 'none' }
  | { readonly kind: 'retirement'; readonly startedAt: MonthDate }
  | { readonly kind: 'disability' };

export type LateSpouseClaimKind = LateSpouseClaim['kind'];

/** A spouse who has died. */
export interface LateSpouse {
  /** Their birthdate and PIA. */
  readonly recipient: Recipient;
  /** The month they died. */
  readonly deathDate: MonthDate;
  readonly claim: LateSpouseClaim;
}

function formatMonth(date: MonthDate): string {
  return `${date.monthFullName()} ${date.year()}`;
}

/**
 * Validates the month the spouse died. Returns null when acceptable,
 * otherwise a message suitable for showing under the input.
 */
export function validateDeathMonth(
  birthdate: Birthdate,
  deathMonth: MonthDate,
  currentDate: MonthDate
): string | null {
  if (deathMonth.greaterThan(currentDate)) {
    return 'The month of death cannot be in the future.';
  }
  if (deathMonth.lessThan(birthdate.dateAtLayAge(new MonthDuration(0)))) {
    return 'The month of death cannot be before they were born.';
  }
  return null;
}

/**
 * Validates the month the late spouse's retirement benefits started.
 *
 * No retirement benefit is payable for the month of death, so a start in
 * that month or later is not a claim at all (see `filedBeforeDeath`). The
 * form asks for a month before it rather than quietly treating it as "did
 * not claim".
 */
export function validateLateSpouseFiledMonth(
  birthdate: Birthdate,
  filedAt: MonthDate,
  deathMonth: MonthDate
): string | null {
  const earliest = earliestFilingDate(birthdate);
  if (filedAt.lessThan(earliest)) {
    return (
      `Retirement benefits cannot start before the first full month at age ` +
      `62, which is ${formatMonth(earliest)} for this birthdate.`
    );
  }
  if (!filedAt.lessThan(deathMonth)) {
    return 'Benefits must have started before the month they died.';
  }
  return null;
}

/**
 * The first month a survivor benefit could start: the later of the month
 * the survivor attains age 60 and the month of death.
 *
 * Unlike retirement benefits, survivor benefits have no "age throughout the
 * month" rule: entitlement can begin in the month age 60 is attained (POMS
 * RS 00207.001), which is the SSA age of 60 years 0 months. They can also
 * begin with the month of death (20 CFR 404.621(a)(4)(ii)).
 */
export function earliestSurvivorBenefitDate(
  survivorBirthdate: Birthdate,
  deathMonth: MonthDate
): MonthDate {
  const at60 = survivorBirthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 60, months: 0 })
  );
  return at60.greaterThan(deathMonth) ? at60 : deathMonth;
}

/**
 * Whether the survivor could already have started survivor benefits as of
 * `currentDate`. The form shows the "already receiving survivor benefits"
 * control only when this is true.
 */
export function isEligibleToHaveFiledForSurvivor(
  survivorBirthdate: Birthdate,
  deathMonth: MonthDate,
  currentDate: MonthDate
): boolean {
  return earliestSurvivorBenefitDate(
    survivorBirthdate,
    deathMonth
  ).lessThanOrEqual(currentDate);
}

/**
 * Validates the month the survivor's own survivor benefits started. Like
 * `validateFiledMonth`, this records what has happened, not a plan.
 */
export function validateSurvivorFiledMonth(
  survivorBirthdate: Birthdate,
  filedAt: MonthDate,
  deathMonth: MonthDate,
  currentDate: MonthDate
): string | null {
  const earliest = earliestSurvivorBenefitDate(survivorBirthdate, deathMonth);
  if (filedAt.lessThan(earliest)) {
    return earliest.monthsSinceEpoch() === deathMonth.monthsSinceEpoch()
      ? `Survivor benefits cannot start before the month of death, ${formatMonth(earliest)}.`
      : `Survivor benefits cannot start before ${formatMonth(earliest)}, when you reach age 60.`;
  }
  if (filedAt.greaterThan(currentDate)) {
    return 'The start month cannot be in the future.';
  }
  return null;
}

/**
 * The survivor benefit basis the late spouse's record supports: the amount
 * the survivor's age reduction applies to, and the widow(er)'s limit, if
 * any. See `SurvivorBenefitBasis`.
 *
 * A spouse on disability benefits leaves 100% of their PIA with no limit: a
 * disability benefit is not reduced, and it earns no delayed retirement
 * credits, even past full retirement age, when it converts to a retirement
 * benefit at the same rate (POMS RS 00207.002). (Someone who took a reduced
 * retirement benefit before becoming disabled would have a limit; that case
 * is rare enough to leave to "retirement".)
 */
export function lateSpouseSurvivorBasis(
  lateSpouse: LateSpouse
): SurvivorBenefitBasis {
  const { recipient, deathDate, claim } = lateSpouse;
  switch (claim.kind) {
    case 'disability':
      return { base: recipient.pia().primaryInsuranceAmount(), limit: null };
    case 'retirement':
      return survivorBenefitBasis(recipient, claim.startedAt, deathDate);
    case 'none':
      // A filing month at or after death is how survivorBenefitBasis spells
      // "never filed".
      return survivorBenefitBasis(recipient, deathDate, deathDate);
  }
}

/**
 * The widowed-mode form state the page binds into its inputs: what is known
 * about the late spouse, and which of the survivor's own benefits have
 * already started. Snapshot it with `lateSpouseFrom` before a calculation,
 * so results describe one set of inputs even if the form changes mid-run.
 */
export interface WidowedInput {
  /** The month the spouse died. */
  deathMonth: MonthDate | null;
  claimKind: LateSpouseClaimKind;
  /** When `claimKind` is 'retirement', the month their benefits started. */
  retirementStartedAt: MonthDate | null;
  /** The month the survivor's survivor benefits started, or null. */
  survivorFiledAt: MonthDate | null;
  /** The month the survivor's own retirement benefits started, or null. */
  ownFiledAt: MonthDate | null;
}

/** A blank widowed-mode form. A new object each call: the form mutates it. */
export function emptyWidowedInput(): WidowedInput {
  return {
    deathMonth: null,
    claimKind: 'none',
    retirementStartedAt: null,
    survivorFiledAt: null,
    ownFiledAt: null,
  };
}

/**
 * The late spouse the form describes, with `recipient` holding their
 * birthdate and PIA, or null while the form is incomplete.
 */
export function lateSpouseFrom(
  recipient: Recipient,
  input: WidowedInput
): LateSpouse | null {
  if (input.deathMonth === null) return null;
  let claim: LateSpouseClaim;
  switch (input.claimKind) {
    case 'none':
      claim = { kind: 'none' };
      break;
    case 'disability':
      claim = { kind: 'disability' };
      break;
    case 'retirement':
      if (input.retirementStartedAt === null) return null;
      claim = { kind: 'retirement', startedAt: input.retirementStartedAt };
      break;
  }
  return { recipient, deathDate: input.deathMonth, claim };
}
