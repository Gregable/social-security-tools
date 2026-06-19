import {
  buildCalculatorAiExport,
  buildCoupleCalculatorAiExport,
  type CalculatorAiExportOptions,
} from '$lib/ai-export';
import type { Recipient } from '$lib/recipient';

/**
 * Formats a Date as `YYYY-MM-DD` using its LOCAL calendar parts.
 *
 * Deliberately not `new Date().toISOString().slice(0, 10)`: that yields the UTC
 * day, which can be one calendar day off from the user's local day near
 * midnight. The AI export stamps a human-facing "Generated" date, so it must
 * match the day the user is actually looking at the page.
 */
export function localIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Builds the "Copy for AI assistant" markdown for the calculator report. Uses
 * the single-recipient builder, or the couple builder when a spouse is present.
 * Options (baseUrl, generatedDate) are forwarded unchanged to the underlying
 * builder, which is deterministic for a given set of inputs (see
 * buildCalculatorAiExport; amounts depend on constants.CURRENT_YEAR resolved
 * at module load, not on the wall clock).
 */
export function buildCalculatorExport(
  recipient: Recipient,
  spouse: Recipient | null,
  options: CalculatorAiExportOptions = {}
): string {
  return spouse
    ? buildCoupleCalculatorAiExport(recipient, spouse, options)
    : buildCalculatorAiExport(recipient, options);
}
