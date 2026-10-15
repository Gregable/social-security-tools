/**
 * Logic for the calculator's earnings-record paste step: the keyboard
 * shortcut to suggest, and the event names and properties the step reports.
 * Kept free of Svelte and DOM access so it can be unit-tested.
 *
 * Privacy: failedPasteProperties' result is sent to PostHog, so it must never
 * include the pasted text, names, or earnings amounts. It reports structural
 * counts, whether this is a spouse entry, and wrong_page. year_token_count
 * roughly tracks how many years a pasted record covers, the same kind of
 * information "Paste Flow: Parse Success" already sends as record_count; we
 * accept that as non-identifying. wrong_page is a fixed label, or null, for
 * the ssa.gov page copied by mistake. It is chosen by link text that is the
 * same on every copy of that page, so it reveals which page was copied, never
 * anything on it. Do not add fields that could identify a person or reveal an
 * amount.
 */

import { detectWrongSsaPage, type WrongSsaPage } from '$lib/wrong-ssa-page';

/**
 * The Select All shortcut for keyboard users. Touch screens get separate
 * press-and-hold instructions, chosen in CSS with (pointer: coarse) so they
 * are right on first paint; that is also why iPads, which report a Mac
 * platform, never see this label.
 */
export function selectAllShortcut(platform: string): 'Cmd+A' | 'Ctrl+A' {
  return platform.toLowerCase().includes('mac') ? 'Cmd+A' : 'Ctrl+A';
}

/** Shape of a paste that could not be parsed. Counts only, never content. */
export interface FailedPasteSummary {
  readonly char_count: number;
  /** Follows split semantics: a trailing newline adds an empty line. */
  readonly line_count: number;
  readonly has_tabs: boolean;
  /** Tokens that look like a 19xx or 20xx year, a hint the table was copied. */
  readonly year_token_count: number;
}

const LINE_BREAK = /\r\n|\r|\n/;
const YEAR_TOKEN = /\b(?:19|20)\d{2}\b/g;

/** Summarizes an unparseable paste using structural counts only. */
export function describeFailedPaste(contents: string): FailedPasteSummary {
  return {
    char_count: contents.length,
    line_count: contents.split(LINE_BREAK).length,
    has_tabs: contents.includes('\t'),
    year_token_count: contents.match(YEAR_TOKEN)?.length ?? 0,
  };
}

export interface FailedPasteProperties extends FailedPasteSummary {
  readonly is_spouse_entry: boolean;
  /**
   * The ssa.gov page copied by mistake, recognized by its fixed link text;
   * null when the paste matches no known page.
   */
  readonly wrong_page: WrongSsaPage | null;
}

/** The full property set for PASTE_FLOW_EVENTS.parseFailed. */
export function failedPasteProperties(
  contents: string,
  isSpouseEntry: boolean
): FailedPasteProperties {
  return {
    ...describeFailedPaste(contents),
    is_spouse_entry: isSpouseEntry,
    wrong_page: detectWrongSsaPage(contents),
  };
}

/** What parsing the paste box's current contents produced. */
export type PasteOutcome = 'empty' | 'failed' | 'parsed';

export interface FailureState {
  /** Whether the current attempt's failure has already been reported. */
  readonly reported: boolean;
  /** Whether to send a failure event for this outcome. */
  readonly report: boolean;
}

/**
 * Parsing reruns on every edit, so only the first failure of an attempt is
 * reported. An attempt ends when the box is emptied or a paste succeeds.
 */
export function nextFailureState(
  alreadyReported: boolean,
  outcome: PasteOutcome
): FailureState {
  if (outcome !== 'failed') return { reported: false, report: false };
  return { reported: true, report: !alreadyReported };
}

/**
 * PostHog events sent by PastePrompt. Other "Paste Flow:" events are still
 * inline in PasteFlow.svelte.
 */
export const PASTE_FLOW_EVENTS = {
  parseFailed: 'Paste Flow: Parse Failed',
  linkClicked: 'Paste Flow: Link Clicked',
  helpExpanded: 'Paste Flow: Help Expanded',
  /** The error's "Clear and try again" button; props wrong_page and is_spouse_entry. */
  pasteReset: 'Paste Flow: Paste Reset',
} as const;

/** Links on the entry step whose clicks are tracked. */
export type PasteFlowLink =
  | 'ssa_sign_in'
  | 'ssa_earnings_record'
  | 'paste_help_guide'
  /** The earnings record link in the wrong-page error message. */
  | 'wrong_page_earnings_record';

/** Expandable help sections on the entry step. */
export type PasteFlowHelpSection =
  | 'find_manually'
  | 'copy_example'
  | 'alternatives';
