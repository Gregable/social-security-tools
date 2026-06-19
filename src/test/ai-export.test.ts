import { describe, expect, it } from 'vitest';

import {
  buildCalculatorAiExport,
  buildCoupleCalculatorAiExport,
} from '$lib/ai-export';
import { benefitAtAge } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';
import { MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

/**
 * Tests for the "Copy for AI assistant" markdown export (issue #553). The
 * builders turn a calculator Recipient (or couple) into a self-contained
 * markdown derivation a user can paste into an LLM chat.
 *
 * Where possible, expectations are derived from the same domain APIs the
 * builder uses, so the tests survive the annual SSA constants update rather
 * than pinning hardcoded dollar amounts. One PIA-only literal ($2,000) anchors
 * the suite to a known ground truth.
 */

function earningsRecord(year: number, amount: number): EarningRecord {
  return new EarningRecord({
    year,
    taxedEarnings: Money.from(amount),
    taxedMedicareEarnings: Money.from(amount),
  });
}

/** A 35-year $60k earner: eligible, non-zero PIA. Named, male. */
function eligibleRecipient(name = 'Alex'): Recipient {
  const r = new Recipient();
  r.name = name;
  r.gender = 'male';
  r.birthdate = Birthdate.FromYMD(1965, 8, 21); // Sep 21, 1965
  const records: EarningRecord[] = [];
  for (let year = 1990; year <= 2024; year++) {
    records.push(earningsRecord(year, 60000));
  }
  r.earningsRecords = records;
  return r;
}

/**
 * A low earner (12 years of $14k): eligible for their own benefit, but their
 * PIA stays well under half the higher earner's PIA, so they qualify for a
 * spousal top-up.
 */
function lowerEarner(name = 'Jordan'): Recipient {
  const r = new Recipient();
  r.name = name;
  r.birthdate = Birthdate.FromYMD(1966, 2, 10);
  const records: EarningRecord[] = [];
  for (let year = 2005; year <= 2016; year++) {
    records.push(earningsRecord(year, 14000));
  }
  r.earningsRecords = records;
  return r;
}

function piaOnlyRecipient(): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(1960, 0, 1);
  r.setPia(Money.from(2000));
  return r;
}

const ageOf = (years: number) =>
  MonthDuration.initFromYearsMonths({ years, months: 0 });

/** Returns the consecutive `| ... |` table lines that begin at `headerStart`. */
function tableLines(md: string, headerStart: string): string[] {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.startsWith(headerStart));
  if (start < 0) return [];
  const out: string[] = [];
  for (let i = start; i < lines.length && lines[i].startsWith('|'); i++) {
    out.push(lines[i]);
  }
  return out;
}

describe('buildCalculatorAiExport (single, earnings-based)', () => {
  it('has a top-level heading and an injected generated date', () => {
    const md = buildCalculatorAiExport(eligibleRecipient(), {
      generatedDate: '2026-06-18',
    });
    expect(md).toMatch(/^# Social Security benefit summary/m);
    expect(md).toContain('2026-06-18');
  });

  it('omits the generated-on line when no date is given (no clock read)', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    expect(md).not.toMatch(/Generated/);
  });

  it('orders the sections with AIME before PIA', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    const idx = (h: string) => md.indexOf(h);
    expect(idx('## Eligibility')).toBeGreaterThan(-1);
    expect(idx('## Average Indexed Monthly Earnings')).toBeGreaterThan(
      idx('## Eligibility')
    );
    expect(idx('## Primary Insurance Amount')).toBeGreaterThan(
      idx('## Average Indexed Monthly Earnings')
    );
    expect(idx('## Filing age adjustments')).toBeGreaterThan(
      idx('## Primary Insurance Amount')
    );
    expect(idx('## Monthly benefit by filing age')).toBeGreaterThan(
      idx('## Filing age adjustments')
    );
  });

  it('drops the old caveats and follow-up sections', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    expect(md).not.toMatch(/## Caveats/i);
    expect(md).not.toMatch(/follow-up/i);
  });

  it('shows eligibility with a credit table and 40-credit status', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    expect(md).toMatch(/40 of 40 credits earned/);
    expect(md).toContain('| Year | Taxed earnings | Credits | Cumulative |');
  });

  it('includes the indexed-earnings formula and the AIME averaging', () => {
    const r = eligibleRecipient();
    const md = buildCalculatorAiExport(r);
    expect(md).toContain(
      'indexed earnings = capped taxed earnings × index factor'
    );
    expect(md).toMatch(/index factor =/);
    // AIME table columns and the /420 average.
    expect(md).toContain('| Index factor | Indexed earnings | Top 35 |');
    expect(md).toContain('/ 420');
    expect(md).toContain(r.monthlyIndexedEarnings().wholeDollars());
  });

  it('includes the worked PIA bend-point formula', () => {
    const r = eligibleRecipient();
    const md = buildCalculatorAiExport(r);
    expect(md).toContain('90% of AIME up to');
    expect(md).toContain('32% of AIME between');
    expect(md).toContain('15% of AIME above');
    expect(md).toMatch(/rounded down to the dime/);
    expect(md).toContain(r.pia().primaryInsuranceAmount().wholeDollars());
  });

  it('explains the early/delayed filing rules and the January DRC rule', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    // Phrases may wrap across lines in the prose, so allow internal whitespace.
    expect(md).toMatch(/5\/9 of 1% per\s+month/);
    expect(md).toMatch(/5\/12 of 1% per\s+month/);
    expect(md).toMatch(/delayed retirement credits/i);
    expect(md).toMatch(/do not take effect until January/i);
  });

  it('lists the benefit for every filing month from earliest through 70', () => {
    const r = eligibleRecipient();
    const md = buildCalculatorAiExport(r);
    const benefitRows = md.match(/^\|\s*\d+y \d+m\s*\|\s*\$[\d,]+ \|$/gm) ?? [];
    // Earliest filing (62y1m here) through 70y0m is ~96 months.
    expect(benefitRows.length).toBeGreaterThan(90);
    // Use ages that are in the table (it starts at the earliest filing month,
    // 62y1m for a birthday after the 2nd, not 62y0m).
    const ages = [
      r.birthdate.earliestFilingMonth(),
      r.normalRetirementAge(),
      ageOf(70),
    ];
    for (const a of ages) {
      expect(md).toContain(benefitAtAge(r, a).wholeDollars());
    }
  });

  it('aligns table columns to a fixed width (monospace-readable)', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    const lines = tableLines(md, '| Year | Taxed earnings | Index factor');
    expect(lines.length).toBeGreaterThan(3);
    const width = lines[0].length;
    for (const line of lines) {
      expect(line.length).toBe(width);
    }
  });

  it('includes embeddable chart links (with the name) and iframe snippets', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    expect(md).toContain('## Interactive charts (embeddable)');
    expect(md).toContain('https://ssa.tools/embed/filing-age#pia1=');
    expect(md).toContain('name1=Alex');
    expect(md).toContain('https://ssa.tools/embed/indexed-earnings#earnings1=');
    expect(md).toContain('https://ssa.tools/embed/bend-points#earnings1=');
    expect(md).toMatch(/<iframe src="https:\/\/ssa\.tools\/embed\/filing-age/);
  });

  it('includes a /calculator deep link with ISO dob and name', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    expect(md).toContain('https://ssa.tools/calculator#');
    expect(md).toContain('dob1=1965-09-21'); // pins the month 0->1 conversion
    expect(md).toContain('name1=Alex');
  });

  it('is deterministic for identical inputs', () => {
    const r = eligibleRecipient();
    expect(buildCalculatorAiExport(r)).toEqual(buildCalculatorAiExport(r));
  });
});

