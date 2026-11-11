/**
 * The single author of every guide on the site.
 *
 * One source of truth for the byline on each guide, the author profile
 * page, the sitemap, and the schema.org Person emitted in
 * structured data. Search engines use the `url` and `sameAs` links to
 * resolve the name to one entity, so these must stay stable across pages.
 */

export interface Author {
  readonly name: string;
  readonly givenName: string;
  /** Site-relative path of the author profile page, e.g. "/author/x". */
  readonly path: string;
  /** Canonical, absolute URL of the author profile page. */
  readonly url: string;
  readonly jobTitle: string;
  /**
   * The bio with the name left off, so it reads as a predicate: "is a
   * software engineer who...". The profile page and schema prepend the
   * name.
   */
  readonly summary: string;
  readonly blogUrl: string;
  readonly githubUrl: string;
}

const AUTHOR_PATH = '/author/greg-grothaus';

export const AUTHOR: Author = Object.freeze({
  name: 'Greg Grothaus',
  givenName: 'Greg',
  path: AUTHOR_PATH,
  url: `https://ssa.tools${AUTHOR_PATH}`,
  jobTitle: 'Software engineer and creator of SSA.tools',
  summary:
    'is a software engineer who has built and maintained SSA.tools since ' +
    '2017. He wrote every guide on the site and the open-source calculator ' +
    'behind it, which checks its results against the Social Security ' +
    "Administration's published rules with an automated test suite that " +
    'runs on every change. He previously worked at Google and FEMA.',
  blogUrl: 'https://www.gregable.com/',
  githubUrl: 'https://github.com/Gregable',
});

/** The full bio as one plain-text paragraph, name first. */
export function authorBio(): string {
  return `${AUTHOR.name} ${AUTHOR.summary}`;
}

/** External profiles that identify the same person, for schema `sameAs`. */
export function authorSameAs(): readonly string[] {
  return [AUTHOR.blogUrl, AUTHOR.githubUrl];
}

/**
 * The schema.org Person for the author, shaped for embedding in JSON-LD.
 */
export interface PersonSchema {
  readonly '@type': 'Person';
  readonly name: string;
  readonly givenName: string;
  readonly url: string;
  readonly jobTitle: string;
  readonly sameAs: readonly string[];
}

export function authorPerson(): PersonSchema {
  return {
    '@type': 'Person',
    name: AUTHOR.name,
    givenName: AUTHOR.givenName,
    url: AUTHOR.url,
    jobTitle: AUTHOR.jobTitle,
    sameAs: authorSameAs(),
  };
}
