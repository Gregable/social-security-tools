/**
 * Ensures every guide that actually renders the sponsor CTA has its own
 * pitch, and that the CTA config agrees with what the pages render.
 *
 * The pages are the source of truth: each one hard-codes
 * `<InlineCTA type="sponsor" />` in its markup, while GUIDE_CTA_TYPES is a
 * separate table. Testing the two config tables against each other would
 * miss the failure this guards, which is a new guide rendering the sponsor
 * CTA without a pitch and silently falling back to the generic one.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GUIDE_CTA_TYPES } from '../../routes/guides/guide-cta-config';
import { GUIDE_SPONSOR_COPY } from '../../routes/guides/sponsor-copy';

const guidesDir = resolve(__dirname, '../../routes/guides');

/**
 * Slugs whose page renders the sponsor CTA. Both attribute orderings are
 * checked because the type is the first attribute today but nothing
 * enforces that; a page written the other way must not slip through as
 * "no sponsor CTA here".
 */
function getSponsorCTASlugs(): string[] {
  return readdirSync(guidesDir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        existsSync(resolve(guidesDir, d.name, '+page.svelte'))
    )
    .map((d) => d.name)
    .filter((slug) => {
      const source = readFileSync(
        resolve(guidesDir, slug, '+page.svelte'),
        'utf-8'
      );
      return /<InlineCTA\b[^>]*\btype="sponsor"/.test(source);
    })
    .sort();
}

describe('guide sponsor copy synchronization', () => {
  const sponsorSlugs = getSponsorCTASlugs();

  it('finds the guides that render a sponsor CTA', () => {
    // A floor, so an empty scan cannot make every it.each below vacuous.
    expect(sponsorSlugs.length).toBeGreaterThan(10);
  });

  it.each(sponsorSlugs)('gives %s its own pitch', (slug) => {
    expect(Object.keys(GUIDE_SPONSOR_COPY)).toContain(slug);
  });

  it('writes no pitch for a guide that does not show the sponsor CTA', () => {
    expect(Object.keys(GUIDE_SPONSOR_COPY).sort()).toEqual(sponsorSlugs);
  });

  it('keeps the CTA type config agreeing with what the pages render', () => {
    const configured = Object.entries(GUIDE_CTA_TYPES)
      .filter(([, type]) => type === 'sponsor')
      .map(([slug]) => slug)
      .sort();
    expect(configured).toEqual(sponsorSlugs);
  });
});
