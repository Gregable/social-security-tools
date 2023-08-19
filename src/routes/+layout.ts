
import {browser} from '$app/environment';
import {dev} from '$app/environment';
import {inject} from '@vercel/analytics';
import posthog from 'posthog-js'

export const prerender = true;

inject({mode: dev ? 'development' : 'production'});

export const load = async () => {
  if (browser) {
    posthog.init('phc_hCY7L2NR1CymU5BYBsvZOQ7eblUWH1eOrKX8jQ3ZcUK', {
      api_host: 'https://app.posthog.com',
      autocapture: false,
      disable_session_recording: true,
      mask_all_text: true,
    })
  }
  return
};
