import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every guide must credit the author visibly, through the shared byline
 * component, so the on-page author matches the Person in its structured data.
 * A guide that reintroduces the old bare "Published:" paragraph would silently
 * lose that signal, so this guards the whole directory.
 *
 * The same applies to dates: a guide that sets dateModified in its schema
 * must show the update date in its byline, and vice versa, or the visible
 * page and the structured data disagree.
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

function bylineTag(source: string): string {
  const start = source.indexOf('<GuideByline ');
  if (start < 0) return '';
  const end = source.indexOf('/>', start);
  return source.slice(start, end);
}

describe('guide bylines', () => {
  const pages = guidePages();

  it('finds the guide pages', () => {
    // A floor against an empty directory walk passing vacuously; 45 guides
    // at the time of writing.
    expect(pages.length).toBeGreaterThan(40);
  });

  for (const page of pages) {
    const relative = page.slice(guidesDir.length + 1);
    const source = readFileSync(page, 'utf8');

    it(`${relative} renders GuideByline and no bare postdate`, () => {
      expect(source).toContain('<GuideByline ');
      expect(source).not.toContain('class="postdate"');
    });

    it(`${relative} shows an update date exactly when its schema has one`, () => {
      const schemaHasModified = source.includes('schema.dateModified =');
      const bylineHasUpdate = bylineTag(source).includes('updateDate');
      expect(bylineHasUpdate).toBe(schemaHasModified);
    });
  }
});
