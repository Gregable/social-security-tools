import posthog from 'posthog-js';
import { browser } from '$app/environment';

export const prerender = true;

function isInternalTraffic(): boolean {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local'))
    return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('internal') === '1') {
      localStorage.setItem('ssa_internal_traffic', '1');
    }
    return localStorage.getItem('ssa_internal_traffic') === '1';
  } catch {
    return false;
  }
}

export const load = async () => {
  if (browser) {
    posthog.init('phc_hCY7L2NR1CymU5BYBsvZOQ7eblUWH1eOrKX8jQ3ZcUK', {
      api_host: 'https://ssa.tools/api/v1',
      ui_host: 'https://app.posthog.com',
      autocapture: false,
      disable_session_recording: true,
      mask_all_text: true,
      opt_out_capturing_by_default: isInternalTraffic(),
    });
  }
  return;
};
