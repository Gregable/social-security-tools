import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Slider from '$lib/components/Slider.svelte';

describe('Slider drawAttention', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
    vi.unstubAllGlobals();
  });

  // The slider also asks about print media and listens for changes to it, so
  // the stand-in has to accept listeners.
  function stubReducedMotion(reduced: boolean) {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: reduced && query.includes('prefers-reduced-motion'),
      addEventListener() {},
      removeEventListener() {},
    }));
  }

  function mountSlider() {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const slider = mount(Slider, {
      target,
      props: { value: 5, floor: 0, ceiling: 10 },
    });
    cleanup = () => {
      unmount(slider);
      target.remove();
    };
    flushSync();
    const handle = target.querySelector('.handle');
    if (handle === null) throw new Error('The slider has no handle');
    return { slider, handle };
  }

  it('does not pulse until asked to', () => {
    stubReducedMotion(false);
    const { handle } = mountSlider();
    expect(handle.classList.contains('attention')).toBe(false);
  });

  it('pulses the handle, and stops when the animation ends', () => {
    stubReducedMotion(false);
    const { slider, handle } = mountSlider();

    slider.drawAttention();
    flushSync();
    expect(handle.classList.contains('attention')).toBe(true);

    handle.dispatchEvent(new Event('animationend'));
    flushSync();
    expect(handle.classList.contains('attention')).toBe(false);
  });

  it('can pulse again after a pulse has ended', () => {
    stubReducedMotion(false);
    const { slider, handle } = mountSlider();

    slider.drawAttention();
    flushSync();
    handle.dispatchEvent(new Event('animationend'));
    flushSync();
    slider.drawAttention();
    flushSync();
    expect(handle.classList.contains('attention')).toBe(true);
  });

  it('does not pulse for a reader who has asked for reduced motion', () => {
    stubReducedMotion(true);
    const { slider, handle } = mountSlider();

    slider.drawAttention();
    flushSync();
    expect(handle.classList.contains('attention')).toBe(false);
  });
});
