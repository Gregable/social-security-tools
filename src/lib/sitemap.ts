import { AUTHOR } from '$lib/author';
import { GUIDE_DATES, GUIDE_SLUGS, type IsoDay } from '$lib/guide-dates';

export const SITE_URL = 'https://ssa.tools';

type ChangeFrequency = 'weekly' | 'monthly' | 'yearly';

export interface SitemapEntry {
  readonly path: string;
  readonly changefreq: ChangeFrequency;
  readonly priority: string;
  /**
   * Last meaningful content change. Left out where no honest date exists
   * (the app pages change with every deploy), since a lastmod that does
   * not track real changes teaches Google to ignore the site's lastmods.
   */
  readonly lastmod?: IsoDay;
}

// The index lists the guides, so it changes when a guide is added.
function newestGuidePublished(): IsoDay {
  return GUIDE_SLUGS.map((slug) => GUIDE_DATES[slug].published).reduce(
    (a, b) => (b > a ? b : a)
  );
}

/**
 * Every indexable page. The /embed widgets are noindex and stay out.
 * Guides come from GUIDE_DATES, so a guide with dates is in the sitemap.
 */
export function sitemapEntries(): readonly SitemapEntry[] {
  const pages: SitemapEntry[] = [
    { path: '/', priority: '1.0', changefreq: 'monthly' },
    { path: '/calculator', priority: '0.9', changefreq: 'monthly' },
    { path: '/strategy', priority: '0.9', changefreq: 'monthly' },
    {
      path: '/guides',
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: newestGuidePublished(),
    },
    { path: '/about', priority: '0.5', changefreq: 'yearly' },
    { path: AUTHOR.path, priority: '0.5', changefreq: 'yearly' },
    { path: '/contact', priority: '0.3', changefreq: 'yearly' },
  ];
  const guides: SitemapEntry[] = GUIDE_SLUGS.map((slug) => ({
    path: `/guides/${slug}`,
    priority: '0.7',
    changefreq: 'yearly',
    lastmod: GUIDE_DATES[slug].updated,
  }));
  return [...pages, ...guides];
}

function renderEntry(entry: SitemapEntry): string {
  const lastmod = entry.lastmod
    ? `\n    <lastmod>${entry.lastmod}</lastmod>`
    : '';
  return `  <url>
    <loc>${SITE_URL}${entry.path}</loc>${lastmod}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
}

export function renderSitemap(entries: readonly SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(renderEntry).join('\n')}
</urlset>`;
}
