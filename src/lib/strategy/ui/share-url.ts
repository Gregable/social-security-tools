import type { Birthdate } from '$lib/birthday';
import type { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import {
  type AlreadyFiled,
  isEligibleToHaveFiled,
} from '$lib/strategy/calculations/already-filed';
import {
  isEligibleToHaveFiledForSurvivor,
  type WidowedInput,
} from '$lib/strategy/calculations/late-spouse';
import { buildStrategyHash, type UrlParams } from '$lib/url-params';
import type { StrategyMode } from './strategy-mode.js';

/**
 * The widowed form a share link describes, for a survivor born
 * `survivorBirthdate`. It reads back what `strategyShareUrl` writes.
 *
 * A link can also be written by hand, so this settles what the form could
 * not have produced. A retirement start month (`filed2`) wins over
 * `disabled2`. A started benefit is dropped when the form would not show its
 * control as of `currentDate`: the survivor too young to have claimed it, or,
 * for survivor benefits, no death month to check it against. Months are not
 * otherwise checked here; the form re-validates every month it shows.
 */
export function widowedInputFromParams(
  params: UrlParams,
  survivorBirthdate: Birthdate,
  currentDate: MonthDate
): WidowedInput {
  const deathMonth = params.getSpouseDeathMonth();
  const retirementStartedAt = params.getSpouseFiledMonth();
  const survivorFiledAt = params.getRecipientSurvivorFiledMonth();
  const ownFiledAt = params.getRecipientFiledMonth();
  return {
    deathMonth,
    claimKind:
      retirementStartedAt !== null
        ? 'retirement'
        : params.getSpouseDisabled()
          ? 'disability'
          : 'none',
    retirementStartedAt,
    survivorFiledAt:
      deathMonth !== null &&
      isEligibleToHaveFiledForSurvivor(
        survivorBirthdate,
        deathMonth,
        currentDate
      )
        ? survivorFiledAt
        : null,
    ownFiledAt: isEligibleToHaveFiled(survivorBirthdate, currentDate)
      ? ownFiledAt
      : null,
  };
}

/** The strategy form's state, as the share link needs it. */
export interface StrategyShareInputs {
  readonly mode: StrategyMode;
  readonly recipients: readonly [Recipient, Recipient];
  readonly piaValues: readonly [number | null, number | null];
  /** YYYY-MM-DD, or '' while not entered. */
  readonly birthdateInputs: readonly [string, string];
  /** Couple mode: the months each spouse's benefits started. */
  readonly alreadyFiled: AlreadyFiled;
  /** Widowed mode: the late spouse and the survivor's started benefits. */
  readonly widowed: Readonly<WidowedInput>;
}

/**
 * The link that reopens the strategy page with this form filled in, or ''
 * until person 1 has a birthdate and PIA.
 *
 * Each mode writes only its own fields: the form keeps every mode's state
 * while the user switches between them, and a filed month from couple mode
 * must not turn up in a widowed link.
 */
export function strategyShareUrl(inputs: StrategyShareInputs): string {
  const {
    mode,
    recipients,
    piaValues,
    birthdateInputs,
    alreadyFiled,
    widowed,
  } = inputs;
  const pia1 = piaValues[0];
  const dob1 = birthdateInputs[0];
  if (!dob1 || pia1 === null) return '';

  const pia2 = piaValues[1];
  const dob2 = birthdateInputs[1];
  const isWidowed = mode === 'widowed';
  // A widowed link without its death month would read back as a couple, so
  // it leaves the late spouse out until the month is known.
  const second =
    mode !== 'single' &&
    pia2 !== null &&
    dob2 !== '' &&
    (!isWidowed || widowed.deathMonth !== null)
      ? { pia2, dob2 }
      : null;

  const [self, spouse] = recipients;
  const hash = buildStrategyHash({
    isSingle: mode === 'single',
    pia1,
    dob1,
    name1: self.name && self.name !== 'Self' ? self.name : undefined,
    gender1: self.gender,
    filed1: isWidowed ? widowed.ownFiledAt : alreadyFiled[0],
    ...(second === null
      ? {}
      : isWidowed
        ? {
            ...second,
            filed2:
              widowed.claimKind === 'retirement'
                ? widowed.retirementStartedAt
                : null,
            disabled2: widowed.claimKind === 'disability',
            died2: widowed.deathMonth,
            survivorFiled1: widowed.survivorFiledAt,
          }
        : {
            ...second,
            name2:
              spouse.name && spouse.name !== 'Spouse' ? spouse.name : undefined,
            gender2: spouse.gender,
            filed2: alreadyFiled[1],
          }),
  });
  return `https://ssa.tools/strategy${hash}`;
}
