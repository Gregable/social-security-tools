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

/**
 * The pitch shown inside a sponsor placement. `intro` and `outro` wrap the
 * linked sponsor name in one sentence; `bullets` follow it. Guides can pass
 * their own copy to tie the pitch to the topic at hand.
 */
export interface SponsorCopy {
  /** Sentence fragment rendered before the linked sponsor name. */
  readonly intro: string;
  /** Sentence fragment rendered after the linked sponsor name. */
  readonly outro: string;
  readonly bullets: readonly string[];
}

export const DEFAULT_SPONSOR_COPY: SponsorCopy = {
  intro:
    'Still weighing when to file? You can schedule a free call with a Social Security specialist at',
  outro: ' to talk through your specific situation.',
  bullets: [
    "A real person looks at your numbers, including things this calculator doesn't cover like taxes, pensions, and health.",
    'The first call is free, and you pick the time.',
    'If you want more help after that, they can also handle the filing.',
  ],
};

export const SPONSOR: SponsorConfig = {
  name: 'Social Security Advisors',
  url: 'https://app.acuityscheduling.com/schedule/7e26ca70/appointment/97656215/calendar/167392?appointmentTypeIds[]=97656215',
  destination: 'socialsecurityadvisors',
};
