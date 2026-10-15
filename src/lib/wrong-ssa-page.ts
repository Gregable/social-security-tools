/**
 * Recognizes a paste copied from an ssa.gov page other than the earnings
 * record, so the paste step can say where to go instead of showing a generic
 * parse error. Only consulted after parsePaste() has rejected the paste.
 */

/** An ssa.gov page that people copy by mistake. */
export type WrongSsaPage = 'my_ssa_home';

// The my Social Security home page, where people land after signing in, links
// to the earnings record with this text. Matched after collapsing whitespace
// and lowercasing, since browsers differ in how they copy line breaks.
const HOME_PAGE_LINK_TEXT = 'review your full earnings record now';

/** Which wrong ssa.gov page the paste came from, or null if unrecognized. */
export function detectWrongSsaPage(contents: string): WrongSsaPage | null {
  const normalized = contents.replace(/\s+/g, ' ').toLowerCase();
  return normalized.includes(HOME_PAGE_LINK_TEXT) ? 'my_ssa_home' : null;
}
