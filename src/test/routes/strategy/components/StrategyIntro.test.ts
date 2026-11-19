import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { GUIDE_SLUGS } from '$lib/guide-dates';
import StrategyIntro from '../../../../routes/strategy/components/StrategyIntro.svelte';

// /strategy is prerendered, and before a mode is picked this intro is most
// of the page's text. Rendering on the server, as the build does, checks
// that search engines get it without running any JavaScript.
const { body } = render(StrategyIntro);

describe('StrategyIntro', () => {
  it('renders its explanation in the server HTML', () => {
    for (const title of [
      'How the optimizer works',
      'A filing month, not just an age',
      'Planned for every possible life span',
      'Both filing ages, chosen together',
      'Adjust for your health',
      'When to take each benefit',
    ]) {
      expect(body, title).toContain(title);
    }
  });

  it('gives every screenshot alt text', () => {
    const images = body.match(/<img\b[^>]*>/g) ?? [];
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expect(img).toMatch(/\balt="[^"]{20,}"/);
    }
  });

  it('links only to guides that exist', () => {
    const slugs = [...body.matchAll(/href="\/guides\/([a-z0-9-]+)"/g)].map(
      (m) => m[1]
    );
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      expect(GUIDE_SLUGS, slug).toContain(slug);
    }
  });

  it('links to the calculator for people who do not know their PIA', () => {
    expect(body).toContain('href="/calculator"');
  });
});
