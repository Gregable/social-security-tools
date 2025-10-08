/**
 * Tests for the third-party integration configuration and context.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import {
  INTEGRATIONS,
  getIntegration,
  loadIntroBanner,
  loadReportEnd,
} from '$lib/integrations/config';
import {
  activeIntegration,
  parseIntegrationFromHash,
  initializeIntegration,
  clearIntegration,
} from '$lib/integrations/context';

describe('Integration Configuration', () => {
  it('should have Open Social Security registered', async () => {
    expect(INTEGRATIONS['opensocialsecurity.com']).toBeDefined();
    expect(INTEGRATIONS['opensocialsecurity.com'].id).toBe(
      'opensocialsecurity.com'
    );
    expect(INTEGRATIONS['opensocialsecurity.com'].displayName).toBe(
      'Open Social Security'
    );
    expect(INTEGRATIONS['opensocialsecurity.com'].getFavicon).toBeDefined();
    expect(typeof INTEGRATIONS['opensocialsecurity.com'].getFavicon).toBe(
      'function'
    );
    // Test that getFavicon returns a string
    const faviconUrl =
      await INTEGRATIONS['opensocialsecurity.com'].getFavicon();
    expect(faviconUrl).toBeDefined();
    expect(typeof faviconUrl).toBe('string');
  });

  it('should return integration config for valid ID', () => {
    const config = getIntegration('opensocialsecurity.com');
    expect(config).not.toBeNull();
    expect(config?.id).toBe('opensocialsecurity.com');
  });

  it('should return null for invalid integration ID', () => {
    const config = getIntegration('invalid-site.com');
    expect(config).toBeNull();
  });

  it('should return null for empty integration ID', () => {
    const config = getIntegration('');
    expect(config).toBeNull();
  });
});

describe('Integration Context', () => {
  let originalWindow: typeof globalThis.window;
  let mockSessionStorage: { [key: string]: string };

  beforeEach(() => {
    // Save original window if it exists
    if (typeof window !== 'undefined') {
      originalWindow = window;
    }

    // Reset mock sessionStorage
    mockSessionStorage = {};

    // Set up mock window with sessionStorage before clearing
    (globalThis as any).window = {
      location: { hash: '' },
      sessionStorage: {
        getItem: (key: string) => mockSessionStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockSessionStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockSessionStorage[key];
        },
      },
    };

    // Reset the store after mock is set up
    clearIntegration();
  });

  afterEach(() => {
    // Restore original window if it was saved
    if (originalWindow) {
      (globalThis as any).window = originalWindow;
    }
  });

  // Mock window.location.hash and sessionStorage
  const mockWindow = (hash: string) => {
    (globalThis as any).window = {
      location: { hash },
      sessionStorage: {
        getItem: (key: string) => mockSessionStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockSessionStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockSessionStorage[key];
        },
      },
    };
  };

  it('should parse valid integration from hash', () => {
    mockWindow('#integration=opensocialsecurity.com');
    const config = parseIntegrationFromHash();
    expect(config).not.toBeNull();
    expect(config?.id).toBe('opensocialsecurity.com');
  });

  it('should parse integration with other parameters', () => {
    mockWindow('#integration=opensocialsecurity.com&other=value');
    const config = parseIntegrationFromHash();
    expect(config).not.toBeNull();
    expect(config?.id).toBe('opensocialsecurity.com');
  });

  it('should return null for invalid integration ID', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    mockWindow('#integration=unknown-site.com');
    const config = parseIntegrationFromHash();
    expect(config).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown integration ID in URL')
    );
    consoleWarnSpy.mockRestore();
  });

  it('should return null when no integration parameter', () => {
    mockWindow('#results');
    const config = parseIntegrationFromHash();
    expect(config).toBeNull();
  });

  it('should return null when no hash', () => {
    mockWindow('');
    const config = parseIntegrationFromHash();
    expect(config).toBeNull();
  });

  it('should initialize integration store from URL', () => {
    mockWindow('#integration=opensocialsecurity.com');
    initializeIntegration();
    const storeValue = get(activeIntegration);
    expect(storeValue).not.toBeNull();
    expect(storeValue?.id).toBe('opensocialsecurity.com');
  });

  it('should clear active integration', () => {
    mockWindow('#integration=opensocialsecurity.com');
    initializeIntegration();
    expect(get(activeIntegration)).not.toBeNull();

    clearIntegration();
    expect(get(activeIntegration)).toBeNull();
  });

  it('should persist integration to sessionStorage', () => {
    mockWindow('#integration=opensocialsecurity.com');
    initializeIntegration();
    expect(mockSessionStorage['activeIntegrationId']).toBe(
      'opensocialsecurity.com'
    );
  });

  it('should restore integration from sessionStorage', () => {
    // Set up sessionStorage with an integration
    mockWindow('');
    mockSessionStorage['activeIntegrationId'] = 'opensocialsecurity.com';

    // Initialize without URL hash - should load from sessionStorage
    initializeIntegration();
    const storeValue = get(activeIntegration);
    expect(storeValue).not.toBeNull();
    expect(storeValue?.id).toBe('opensocialsecurity.com');
  });

  it('should prioritize URL hash over sessionStorage', () => {
    mockWindow('#integration=opensocialsecurity.com');
    // Put a different value in sessionStorage
    mockSessionStorage['activeIntegrationId'] = 'other-site.com';

    initializeIntegration();
    const storeValue = get(activeIntegration);
    expect(storeValue?.id).toBe('opensocialsecurity.com');
  });

  it('should clear sessionStorage when clearing integration', () => {
    mockWindow('#integration=opensocialsecurity.com');
    initializeIntegration();
    expect(mockSessionStorage['activeIntegrationId']).toBe(
      'opensocialsecurity.com'
    );

    clearIntegration();
    expect(mockSessionStorage['activeIntegrationId']).toBeUndefined();
  });
});

describe('Dynamic Component Loading', () => {
  it('should have component loader functions', () => {
    expect(loadIntroBanner).toBeDefined();
    expect(loadReportEnd).toBeDefined();
  });

  // Note: Testing actual dynamic imports is difficult in unit tests
  // as they require the actual component files to exist.
  // These would be better tested in integration or e2e tests.
});
