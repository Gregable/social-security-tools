<script lang="ts">
  import CombinedChart from '$lib/components/CombinedChart.svelte';
  import EmbedRoot from '$lib/components/embed/EmbedRoot.svelte';
  import { recipient, spouse } from '$lib/context';
</script>

<svelte:head>
  <title>Couple Filing Age · ssa.tools embed</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<EmbedRoot widget="filing-age-couple" requires="couple-pia-and-dob">
  {#if $recipient && $spouse}
    <CombinedChart recipient={$recipient} spouse={$spouse} />
  {/if}
</EmbedRoot>
