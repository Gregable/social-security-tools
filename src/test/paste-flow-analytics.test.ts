import { describe, expect, it } from 'vitest';
import {
  clipboardReadProperties,
  describeFailedPaste,
  failedPasteProperties,
  nextFailureState,
  type PasteOutcome,
  selectAllShortcut,
} from '$lib/analytics/paste-flow';
import { claimOncePerSession } from '$lib/analytics/session-once';

describe('selectAllShortcut', () => {
  it('uses Cmd on a Mac', () => {
    expect(selectAllShortcut('MacIntel')).toBe('Cmd+A');
  });

  it('uses Ctrl for Windows, Linux and unknown platforms', () => {
    expect(selectAllShortcut('Win32')).toBe('Ctrl+A');
    expect(selectAllShortcut('Linux x86_64')).toBe('Ctrl+A');
    expect(selectAllShortcut('')).toBe('Ctrl+A');
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

  it('counts a trailing newline as an extra empty line', () => {
    expect(describeFailedPaste('a\nb\n').line_count).toBe(3);
  });

  it('detects tab characters', () => {
    expect(describeFailedPaste('2010\t$1').has_tabs).toBe(true);
    expect(describeFailedPaste('2010 $1').has_tabs).toBe(false);
  });

  it('counts year-like tokens so failures with table data can be told apart', () => {
    const summary = describeFailedPaste('2010 $5 2011 $6 1999 9999 20101 1899');
    expect(summary.year_token_count).toBe(3);
  });

  it('counts one year in a realistic SSA table row', () => {
    expect(describeFailedPaste('2010\t$45,000\t$45,000').year_token_count).toBe(
      1
    );
  });

  it('does not count digits inside a dollar amount with a comma', () => {
    expect(describeFailedPaste('$1,999').year_token_count).toBe(0);
  });

  it('reports zero year tokens for unrelated text', () => {
    expect(describeFailedPaste('no data here').year_token_count).toBe(0);
  });
});

describe('failedPasteProperties', () => {
  it('sends exactly the reviewed fields, so new ones need a deliberate change', () => {
    const props = failedPasteProperties('anything at all', true, 'paste_box');
    expect(Object.keys(props).sort()).toEqual([
      'char_count',
      'has_tabs',
      'is_spouse_entry',
      'line_count',
      'source',
      'wrong_page',
      'year_token_count',
    ]);
    expect(props.is_spouse_entry).toBe(true);
  });

  it('reports how the text got into the paste box', () => {
    expect(
      failedPasteProperties('anything', false, 'clipboard_button').source
    ).toBe('clipboard_button');
  });

  it('reports the recognized wrong page', () => {
    const props = failedPasteProperties(
      'Eligibility and Earnings\nReview your full earnings record now\n',
      false,
      'paste_box'
    );
    expect(props.wrong_page).toBe('my_ssa_home');
  });

  it('reports no wrong page for an unrecognized paste', () => {
    expect(
      failedPasteProperties('anything at all', false, 'paste_box').wrong_page
    ).toBeNull();
  });
});

describe('clipboardReadProperties', () => {
  it('never includes the clipboard text', () => {
    const props = clipboardReadProperties(
      { kind: 'text', text: 'Pat 2010 $45,000' },
      false
    );
    expect(props).toEqual({ result: 'text', is_spouse_entry: false });
    expect(JSON.stringify(props)).not.toContain('Pat');
  });

  it('reports an empty clipboard', () => {
    expect(clipboardReadProperties({ kind: 'empty' }, true)).toEqual({
      result: 'empty',
      is_spouse_entry: true,
    });
  });

  it('adds the error name only when the clipboard could not be read', () => {
    expect(
      clipboardReadProperties(
        { kind: 'unavailable', errorName: 'NotAllowedError' },
        false
      )
    ).toEqual({
      result: 'unavailable',
      error_name: 'NotAllowedError',
      is_spouse_entry: false,
    });
  });
});

describe('nextFailureState', () => {
  function run(outcomes: PasteOutcome[]): boolean[] {
    let reported = false;
    return outcomes.map((outcome) => {
      const next = nextFailureState(reported, outcome);
      reported = next.reported;
      return next.report;
    });
  }

  it('reports the first failure of an attempt only once while edits keep failing', () => {
    expect(run(['failed', 'failed', 'failed'])).toEqual([true, false, false]);
  });

  it('starts a new attempt after the box is cleared', () => {
    expect(run(['failed', 'empty', 'failed'])).toEqual([true, false, true]);
  });

  it('never reports an empty box', () => {
    expect(run(['empty', 'empty'])).toEqual([false, false]);
  });

  it('never reports a successful paste', () => {
    expect(run(['parsed'])).toEqual([false]);
  });

  it('starts a new attempt after a success', () => {
    expect(run(['failed', 'parsed', 'failed'])).toEqual([true, false, true]);
  });
});

describe('claimOncePerSession', () => {
  function fakeStorage(): Pick<Storage, 'getItem' | 'setItem'> {
    const map = new Map<string, string>();
    return {
      getItem: (key) => map.get(key) ?? null,
      setItem: (key, value) => {
        map.set(key, value);
      },
    };
  }

  it('returns true the first time and false afterwards', () => {
    const storage = fakeStorage();
    expect(claimOncePerSession(storage, 'k')).toBe(true);
    expect(claimOncePerSession(storage, 'k')).toBe(false);
  });

  it('tracks keys independently', () => {
    const storage = fakeStorage();
    expect(claimOncePerSession(storage, 'a')).toBe(true);
    expect(claimOncePerSession(storage, 'b')).toBe(true);
  });

  it('returns true when storage is unavailable rather than throwing', () => {
    const broken: Pick<Storage, 'getItem' | 'setItem'> = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(claimOncePerSession(broken, 'k')).toBe(true);
  });
});
