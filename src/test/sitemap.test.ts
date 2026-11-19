import { describe, expect, it } from 'vitest';
import { AUTHOR } from '$lib/author';
import { GUIDE_DATES, GUIDE_SLUGS } from '$lib/guide-dates';
import { renderSitemap, SITE_URL, sitemapEntries } from '$lib/sitemap';

const entries = sitemapEntries();
const byPath = new Map(entries.map((e) => [e.path, e]));
const slugs = GUIDE_SLUGS;

describe('sitemapEntries', () => {
  it('lists each path once', () => {
    expect(byPath.size).toBe(entries.length);
  });

  it('includes the top-level pages, including the strategy optimizer', () => {
    for (const path of [
      '/',
      '/calculator',
      '/strategy',
      '/guides',
      '/about',
      '/contact',
      AUTHOR.path,
    ]) {
      expect(byPath.has(path), path).toBe(true);
    }
  });

  it('leaves out the noindex embed widgets', () => {
    expect(entries.filter((e) => e.path.startsWith('/embed'))).toEqual([]);
  });

  it('lists every guide with its update date as lastmod', () => {
    for (const slug of slugs) {
      const entry = byPath.get(`/guides/${slug}`);
      expect(entry, slug).toBeDefined();
      expect(entry?.lastmod).toBe(GUIDE_DATES[slug].updated);
    }
  });

  it('dates the guides index by its newest guide', () => {
    const newest = slugs
      .map((s) => GUIDE_DATES[s].published)
      .sort()
      .at(-1);
    expect(byPath.get('/guides')?.lastmod).toBe(newest);
  });

  it('gives app pages no lastmod rather than a guessed one', () => {
    for (const path of ['/', '/calculator', '/strategy']) {
      expect(byPath.get(path)?.lastmod, path).toBeUndefined();
    }
  });
});

describe('renderSitemap', () => {
  const xml = renderSitemap([
    { path: '/strategy', changefreq: 'monthly', priority: '0.9' },
    {
      path: '/guides/aime',
      changefreq: 'yearly',
      priority: '0.7',
      lastmod: '2026-10-14',
    },
  ]);

  it('declares the sitemap namespace', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(
      true
    );
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    );
  });

  it('writes absolute URLs and lastmod when present', () => {
    expect(xml).toContain(
      `  <url>
    <loc>${SITE_URL}/guides/aime</loc>
    <lastmod>2026-10-14</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.7</priority>
  </url>`
    );
  });

  it('omits lastmod when an entry has none', () => {
    expect(xml).toContain(
      `  <url>
    <loc>${SITE_URL}/strategy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`
    );
  });
});
