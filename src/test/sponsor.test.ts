import { describe, expect, it } from 'vitest';
import { DEFAULT_SPONSOR_COPY, SPONSOR } from '$lib/sponsor';
import {
  GUIDE_CTA_TYPES,
  getGuideCTAType,
} from '../routes/guides/guide-cta-config';
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

describe('DEFAULT_SPONSOR_COPY', () => {
  it('has a two-part pitch sentence and at least one bullet', () => {
    expect(DEFAULT_SPONSOR_COPY.intro.length).toBeGreaterThan(0);
    expect(DEFAULT_SPONSOR_COPY.outro.length).toBeGreaterThan(0);
    expect(DEFAULT_SPONSOR_COPY.bullets.length).toBeGreaterThan(0);
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

describe('guide sponsor copy', () => {
  const sponsorSlugs = Object.entries(GUIDE_CTA_TYPES)
    .filter(([, type]) => type === 'sponsor')
    .map(([slug]) => slug);

  it.each(sponsorSlugs)(
    'gives %s a pitch tied to the guide rather than the generic one',
    (slug) => {
      expect(getGuideSponsorCopy(slug)).not.toBe(DEFAULT_SPONSOR_COPY);
    }
  );

  it('only writes copy for guides that show the sponsor CTA', () => {
    for (const slug of Object.keys(GUIDE_SPONSOR_COPY)) {
      expect(GUIDE_CTA_TYPES[slug]).toBe('sponsor');
    }
  });

  it.each(Object.entries(GUIDE_SPONSOR_COPY))(
    'renders %s as one complete sentence around the sponsor name',
    (_slug, copy) => {
      // SponsorAd joins intro + name + outro with single spaces, so neither
      // fragment may carry its own padding, and the sentence must end.
      expect(copy.intro).toBe(copy.intro.trim());
      expect(copy.outro).toBe(copy.outro.trim());
      expect(copy.outro.endsWith('.')).toBe(true);
      // The name reads as an object of the intro clause, e.g. "... at".
      expect(copy.intro.endsWith('at')).toBe(true);
    }
  );

  it.each(Object.entries(GUIDE_SPONSOR_COPY))(
    'supports %s with bullets that are hidden on mobile',
    (_slug, copy) => {
      expect(copy.bullets.length).toBeGreaterThanOrEqual(2);
      for (const bullet of copy.bullets) {
        expect(bullet).toBe(bullet.trim());
        expect(bullet.endsWith('.')).toBe(true);
      }
    }
  );

  it('falls back to the generic pitch for an unlisted guide', () => {
    expect(getGuideSponsorCopy('some-new-guide')).toBe(DEFAULT_SPONSOR_COPY);
  });
});
