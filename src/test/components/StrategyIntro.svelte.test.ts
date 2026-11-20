import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { StrategyMode } from '$lib/strategy/ui';
import StrategyIntro from '../../routes/strategy/components/StrategyIntro.svelte';

describe('StrategyIntro', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  function mountIntro(): { intro: HTMLElement; selected: StrategyMode[] } {
    const selected: StrategyMode[] = [];
    const intro = document.createElement('div');
    document.body.appendChild(intro);
    const component = mount(StrategyIntro, {
      target: intro,
      props: { onselect: (mode: StrategyMode) => selected.push(mode) },
    });
    cleanup = () => {
      unmount(component);
      intro.remove();
    };
    flushSync();
    return { intro, selected };
  }

  function textOf(scope: HTMLElement, selector: string): string[] {
    return [...scope.querySelectorAll(selector)].map(
      (element) => element.textContent?.trim() ?? ''
    );
  }

  it('lays out the results, then the method, then what to do first', () => {
    const { intro } = mountIntro();
    expect(textOf(intro, 'h2, h3, h4')).toEqual([
      'How the optimizer works',
      'Results',
      'A recommended filing month',
      'A filing month for each spouse',
      'A start month for each benefit',
      'Method',
      'Averaged over possible ages of death',
      'Health and discount rate',
      'Before you start',
    ]);
  });

  it('heads each result with its choice from the picker, in the picker order', () => {
    const { intro } = mountIntro();
    expect(textOf(intro, '.topics--three .topic-name')).toEqual([
      'Just me',
      'Married couple',
      'Widowed',
    ]);
  });

  describe('pictures', () => {
    function pictures(intro: HTMLElement): HTMLImageElement[] {
      const images = [...intro.querySelectorAll('img')];
      expect(images.length).toBeGreaterThan(0);
      return images;
    }

    it('are each marked as an example', () => {
      const { intro } = mountIntro();
      for (const image of pictures(intro)) {
        const label = image.closest('article')?.querySelector('.topic-label');
        expect(label?.textContent, image.alt).toContain('Example');
      }
    });

    it('each have alt text', () => {
      const { intro } = mountIntro();
      for (const image of pictures(intro)) {
        expect(image.alt.length, image.alt).toBeGreaterThanOrEqual(20);
      }
    });
  });

  // The site header already links to the guides, so the intro carries no
  // list of them.
  it('links only to the calculator, for people who do not know their PIA', () => {
    const { intro } = mountIntro();
    const paths = [...intro.querySelectorAll('a')].map(
      (link) =>
        new URL(link.getAttribute('href') ?? '', 'https://ssa.tools').pathname
    );
    expect(paths).toEqual(['/calculator']);
  });

  // The intro is long, so it ends with the picker's choices again: a reader
  // who has scrolled to the bottom can start from there.
  describe('closing choices', () => {
    it('offer every mode, in the picker order', () => {
      const { intro } = mountIntro();
      expect(textOf(intro, 'button')).toEqual([
        'Just me',
        'Married couple',
        'Widowed',
      ]);
    });

    it('select the mode whose button is clicked', () => {
      const { intro, selected } = mountIntro();
      for (const button of intro.querySelectorAll('button')) {
        button.click();
      }
      flushSync();
      expect(selected).toEqual(['single', 'couple', 'widowed']);
    });
  });
});
