import posthog from 'posthog-js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPONSOR } from '$lib/sponsor';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

// The guide path the mocked page store reports. Set it before mounting:
// the store emits once on subscribe and never again.
const pagePath = vi.hoisted(() => ({ value: '/guides/spousal-benefits' }));

vi.mock('$app/stores', () => ({
  page: {
    subscribe(run: (value: { url: URL }) => void) {
      run({ url: new URL(`https://ssa.tools${pagePath.value}`) });
      return () => {};
    },
  },
}));

// happy-dom has no IntersectionObserver; impressions are not under test.
class NoopIntersectionObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver);

const { default: InlineCTA } = await import(
  '../../routes/guides/InlineCTA.svelte'
);
const { default: GuideFooter } = await import(
  '../../routes/guides/guide-footer.svelte'
);

const TRIAL_GUIDE = '/guides/spousal-benefits';
const TRIAL_GUIDE_WITH_SLASH = '/guides/divorced-spouse/';
const OTHER_GUIDE = '/guides/survivor-benefits';

describe('sponsor chat trial on guides', () => {
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    vi.mocked(posthog.capture).mockClear();
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  function newTarget(path: string): HTMLElement {
    pagePath.value = path;
    const target = document.createElement('div');
    document.body.appendChild(target);
    return target;
  }

  function track(component: Record<string, unknown>, target: HTMLElement) {
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    flushSync();
  }

  function renderInline(path: string): HTMLElement {
    const target = newTarget(path);
    track(mount(InlineCTA, { target, props: { type: 'sponsor' } }), target);
    return target;
  }

  function renderFooter(path: string): HTMLElement {
    const target = newTarget(path);
    track(mount(GuideFooter, { target }), target);
    return target;
  }

  /** Sponsor links in render order, ignoring the footer's calculator link. */
  function sponsorLinks(target: HTMLElement): HTMLAnchorElement[] {
    return Array.from(target.querySelectorAll('a')).filter(
      (a) =>
        a.getAttribute('href') === SPONSOR.url ||
        a.getAttribute('href') === SPONSOR.chatUrl
    );
  }

  function clickLinkTo(target: HTMLElement, href: string | undefined): void {
    const link = sponsorLinks(target).find(
      (a) => a.getAttribute('href') === href
    );
    expect(link).toBeDefined();
    link?.click();
  }

  function outboundClickProps(): unknown[] {
    return vi
      .mocked(posthog.capture)
      .mock.calls.filter(([event]) => event === 'Outbound: Clicked')
      .map(([, props]) => props);
  }

  describe('inline sponsor card', () => {
    it('offers Schedule and Chat as separate links on a trial guide', () => {
      const links = sponsorLinks(renderInline(TRIAL_GUIDE));
      expect(links.map((a) => a.getAttribute('href'))).toEqual([
        SPONSOR.url,
        SPONSOR.chatUrl,
      ]);
      for (const link of links) {
        expect(link.target).toBe('_blank');
        expect(link.rel).toContain('noopener');
      }
    });

    it('reports a chat click under its own placement', () => {
      clickLinkTo(renderInline(TRIAL_GUIDE), SPONSOR.chatUrl);
      expect(outboundClickProps()).toEqual([
        expect.objectContaining({
          destination: SPONSOR.destination,
          placement: 'guide-inline-chat',
          guide_slug: 'spousal-benefits',
        }),
      ]);
    });

    it('still reports a schedule click as guide-inline, once', () => {
      clickLinkTo(renderInline(TRIAL_GUIDE), SPONSOR.url);
      expect(outboundClickProps()).toEqual([
        expect.objectContaining({
          placement: 'guide-inline',
          guide_slug: 'spousal-benefits',
        }),
      ]);
    });

    it('stays a single schedule link on guides outside the trial', () => {
      const target = renderInline(OTHER_GUIDE);
      const links = sponsorLinks(target);
      expect(links.map((a) => a.getAttribute('href'))).toEqual([SPONSOR.url]);
      expect(links[0].classList.contains('inline-cta')).toBe(true);
      expect(target.querySelector('.cta-pair')).toBeNull();
    });
  });

  describe('guide footer', () => {
    it('reports a chat click under its own placement', () => {
      clickLinkTo(renderFooter(TRIAL_GUIDE_WITH_SLASH), SPONSOR.chatUrl);
      expect(outboundClickProps()).toEqual([
        expect.objectContaining({
          destination: SPONSOR.destination,
          placement: 'guide-footer-chat',
          guide_slug: 'divorced-spouse',
        }),
      ]);
    });

    it('still reports a schedule click as guide-footer, once', () => {
      clickLinkTo(renderFooter(TRIAL_GUIDE_WITH_SLASH), SPONSOR.url);
      expect(outboundClickProps()).toEqual([
        expect.objectContaining({
          placement: 'guide-footer',
          guide_slug: 'divorced-spouse',
        }),
      ]);
    });

    it('stays a single schedule link on guides outside the trial', () => {
      const links = sponsorLinks(renderFooter(OTHER_GUIDE));
      expect(links.map((a) => a.getAttribute('href'))).toEqual([SPONSOR.url]);
    });
  });
});
