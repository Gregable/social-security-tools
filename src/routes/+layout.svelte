<script lang="ts">
  import { browser } from "$app/environment";
  import posthog from "posthog-js";
  import "../app.css";

  // These imports are available for use but may not be directly referenced
  // They're kept for potential future use
  const _browser = browser;
  const _posthog = posthog;
</script>

<slot></slot>

<!-- Global styles moved to src/app.css -->
