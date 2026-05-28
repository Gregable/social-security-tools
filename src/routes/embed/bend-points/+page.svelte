<script lang="ts">
  import BendpointChart from '$lib/components/BendpointChart.svelte';
  import EmbedRoot from '$lib/components/embed/EmbedRoot.svelte';
  import { recipient } from '$lib/context';
</script>

<svelte:head>
  <title>Bend Points · ssa.tools embed</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<EmbedRoot widget="bend-points" requires="recipient-earnings-and-dob">
  {#if $recipient}
    <BendpointChart recipient={$recipient} />
  {/if}
</EmbedRoot>
