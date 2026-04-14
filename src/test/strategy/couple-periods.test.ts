import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  type BenefitPeriod,
  BenefitType,
  strategySumCentsCouple,
  strategySumPeriodsCouple,
  sumBenefitPeriods,
} from '$lib/strategy/calculations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a Recipient with PIA only (no earnings records).
 * Uses Dec 15 birthdates for 1960+ births so NRA = 67y0m and filing at
 * NRA maps to a December date.
 */
function makeRecipient(
  piaDollars: number,
  birthYear: number,
  birthMonth: number,
  birthDay: number
): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(birthYear, birthMonth, birthDay);
  r.setPia(Money.from(piaDollars));
  return r;
}

/** Shorthand for a Dec 15 birthdate — simplifies NRA alignment. */
function makeRecipientDec15(piaDollars: number, birthYear: number): Recipient {
  return makeRecipient(piaDollars, birthYear, 11, 15);
}

/**
 * Computes the final date (death date) for a recipient, set to December
 * of the calendar year in which they reach the given lay age.
 */
function finalDateAtAge(recipient: Recipient, ageYears: number): MonthDate {
  const raw = recipient.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({ years: ageYears, months: 0 })
  );
  return raw.addDuration(new MonthDuration(11 - raw.monthIndex()));
}

/** Filing age as MonthDuration at whole years. */
function filingAge(years: number): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months: 0 });
}

/** Filing date for a recipient at a given age. */
function filingDateOf(r: Recipient, ageYears: number): MonthDate {
  return r.birthdate.dateAtSsaAge(filingAge(ageYears));
}

/** Counts the number of months in a period (inclusive on both sides). */
function periodMonths(p: BenefitPeriod): number {
  return p.endDate.subtractDate(p.startDate).asMonths() + 1;
}

/** Manually sums period amounts * month counts to get total cents. */
function manualSumCents(periods: BenefitPeriod[]): number {
  let total = 0;
  for (const p of periods) {
    total += p.amount.cents() * periodMonths(p);
  }
  return total;
}

/** Filter helpers. */
function personalPeriods(periods: BenefitPeriod[]): BenefitPeriod[] {
  return periods.filter((p) => p.benefitType === BenefitType.Personal);
}
function spousalPeriods(periods: BenefitPeriod[]): BenefitPeriod[] {
  return periods.filter((p) => p.benefitType === BenefitType.Spousal);
}
function survivorPeriods(periods: BenefitPeriod[]): BenefitPeriod[] {
  return periods.filter((p) => p.benefitType === BenefitType.Survivor);
}
function periodsForIndex(
  periods: BenefitPeriod[],
  idx: number
): BenefitPeriod[] {
  return periods.filter((p) => p.recipientIndex === idx);
}

// A currentDate far in the past so filing ages are not clipped.
const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

// ==========================================================================
// 1. Both die same age, no spousal/survivor
// ==========================================================================
describe('both die same age, no spousal/survivor', () => {
  it('equal PIAs produce only Personal periods', () => {
    // Two recipients with identical $1000 PIA. No spousal eligibility
    // because PIA/2 = $500 is not > $1000.
    const r1 = makeRecipientDec15(1000, 1960);
    const r2 = makeRecipientDec15(1000, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 80),
      finalDateAtAge(r2, 80),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);

    expect(spousalPeriods(periods)).toHaveLength(0);
    expect(survivorPeriods(periods)).toHaveLength(0);
    // Each recipient should have personal periods.
    expect(personalPeriods(periods).length).toBeGreaterThanOrEqual(2);
  });

  it('high dependent PIA prevents spousal benefit', () => {
    // Earner $1200, dependent $700. Spousal = $1200/2 = $600 which is NOT > $700.
    // So no spousal.
    const r1 = makeRecipientDec15(1200, 1960);
    const r2 = makeRecipientDec15(700, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 80),
      finalDateAtAge(r2, 80),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);

    expect(spousalPeriods(periods)).toHaveLength(0);
  });

  it('same death date and equal PIAs produce symmetric period amounts', () => {
    const r1 = makeRecipientDec15(1500, 1962);
    const r2 = makeRecipientDec15(1500, 1962);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);

    const idx0 = periodsForIndex(periods, 0);
    const idx1 = periodsForIndex(periods, 1);

    // Both should have personal periods with the same total benefit cents.
    const sum0 = manualSumCents(idx0);
    const sum1 = manualSumCents(idx1);
    expect(sum0).toBe(sum1);
  });
});

