/**
 * Centralized URL parameter management for hash-based parameters.
 *
 * This module provides a unified interface for parsing and accessing
 * URL hash parameters used throughout the application. It supports:
 * - Integration parameters (integration=<site-id>)
 * - Recipient data parameters (pia1, dob1, name1)
 * - Spouse data parameters (pia2, dob2, name2)
 * - Future extensibility for additional parameter types
 *
 * All parameters are read from the URL hash (after #) to avoid
 * server-side processing and maintain client-side privacy.
 */

/**
 * Parsed recipient or spouse data from URL parameters.
 */
export interface RecipientParams {
  pia: number | null;
  dob: string | null;
  name: string | null;
}

/**
 * Parsed earnings record entry from URL parameters.
 */
export interface EarningsEntry {
  year: number;
  amount: number;
}

/**
 * UrlParams provides a type-safe interface for accessing URL hash parameters.
 *
 * Example usage:
 * ```typescript
 * const params = new UrlParams();
 * const integrationId = params.getIntegration();
 * const recipientData = params.getRecipientParams();
 * ```
 */
export class UrlParams {
  private params: URLSearchParams;

  /**
   * Create a new UrlParams instance from the current window location hash.
   * If running server-side or hash is empty, creates empty params.
   */
  constructor(hash?: string) {
    if (typeof window === 'undefined' && !hash) {
      this.params = new URLSearchParams();
    } else {
      const hashString = hash ?? window.location.hash;
      // Remove leading '#' if present
      const cleanHash = hashString.startsWith('#')
        ? hashString.substring(1)
        : hashString;
      this.params = new URLSearchParams(cleanHash);
    }
  }

  /**
   * Get the integration ID parameter.
   * Returns null if not present.
   *
   * Example: #integration=opensocialsecurity.com
   */
  getIntegration(): string | null {
    return this.params.get('integration');
  }

  /**
   * Get recipient (person 1) PIA parameter as a number.
   * Returns null if not present or invalid.
   *
   * Example: #pia1=3000
   */
  getRecipientPia(): number | null {
    const value = this.params.get('pia1');
    if (!value) return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Get recipient (person 1) date of birth parameter.
   * Returns null if not present.
   * Format expected: YYYY-MM-DD
   *
   * Example: #dob1=1965-09-21
   */
  getRecipientDob(): string | null {
    return this.params.get('dob1');
  }

  /**
   * Get recipient (person 1) name parameter.
   * Returns null if not present.
   *
   * Example: #name1=Alex
   */
  getRecipientName(): string | null {
    return this.params.get('name1');
  }

  /**
   * Get spouse (person 2) PIA parameter as a number.
   * Returns null if not present or invalid.
   *
   * Example: #pia2=2500
   */
  getSpousePia(): number | null {
    const value = this.params.get('pia2');
    if (!value) return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Get spouse (person 2) date of birth parameter.
   * Returns null if not present.
   * Format expected: YYYY-MM-DD
   *
   * Example: #dob2=1962-03-10
   */
  getSpouseDob(): string | null {
    return this.params.get('dob2');
  }

  /**
   * Get spouse (person 2) name parameter.
   * Returns null if not present.
   *
   * Example: #name2=Chris
   */
  getSpouseName(): string | null {
    return this.params.get('name2');
  }

  /**
   * Get all recipient parameters as a structured object.
   * Useful for bulk parameter access.
   */
  getRecipientParams(): RecipientParams {
    return {
      pia: this.getRecipientPia(),
      dob: this.getRecipientDob(),
      name: this.getRecipientName(),
    };
  }

  /**
   * Get all spouse parameters as a structured object.
   * Useful for bulk parameter access.
   */
  getSpouseParams(): RecipientParams {
    return {
      pia: this.getSpousePia(),
      dob: this.getSpouseDob(),
      name: this.getSpouseName(),
    };
  }

  /**
   * Check if recipient parameters are present and complete.
   * Both PIA and DOB are required for a valid recipient.
   */
  hasValidRecipientParams(): boolean {
    return this.getRecipientPia() !== null && this.getRecipientDob() !== null;
  }

  /**
   * Check if spouse parameters are present and complete.
   * Both PIA and DOB are required for a valid spouse.
   */
  hasValidSpouseParams(): boolean {
    return this.getSpousePia() !== null && this.getSpouseDob() !== null;
  }

  /**
   * Check if any parameters are present in the URL.
   */
  hasAnyParams(): boolean {
    return Array.from(this.params.keys()).length > 0;
  }

  /**
   * Parse earnings history from a comma-separated format.
   * Format: year:amount,year:amount,...
   * Example: 2020:50000,2021:55000,2022:60000
   *
   * @param paramValue - The raw parameter value
   * @returns Array of earnings entries, or null if parameter not present or invalid
   */
  private parseEarnings(paramValue: string | null): EarningsEntry[] | null {
    if (!paramValue) return null;

    const entries: EarningsEntry[] = [];
    const pairs = paramValue.split(',');

    for (const pair of pairs) {
      const trimmed = pair.trim();
      if (!trimmed) continue;

      const parts = trimmed.split(':');
      if (parts.length !== 2) continue;

      const year = parseInt(parts[0], 10);
      const amount = parseInt(parts[1], 10);

      // Validate year and amount
      if (isNaN(year) || isNaN(amount)) continue;
      if (year < 1951 || year > 2100) continue; // Reasonable year range
      if (amount < 0) continue;

      entries.push({ year, amount });
    }

    return entries.length > 0 ? entries : null;
  }

  /**
   * Get recipient (person 1) earnings history from URL parameters.
   * Returns null if not present or invalid.
   *
   * Format: earnings1=year:amount,year:amount,...
   * Example: #earnings1=2020:50000,2021:55000,2022:60000
   */
  getRecipientEarnings(): EarningsEntry[] | null {
    return this.parseEarnings(this.params.get('earnings1'));
  }

  /**
   * Get spouse (person 2) earnings history from URL parameters.
   * Returns null if not present or invalid.
   *
   * Format: earnings2=year:amount,year:amount,...
   * Example: #earnings2=2020:40000,2021:42000,2022:45000
   */
  getSpouseEarnings(): EarningsEntry[] | null {
    return this.parseEarnings(this.params.get('earnings2'));
  }

  /**
   * Check if recipient has valid earnings history.
   * Both earnings data and DOB are required for earnings-based calculation.
   */
  hasValidRecipientEarnings(): boolean {
    return (
      this.getRecipientEarnings() !== null && this.getRecipientDob() !== null
    );
  }

  /**
   * Check if spouse has valid earnings history.
   * Both earnings data and DOB are required for earnings-based calculation.
   */
  hasValidSpouseEarnings(): boolean {
    return this.getSpouseEarnings() !== null && this.getSpouseDob() !== null;
  }

  /**
   * Get the raw URLSearchParams instance for advanced use cases.
   * Use sparingly - prefer typed methods above.
   */
  getRaw(): URLSearchParams {
    return this.params;
  }
}
