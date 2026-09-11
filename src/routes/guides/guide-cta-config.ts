import { guideSlugFromPath } from './guide-slug';

export type GuideCTAType = 'calculator' | 'sponsor';

/**
 * The CTA each guide shows. The privacy and integrations guides are absent
 * on purpose: they carry no inline CTA at all, because an ad for a third
 * party sits badly on a page promising your data goes nowhere, and on a
 * page recommending planning tools a sponsor pitch has to talk down.
 */
export const GUIDE_CTA_TYPES: Record<string, GuideCTAType> = {
  // Calculator: guides where reader can immediately use the calculator
  '100k-income': 'calculator',
  '25k-income': 'calculator',
  '40k-income': 'calculator',
  '60k-income': 'calculator',
  '80k-income': 'calculator',
  aime: 'calculator',
  'delayed-january-bump': 'calculator',
  'earnings-cap': 'calculator',
  'earnings-record-paste': 'calculator',
  'earnings-test': 'calculator',
  'filing-date-chart': 'calculator',
  'indexing-factors': 'calculator',
  inflation: 'calculator',
  maximum: 'calculator',
  nra: 'calculator',
  pia: 'calculator',
  'spousal-benefit-filing-date': 'calculator',
  'url-parameters': 'calculator',
  'work-credits': 'calculator',
  // Sponsor: broader retirement topics
  'agency-changes': 'sponsor',
  'covid-awi-drop': 'sponsor',
  'divorced-spouse': 'sponsor',
  'federal-taxes': 'sponsor',
  'government-shutdown': 'sponsor',
  'international-agreements': 'sponsor',
  mortality: 'sponsor',
  'projectionlab-review': 'calculator',
  'senior-tax-deduction': 'sponsor',
  'spousal-benefits': 'sponsor',
  'state-taxes': 'sponsor',
  'survivor-benefits': 'sponsor',
  '1st-and-2nd-of-month': 'sponsor',
  wep: 'sponsor',
  'will-social-security-run-out': 'sponsor',
};

export function getGuideCTAType(pathname: string): GuideCTAType {
  return GUIDE_CTA_TYPES[guideSlugFromPath(pathname)] ?? 'sponsor';
}
