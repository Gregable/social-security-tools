<script lang="ts">
  import "./global.css";

  import { context } from "./lib/context";

  import Header from "./components/Header.svelte";
  import PasteFlow from "./components/PasteFlow.svelte";
  import EarningsReport from "./components/EarningsReport.svelte";
  import EligibilityReport from "./components/EligibilityReport.svelte";

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
    <EarningsReport recipient={context.recipient} />
    <EligibilityReport recipient={context.recipient} />
  {/if}
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
  }
</style>
