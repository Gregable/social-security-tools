/**
 * Checks that each committed golden file holds exactly the inputs its seeded
 * sampler draws, without running the slow reference. If a sampler changes
 * (its ranges, the order of its draws, or a library rule a widowed draw
 * depends on), this fails, and the goldens need
 * GENERATE_*_GOLDENS=regenerate rather than drifting silently: before these
 * samplers were separated from the library, a fresh couple run replaced 992
 * of 1000 cases.
 */

import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COUPLE_GOLDENS_FILE,
  type CoupleGoldenInputs,
  drawCoupleInputs,
} from './couple-goldens-sampling';
import { readGoldens } from './golden-modes';
import {
  drawGridInputs,
  GRID_GOLDENS_FILE,
  type GridGoldenInputs,
} from './grid-goldens-sampling';
import type { WidowedGoldenCase } from './widowed-goldens-format';
import { WIDOWED_GOLDENS_PATH } from './widowed-goldens-format';
import { drawWidowedCases } from './widowed-goldens-sampling';

const committed = <T>(file: string) => readGoldens<T>(resolve(__dirname, file));

describe('committed golden inputs match their seeded samplers', () => {
  it('couple goldens', () => {
    const goldens = committed<{ id: number; inputs: CoupleGoldenInputs }>(
      COUPLE_GOLDENS_FILE
    );
    expect(goldens.map((g) => g.id)).toEqual(goldens.map((_, i) => i));
    expect(
      goldens.map((g) => g.inputs),
      'sampling changed: run GENERATE_COUPLE_GOLDENS=regenerate'
    ).toEqual(drawCoupleInputs());
  });

  it('grid goldens', () => {
    const goldens = committed<{ id: number; inputs: GridGoldenInputs }>(
      GRID_GOLDENS_FILE
    );
    expect(goldens.map((g) => g.id)).toEqual(goldens.map((_, i) => i));
    expect(
      goldens.map((g) => g.inputs),
      'sampling changed: run GENERATE_GRID_GOLDENS=regenerate'
    ).toEqual(drawGridInputs());
  });

  it('widowed goldens', () => {
    const goldens = committed<WidowedGoldenCase>(WIDOWED_GOLDENS_PATH);
    expect(goldens.map((g) => g.id)).toEqual(goldens.map((_, i) => i));
    expect(
      goldens.map((g) => ({
        inputs: g.inputs,
        deathMonths: g.byDeath.map((b) => b.deathMonth),
        distribution: g.expected.distribution,
      })),
      'sampling changed: run GENERATE_WIDOWED_GOLDENS=regenerate'
    ).toEqual(drawWidowedCases());
  });
});
