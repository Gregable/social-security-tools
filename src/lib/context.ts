/**
 * Global context for the application.
 *
 * All reactive state is exposed as Svelte stores for uniform access
 * and proper reactivity tracking.
 */

import { derived, get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { higherEarningsThan } from './benefit-calculator';
import { MonthDate } from './month-time';
import { Recipient, type SerializedRecipient } from './recipient';

const SESSION_KEY = 'ssa-tools-session';

interface SerializedSession {
  recipient: SerializedRecipient | null;
  spouse: SerializedRecipient | null;
  isDemo: boolean;
  recipientFilingMonthsSinceEpoch: number | null;
  spouseFilingMonthsSinceEpoch: number | null;
  version: number;
}

const SESSION_VERSION = 2;

// Core recipient stores
export const recipient = writable<Recipient | null>(null);
export const spouse = writable<Recipient | null>(null);

/**
 * Flag to track if current data is demo data.
 */
export const isDemo = writable<boolean>(false);

/**
 * Save the current session to sessionStorage.
 * Call this after paste flow completes.
 */
export function saveSession(demo: boolean = false): void {
  if (!browser) return;

  const r = get(recipient);
  const s = get(spouse);

  const session: SerializedSession = {
    recipient: r?.serialize() ?? null,
    spouse: s?.serialize() ?? null,
    isDemo: demo,
    recipientFilingMonthsSinceEpoch:
      get(recipientFilingDate)?.monthsSinceEpoch() ?? null,
    spouseFilingMonthsSinceEpoch:
      get(spouseFilingDate)?.monthsSinceEpoch() ?? null,
    version: SESSION_VERSION,
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session:', e);
  }

  // Always update in-memory state regardless of storage success
  isDemo.set(demo);
}

/**
 * Restore session from sessionStorage.
 * Returns true if a session was restored, false otherwise.
 */
export function restoreSession(): boolean {
  if (!browser) return false;

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return false;

    const session: SerializedSession = JSON.parse(stored);
    if (session.version !== SESSION_VERSION) {
      // Incompatible version, clear and return
      clearSession();
      return false;
    }

    // Deserialize everything into locals first so stores are only
    // updated atomically after all deserialization succeeds.
    let restoredRecipient: Recipient | null = null;
    let restoredSpouse: Recipient | null = null;
    let restoredRecipientFiling: MonthDate | null = null;
    let restoredSpouseFiling: MonthDate | null = null;

    if (session.recipient) {
      restoredRecipient = Recipient.deserialize(session.recipient);
      if (session.spouse) {
        restoredRecipient.markFirst();
      }
    }

    if (session.spouse) {
      restoredSpouse = Recipient.deserialize(session.spouse);
      restoredSpouse.markSecond();
    }

    if (typeof session.recipientFilingMonthsSinceEpoch === 'number') {
      restoredRecipientFiling = new MonthDate(
        session.recipientFilingMonthsSinceEpoch
      );
    }

    if (typeof session.spouseFilingMonthsSinceEpoch === 'number') {
      restoredSpouseFiling = new MonthDate(
        session.spouseFilingMonthsSinceEpoch
      );
    }

    // All deserialization succeeded -- commit to stores
    recipient.set(restoredRecipient);
    spouse.set(restoredSpouse);
    recipientFilingDate.set(restoredRecipientFiling);
    spouseFilingDate.set(restoredSpouseFiling);
    isDemo.set(session.isDemo);
    return restoredRecipient !== null;
  } catch (e) {
    console.error('Failed to restore session:', e);
    clearSession();
    return false;
  }
}

/**
 * Clear the session from sessionStorage.
 */
export function clearSession(): void {
  if (!browser) return;

  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }

  recipient.set(null);
  spouse.set(null);
  isDemo.set(false);
  recipientFilingDate.set(null);
  spouseFilingDate.set(null);
}

/**
 * Check if a session exists in sessionStorage.
 */
export function hasSession(): boolean {
  if (!browser) return false;

  try {
    return sessionStorage.getItem(SESSION_KEY) !== null;
  } catch {
    return false;
  }
}

// The filing date sliders track themselves to see if they are currently
// visible and stuck to the top of the screen. This is used to determine
// what is the top element visible for the purpose of the sidebar.
export const isFirstStuck = writable<boolean>(false);
export const isSecondStuck = writable<boolean>(false);

// Track whether future earnings are being edited (custom mode) for each recipient
export const firstFutureEarningsEditable = writable<boolean>(false);
export const secondFutureEarningsEditable = writable<boolean>(false);

// Derived store for overall stuck state
export const isStuck = derived(
  [isFirstStuck, isSecondStuck],
  ([$first, $second]) => $first || $second
);

// Filing dates as Svelte stores for proper reactivity
export const recipientFilingDate = writable<MonthDate | null>(null);
export const spouseFilingDate = writable<MonthDate | null>(null);

// Derived store for higher earner's filing date.
// Depends on recipient/spouse stores so it re-evaluates when they change.
export const higherEarnerFilingDate = derived(
  [recipient, spouse, recipientFilingDate, spouseFilingDate],
  ([$recipient, $spouse, $recipientDate, $spouseDate]) => {
    if (!$recipient || !$spouse) return null;

    if (higherEarningsThan($recipient, $spouse)) {
      return $recipientDate;
    } else {
      return $spouseDate;
    }
  }
);

// Helper function to set higher earner filing date
export function setHigherEarnerFilingDate(date: MonthDate | null) {
  const r = get(recipient);
  const s = get(spouse);
  if (!r || !s) return;

  if (higherEarningsThan(r, s)) {
    recipientFilingDate.set(date);
  } else {
    spouseFilingDate.set(date);
  }
}
