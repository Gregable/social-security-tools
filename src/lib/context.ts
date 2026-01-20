/**
 * Global context for the application.
 */

import { derived, writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { MonthDate } from './month-time';
import { Recipient, type SerializedRecipient } from './recipient';

const SESSION_KEY = 'ssa-tools-session';

interface SerializedSession {
  recipient: SerializedRecipient | null;
  spouse: SerializedRecipient | null;
  isDemo: boolean;
  version: number;
}

const SESSION_VERSION = 1;

class Context {
  recipient: Recipient | null = null;
  spouse: Recipient | null = null;
}

export const context = new Context();

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

  const session: SerializedSession = {
    recipient: context.recipient ? context.recipient.serialize() : null,
    spouse: context.spouse ? context.spouse.serialize() : null,
    isDemo: demo,
    version: SESSION_VERSION,
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    isDemo.set(demo);
  } catch (e) {
    console.error('Failed to save session:', e);
  }
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

    if (session.recipient) {
      context.recipient = Recipient.deserialize(session.recipient);
      if (session.spouse) {
        context.recipient.markFirst();
      }
    }

    if (session.spouse) {
      context.spouse = Recipient.deserialize(session.spouse);
      context.spouse.markSecond();
    }

    isDemo.set(session.isDemo);
    return context.recipient !== null;
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

  context.recipient = null;
  context.spouse = null;
  isDemo.set(false);
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

// Derived store for overall stuck state
export const isStuck = derived(
  [isFirstStuck, isSecondStuck],
  ([$first, $second]) => $first || $second
);

// Filing dates as Svelte stores for proper reactivity
export const recipientFilingDate = writable<MonthDate | null>(null);
export const spouseFilingDate = writable<MonthDate | null>(null);

// Derived store for higher earner's filing date
export const higherEarnerFilingDate = derived(
  [recipientFilingDate, spouseFilingDate],
  ([$recipientDate, $spouseDate]) => {
    if (!context.recipient || !context.spouse) return null;

    if (context.recipient.higherEarningsThan(context.spouse)) {
      return $recipientDate;
    } else {
      return $spouseDate;
    }
  }
);

// Helper function to set higher earner filing date
export function setHigherEarnerFilingDate(date: MonthDate | null) {
  if (!context.recipient || !context.spouse) return;

  if (context.recipient.higherEarningsThan(context.spouse)) {
    recipientFilingDate.set(date);
  } else {
    spouseFilingDate.set(date);
  }
}
