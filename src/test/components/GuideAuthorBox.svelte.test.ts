import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { AUTHOR, authorBio } from '$lib/author';
import GuideAuthorBox from '../../routes/guides/GuideAuthorBox.svelte';

let target: HTMLElement;
let instance: ReturnType<typeof mount> | undefined;

function render(): HTMLElement {
  target = document.createElement('div');
  document.body.appendChild(target);
  instance = mount(GuideAuthorBox, { target });
  flushSync();
  return target;
}

afterEach(() => {
  if (instance) unmount(instance);
  target?.remove();
});

function collapse(text: string | null): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

describe('GuideAuthorBox', () => {
  it('links the author name to the profile page', () => {
    const el = render();
    const link = el.querySelector('a[rel="author"]') as HTMLAnchorElement;
    expect(link.textContent).toBe(AUTHOR.name);
    expect(link.getAttribute('href')).toBe(AUTHOR.path);
  });

  it('reads as the full bio with the name appearing once', () => {
    const el = render();
    const bio = collapse(el.querySelector('p.bio')?.textContent ?? '');
    expect(bio).toBe(authorBio());
  });

  it('is labelled for assistive technology', () => {
    const el = render();
    expect(el.querySelector('aside')?.getAttribute('aria-label')).toBe(
      'About the author'
    );
  });
});
