import posthog from 'posthog-js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PastePrompt from '$lib/components/PastePrompt.svelte';
import type { Recipient } from '$lib/recipient';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

const EARNINGS_RECORD = '2018 $100,000\n2017 $90,000\n2016 $80,000';

type PasteDetail = { recipient: Recipient; source: string };

/**
 * The "Paste from clipboard" button above the paste box, and the source
 * PastePrompt reports for each way of entering data.
 */
describe('PastePrompt clipboard button', () => {
  let cleanup: (() => void) | null = null;
  const originalClipboard = Object.getOwnPropertyDescriptor(
    navigator,
    'clipboard'
  );

  function stubClipboard(clipboard: object | undefined) {
    Object.defineProperty(navigator, 'clipboard', {
      value: clipboard,
      configurable: true,
    });
  }

  beforeEach(() => {
    vi.mocked(posthog.capture).mockClear();
  });

  afterEach(() => {
    cleanup?.();
    cleanup = null;
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  interface Rendered {
    readonly target: HTMLElement;
    readonly onpaste: ReturnType<typeof vi.fn<(d: PasteDetail) => void>>;
    readonly button: () => HTMLButtonElement | null;
    /** Clicks the clipboard button and waits for the read to finish. */
    readonly clickPaste: () => Promise<void>;
  }

  function render(props: { isSpouse?: boolean } = {}): Rendered {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const onpaste = vi.fn<(d: PasteDetail) => void>();
    const component = mount(PastePrompt, {
      target,
      props: { ...props, onpaste },
    });
    flushSync();
    cleanup = () => {
      unmount(component);
      target.remove();
    };
    const button = () =>
      target.querySelector<HTMLButtonElement>('.clipboardButton');
    const clickPaste = async () => {
      const b = button();
      if (!b) throw new Error('No clipboard button');
      b.click();
      // Let the readText promise and the component's handler settle.
      await new Promise((resolve) => setTimeout(resolve, 0));
      flushSync();
    };
    return { target, onpaste, button, clickPaste };
  }

  function statusText(target: HTMLElement): string {
    return target.querySelector('.clipboardStatus')?.textContent?.trim() ?? '';
  }

  it('offers the button when the clipboard can be read', () => {
    stubClipboard({ readText: () => Promise.resolve('') });
    const { button } = render();
    expect(button()?.textContent).toContain('Paste from clipboard');
    expect(button()?.disabled).toBe(false);
  });

  it('leaves the button out when the clipboard cannot be read', () => {
    stubClipboard(undefined);
    const { target, button } = render();
    expect(button()).toBeNull();
    expect(target.textContent).not.toContain('or paste into the box below');
    expect(target.querySelector('textarea')).not.toBeNull();
  });

  it('enters a copied earnings record', async () => {
    stubClipboard({ readText: () => Promise.resolve(EARNINGS_RECORD) });
    const { onpaste, clickPaste } = render();
    await clickPaste();
    expect(onpaste).toHaveBeenCalledTimes(1);
    const detail = onpaste.mock.calls[0][0];
    expect(detail.source).toBe('clipboard_button');
    expect(detail.recipient.earningsRecords.length).toBe(3);
  });

  it('reports the read without its text', async () => {
    stubClipboard({ readText: () => Promise.resolve(EARNINGS_RECORD) });
    const { clickPaste } = render({ isSpouse: true });
    await clickPaste();
    expect(posthog.capture).toHaveBeenCalledWith('Paste Flow: Clipboard Read', {
      result: 'text',
      is_spouse_entry: true,
    });
  });

  it('shows the usual parse error for unreadable clipboard text', async () => {
    stubClipboard({
      readText: () => Promise.resolve('not an earnings record'),
    });
    const { target, onpaste, button, clickPaste } = render();
    await clickPaste();
    expect(onpaste).not.toHaveBeenCalled();
    expect(target.querySelector('.pasteError')?.textContent).toContain(
      "couldn't read an earnings record"
    );
    // One next step while the error shows.
    expect(button()).toBeNull();
    expect(posthog.capture).toHaveBeenCalledWith(
      'Paste Flow: Parse Failed',
      expect.objectContaining({ source: 'clipboard_button' })
    );
  });

  it('explains an empty clipboard', async () => {
    stubClipboard({ readText: () => Promise.resolve('  ') });
    const { target, onpaste, clickPaste } = render();
    await clickPaste();
    expect(onpaste).not.toHaveBeenCalled();
    expect(statusText(target)).toContain('Your clipboard is empty');
    expect(target.querySelector('.clipboardStatus')?.getAttribute('role')).toBe(
      'status'
    );
    expect(posthog.capture).toHaveBeenCalledWith('Paste Flow: Clipboard Read', {
      result: 'empty',
      is_spouse_entry: false,
    });
  });

  it('points to the paste box when reading is denied', async () => {
    stubClipboard({
      readText: () =>
        Promise.reject(new DOMException('Denied', 'NotAllowedError')),
    });
    const { target, clickPaste } = render();
    await clickPaste();
    expect(statusText(target)).toContain("couldn't read your clipboard");
    expect(target.querySelector('textarea')).not.toBeNull();
    expect(posthog.capture).toHaveBeenCalledWith('Paste Flow: Clipboard Read', {
      result: 'unavailable',
      error_name: 'NotAllowedError',
      is_spouse_entry: false,
    });
  });

  it('clears the message on the next click', async () => {
    const readText = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('')
      .mockReturnValueOnce(new Promise<string>(() => {}));
    stubClipboard({ readText });
    const { target, button, clickPaste } = render();
    await clickPaste();
    expect(statusText(target)).toContain('Your clipboard is empty');
    await clickPaste();
    expect(statusText(target)).toBe('');
    // Still waiting on the second read.
    expect(button()?.disabled).toBe(true);
  });

  it('reports a typed or pasted record as from the paste box', () => {
    stubClipboard(undefined);
    const { target, onpaste } = render();
    const textarea = target.querySelector('textarea');
    if (!textarea) throw new Error('No paste box');
    textarea.value = EARNINGS_RECORD;
    textarea.dispatchEvent(new Event('input'));
    flushSync();
    expect(onpaste.mock.calls[0][0].source).toBe('paste_box');
  });

  it('reports a skipped spouse entry as skip', () => {
    stubClipboard(undefined);
    const { target, onpaste } = render({ isSpouse: true });
    target.querySelector<HTMLButtonElement>('.skipButton')?.click();
    flushSync();
    expect(onpaste.mock.calls[0][0].source).toBe('skip');
  });
});
