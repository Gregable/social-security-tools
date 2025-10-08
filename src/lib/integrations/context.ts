/**
 * Integration context for managing active third-party integrations.
 *
 * This module provides a Svelte store that tracks which integration
 * (if any) is currently active based on URL parameters.
 */

import { writable } from 'svelte/store';
import { getIntegration, type IntegrationConfig } from './config';

/**
 * Store for the currently active integration.
 * null if no integration is active.
 */
export const activeIntegration = writable<IntegrationConfig | null>(null);

/**
 * Parse the URL hash to detect integration parameter.
 * Expected format: #integration=opensocialsecurity.com
 * or combined with other params: #integration=opensocialsecurity.com&other=value
 */
export function parseIntegrationFromHash(): IntegrationConfig | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash;
  if (!hash) return null;

  // Remove the leading '#' and parse as URLSearchParams
  const params = new URLSearchParams(hash.substring(1));
  const integrationId = params.get('integration');

  if (!integrationId) return null;

  // Validate against allowed integrations
  const config = getIntegration(integrationId);
  if (!config) {
    console.warn(
      `Unknown integration ID in URL: ${integrationId}. Only whitelisted integrations are supported.`
    );
    return null;
  }

  return config;
}

/**
 * Initialize the integration context by parsing the URL.
 * Should be called on page mount.
 */
export function initializeIntegration(): void {
  const config = parseIntegrationFromHash();
  activeIntegration.set(config);
}

/**
 * Clear the active integration.
 */
export function clearIntegration(): void {
  activeIntegration.set(null);
}
