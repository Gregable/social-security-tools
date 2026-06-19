<script lang="ts">
import type { ComponentType, SvelteComponent } from 'svelte';
import { onMount } from 'svelte';
import CombinedChart from '$lib/components/CombinedChart.svelte';
import CombinedHeading from '$lib/components/CombinedHeading.svelte';
import CopyForAiButton from '$lib/components/CopyForAiButton.svelte';
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
import StrategyPromo from '$lib/components/StrategyPromo.svelte';
import SurvivorReport from '$lib/components/SurvivorReport.svelte';
import { recipient, spouse } from '$lib/context';
import { loadIntroBanner, loadReportEnd } from '$lib/integrations/config';
import {
  activeIntegration,
  initializeIntegration,
} from '$lib/integrations/context';
import {
  WebApplicationSchema,
  renderActionSchema,
  renderWebsiteSocialMeta,
} from '$lib/schema-org';

const pageTitle = 'Social Security Calculator - SSA.tools';
const pageDescription =
  'Free social security calculator. Copy and paste your earnings record from ssa.gov to instantly calculate your retirement benefits, PIA, and optimal filing date.';
const pageUrl = 'https://ssa.tools/calculator';
const pageImageAlt = 'Social Security benefits calculator tool';

const webAppSchema = new WebApplicationSchema();
webAppSchema.url = pageUrl;
webAppSchema.name = pageTitle;
webAppSchema.description = pageDescription;

const calculatorActionJsonLd = renderActionSchema({
  name: 'Calculate Social Security retirement benefits',
  description:
    'Pre-populate the SSA.tools calculator from URL hash parameters. Accepts either a Primary Insurance Amount (pia1/pia2) or a year-by-year earnings history (earnings1/earnings2) for one or two recipients.',
  urlTemplate:
    'https://ssa.tools/calculator#pia1={pia1}&dob1={dob1}&name1={name1?}&pia2={pia2?}&dob2={dob2?}&name2={name2?}&earnings1={earnings1?}&earnings2={earnings2?}',
  targetUrl: pageUrl,
  parameters: [
    {
      name: 'pia1',
      description:
        'Primary Insurance Amount in whole US dollars for recipient 1. Required unless earnings1 is supplied.',
      required: false,
      valuePattern: '^\\d+$',
    },
    {
      name: 'earnings1',
      description:
        'Year-by-year earnings history for recipient 1 as comma-separated year:amount pairs, e.g. 2020:50000,2021:55000. Years 1951-2100; amounts are non-negative integer USD.',
      required: false,
    },
    {
      name: 'dob1',
      description: 'Date of birth for recipient 1 in YYYY-MM-DD format.',
      required: true,
      valuePattern: '^\\d{4}-\\d{2}-\\d{2}$',
    },
    {
      name: 'name1',
      description: 'Display name for recipient 1.',
      required: false,
    },
    {
      name: 'pia2',
      description:
        "Spouse's Primary Insurance Amount in whole US dollars (couple mode).",
      required: false,
      valuePattern: '^\\d+$',
    },
    {
      name: 'earnings2',
      description:
        "Spouse's earnings history in the same year:amount,... format as earnings1.",
      required: false,
    },
    {
      name: 'dob2',
      description: "Spouse's date of birth in YYYY-MM-DD format.",
      required: false,
      valuePattern: '^\\d{4}-\\d{2}-\\d{2}$',
    },
    {
      name: 'name2',
      description: "Spouse's display name.",
      required: false,
    },
  ],
});

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

    // Race condition guard: if multiple loads are in flight (e.g., integration
    // changed while loading), only apply results if this load's integration is
    // still the active one. Stale loads are safely discarded.
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
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <link rel="canonical" href={pageUrl} />

  <!-- Open Graph / Social Meta Tags -->
  {@html renderWebsiteSocialMeta({
    url: pageUrl,
    title: pageTitle,
    description: pageDescription,
    imageAlt: pageImageAlt,
  })}

  <!-- Structured Data -->
  {@html webAppSchema.render()}
  {@html calculatorActionJsonLd}

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
    gtag("js", new Date());

    gtag("config", "AW-16669721864");
  </script>
</svelte:head>

<Header active="Calculator" />

