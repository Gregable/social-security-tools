/**
 * Integration context for managing active third-party integrations.
 *
 * This module provides a Svelte store that tracks which integration
 * (if any) is currently active based on URL parameters.
 */

import { writable } from 'svelte/store';
import { getIntegration, type IntegrationConfig } from './config';

const SESSION_STORAGE_KEY = 'activeIntegrationId';

/**
 * Store for the currently active integration.
 * null if no integration is active.
 */
export const activeIntegration = writable<IntegrationConfig | null>(null);

/**
 * Save integration ID to session storage.
 */
function saveIntegrationToSession(integrationId: string | null): void {
  if (typeof window === 'undefined') return;
  if (integrationId) {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, integrationId);
  } else {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

/**
 * Load integration ID from session storage.
 */
function loadIntegrationFromSession(): IntegrationConfig | null {
  if (typeof window === 'undefined') return null;
  const integrationId = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!integrationId) return null;
  return getIntegration(integrationId);
}

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
 * Initialize the integration context by parsing the URL or session storage.
 * Priority: URL hash > session storage
 * Should be called on page mount.
 */
export function initializeIntegration(): void {
  // First try URL hash (explicit parameter takes precedence)
  let config = parseIntegrationFromHash();

  // If not in URL, try session storage
  if (!config) {
    config = loadIntegrationFromSession();
  }

  // Save to session storage if found
  if (config) {
    saveIntegrationToSession(config.id);
  }

  activeIntegration.set(config);
}

/**
 * Clear the active integration from both store and session storage.
 */
export function clearIntegration(): void {
  activeIntegration.set(null);
  saveIntegrationToSession(null);
}