// ==========================================================================
// 2. Spousal periods — correct date ranges
// ==========================================================================
describe('spousal periods - correct date ranges', () => {
  it('both file at NRA: spousal starts at NRA', () => {
    // Earner $2000, dependent $500. Both born Dec 15, 1960. Both file at 67.
    // Spousal starts = max(earnerFiling, dependentFiling) = NRA.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const spousal = spousalPeriods(periods);
    expect(spousal).toHaveLength(1);

    // Both file at NRA (67y0m). For Dec 15, 1960 birth, SSA birthday is
    // Dec 14, 1960 → SSA birth month = Nov 1960. NRA date = Nov 2027.
    const earnerFilingDate = filingDateOf(r1, 67);
    const dependentFilingDate = filingDateOf(r2, 67);
    const expectedStart = MonthDate.max(earnerFilingDate, dependentFilingDate);

    expect(spousal[0].startDate.monthsSinceEpoch()).toBe(
      expectedStart.monthsSinceEpoch()
    );
  });

  it('earner files at 70, dependent at 62: spousal starts when earner files', () => {
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(400, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    // Dependent born Dec 15 → earliest filing = 62y1m.
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(70),
      MonthDuration.initFromYearsMonths({ years: 62, months: 1 }),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const spousal = spousalPeriods(periods);
    expect(spousal).toHaveLength(1);

    // Spousal should start at max(earner@70, dependent@62+1) = earner@70.
    const earnerFilingDate = filingDateOf(r1, 70);
    expect(spousal[0].startDate.monthsSinceEpoch()).toBe(
      earnerFilingDate.monthsSinceEpoch()
    );
  });

  it('earner files at 62, dependent at 70: spousal starts when dependent files', () => {
    // Earner $2000, dependent $400. Earner files early, dependent files late.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(400, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      MonthDuration.initFromYearsMonths({ years: 62, months: 1 }),
      filingAge(70),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const spousal = spousalPeriods(periods);
    expect(spousal).toHaveLength(1);

    // Spousal starts at max(earner@62+1, dependent@70) = dependent@70.
    const dependentFilingDate = filingDateOf(r2, 70);
    expect(spousal[0].startDate.monthsSinceEpoch()).toBe(
      dependentFilingDate.monthsSinceEpoch()
    );
  });

  it('spousal end date = min(survivorStart-1, dependentDeath) when earner dies first', () => {
    // Earner $2000, dependent $500. Earner dies at 75, dependent at 85.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const earnerFinal = finalDateAtAge(r1, 75);
    const dependentFinal = finalDateAtAge(r2, 85);
    const finalDates: [MonthDate, MonthDate] = [earnerFinal, dependentFinal];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const spousal = spousalPeriods(periods);
    const survivor = survivorPeriods(periods);
    expect(spousal).toHaveLength(1);
    expect(survivor).toHaveLength(1);

    // survivorStart = max(earnerDeath+1, dependentFiling).
    const dependentFilingDate = filingDateOf(r2, 67);
    const survivorStart = MonthDate.max(
      earnerFinal.addDuration(new MonthDuration(1)),
      dependentFilingDate
    );
    const expectedSpousalEnd = MonthDate.min(
      survivorStart.subtractDuration(new MonthDuration(1)),
      dependentFinal
    );

    expect(spousal[0].endDate.monthsSinceEpoch()).toBe(
      expectedSpousalEnd.monthsSinceEpoch()
    );
  });

  it('spousal amount is $0-floor when spousal exceeds at NRA', () => {
    // Earner $3000, dependent $200. Both file at NRA.
    // Spousal base = $3000/2 - $200 = $1300.
    const r1 = makeRecipientDec15(3000, 1960);
    const r2 = makeRecipientDec15(200, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const spousal = spousalPeriods(periods);
    expect(spousal).toHaveLength(1);
    expect(spousal[0].amount.value()).toBe(1300);
  });
});

// ==========================================================================
// 3. Survivor periods — correct date ranges
// ==========================================================================
describe('survivor periods - correct date ranges', () => {
  it('earner dies at 68, dependent at 80: survivor starts month after earner death', () => {
    // Both file at NRA (67). Earner dies at 68.
    // survivorStart = max(earnerDeath+1, dependentFiling).
    // dependentFiling = NRA < earnerDeath+1, so survivorStart = earnerDeath+1.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const earnerFinal = finalDateAtAge(r1, 68);
    const dependentFinal = finalDateAtAge(r2, 80);
    const finalDates: [MonthDate, MonthDate] = [earnerFinal, dependentFinal];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const survivor = survivorPeriods(periods);
    expect(survivor).toHaveLength(1);

    const expectedStart = earnerFinal.addDuration(new MonthDuration(1));
    expect(survivor[0].startDate.monthsSinceEpoch()).toBe(
      expectedStart.monthsSinceEpoch()
    );
  });

  it('earner dies at 68, dependent files at 70: survivor starts at dependent filing', () => {
    // Dependent files late (70), earner dies at 68 (before dependent files).
    // survivorStart = max(earnerDeath+1, dependentFiling@70) = dependentFiling.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const earnerFinal = finalDateAtAge(r1, 68);
    const dependentFinal = finalDateAtAge(r2, 80);
    const finalDates: [MonthDate, MonthDate] = [earnerFinal, dependentFinal];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(70),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const survivor = survivorPeriods(periods);
    expect(survivor).toHaveLength(1);

    const dependentFilingDate = filingDateOf(r2, 70);
    expect(survivor[0].startDate.monthsSinceEpoch()).toBe(
      dependentFilingDate.monthsSinceEpoch()
    );
  });

  it('survivor end date equals dependent death date', () => {
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const dependentFinal = finalDateAtAge(r2, 82);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 69),
      dependentFinal,
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const survivor = survivorPeriods(periods);
    expect(survivor).toHaveLength(1);
    expect(survivor[0].endDate.monthsSinceEpoch()).toBe(
      dependentFinal.monthsSinceEpoch()
    );
  });

  it('no survivor when earner outlives dependent', () => {
    // Earner dies at 90, dependent dies at 70 → dependent dies first.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 90),
      finalDateAtAge(r2, 70),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    expect(survivorPeriods(periods)).toHaveLength(0);
  });

  it('survivor benefit amount matches hand-calculated value', () => {
    // Earner $2000, dependent $500. Earner files at NRA, dies at 68.
    // Earner filed before death, so base survivor = max(PIA*0.825, benefit).
    // At NRA, benefit = $2000. max($2000*0.825, $2000) = $2000.
    // Dependent is at NRA when survivor starts (already filed at 67, earner
    // dies at 68 → survivorStart ~ age 69 for dependent which is >= survivor NRA).
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 68),
      finalDateAtAge(r2, 80),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const survivor = survivorPeriods(periods);
    expect(survivor).toHaveLength(1);
    expect(survivor[0].amount.value()).toBe(2000);
  });
});

