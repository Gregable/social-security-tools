<script lang="ts">
import type { ComponentType, SvelteComponent } from 'svelte';
import { onMount } from 'svelte';
import CombinedChart from '$lib/components/CombinedChart.svelte';
import CombinedHeading from '$lib/components/CombinedHeading.svelte';
import EarningsReport from '$lib/components/EarningsReport.svelte';
import EligibilityReport from '$lib/components/EligibilityReport.svelte';
import FilingDateReport from '$lib/components/FilingDateReport.svelte';
import Header from '$lib/components/Header.svelte';
import IndexedEarningsReport from '$lib/components/IndexedEarningsReport.svelte';
import MoreResources from '$lib/components/MoreResources.svelte';
import NormalRetirementAgeReport from '$lib/components/NormalRetirementAgeReport.svelte';
import PasteFlow from '$lib/components/PasteFlow.svelte';
import PiaReport from '$lib/components/PiaReport.svelte';
import RecipientName from '$lib/components/RecipientName.svelte';
import Sidebar from '$lib/components/Sidebar.svelte';
import SidebarSection from '$lib/components/SidebarSection.svelte';
import Sponsor from '$lib/components/Sponsor.svelte';
import SpousalReport from '$lib/components/SpousalReport.svelte';
import SurvivorReport from '$lib/components/SurvivorReport.svelte';
import { context } from '$lib/context';
import { loadIntroBanner, loadReportEnd } from '$lib/integrations/config';
import {
  activeIntegration,
  initializeIntegration,
} from '$lib/integrations/context';

export let isPasteFlow: boolean = true;

let IntroBannerComponent: ComponentType<SvelteComponent> | null = null;
let ReportEndComponent: ComponentType<SvelteComponent> | null = null;
let showIntroBanner: boolean = true;
let integrationFavicon: string = '';
let integrationComponentsLoaded: boolean = false;

// Initialize integration early to ensure it's set before PasteFlow runs
// This is critical because PasteFlow's onMount may change the hash
onMount(() => {
  initializeIntegration();
});

function pasteDone() {
  isPasteFlow = false;

  // Show the intro banner again now that the report is displayed
  showIntroBanner = true;

  // Don't change the URL hash - preserve integration parameters
  // Previously we pushed #results here, but that would remove integration
  // parameters from the URL before they could be properly initialized

  // Re-initialize integration to ensure it's preserved after any hash changes
  // This handles cases where the hash might have been modified
  initializeIntegration();
}

function pasteStarted() {
  // Hide the intro banner once user has entered data
  showIntroBanner = false;
}

// Reactively load integration components when activeIntegration changes
// This ensures components are loaded regardless of timing with PasteFlow
$: if ($activeIntegration) {
  loadIntegrationComponents($activeIntegration);
} else {
  // Clear components when no integration is active
  IntroBannerComponent = null;
  ReportEndComponent = null;
  integrationFavicon = '';
  integrationComponentsLoaded = false;
}

async function loadIntegrationComponents(
  integration: typeof $activeIntegration
) {
  if (!integration) return;

  // Reset loaded state while loading
  integrationComponentsLoaded = false;

  try {
    // Load all components in parallel for better performance
    const [introBanner, reportEnd, favicon] = await Promise.all([
      loadIntroBanner(integration.id),
      loadReportEnd(integration.id),
      integration.getFavicon(),
    ]);

    // Only update if the integration hasn't changed during loading
    if ($activeIntegration?.id === integration.id) {
      IntroBannerComponent = introBanner;
      ReportEndComponent = reportEnd;
      integrationFavicon = favicon;
      integrationComponentsLoaded = true;
    }
  } catch (error) {
    console.error(
      `Failed to load integration components for ${integration.id}:`,
      error
    );
    integrationComponentsLoaded = false;
  }
}
</script>

<svelte:head>
  <!-- Google tag (gtag.js) -->
  <script
    async
    src="https://www.googletagmanager.com/gtag/js?id=AW-16669721864"
  >
  </script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    gtag('js', new Date());

    gtag('config', 'AW-16669721864');
  </script>
</svelte:head>

<Header active="Calculator" />

