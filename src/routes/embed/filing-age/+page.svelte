<script lang="ts">
  import EmbedRoot from '$lib/components/embed/EmbedRoot.svelte';
  import FilingDateChart from '$lib/components/FilingDateChart.svelte';
  import { recipient } from '$lib/context';
</script>

<svelte:head>
  <title>Filing Age · ssa.tools embed</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<EmbedRoot widget="filing-age" requires="recipient-pia-and-dob">
  {#if $recipient}
    <FilingDateChart recipient={$recipient} />
  {/if}
</EmbedRoot>
