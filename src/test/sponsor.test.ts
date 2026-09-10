import { describe, expect, it } from 'vitest';
import { DEFAULT_SPONSOR_COPY, SPONSOR, type SponsorCopy } from '$lib/sponsor';
import {
  GUIDE_CTA_TYPES,
  getGuideCTAType,
} from '../routes/guides/guide-cta-config';
import { guideSlugFromPath } from '../routes/guides/guide-slug';
import {
  GUIDE_SPONSOR_COPY,
  getGuideSponsorCopy,
} from '../routes/guides/sponsor-copy';

describe('SPONSOR config', () => {
  it('links to an https URL with a non-empty name', () => {
    expect(SPONSOR.name.length).toBeGreaterThan(0);
    expect(new URL(SPONSOR.url).protocol).toBe('https:');
  });

  it('reports analytics under its own destination', () => {
    expect(SPONSOR.destination).toBe('socialsecurityadvisors');
  });
});

describe('guide CTA types', () => {
  it('defaults unknown guides to the sponsor CTA', () => {
    expect(getGuideCTAType('/guides/some-new-guide')).toBe('sponsor');
    expect(getGuideCTAType('/guides/some-new-guide/')).toBe('sponsor');
  });

  it('keeps calculator-focused guides on the calculator CTA', () => {
    expect(getGuideCTAType('/guides/pia')).toBe('calculator');
    expect(getGuideCTAType('/guides/projectionlab-review')).toBe('calculator');
  });

  it('routes broader retirement guides to the sponsor CTA', () => {
    expect(getGuideCTAType('/guides/survivor-benefits')).toBe('sponsor');
    expect(getGuideCTAType('/guides/federal-taxes')).toBe('sponsor');
  });

  it('only uses known CTA types', () => {
    for (const type of Object.values(GUIDE_CTA_TYPES)) {
      expect(['calculator', 'sponsor']).toContain(type);
    }
  });
});

describe('guide slugs', () => {
  it('reads the slug out of a guide pathname either way it is written', () => {
    expect(guideSlugFromPath('/guides/wep')).toBe('wep');
    expect(guideSlugFromPath('/guides/wep/')).toBe('wep');
  });

  it('has no slug for pathnames outside a guide', () => {
    expect(guideSlugFromPath('/guides/')).toBe('');
    expect(guideSlugFromPath('/calculator')).toBe('');
    expect(guideSlugFromPath('')).toBe('');
  });

  it('only strips a leading /guides/, not one appearing later', () => {
    expect(guideSlugFromPath('/other/guides/wep')).toBe('');
  });
});

describe('guide sponsor copy', () => {
  // DEFAULT_SPONSOR_COPY renders on the calculator's sponsor box and on any
  // guide without its own entry, so it is held to the same rules.
  const allCopy: [string, SponsorCopy][] = [
    ['the default pitch', DEFAULT_SPONSOR_COPY],
    ...Object.entries(GUIDE_SPONSOR_COPY),
  ];

  it('has a pitch for every guide it claims to cover', () => {
    // A floor, so an emptied map cannot make the it.each blocks vacuous.
    expect(allCopy.length).toBeGreaterThan(10);
  });

  it.each(allCopy)(
    'renders %s as one sentence built around the sponsor name',
    (_label, copy) => {
      // SponsorAd emits intro, the name, and outro as sibling nodes and
      // relies on HTML collapsing the newlines between them into single
      // spaces, so each fragment must carry no padding of its own.
      expect(copy.intro).toBe(copy.intro.trim());
      expect(copy.outro).toBe(copy.outro.trim());
      // The name has to read as part of the clause: "...specialist at
      // Social Security Advisors to talk it through."
      expect(copy.intro.endsWith(' at')).toBe(true);
      expect(copy.outro).toMatch(/^[a-z]/);
      expect(copy.outro.endsWith('.')).toBe(true);
    }
  );

  it.each(allCopy)('names the sponsor exactly once in %s', (_label, copy) => {
    // SponsorAd supplies the name itself; a fragment repeating it would
    // render "Social Security Advisors Social Security Advisors".
    for (const fragment of [copy.intro, copy.outro, ...copy.bullets]) {
      expect(fragment).not.toContain(SPONSOR.name);
    }
  });

  it.each(allCopy)('supports %s with well-formed bullets', (_label, copy) => {
    expect(copy.bullets.length).toBeGreaterThan(0);
    for (const bullet of copy.bullets) {
      expect(bullet).toBe(bullet.trim());
      expect(bullet.endsWith('.')).toBe(true);
    }
  });

  it.each(Object.entries(GUIDE_SPONSOR_COPY))(
    'writes %s a pitch of its own rather than a copy of the default',
    (_slug, copy) => {
      expect(copy).not.toEqual(DEFAULT_SPONSOR_COPY);
    }
  );

  it('falls back to the default pitch for an unlisted guide', () => {
    expect(getGuideSponsorCopy('__not-a-guide__')).toBe(DEFAULT_SPONSOR_COPY);
  });
});