{#if showIntroBanner && IntroBannerComponent && $activeIntegration && integrationComponentsLoaded}
  <svelte:component this={IntroBannerComponent} />
{/if}

<main>
  {#if isPasteFlow}
    <PasteFlow ondone={pasteDone} onStarted={pasteStarted} />
  {:else}
    <Sidebar {integrationComponentsLoaded}>
      <!--
        This div ends up as the parent element for the position:sticky sliders
        inside the EarningsReport component. It closes at the end of this user's
        part of the report and another one is opened for the spouse's part.
      -->
      <div class="pageBreakAfter stickyContainer">
        {#if context.spouse}
          <SidebarSection
            label={context.recipient.shortName(15)}
            heading={true}
          >
            <h1 class="recipientName">
              <RecipientName r={context.recipient} noColor />
            </h1>
          </SidebarSection>
        {/if}
        {#if !context.recipient.isPiaOnly}
          <SidebarSection label="Earnings Report">
            <EarningsReport recipient={context.recipient} />
          </SidebarSection>
          <SidebarSection label="Benefits Eligibility" underSticky>
            <EligibilityReport recipient={context.recipient} />
          </SidebarSection>
          <SidebarSection label="Indexed Earnings" underSticky>
            <IndexedEarningsReport recipient={context.recipient} />
          </SidebarSection>
          <SidebarSection label="Primary Insurance Amount" underSticky>
            <PiaReport recipient={context.recipient} />
          </SidebarSection>
          <SidebarSection label="Sponsor - ProjectionLab" sponsor underSticky>
            <Sponsor recipient={context.recipient} />
          </SidebarSection>
          <SidebarSection label="Normal Retirement Age" underSticky>
            <NormalRetirementAgeReport recipient={context.recipient} />
          </SidebarSection>
          <SidebarSection label="Filing Date" underSticky>
            <FilingDateReport recipient={context.recipient} />
          </SidebarSection>
        {:else}
          <SidebarSection label="Primary Insurance Amount" underSticky>
            <PiaReport recipient={context.recipient} />
          </SidebarSection>
          <SidebarSection label="Sponsor - ProjectionLab" sponsor underSticky>
            <Sponsor recipient={context.recipient} />
          </SidebarSection>
          <SidebarSection label="Normal Retirement Age">
            <NormalRetirementAgeReport recipient={context.recipient} />
          </SidebarSection>
          <SidebarSection label="Filing Date">
            <FilingDateReport recipient={context.recipient} />
          </SidebarSection>
        {/if}
      </div>
      {#if context.spouse}
        <!--
          See the description of the purpose of this div above.
        -->
        <div class="pageBreakAfter stickyContainer">
          <SidebarSection label={context.spouse.shortName(15)} heading={true}>
            <h1 class="recipientName">
              <RecipientName r={context.spouse} noColor />
            </h1>
          </SidebarSection>
          {#if !context.spouse.isPiaOnly}
            <SidebarSection label="Earnings Report">
              <EarningsReport recipient={context.spouse} />
            </SidebarSection>
            <SidebarSection label="Benefits Eligibility" underSticky>
              <EligibilityReport recipient={context.spouse} />
            </SidebarSection>
            <SidebarSection label="Indexed Earnings" underSticky>
              <IndexedEarningsReport recipient={context.spouse} />
            </SidebarSection>
            <SidebarSection label="Primary Insurance Amount" underSticky>
              <PiaReport recipient={context.spouse} />
            </SidebarSection>
            <SidebarSection label="Normal Retirement Age" underSticky>
              <NormalRetirementAgeReport recipient={context.spouse} />
            </SidebarSection>
            <SidebarSection label="Filing Date" underSticky>
              <FilingDateReport recipient={context.spouse} />
            </SidebarSection>
          {:else}
            <SidebarSection label="Primary Insurance Amount" underSticky>
              <PiaReport recipient={context.spouse} />
            </SidebarSection>
            <SidebarSection label="Normal Retirement Age">
              <NormalRetirementAgeReport recipient={context.spouse} />
            </SidebarSection>
            <SidebarSection label="Filing Date">
              <FilingDateReport recipient={context.spouse} />
            </SidebarSection>
          {/if}
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
        <SidebarSection label="Survivor Benefit">
          <SurvivorReport
            recipient={context.recipient}
            spouse={context.spouse}
          />
        </SidebarSection>
      {/if}
      {#if ReportEndComponent && $activeIntegration && integrationComponentsLoaded}
        <SidebarSection
          label={$activeIntegration.reportEndLabel}
          integration={true}
          integrationFaviconPath={integrationFavicon}
        >
          <svelte:component
            this={ReportEndComponent}
            recipient={context.recipient}
            spouse={context.spouse}
          />
        </SidebarSection>
      {/if}
      <SidebarSection label="More Reading" heading={true}>
        <MoreResources />
      </SidebarSection>
    </Sidebar>
    <script>
      gtag('event', 'conversion', {
        send_to: 'AW-16669721864/KvxrCIjA3skZEIiK34w-',
        value: 1.0,
        currency: 'USD',
      });
    </script>
  {/if}
</main>

<div class="printFooter">https://ssa.tools/</div>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
  }
  .recipientName {
    text-decoration: underline;
  }
  @media screen {
    .printFooter {
      display: none;
    }
  }
  @media print {
    .printFooter {
      position: fixed;
      padding: 0.5em;
      bottom: 0;
      right: 0px;
    }
  }
</style>
