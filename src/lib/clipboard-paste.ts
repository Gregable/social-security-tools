/**
 * Reading the earnings record from the clipboard for the calculator's
 * "Paste from clipboard" button. Kept free of Svelte and the global navigator
 * so every outcome can be unit-tested with a stub clipboard.
 *
 * Browsers differ in how a read is confirmed: iOS Safari shows its own
 * "Paste" bubble that must be tapped, Chrome asks for permission once, and
 * Firefox shows a one-item paste menu. Dismissing or denying any of these
 * rejects the read, usually with a NotAllowedError.
 */

/** The part of the Clipboard API this module uses. */
export interface ClipboardTextReader {
  readonly readText: () => Promise<string>;
}

/** What a click on the button got from the clipboard. */
export type ClipboardReadResult =
  /** Non-blank text, passed on unchanged for the paste parser. */
  | { readonly kind: 'text'; readonly text: string }
  /** Blank text, e.g. an empty clipboard or one holding only an image. */
  | { readonly kind: 'empty' }
  /**
   * The read failed. errorName is the error's name (NotAllowedError when the
   * user dismissed or denied the browser's prompt), or 'unknown'.
   */
  | { readonly kind: 'unavailable'; readonly errorName: string };

/** Whether this clipboard (navigator.clipboard, if any) can read text. */
export function canReadClipboard(clipboard: object | undefined): boolean {
  return (
    clipboard !== undefined &&
    typeof (clipboard as Partial<ClipboardTextReader>).readText === 'function'
  );
}

/** Reads the clipboard's text, turning every failure into a result. */
export async function readClipboardText(
  clipboard: ClipboardTextReader
): Promise<ClipboardReadResult> {
  try {
    const text = await clipboard.readText();
    return text.trim() === '' ? { kind: 'empty' } : { kind: 'text', text };
  } catch (error) {
    return { kind: 'unavailable', errorName: errorNameOf(error) };
  }
}

function errorNameOf(error: unknown): string {
  // DOMException is an Error subclass in browsers but not in every test
  // environment, so check for a string name rather than instanceof.
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const { name } = error as { name: unknown };
    if (typeof name === 'string' && name !== '') return name;
  }
  return 'unknown';
}
