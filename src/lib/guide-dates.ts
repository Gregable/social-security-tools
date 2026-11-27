/**
 * Publish and last-update dates for every guide, keyed by the guide's slug
 * (its directory under src/routes/guides).
 *
 * Every guide's byline and schema.org markup read these through
 * guideDates(), and sitemap.xml sends `updated` to search engines as
 * <lastmod>. (The guides index page still types its own display dates;
 * keep them in step by hand.) Bump `updated` when a guide's
 * content changes in a way a reader would notice (new figures, new sections,
 * corrected advice), not for styling or sponsor-card tweaks: Google only
 * trusts lastmod from sites whose dates track real content changes.
 *
 * A guide that has never been revised keeps `updated` equal to `published`;
 * the byline hides an "Updated" date that repeats the publish date.
 */

/** A calendar day, YYYY-MM-DD. Tests check each one is a real, padded date. */
export type IsoDay = `${number}-${number}-${number}`;

interface GuideDateEntry {
  readonly published: IsoDay;
  readonly updated: IsoDay;
}

export const GUIDE_DATES = {
  '1st-and-2nd-of-month': { published: '2022-06-05', updated: '2026-09-17' },
  '25k-income': { published: '2025-06-15', updated: '2026-10-14' },
  '40k-income': { published: '2025-06-15', updated: '2026-10-14' },
  '60k-income': { published: '2025-06-15', updated: '2026-10-14' },
  '80k-income': { published: '2025-06-15', updated: '2026-10-14' },
  '100k-income': { published: '2025-06-15', updated: '2026-10-14' },
  'agency-changes': { published: '2025-04-30', updated: '2025-04-30' },
  aime: { published: '2025-09-19', updated: '2026-10-14' },
  'benefit-estimate-differences': {
    published: '2026-10-16',
    updated: '2026-10-16',
  },
  'break-even-age': { published: '2026-10-11', updated: '2026-10-11' },
  'child-benefits': { published: '2026-10-10', updated: '2026-10-14' },
  'claiming-age-clarity-act': {
    published: '2026-11-27',
    updated: '2026-11-27',
  },
  cola: { published: '2026-09-10', updated: '2026-10-14' },
  'covid-awi-drop': { published: '2020-12-01', updated: '2020-12-01' },
  'delayed-january-bump': { published: '2023-12-29', updated: '2026-09-17' },
  'delayed-retirement-credits': {
    published: '2026-02-18',
    updated: '2026-11-27',
  },
  'divorced-spouse': { published: '2026-01-18', updated: '2026-11-18' },
  'earnings-cap': { published: '2020-11-28', updated: '2026-09-17' },
  'earnings-record-paste': { published: '2023-09-12', updated: '2023-09-12' },
  'earnings-test': { published: '2026-01-26', updated: '2026-10-31' },
  'federal-taxes': { published: '2022-12-04', updated: '2026-10-31' },
  'filing-date-chart': { published: '2023-08-15', updated: '2023-08-15' },
  'government-pension-offset': {
    published: '2026-11-18',
    updated: '2026-11-18',
  },
  'government-shutdown': { published: '2025-09-30', updated: '2025-09-30' },
  'indexing-factors': { published: '2020-12-28', updated: '2026-09-17' },
  inflation: { published: '2018-11-23', updated: '2026-09-17' },
  integrations: { published: '2025-12-20', updated: '2026-11-25' },
  'international-agreements': {
    published: '2022-06-26',
    updated: '2022-06-26',
  },
  maximum: { published: '2019-08-03', updated: '2026-10-14' },
  mortality: { published: '2025-08-08', updated: '2026-09-17' },
  nra: { published: '2026-01-17', updated: '2026-11-27' },
  pia: { published: '2025-09-19', updated: '2026-10-14' },
  privacy: { published: '2025-01-14', updated: '2025-01-14' },
  'projectionlab-review': { published: '2026-02-15', updated: '2026-02-15' },
  remarriage: { published: '2026-11-11', updated: '2026-11-11' },
  'retroactive-retirement-benefits': {
    published: '2026-10-22',
    updated: '2026-10-22',
  },
  'retroactive-survivor-benefits': {
    published: '2026-09-17',
    updated: '2026-11-18',
  },
  'senior-tax-deduction': { published: '2026-02-02', updated: '2026-09-17' },
  'spousal-benefit-filing-date': {
    published: '2023-09-06',
    updated: '2026-09-17',
  },
  'spousal-benefits': { published: '2026-09-09', updated: '2026-11-18' },
  'state-taxes': { published: '2026-02-15', updated: '2026-09-17' },
  'strategy-vs-opensocialsecurity': {
    published: '2026-04-27',
    updated: '2026-04-27',
  },
  'survivor-benefits': { published: '2026-01-19', updated: '2026-11-18' },
  'url-parameters': { published: '2025-10-07', updated: '2026-10-03' },
  wep: { published: '2026-01-16', updated: '2026-11-18' },
  'will-social-security-run-out': {
    published: '2023-08-11',
    updated: '2026-09-17',
  },
  'work-credits': { published: '2024-02-26', updated: '2026-09-17' },
  'working-past-full-retirement-age': {
    published: '2026-09-18',
    updated: '2026-10-14',
  },
} as const satisfies Record<string, GuideDateEntry>;

export type GuideSlug = keyof typeof GUIDE_DATES;

export const GUIDE_SLUGS = Object.keys(GUIDE_DATES) as readonly GuideSlug[];

export interface GuideDates {
  readonly publishDate: Date;
  readonly updateDate: Date;
}

// UTC midnight, so the <time datetime>, the JSON-LD and the UTC-formatted
// byline all name the same calendar day in every timezone.
function utcMidnight(day: IsoDay): Date {
  return new Date(`${day}T00:00:00Z`);
}

/** A guide's publish and update dates as fresh Date objects. */
export function guideDates(slug: GuideSlug): GuideDates {
  const { published, updated } = GUIDE_DATES[slug];
  return {
    publishDate: utcMidnight(published),
    updateDate: utcMidnight(updated),
  };
}