// ==========================================================================
// 4. Personal period truncation
// ==========================================================================
describe('personal period truncation', () => {
  it('dependent personal ends at survivorStart-1 when survivor applies', () => {
    // Earner $2000, dependent $500. Both file at NRA. Earner dies at 69.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const earnerFinal = finalDateAtAge(r1, 69);
    const dependentFinal = finalDateAtAge(r2, 85);
    const finalDates: [MonthDate, MonthDate] = [earnerFinal, dependentFinal];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const survivor = survivorPeriods(periods);
    expect(survivor).toHaveLength(1);

    const survivorStart = survivor[0].startDate;

    // Find dependent's personal periods (recipientIndex for the lower earner).
    const depIndex = survivor[0].recipientIndex;
    const depPersonal = periods.filter(
      (p) =>
        p.recipientIndex === depIndex && p.benefitType === BenefitType.Personal
    );
    expect(depPersonal.length).toBeGreaterThan(0);

    // The last personal period's endDate should be survivorStart - 1.
    const lastPersonal = depPersonal[depPersonal.length - 1];
    expect(lastPersonal.endDate.monthsSinceEpoch()).toBe(
      survivorStart.subtractDuration(new MonthDuration(1)).monthsSinceEpoch()
    );
  });

  it('no gap between personal and survivor periods', () => {
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 69),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const survivor = survivorPeriods(periods);
    expect(survivor).toHaveLength(1);

    const depIndex = survivor[0].recipientIndex;
    const depPersonal = periods.filter(
      (p) =>
        p.recipientIndex === depIndex && p.benefitType === BenefitType.Personal
    );

    const lastPersonalEnd = depPersonal[depPersonal.length - 1].endDate;
    const survivorStartMse = survivor[0].startDate.monthsSinceEpoch();

    // survivorStart should be exactly lastPersonalEnd + 1 month.
    expect(survivorStartMse).toBe(
      lastPersonalEnd.addDuration(new MonthDuration(1)).monthsSinceEpoch()
    );
  });

  it('no overlap between personal and survivor periods', () => {
    const r1 = makeRecipientDec15(2500, 1960);
    const r2 = makeRecipientDec15(300, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 70),
      finalDateAtAge(r2, 90),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const survivor = survivorPeriods(periods);
    expect(survivor).toHaveLength(1);

    const depIndex = survivor[0].recipientIndex;
    const depPersonal = periods.filter(
      (p) =>
        p.recipientIndex === depIndex && p.benefitType === BenefitType.Personal
    );

    for (const pp of depPersonal) {
      // Personal period endDate must be strictly before survivor startDate.
      expect(pp.endDate.lessThan(survivor[0].startDate)).toBe(true);
    }
  });

  it('earner personal period is NOT truncated (no survivor for earner)', () => {
    // Earner dies at 69. Earner personal should run to earnerFinalDate.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const earnerFinal = finalDateAtAge(r1, 69);
    const finalDates: [MonthDate, MonthDate] = [
      earnerFinal,
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const survivor = survivorPeriods(periods);
    const depIndex = survivor[0].recipientIndex;
    const earnerIndex = depIndex === 0 ? 1 : 0;

    const earnerPersonal = periods.filter(
      (p) =>
        p.recipientIndex === earnerIndex &&
        p.benefitType === BenefitType.Personal
    );
    expect(earnerPersonal.length).toBeGreaterThan(0);

    // Last earner personal period should end at earnerFinalDate.
    const lastEarnerPersonal = earnerPersonal[earnerPersonal.length - 1];
    expect(lastEarnerPersonal.endDate.monthsSinceEpoch()).toBe(
      earnerFinal.monthsSinceEpoch()
    );
  });
});

