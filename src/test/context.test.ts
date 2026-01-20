/**
 * Tests for the context module and session persistence.
 */

import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};
const sessionStorageMock = {
  getItem: vi.fn((key: string) => mockSessionStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage[key];
  }),
  clear: vi.fn(() => {
    for (const key in mockSessionStorage) {
      delete mockSessionStorage[key];
    }
  }),
};

// Mock $app/environment
vi.mock('$app/environment', () => ({
  browser: true,
}));

// Set up sessionStorage mock globally
vi.stubGlobal('sessionStorage', sessionStorageMock);

// Import after mocking
import {
  clearSession,
  context,
  hasSession,
  isDemo,
  restoreSession,
  saveSession,
} from '$lib/context';

describe('Context session management', () => {
  beforeEach(() => {
    // Clear mocks and storage before each test
    vi.clearAllMocks();
    sessionStorageMock.clear();

    // Reset context state
    context.recipient = null;
    context.spouse = null;
    isDemo.set(false);
  });

  afterEach(() => {
    // Clean up after each test
    context.recipient = null;
    context.spouse = null;
  });

  describe('saveSession', () => {
    it('saves recipient to sessionStorage', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 6, 15);
      r.name = 'Test User';
      r.earningsRecords = [
        new EarningRecord({
          year: 2020,
          taxedEarnings: Money.from(50000),
          taxedMedicareEarnings: Money.from(50000),
        }),
      ];
      context.recipient = r;

      saveSession();

      expect(sessionStorageMock.setItem).toHaveBeenCalledTimes(1);
      const savedData = JSON.parse(sessionStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.recipient).not.toBeNull();
      expect(savedData.recipient.name).toBe('Test User');
      expect(savedData.spouse).toBeNull();
      expect(savedData.isDemo).toBe(false);
      expect(savedData.version).toBe(1);
    });

    it('saves both recipient and spouse', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 6, 15);
      r.name = 'Person 1';
      r.markFirst();

      const s = new Recipient();
      s.birthdate = Birthdate.FromYMD(1967, 3, 20);
      s.name = 'Person 2';
      s.markSecond();

      context.recipient = r;
      context.spouse = s;

      saveSession();

      const savedData = JSON.parse(sessionStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.recipient.name).toBe('Person 1');
      expect(savedData.spouse.name).toBe('Person 2');
    });

    it('sets isDemo flag when saving demo data', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      context.recipient = r;

      saveSession(true);

      const savedData = JSON.parse(sessionStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.isDemo).toBe(true);
      expect(get(isDemo)).toBe(true);
    });

    it('saves null when no recipient exists', () => {
      saveSession();

      const savedData = JSON.parse(sessionStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.recipient).toBeNull();
      expect(savedData.spouse).toBeNull();
    });
  });

  describe('restoreSession', () => {
    it('restores recipient from sessionStorage', () => {
      const sessionData = {
        recipient: {
          birthdate: { year: 1965, month: 6, day: 15 },
          name: 'Restored User',
          gender: 'female',
          healthMultiplier: 1.0,
          isPiaOnly: false,
          overridePiaCents: null,
          isFirst: true,
          earningsRecords: [
            {
              year: 2020,
              taxedEarningsCents: 5000000,
              taxedMedicareEarningsCents: 5000000,
              incomplete: false,
            },
          ],
        },
        spouse: null,
        isDemo: false,
        version: 1,
      };
      mockSessionStorage['ssa-tools-session'] = JSON.stringify(sessionData);

      const result = restoreSession();

      expect(result).toBe(true);
      expect(context.recipient).not.toBeNull();
      expect(context.recipient?.name).toBe('Restored User');
      expect(context.recipient?.birthdate.layBirthYear()).toBe(1965);
      expect(context.recipient?.earningsRecords).toHaveLength(1);
    });

    it('restores both recipient and spouse', () => {
      const sessionData = {
        recipient: {
          birthdate: { year: 1965, month: 6, day: 15 },
          name: 'Person 1',
          gender: 'male',
          healthMultiplier: 1.0,
          isPiaOnly: false,
          overridePiaCents: null,
          isFirst: true,
          earningsRecords: [],
        },
        spouse: {
          birthdate: { year: 1967, month: 3, day: 20 },
          name: 'Person 2',
          gender: 'female',
          healthMultiplier: 1.0,
          isPiaOnly: false,
          overridePiaCents: null,
          isFirst: false,
          earningsRecords: [],
        },
        isDemo: false,
        version: 1,
      };
      mockSessionStorage['ssa-tools-session'] = JSON.stringify(sessionData);

      const result = restoreSession();

      expect(result).toBe(true);
      expect(context.recipient?.name).toBe('Person 1');
      expect(context.recipient?.first).toBe(true);
      expect(context.spouse?.name).toBe('Person 2');
      expect(context.spouse?.first).toBe(false);
    });

    it('restores isDemo flag', () => {
      const sessionData = {
        recipient: {
          birthdate: { year: 1965, month: 0, day: 1 },
          name: 'Demo User',
          gender: 'blended',
          healthMultiplier: 1.0,
          isPiaOnly: false,
          overridePiaCents: null,
          isFirst: true,
          earningsRecords: [],
        },
        spouse: null,
        isDemo: true,
        version: 1,
      };
      mockSessionStorage['ssa-tools-session'] = JSON.stringify(sessionData);

      restoreSession();

      expect(get(isDemo)).toBe(true);
    });

    it('returns false when no session exists', () => {
      const result = restoreSession();

      expect(result).toBe(false);
      expect(context.recipient).toBeNull();
    });

    it('clears and returns false for incompatible version', () => {
      const sessionData = {
        recipient: {
          birthdate: { year: 1965, month: 0, day: 1 },
          name: 'Old Version User',
          gender: 'blended',
          healthMultiplier: 1.0,
          isPiaOnly: false,
          overridePiaCents: null,
          isFirst: true,
          earningsRecords: [],
        },
        spouse: null,
        isDemo: false,
        version: 999, // Invalid version
      };
      mockSessionStorage['ssa-tools-session'] = JSON.stringify(sessionData);

      const result = restoreSession();

      expect(result).toBe(false);
      expect(sessionStorageMock.removeItem).toHaveBeenCalled();
    });

    it('handles corrupted data gracefully', () => {
      mockSessionStorage['ssa-tools-session'] = 'not valid json';

      const result = restoreSession();

      expect(result).toBe(false);
    });
  });

  describe('clearSession', () => {
    it('removes session from storage and resets context', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      context.recipient = r;
      context.spouse = new Recipient();
      mockSessionStorage['ssa-tools-session'] = '{}';

      clearSession();

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'ssa-tools-session'
      );
      expect(context.recipient).toBeNull();
      expect(context.spouse).toBeNull();
      expect(get(isDemo)).toBe(false);
    });
  });

  describe('hasSession', () => {
    it('returns true when session exists', () => {
      mockSessionStorage['ssa-tools-session'] = '{}';

      expect(hasSession()).toBe(true);
    });

    it('returns false when no session exists', () => {
      expect(hasSession()).toBe(false);
    });
  });

  describe('round-trip integration', () => {
    it('saves and restores a complete session', () => {
      // Set up original data
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1970, 5, 10);
      r.name = 'Integration Test';
      r.gender = 'male';
      r.healthMultiplier = 1.1;
      r.earningsRecords = [
        new EarningRecord({
          year: 2015,
          taxedEarnings: Money.from(60000),
          taxedMedicareEarnings: Money.from(60000),
        }),
        new EarningRecord({
          year: 2016,
          taxedEarnings: Money.from(65000),
          taxedMedicareEarnings: Money.from(65000),
        }),
      ];

      context.recipient = r;
      saveSession(true);

      // Clear context
      context.recipient = null;
      isDemo.set(false);

      // Restore
      const result = restoreSession();

      expect(result).toBe(true);
      expect(context.recipient?.name).toBe('Integration Test');
      expect(context.recipient?.birthdate.layBirthYear()).toBe(1970);
      expect(context.recipient?.birthdate.layBirthMonth()).toBe(5);
      expect(context.recipient?.birthdate.layBirthDayOfMonth()).toBe(10);
      expect(context.recipient?.gender).toBe('male');
      expect(context.recipient?.healthMultiplier).toBe(1.1);
      expect(context.recipient?.earningsRecords).toHaveLength(2);
      expect(get(isDemo)).toBe(true);
    });

    it('saves and restores PIA-only recipient', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1960, 0, 1);
      r.setPia(Money.from(2500));
      r.name = 'PIA Only Test';

      context.recipient = r;
      saveSession();

      context.recipient = null;
      restoreSession();

      expect(context.recipient?.isPiaOnly).toBe(true);
      expect(context.recipient?.overridePia?.value()).toBe(2500);
      expect(context.recipient?.name).toBe('PIA Only Test');
    });
  });
});
