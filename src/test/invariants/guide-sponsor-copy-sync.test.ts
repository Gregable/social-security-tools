/**
 * Ensures every guide that renders the sponsor CTA writes its own pitch,
 * and that the pitch is shaped the way SponsorAd renders it. It also pins
 * which guides carry the second (`guide-inline-apply`) card and that no
 * guide renders two cards under one placement.
 *
 * The copy lives in each guide's +page.svelte so it sits next to the prose
 * it has to follow on from, which puts it out of reach of a normal import.
 * These tests therefore read it back out of the pages: svelte's parser
 * locates the CTA and the page's script, and the TypeScript parser reads
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

/** A copy object's strings, keyed by property name. */
type CopyStrings = Record<string, string[]>;

/** One `<InlineCTA type="sponsor" />` as a guide page renders it. */
interface SponsorCard {
  readonly slug: string;
  /** The analytics placement; the first card's is the component default. */
  readonly placement: string;
  /** The script constant passed as `sponsorCopy`, if one is passed. */
  readonly copyName: string | null;
  readonly copy: CopyStrings;
  /** Tag name of the element right after the card, e.g. `h2`. */
  readonly followedBy: string | null;
}

const FIRST_CARD = 'guide-inline';
const APPLY_CARD = 'guide-inline-apply';

/**
 * Guides that carry a second sponsor card ahead of their "how to apply"
 * section. Listed here rather than discovered so that adding the card to
 * a guide is a deliberate decision, recorded in the change that adds the
 * guide here. Keep it sorted: the test compares it with the sorted list of
 * guides found.
 */
const APPLY_CARD_GUIDES = [
  'divorced-spouse',
  'government-pension-offset',
  'retroactive-survivor-benefits',
  'spousal-benefits',
  'survivor-benefits',
];

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
 * The strings in a `const <name> = {...}` declaration, keyed by property
 * name. Arrays and plain strings are flattened the same way, so `bullets`
 * comes back as its elements.
 */
