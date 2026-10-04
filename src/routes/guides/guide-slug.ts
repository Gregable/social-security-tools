const GUIDES_PREFIX = '/guides/';

/**
 * The guide slug for a pathname under /guides, or '' for anything else.
 *
 * Both the CTA type and the sponsor pitch are chosen by slug, so they have
 * to agree on how a pathname becomes one. Only a leading /guides/ counts,
 * and a single trailing slash is ignored, since a guide is reachable at
 * both /guides/wep and /guides/wep/.
 */
export function guideSlugFromPath(pathname: string): string {
  if (!pathname.startsWith(GUIDES_PREFIX)) return '';
  const rest = pathname.slice(GUIDES_PREFIX.length);
  return rest.endsWith('/') ? rest.slice(0, -1) : rest;
}
