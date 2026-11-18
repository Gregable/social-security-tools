import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { SPONSOR } from '$lib/sponsor';

// Guides are prerendered at build time, so whatever the server render puts
// in a chat link is shared by every reader. A ref made there would be one
// code for everyone, and sheet rows could no longer be told apart. This
// file is in the unit project so Svelte uses its server runtime, as it does
// at prerender.

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

vi.mock('$app/stores', () => ({
  page: {
    subscribe(run: (value: { url: URL }) => void) {
      run({ url: new URL('https://ssa.tools/guides/spousal-benefits') });
      return () => {};
    },
  },
}));

const { default: InlineCTA } = await import(
  '../routes/guides/InlineCTA.svelte'
);
const { default: GuideFooter } = await import(
  '../routes/guides/guide-footer.svelte'
);

describe('prerendered chat links', () => {
  // A ref is attached only through the `params` query, so its absence from
  // the whole render means no chat link carries one.
  it('carry no ref on the inline card', () => {
    const { body } = render(InlineCTA, { props: { type: 'sponsor' } });
    expect(body).toContain(`href="${SPONSOR.chatUrl}"`);
    expect(body).not.toContain('params=');
  });

  it('carry no ref in the footer', () => {
    const { body } = render(GuideFooter);
    expect(body).toContain(`href="${SPONSOR.chatUrl}"`);
    expect(body).not.toContain('params=');
  });
});
