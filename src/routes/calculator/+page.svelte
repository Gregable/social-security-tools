<script lang="ts">
  import "$lib/global.css";

  import { context } from "$lib/context";

  import Header from "$lib/components/Header.svelte";
  import PasteFlow from "$lib/components/PasteFlow.svelte";
  import IndexedEarningsReport from "$lib/components/IndexedEarningsReport.svelte";
  import EarningsReport from "$lib/components/EarningsReport.svelte";
  import EligibilityReport from "$lib/components/EligibilityReport.svelte";
  import PiaReport from "$lib/components/PiaReport.svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import SidebarSection from "$lib/components/SidebarSection.svelte";
  import MoreResources from "$lib/components/MoreResources.svelte";
  import NormalRetirementAgeReport from "$lib/components/NormalRetirementAgeReport.svelte";
  import FilingDateReport from "$lib/components/FilingDateReport.svelte";
  import CombinedHeading from "$lib/components/CombinedHeading.svelte";
  import CombinedChart from "$lib/components/CombinedChart.svelte";
  import SpousalReport from "$lib/components/SpousalReport.svelte";
  import RecipientName from "$lib/components/RecipientName.svelte";

  export let isPasteFlow: boolean = true;

  function pasteDone() {
    isPasteFlow = false;
  }
</script>

<Header active="Calculator" />
<main>
  {#if isPasteFlow}
    <PasteFlow on:done={pasteDone} />
  {:else}
    <Sidebar>
      <!--
        This div ends up as the parent element for the position:sticky sliders
        inside the EarningsReport component. It closes at the end of this user's
        part of the report and another one is opened for the spouse's part.
      -->
      <div>
        {#if context.spouse}
          <SidebarSection
            label={context.recipient.shortName(15)}
            heading={true}
          />
          <h1 class="recipientName">
            <RecipientName r={context.recipient} noColor />
          </h1>
        {/if}
        <SidebarSection label="Earnings Report">
          <EarningsReport recipient={context.recipient} />
        </SidebarSection>
        <SidebarSection label="Benefits Eligibility">
          <EligibilityReport recipient={context.recipient} />
        </SidebarSection>
        <SidebarSection label="Indexed Earnings">
          <IndexedEarningsReport recipient={context.recipient} />
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
      </div>
      {#if context.spouse}
        <!--
          See the description of the purpose of this div above.
        -->
        <div>
          <SidebarSection label={context.spouse.shortName(15)} heading={true} />
          <h1 class="recipientName">
            <RecipientName r={context.spouse} noColor />
          </h1>
          <SidebarSection label="Earnings Report">
            <EarningsReport recipient={context.spouse} />
          </SidebarSection>
          <SidebarSection label="Benefits Eligibility">
            <EligibilityReport recipient={context.spouse} />
          </SidebarSection>
          <SidebarSection label="Indexed Earnings">
            <IndexedEarningsReport recipient={context.spouse} />
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
        </div>
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
      <SidebarSection label="More Reading" heading={true}>
        <MoreResources />
      </SidebarSection>
    </Sidebar>
  {/if}
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
  }
  .recipientName {
    text-decoration: underline;
  }
</style>
