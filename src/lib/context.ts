/**
 * Global context for the application.
 */
import { derived, writable } from 'svelte/store';
import type { MonthDate } from './month-time';
import type { Recipient } from './recipient';

class Context {
  recipient: Recipient | null = null;
  spouse: Recipient | null = null;
}

export const context = new Context();

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
