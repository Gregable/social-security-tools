<script lang="ts">
// Intro banner shown when the Open Social Security integration is active
import IntegrationBanner from '../IntegrationBanner.svelte';
import logo from './favicon.ico';
</script>

<IntegrationBanner {logo} logoAlt="Open Social Security">
  You're using this calculator via <strong>Open Social Security</strong>. At the
  end of your report, you'll see a link to return to Open Social Security with
  your information.
</IntegrationBanner>
