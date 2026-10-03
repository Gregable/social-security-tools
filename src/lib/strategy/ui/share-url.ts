import type { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import type { WidowedInput } from '$lib/strategy/calculations/late-spouse';
import { buildStrategyHash } from '$lib/url-params';
import type { StrategyMode } from './strategy-mode.js';

/** The strategy form's state, as the share link needs it. */
export interface StrategyShareInputs {
  readonly mode: StrategyMode;
  readonly recipients: readonly [Recipient, Recipient];
  readonly piaValues: readonly [number | null, number | null];
  /** YYYY-MM-DD, or '' while not entered. */
  readonly birthdateInputs: readonly [string, string];
  /** Couple mode: the months each spouse's benefits started. */
  readonly alreadyFiled: readonly [MonthDate | null, MonthDate | null];
  /** Widowed mode: the late spouse and the survivor's started benefits. */
  readonly widowed: WidowedInput;
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
