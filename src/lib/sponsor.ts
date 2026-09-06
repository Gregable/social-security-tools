import type { OutboundDestination } from './analytics/outbound';

/**
 * The site's current paid sponsor. Every sponsor placement (calculator
 * sponsor box, guide CTAs, strategy prompt) links here and reports analytics
 * under `destination`, so swapping sponsors is a change to this one object
 * plus the ad copy in SponsorAd.svelte.
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
