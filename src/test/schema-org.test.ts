import { describe, expect, it } from 'vitest';
import { AUTHOR, authorBio, authorSameAs } from '$lib/author';
import { GuidesSchema, renderProfilePageSchema } from '$lib/schema-org';

function parseJsonLd(html: string): Record<string, unknown> {
  const start = html.indexOf('>') + 1;
  const end = html.lastIndexOf('</script>');
  return JSON.parse(html.slice(start, end));
}

function guideSchema(): GuidesSchema {
  const schema = new GuidesSchema();
  schema.url = 'https://ssa.tools/guides/example';
  schema.title = 'Example guide';
  schema.description = 'An example.';
  schema.datePublished = '2026-01-01T00:00:00.000Z';
  return schema;
}

describe('GuidesSchema author', () => {
  it('links the Person to the author profile page', () => {
    const json = parseJsonLd(guideSchema().render());
    const author = json.author as Record<string, unknown>;
    expect(author['@type']).toBe('Person');
    expect(author.name).toBe(AUTHOR.name);
    expect(author.url).toBe(AUTHOR.url);
    expect(author.sameAs).toEqual(authorSameAs());
  });

  it('points article:author at the profile page, not the site name', () => {
    const meta = guideSchema().renderSocialMeta();
    expect(meta).toContain(
      `<meta property="article:author" content="${AUTHOR.url}" />`
    );
    expect(meta).not.toContain('property="article:author" content="SSA.tools"');
  });
});

describe('renderProfilePageSchema', () => {
  it('renders a ProfilePage whose main entity is the author', () => {
    const json = parseJsonLd(renderProfilePageSchema());
    expect(json['@type']).toBe('ProfilePage');
    const main = json.mainEntity as Record<string, unknown>;
    expect(main['@type']).toBe('Person');
    expect(main.name).toBe(AUTHOR.name);
    expect(main.url).toBe(AUTHOR.url);
    expect(main.sameAs).toEqual(authorSameAs());
    expect(main.description).toBe(authorBio());
    const employer = main.worksFor as Record<string, unknown>;
    expect(employer.name).toBe('SSA.tools');
  });

  it('names the publisher identically on guides and the profile', () => {
    const guide = parseJsonLd(guideSchema().render());
    const profile = parseJsonLd(renderProfilePageSchema());
    const publisher = guide.publisher as Record<string, unknown>;
    const employer = (profile.mainEntity as Record<string, unknown>)
      .worksFor as Record<string, unknown>;
    expect(publisher.name).toBe(employer.name);
  });
});
