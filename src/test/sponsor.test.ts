import { describe, expect, it } from 'vitest';
import { DEFAULT_SPONSOR_COPY, SPONSOR } from '$lib/sponsor';
import {
  CHAT_TRIAL_GUIDES,
  GUIDE_CTA_TYPES,
  getGuideCTAType,
  guideOffersChat,
} from '../routes/guides/guide-cta-config';
import { guideSlugFromPath } from '../routes/guides/guide-slug';

describe('SPONSOR config', () => {
  it('links to an https URL with a non-empty name', () => {
    expect(SPONSOR.name.length).toBeGreaterThan(0);
    expect(new URL(SPONSOR.url).protocol).toBe('https:');
  });

  it('reports analytics under its own destination', () => {
    expect(SPONSOR.destination).toBe('socialsecurityadvisors');
  });

  it('offers chat through a hosted https page, never an embedded script', () => {
    const chat = new URL(SPONSOR.chatUrl ?? '');
    expect(chat.protocol).toBe('https:');
    expect(chat.pathname.endsWith('.js')).toBe(false);
  });
});

describe('DEFAULT_SPONSOR_COPY', () => {
  // Guides write their own pitch, but this one still renders on the
  // calculator's sponsor box, so it is held to the same rules. The guide
  // pitches are checked in invariants/guide-sponsor-copy-sync.test.ts.
  it('reads as one sentence built around the sponsor name', () => {
    expect(DEFAULT_SPONSOR_COPY.intro).toBe(DEFAULT_SPONSOR_COPY.intro.trim());
    expect(DEFAULT_SPONSOR_COPY.outro).toBe(DEFAULT_SPONSOR_COPY.outro.trim());
    expect(DEFAULT_SPONSOR_COPY.intro.endsWith(' at')).toBe(true);
    expect(DEFAULT_SPONSOR_COPY.outro).toMatch(/^[a-z]/);
    expect(DEFAULT_SPONSOR_COPY.outro.endsWith('.')).toBe(true);
  });

  it('has bullets that never repeat the sponsor name', () => {
    expect(DEFAULT_SPONSOR_COPY.bullets.length).toBeGreaterThan(0);
    for (const bullet of DEFAULT_SPONSOR_COPY.bullets) {
      expect(bullet).toBe(bullet.trim());
      expect(bullet.endsWith('.')).toBe(true);
      expect(bullet).not.toContain(SPONSOR.name);
    }
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

describe('sponsor chat trial', () => {
  it('offers chat on the trial guides, with or without a trailing slash', () => {
    expect(guideOffersChat('/guides/divorced-spouse')).toBe(true);
    expect(guideOffersChat('/guides/spousal-benefits/')).toBe(true);
  });

  it('does not offer chat on other guides or outside guides', () => {
    expect(guideOffersChat('/guides/survivor-benefits')).toBe(false);
    expect(guideOffersChat('/guides/pia')).toBe(false);
    expect(guideOffersChat('/calculator')).toBe(false);
    expect(guideOffersChat('/strategy')).toBe(false);
    expect(guideOffersChat('')).toBe(false);
  });

  it('only runs on guides that already carry the sponsor card', () => {
    for (const slug of CHAT_TRIAL_GUIDES) {
      expect(GUIDE_CTA_TYPES[slug]).toBe('sponsor');
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
