/**
 * Ensures every guide that renders the sponsor CTA writes its own pitch,
 * and that the pitch is shaped the way SponsorAd renders it.
 *
 * The copy lives in each guide's +page.svelte so it sits next to the prose
 * it has to follow on from, which puts it out of reach of a normal import.
 * These tests therefore read it back out of the pages: svelte's parser
 * locates the CTA and the module script, and the TypeScript parser reads
 * the object literal. That keeps the guarantee tied to what the pages
 * actually render rather than to a table that could drift from them.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'svelte/compiler';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { SPONSOR } from '$lib/sponsor';
import { GUIDE_CTA_TYPES } from '../../routes/guides/guide-cta-config';

const guidesDir = resolve(__dirname, '../../routes/guides');

/**
 * Svelte's parser records source offsets on the script's Program node, but
 * types it as a plain ESTree Program, which does not declare them.
 */
interface SourceSpan {
  readonly start: number;
  readonly end: number;
}

interface GuidePitch {
  readonly slug: string;
  readonly passesCopy: boolean;
  readonly copy: Record<string, string[]>;
}

function guideSlugs(): string[] {
  return readdirSync(guidesDir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        existsSync(resolve(guidesDir, d.name, '+page.svelte'))
    )
    .map((d) => d.name)
    .sort();
}

/** Every node in a svelte fragment, depth first. */
function* walk(node: unknown): Generator<Record<string, unknown>> {
  if (!node || typeof node !== 'object') return;
  const record = node as Record<string, unknown>;
  if (typeof record.type === 'string') yield record;
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) yield* walk(item);
    } else if (value && typeof value === 'object') {
      yield* walk(value);
    }
  }
}

/**
 * The strings in a `const sponsorCopy = {...}` declaration, keyed by
 * property name. Arrays and plain strings are flattened the same way, so
 * `bullets` comes back as its elements.
 */
function readSponsorCopy(script: string): Record<string, string[]> {
  const source = ts.createSourceFile(
    'guide.ts',
    script,
    ts.ScriptTarget.Latest,
    true
  );
  const copy: Record<string, string[]> = {};
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (declaration.name.text !== 'sponsorCopy') continue;
      const init = declaration.initializer;
      if (!init || !ts.isObjectLiteralExpression(init)) continue;
      for (const property of init.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        if (!ts.isIdentifier(property.name)) continue;
        const value = property.initializer;
        if (ts.isStringLiteral(value)) {
          copy[property.name.text] = [value.text];
        } else if (ts.isArrayLiteralExpression(value)) {
          copy[property.name.text] = value.elements
            .filter(ts.isStringLiteral)
            .map((element) => element.text);
        }
      }
    }
  }
  return copy;
}

/** Guides whose page renders `<InlineCTA type="sponsor" ... />`. */
function sponsorGuides(): GuidePitch[] {
  const pitches: GuidePitch[] = [];
  for (const slug of guideSlugs()) {
    const source = readFileSync(
      resolve(guidesDir, slug, '+page.svelte'),
      'utf-8'
    );
    const ast = parse(source, { modern: true });

    let isSponsor = false;
    let passesCopy = false;
    for (const node of walk(ast.fragment)) {
      if (node.type !== 'Component' || node.name !== 'InlineCTA') continue;
      const attributes = (node.attributes ?? []) as Record<string, unknown>[];
      for (const attribute of attributes) {
        if (attribute.name === 'sponsorCopy') passesCopy = true;
        if (attribute.name !== 'type') continue;
        for (const part of walk(attribute.value)) {
          if (part.type === 'Text' && part.data === 'sponsor') isSponsor = true;
        }
      }
    }
    if (!isSponsor) continue;

    const span = ast.instance?.content as unknown as SourceSpan | undefined;
    const script = span ? source.slice(span.start, span.end) : '';
    pitches.push({ slug, passesCopy, copy: readSponsorCopy(script) });
  }
  return pitches;
}

describe('guide sponsor copy', () => {
  const pitches = sponsorGuides();

  it('finds the guides that render a sponsor CTA', () => {
    // A floor, so an empty scan cannot make the it.each blocks vacuous.
    expect(pitches.length).toBeGreaterThan(10);
  });

  it.each(pitches.map((p) => p.slug))(
    'writes %s its own pitch instead of falling back to the generic one',
    (slug) => {
      const pitch = pitches.find((p) => p.slug === slug);
      expect(pitch?.passesCopy).toBe(true);
      expect(pitch?.copy.intro?.[0]).toBeTruthy();
      expect(pitch?.copy.outro?.[0]).toBeTruthy();
      expect(pitch?.copy.bullets?.length).toBeGreaterThan(0);
    }
  );

  it.each(pitches.map((p) => p.slug))(
    'renders %s as one sentence built around the sponsor name',
    (slug) => {
      const copy = pitches.find((p) => p.slug === slug)?.copy ?? {};
      const intro = copy.intro?.[0] ?? '';
      const outro = copy.outro?.[0] ?? '';
      // SponsorAd emits intro, the name, and outro as sibling nodes and
      // relies on HTML collapsing the newlines between them into single
      // spaces, so each fragment must carry no padding of its own.
      expect(intro).toBe(intro.trim());
      expect(outro).toBe(outro.trim());
      // The name has to read as part of the clause: "...specialist at
      // Social Security Advisors to talk it through."
      expect(intro.endsWith(' at')).toBe(true);
      expect(outro).toMatch(/^[a-z]/);
      expect(outro.endsWith('.')).toBe(true);
    }
  );

  it.each(pitches.map((p) => p.slug))(
    'supports %s with well-formed bullets that never repeat the sponsor name',
    (slug) => {
      const copy = pitches.find((p) => p.slug === slug)?.copy ?? {};
      for (const bullet of copy.bullets ?? []) {
        expect(bullet).toBe(bullet.trim());
        expect(bullet.endsWith('.')).toBe(true);
      }
      // SponsorAd supplies the name itself; a fragment repeating it would
      // render the sponsor's name twice in a row.
      for (const fragment of Object.values(copy).flat()) {
        expect(fragment).not.toContain(SPONSOR.name);
      }
    }
  );

  it('keeps the CTA type config agreeing with what the pages render', () => {
    const configured = Object.entries(GUIDE_CTA_TYPES)
      .filter(([, type]) => type === 'sponsor')
      .map(([slug]) => slug)
      .sort();
    expect(configured).toEqual(pitches.map((p) => p.slug));
  });
});
