import { describe, expect, it } from 'vitest';
import { MonthDate } from '$lib/month-time';
import {
  type WidowedContext,
  widowedAmounts,
  widowedHasChoice,
} from '$lib/strategy/calculations/widowed-optimizer';
import {
  HEADLINE_SCENARIOS,
  widowedContextFor,
} from '../helpers/widowed-mocks';

// Every case is as of October 2026 (STORY_CURRENT_DATE). The born,
// spouseBorn and died options count months 1-12; a MonthDate, as in filed,
// counts them 0-11.

/** Born 15 March 1958: past survivor full retirement age, not yet 70. */
const pastSurvivorFra = {
  born: [1958, 3, 15],
  // Died at 69 without claiming: the survivor benefit is their PIA plus
  // delayed credits, $2,928, and it has stopped growing.
  spousePia: 2400,
  spouseBorn: [1956, 5, 10],
  died: [2025, 6],
} as const;

/** Born 15 March 1964, own benefit started April 2026, at 62 and 1 month. */
const ownStartedAt62 = {
  born: [1964, 3, 15],
  spouseBorn: [1962, 5, 10],
  died: [2025, 6],
  filed: {
    survivor: null,
    own: MonthDate.initFromYearsMonths({ years: 2026, months: 3 }),
  },
} as const;

/** Which of the two ranges still has more than one start age. */
function openRanges(context: WidowedContext) {
  return {
    survivor: context.survivorRange.hasChoice,
    own: context.ownRange.hasChoice,
  };
}

describe('widowedHasChoice', () => {
  it('is false once both benefits are settled', () => {
    // 76: past survivor full retirement age and past 70, so each benefit
    // has a single start age left.
    const context = widowedContextFor(HEADLINE_SCENARIOS.fileNowBackdated);
    expect(openRanges(context)).toEqual({ survivor: false, own: false });
    expect(widowedHasChoice(context)).toBe(false);
  });

  it('is false when the own benefit, even at 70, never pays more than a survivor benefit that has stopped growing', () => {
    // A $300 PIA is $380 at 70, against $2,928.
    const context = widowedContextFor({ ...pastSurvivorFra, ownPia: 300 });
    expect(openRanges(context)).toEqual({ survivor: false, own: true });
    expect(widowedHasChoice(context)).toBe(false);
  });

  it('is true when the own benefit at 70 would pay more than that survivor benefit', () => {
    // A $2,400 PIA is $3,040 at 70, against $2,928: whether waiting for it
    // pays off depends on how long the survivor lives.
    const context = widowedContextFor({ ...pastSurvivorFra, ownPia: 2400 });
    expect(openRanges(context)).toEqual({ survivor: false, own: true });
    expect(widowedHasChoice(context)).toBe(true);
  });

  it('treats an own benefit that at most ties the survivor benefit as no choice', () => {
    // Equal amounts pay the same whichever benefit is paid. A dollar more of
    // PIA is a choice again.
    const tie = widowedContextFor({ ...pastSurvivorFra, ownPia: 2312 });
    const atSeventy = widowedAmounts(tie, {
      survivorStart: tie.survivorRange.earliest,
      ownStart: tie.ownRange.latest,
    });
    expect(atSeventy.own.cents()).toBe(atSeventy.survivor.cents());
    expect(widowedHasChoice(tie)).toBe(false);

    const more = widowedContextFor({ ...pastSurvivorFra, ownPia: 2313 });
    expect(openRanges(more)).toEqual({ survivor: false, own: true });
    expect(widowedHasChoice(more)).toBe(true);
  });

  it('is false when the survivor benefit never pays more than an own benefit already started', () => {
    // $1,971 a month from 62, against a survivor benefit of at most $1,000.
    const context = widowedContextFor({
      ...ownStartedAt62,
      ownPia: 2800,
      spousePia: 1000,
    });
    expect(openRanges(context)).toEqual({ survivor: true, own: false });
    expect(widowedHasChoice(context)).toBe(false);
  });

  it('is true when the survivor benefit could pay more than the own benefit already started', () => {
    // A survivor benefit of up to $2,800 against $1,971: when to start it
    // is still a trade-off.
    const context = widowedContextFor({
      ...ownStartedAt62,
      ownPia: 2800,
      spousePia: 2800,
    });
    expect(openRanges(context)).toEqual({ survivor: true, own: false });
    expect(widowedHasChoice(context)).toBe(true);
  });

  it('treats a survivor benefit that at most ties the started own benefit as no choice', () => {
    const tie = widowedContextFor({
      ...ownStartedAt62,
      ownPia: 2800,
      spousePia: 1971,
    });
    const atLargest = widowedAmounts(tie, {
      survivorStart: tie.survivorRange.latest,
      ownStart: tie.ownRange.earliest,
    });
    expect(atLargest.survivor.cents()).toBe(atLargest.own.cents());
    expect(widowedHasChoice(tie)).toBe(false);

    const more = widowedContextFor({
      ...ownStartedAt62,
      ownPia: 2800,
      spousePia: 1972,
    });
    expect(openRanges(more)).toEqual({ survivor: true, own: false });
    expect(widowedHasChoice(more)).toBe(true);
  });

  it('is true while both benefits have start dates open, even when one already pays more than the other ever could', () => {
    // At 64 the own benefit would already pay $2,416, more than the $1,500
    // survivor benefit at its largest, but it keeps growing to 70. Taking
    // the survivor benefit as a bridge and the own benefit later is still a
    // trade-off that depends on how long the survivor lives.
    const context = widowedContextFor({
      ownPia: 3000,
      born: [1962, 9, 15],
      spousePia: 1500,
      spouseBorn: [1960, 3, 15],
      died: [2025, 11],
    });
    expect(openRanges(context)).toEqual({ survivor: true, own: true });
    expect(widowedHasChoice(context)).toBe(true);
  });

  it('is true for an own benefit that never catches up while the survivor benefit is still growing', () => {
    // The own benefit never pays more than the survivor benefit, but when
    // to start the survivor benefit still depends on how long the survivor
    // lives, and a later start uses the own benefit as a bridge.
    const context = widowedContextFor(HEADLINE_SCENARIOS.ownNotNeeded);
    expect(openRanges(context)).toEqual({ survivor: true, own: true });
    expect(widowedHasChoice(context)).toBe(true);
  });

  describe('with no retirement benefit on their own record', () => {
    it('is true while the survivor benefit is still growing', () => {
      // 58: the survivor benefit can start at 60 and grows until survivor
      // full retirement age.
      const context = widowedContextFor({
        ownPia: 0,
        born: [1968, 3, 15],
        spousePia: 1500,
        spouseBorn: [1964, 5, 10],
        died: [2025, 11],
      });
      expect(openRanges(context)).toEqual({ survivor: true, own: false });
      expect(widowedHasChoice(context)).toBe(true);
    });

    it('is false once the survivor benefit has stopped growing', () => {
      const context = widowedContextFor({ ...pastSurvivorFra, ownPia: 0 });
      expect(openRanges(context)).toEqual({ survivor: false, own: false });
      expect(widowedHasChoice(context)).toBe(false);
    });
  });
});
