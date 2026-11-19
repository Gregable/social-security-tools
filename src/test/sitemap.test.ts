import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GUIDE_DATES, GUIDE_SLUGS } from '$lib/guide-dates';
import { renderSitemap, SITE_URL, sitemapEntries } from '$lib/sitemap';
import { GET } from '../routes/sitemap.xml/+server';

const entries = sitemapEntries();
const byPath = new Map(entries.map((e) => [e.path, e]));
const routesDir = join(process.cwd(), 'src', 'routes');

// The URL path of every +page.svelte under src/routes. The site has no
// dynamic ([param]) or grouped ((group)) routes; if one is added, this walk
// needs to learn how to map it, so fail loudly instead of guessing.
function pageRoutes(): string[] {
  return readdirSync(routesDir, { recursive: true, encoding: 'utf8' })
    .filter(
      (file) => file === '+page.svelte' || file.endsWith(`${sep}+page.svelte`)
    )
    .map((file) => {
      const dir = relative(routesDir, join(routesDir, file, '..'));
      if (/[[(]/.test(dir)) {
        throw new Error(`Map the dynamic or grouped route ${dir} in this test`);
      }
      return `/${dir.split(sep).join('/')}`.replace(/\/$/, '') || '/';
    });
}

// Drops the whitespace between tags so layout changes don't fail the tests.
function compact(xml: string): string {
  return xml.replace(/>\s+</g, '><');
}

describe('sitemapEntries', () => {
  it('lists each path once', () => {
    expect(byPath.size).toBe(entries.length);
  });

  it('lists exactly the routable pages, minus the noindex embed widgets', () => {
    const indexable = pageRoutes().filter((path) => !path.startsWith('/embed'));
    expect([...byPath.keys()].sort()).toEqual(indexable.sort());
  });

  it('includes the strategy optimizer', () => {
    expect(byPath.has('/strategy')).toBe(true);
  });

  it('lists every guide with its update date as lastmod', () => {
    for (const slug of GUIDE_SLUGS) {
      const entry = byPath.get(`/guides/${slug}`);
      expect(entry, slug).toBeDefined();
      expect(entry?.lastmod).toBe(GUIDE_DATES[slug].updated);
    }
  });

  it('only builds URLs from slugs that need no XML escaping', () => {
    for (const slug of GUIDE_SLUGS) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('dates the guides index by its newest guide', () => {
    const published = GUIDE_SLUGS.map((s) => GUIDE_DATES[s].published);
    const lastmod = byPath.get('/guides')?.lastmod;
    expect(published).toContain(lastmod);
    for (const day of published) {
      expect(lastmod && lastmod >= day).toBe(true);
    }
  });

  it('gives app pages no lastmod rather than a guessed one', () => {
    for (const path of ['/', '/calculator', '/strategy']) {
      expect(byPath.get(path)?.lastmod, path).toBeUndefined();
    }
  });
});

describe('renderSitemap', () => {
  const xml = compact(
    renderSitemap([
      { path: '/strategy', changefreq: 'monthly', priority: '0.9' },
      {
        path: '/guides/aime',
        changefreq: 'yearly',
        priority: '0.7',
        lastmod: '2026-10-14',
      },
    ])
  );

  it('declares the sitemap namespace', () => {
    expect(
      xml.startsWith(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
      )
    ).toBe(true);
    expect(xml.endsWith('</urlset>')).toBe(true);
  });

  it('writes absolute URLs and lastmod when present', () => {
    expect(xml).toContain(
      `<url><loc>${SITE_URL}/guides/aime</loc><lastmod>2026-10-14</lastmod><changefreq>yearly</changefreq><priority>0.7</priority></url>`
    );
  });

  it('omits lastmod when an entry has none', () => {
    expect(xml).toContain(
      `<url><loc>${SITE_URL}/strategy</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>`
    );
  });
});

describe('GET /sitemap.xml', () => {
  it('serves every entry as XML', async () => {
    const response = await GET({} as Parameters<typeof GET>[0]);
    expect(response.headers.get('Content-Type')).toBe('application/xml');
    const body = await response.text();
    expect(body.split('<url>').length - 1).toBe(entries.length);
    expect(body.split('<loc>').length - 1).toBe(entries.length);
  });
});
