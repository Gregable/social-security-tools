import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PastePrompt from '$lib/components/PastePrompt.svelte';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

/**
 * The paste box's error message. A paste of the my Social Security home page
 * gets directions to the earnings record instead of the generic error.
 */
describe('PastePrompt error message', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  function renderAndPaste(contents: string): HTMLElement {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(PastePrompt, { target, props: {} });
    cleanup = () => {
      unmount(component);
      target.remove();
    };
    const textarea = target.querySelector('textarea');
    if (!textarea) throw new Error('PastePrompt has no textarea');
    textarea.value = contents;
    textarea.dispatchEvent(new Event('input'));
    flushSync();
    return target;
  }

  function errorText(target: HTMLElement): string {
    return target.querySelector('.pasteError')?.textContent ?? '';
  }

  it('directs a home page paste to the earnings record', () => {
    const target = renderAndPaste(
      'my Social Security\nEligibility and Earnings\n' +
        'Review your full earnings record now\n'
    );
    expect(errorText(target)).toContain('home page');
    const link = target.querySelector<HTMLAnchorElement>('.pasteError a');
    expect(link?.href).toBe(
      'https://secure.ssa.gov/ec2/eligibility-earnings-ui/earnings-record'
    );
  });

  it('keeps the generic message for other unparseable pastes', () => {
    const target = renderAndPaste('not an earnings record');
    expect(errorText(target)).toContain('could not be parsed');
    expect(errorText(target)).not.toContain('home page');
  });

  it('shows no error before anything is pasted', () => {
    const target = renderAndPaste('');
    expect(target.querySelector('.pasteError')).toBeNull();
  });
});
