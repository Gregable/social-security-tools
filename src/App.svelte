<script lang="ts">
  import "./global.css";

  import { context } from "./lib/context";

  import Header from "./components/Header.svelte";
  import PasteFlow from "./components/PasteFlow.svelte";
  import EarningsReport from "./components/EarningsReport.svelte";
  import EligibilityReport from "./components/EligibilityReport.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import SidebarSection from "./components/SidebarSection.svelte";

  let isPasteFlow: boolean = true;

  function pasteDone() {
    isPasteFlow = false;
  }
</script>

<main>
  <Header />
  {#if isPasteFlow}
    <PasteFlow on:done={pasteDone} />
  {:else}
    <Sidebar>
      <SidebarSection label="Earnings Record">
        <EarningsReport recipient={context.recipient} />
      </SidebarSection>
      <SidebarSection label="Benefits Eligibility">
        <EligibilityReport recipient={context.recipient} />
      </SidebarSection>
    </Sidebar>
  {/if}
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
  }
</style>
