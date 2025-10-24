/**
 * Shared context class for integration Report End components.
 * Provides common functionality for determining higher/lower earners
 * and their filing dates based on recipient and spouse data.
 */

import { recipientFilingDate, spouseFilingDate } from "$lib/context";
import { Money } from "$lib/money";
import { type MonthDate, MonthDuration } from "$lib/month-time";
import type { Recipient } from "$lib/recipient";
import { get } from "svelte/store";

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
   * Returns the rounded monthly benefit amount.
   *
   * @param filingDate The date when benefits begin
   * @returns Monthly benefit as Money (rounded to whole dollars)
   */
  getLowerEarnerPersonalBenefit(filingDate: MonthDate | null): Money {
    const lowerEarner = this.lowerEarner();
    if (lowerEarner === null || filingDate === null) {
      return Money.zero();
    }

    const evaluationDate = filingDate.addDuration(MonthDuration.OneYear());
    const monthlyBenefit = lowerEarner.benefitOnDate(
      filingDate,
      evaluationDate
    );
    return monthlyBenefit.roundToDollar();
  }

  /**
   * Get the lower earner's combined benefit (personal + spousal, in today's dollars).
   * Returns the rounded monthly benefit amount.
   *
   * @param filingDate The date when benefits begin for the lower earner
   * @returns Monthly benefit as Money (rounded to whole dollars)
   */
  getLowerEarnerCombinedBenefit(filingDate: MonthDate): Money {
    const lowerEarner = this.lowerEarner();
    if (lowerEarner === null) {
      return Money.zero();
    }

    const higherEarner = this.higherEarner();
    const higherEarnerFilingDate = this.higherEarnerFilingDate();
    if (higherEarnerFilingDate === null) {
      return Money.zero();
    }

    const evaluationDate = filingDate.addDuration(MonthDuration.OneYear());
    const monthlyBenefit = lowerEarner.allBenefitsOnDate(
      higherEarner,
      higherEarnerFilingDate,
      filingDate,
      evaluationDate
    );
    return monthlyBenefit.roundToDollar();
  }

  /**
   * Get the higher earner's personal benefit only (in today's dollars).
   * Returns the rounded monthly benefit amount.
   *
   * @param filingDate The date when benefits begin
   * @returns Monthly benefit as Money (rounded to whole dollars)
   */
  getHigherEarnerPersonalBenefit(filingDate: MonthDate | null): Money {
    const higherEarner = this.higherEarner();
    if (filingDate === null) {
      return Money.zero();
    }

    const evaluationDate = filingDate.addDuration(MonthDuration.OneYear());
    const monthlyBenefit = higherEarner.benefitOnDate(
      filingDate,
      evaluationDate
    );
    return monthlyBenefit.roundToDollar();
  }

  /**
   * Returns the lower earner's spousal benefit information, including
   * the monthly benefit (in today's dollars) and the month the spousal
   * benefit begins. Returns null when a spousal benefit does not apply
   * for the current filing selections.
   */
  getLowerEarnerSpousalBenefit(): {
    monthlyBenefit: Money;
    startDate: MonthDate;
  } | null {
    const lowerEarner = this.lowerEarner();
    if (lowerEarner === null) return null;

    const higherEarner = this.higherEarner();
    const higherFilingDate = this.higherEarnerFilingDate();
    const lowerFilingDate = this.lowerEarnerFilingDate();

    if (higherFilingDate === null || lowerFilingDate === null) {
      return null;
    }

    const spousalStart = higherFilingDate.greaterThan(lowerFilingDate)
      ? higherFilingDate
      : lowerFilingDate;

    const monthlyBenefit = lowerEarner.spousalBenefitOnDateGivenStartDate(
      higherEarner,
      higherFilingDate,
      lowerFilingDate,
      spousalStart
    );

    if (monthlyBenefit.cents() <= 0) {
      return null;
    }

    return { monthlyBenefit, startDate: spousalStart };
  }

  /**
   * Copy a value to the clipboard.
   * This is a static utility method for use in integration components.
   * @param value The string value to copy to the clipboard
   */
  static copyToClipboard(value: string): void {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value).then(
        () => {
          // Success feedback could be added here
        },
        (err) => {
          console.error("Failed to copy:", err);
        }
      );
    }
  }
}
