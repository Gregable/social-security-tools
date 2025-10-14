<script lang="ts">
  // Intro banner shown when the Linopt integration is active
  import IntegrationBanner from '../IntegrationBanner.svelte';
  import logo from './linopt-fig.png';
</script>

<IntegrationBanner {logo} logoAlt="Linopt">
  You're using this calculator via <strong>Linopt</strong>. At the end of your
  report, you'll see how to enter your calculations back into Linopt.
</IntegrationBanner>
