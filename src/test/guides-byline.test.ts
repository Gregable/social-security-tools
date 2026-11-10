import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every guide must credit the author visibly, through the shared byline
 * component, so the on-page author matches the Person in its structured data.
 * A guide that reintroduces the old bare "Published:" paragraph would silently
 * lose that signal, so this guards the whole directory.
 */

const guidesDir = join(process.cwd(), 'src', 'routes', 'guides');

function guidePages(): string[] {
  return readdirSync(guidesDir)
    .filter((name) => statSync(join(guidesDir, name)).isDirectory())
    .map((name) => join(guidesDir, name, '+page.svelte'))
    .filter((path) => {
      try {
        return statSync(path).isFile();
      } catch {
        return false;
      }
    });
}

describe('guide bylines', () => {
  const pages = guidePages();

  it('finds the guide pages', () => {
    expect(pages.length).toBeGreaterThan(40);
  });

  for (const page of pages) {
    const relative = page.slice(guidesDir.length + 1);
    it(`${relative} renders GuideByline and no bare postdate`, () => {
      const source = readFileSync(page, 'utf8');
      expect(source).toContain('<GuideByline ');
      expect(source).not.toContain('class="postdate"');
    });
  }
});
