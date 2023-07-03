<script lang="ts">
  import "./global.css";

  import Header from "./components/Header.svelte";
  import PasteFlow from "./components/PasteFlow.svelte";
  import EarningsFlow from "./components/EarningsFlow.svelte";

  let isPasteFlow: Boolean = true;

  function pasteDone() {
    isPasteFlow = false;
  }
</script>

<main>
  <Header />
  {#if isPasteFlow}
    <PasteFlow on:done={pasteDone} />
  {:else}
    <EarningsFlow />
  {/if}
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
  }
</style>
