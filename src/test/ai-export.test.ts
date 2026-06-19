import { describe, expect, it } from 'vitest';

import { buildCalculatorAiExport } from '$lib/ai-export';
import { benefitAtAge } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { MAX_COLA_YEAR, MAX_WAGE_INDEX_YEAR } from '$lib/constants';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';
import { MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

/**
 * Tests for the "Copy for AI assistant" markdown export (issue #553, Phase 1:
 * the pure builder). The builder turns a calculator Recipient into a
 * self-contained markdown snippet a user can paste into an LLM chat.
 *
 * Expected values are derived from the same domain APIs the builder uses, so
 * the tests stay correct across the annual constants update rather than pinning
 * hardcoded dollar amounts.
 */

const EARNINGS_TABLE_HEADER = '### Taxed earnings history';

function earningsRecord(year: number, amount: number): EarningRecord {
  return new EarningRecord({
    year,
    taxedEarnings: Money.from(amount),
    taxedMedicareEarnings: Money.from(amount),
  });
}

/** A 35-year earner: comfortably eligible, with non-zero PIA and benefits. */
function eligibleRecipient(): Recipient {
  const r = new Recipient();
  r.name = 'Alex';
  r.gender = 'male';
  // Sep 21, 1965.
  r.birthdate = Birthdate.FromYMD(1965, 8, 21);
  const records: EarningRecord[] = [];
  for (let year = 1990; year <= 2024; year++) {
    records.push(earningsRecord(year, 60000));
  }
  r.earningsRecords = records;
  return r;
}

/** A 3-year earner: under 40 credits, so not eligible (PIA is $0). */
function ineligibleRecipient(): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(1965, 8, 21);
  r.earningsRecords = [
    earningsRecord(2016, 50000),
    earningsRecord(2017, 55000),
    earningsRecord(2018, 60000),
  ];
  return r;
}

function piaOnlyRecipient(): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(1960, 0, 1);
  r.setPia(Money.from(2000));
  return r;
}

/**
 * A young earner under 40 credits now, but projected to reach 40 with future
 * earnings. Exercises the middle eligibility branch.
 */
function projectedEligibleRecipient(): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(1990, 0, 1);
  r.earningsRecords = [
    earningsRecord(2022, 50000),
    earningsRecord(2023, 55000),
    earningsRecord(2024, 60000),
  ];
  r.simulateFutureEarningsYears(15, Money.from(60000));
  return r;
}

const ageOf = (years: number) =>
  MonthDuration.initFromYearsMonths({ years, months: 0 });

