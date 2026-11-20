import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { GUIDE_SLUGS } from '$lib/guide-dates';
import { STRATEGY_MODE_LABELS, STRATEGY_MODES } from '$lib/strategy/ui';
import StrategyIntro from '../../../../routes/strategy/components/StrategyIntro.svelte';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

// /strategy is prerendered, and before a mode is picked this intro is most
// of the page's text. Rendering on the server, as the build does, checks
// that search engines get it without running any JavaScript.
const { body } = render(StrategyIntro, { props: { onselect: () => {} } });

describe('/strategy server render', () => {
  it('places the intro after the mode picker', async () => {
    const { default: Page } = await import(
      '../../../../routes/strategy/+page.svelte'
    );
    const page = render(Page).body;
    const picker = page.indexOf('Who are we calculating for?');
    const intro = page.indexOf('How the optimizer works');
    expect(picker).toBeGreaterThan(-1);
    expect(intro).toBeGreaterThan(picker);
  });
});

describe('StrategyIntro', () => {
  it('renders its explanation in the server HTML', () => {
    for (const title of [
      'How the optimizer works',
      'Results',
      'A recommended filing month',
      'A filing month for each spouse',
      'A start month for each benefit',
      'Method',
      'Averaged over possible ages of death',
      'Health and discount rate',
      'Before you start',
      'Related guides',
    ]) {
      expect(body, title).toContain(title);
    }
  });

  it('names each choice from the picker beside the answer it gets', () => {
    for (const mode of STRATEGY_MODES) {
      const { title } = STRATEGY_MODE_LABELS[mode];
      expect(body, title).toContain(title);
    }
  });

  it('marks every picture as an example', () => {
    const images = body.match(/<img\b[^>]*>/g) ?? [];
    const tags = body.match(/class="example-tag[^"]*"/g) ?? [];
    expect(images.length).toBeGreaterThan(0);
    expect(tags.length).toBe(images.length);
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
