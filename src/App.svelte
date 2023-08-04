<script lang="ts">
  import "./global.css";

  import { context } from "./lib/context";

  import Header from "./components/Header.svelte";
  import PasteFlow from "./components/PasteFlow.svelte";
  import EarningsReport from "./components/EarningsReport.svelte";
  import EligibilityReport from "./components/EligibilityReport.svelte";
  import PiaReport from "./components/PiaReport.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import SidebarSection from "./components/SidebarSection.svelte";
  import NormalRetirementAgeReport from "./components/NormalRetirementAgeReport.svelte";
  import FilingDateReport from "./components/FilingDateReport.svelte";
  import CombinedHeading from "./components/CombinedHeading.svelte";
  import CombinedChart from "./components/CombinedChart.svelte";
  import SpousalReport from "./components/SpousalReport.svelte";

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
      {#if context.spouse}
        <SidebarSection
          label={context.recipient.shortName(15)}
          heading={true}
        />
      {/if}
      <SidebarSection label="Earnings Record">
        <EarningsReport recipient={context.recipient} />
      </SidebarSection>
      <SidebarSection label="Benefits Eligibility">
        <EligibilityReport recipient={context.recipient} />
      </SidebarSection>
      <SidebarSection label="Primary Insurance Amount">
        <PiaReport recipient={context.recipient} />
      </SidebarSection>
      <SidebarSection label="Normal Retirement Age">
        <NormalRetirementAgeReport recipient={context.recipient} />
      </SidebarSection>
      <SidebarSection label="Filing Date">
        <FilingDateReport recipient={context.recipient} />
      </SidebarSection>
      {#if context.spouse}
        <SidebarSection label={context.spouse.shortName(15)} heading={true} />
        <SidebarSection label="Earnings Record">
          <EarningsReport recipient={context.spouse} />
        </SidebarSection>
        <SidebarSection label="Benefits Eligibility">
          <EligibilityReport recipient={context.spouse} />
        </SidebarSection>
        <SidebarSection label="Primary Insurance Amount">
          <PiaReport recipient={context.spouse} />
        </SidebarSection>
        <SidebarSection label="Normal Retirement Age">
          <NormalRetirementAgeReport recipient={context.spouse} />
        </SidebarSection>
        <SidebarSection label="Filing Date">
          <FilingDateReport recipient={context.spouse} />
        </SidebarSection>
        <SidebarSection label="Combined" heading={true}>
          <CombinedHeading />
        </SidebarSection>
        <SidebarSection label="Spousal Benefits">
          <SpousalReport
            recipient={context.recipient}
            spouse={context.spouse}
          />
        </SidebarSection>
        <SidebarSection label="Filing Dates">
          <CombinedChart
            recipient={context.recipient}
            spouse={context.spouse}
          />
        </SidebarSection>
      {/if}
    </Sidebar>
  {/if}
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
  }
</style>
