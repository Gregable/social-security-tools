import type { OutboundDestination } from './analytics/outbound';

/**
 * The site's current paid sponsor. Every sponsor placement (calculator
 * sponsor box, guide CTAs, strategy prompt) links here and reports analytics
 * under `destination`. Swapping sponsors means updating this object, adding
 * the new destination to OutboundDestination, revising DEFAULT_SPONSOR_COPY
 * and every guide pitch in src/routes/guides/sponsor-copy.ts, and revising
 * the remaining hard-coded text in SponsorAd, Sponsor, AdvisorPrompt, and
 * guide-footer.
 */
export interface SponsorConfig {
  readonly name: string;
  /** Outbound link for every placement. */
  readonly url: string;
  /** PostHog `destination` property for impressions and clicks. */
  readonly destination: OutboundDestination;
}

/**
 * The pitch shown inside a sponsor placement. SponsorAd renders
 * `intro`, the sponsor name (styled as a link; the whole card is the
 * anchor), and `outro` as one sentence, supplying the spaces between them,
 * then lists `bullets`. Guides tie the pitch to the topic at hand through
 * src/routes/guides/sponsor-copy.ts.
 */
export interface SponsorCopy {
  /** Trimmed fragment before the sponsor name, usually ending in "at". */
  readonly intro: string;
  /** Trimmed fragment after the sponsor name, carrying the final period. */
  readonly outro: string;
  /**
   * Supporting points shown below the sentence on wider screens. Hidden on
   * mobile, so `intro` and `outro` must make the pitch complete alone.
   */
  readonly bullets: readonly string[];
}

/** Copy used by every SponsorAd that is not given guide-specific copy. */
export const DEFAULT_SPONSOR_COPY: SponsorCopy = {
  intro:
    'Still weighing when to file? You can schedule a free call with a Social Security specialist at',
  outro: 'to talk through your specific situation.',
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
