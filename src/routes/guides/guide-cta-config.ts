export type GuideCTAType = 'calculator' | 'projectionlab';

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
  // ProjectionLab: broader retirement topics
  'agency-changes': 'projectionlab',
  'covid-awi-drop': 'projectionlab',
  'divorced-spouse': 'projectionlab',
  'federal-taxes': 'projectionlab',
  'government-shutdown': 'projectionlab',
  integrations: 'projectionlab',
  'international-agreements': 'projectionlab',
  mortality: 'projectionlab',
  privacy: 'projectionlab',
  'projectionlab-review': 'calculator',
  'senior-tax-deduction': 'projectionlab',
  'state-taxes': 'projectionlab',
  'survivor-benefits': 'projectionlab',
  '1st-and-2nd-of-month': 'projectionlab',
  wep: 'projectionlab',
  'will-social-security-run-out': 'projectionlab',
};

export function getGuideCTAType(pathname: string): GuideCTAType {
  const slug = pathname.replace('/guides/', '').replace(/\/$/, '');
  return GUIDE_CTA_TYPES[slug] ?? 'projectionlab';
}