describe('buildCalculatorAiExport (PIA-only)', () => {
  it('states the PIA was entered directly and skips earnings sections', () => {
    const md = buildCalculatorAiExport(piaOnlyRecipient());
    expect(md).toContain('$2,000'); // ground-truth anchor (input, not computed)
    expect(md).toMatch(/entered directly/i);
    expect(md).toMatch(/not derived from an earnings record/i);
    expect(md).not.toContain('## Eligibility');
    expect(md).not.toContain('## Average Indexed Monthly Earnings');
    expect(md).not.toContain('PIA uses the SSA bend-point formula');
  });

  it('still shows filing rules, a benefit table, and a filing-age embed only', () => {
    const md = buildCalculatorAiExport(piaOnlyRecipient());
    expect(md).toContain('## Filing age adjustments');
    expect(md).toContain('## Monthly benefit by filing age');
    expect(md).toContain('dob1=1960-01-01'); // January birthdate, lower boundary
    // No earnings means no indexed-earnings/bend-points embeds.
    expect(md).toContain('https://ssa.tools/embed/filing-age#');
    expect(md).not.toContain('https://ssa.tools/embed/indexed-earnings');
    expect(md).not.toContain('https://ssa.tools/embed/bend-points');
  });
});

describe('buildCoupleCalculatorAiExport', () => {
  it('includes both partners full breakdowns and a couple heading', () => {
    const md = buildCoupleCalculatorAiExport(
      eligibleRecipient('Alex'),
      lowerEarner('Jordan')
    );
    expect(md).toMatch(/summary for a couple/i);
    expect(md).toContain('# Alex');
    expect(md).toContain('# Jordan');
    // Each partner has the per-recipient sections (two of each header).
    expect(md.match(/## Monthly benefit by filing age/g)?.length).toBe(2);
  });

  it('details spousal benefits with the formula and a claiming table', () => {
    const md = buildCoupleCalculatorAiExport(
      eligibleRecipient('Alex'),
      lowerEarner('Jordan')
    );
    expect(md).toContain('## Spousal benefits');
    expect(md).toMatch(/50% of/);
    expect(md).toMatch(/25\/36 of 1% per month/);
    expect(md).toMatch(/NO delayed retirement\s+credits/i);
    expect(md).toContain('| Lower earner files at | Spousal top-up / month |');
  });

  it('details survivor benefits (100%, widow limit, survivor FRA, switching)', () => {
    const md = buildCoupleCalculatorAiExport(
      eligibleRecipient('Alex'),
      lowerEarner('Jordan')
    );
    expect(md).toContain('## Survivor benefits');
    expect(md).toMatch(/100% of what/i);
    expect(md).toMatch(/82\.5% of/);
    expect(md).toMatch(/71\.5% at age 60/);
    expect(md).toMatch(/survivor full retirement age/i);
    expect(md).toMatch(/switch/i);
  });

  it('includes the couple deep link and couple + per-person embeds with names', () => {
    const md = buildCoupleCalculatorAiExport(
      eligibleRecipient('Alex'),
      lowerEarner('Jordan')
    );
    // The deep link carries both recipients (name1/gender1 may sit between
    // params, so assert each param individually rather than in sequence).
    const deepLink =
      md.match(/https:\/\/ssa\.tools\/calculator#\S+/)?.[0] ?? '';
    expect(deepLink).toMatch(/pia1=\d+/);
    expect(deepLink).toMatch(/dob1=[\d-]+/);
    expect(deepLink).toMatch(/pia2=\d+/);
    expect(deepLink).toMatch(/dob2=[\d-]+/);
    expect(md).toContain('https://ssa.tools/embed/filing-age-couple#');
    expect(md).toContain('name1=Alex');
    expect(md).toContain('name2=Jordan');
  });
});
