import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AUTHOR, authorBio, authorPerson, authorSameAs } from '$lib/author';

describe('AUTHOR', () => {
  it('has an absolute profile URL on ssa.tools built from its path', () => {
    expect(AUTHOR.path).toMatch(/^\/author\/[a-z-]+$/);
    expect(AUTHOR.url).toBe(`https://ssa.tools${AUTHOR.path}`);
  });

  it('has a prerendered route at the profile path', () => {
    const route = join(
      process.cwd(),
      'src',
      'routes',
      AUTHOR.path,
      '+page.svelte'
    );
    expect(existsSync(route)).toBe(true);
  });

  it('is listed in the sitemap by the same path', () => {
    const sitemap = readFileSync(
      join(process.cwd(), 'src', 'routes', 'sitemap.xml', '+server.ts'),
      'utf8'
    );
    // The sitemap reads the path from the constant rather than repeating it.
    expect(sitemap).toContain('path: AUTHOR.path');
  });

  it('links to external profiles for entity reconciliation', () => {
    const links = authorSameAs();
    expect(links).toEqual([AUTHOR.blogUrl, AUTHOR.githubUrl]);
    for (const link of links) {
      expect(link).toMatch(/^https:\/\//);
    }
  });

  it('composes the bio from the name and the summary predicate', () => {
    expect(AUTHOR.summary).toMatch(/^is /);
    expect(authorBio()).toBe(`${AUTHOR.name} ${AUTHOR.summary}`);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(AUTHOR)).toBe(true);
  });
});

describe('authorPerson', () => {
  it('returns a schema.org Person that resolves to the profile page', () => {
    const person = authorPerson();
    expect(person['@type']).toBe('Person');
    expect(person.name).toBe(AUTHOR.name);
    expect(person.givenName).toBe(AUTHOR.givenName);
    expect(person.url).toBe(AUTHOR.url);
    expect(person.sameAs).toEqual(authorSameAs());
    expect(person.jobTitle).toBe(AUTHOR.jobTitle);
  });
});