{#if showIntroBanner && IntroBannerComponent && $activeIntegration && integrationComponentsLoaded && isPasteFlow}
  <svelte:component this={IntroBannerComponent} isReportView={false} />
{/if}

<main>
  {#if isPasteFlow}
    <PasteFlow ondone={pasteDone} onStarted={pasteStarted} />
  {:else}
    <Sidebar {integrationComponentsLoaded}>
      {#if showIntroBanner && IntroBannerComponent && $activeIntegration && integrationComponentsLoaded}
        <svelte:component this={IntroBannerComponent} isReportView={true} />
      {/if}
      <!--
        This div ends up as the parent element for the position:sticky sliders
        inside the EarningsReport component. It closes at the end of this user's
        part of the report and another one is opened for the spouse's part.
      -->
      <div class="pageBreakAfter stickyContainer">
        {#if $spouse}
          <SidebarSection
            label={$recipient.shortName(15)}
            heading={true}
          >
            <h1 class="recipientName">
              <RecipientName r={$recipient} noColor />
            </h1>
          </SidebarSection>
        {/if}
        {#if !$recipient.isPiaOnly}
          <SidebarSection label="Earnings Report">
            <EarningsReport recipient={$recipient} />
          </SidebarSection>
          <SidebarSection label="Benefits Eligibility" underSticky>
            <EligibilityReport recipient={$recipient} />
          </SidebarSection>
          <SidebarSection label="Indexed Earnings" underSticky>
            <IndexedEarningsReport recipient={$recipient} />
          </SidebarSection>
          <SidebarSection label="Primary Insurance Amount" underSticky>
            <PiaReport recipient={$recipient} />
          </SidebarSection>
          {#if !$activeIntegration}
            <SidebarSection label="Sponsor - ProjectionLab" sponsor underSticky>
              <Sponsor recipient={$recipient} />
            </SidebarSection>
          {/if}
          <SidebarSection label="Normal Retirement Age" underSticky>
            <NormalRetirementAgeReport recipient={$recipient} />
          </SidebarSection>
          <SidebarSection label="Filing Strategy" underSticky>
            <FilingDateReport recipient={$recipient} />
            {#if !$activeIntegration && !$spouse}
              <StrategyPromo recipient={$recipient} spouse={null} />
            {/if}
          </SidebarSection>
        {:else}
          <SidebarSection label="Primary Insurance Amount" underSticky>
            <PiaReport recipient={$recipient} />
          </SidebarSection>
          {#if !$activeIntegration}
            <SidebarSection label="Sponsor - ProjectionLab" sponsor underSticky>
              <Sponsor recipient={$recipient} />
            </SidebarSection>
          {/if}
          <SidebarSection label="Normal Retirement Age">
            <NormalRetirementAgeReport recipient={$recipient} />
          </SidebarSection>
          <SidebarSection label="Filing Strategy">
            <FilingDateReport recipient={$recipient} />
            {#if !$activeIntegration && !$spouse}
              <StrategyPromo recipient={$recipient} spouse={null} />
            {/if}
          </SidebarSection>
        {/if}
      </div>
      {#if $spouse}
        <!--
          See the description of the purpose of this div above.
        -->
        <div class="pageBreakAfter stickyContainer">
          <SidebarSection label={$spouse.shortName(15)} heading={true}>
            <h1 class="recipientName">
              <RecipientName r={$spouse} noColor />
            </h1>
          </SidebarSection>
          {#if !$spouse.isPiaOnly}
            <SidebarSection label="Earnings Report">
              <EarningsReport recipient={$spouse} />
            </SidebarSection>
            <SidebarSection label="Benefits Eligibility" underSticky>
              <EligibilityReport recipient={$spouse} />
            </SidebarSection>
            <SidebarSection label="Indexed Earnings" underSticky>
              <IndexedEarningsReport recipient={$spouse} />
            </SidebarSection>
            <SidebarSection label="Primary Insurance Amount" underSticky>
              <PiaReport recipient={$spouse} />
            </SidebarSection>
            <SidebarSection label="Normal Retirement Age" underSticky>
              <NormalRetirementAgeReport recipient={$spouse} />
            </SidebarSection>
            <SidebarSection label="Filing Date" underSticky>
              <FilingDateReport recipient={$spouse} />
            </SidebarSection>
          {:else}
            <SidebarSection label="Primary Insurance Amount" underSticky>
              <PiaReport recipient={$spouse} />
            </SidebarSection>
            <SidebarSection label="Normal Retirement Age">
              <NormalRetirementAgeReport recipient={$spouse} />
            </SidebarSection>
            <SidebarSection label="Filing Date">
              <FilingDateReport recipient={$spouse} />
            </SidebarSection>
          {/if}
        </div>
        <SidebarSection label="Combined" heading={true}>
          <CombinedHeading />
        </SidebarSection>
        <SidebarSection label="Spousal Benefits">
          <SpousalReport
            recipient={$recipient}
            spouse={$spouse}
          />
        </SidebarSection>
        <SidebarSection label="Filing Strategy">
          <CombinedChart
            recipient={$recipient}
            spouse={$spouse}
          />
          {#if !$activeIntegration}
            <StrategyPromo recipient={$recipient} spouse={$spouse} />
          {/if}
        </SidebarSection>
        <SidebarSection label="Survivor Benefit">
          <SurvivorReport
            recipient={$recipient}
            spouse={$spouse}
          />
        </SidebarSection>
      {/if}
      {#if $activeIntegration && ReportEndComponent && integrationComponentsLoaded}
        <SidebarSection
          label={$activeIntegration.reportEndLabel}
          integration={true}
          integrationFaviconPath={integrationFavicon}
        >
          <svelte:component
            this={ReportEndComponent}
            recipient={$recipient}
            spouse={$spouse}
          />
        </SidebarSection>
      {/if}
      <SidebarSection label="Copy for AI" heading={true}>
        <div class="copyForAiSection">
          <h2>Copy for AI assistant</h2>
          <p>
            Turn this entire report into a self-contained markdown summary you
            can paste into ChatGPT, Claude, or another AI assistant — then ask
            follow-up questions about your own Social Security benefits.
          </p>
          <CopyForAiButton recipient={$recipient} spouse={$spouse} />
        </div>
      </SidebarSection>
      <SidebarSection label="More Reading" heading={true}>
        <MoreResources />
      </SidebarSection>
    </Sidebar>
    <script>
      gtag("event", "conversion", {
        send_to: "AW-16669721864/KvxrCIjA3skZEIiK34w-",
        value: 1.0,
        currency: "USD",
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
  .copyForAiSection {
    margin: 0 0.5em;
  }
  .copyForAiSection p {
    max-width: 640px;
    line-height: 1.5;
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
