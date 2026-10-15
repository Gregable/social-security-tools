import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

// A plain object, not reactive state: set it before mounting, since changes
// after mount do not re-render the page.
const pageState = vi.hoisted(() => ({
  status: 404,
  error: { message: 'Not Found' } as { message: string } | null,
}));

vi.mock('$app/state', () => ({ page: pageState }));

const { default: ErrorPage } = await import('../../routes/+error.svelte');

describe('+error.svelte', () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  function render(status: number, message: string): HTMLElement {
    pageState.status = status;
    pageState.error = { message };
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(ErrorPage, { target });
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    flushSync();
    return target;
  }

  function linkTargets(target: HTMLElement): string[] {
    return Array.from(
      target.querySelectorAll('main a'),
      (a) => a.getAttribute('href') ?? ''
    );
  }

  it('tells the visitor a missing page was not found', () => {
    const target = render(404, 'Not Found');
    expect(target.querySelector('h1')?.textContent).toBe('Page not found');
  });

  it('links a lost visitor back to the main tools', () => {
    const target = render(404, 'Not Found');
    expect(linkTargets(target)).toEqual([
      '/',
      '/calculator',
      '/strategy',
      '/guides',
    ]);
  });

  it('reports other errors without calling them missing pages', () => {
    const target = render(500, 'Internal Error');
    expect(target.querySelector('h1')?.textContent).toBe(
      'Something went wrong'
    );
    expect(target.textContent).toContain('500');
    expect(target.textContent).toContain('Internal Error');
  });

  function robotsMeta(): string | null | undefined {
    return document.head
      .querySelector('meta[name="robots"]')
      ?.getAttribute('content');
  }

  it('keeps missing pages out of search results', () => {
    render(404, 'Not Found');
    expect(robotsMeta()).toBe('noindex');
  });

  it('does not deindex a real page over a passing error', () => {
    render(500, 'Internal Error');
    expect(robotsMeta()).toBeUndefined();
  });
});
