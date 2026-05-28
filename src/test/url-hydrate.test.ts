import { describe, expect, it } from 'vitest';
import {
  earningsEntriesToRecords,
  parseDob,
  parseRecipient,
  parseRecipientFromEarnings,
} from '$lib/url-hydrate';

describe('parseDob', () => {
  it('parses a valid YYYY-MM-DD string', () => {
    const result = parseDob('1965-09-21');
    expect(result).not.toBeNull();
    expect(result!.layBirthYear()).toBe(1965);
  });

  it('returns null for null input', () => {
    expect(parseDob(null)).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(parseDob('not-a-date')).toBeNull();
  });

  it('rejects unanchored matches', () => {
    expect(parseDob('1965-09-21-extra')).toBeNull();
    expect(parseDob('junk1965-09-21')).toBeNull();
  });

  it('returns null for out-of-range year/month/day instead of throwing', () => {
    expect(parseDob('1899-09-21')).toBeNull();
    expect(parseDob('2300-01-01')).toBeNull();
    expect(parseDob('2025-13-01')).toBeNull();
    expect(parseDob('2025-02-31')).toBeNull();
  });
});

describe('earningsEntriesToRecords', () => {
  it('sorts entries by year ascending', () => {
    const records = earningsEntriesToRecords([
      { year: 2022, amount: 60000 },
      { year: 2020, amount: 50000 },
      { year: 2021, amount: 55000 },
    ]);
    expect(records.map((r) => r.year)).toEqual([2020, 2021, 2022]);
  });

  it('produces empty array for empty input', () => {
    expect(earningsEntriesToRecords([])).toEqual([]);
  });
});

describe('parseRecipient (PIA-based)', () => {
  it('returns a Recipient when pia and dob are valid', () => {
    const r = parseRecipient(3000, '1965-09-21', 'Alex');
    expect(r).not.toBeNull();
    expect(r!.name).toBe('Alex');
  });

  it('returns null when pia is null', () => {
    expect(parseRecipient(null, '1965-09-21', 'Alex')).toBeNull();
  });

  it('returns null when dob is missing', () => {
    expect(parseRecipient(3000, null, 'Alex')).toBeNull();
  });

  it('defaults name to "Self" when omitted', () => {
    const r = parseRecipient(3000, '1965-09-21', null);
    expect(r!.name).toBe('Self');
  });
});

describe('parseRecipientFromEarnings', () => {
  it('returns a Recipient for valid earnings + dob', () => {
    const r = parseRecipientFromEarnings(
      [{ year: 2020, amount: 50000 }],
      '1965-09-21',
      'Alex'
    );
    expect(r).not.toBeNull();
    expect(r!.name).toBe('Alex');
    expect(r!.earningsRecords.length).toBe(1);
  });

  it('returns null when earnings is empty', () => {
    expect(parseRecipientFromEarnings([], '1965-09-21', 'Alex')).toBeNull();
  });

  it('returns null when earnings is null', () => {
    expect(parseRecipientFromEarnings(null, '1965-09-21', 'Alex')).toBeNull();
  });

  it('returns null when dob is missing', () => {
    expect(
      parseRecipientFromEarnings([{ year: 2020, amount: 50000 }], null, 'Alex')
    ).toBeNull();
  });
});
