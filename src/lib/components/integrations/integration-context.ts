/**
 * Shared context class for integration Report End components.
 * Provides common functionality for determining higher/lower earners
 * and their filing dates based on recipient and spouse data.
 */

import type { Recipient } from '$lib/recipient';
import type { MonthDate } from '$lib/month-time';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import { get } from 'svelte/store';

/**
 * Context class for integration components that need to work with
 * recipient/spouse pairs and their filing dates.
 */
export class IntegrationContext {
  private _recipient: Recipient;
  private _spouse: Recipient | null;

  constructor(recipient: Recipient, spouse: Recipient | null) {
    this._recipient = recipient;
    this._spouse = spouse;
  }

  /**
   * Returns the recipient.
   */
  get recipient(): Recipient {
    return this._recipient;
  }

  /**
   * Returns the spouse (or null if there is no spouse).
   */
  get spouse(): Recipient | null {
    return this._spouse;
  }

  /**
   * Returns the higher earner between recipient and spouse.
   * If there is no spouse, returns the recipient (single-user case).
   * If there is a spouse, returns whichever has higher earnings.
   */
  higherEarner(): Recipient {
    if (this._spouse === null) {
      return this._recipient;
    }
    return this._recipient.higherEarningsThan(this._spouse)
      ? this._recipient
      : this._spouse;
  }

  /**
   * Returns the lower earner between recipient and spouse.
   * Returns null if there is no spouse (single-user case).
   */
  lowerEarner(): Recipient | null {
    if (this._spouse === null) {
      return null;
    }
    return this._recipient.higherEarningsThan(this._spouse)
      ? this._spouse
      : this._recipient;
  }

  /**
   * Returns the filing date for the higher earner.
   * If there is no spouse, returns the recipient's filing date.
   * If there is a spouse, returns the filing date of whichever has higher earnings.
   */
  higherEarnerFilingDate(): MonthDate | null {
    if (this._spouse === null) {
      return get(recipientFilingDate);
    }
    return this._recipient.higherEarningsThan(this._spouse)
      ? get(recipientFilingDate)
      : get(spouseFilingDate);
  }

  /**
   * Returns the filing date for the lower earner.
   * Returns null if there is no spouse (single-user case).
   */
  lowerEarnerFilingDate(): MonthDate | null {
    if (this._spouse === null) {
      return null;
    }
    return this._recipient.higherEarningsThan(this._spouse)
      ? get(spouseFilingDate)
      : get(recipientFilingDate);
  }

  /**
   * Returns true if the recipient is the higher earner.
   * Returns false if there is no spouse or if the spouse is the higher earner.
   */
  isRecipientHigherEarner(): boolean {
    if (this._spouse === null) {
      return true;
    }
    return this._recipient.higherEarningsThan(this._spouse);
  }

  /**
   * Returns true if the recipient is the lower earner.
   * Returns false if there is no spouse or if the recipient is the higher earner.
   */
  isRecipientLowerEarner(): boolean {
    if (this._spouse === null) {
      return false;
    }
    return !this._recipient.higherEarningsThan(this._spouse);
  }

  /**
   * Get the lower earner's personal benefit only (in today's dollars).
   * Returns a formatted string with dollar sign and commas.
   *
   * @param filingDate The date when benefits begin
   * @returns Formatted monthly benefit amount (e.g., "$1,234")
   */
  getLowerEarnerPersonalBenefit(filingDate: MonthDate | null): string {
    const lowerEarner = this.lowerEarner();

    const monthlyBenefit = lowerEarner!.benefitOnDate(filingDate!, filingDate!);
    return monthlyBenefit.roundToDollar().wholeDollars();
  }

  /**
   * Get the lower earner's combined benefit (personal + spousal, in today's dollars).
   * Returns a formatted string with dollar sign and commas.
   *
   * @param filingDate The date when benefits begin for the lower earner
   * @returns Formatted monthly benefit amount (e.g., "$1,234")
   */
  getLowerEarnerCombinedBenefit(filingDate: MonthDate): string {
    const lowerEarner = this.lowerEarner();

    const higherEarner = this.higherEarner();
    const higherEarnerFilingDate = this.higherEarnerFilingDate();

    const monthlyBenefit = lowerEarner!.allBenefitsOnDate(
      higherEarner!,
      higherEarnerFilingDate!,
      filingDate!,
      filingDate!
    );
    return monthlyBenefit.roundToDollar().wholeDollars();
  }

  /**
   * Copy a value to the clipboard.
   * This is a static utility method for use in integration components.
   * @param value The string value to copy to the clipboard
   */
  static copyToClipboard(value: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value).then(
        () => {
          // Success feedback could be added here
        },
        (err) => {
          console.error('Failed to copy:', err);
        }
      );
    }
  }
}
