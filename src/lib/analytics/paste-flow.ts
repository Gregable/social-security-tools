/**
 * Helpers for the calculator's earnings-record paste flow: which copy
 * instructions to show, and what to report when a paste cannot be parsed.
 *
 * Privacy: nothing here may send the pasted text or any value derived from a
 * person's earnings. Failure reports carry only shape counts, which is enough
 * to tell "copied the wrong thing" from "copied the table but the parser
 * missed it".
 */

/** Which "copy the table" instructions fit the visitor's device. */
export type CopyInstructionPlatform = 'mac' | 'ctrl' | 'touch';

export interface PlatformSignals {
  /** `matchMedia('(pointer: coarse)').matches`: a touch-primary screen. */
  readonly coarsePointer: boolean;
  /** `navigator.platform`, e.g. "MacIntel", "Win32", "iPhone". */
  readonly platform: string;
}

/**
 * Picks the copy instructions to show. Touch screens come first: iPads report
 * a Mac platform but have no keyboard shortcut to offer, and phones were
 * previously told to press Ctrl+A.
 */
export function copyInstructionPlatform(
  signals: PlatformSignals
): CopyInstructionPlatform {
  if (signals.coarsePointer) return 'touch';
  if (signals.platform.toLowerCase().includes('mac')) return 'mac';
  return 'ctrl';
}

/** Shape of a paste that could not be parsed. Counts only, never content. */
export interface FailedPasteSummary {
  readonly char_count: number;
  readonly line_count: number;
  readonly has_tabs: boolean;
  /** Tokens that look like a 19xx or 20xx year, a hint the table was copied. */
  readonly year_token_count: number;
}

const LINE_BREAK = /\r\n|\r|\n/;
const YEAR_TOKEN = /\b(?:19|20)\d{2}\b/g;

export function describeFailedPaste(contents: string): FailedPasteSummary {
  return {
    char_count: contents.length,
    line_count: contents.split(LINE_BREAK).length,
    has_tabs: contents.includes('\t'),
    year_token_count: contents.match(YEAR_TOKEN)?.length ?? 0,
  };
}

/** PostHog event names for the paste flow's entry step. */
export const PASTE_FLOW_EVENTS = {
  parseFailed: 'Paste Flow: Parse Failed',
  linkClicked: 'Paste Flow: Link Clicked',
  helpExpanded: 'Paste Flow: Help Expanded',
} as const;

/** Links on the entry step whose clicks are tracked. */
export type PasteFlowLink =
  | 'ssa_sign_in'
  | 'ssa_earnings_record'
  | 'paste_help_guide';

/** Expandable help sections on the entry step. */
export type PasteFlowHelpSection =
  | 'find_manually'
  | 'copy_example'
  | 'alternatives';
