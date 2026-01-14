<script lang="ts">
import posthog from 'posthog-js';
import { onMount } from 'svelte';
import { afterNavigate } from '$app/navigation';
import { browser } from '$app/environment';
import { page } from '$app/stores';
import { initializeIntegration, activeIntegration } from '$lib/integrations/context';
import '../app.css';

onMount(() => {
  // Initialize integration to preserve session state across all pages
  initializeIntegration();

  // Register integration_id as a super property if present in URL hash
  if (browser) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const integrationId = hashParams.get('integration');
    if (integrationId) {
      posthog.register({ integration_id: integrationId });
    }
  }
});

// Track page views on navigation
afterNavigate(({ to }) => {
  if (browser && to?.url) {
    const pathname = to.url.pathname;
    let eventName = 'Page View';
    let properties: Record<string, string | undefined> = {};

    // Determine the page type and event name
    if (pathname === '/') {
      eventName = 'Page View: Home';
    } else if (pathname === '/calculator') {
      eventName = 'Page View: Calculator';
      properties.integration_id = $activeIntegration?.id;
    } else if (pathname === '/guides') {
      eventName = 'Page View: Guides Index';
    } else if (pathname.startsWith('/guides/')) {
      eventName = 'Page View: Guide';
      properties.guide_slug = pathname.replace('/guides/', '');
    } else if (pathname === '/strategy') {
      eventName = 'Page View: Strategy';
    } else if (pathname === '/about') {
      eventName = 'Page View: About';
    } else if (pathname === '/contact') {
      eventName = 'Page View: Contact';
    }

    posthog.capture(eventName, properties);
  }
});
</script>

<slot></slot>

<!-- Global styles moved to src/app.css -->
