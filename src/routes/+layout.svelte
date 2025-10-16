<script lang="ts">
import posthog from 'posthog-js';
import { onMount } from 'svelte';
import { browser } from '$app/environment';
import { initializeIntegration } from '$lib/integrations/context';
import '../app.css';

// These imports are available for use but may not be directly referenced
// They're kept for potential future use
const _browser = browser;
const _posthog = posthog;

onMount(() => {
  // Initialize integration to preserve session state across all pages
  initializeIntegration();
});
</script>

<slot></slot>

<!-- Global styles moved to src/app.css -->
