/**
 * The shape of src/test/strategy/goldens/widowed-goldens.json, shared by
 * generate-widowed-goldens.test.ts and widowed-goldens.test.ts. Months are
 * months since the epoch; ages are SSA ages in months; birthdates are
 * [year, month index 0-11, day].
 */

import type { DeathProbability } from '$lib/life-tables';

/** Relative to src/test/strategy. */
export const WIDOWED_GOLDENS_PATH = 'goldens/widowed-goldens.json';

export type WidowedGoldenClaim =
  | { readonly kind: 'none' }
  | { readonly kind: 'disability' }
  | { readonly kind: 'retirement'; readonly startedAt: number };

export interface WidowedGoldenInputs {
  readonly survivorPiaCents: number;
  readonly survivorBirth: readonly number[];
  readonly spousePiaCents: number;
  readonly spouseBirth: readonly number[];
  readonly deathMonth: number;
  readonly claim: WidowedGoldenClaim;
  readonly survivorFiledAt: number | null;
  readonly ownFiledAt: number | null;
  readonly discountRate: number;
  readonly currentDate: number;
}

/** The first best strategy in search order, and its value in cents. */
export interface WidowedGoldenResult {
  readonly npvCents: number;
  readonly survivorStartMonths: number;
  readonly ownStartMonths: number;
}

export interface WidowedGoldenCase {
  readonly id: number;
  readonly inputs: WidowedGoldenInputs;
  /** The best plan for a widow(er) who dies in each of these months. */
  readonly byDeath: readonly {
    readonly deathMonth: number;
    readonly best: WidowedGoldenResult;
  }[];
  /** The best plan by expected value over a small death distribution. */
  readonly expected: {
    readonly distribution: readonly DeathProbability[];
    readonly best: WidowedGoldenResult;
  };
}
