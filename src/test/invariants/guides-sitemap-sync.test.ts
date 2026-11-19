/**
 * Ensures every guide page has dates in the guide registry (which is what
 * puts it in sitemap.xml) and a link on the guides index page. Prevents new
 * guides from being silently omitted.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GUIDE_DATES } from '$lib/guide-dates';

const guidesDir = resolve(__dirname, '../../routes/guides');

// Guides that exist but are intentionally not listed on the index page
// (e.g., linked only from other guides or the calculator).
const INDEX_EXCEPTIONS: string[] = [];

function getGuideDirectories(): string[] {
  return readdirSync(guidesDir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        existsSync(resolve(guidesDir, d.name, '+page.svelte'))
    )
    .map((d) => d.name);
}

function getIndexPageLinks(): string[] {
  const indexSource = readFileSync(resolve(guidesDir, '+page.svelte'), 'utf-8');
  const matches = [...indexSource.matchAll(/href="\/guides\/([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

describe('Guides registry, sitemap and index synchronization', () => {
  const guides = getGuideDirectories();
  const registered = Object.keys(GUIDE_DATES);
  const indexLinks = getIndexPageLinks();

  it('every guide directory has dates in the registry, and so a sitemap entry', () => {
    const missing = guides.filter((g) => !registered.includes(g));
    expect(
      missing,
      `Guides missing from GUIDE_DATES in src/lib/guide-dates.ts: ${missing.join(', ')}`
    ).toEqual([]);
  });

  it('every registry entry has a guide directory', () => {
    const orphaned = registered.filter((slug) => !guides.includes(slug));
    expect(
      orphaned,
      `GUIDE_DATES entries with no guide page: ${orphaned.join(', ')}`
    ).toEqual([]);
  });

  it('every guide reads its own dates from the registry', () => {
    // Catches a guide copied from another that still looks up the original
    // slug, which would show (and put in the sitemap) the wrong dates.
    const wrong = guides.filter((g) => {
      const source = readFileSync(
        resolve(guidesDir, g, '+page.svelte'),
        'utf-8'
      );
      return (
        !source.includes(`guideDates('${g}')`) &&
        !source.includes(`guideDates("${g}")`)
      );
    });
    expect(
      wrong,
      `Guides not calling guideDates with their own slug: ${wrong.join(', ')}`
    ).toEqual([]);
  });

  it('every guide shows both registry dates in its byline and schema', () => {
    // Bumping `updated` in the registry moves the sitemap lastmod, so the
    // page has to show it too, or the page and the sitemap disagree. The
    // byline hides an update date equal to the publish date.
    const required = [
      'schema.datePublished = publishDate.toISOString();',
      'schema.dateModified = updateDate.toISOString();',
      '<GuideByline {publishDate} {updateDate} />',
    ];
    const wrong = guides.filter((g) => {
      const source = readFileSync(
        resolve(guidesDir, g, '+page.svelte'),
        'utf-8'
      );
      return !required.every((line) => source.includes(line));
    });
    expect(
      wrong,
      `Guides not wiring both dates into schema and byline: ${wrong.join(', ')}`
    ).toEqual([]);
  });

  it('every guide directory is linked from the guides index', () => {
    const missing = guides.filter(
      (g) => !indexLinks.includes(g) && !INDEX_EXCEPTIONS.includes(g)
    );
    expect(
      missing,
      `Guides missing from guides index page: ${missing.join(', ')}`
    ).toEqual([]);
  });
});