function readSponsorCopy(script: string, name: string): CopyStrings {
  const source = ts.createSourceFile(
    'guide.ts',
    script,
    ts.ScriptTarget.Latest,
    true
  );
  const copy: CopyStrings = {};
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (declaration.name.text !== name) continue;
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

/** The text of a `name="text"` attribute, or null if it is not plain text. */
function attributeText(attribute: Record<string, unknown>): string | null {
  for (const part of walk(attribute.value)) {
    if (part.type === 'Text' && typeof part.data === 'string') {
      return part.data;
    }
  }
  return null;
}

/**
 * The identifier in a `name={identifier}` or `{name}` attribute. Null for
 * any other expression (a spread, a ternary, a member access): the copy
 * such an expression renders cannot be read back from one constant, so
 * the card then fails the "writes its own pitch" check instead of being
 * checked against strings it does not show.
 */
function attributeIdentifier(
  attribute: Record<string, unknown>
): string | null {
  const parts = [attribute.value].flat() as Record<string, unknown>[];
  if (parts.length !== 1 || parts[0]?.type !== 'ExpressionTag') return null;
  const expression = parts[0].expression as Record<string, unknown>;
  if (expression?.type !== 'Identifier') return null;
  return typeof expression.name === 'string' ? expression.name : null;
}

/** Tag name of the first element after `index`, skipping text and comments. */
function nextElementName(
  siblings: Record<string, unknown>[],
  index: number
): string | null {
  for (const sibling of siblings.slice(index + 1)) {
    if (sibling.type === 'Text' || sibling.type === 'Comment') continue;
    return typeof sibling.name === 'string' ? sibling.name : null;
  }
  return null;
}

/** Every `<InlineCTA type="sponsor" ... />` across the guide pages. */
function sponsorCards(): SponsorCard[] {
  const cards: SponsorCard[] = [];
  for (const slug of guideSlugs()) {
    const source = readFileSync(
      resolve(guidesDir, slug, '+page.svelte'),
      'utf-8'
    );
    const ast = parse(source, { modern: true });
    const span = ast.instance?.content as unknown as SourceSpan | undefined;
    const script = span ? source.slice(span.start, span.end) : '';

    // Visit each list of sibling nodes, so a card can see what follows it.
    for (const parent of walk(ast.fragment)) {
      if (!Array.isArray(parent.nodes)) continue;
      const siblings = parent.nodes as Record<string, unknown>[];
      siblings.forEach((node, index) => {
        if (node.type !== 'Component' || node.name !== 'InlineCTA') return;
        const attributes = (node.attributes ?? []) as Record<string, unknown>[];
        const named = (name: string) => attributes.find((a) => a.name === name);

        const type = named('type');
        if (!type || attributeText(type) !== 'sponsor') return;
        const placement = named('placement');
        const copy = named('sponsorCopy');
        const copyName = copy ? attributeIdentifier(copy) : null;
        cards.push({
          slug,
          placement: placement
            ? (attributeText(placement) ?? '(not plain text)')
            : FIRST_CARD,
          copyName,
          copy: copyName ? readSponsorCopy(script, copyName) : {},
          followedBy: nextElementName(siblings, index),
        });
      });
    }
  }
  return cards;
}

const cardLabel = (card: SponsorCard) => `${card.slug} (${card.placement})`;

describe('guide sponsor copy', () => {
  const cards = sponsorCards();
  const sponsorSlugs = [...new Set(cards.map((card) => card.slug))].sort();
  const labelled = cards.map((card) => [cardLabel(card), card] as const);

  it('finds the guides that render a sponsor CTA', () => {
    // A floor, so an empty scan cannot make the it.each blocks vacuous.
    expect(sponsorSlugs.length).toBeGreaterThan(10);
  });

  it.each(labelled)(
    'writes %s its own pitch instead of falling back to the generic one',
    (_label, card) => {
      expect(card.copyName).toBeTruthy();
      expect(card.copy.intro?.[0]).toBeTruthy();
      expect(card.copy.outro?.[0]).toBeTruthy();
      expect(card.copy.bullets?.length).toBeGreaterThan(0);
    }
  );

  it.each(labelled)(
    'renders %s as one sentence built around the sponsor name',
    (_label, card) => {
      const intro = card.copy.intro?.[0] ?? '';
      const outro = card.copy.outro?.[0] ?? '';
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

  it.each(labelled)(
    'supports %s with well-formed bullets that never repeat the sponsor name',
    (_label, card) => {
      for (const bullet of card.copy.bullets ?? []) {
        expect(bullet).toBe(bullet.trim());
        expect(bullet.endsWith('.')).toBe(true);
      }
      // SponsorAd supplies the name itself; a fragment repeating it would
      // render the sponsor's name twice in a row.
      for (const fragment of Object.values(card.copy).flat()) {
        expect(fragment).not.toContain(SPONSOR.name);
      }
    }
  );

  it('keeps the CTA type config agreeing with what the pages render', () => {
    const configured = Object.entries(GUIDE_CTA_TYPES)
      .filter(([, type]) => type === 'sponsor')
      .map(([slug]) => slug)
      .sort();
    expect(configured).toEqual(sponsorSlugs);
  });

  describe('second card ahead of the apply section', () => {
    const cardsOn = (slug: string) =>
      cards.filter((card) => card.slug === slug);

    it('appears on exactly the guides chosen for it', () => {
      const withApplyCard = cards
        .filter((card) => card.placement === APPLY_CARD)
        .map((card) => card.slug)
        .sort();
      expect(withApplyCard).toEqual(APPLY_CARD_GUIDES);
    });

    it.each(sponsorSlugs)(
      'gives %s one first card and no placement twice',
      (slug) => {
        const expected = APPLY_CARD_GUIDES.includes(slug)
          ? [FIRST_CARD, APPLY_CARD]
          : [FIRST_CARD];
        // Two cards under one placement would share an impression count
        // and make the click rate of either unreadable.
        expect(cardsOn(slug).map((card) => card.placement)).toEqual(expected);
      }
    );

    it.each(APPLY_CARD_GUIDES)(
      'puts the second card on %s directly above a section heading',
      (slug) => {
        // The card is pitched at the reader about to act, so it belongs
        // right before the section that says how, not somewhere inside it.
        const second = cardsOn(slug).find(
          (card) => card.placement === APPLY_CARD
        );
        expect(second?.followedBy).toBe('h2');
      }
    );

    it.each(APPLY_CARD_GUIDES)(
      'gives the second card on %s a different pitch from the first',
      (slug) => {
        const [first, second] = cardsOn(slug);
        expect(second?.copyName).toBeTruthy();
        expect(second?.copyName).not.toBe(first?.copyName);
        expect(second?.copy.intro).not.toEqual(first?.copy.intro);
      }
    );
  });
});
