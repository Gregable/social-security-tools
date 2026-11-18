import posthog from 'posthog-js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPONSOR } from '$lib/sponsor';
import { isLinkTo, refOnChatLink } from './sponsor-links';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

// The guide path the mocked page store reports. Set it before mounting:
// the store emits once on subscribe and never again.
const pagePath = vi.hoisted(() => ({ value: '/guides/survivor-benefits' }));

vi.mock('$app/stores', () => ({
  page: {
    subscribe(run: (value: { url: URL }) => void) {
      run({ url: new URL(`https://ssa.tools${pagePath.value}`) });
      return () => {};
    },
  },
}));

// happy-dom's IntersectionObserver never calls back. This one reports
// every observed element as visible straight away, so mounting a card
// fires its impression.
class ImmediateIntersectionObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element): void {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver);

const { default: InlineCTA } = await import(
  '../../routes/guides/InlineCTA.svelte'
);

const CHAT_TRIAL_GUIDE = '/guides/spousal-benefits';
const OTHER_GUIDE = '/guides/survivor-benefits';

describe('sponsor card placement on guides', () => {
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    vi.mocked(posthog.capture).mockClear();
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  function render(path: string, props: Record<string, unknown>): HTMLElement {
    pagePath.value = path;
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(InlineCTA, {
      target,
      props: { type: 'sponsor', ...props },
    });
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    flushSync();
    return target;
  }

  function clickLinkTo(target: HTMLElement, href: string | undefined): void {
    const link = Array.from(target.querySelectorAll('a')).find((a) =>
      isLinkTo(a, href)
    );
    expect(link).toBeDefined();
    link?.click();
  }

  function placements(event: string): unknown[] {
    return vi
      .mocked(posthog.capture)
      .mock.calls.filter(([name]) => name === event)
      .map(([, props]) => (props as { placement?: string }).placement);
  }

  it('reports the first card as guide-inline when no placement is given', () => {
    const target = render(OTHER_GUIDE, {});
    expect(placements('Outbound: Visible')).toEqual(['guide-inline']);
    clickLinkTo(target, SPONSOR.url);
    expect(placements('Outbound: Clicked')).toEqual(['guide-inline']);
  });

  it('reports the card before the apply section under its own placement', () => {
    const target = render(OTHER_GUIDE, { placement: 'guide-inline-apply' });
    expect(placements('Outbound: Visible')).toEqual(['guide-inline-apply']);
    clickLinkTo(target, SPONSOR.url);
    expect(placements('Outbound: Clicked')).toEqual(['guide-inline-apply']);
    expect(vi.mocked(posthog.capture)).toHaveBeenCalledWith(
      'Outbound: Clicked',
      expect.objectContaining({
        destination: SPONSOR.destination,
        guide_slug: 'survivor-benefits',
      })
    );
  });

  it('keeps the apply card apart from the first card on a chat trial guide', () => {
    const target = render(CHAT_TRIAL_GUIDE, {
      placement: 'guide-inline-apply',
    });
    // The chat trial card is a different element from the plain one, so
    // its impression is worth checking separately.
    expect(placements('Outbound: Visible')).toEqual(['guide-inline-apply']);
    const chat = Array.from(target.querySelectorAll('a')).find((a) =>
      isLinkTo(a, SPONSOR.chatUrl)
    );
    const ref = chat ? refOnChatLink(chat) : null;
    expect(ref).not.toBeNull();
    clickLinkTo(target, SPONSOR.chatUrl);
    clickLinkTo(target, SPONSOR.url);
    expect(placements('Outbound: Clicked')).toEqual([
      'guide-inline-apply-chat',
      'guide-inline-apply',
    ]);
    const clicks = vi
      .mocked(posthog.capture)
      .mock.calls.filter(([name]) => name === 'Outbound: Clicked')
      .map(([, props]) => props);
    expect(clicks[0]).toEqual(expect.objectContaining({ ref }));
    expect(clicks[1]).not.toHaveProperty('ref');
  });
});
