import { describe, expect, it } from 'vitest';
import { GUIDE_DATES, GUIDE_SLUGS, guideDates } from '$lib/guide-dates';

const slugs = GUIDE_SLUGS;

// Round-trips a YYYY-MM-DD string through Date. JS rolls invalid days over
// (2026-02-30 becomes March 2) and rejects unpadded ones, so only a real,
// zero-padded calendar day comes back unchanged.
function isCalendarDay(day: string): boolean {
  const parsed = new Date(`${day}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day
  );
}

describe('GUIDE_DATES', () => {
  it('lists the guides', () => {
    // A floor against an accidentally emptied registry; 47 guides at the
    // time of writing.
    expect(slugs.length).toBeGreaterThan(40);
  });

  for (const slug of slugs) {
    const { published, updated } = GUIDE_DATES[slug];

    it(`${slug} has real calendar days`, () => {
      expect(isCalendarDay(published), published).toBe(true);
      expect(isCalendarDay(updated), updated).toBe(true);
    });

    it(`${slug} was not updated before it was published`, () => {
      expect(updated >= published).toBe(true);
    });

    it(`${slug} has no dates in the future`, () => {
      const today = new Date().toISOString().slice(0, 10);
      expect(published <= today).toBe(true);
      expect(updated <= today).toBe(true);
    });
  }
});

describe('guideDates', () => {
  it('returns UTC-midnight dates matching the registry', () => {
    const { publishDate, updateDate } = guideDates('60k-income');
    expect(publishDate.toISOString()).toBe('2025-06-15T00:00:00.000Z');
    expect(updateDate.toISOString()).toBe('2026-10-14T00:00:00.000Z');
  });

  it('returns equal dates for a guide that was never revised', () => {
    const { publishDate, updateDate } = guideDates('remarriage');
    expect(updateDate.getTime()).toBe(publishDate.getTime());
  });

  it('returns fresh Date objects, so callers cannot alter the registry', () => {
    const first = guideDates('aime');
    first.publishDate.setUTCFullYear(1900);
    expect(guideDates('aime').publishDate.getUTCFullYear()).not.toBe(1900);
  });
});
