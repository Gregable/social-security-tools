import posthog from 'posthog-js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PastePrompt from '$lib/components/PastePrompt.svelte';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

const HOME_PAGE_PASTE =
  'my Social Security\nEligibility and Earnings\n' +
  'Review your full earnings record now\n';

/**
 * The paste box's error message. A paste of the my Social Security home page
 * gets directions to the earnings record instead of the generic error.
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
  }

  function render(props: { name?: string } = {}): Rendered {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(PastePrompt, { target, props });
    cleanup = () => {
      unmount(component);
      target.remove();
    };
    const textarea = target.querySelector('textarea');
    if (!textarea) throw new Error('PastePrompt has no textarea');
    const setText = (contents: string) => {
      textarea.value = contents;
      textarea.dispatchEvent(new Event('input'));
      flushSync();
    };
    return { target, setText };
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
    expect(errorText(target)).toContain('could not be parsed');
    expect(errorText(target)).not.toContain('home page');
  });

  it('reverts to the generic message when edited to other garbage', () => {
    const { target, setText } = render();
    setText(HOME_PAGE_PASTE);
    setText('not an earnings record');
    expect(errorText(target)).toContain('could not be parsed');
    expect(errorText(target)).not.toContain('home page');
  });

  it('clears the error when the box is emptied', () => {
    const { target, setText } = render();
    setText(HOME_PAGE_PASTE);
    setText('');
    expect(target.querySelector('.pasteError')).toBeNull();
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
