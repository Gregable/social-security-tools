import { SPONSOR } from '$lib/sponsor';

/**
 * Whether `a` links to `href`. Chat links carry a per-card ref in their
 * query, so a link counts as SPONSOR.chatUrl when it is that URL plus a
 * `params` query.
 */
export function isLinkTo(
  a: HTMLAnchorElement,
  href: string | undefined
): boolean {
  const actual = a.getAttribute('href');
  if (actual === href) return true;
  return (
    href !== undefined &&
    href === SPONSOR.chatUrl &&
    actual !== null &&
    actual.startsWith(`${href}?params=`)
  );
}

/** The `ref` session variable on a chat link, or null if it has none. */
export function refOnChatLink(a: HTMLAnchorElement): string | null {
  const params = new URL(a.href).searchParams.get('params');
  return params === null ? null : new URLSearchParams(params).get('ref');
}
