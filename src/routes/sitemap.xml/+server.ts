import type { RequestHandler } from './$types';

const pages = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/calculator', priority: '0.9', changefreq: 'monthly' },
  { path: '/guides', priority: '0.8', changefreq: 'weekly' },
  { path: '/about', priority: '0.5', changefreq: 'yearly' },
  { path: '/contact', priority: '0.3', changefreq: 'yearly' },
  // Guide pages
  { path: '/guides/privacy', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/integrations', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/url-parameters', priority: '0.7', changefreq: 'yearly' },
  {
    path: '/guides/government-shutdown',
    priority: '0.7',
    changefreq: 'yearly',
  },
  { path: '/guides/aime', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/pia', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/wep', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/25k-income', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/40k-income', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/60k-income', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/80k-income', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/100k-income', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/agency-changes', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/work-credits', priority: '0.7', changefreq: 'yearly' },
  {
    path: '/guides/earnings-record-paste',
    priority: '0.7',
    changefreq: 'yearly',
  },
  {
    path: '/guides/spousal-benefit-filing-date',
    priority: '0.7',
    changefreq: 'yearly',
  },
  { path: '/guides/filing-date-chart', priority: '0.7', changefreq: 'yearly' },
  {
    path: '/guides/will-social-security-run-out',
    priority: '0.7',
    changefreq: 'yearly',
  },
  {
    path: '/guides/delayed-january-bump',
    priority: '0.7',
    changefreq: 'yearly',
  },
  { path: '/guides/federal-taxes', priority: '0.7', changefreq: 'yearly' },
  {
    path: '/guides/international-agreements',
    priority: '0.7',
    changefreq: 'yearly',
  },
  {
    path: '/guides/1st-and-2nd-of-month',
    priority: '0.7',
    changefreq: 'yearly',
  },
  { path: '/guides/indexing-factors', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/covid-awi-drop', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/earnings-cap', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/maximum', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/inflation', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/mortality', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/nra', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/divorced-spouse', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/survivor-benefits', priority: '0.7', changefreq: 'yearly' },
  { path: '/guides/earnings-test', priority: '0.7', changefreq: 'yearly' },
  {
    path: '/guides/senior-tax-deduction',
    priority: '0.7',
    changefreq: 'yearly',
  },
];
// Note: /strategy is excluded per robots.txt

const baseUrl = 'https://ssa.tools';

export const prerender = true;

export const GET: RequestHandler = async () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=0, s-maxage=3600',
    },
  });
};
