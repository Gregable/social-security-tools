/**
 * The single author of every guide on the site.
 *
 * One source of truth for the byline on each guide, the author profile page,
 * and the schema.org Person emitted in structured data. Search engines use
 * the `url` and `sameAs` links to resolve the name to one entity, so these
 * must stay stable across pages.
 */

export interface Author {
  readonly name: string;
  /** Canonical, absolute URL of the author profile page. */
  readonly url: string;
  readonly jobTitle: string;
  /** One-paragraph bio, plain text, shared by the profile page and schema. */
  readonly bio: string;
  /** External profiles that identify the same person. */
  readonly sameAs: readonly string[];
}

export const AUTHOR: Author = Object.freeze({
  name: 'Greg Grothaus',
  url: 'https://ssa.tools/author/greg-grothaus',
  jobTitle: 'Software engineer and creator of SSA.tools',
  bio:
    'Greg Grothaus is a software engineer who has built and maintained ' +
    'SSA.tools since 2017. He wrote every guide on the site and the ' +
    'open-source calculator behind it, which checks its results against ' +
    "the Social Security Administration's published rules with more than " +
    '2,400 automated tests. He previously worked at Google and FEMA.',
  sameAs: Object.freeze([
    'https://www.gregable.com/',
    'https://github.com/Gregable',
  ]),
});

/**
 * The schema.org Person for the author, shaped for embedding in JSON-LD.
 */
export interface PersonSchema {
  readonly '@type': 'Person';
  readonly name: string;
  readonly url: string;
  readonly jobTitle: string;
  readonly sameAs: readonly string[];
}

export function authorPerson(): PersonSchema {
  return {
    '@type': 'Person',
    name: AUTHOR.name,
    url: AUTHOR.url,
    jobTitle: AUTHOR.jobTitle,
    sameAs: AUTHOR.sameAs,
  };
}