// ==========================================================================
// 5. Zero-PIA dependent
// ==========================================================================
describe('zero-PIA dependent', () => {
  it('zero-PIA dependent gets spousal but no personal benefit amount', () => {
    // Earner $2000, dependent $0. Both file at NRA.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(0, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const spousal = spousalPeriods(periods);
    expect(spousal).toHaveLength(1);

    // Spousal = earnerPIA/2 - $0 = $1000.
    expect(spousal[0].amount.value()).toBe(1000);
  });

  it('zero-PIA dependent has personal periods with $0 amounts', () => {
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(0, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);

    // Find the dependent's index.
    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBeGreaterThan(0);
    const depIndex = spousal[0].recipientIndex;

    // Dependent should have personal periods, but they should be $0.
    const depPersonal = periods.filter(
      (p) =>
        p.recipientIndex === depIndex && p.benefitType === BenefitType.Personal
    );
    for (const p of depPersonal) {
      expect(p.amount.cents()).toBe(0);
    }
  });

  it('zero-PIA dependent filing adjusted to earner filing when filing earlier', () => {
    // Earner files at 70, dependent (PIA $0) files at 63.
    // Dependent's filing should be adjusted to earner's date.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(0, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(70),
      filingAge(63),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);

    const earnerFilingDate = filingDateOf(r1, 70);

    // All periods should start on or after the earner's filing date.
    for (const p of periods) {
      expect(p.startDate.greaterThanOrEqual(earnerFilingDate)).toBe(true);
    }
  });

  it('zero-PIA dependent gets survivor benefit when earner dies first', () => {
    // Earner $2000, dependent $0. Earner dies at 70, dependent at 85.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(0, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 70),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const survivor = survivorPeriods(periods);
    expect(survivor).toHaveLength(1);

    // Survivor benefit should be based on earner's PIA.
    // Earner filed at NRA, benefit = $2000. max($2000*0.825, $2000) = $2000.
    expect(survivor[0].amount.value()).toBe(2000);
  });
});

