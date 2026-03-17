/**
 * Tests for the context module and session persistence.
 */

import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
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
  hasSession,
  higherEarnerFilingDate,
  isDemo,
  recipient,
  recipientFilingDate,
  restoreSession,
  saveSession,
  setHigherEarnerFilingDate,
  spouse,
  spouseFilingDate,
} from '$lib/context';

describe('Context session management', () => {
  beforeEach(() => {
    // Clear mocks and storage before each test
    vi.clearAllMocks();
    sessionStorageMock.clear();

    // Reset store state
    recipient.set(null);
    spouse.set(null);
    isDemo.set(false);
    recipientFilingDate.set(null);
    spouseFilingDate.set(null);
  });

  afterEach(() => {
    // Clean up after each test
    recipient.set(null);
    spouse.set(null);
    recipientFilingDate.set(null);
    spouseFilingDate.set(null);
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
      recipient.set(r);

      saveSession();

      expect(sessionStorageMock.setItem).toHaveBeenCalledTimes(1);
      const savedData = JSON.parse(sessionStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.recipient).not.toBeNull();
      expect(savedData.recipient.name).toBe('Test User');
      expect(savedData.spouse).toBeNull();
      expect(savedData.isDemo).toBe(false);
      expect(savedData.version).toBe(2);
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

      recipient.set(r);
      spouse.set(s);

      saveSession();

      const savedData = JSON.parse(sessionStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.recipient.name).toBe('Person 1');
      expect(savedData.spouse.name).toBe('Person 2');
    });

    it('sets isDemo flag when saving demo data', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      recipient.set(r);

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

    it('saves filing dates', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      recipient.set(r);

      const filingDate = MonthDate.initFromYearsMonths({
        years: 2032,
        months: 0,
      });
      recipientFilingDate.set(filingDate);

      saveSession();

      const savedData = JSON.parse(sessionStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.recipientFilingMonthsSinceEpoch).toBe(
        filingDate.monthsSinceEpoch()
      );
      expect(savedData.spouseFilingMonthsSinceEpoch).toBeNull();
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
        recipientFilingMonthsSinceEpoch: null,
        spouseFilingMonthsSinceEpoch: null,
        version: 2,
      };
      mockSessionStorage['ssa-tools-session'] = JSON.stringify(sessionData);

      const result = restoreSession();

      expect(result).toBe(true);
      expect(get(recipient)).not.toBeNull();
      expect(get(recipient)?.name).toBe('Restored User');
      expect(get(recipient)?.birthdate.layBirthYear()).toBe(1965);
      expect(get(recipient)?.earningsRecords).toHaveLength(1);
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

          earningsRecords: [],
        },
        spouse: {
          birthdate: { year: 1967, month: 3, day: 20 },
          name: 'Person 2',
          gender: 'female',
          healthMultiplier: 1.0,
          isPiaOnly: false,
          overridePiaCents: null,

          earningsRecords: [],
        },
        isDemo: false,
        recipientFilingMonthsSinceEpoch: null,
        spouseFilingMonthsSinceEpoch: null,
        version: 2,
      };
      mockSessionStorage['ssa-tools-session'] = JSON.stringify(sessionData);

      const result = restoreSession();

      expect(result).toBe(true);
      expect(get(recipient)?.name).toBe('Person 1');
      expect(get(recipient)?.first).toBe(true);
      expect(get(spouse)?.name).toBe('Person 2');
      expect(get(spouse)?.first).toBe(false);
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

          earningsRecords: [],
        },
        spouse: null,
        isDemo: true,
        recipientFilingMonthsSinceEpoch: null,
        spouseFilingMonthsSinceEpoch: null,
        version: 2,
      };
      mockSessionStorage['ssa-tools-session'] = JSON.stringify(sessionData);

      restoreSession();

      expect(get(isDemo)).toBe(true);
    });

    it('returns false when no session exists', () => {
      const result = restoreSession();

      expect(result).toBe(false);
      expect(get(recipient)).toBeNull();
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

    it('rejects v1 session data (missing filing date fields)', () => {
      const v1SessionData = {
        recipient: {
          birthdate: { year: 1965, month: 0, day: 1 },
          name: 'V1 User',
          gender: 'blended',
          healthMultiplier: 1.0,
          isPiaOnly: false,
          overridePiaCents: null,
          earningsRecords: [],
        },
        spouse: null,
        isDemo: false,
        version: 1,
      };
      mockSessionStorage['ssa-tools-session'] = JSON.stringify(v1SessionData);

      const result = restoreSession();

      expect(result).toBe(false);
      expect(get(recipient)).toBeNull();
      expect(sessionStorageMock.removeItem).toHaveBeenCalled();
    });

    it('handles corrupted data gracefully', () => {
      mockSessionStorage['ssa-tools-session'] = 'not valid json';

      const result = restoreSession();

      expect(result).toBe(false);
    });

    it('restores filing dates', () => {
      const filingMonths = MonthDate.initFromYearsMonths({
        years: 2032,
        months: 6,
      }).monthsSinceEpoch();

      const sessionData = {
        recipient: {
          birthdate: { year: 1965, month: 0, day: 1 },
          name: 'Test',
          gender: 'blended',
          healthMultiplier: 1.0,
          isPiaOnly: false,
          overridePiaCents: null,
          earningsRecords: [],
        },
        spouse: null,
        isDemo: false,
        recipientFilingMonthsSinceEpoch: filingMonths,
        spouseFilingMonthsSinceEpoch: null,
        version: 2,
      };
      mockSessionStorage['ssa-tools-session'] = JSON.stringify(sessionData);

      restoreSession();

      const restoredDate = get(recipientFilingDate);
      expect(restoredDate).not.toBeNull();
      expect(restoredDate!.monthsSinceEpoch()).toBe(filingMonths);
      expect(get(spouseFilingDate)).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('removes session from storage and resets stores', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      recipient.set(r);
      spouse.set(new Recipient());
      mockSessionStorage['ssa-tools-session'] = '{}';

      clearSession();

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'ssa-tools-session'
      );
      expect(get(recipient)).toBeNull();
      expect(get(spouse)).toBeNull();
      expect(get(isDemo)).toBe(false);
      expect(get(recipientFilingDate)).toBeNull();
      expect(get(spouseFilingDate)).toBeNull();
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

  describe('higherEarnerFilingDate', () => {
    it('returns null when no spouse', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      r.setPia(Money.from(2000));
      recipient.set(r);

      recipientFilingDate.set(
        MonthDate.initFromYearsMonths({ years: 2032, months: 0 })
      );

      expect(get(higherEarnerFilingDate)).toBeNull();
    });

    it('returns recipient filing date when recipient earns more', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      r.setPia(Money.from(3000));
      r.markFirst();

      const s = new Recipient();
      s.birthdate = Birthdate.FromYMD(1965, 0, 1);
      s.setPia(Money.from(1000));
      s.markSecond();

      recipient.set(r);
      spouse.set(s);

      const rDate = MonthDate.initFromYearsMonths({ years: 2032, months: 0 });
      const sDate = MonthDate.initFromYearsMonths({ years: 2033, months: 6 });
      recipientFilingDate.set(rDate);
      spouseFilingDate.set(sDate);

      expect(get(higherEarnerFilingDate)?.monthsSinceEpoch()).toBe(
        rDate.monthsSinceEpoch()
      );
    });

    it('returns spouse filing date when spouse earns more', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      r.setPia(Money.from(1000));
      r.markFirst();

      const s = new Recipient();
      s.birthdate = Birthdate.FromYMD(1965, 0, 1);
      s.setPia(Money.from(3000));
      s.markSecond();

      recipient.set(r);
      spouse.set(s);

      const rDate = MonthDate.initFromYearsMonths({ years: 2032, months: 0 });
      const sDate = MonthDate.initFromYearsMonths({ years: 2033, months: 6 });
      recipientFilingDate.set(rDate);
      spouseFilingDate.set(sDate);

      expect(get(higherEarnerFilingDate)?.monthsSinceEpoch()).toBe(
        sDate.monthsSinceEpoch()
      );
    });

    it('re-evaluates when recipient store changes', () => {
      // Start with no recipients
      expect(get(higherEarnerFilingDate)).toBeNull();

      // Add recipients
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      r.setPia(Money.from(3000));
      r.markFirst();

      const s = new Recipient();
      s.birthdate = Birthdate.FromYMD(1965, 0, 1);
      s.setPia(Money.from(1000));
      s.markSecond();

      const rDate = MonthDate.initFromYearsMonths({ years: 2032, months: 0 });
      recipientFilingDate.set(rDate);
      spouseFilingDate.set(
        MonthDate.initFromYearsMonths({ years: 2033, months: 6 })
      );

      recipient.set(r);
      spouse.set(s);

      // Should now return a value
      expect(get(higherEarnerFilingDate)).not.toBeNull();

      // Clear recipient - should go back to null
      recipient.set(null);
      expect(get(higherEarnerFilingDate)).toBeNull();
    });
  });

  describe('setHigherEarnerFilingDate', () => {
    it('sets recipient filing date when recipient earns more', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      r.setPia(Money.from(3000));
      r.markFirst();

      const s = new Recipient();
      s.birthdate = Birthdate.FromYMD(1965, 0, 1);
      s.setPia(Money.from(1000));
      s.markSecond();

      recipient.set(r);
      spouse.set(s);

      const date = MonthDate.initFromYearsMonths({ years: 2032, months: 0 });
      setHigherEarnerFilingDate(date);

      expect(get(recipientFilingDate)?.monthsSinceEpoch()).toBe(
        date.monthsSinceEpoch()
      );
      expect(get(spouseFilingDate)).toBeNull();
    });

    it('sets spouse filing date when spouse earns more', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      r.setPia(Money.from(1000));
      r.markFirst();

      const s = new Recipient();
      s.birthdate = Birthdate.FromYMD(1965, 0, 1);
      s.setPia(Money.from(3000));
      s.markSecond();

      recipient.set(r);
      spouse.set(s);

      const date = MonthDate.initFromYearsMonths({ years: 2033, months: 6 });
      setHigherEarnerFilingDate(date);

      expect(get(spouseFilingDate)?.monthsSinceEpoch()).toBe(
        date.monthsSinceEpoch()
      );
      expect(get(recipientFilingDate)).toBeNull();
    });

    it('is a no-op when recipient or spouse is null', () => {
      const date = MonthDate.initFromYearsMonths({ years: 2032, months: 0 });

      setHigherEarnerFilingDate(date);

      expect(get(recipientFilingDate)).toBeNull();
      expect(get(spouseFilingDate)).toBeNull();
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

      recipient.set(r);
      saveSession(true);

      // Clear stores
      recipient.set(null);
      isDemo.set(false);

      // Restore
      const result = restoreSession();

      expect(result).toBe(true);
      expect(get(recipient)?.name).toBe('Integration Test');
      expect(get(recipient)?.birthdate.layBirthYear()).toBe(1970);
      expect(get(recipient)?.birthdate.layBirthMonth()).toBe(5);
      expect(get(recipient)?.birthdate.layBirthDayOfMonth()).toBe(10);
      expect(get(recipient)?.gender).toBe('male');
      expect(get(recipient)?.healthMultiplier).toBe(1.1);
      expect(get(recipient)?.earningsRecords).toHaveLength(2);
      expect(get(isDemo)).toBe(true);
    });

    it('saves and restores PIA-only recipient', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1960, 0, 1);
      r.setPia(Money.from(2500));
      r.name = 'PIA Only Test';

      recipient.set(r);
      saveSession();

      recipient.set(null);
      restoreSession();

      expect(get(recipient)?.isPiaOnly).toBe(true);
      expect(get(recipient)?.overridePia?.value()).toBe(2500);
      expect(get(recipient)?.name).toBe('PIA Only Test');
    });

    it('saves and restores filing dates', () => {
      const r = new Recipient();
      r.birthdate = Birthdate.FromYMD(1965, 0, 1);
      r.markFirst();
      recipient.set(r);

      const s = new Recipient();
      s.birthdate = Birthdate.FromYMD(1967, 0, 1);
      s.markSecond();
      spouse.set(s);

      const rFiling = MonthDate.initFromYearsMonths({
        years: 2032,
        months: 3,
      });
      const sFiling = MonthDate.initFromYearsMonths({
        years: 2034,
        months: 9,
      });
      recipientFilingDate.set(rFiling);
      spouseFilingDate.set(sFiling);

      saveSession();

      // Clear
      recipient.set(null);
      spouse.set(null);
      recipientFilingDate.set(null);
      spouseFilingDate.set(null);

      // Restore
      restoreSession();

      const restoredR = get(recipientFilingDate);
      expect(restoredR).not.toBeNull();
      expect(restoredR!.year()).toBe(2032);
      expect(restoredR!.monthIndex()).toBe(3);

      const restoredS = get(spouseFilingDate);
      expect(restoredS).not.toBeNull();
      expect(restoredS!.year()).toBe(2034);
      expect(restoredS!.monthIndex()).toBe(9);
    });
  });
});
