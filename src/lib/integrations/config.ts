/**
 * Configuration for third-party site integrations.
 *
 * This module defines the registry of allowed third-party integrations
 * that can display custom content within the calculator.
 */

import type { ComponentType, SvelteComponent } from 'svelte';

/**
 * Configuration for a single integration.
 */
export interface IntegrationConfig {
  /** Unique identifier for the integration (matches URL parameter) */
  id: string;
  /** Display name of the integration */
  displayName: string;
  /** Label for the report end section in the sidebar */
  reportEndLabel: string;
  /** Function that returns the favicon URL (processed by Vite) */
  getFavicon: () => Promise<string>;
}

/**
 * Registry of all supported integrations.
 * Only integrations listed here will be activated via URL parameters.
 */
export const INTEGRATIONS: Record<string, IntegrationConfig> = {
  'opensocialsecurity.com': {
    id: 'opensocialsecurity.com',
    displayName: 'Open Social Security',
    reportEndLabel: 'Open Social Security',
    getFavicon: async () => {
      const module = await import(
        '../components/integrations/opensocialsecurity.com/favicon.ico'
      );
      return module.default;
    },
  },
};

/**
 * Get integration configuration by ID.
 * Returns null if the integration ID is not in the allowed list.
 */
export function getIntegration(id: string): IntegrationConfig | null {
  return INTEGRATIONS[id] || null;
}

/**
 * Dynamically import the IntroBanner component for a given integration.
 */
export async function loadIntroBanner(
  integrationId: string
): Promise<ComponentType<SvelteComponent> | null> {
  try {
    const module = await import(
      `$lib/components/integrations/${integrationId}/IntroBanner.svelte`
    );
    return module.default;
  } catch (e) {
    console.error(
      `Failed to load IntroBanner for integration: ${integrationId}`,
      e
    );
    return null;
  }
}

/**
 * Dynamically import the ReportEnd component for a given integration.
 */
export async function loadReportEnd(
  integrationId: string
): Promise<ComponentType<SvelteComponent> | null> {
  try {
    const module = await import(
      `$lib/components/integrations/${integrationId}/ReportEnd.svelte`
    );
    return module.default;
  } catch (e) {
    console.error(
      `Failed to load ReportEnd for integration: ${integrationId}`,
      e
    );
    return null;
  }
}
