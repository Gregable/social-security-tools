<script lang="ts">
  // Shared banner component for integration intro messages
  export let logo: string;
  export let logoAlt: string;
  // Whether the report is currently being displayed (not in paste flow)
  export let isReportView: boolean = false;
  // Integration name for the CTA button text (if empty, no CTA shown)
  export let integrationName: string = "";
  // Label for sticky header when no CTA is needed (e.g. Fin Pods AI)
  export let stickyLabel: string = "";
  // External link for the CTA button (opens in new tab)
  export let externalLink: string = "";

  function scrollToIntegrationSection() {
    // Find the integration section by its data attribute
    const element = document.querySelector('[data-integration="true"]');
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
</script>

<div class="intro-banner" class:in-report={isReportView}>
  <div class="banner-content">
    {#if !isReportView}
      <img src={logo} alt={logoAlt} class="logo" />
    {/if}
    <div class="message">
      <slot></slot>
    </div>
  </div>
</div>
{#if (integrationName || stickyLabel || externalLink) && isReportView}
  <div class="cta-container">
    {#if externalLink}
      <a
        href={externalLink}
        target="_blank"
        rel="noopener noreferrer"
        class="cta-button"
      >
        <img src={logo} alt={logoAlt} class="logo" />
        Return to {integrationName || stickyLabel || "Integration"} ↗
      </a>
    {:else if integrationName}
      <button
        on:click={scrollToIntegrationSection}
        class="cta-button"
        type="button"
        aria-label="Jump to integration section"
      >
        <img src={logo} alt={logoAlt} class="logo" />
        Scroll to {integrationName} Section ↓
      </button>
    {:else}
      <div class="cta-button static-badge">
        <img src={logo} alt={logoAlt} class="logo" />
        {stickyLabel}
      </div>
    {/if}
  </div>
{/if}

<style>
  .intro-banner {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border-left: 4px solid #1976d2;
    margin: 1.5em auto 0;
    padding: 0.75em 1em;
    max-width: 1080px;
    border-radius: 4px 4px 0 0;
  }

  .intro-banner.in-report {
    border-left: none;
  }

  .banner-content {
    color: #0d47a1;
    font-size: 0.95em;
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  .logo {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 2px;
  }

  .message {
    flex: 1;
  }

  .cta-container {
    position: sticky;
    top: 0;
    z-index: 6;
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    display: flex;
    justify-content: center;
    padding: 0.75em 1em;
    margin: 0 auto 1em;
    max-width: 1080px;
    border-radius: 0 0 4px 4px;
  }

  .cta-button {
    background-color: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5em 1em;
    font-size: 0.9em;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.2s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 0.5em;
    text-decoration: none;
  }

  .cta-button .logo {
    width: 20px;
    height: 20px;
  }

  .cta-button:hover {
    background-color: #1565c0;
  }

  .cta-button:active {
    background-color: #0d47a1;
  }

  .cta-button:focus-visible {
    outline: 2px solid #0d47a1;
    outline-offset: 2px;
  }

  .cta-button.static-badge {
    cursor: default;
  }

  .cta-button.static-badge:hover {
    background-color: #1976d2;
  }

  @media print {
    .intro-banner {
      display: none;
    }
  }

  @media screen and (max-width: 600px) {
    .intro-banner {
      margin: 1em 0.5em 0;
      padding: 0.5em 0.75em;
    }
    .banner-content {
      font-size: 0.9em;
    }
    .cta-container {
      margin-top: 0.5em;
    }
  }
</style>
