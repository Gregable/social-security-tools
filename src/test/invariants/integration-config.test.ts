/**
 * Integration configuration invariant tests.
 *
 * These tests ensure that integration configurations maintain required
 * invariants - particularly that integration IDs match their dictionary keys
 * and that all required properties are present.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getIntegration, INTEGRATIONS } from '$lib/integrations/config';

describe('Integration configuration invariants', () => {
  const allIntegrationIds = Object.keys(INTEGRATIONS);

  describe('ID consistency', () => {
    it.each(allIntegrationIds)(
      'integration %s has matching id and key',
      (key) => {
        const config = INTEGRATIONS[key];
        expect(config.id).toBe(key);
      }
    );

    it.each(allIntegrationIds)(
      'integration %s is retrievable via getIntegration',
      (id) => {
        const config = getIntegration(id);
        expect(config).not.toBeNull();
        expect(config!.id).toBe(id);
      }
    );
  });

  describe('Required properties', () => {
    it.each(allIntegrationIds)(
      'integration %s has a non-empty displayName',
      (id) => {
        const config = INTEGRATIONS[id];
        expect(typeof config.displayName).toBe('string');
        expect(config.displayName.length).toBeGreaterThan(0);
      }
    );

    it.each(allIntegrationIds)(
      'integration %s has a reportEndLabel string',
      (id) => {
        const config = INTEGRATIONS[id];
        expect(typeof config.reportEndLabel).toBe('string');
      }
    );

    it.each(allIntegrationIds)(
      'integration %s has a getFavicon function',
      (id) => {
        const config = INTEGRATIONS[id];
        expect(typeof config.getFavicon).toBe('function');
      }
    );
  });

  describe('Component directories', () => {
    it.each(allIntegrationIds)(
      'integration %s has a component directory',
      (id) => {
        const componentDir = resolve(
          process.cwd(),
          `src/lib/components/integrations/${id}`
        );
        expect(
          existsSync(componentDir),
          `Missing directory: ${componentDir}`
        ).toBe(true);
      }
    );

    it.each(allIntegrationIds)(
      'integration %s has an IntroBanner.svelte',
      (id) => {
        const introBannerPath = resolve(
          process.cwd(),
          `src/lib/components/integrations/${id}/IntroBanner.svelte`
        );
        expect(
          existsSync(introBannerPath),
          `Missing IntroBanner: ${introBannerPath}`
        ).toBe(true);
      }
    );
  });

  describe('Optional properties validation', () => {
    it.each(allIntegrationIds)(
      'integration %s maxHouseholdMembers is positive integer if set',
      (id) => {
        const config = INTEGRATIONS[id];
        if (config.maxHouseholdMembers !== undefined) {
          expect(Number.isInteger(config.maxHouseholdMembers)).toBe(true);
          expect(config.maxHouseholdMembers).toBeGreaterThan(0);
        }
      }
    );
  });

  describe('Registry completeness', () => {
    it('should have at least one integration', () => {
      expect(allIntegrationIds.length).toBeGreaterThan(0);
    });

    it('getIntegration returns null for unknown IDs', () => {
      expect(getIntegration('nonexistent.integration.com')).toBeNull();
      expect(getIntegration('')).toBeNull();
    });
  });
});
