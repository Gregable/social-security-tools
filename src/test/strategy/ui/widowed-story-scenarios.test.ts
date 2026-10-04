import { describe, expect, it } from 'vitest';
import {
  HEADLINE_SCENARIOS,
  widowedContextFor,
  widowedRecommendationFor,
} from '../../helpers/widowed-mocks';

/**
 * The WidowedHeadline stories run the real optimizer, so a change to it can
 * quietly change what a story shows. These check that each scenario still
 * gives the advice its story describes.
 */
function recommendationFor(scenario: keyof typeof HEADLINE_SCENARIOS) {
  return widowedRecommendationFor(
    widowedContextFor(HEADLINE_SCENARIOS[scenario])
  );
}

describe('widowed headline story scenarios', () => {
  it('survivorFirstThenOwn starts the survivor benefit, then switches', () => {
    const r = recommendationFor('survivorFirstThenOwn');
    expect(r.first).toBe('survivor');
    expect(r.survivor.kind).toBe('file-in');
    expect(r.own.kind).toBe('file-in');
  });

  it('ownFirstThenSurvivor starts the own benefit, then switches', () => {
    const r = recommendationFor('ownFirstThenSurvivor');
    expect(r.first).toBe('own');
    expect(r.survivor.kind).toBe('file-in');
    expect(r.own.kind).toBe('file-in');
  });

  it('ownNotNeeded leaves out the own benefit', () => {
    const r = recommendationFor('ownNotNeeded');
    expect(r.own.kind).toBe('not-needed');
    expect(r.survivor.kind).toBe('file-in');
    expect(r.first).toBe(null);
  });

  it('fileNowBackdated says to claim the survivor benefit now', () => {
    expect(recommendationFor('fileNowBackdated').survivor.kind).toBe(
      'file-now'
    );
  });

  it('alreadyReceivingSurvivor states the survivor benefit as started', () => {
    expect(recommendationFor('alreadyReceivingSurvivor').survivor.kind).toBe(
      'started'
    );
  });
});
