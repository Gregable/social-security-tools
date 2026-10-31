import { describe, expect, it } from 'vitest';
import {
  type ClipboardTextReader,
  canReadClipboard,
  readClipboardText,
} from '$lib/clipboard-paste';

function resolvingWith(text: string): ClipboardTextReader {
  return { readText: () => Promise.resolve(text) };
}

function rejectingWith(error: unknown): ClipboardTextReader {
  return { readText: () => Promise.reject(error) };
}

describe('canReadClipboard', () => {
  it('is true when readText is available', () => {
    expect(canReadClipboard(resolvingWith(''))).toBe(true);
  });

  it('is false with no clipboard', () => {
    expect(canReadClipboard(undefined)).toBe(false);
  });

  it('is false for a clipboard that can only write', () => {
    expect(canReadClipboard({ writeText: () => Promise.resolve() })).toBe(
      false
    );
  });
});

describe('readClipboardText', () => {
  it('returns the clipboard text', async () => {
    expect(await readClipboardText(resolvingWith('2010\t$1,000'))).toEqual({
      kind: 'text',
      text: '2010\t$1,000',
    });
  });

  it('keeps surrounding whitespace in the text it returns', async () => {
    expect(await readClipboardText(resolvingWith('\n2010 $1\n'))).toEqual({
      kind: 'text',
      text: '\n2010 $1\n',
    });
  });

  it('treats an empty clipboard as empty', async () => {
    expect(await readClipboardText(resolvingWith(''))).toEqual({
      kind: 'empty',
    });
  });

  it('treats whitespace-only text as empty', async () => {
    expect(await readClipboardText(resolvingWith(' \n\t '))).toEqual({
      kind: 'empty',
    });
  });

  it('reports a denied read by its error name', async () => {
    const denied = new DOMException('Read denied', 'NotAllowedError');
    expect(await readClipboardText(rejectingWith(denied))).toEqual({
      kind: 'unavailable',
      errorName: 'NotAllowedError',
    });
  });

  it('reports a plain Error by its name', async () => {
    expect(await readClipboardText(rejectingWith(new TypeError('x')))).toEqual({
      kind: 'unavailable',
      errorName: 'TypeError',
    });
  });

  it('reports a rejection that is not an error as unknown', async () => {
    expect(await readClipboardText(rejectingWith('nope'))).toEqual({
      kind: 'unavailable',
      errorName: 'unknown',
    });
  });

  it('reports a readText that throws synchronously', async () => {
    const throwing: ClipboardTextReader = {
      readText: () => {
        throw new DOMException('Insecure', 'SecurityError');
      },
    };
    expect(await readClipboardText(throwing)).toEqual({
      kind: 'unavailable',
      errorName: 'SecurityError',
    });
  });
});
