/**
 * Run modes for the golden generators (generate-goldens.test.ts,
 * generate-grid-goldens.test.ts, generate-widowed-goldens.test.ts).
 *
 * Each generator is skipped unless its environment variable names a mode:
 *
 *   - `recompute`: keep the committed inputs and recompute only the outputs
 *     with the slow reference. Use this when a benefit rule changes: the
 *     diff then shows exactly which results moved, on the same cases.
 *   - `regenerate` (or `1`): draw fresh inputs from the generator's seeded
 *     PRNG and compute their outputs. Input sampling never depends on a
 *     library result, so this reproduces the committed inputs unless the
 *     sampling itself changed; use it only to change what the goldens cover.
 *
 * For example:
 *   GENERATE_COUPLE_GOLDENS=recompute npx vitest run src/test/strategy/generate-goldens.test.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';

export type GoldenMode = 'recompute' | 'regenerate';

/**
 * The mode named by `envVar`, or null when it is unset.
 *
 * @throws Error if it is set to anything else, so a typo fails loudly
 *   instead of silently skipping the generator.
 */
export function goldenMode(envVar: string): GoldenMode | null {
  const value = process.env[envVar];
  if (value === undefined || value === '') return null;
  if (value === 'recompute') return 'recompute';
  if (value === 'regenerate' || value === '1') return 'regenerate';
  throw new Error(
    `${envVar}=${value}: expected "recompute" or "regenerate" (or "1")`
  );
}

/** Reads a committed golden file. */
export function readGoldens<T>(path: string): T[] {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * Writes a golden file in the format it was committed in, so a recompute
 * diff shows only the values that changed.
 */
export function writeGoldens(
  path: string,
  goldens: unknown[],
  format: { indent: number; trailingNewline: boolean }
): void {
  const json = JSON.stringify(goldens, null, format.indent);
  writeFileSync(path, format.trailingNewline ? `${json}\n` : json);
}
