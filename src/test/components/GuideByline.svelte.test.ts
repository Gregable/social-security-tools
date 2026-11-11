import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { AUTHOR } from '$lib/author';
import GuideByline from '../../routes/guides/GuideByline.svelte';

let target: HTMLElement;
let instance: ReturnType<typeof mount> | undefined;

function render(props: { publishDate: Date; updateDate?: Date }): HTMLElement {
  target = document.createElement('div');
  document.body.appendChild(target);
  instance = mount(GuideByline, { target, props });
  flushSync();
  return target;
}

afterEach(() => {
  if (instance) unmount(instance);
  target?.remove();
});

// Guides construct dates at UTC midnight. The expected strings are literal
// so the test fails if the component ever formats in the local timezone,
// where these would show as the previous day across the US.
const published = new Date('2026-01-18T00:00:00+00:00');
const updated = new Date('2026-09-17T00:00:00+00:00');

describe('GuideByline', () => {
  it('names the author and links to the profile page', () => {
    const el = render({ publishDate: published });
    const link = el.querySelector('a[rel="author"]') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.textContent).toBe(AUTHOR.name);
    expect(link.getAttribute('href')).toBe(AUTHOR.path);
  });

  it('shows the publish date in UTC and omits Updated when there is none', () => {
    const el = render({ publishDate: published });
    expect(el.textContent).toContain('Published: 1/18/2026');
    expect(el.textContent).not.toContain('Updated');
  });

  it('shows the update date when provided', () => {
    const el = render({ publishDate: published, updateDate: updated });
    expect(el.textContent).toContain('Updated: 9/17/2026');
  });

  it('omits Updated when it merely repeats the publish date', () => {
    const el = render({ publishDate: published, updateDate: published });
    expect(el.textContent).not.toContain('Updated');
    expect(el.querySelectorAll('time')).toHaveLength(1);
  });

  it('marks dates up for machines with <time datetime>', () => {
    const el = render({ publishDate: published, updateDate: updated });
    const times = Array.from(el.querySelectorAll('time')).map((t) =>
      t.getAttribute('datetime')
    );
    expect(times).toEqual([published.toISOString(), updated.toISOString()]);
  });
});
