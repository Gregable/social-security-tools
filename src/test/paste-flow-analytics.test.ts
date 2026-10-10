import { describe, expect, it } from 'vitest';
import {
  copyInstructionPlatform,
  describeFailedPaste,
} from '$lib/analytics/paste-flow';

describe('copyInstructionPlatform', () => {
  it('uses touch instructions for a touch-primary screen', () => {
    expect(
      copyInstructionPlatform({ coarsePointer: true, platform: 'iPhone' })
    ).toBe('touch');
  });

  it('uses touch instructions for an iPad even though it reports a Mac platform', () => {
    expect(
      copyInstructionPlatform({ coarsePointer: true, platform: 'MacIntel' })
    ).toBe('touch');
  });

  it('uses Cmd for a Mac with a mouse or trackpad', () => {
    expect(
      copyInstructionPlatform({ coarsePointer: false, platform: 'MacIntel' })
    ).toBe('mac');
  });

  it('uses Ctrl for Windows, Linux and unknown platforms', () => {
    expect(
      copyInstructionPlatform({ coarsePointer: false, platform: 'Win32' })
    ).toBe('ctrl');
    expect(
      copyInstructionPlatform({
        coarsePointer: false,
        platform: 'Linux x86_64',
      })
    ).toBe('ctrl');
    expect(
      copyInstructionPlatform({ coarsePointer: false, platform: '' })
    ).toBe('ctrl');
  });
});

describe('describeFailedPaste', () => {
  it('reports only counts, never the pasted text', () => {
    const summary = describeFailedPaste('My name is Pat\n1999 secret notes');
    const values = Object.values(summary);
    expect(
      values.every((v) => typeof v === 'number' || typeof v === 'boolean')
    ).toBe(true);
    expect(JSON.stringify(summary)).not.toContain('Pat');
  });

  it('counts characters and lines across newline styles', () => {
    const summary = describeFailedPaste('a\nb\r\nc\rd');
    expect(summary.char_count).toBe(8);
    expect(summary.line_count).toBe(4);
  });

  it('counts a single line with no newline as one line', () => {
    expect(describeFailedPaste('hello').line_count).toBe(1);
  });

  it('detects tab characters', () => {
    expect(describeFailedPaste('2010\t$1').has_tabs).toBe(true);
    expect(describeFailedPaste('2010 $1').has_tabs).toBe(false);
  });

  it('counts year-like tokens so failures with table data can be told apart', () => {
    const summary = describeFailedPaste('2010 $5 2011 $6 1999 9999 20101 1899');
    expect(summary.year_token_count).toBe(3);
  });

  it('reports zero year tokens for unrelated text', () => {
    expect(describeFailedPaste('no data here').year_token_count).toBe(0);
  });
});
