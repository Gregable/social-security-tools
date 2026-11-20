import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildStrategyHash } from '$lib/url-params';
import StrategyPage from '../../routes/strategy/+page.svelte';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
// The picker and the form slide in and out. A slide with no duration takes
// Svelte's synchronous path, so an element that is leaving is gone by the
// next assertion and nothing is still animating when the page unmounts.
vi.mock('svelte/transition', async (importOriginal) => ({
  ...(await importOriginal<typeof import('svelte/transition')>()),
  slide: () => ({ duration: 0 }),
}));

/**
 * The intro under the mode picker explains the tool to someone who has not
 * used it yet. It goes away once the page moves past the picker and does
 * not come back until the page is reloaded, even when Start over returns to
 * the picker.
 */
describe('/strategy intro visibility', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
    window.location.hash = '';
    vi.restoreAllMocks();
  });

  function mountPage(): HTMLElement {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(StrategyPage, { target });
    cleanup = () => {
      unmount(component);
      target.remove();
    };
    flushSync();
    return target;
  }

  function clickButton(scope: Element, label: string): void {
    const button = [...scope.querySelectorAll('button')].find((candidate) =>
      candidate.textContent?.includes(label)
    );
    if (!button) throw new Error(`no button labelled "${label}"`);
    button.click();
    flushSync();
  }

  function intro(page: HTMLElement): Element | null {
    return page.querySelector('section.intro');
  }

  function picker(page: HTMLElement): Element | null {
    return page.querySelector('.mode-picker');
  }

  function formHeading(page: HTMLElement): string | undefined {
    return page.querySelector('.form-title-block h2')?.textContent?.trim();
  }

  function required(element: Element | null, name: string): Element {
    if (!element) throw new Error(`the page has no ${name}`);
    return element;
  }

  it('shows the intro under the picker on arrival', () => {
    const page = mountPage();
    expect(picker(page)).not.toBeNull();
    expect(intro(page)).not.toBeNull();
  });

  it('hides the intro once a mode is picked', () => {
    const page = mountPage();
    clickButton(required(picker(page), 'picker'), 'Just me');
    expect(picker(page)).toBeNull();
    expect(formHeading(page)).toBe('Tell us about you');
    expect(intro(page)).toBeNull();
  });

  it('keeps the intro hidden when Start over brings the picker back', () => {
    const page = mountPage();
    clickButton(required(picker(page), 'picker'), 'Just me');
    clickButton(page, 'Start over');
    expect(picker(page)).not.toBeNull();
    expect(intro(page)).toBeNull();
  });

  it('never shows the intro to a link that opens on the form', () => {
    window.location.hash = buildStrategyHash({
      isSingle: true,
      pia1: 2000,
      dob1: '1960-03-15',
    });
    const page = mountPage();
    expect(picker(page)).toBeNull();
    expect(formHeading(page)).toBe('Tell us about you');
    expect(intro(page)).toBeNull();

    clickButton(page, 'Start over');
    expect(picker(page)).not.toBeNull();
    expect(intro(page)).toBeNull();
  });

  it('keeps the intro when a link cannot be restored', () => {
    window.location.hash = buildStrategyHash({
      isSingle: true,
      pia1: 2000,
      dob1: 'not-a-date',
    });
    const page = mountPage();
    expect(picker(page)).not.toBeNull();
    expect(intro(page)).not.toBeNull();
  });

  describe('the choices at the end of the intro', () => {
    it('open the chosen form from the top of the page', () => {
      const scrollTo = vi
        .spyOn(window, 'scrollTo')
        .mockImplementation(() => {});
      const page = mountPage();
      clickButton(required(intro(page), 'intro'), 'Married couple');
      expect(formHeading(page)).toBe('Tell us about you and your spouse');
      expect(intro(page)).toBeNull();
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    });

    it('are the only choices that scroll', () => {
      const scrollTo = vi
        .spyOn(window, 'scrollTo')
        .mockImplementation(() => {});
      const page = mountPage();
      clickButton(required(picker(page), 'picker'), 'Widowed');
      expect(formHeading(page)).toBe('Tell us about you and your late spouse');
      expect(scrollTo).not.toHaveBeenCalled();
    });
  });
});
