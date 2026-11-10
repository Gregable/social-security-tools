import { describe, expect, it } from 'vitest';
import { AUTHOR, authorPerson } from '$lib/author';

describe('AUTHOR', () => {
  it('has an absolute profile URL on ssa.tools', () => {
    expect(AUTHOR.url).toMatch(/^https:\/\/ssa\.tools\/author\//);
  });

  it('links to external profiles for entity reconciliation', () => {
    expect(AUTHOR.sameAs.length).toBeGreaterThanOrEqual(2);
    for (const link of AUTHOR.sameAs) {
      expect(link).toMatch(/^https:\/\//);
    }
  });

  it('is frozen', () => {
    expect(Object.isFrozen(AUTHOR)).toBe(true);
    expect(Object.isFrozen(AUTHOR.sameAs)).toBe(true);
  });
});

describe('authorPerson', () => {
  it('returns a schema.org Person that resolves to the profile page', () => {
    const person = authorPerson();
    expect(person['@type']).toBe('Person');
    expect(person.name).toBe(AUTHOR.name);
    expect(person.url).toBe(AUTHOR.url);
    expect(person.sameAs).toEqual(AUTHOR.sameAs);
    expect(person.jobTitle).toBe(AUTHOR.jobTitle);
  });
});
