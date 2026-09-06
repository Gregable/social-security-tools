import { describe, expect, it } from 'vitest';
import { SPONSOR } from '$lib/sponsor';
import {
  GUIDE_CTA_TYPES,
  getGuideCTAType,
} from '../routes/guides/guide-cta-config';

describe('SPONSOR config', () => {
  it('points at the Social Security Advisors consultation calendar', () => {
    expect(SPONSOR.name).toBe('Social Security Advisors');
    expect(SPONSOR.url.startsWith('https://app.acuityscheduling.com/')).toBe(
      true
    );
    expect(SPONSOR.url).toContain('appointmentTypeIds[]=97656215');
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