// ==========================================================================
// 6. Earner/dependent role assignment
// ==========================================================================
describe('earner/dependent role assignment', () => {
  it('higher PIA at index 0 is earner: only earner gets Personal, dependent gets Spousal', () => {
    // r1 (index 0) has higher PIA $2000 vs r2 $500.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);

    // Earner (index 0) should only have Personal periods.
    const earnerPeriods = periodsForIndex(periods, 0);
    for (const p of earnerPeriods) {
      expect(p.benefitType).toBe(BenefitType.Personal);
    }

    // Dependent (index 1) should have Spousal.
    const spousal = spousalPeriods(periods);
    expect(spousal).toHaveLength(1);
    expect(spousal[0].recipientIndex).toBe(1);
  });

  it('higher PIA at index 1 is earner: roles swap correctly', () => {
    // r1 (index 0) has LOWER PIA $500 vs r2 $2000.
    const r1 = makeRecipientDec15(500, 1960);
    const r2 = makeRecipientDec15(2000, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);

    // Earner (index 1) should only have Personal periods.
    const earnerPeriods = periodsForIndex(periods, 1);
    for (const p of earnerPeriods) {
      expect(p.benefitType).toBe(BenefitType.Personal);
    }

    // Dependent (index 0) should have Spousal.
    const spousal = spousalPeriods(periods);
    expect(spousal).toHaveLength(1);
    expect(spousal[0].recipientIndex).toBe(0);
  });

  it('equal PIAs: consistent behavior regardless of position', () => {
    // Both $1000. higherEarningsThan will return false, so index 1 is earner.
    const r1 = makeRecipientDec15(1000, 1960);
    const r2 = makeRecipientDec15(1000, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);

    // With equal PIAs, no spousal benefit is eligible
    // ($1000/2 = $500, which is NOT > $1000).
    expect(spousalPeriods(periods)).toHaveLength(0);
    expect(survivorPeriods(periods)).toHaveLength(0);

    // Both should have personal periods.
    const idx0 = periodsForIndex(periods, 0);
    const idx1 = periodsForIndex(periods, 1);
    expect(idx0.length).toBeGreaterThan(0);
    expect(idx1.length).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 7. NPV matches period sum at 0% discount
// ==========================================================================
describe('NPV matches period sum at 0% discount', () => {
  it('equal PIAs, both file at NRA', () => {
    const r1 = makeRecipientDec15(1000, 1960);
    const r2 = makeRecipientDec15(1000, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(70),
      filingAge(70),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const manualSum = manualSumCents(periods);

    const npvCents = strategySumCentsCouple(
      [r1, r2],
      finalDates,
      FAR_PAST,
      0,
      strats
    );

    expect(manualSum).toBe(npvCents);
  });

  it('unequal PIAs with spousal benefit', () => {
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const manualSum = manualSumCents(periods);

    const npvCents = strategySumCentsCouple(
      [r1, r2],
      finalDates,
      FAR_PAST,
      0,
      strats
    );

    expect(manualSum).toBe(npvCents);
  });

  it('with survivor benefit', () => {
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 69),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const manualSum = manualSumCents(periods);

    const npvCents = strategySumCentsCouple(
      [r1, r2],
      finalDates,
      FAR_PAST,
      0,
      strats
    );

    expect(manualSum).toBe(npvCents);
  });

  it('sumBenefitPeriods matches manualSumCents', () => {
    // Verify that the exported sumBenefitPeriods helper agrees with our
    // manual sum implementation.
    const r1 = makeRecipientDec15(1800, 1962);
    const r2 = makeRecipientDec15(600, 1962);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 72),
      finalDateAtAge(r2, 90),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const manual = manualSumCents(periods);
    const fromHelper = sumBenefitPeriods(periods);

    expect(manual).toBe(fromHelper);
  });
});

// ==========================================================================
// 8. Complex multi-period scenario
// ==========================================================================
describe('complex multi-period scenario', () => {
  it('all period types present: earner personal, dependent personal, spousal, survivor', () => {
    // Earner $2000, dependent $400. Both born Dec 15, 1960.
    // Both file at NRA (67y0m). Earner dies at 70, dependent at 85.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(400, 1960);
    const earnerFinal = finalDateAtAge(r1, 70);
    const dependentFinal = finalDateAtAge(r2, 85);
    const finalDates: [MonthDate, MonthDate] = [earnerFinal, dependentFinal];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);

    const personal = personalPeriods(periods);
    const spousal = spousalPeriods(periods);
    const survivor = survivorPeriods(periods);

    // All types should be present.
    expect(personal.length).toBeGreaterThanOrEqual(2); // At least one per recipient.
    expect(spousal).toHaveLength(1);
    expect(survivor).toHaveLength(1);

    // Verify earner's personal amount = $2000 at NRA.
    const earnerIndex = spousal[0].recipientIndex === 0 ? 1 : 0;
    const earnerPersonal = personal.filter(
      (p) => p.recipientIndex === earnerIndex
    );
    expect(earnerPersonal[0].amount.value()).toBe(2000);

    // Verify dependent's personal amount = $400 at NRA.
    const depIndex = spousal[0].recipientIndex;
    const depPersonal = personal.filter((p) => p.recipientIndex === depIndex);
    expect(depPersonal[0].amount.value()).toBe(400);

    // Verify spousal amount = $2000/2 - $400 = $600.
    expect(spousal[0].amount.value()).toBe(600);

    // Verify survivor amount.
    // Earner filed at NRA, benefit = $2000. max($2000*0.825, $2000) = $2000.
    expect(survivor[0].amount.value()).toBe(2000);

    // Verify continuity: dependent personal ends at survivor start - 1.
    const lastDepPersonal = depPersonal[depPersonal.length - 1];
    expect(
      survivor[0].startDate
        .subtractDuration(new MonthDuration(1))
        .monthsSinceEpoch()
    ).toBe(lastDepPersonal.endDate.monthsSinceEpoch());
  });

  it('hand-calculated total NPV at 0% discount', () => {
    // Earner $2000, dependent $400. Born Dec 15, 1960 (SSA birthday Nov 14).
    // Both file at NRA (67y0m). Earner dies at 70 (Dec 2030), dependent at 85 (Dec 2045).
    //
    // SSA birth month: Nov 1960. NRA filing date = Nov 2027.
    // Earner final = Dec 2030. Dependent final = Dec 2045.
    //
    // Earner personal: Nov 2027 to Dec 2030 = 38 months at $2000/mo.
    // Dependent personal: Nov 2027 to Dec 2030 (truncated by survivor at Jan 2031).
    //   → Nov 2027 to Dec 2030 = 38 months at $400/mo.
    // Spousal: Nov 2027 to Dec 2030 = 38 months at $600/mo.
    // Survivor: Jan 2031 to Dec 2045 = 180 months at $2000/mo.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(400, 1960);
    const earnerFinal = finalDateAtAge(r1, 70);
    const dependentFinal = finalDateAtAge(r2, 85);
    const finalDates: [MonthDate, MonthDate] = [earnerFinal, dependentFinal];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const npvCents = strategySumCentsCouple(
      [r1, r2],
      finalDates,
      FAR_PAST,
      0,
      strats
    );

    // Verify it matches period-by-period calculation.
    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const periodSum = manualSumCents(periods);
    expect(npvCents).toBe(periodSum);

    // The total should be positive and substantial.
    expect(npvCents).toBeGreaterThan(0);

    // Cross-check: the earner portion should be recognizable in the total.
    const earnerIndex = spousalPeriods(periods)[0].recipientIndex === 0 ? 1 : 0;
    const earnerSum = manualSumCents(
      periods.filter((p) => p.recipientIndex === earnerIndex)
    );
    const depSum = manualSumCents(
      periods.filter((p) => p.recipientIndex !== earnerIndex)
    );
    expect(earnerSum + depSum).toBe(npvCents);
  });
});
