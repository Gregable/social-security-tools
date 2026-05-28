<script lang="ts">
  import EmbedRoot from '$lib/components/embed/EmbedRoot.svelte';
  import IndexedEarningsTable from '$lib/components/IndexedEarningsTable.svelte';
  import { recipient } from '$lib/context';
</script>

<svelte:head>
  <title>Indexed Earnings · ssa.tools embed</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<EmbedRoot widget="indexed-earnings" requires="recipient-earnings-and-dob">
  {#if $recipient}
    <IndexedEarningsTable recipient={$recipient} />
  {/if}
</EmbedRoot>
