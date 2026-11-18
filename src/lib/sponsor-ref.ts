/**
 * Short reference codes that tie a sponsor lead back to the click that
 * sent it. The code rides on the outbound link, the sponsor copies it
 * into their referral sheet, and the same code is logged on our
 * "Outbound: Clicked" event, so a sheet row can be matched to its
 * PostHog session.
 *
 * The code is random per card, not a PostHog id: the sponsor's tools
 * never see an identifier that follows the reader across visits.
 */

/** Digits and capitals minus 0/O, 1/I/L, and U, which staff could misread. */
export const SPONSOR_REF_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

const REF_LENGTH = 6;

/** Largest multiple of the alphabet size below 256, for unbiased picks. */
const BYTE_LIMIT = 256 - (256 % SPONSOR_REF_ALPHABET.length);

/**
 * A fresh six-character code. Call it on mount, never at render: guides
 * are prerendered, so a code made at render would be shared by every
 * reader (see InlineCTA and sponsor-chat-prerender.test.ts).
 */
export function newSponsorRef(): string {
  let ref = '';
  while (ref.length < REF_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(REF_LENGTH * 2))) {
      if (byte < BYTE_LIMIT && ref.length < REF_LENGTH) {
        ref += SPONSOR_REF_ALPHABET[byte % SPONSOR_REF_ALPHABET.length];
      }
    }
  }
  return ref;
}

/**
 * The sponsor's LiveChat page with `ref` attached. The page reads its
 * `params` query value as URL-encoded key=value pairs and stores them as
 * session variables, which agents see in the chat's details. An empty ref
 * (before the card has mounted in the browser) gives the bare link.
 */
export function chatUrlWithRef(chatUrl: string, ref: string): string {
  if (ref === '') return chatUrl;
  const url = new URL(chatUrl);
  url.searchParams.set(
    'params',
    new URLSearchParams({ ref, source: 'ssa.tools' }).toString()
  );
  return url.toString();
}