describe('buildCalculatorAiExport', () => {
  it('returns a non-empty markdown document with a top-level heading', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    expect(md.length).toBeGreaterThan(0);
    expect(md).toMatch(/^#\s/m);
  });

  it('includes the PIA, FRA, and AIME', () => {
    const r = eligibleRecipient();
    const md = buildCalculatorAiExport(r);

    expect(md).toContain(r.pia().primaryInsuranceAmount().wholeDollars());
    expect(md).toContain(r.normalRetirementAge().toFullAgeString());
    expect(md).toContain(r.monthlyIndexedEarnings().wholeDollars());
  });

  it('includes the monthly benefit at ages 62, FRA, and 70', () => {
    const r = eligibleRecipient();
    const md = buildCalculatorAiExport(r);

    for (const a of [ageOf(62), r.normalRetirementAge(), ageOf(70)]) {
      expect(md).toContain(benefitAtAge(r, a).wholeDollars());
    }
  });

  it('includes an earnings table (years and amounts) by default', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    expect(md).toContain(EARNINGS_TABLE_HEADER);
    // Assert the full "| year | $amount |" row shape, not just the substrings.
    expect(md).toMatch(/\| 2016 \| \$[\d,]+ \|/);
    expect(md).toMatch(/\| 2024 \| \$[\d,]+ \|/);
    expect(md).toContain(Money.from(60000).wholeDollars());
  });

  it('omits the earnings table when includeEarnings is false', () => {
    const r = eligibleRecipient();
    const md = buildCalculatorAiExport(r, { includeEarnings: false });
    expect(md).not.toContain(EARNINGS_TABLE_HEADER);
    // The computed results (PIA) must still be present.
    expect(md).toContain(r.pia().primaryInsuranceAmount().wholeDollars());
  });

  it('omits the earnings table for a PIA-only recipient', () => {
    const r = piaOnlyRecipient();
    const md = buildCalculatorAiExport(r);
    expect(md).not.toContain(EARNINGS_TABLE_HEADER);
    expect(md).toContain(r.pia().primaryInsuranceAmount().wholeDollars());
    expect(md).toMatch(/PIA/i);
  });

  it('discloses eligibility and credit count for an eligible earner', () => {
    const r = eligibleRecipient();
    const md = buildCalculatorAiExport(r);
    expect(md).toMatch(/eligible/i);
    expect(md).toMatch(/40 of 40 credits/i);
  });

  it('flags a not-yet-eligible earner so the $0 PIA is explained', () => {
    const r = ineligibleRecipient();
    const md = buildCalculatorAiExport(r);
    expect(md).toMatch(/not yet eligible/i);
    expect(md).toMatch(/\d+ of 40 credits/i);
    // The PIA is genuinely $0 for an ineligible recipient.
    expect(r.pia().primaryInsuranceAmount().value()).toBe(0);
  });

  it('notes when an earner is projected to reach eligibility with future earnings', () => {
    const r = projectedEligibleRecipient();
    // Verify the fixture really is the middle branch: not eligible by earned
    // credits alone, but on track once projected earnings are counted.
    expect(r.earnedCredits()).toBeLessThan(40);
    expect(r.totalCredits()).toBeGreaterThanOrEqual(40);

    const md = buildCalculatorAiExport(r);
    expect(md).toMatch(/projected to reach 40/i);
    expect(md).toMatch(/\d+ of 40 credits earned so far/i);
  });

  it('includes methodology footnotes with the vintage years', () => {
    const r = eligibleRecipient();
    const md = buildCalculatorAiExport(r);

    expect(md).toContain('PIA uses the SSA bend-point formula');
    expect(md).toContain(String(MAX_COLA_YEAR));
    expect(md).toContain(String(MAX_WAGE_INDEX_YEAR));
    expect(md).toContain(String(r.indexingYear()));
  });

  it('does not claim a bend-point/COLA derivation for a PIA-only recipient', () => {
    // A PIA-only recipient entered the PIA directly, so the bend-point formula
    // and COLA assumptions were NOT used to derive it. Saying otherwise would
    // feed the AI a false methodology.
    const md = buildCalculatorAiExport(piaOnlyRecipient());
    expect(md).not.toContain('PIA uses the SSA bend-point formula');
    expect(md).not.toMatch(
      /Cost-of-living adjustments \(COLA\) are applied through/i
    );
    expect(md).toMatch(/not derived from an earnings record/i);
  });

  it('includes a /calculator deep link with pia/dob/name/gender params', () => {
    const r = eligibleRecipient();
    const md = buildCalculatorAiExport(r);

    expect(md).toContain('https://ssa.tools/calculator#');
    // dob1 must be ISO YYYY-MM-DD (1-indexed month): Sep 21, 1965.
    expect(md).toContain('dob1=1965-09-21');
    expect(md).toContain('name1=Alex');
    expect(md).toContain('gender1=male');
    expect(md).toMatch(/pia1=\d+/);
  });

  it('honors a custom baseUrl for the deep link', () => {
    const md = buildCalculatorAiExport(eligibleRecipient(), {
      baseUrl: 'https://example.test/calculator',
    });
    expect(md).toContain('https://example.test/calculator#');
  });

  it('omits name1 from the deep link for the default "Self" name', () => {
    const r = eligibleRecipient();
    r.name = 'Self';
    expect(buildCalculatorAiExport(r)).not.toContain('name1=');

    r.name = '';
    expect(buildCalculatorAiExport(r)).not.toContain('name1=');
  });

  it('omits gender1 from the deep link for the default blended gender', () => {
    const r = eligibleRecipient();
    r.gender = 'blended';
    expect(buildCalculatorAiExport(r)).not.toContain('gender1=');
  });

  it('builds a correct deep link for a PIA-only recipient (ground-truth anchor)', () => {
    // PIA-only PIA is an input ($2,000), not computed from constants, so these
    // literals are stable across the annual constants update and anchor the
    // otherwise self-referential dollar assertions. Jan birthdate also pins the
    // month 0-index -> 1-index conversion at the lower boundary.
    const md = buildCalculatorAiExport(piaOnlyRecipient());
    expect(md).toContain('$2,000');
    expect(md).toContain('pia1=2000');
    expect(md).toContain('dob1=1960-01-01');
  });

  it('includes privacy and not-advice caveats', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    expect(md).toMatch(/not .*(financial|legal).*advice/i);
    expect(md).toMatch(/browser|client-side/i);
  });

  it('includes suggested follow-up topics', () => {
    const md = buildCalculatorAiExport(eligibleRecipient());
    expect(md).toMatch(/spousal/i);
    expect(md).toMatch(/survivor/i);
    expect(md).toMatch(/tax/i);
    expect(md).toMatch(/medicare/i);
  });

  it('produces identical output for identical inputs', () => {
    const r = eligibleRecipient();
    expect(buildCalculatorAiExport(r)).toEqual(buildCalculatorAiExport(r));
  });

  it('omits the generated-on line when no generatedDate is given', () => {
    // The only formatted "as of today" value is gated on options.generatedDate;
    // without it, nothing clock-derived should appear in the output.
    const md = buildCalculatorAiExport(eligibleRecipient());
    expect(md).not.toMatch(/Generated/);
  });

  it('includes an injected generated date when provided', () => {
    const md = buildCalculatorAiExport(eligibleRecipient(), {
      generatedDate: '2026-06-19',
    });
    expect(md).toContain('2026-06-19');
  });
});
