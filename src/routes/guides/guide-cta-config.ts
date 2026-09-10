export type GuideCTAType = 'calculator' | 'sponsor';

export const GUIDE_CTA_TYPES: Record<string, GuideCTAType> = {
  // Calculator: guides where reader can immediately use the calculator
  '100k-income': 'calculator',
  '25k-income': 'calculator',
  '40k-income': 'calculator',
  '60k-income': 'calculator',
  '80k-income': 'calculator',
  aime: 'calculator',
  cola: 'calculator',
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
  integrations: 'sponsor',
  'international-agreements': 'sponsor',
  mortality: 'sponsor',
  privacy: 'sponsor',
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
  const slug = pathname.replace('/guides/', '').replace(/\/$/, '');
  return GUIDE_CTA_TYPES[slug] ?? 'sponsor';
}
