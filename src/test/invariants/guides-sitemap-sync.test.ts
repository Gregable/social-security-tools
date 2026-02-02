/**
 * Ensures every guide page has a corresponding entry in the sitemap and the
 * guides index page. Prevents new guides from being silently omitted.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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

function getSitemapPaths(): string[] {
  const sitemapSource = readFileSync(
    resolve(__dirname, '../../routes/sitemap.xml/+server.ts'),
    'utf-8'
  );
  const matches = [...sitemapSource.matchAll(/path:\s*['"]([^'"]+)['"]/g)];
  return matches.map((m) => m[1]);
}

function getIndexPageLinks(): string[] {
  const indexSource = readFileSync(resolve(guidesDir, '+page.svelte'), 'utf-8');
  const matches = [...indexSource.matchAll(/href="\/guides\/([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

describe('Guides sitemap and index synchronization', () => {
  const guides = getGuideDirectories();
  const sitemapPaths = getSitemapPaths();
  const indexLinks = getIndexPageLinks();

  it('every guide directory has a sitemap entry', () => {
    const missing = guides.filter(
      (g) => !sitemapPaths.includes(`/guides/${g}`)
    );
    expect(
      missing,
      `Guides missing from sitemap.xml: ${missing.join(', ')}`
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
