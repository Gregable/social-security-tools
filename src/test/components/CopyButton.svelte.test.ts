import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CopyButton from '$lib/components/integrations/CopyButton.svelte';

describe('CopyButton', () => {
  const cleanups: Array<() => void> = [];
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

  function render(props: { value: string; label: string }): HTMLElement {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(CopyButton, { target, props });
    flushSync();
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    return target;
  }

  /** Lets the awaited clipboard write settle and the component update. */
  async function settle() {
    await vi.advanceTimersByTimeAsync(0);
    flushSync();
  }

  function button(target: HTMLElement): HTMLButtonElement {
    const el = target.querySelector('button');
    if (!el) throw new Error('no button');
    return el;
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('copies the value, says "Copied", then clears', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    const target = render({ value: '3000', label: 'Copy amount' });

    expect(button(target).getAttribute('aria-label')).toBe('Copy amount');
    button(target).click();
    await settle();

    expect(writeText).toHaveBeenCalledWith('3000');
    expect(button(target).textContent).toContain('Copied');
    expect(target.querySelector('[aria-live]')?.textContent).toBe('Copied');

    await vi.advanceTimersByTimeAsync(1500);
    flushSync();
    expect(button(target).textContent).not.toContain('Copied');
  });

  it('says "Not copied" when the browser refuses', async () => {
    stubClipboard({
      writeText: vi.fn().mockRejectedValue(new Error('denied')),
    });
    const target = render({ value: '3000', label: 'Copy amount' });

    button(target).click();
    await settle();

    expect(button(target).textContent).toContain('Not copied');
    expect(target.querySelector('[aria-live]')?.textContent).toBe('Not copied');
  });

  it('clears "Copied" when the value changes', async () => {
    stubClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    const props = $state({ value: '3000', label: 'Copy amount' });
    const target = render(props);

    button(target).click();
    await settle();
    expect(button(target).textContent).toContain('Copied');

    props.value = '1000';
    flushSync();
    expect(button(target).textContent).not.toContain('Copied');
  });

  it('is hidden where the Clipboard API is unavailable', () => {
    stubClipboard(undefined);
    const target = render({ value: '3000', label: 'Copy amount' });
    expect(target.querySelector('button')).toBeNull();
  });
});
