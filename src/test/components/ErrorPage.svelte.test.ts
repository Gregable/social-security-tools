import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

const pageState = vi.hoisted(() => ({
  status: 404,
  error: { message: 'Not Found' } as { message: string } | null,
}));

vi.mock('$app/state', () => ({ page: pageState }));

const { default: ErrorPage } = await import('../../routes/+error.svelte');

describe('+error.svelte', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  function render(status: number, message: string): HTMLElement {
    pageState.status = status;
    pageState.error = { message };
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(ErrorPage, { target });
    cleanup = () => {
      unmount(component);
      target.remove();
    };
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

  it('keeps error pages out of search results', () => {
    render(404, 'Not Found');
    const robots = document.head.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('noindex');
  });
});
