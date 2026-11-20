import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import StrategyIntro from '../../../../routes/strategy/components/StrategyIntro.svelte';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

// /strategy is prerendered, and before a mode is picked this intro is most
// of the page's text. Rendering on the server, as the build does, checks
// that search engines get it without running any JavaScript. What the
// markup contains (headings in order, pictures, links) is checked on the
// mounted component, in src/test/components/StrategyIntro.svelte.test.ts.
describe('/strategy server render', () => {
  it('places the intro after the mode picker', async () => {
    const { default: Page } = await import(
      '../../../../routes/strategy/+page.svelte'
    );
    const page = render(Page).body;
    // The picker's hint. Its heading is no use as a marker: the intro ends
    // by asking the same question.
    const picker = page.indexOf('Pick one to continue.');
    const intro = page.indexOf('How the optimizer works');
    expect(picker).toBeGreaterThan(-1);
    expect(intro).toBeGreaterThan(picker);
  });

  it('includes the text of the intro', () => {
    const { body } = render(StrategyIntro, { props: { onselect: () => {} } });
    for (const text of [
      'How the optimizer works',
      'A recommended filing month',
      'A filing month for each spouse',
      'A start month for each benefit',
      'Averaged over possible ages of death',
      'Health and discount rate',
      'Before you start',
    ]) {
      expect(body, text).toContain(text);
    }
  });
});
