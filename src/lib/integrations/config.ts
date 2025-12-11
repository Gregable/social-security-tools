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
  /** Maximum number of household members the integration supports */
  maxHouseholdMembers?: number;
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
  'linopt.com': {
    id: 'linopt.com',
    displayName: 'Linopt',
    reportEndLabel: 'Linopt',
    getFavicon: async () => {
      const module = await import(
        '../components/integrations/linopt.com/linopt-fig.png'
      );
      return module.default;
    },
  },
  'firecalc.com': {
    id: 'firecalc.com',
    displayName: 'FIRECalc',
    reportEndLabel: 'FIRECalc',
    getFavicon: async () => {
      const module = await import(
        '../components/integrations/firecalc.com/firecalc-icon.svg'
      );
      return module.default;
    },
  },
  'ficalc.app': {
    id: 'ficalc.app',
    displayName: 'FI Calc',
    reportEndLabel: 'FI Calc',
    getFavicon: async () => {
      const module = await import(
        '../components/integrations/ficalc.app/favicon.ico'
      );
      return module.default;
    },
  },
  'cfiresim.com': {
    id: 'cfiresim.com',
    displayName: 'cFIREsim',
    reportEndLabel: 'cFIREsim',
    getFavicon: async () => {
      const module = await import(
        '../components/integrations/cfiresim.com/cfiresim-logo.svg'
      );
      return module.default;
    },
  },
  'finpodsai.com': {
    id: 'finpodsai.com',
    displayName: 'Fin Pods AI',
    reportEndLabel: '',
    getFavicon: async () => {
      const module = await import(
        '../components/integrations/finpodsai.com/favicon.ico'
      );
      return module.default;
    },
  },
  'owlplanner.streamlit.app': {
    id: 'owlplanner.streamlit.app',
    displayName: 'Owl Retirement Planner',
    reportEndLabel: 'Owl Retirement Planner',
    maxHouseholdMembers: 1,
    getFavicon: async () => {
      const module = await import(
        '../components/integrations/owlplanner.streamlit.app/owl.png'
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
 * Returns null if the component doesn't exist (some integrations may only have IntroBanner).
 */
export async function loadReportEnd(
  integrationId: string
): Promise<ComponentType<SvelteComponent> | null> {
  try {
    const module = await import(
      `$lib/components/integrations/${integrationId}/ReportEnd.svelte`
    );
    return module.default;
  } catch (_e) {
    // Silently return null if the ReportEnd component doesn't exist
    // Some integrations may only have an IntroBanner component
    return null;
  }
}
