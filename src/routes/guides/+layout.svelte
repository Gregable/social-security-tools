<script lang="ts">
  import "$lib/global.css";
  import Header from "$lib/components/Header.svelte";
  import GuideFooter from "./guide-footer.svelte";
</script>

<Header active="Guides" />
<main>
  <slot />
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
  }
</style>
