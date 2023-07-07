<script lang="ts">
  import "./global.css";

  import { context } from "./lib/context";

  import Header from "./components/Header.svelte";
  import PasteFlow from "./components/PasteFlow.svelte";
  import EarningsReport from "./components/EarningsReport.svelte";
  import EligibilityReport from "./components/EligibilityReport.svelte";
  import Sidebar from "./components/Sidebar.svelte";

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
    <div class="twoColumns">
      <Sidebar />
      <div>
        <EarningsReport recipient={context.recipient} />
        <EligibilityReport recipient={context.recipient} />
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
  }
  .twoColumns {
    display: grid;
    grid-template-columns: max-content 1fr;
  }
</style>
