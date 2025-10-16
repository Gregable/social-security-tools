import posthog from 'posthog-js';
import { browser } from '$app/environment';

export const prerender = true;

export const load = async () => {
  if (browser) {
    posthog.init('phc_hCY7L2NR1CymU5BYBsvZOQ7eblUWH1eOrKX8jQ3ZcUK', {
      api_host: 'https://ssa.tools/ingest',
      ui_host: 'https://app.posthog.com',
      autocapture: false,
      disable_session_recording: true,
      mask_all_text: true,
    });
  }
  return;
};
