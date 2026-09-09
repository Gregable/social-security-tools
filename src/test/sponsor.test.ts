import { describe, expect, it } from 'vitest';
import { DEFAULT_SPONSOR_COPY, SPONSOR } from '$lib/sponsor';
import {
  GUIDE_CTA_TYPES,
  getGuideCTAType,
} from '../routes/guides/guide-cta-config';

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
