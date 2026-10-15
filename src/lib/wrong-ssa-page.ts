/**
 * Recognizes a paste copied from an ssa.gov page other than the earnings
 * record, so the paste step can say where to go instead of showing a generic
 * parse error. Meant for pastes parsePaste() has already rejected; it does not
 * check that itself. The result is also sent to analytics as wrong_page (see
 * $lib/analytics/paste-flow), so a match must depend only on fixed page text.
 */

/** An ssa.gov page that people copy by mistake. */
export type WrongSsaPage = 'my_ssa_home';

// The my Social Security home page, where people land after signing in, links
// to the earnings record with this text. Whitespace is collapsed because
// browsers copy line breaks and spacing differently; case is ignored in case
// the link is restyled.
const HOME_PAGE_LINK_TEXT = 'review your full earnings record now';

/** Which wrong ssa.gov page the paste came from, or null if unrecognized. */
export function detectWrongSsaPage(contents: string): WrongSsaPage | null {
  const normalized = contents.replace(/\s+/g, ' ').toLowerCase();
  return normalized.includes(HOME_PAGE_LINK_TEXT) ? 'my_ssa_home' : null;
}
