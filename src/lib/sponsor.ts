import type { OutboundDestination } from './analytics/outbound';

/**
 * The site's current paid sponsor. Every sponsor placement (calculator
 * sponsor box, guide CTAs, strategy prompt) links here and reports analytics
 * under `destination`. Swapping sponsors means updating this object, adding
 * the new destination to OutboundDestination, and revising the placement
 * copy in SponsorAd, Sponsor, AdvisorPrompt, and guide-footer.
 */
export interface SponsorConfig {
  readonly name: string;
  /** Outbound link for every placement. */
  readonly url: string;
  /** PostHog `destination` property for impressions and clicks. */
  readonly destination: OutboundDestination;
}

export const SPONSOR: SponsorConfig = {
  name: 'Social Security Advisors',
  url: 'https://app.acuityscheduling.com/schedule/7e26ca70/appointment/97656215/calendar/167392?appointmentTypeIds[]=97656215',
  destination: 'socialsecurityadvisors',
};
