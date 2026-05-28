<script lang="ts">
  import EmbedFooter from '$lib/components/embed/EmbedFooter.svelte';
</script>

<slot />
<EmbedFooter />

<style>
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }
</style>
