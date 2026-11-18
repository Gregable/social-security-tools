import { describe, expect, it } from 'vitest';
import {
  chatUrlWithRef,
  newSponsorRef,
  SPONSOR_REF_ALPHABET,
} from '$lib/sponsor-ref';

describe('newSponsorRef', () => {
  it('is six characters from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const ref = newSponsorRef();
      expect(ref).toHaveLength(6);
      for (const ch of ref) expect(SPONSOR_REF_ALPHABET).toContain(ch);
    }
  });

  it('leaves out characters staff could misread when copying', () => {
    for (const ch of '01ILOU') expect(SPONSOR_REF_ALPHABET).not.toContain(ch);
  });

  it('does not repeat across calls', () => {
    const refs = new Set(Array.from({ length: 500 }, newSponsorRef));
    expect(refs.size).toBe(500);
  });
});

describe('chatUrlWithRef', () => {
  const base = 'https://direct.lc.chat/4725641';

  it('passes ref and source as LiveChat session variables', () => {
    expect(chatUrlWithRef(base, 'M5RNCC')).toBe(
      'https://direct.lc.chat/4725641?params=ref%3DM5RNCC%26source%3Dssa.tools'
    );
  });

  it('round-trips through the same decoding the chat page uses', () => {
    const url = new URL(chatUrlWithRef(base, 'K7QX2M'));
    const vars = new URLSearchParams(url.searchParams.get('params') ?? '');
    expect(Object.fromEntries(vars)).toEqual({
      ref: 'K7QX2M',
      source: 'ssa.tools',
    });
  });

  it('returns the bare link when there is no ref yet', () => {
    expect(chatUrlWithRef(base, '')).toBe(base);
  });
});
