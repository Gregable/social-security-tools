import { describe, expect, it } from 'vitest';

import { Birthdate } from '$lib/birthday';
import {
  buildCalculatorExport,
  localIsoDate,
} from '$lib/components/copy-for-ai';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';

/**
 * Tests for the importable logic behind the "Copy for AI assistant" button
 * (issue #553, Phase 2). The Svelte component is a thin shell over these two
 * helpers, so the meaningful branches are tested here rather than by rendering.
 */

function earningsRecord(year: number, amount: number): EarningRecord {
  return new EarningRecord({
    year,
    taxedEarnings: Money.from(amount),
    taxedMedicareEarnings: Money.from(amount),
  });
}

/** A 35-year $60k earner: eligible, non-zero PIA. */
function eligibleRecipient(name = 'Alex'): Recipient {
  const r = new Recipient();
  r.name = name;
  r.gender = 'male';
  r.birthdate = Birthdate.FromYMD(1965, 8, 21);
  const records: EarningRecord[] = [];
  for (let year = 1990; year <= 2024; year++) {
    records.push(earningsRecord(year, 60000));
  }
  r.earningsRecords = records;
  return r;
}

/** A low earner who qualifies for a spousal top-up against the higher earner. */
function lowerEarner(name = 'Jordan'): Recipient {
  const r = new Recipient();
  r.name = name;
  r.gender = 'female';
  r.birthdate = Birthdate.FromYMD(1966, 2, 10);
  const records: EarningRecord[] = [];
  for (let year = 2005; year <= 2016; year++) {
    records.push(earningsRecord(year, 14000));
  }
  r.earningsRecords = records;
  return r;
}

describe('localIsoDate', () => {
  // The ai-export builder docs warn against deriving the "Generated" date from
  // new Date().toISOString(), whose UTC value can be a calendar day off from
  // the user's local day. localIsoDate must read the LOCAL calendar parts.
  it('formats a local date as YYYY-MM-DD', () => {
    // Constructed in local time, so the local parts are exactly (2026, Mar, 7).
    expect(localIsoDate(new Date(2026, 2, 7))).toBe('2026-03-07');
  });

  it('zero-pads single-digit months and days', () => {
    expect(localIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('handles a two-digit month and day (December 31)', () => {
    expect(localIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('reads the local calendar day, not the UTC day', () => {
    // Mirror the contract against the local getters. A toISOString()-based
    // implementation would diverge from this in any non-UTC timezone.
    const d = new Date(2026, 5, 18, 23, 30);
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(localIsoDate(d)).toBe(expected);
  });
});

describe('buildCalculatorExport', () => {
  it('uses the single-recipient builder when there is no spouse', () => {
    const out = buildCalculatorExport(eligibleRecipient(), null);
    // The single export has no couple-only analysis sections.
    expect(out).not.toContain('## Spousal benefits');
    expect(out).not.toContain('## Survivor benefits');
  });

  it('uses the couple builder when a spouse is present', () => {
    const out = buildCalculatorExport(eligibleRecipient(), lowerEarner());
    expect(out).toContain('## Spousal benefits');
    expect(out).toContain('## Survivor benefits');
  });

  it('stamps the provided generatedDate into the header', () => {
    const out = buildCalculatorExport(eligibleRecipient(), null, {
      generatedDate: '2026-03-07',
    });
    expect(out).toContain('Generated 2026-03-07');
  });

  it('forwards a custom baseUrl into the deep link', () => {
    const out = buildCalculatorExport(eligibleRecipient(), null, {
      baseUrl: 'https://example.test/calculator',
    });
    expect(out).toContain('https://example.test/calculator');
  });

  it('is deterministic given the same inputs and options', () => {
    const opts = { generatedDate: '2026-03-07' };
    const a = buildCalculatorExport(eligibleRecipient(), lowerEarner(), opts);
    const b = buildCalculatorExport(eligibleRecipient(), lowerEarner(), opts);
    expect(a).toBe(b);
  });
});
