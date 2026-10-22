/**
 * Seeded input sampling shared by the golden generators and by
 * golden-inputs.test.ts, which checks that the committed golden files hold
 * exactly the inputs these samplers draw.
 */

/** Seedable PRNG (mulberry32): the same seed always gives the same stream. */
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Draws `cases` inputs from a seeded stream, skipping draws that `sample`
 * rejects (returns null for). `sample` must decide from the stream alone,
 * never from a library result, or the drawn inputs drift when the library
 * changes.
 *
 * @throws Error if fewer than `cases` inputs are found in `maxAttempts`
 *   draws.
 */
export function drawInputs<T>(
  seed: number,
  cases: number,
  maxAttempts: number,
  sample: (rng: () => number) => T | null
): T[] {
  const rng = mulberry32(seed);
  const inputs: T[] = [];
  for (let attempt = 0; inputs.length < cases && attempt < maxAttempts; ) {
    attempt++;
    const drawn = sample(rng);
    if (drawn !== null) inputs.push(drawn);
  }
  if (inputs.length < cases) {
    throw new Error(`only ${inputs.length} of ${cases} inputs drawn`);
  }
  return inputs;
}
