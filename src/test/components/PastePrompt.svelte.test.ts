import posthog from 'posthog-js';
import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PastePrompt from '$lib/components/PastePrompt.svelte';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

const HOME_PAGE_PASTE =
  'my Social Security\nEligibility and Earnings\n' +
  'Review your full earnings record now\n';

/**
 * The paste box's error message, which takes the box's place until the user
 * resets it. A paste of the my Social Security home page gets directions to
 * the earnings record instead of the generic error.
 */
describe('PastePrompt error message', () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    vi.mocked(posthog.capture).mockClear();
  });

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  interface Rendered {
    readonly target: HTMLElement;
    /** Replaces the paste box's contents, as a paste or edit would. */
    readonly setText: (contents: string) => void;
    /** Clicks the error's reset button. */
    readonly reset: () => void;
  }

  function render(props: { name?: string } = {}): Rendered {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(PastePrompt, { target, props });
    cleanup = () => {
      unmount(component);
      target.remove();
    };
    // The box is replaced while an error shows, so look it up each time.
    const setText = (contents: string) => {
      const textarea = target.querySelector('textarea');
      if (!textarea) throw new Error('No paste box to type into');
      textarea.value = contents;
      textarea.dispatchEvent(new Event('input'));
      flushSync();
    };
    const reset = () => {
      const button = target.querySelector<HTMLButtonElement>('.resetButton');
      if (!button) throw new Error('No reset button in the error');
      button.click();
      flushSync();
    };
    return { target, setText, reset };
  }

  function errorText(target: HTMLElement): string {
    return target.querySelector('.pasteError')?.textContent ?? '';
  }

  it('directs a home page paste to the earnings record', () => {
    const { target, setText } = render();
    setText(HOME_PAGE_PASTE);
    expect(errorText(target)).toContain('home page');
    expect(errorText(target)).toContain('your earnings record');
    const link = target.querySelector<HTMLAnchorElement>('.pasteError a');
    expect(link?.href).toBe(
      'https://secure.ssa.gov/ec2/eligibility-earnings-ui/earnings-record'
    );
  });

  it("names the person whose record it is, for a spouse's entry", () => {
    const { target, setText } = render({ name: 'Pat' });
    setText(HOME_PAGE_PASTE);
    expect(errorText(target)).toContain("Pat's earnings record");
  });

  it('announces the error to screen readers', () => {
    const { target, setText } = render();
    setText(HOME_PAGE_PASTE);
    expect(target.querySelector('.pasteError')?.getAttribute('role')).toBe(
      'alert'
    );
  });

  it('keeps the generic message for other unparseable pastes', () => {
    const { target, setText } = render();
    setText('not an earnings record');
    expect(errorText(target)).toContain("couldn't read an earnings record");
    expect(errorText(target)).not.toContain('home page');
  });

  it('shows the error in place of the paste box', () => {
    const { target, setText } = render();
    setText('not an earnings record');
    expect(target.querySelector('textarea')).toBeNull();
    expect(target.querySelector('.pasteArea .pasteError')).not.toBeNull();
  });

  it('moves focus to the reset button, since the focused box is gone', async () => {
    const { target, setText } = render();
    setText('not an earnings record');
    await tick();
    expect(document.activeElement).toBe(target.querySelector('.resetButton'));
  });

  it('brings back an empty, focused paste box on reset', async () => {
    const { target, setText, reset } = render();
    setText(HOME_PAGE_PASTE);
    reset();
    await tick();
    const textarea = target.querySelector('textarea');
    expect(textarea?.value).toBe('');
    expect(document.activeElement).toBe(textarea);
    expect(target.querySelector('.pasteError')).toBeNull();
  });

  it('shows the generic message for a new failure after a home page reset', () => {
    const { target, setText, reset } = render();
    setText(HOME_PAGE_PASTE);
    reset();
    setText('not an earnings record');
    expect(errorText(target)).toContain("couldn't read an earnings record");
    expect(errorText(target)).not.toContain('home page');
  });

  it('reports the home page as wrong_page in Parse Failed', () => {
    const { setText } = render();
    setText(HOME_PAGE_PASTE);
    expect(posthog.capture).toHaveBeenCalledWith(
      'Paste Flow: Parse Failed',
      expect.objectContaining({
        wrong_page: 'my_ssa_home',
        is_spouse_entry: false,
      })
    );
  });

  it('reports no wrong_page for an unrecognized failure', () => {
    const { setText } = render();
    setText('not an earnings record');
    expect(posthog.capture).toHaveBeenCalledWith(
      'Paste Flow: Parse Failed',
      expect.objectContaining({ wrong_page: null })
    );
  });

  it('reports a reset with the wrong page it dismissed', () => {
    const { setText, reset } = render();
    setText(HOME_PAGE_PASTE);
    reset();
    expect(posthog.capture).toHaveBeenCalledWith('Paste Flow: Paste Reset', {
      wrong_page: 'my_ssa_home',
      is_spouse_entry: false,
    });
  });

  it('reports a reset of the generic error with no wrong page', () => {
    const { setText, reset } = render();
    setText('not an earnings record');
    reset();
    expect(posthog.capture).toHaveBeenCalledWith('Paste Flow: Paste Reset', {
      wrong_page: null,
      is_spouse_entry: false,
    });
  });

  it('tracks clicks on the earnings record link as its own link', () => {
    const { target, setText } = render();
    setText(HOME_PAGE_PASTE);
    const link = target.querySelector('.pasteError a');
    if (!link) throw new Error('No earnings record link in the error');
    // Cancelable, so the default action can be prevented instead of navigating.
    link.addEventListener('click', (event) => event.preventDefault());
    link.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    );
    expect(posthog.capture).toHaveBeenCalledWith('Paste Flow: Link Clicked', {
      link: 'wrong_page_earnings_record',
      is_spouse_entry: false,
    });
  });
});
