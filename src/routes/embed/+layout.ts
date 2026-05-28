import posthog from 'posthog-js';
import { browser } from '$app/environment';

export const prerender = true;

export const load = async () => {
  if (browser) {
    posthog.init('phc_hCY7L2NR1CymU5BYBsvZOQ7eblUWH1eOrKX8jQ3ZcUK', {
      api_host: 'https://ssa.tools/api/v1',
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      mask_all_text: true,
      persistence: 'memory',
      opt_out_capturing_by_default: false,
      // The URL hash on /embed/* carries user data (pia1, dob1, earnings1, ...).
      // PostHog's default $current_url property would ship the whole href to
      // ingest, violating the project's no-transmit-user-data rule. Strip the
      // hash from every captured event before it leaves the browser.
      sanitize_properties: (properties: Record<string, unknown>) => {
        const url = properties.$current_url;
        if (typeof url === 'string') {
          properties.$current_url = url.split('#')[0];
        }
        return properties;
      },
    });
  }
  return;
};
