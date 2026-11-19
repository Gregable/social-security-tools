import { renderSitemap, sitemapEntries } from '$lib/sitemap';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = async () => {
  return new Response(renderSitemap(sitemapEntries()), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=0, s-maxage=3600',
    },
  });
};
