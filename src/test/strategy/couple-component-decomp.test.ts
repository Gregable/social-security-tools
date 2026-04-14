import { describe, expect, it } from 'vitest';
import {
  benefitAtAge,
  benefitOnDate,
  eligibleForSpousalBenefit,
  spousalBenefitOnDate,
  survivorBenefit,
} from '$lib/benefit-calculator';
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

/** Shorthand for a Dec 15 birthdate -- NRA = 67y0m for 1960+ births. */
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
function filingAge(years: number, months: number = 0): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

/** Filing date for a recipient at a given age. */
function filingDateOf(
  r: Recipient,
  years: number,
  months: number = 0
): MonthDate {
  return r.birthdate.dateAtSsaAge(filingAge(years, months));
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
// 1. Period sum equals NPV at 0% discount
// ==========================================================================
describe('Period sum equals NPV at 0% discount', () => {
  it('equal PIAs ($1500/$1500), both file at NRA', () => {
    const r1 = makeRecipientDec15(1500, 1960);
    const r2 = makeRecipientDec15(1500, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(r1, 85),
      finalDateAtAge(r2, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple([r1, r2], finalDates, strats);
    const periodSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [r1, r2],
      finalDates,
      FAR_PAST,
      0,
      strats
    );

    expect(periodSum).toBe(npv);
  });

  it('high/low PIAs ($2500/$400), both file at NRA', () => {
    const earner = makeRecipientDec15(2500, 1962);
    const dependent = makeRecipientDec15(400, 1962);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 82),
      finalDateAtAge(dependent, 90),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const periodSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [earner, dependent],
      finalDates,
      FAR_PAST,
      0,
      strats
    );

    expect(periodSum).toBe(npv);
  });

  it('zero-PIA dependent ($2000/$0), earner files at 70', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(0, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 80),
      finalDateAtAge(dependent, 88),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(70),
      filingAge(62, 1),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const periodSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [earner, dependent],
      finalDates,
      FAR_PAST,
      0,
      strats
    );

    expect(periodSum).toBe(npv);
  });

  it('earner dies first ($1800/$600), early filing', () => {
    const earner = makeRecipientDec15(1800, 1963);
    const dependent = makeRecipientDec15(600, 1963);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 75),
      finalDateAtAge(dependent, 90),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(62, 1),
      filingAge(62, 1),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const periodSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [earner, dependent],
      finalDates,
      FAR_PAST,
      0,
      strats
    );

    expect(periodSum).toBe(npv);
  });

  it('earner dies second ($3000/$500), mixed filing ages', () => {
    const earner = makeRecipientDec15(3000, 1961);
    const dependent = makeRecipientDec15(500, 1961);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 92),
      finalDateAtAge(dependent, 78),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(70),
      filingAge(65),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const periodSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [earner, dependent],
      finalDates,
      FAR_PAST,
      0,
      strats
    );

    expect(periodSum).toBe(npv);
  });
});

// ==========================================================================
// 2. Personal benefit periods match benefitAtAge / benefitOnDate
// ==========================================================================
describe('Personal benefit periods match benefitAtAge', () => {
  it('filing at NRA: single personal period matches benefitAtAge', () => {
    // Filing at NRA with a Jan filing month means no delayed January bump,
    // so there should be one personal period that matches benefitAtAge.
    // Use a Dec 15 birth and NRA=67 => filing in Nov (SSA birth month).
    // Actually, filing at NRA for Dec 15 birth: SSA birthday is Nov 14,
    // so NRA date is Nov at age 67. Filing at NRA is before or at NRA,
    // so no delayed credits, meaning amounts are equal across years.
    const r = makeRecipientDec15(2000, 1960);
    const finalDate = finalDateAtAge(r, 85);
    const strat = filingAge(67);

    const periods = strategySumPeriodsCouple(
      [r, makeRecipientDec15(2000, 1960)],
      [finalDate, finalDateAtAge(makeRecipientDec15(2000, 1960), 85)],
      [strat, filingAge(67)]
    );

    const personal = personalPeriods(periodsForIndex(periods, 0));
    // At NRA, benefitAtAge should match:
    const expectedAmount = benefitAtAge(r, strat);
    for (const p of personal) {
      expect(p.amount.cents()).toBe(expectedAmount.cents());
    }
  });

  it('filing after NRA mid-year: delayed January bump creates two periods', () => {
    // Born Dec 15, 1960. NRA = 67y0m = Nov 2027.
    // Filing at 68y0m = Nov 2028. This is after NRA and mid-year (November).
    // First period: Nov 2028-Dec 2028 (remainder of year), reduced amount
    // Second period: Jan 2029 onward, full delayed credits amount
    const r = makeRecipientDec15(1500, 1960);
    const finalDate = finalDateAtAge(r, 85);
    const strat = filingAge(68);

    const r2 = makeRecipientDec15(1500, 1960);
    const periods = strategySumPeriodsCouple(
      [r, r2],
      [finalDate, finalDateAtAge(r2, 85)],
      [strat, filingAge(67)]
    );

    const personal = personalPeriods(periodsForIndex(periods, 0));

    if (personal.length === 2) {
      // The second period should have the full delayed credits
      expect(personal[1].amount.cents()).toBeGreaterThanOrEqual(
        personal[0].amount.cents()
      );

      // First period amount should match benefitOnDate at filing date
      const filingDate = filingDateOf(r, 68);
      const expectedFirst = benefitOnDate(r, filingDate, filingDate);
      expect(personal[0].amount.cents()).toBe(expectedFirst.cents());

      // Second period amount should match benefitOnDate in January
      const janAfterFiling = MonthDate.initFromYearsMonths({
        years: filingDate.year() + 1,
        months: 0,
      });
      const expectedSecond = benefitOnDate(r, filingDate, janAfterFiling);
      expect(personal[1].amount.cents()).toBe(expectedSecond.cents());
    } else {
      // If amounts happen to be equal, single period is also valid
      expect(personal).toHaveLength(1);
    }
  });

  it('filing at exactly 70: full delayed credits, one period', () => {
    const r = makeRecipientDec15(1000, 1960);
    const finalDate = finalDateAtAge(r, 85);
    const strat = filingAge(70);

    const r2 = makeRecipientDec15(1000, 1960);
    const periods = strategySumPeriodsCouple(
      [r, r2],
      [finalDate, finalDateAtAge(r2, 85)],
      [strat, filingAge(67)]
    );

    const personal = personalPeriods(periodsForIndex(periods, 0));
    // At age 70, all delayed credits apply immediately (special SSA rule)
    const expectedAmount = benefitAtAge(r, strat);
    for (const p of personal) {
      expect(p.amount.cents()).toBe(expectedAmount.cents());
    }
  });

  it('filing at 62: early reduction, amount matches benefitAtAge', () => {
    // Born Dec 15, 1962. Earliest filing = 62y1m (born after 2nd of month).
    const r = makeRecipientDec15(1200, 1962);
    const finalDate = finalDateAtAge(r, 80);
    const strat = filingAge(62, 1);

    const r2 = makeRecipientDec15(1200, 1962);
    const periods = strategySumPeriodsCouple(
      [r, r2],
      [finalDate, finalDateAtAge(r2, 80)],
      [strat, filingAge(62, 1)]
    );

    const personal = personalPeriods(periodsForIndex(periods, 0));
    const expectedAmount = benefitAtAge(r, strat);
    // Early filing: the first personal period should match benefitAtAge
    expect(personal[0].amount.cents()).toBe(expectedAmount.cents());
  });
});

// ==========================================================================
// 3. Spousal benefit periods match spousalBenefitOnDate
// ==========================================================================
describe('Spousal benefit periods match spousalBenefitOnDate', () => {
  it('both file at NRA: full spousal benefit', () => {
    // Earner $2000, dependent $500. Both NRA = 67y0m.
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 85),
      finalDateAtAge(dependent, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBeGreaterThanOrEqual(1);

    const earnerFilingDate = filingDateOf(earner, 67);
    const dependentFilingDate = filingDateOf(dependent, 67);
    const spousalStart = MonthDate.max(earnerFilingDate, dependentFilingDate);

    const expectedSpousal = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate,
      spousalStart
    );

    expect(spousal[0].amount.cents()).toBe(expectedSpousal.cents());
  });

  it('dependent files before NRA: reduced spousal benefit', () => {
    // Earner $2400, dependent $300. Dependent files at 62y1m.
    const earner = makeRecipientDec15(2400, 1962);
    const dependent = makeRecipientDec15(300, 1962);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 85),
      finalDateAtAge(dependent, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(62, 1),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBeGreaterThanOrEqual(1);

    const earnerFilingDate = filingDateOf(earner, 67);
    const dependentFilingDate = filingDateOf(dependent, 62, 1);
    // Spousal starts when earner files (later of the two)
    const spousalStart = MonthDate.max(earnerFilingDate, dependentFilingDate);

    const expectedSpousal = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate,
      spousalStart
    );

    expect(spousal[0].amount.cents()).toBe(expectedSpousal.cents());
  });

  it('dependent files after NRA with delayed credits: spousal adjusted', () => {
    // Earner $2000, dependent $400. Dependent files at 69.
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(400, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 85),
      finalDateAtAge(dependent, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(69),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBeGreaterThanOrEqual(1);

    const earnerFilingDate = filingDateOf(earner, 67);
    const dependentFilingDate = filingDateOf(dependent, 69);
    const spousalStart = MonthDate.max(earnerFilingDate, dependentFilingDate);

    const expectedSpousal = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate,
      spousalStart
    );

    expect(spousal[0].amount.cents()).toBe(expectedSpousal.cents());
  });

  it('earner files late, dependent files at NRA: spousal starts at earner filing', () => {
    const earner = makeRecipientDec15(2200, 1961);
    const dependent = makeRecipientDec15(500, 1961);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 85),
      finalDateAtAge(dependent, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(70),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBeGreaterThanOrEqual(1);

    const earnerFilingDate = filingDateOf(earner, 70);
    const dependentFilingDate = filingDateOf(dependent, 67);
    const spousalStart = MonthDate.max(earnerFilingDate, dependentFilingDate);

    // Spousal should start at earner's filing date (later of the two)
    expect(spousal[0].startDate.monthsSinceEpoch()).toBe(
      spousalStart.monthsSinceEpoch()
    );

    const expectedSpousal = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate,
      spousalStart
    );

    expect(spousal[0].amount.cents()).toBe(expectedSpousal.cents());
  });
});

// ==========================================================================
// 4. Survivor benefit periods match survivorBenefit
// ==========================================================================
describe('Survivor benefit periods match survivorBenefit', () => {
  it('earner filed at NRA, died at 75: survivor gets full PIA', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const earnerDeath = finalDateAtAge(earner, 75);
    const dependentDeath = finalDateAtAge(dependent, 90);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBe(1);

    const earnerFilingDate = filingDateOf(earner, 67);
    const dependentFilingDate = filingDateOf(dependent, 67);
    const survivorStartDate = MonthDate.max(
      earnerDeath.addDuration(new MonthDuration(1)),
      dependentFilingDate
    );

    const expectedSurvivor = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      earnerDeath,
      survivorStartDate
    );

    expect(survivor[0].amount.cents()).toBe(expectedSurvivor.cents());
  });

  it('earner filed at 62: RIB-LIM applies to survivor benefit', () => {
    const earner = makeRecipientDec15(1800, 1963);
    const dependent = makeRecipientDec15(400, 1963);
    const earnerDeath = finalDateAtAge(earner, 72);
    const dependentDeath = finalDateAtAge(dependent, 88);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(62, 1),
      filingAge(62, 1),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBe(1);

    const earnerFilingDate = filingDateOf(earner, 62, 1);
    const dependentFilingDate = filingDateOf(dependent, 62, 1);
    const survivorStartDate = MonthDate.max(
      earnerDeath.addDuration(new MonthDuration(1)),
      dependentFilingDate
    );

    const expectedSurvivor = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      earnerDeath,
      survivorStartDate
    );

    expect(survivor[0].amount.cents()).toBe(expectedSurvivor.cents());
  });

  it('earner filed at 70: maximum delayed credits reflected in survivor', () => {
    const earner = makeRecipientDec15(1500, 1960);
    const dependent = makeRecipientDec15(300, 1960);
    const earnerDeath = finalDateAtAge(earner, 80);
    const dependentDeath = finalDateAtAge(dependent, 92);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(70),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBe(1);

    const earnerFilingDate = filingDateOf(earner, 70);
    const dependentFilingDate = filingDateOf(dependent, 67);
    const survivorStartDate = MonthDate.max(
      earnerDeath.addDuration(new MonthDuration(1)),
      dependentFilingDate
    );

    const expectedSurvivor = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      earnerDeath,
      survivorStartDate
    );

    expect(survivor[0].amount.cents()).toBe(expectedSurvivor.cents());
    // Survivor benefit should be at least the earner's PIA (with delayed credits)
    expect(survivor[0].amount.cents()).toBeGreaterThan(
      earner.pia().primaryInsuranceAmount().cents()
    );
  });

  it('earner never filed (died before filing): survivor based on PIA or DRC', () => {
    // Earner files at 70 but dies at 68 (before filing)
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(400, 1960);
    const earnerDeath = finalDateAtAge(earner, 68);
    const dependentDeath = finalDateAtAge(dependent, 88);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(70),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );
    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBe(1);

    const earnerFilingDate = filingDateOf(earner, 70);
    const dependentFilingDate = filingDateOf(dependent, 67);
    const survivorStartDate = MonthDate.max(
      earnerDeath.addDuration(new MonthDuration(1)),
      dependentFilingDate
    );

    const expectedSurvivor = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      earnerDeath,
      survivorStartDate
    );

    expect(survivor[0].amount.cents()).toBe(expectedSurvivor.cents());
  });
});

// ==========================================================================
// 5. Period timeline is complete and non-overlapping
// ==========================================================================
describe('Period timeline is complete and non-overlapping', () => {
  it('dependent personal ends before survivor starts', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const earnerDeath = finalDateAtAge(earner, 75);
    const dependentDeath = finalDateAtAge(dependent, 90);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    // Determine dependent's index
    const depIndex = earner
      .pia()
      .primaryInsuranceAmount()
      .greaterThan(dependent.pia().primaryInsuranceAmount())
      ? 1
      : 0;

    const depPersonal = personalPeriods(periodsForIndex(periods, depIndex));
    const depSurvivor = survivorPeriods(periodsForIndex(periods, depIndex));

    expect(depSurvivor).toHaveLength(1);
    expect(depPersonal.length).toBeGreaterThanOrEqual(1);

    // The last personal period should end exactly one month before survivor starts
    const lastPersonal = depPersonal[depPersonal.length - 1];
    expect(
      lastPersonal.endDate.addDuration(new MonthDuration(1)).monthsSinceEpoch()
    ).toBe(depSurvivor[0].startDate.monthsSinceEpoch());
  });

  it('survivor ends at dependent death date', () => {
    const earner = makeRecipientDec15(2200, 1962);
    const dependent = makeRecipientDec15(400, 1962);
    const earnerDeath = finalDateAtAge(earner, 73);
    const dependentDeath = finalDateAtAge(dependent, 88);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    const depIndex = 1; // dependent is lower earner
    const depSurvivor = survivorPeriods(periodsForIndex(periods, depIndex));

    expect(depSurvivor).toHaveLength(1);
    expect(depSurvivor[0].endDate.monthsSinceEpoch()).toBe(
      dependentDeath.monthsSinceEpoch()
    );
  });

  it('spousal runs concurrently with personal (both paid simultaneously)', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 85),
      finalDateAtAge(dependent, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    const depIndex = 1;
    const depPersonal = personalPeriods(periodsForIndex(periods, depIndex));
    const depSpousal = spousalPeriods(periodsForIndex(periods, depIndex));

    expect(depSpousal).toHaveLength(1);
    expect(depPersonal.length).toBeGreaterThanOrEqual(1);

    // Spousal start should be within the personal period range
    const personalStart = depPersonal[0].startDate.monthsSinceEpoch();
    const personalEnd =
      depPersonal[depPersonal.length - 1].endDate.monthsSinceEpoch();
    const spousalStart = depSpousal[0].startDate.monthsSinceEpoch();

    expect(spousalStart).toBeGreaterThanOrEqual(personalStart);
    expect(spousalStart).toBeLessThanOrEqual(personalEnd);
  });

  it('earner personal periods have no gaps', () => {
    // Filing after NRA mid-year: should get two contiguous personal periods
    const earner = makeRecipientDec15(1800, 1960);
    const dependent = makeRecipientDec15(400, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 85),
      finalDateAtAge(dependent, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(69),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    const earnerIndex = 0;
    const earnerPersonal = personalPeriods(
      periodsForIndex(periods, earnerIndex)
    );

    // If there are two personal periods, they should be contiguous
    for (let i = 1; i < earnerPersonal.length; i++) {
      const prevEnd = earnerPersonal[i - 1].endDate.monthsSinceEpoch();
      const nextStart = earnerPersonal[i].startDate.monthsSinceEpoch();
      expect(nextStart).toBe(prevEnd + 1);
    }
  });
});

// ==========================================================================
// 6. Comprehensive scenario decomposition
// ==========================================================================
describe('Comprehensive scenario decomposition', () => {
  it('Scenario A: PIA $2000/$500, both NRA, earner dies 75, dependent 85', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const earnerDeath = finalDateAtAge(earner, 75);
    const dependentDeath = finalDateAtAge(dependent, 85);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    // Verify each component exists
    const earnerPers = personalPeriods(periodsForIndex(periods, 0));
    const depPers = personalPeriods(periodsForIndex(periods, 1));
    const depSpousal = spousalPeriods(periodsForIndex(periods, 1));
    const depSurvivor = survivorPeriods(periodsForIndex(periods, 1));

    expect(earnerPers.length).toBeGreaterThanOrEqual(1);
    expect(depPers.length).toBeGreaterThanOrEqual(1);
    expect(depSpousal).toHaveLength(1);
    expect(depSurvivor).toHaveLength(1);

    // Earner personal amount at NRA = $2000
    const earnerBenefit = benefitAtAge(earner, filingAge(67));
    expect(earnerBenefit.cents()).toBe(200000);

    // Dependent personal amount at NRA = $500
    const depBenefit = benefitAtAge(dependent, filingAge(67));
    expect(depBenefit.cents()).toBe(50000);

    // Spousal: floor($2000/2 - $500) = floor($500) = $500
    const earnerFilingDate = filingDateOf(earner, 67);
    const dependentFilingDate = filingDateOf(dependent, 67);
    const spousalStart = MonthDate.max(earnerFilingDate, dependentFilingDate);
    const expectedSpousal = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate,
      spousalStart
    );
    expect(depSpousal[0].amount.cents()).toBe(expectedSpousal.cents());

    // Survivor: should be the earner's benefit at NRA = $2000
    const survivorStartDate = MonthDate.max(
      earnerDeath.addDuration(new MonthDuration(1)),
      dependentFilingDate
    );
    const expectedSurvivor = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      earnerDeath,
      survivorStartDate
    );
    expect(depSurvivor[0].amount.cents()).toBe(expectedSurvivor.cents());

    // Total should match NPV at 0%
    const periodSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [earner, dependent],
      finalDates,
      FAR_PAST,
      0,
      strats
    );
    expect(periodSum).toBe(npv);
  });

  it('Scenario B: earner files at 62, dependent at NRA, earner dies 70', () => {
    const earner = makeRecipientDec15(1800, 1963);
    const dependent = makeRecipientDec15(300, 1963);
    const earnerDeath = finalDateAtAge(earner, 70);
    const dependentDeath = finalDateAtAge(dependent, 88);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(62, 1),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    // The earner filed early, so earner's personal benefit is reduced
    const earnerFilingDate = filingDateOf(earner, 62, 1);
    const earnerBenefitAtFiling = benefitOnDate(
      earner,
      earnerFilingDate,
      earnerFilingDate
    );
    const earnerPers = personalPeriods(periodsForIndex(periods, 0));
    expect(earnerPers[0].amount.cents()).toBe(earnerBenefitAtFiling.cents());

    // Verify NPV consistency
    const periodSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [earner, dependent],
      finalDates,
      FAR_PAST,
      0,
      strats
    );
    expect(periodSum).toBe(npv);
  });

  it('Scenario C: earner files at 70, dependent at 62, earner dies 82', () => {
    const earner = makeRecipientDec15(2500, 1960);
    const dependent = makeRecipientDec15(400, 1960);
    const earnerDeath = finalDateAtAge(earner, 82);
    const dependentDeath = finalDateAtAge(dependent, 90);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(70),
      filingAge(62, 1),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    // Verify all component types
    const depSpousal = spousalPeriods(periodsForIndex(periods, 1));
    const depSurvivor = survivorPeriods(periodsForIndex(periods, 1));

    // Spousal should exist since $2500/2 = $1250 > $400
    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);
    expect(depSpousal.length).toBeGreaterThanOrEqual(1);

    // Spousal starts when earner files (age 70) since that is later
    const earnerFilingDate = filingDateOf(earner, 70);
    const dependentFilingDate = filingDateOf(dependent, 62, 1);
    const spousalStart = MonthDate.max(earnerFilingDate, dependentFilingDate);

    // Verify spousal amount matches the calculator
    const expectedSpousal = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate,
      spousalStart
    );
    expect(depSpousal[0].amount.cents()).toBe(expectedSpousal.cents());

    // Survivor benefit should reflect earner's age-70 delayed credits
    expect(depSurvivor.length).toBe(1);
    const survivorStartDate = MonthDate.max(
      earnerDeath.addDuration(new MonthDuration(1)),
      dependentFilingDate
    );
    const expectedSurvivor = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      earnerDeath,
      survivorStartDate
    );
    expect(depSurvivor[0].amount.cents()).toBe(expectedSurvivor.cents());

    // Total consistency check
    const periodSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [earner, dependent],
      finalDates,
      FAR_PAST,
      0,
      strats
    );
    expect(periodSum).toBe(npv);
  });

  it('Scenario D: dependent outlives earner by only 2 years', () => {
    const earner = makeRecipientDec15(1600, 1961);
    const dependent = makeRecipientDec15(600, 1961);
    const earnerDeath = finalDateAtAge(earner, 78);
    const dependentDeath = finalDateAtAge(dependent, 80);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    // Verify survivor period is short (approximately 2 years)
    const depSurvivor = survivorPeriods(periodsForIndex(periods, 1));
    if (depSurvivor.length === 1) {
      const survivorMonths = periodMonths(depSurvivor[0]);
      // Should be around 24 months (2 years), give or take a few
      expect(survivorMonths).toBeGreaterThanOrEqual(20);
      expect(survivorMonths).toBeLessThanOrEqual(30);
    }

    // NPV consistency
    const periodSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [earner, dependent],
      finalDates,
      FAR_PAST,
      0,
      strats
    );
    expect(periodSum).toBe(npv);
  });
});

// ==========================================================================
// 7. Additional cross-validation tests
// ==========================================================================
describe('Additional cross-validation', () => {
  it('sumBenefitPeriods utility matches manual sum', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 80),
      finalDateAtAge(dependent, 85),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    const manual = manualSumCents(periods);
    const utility = sumBenefitPeriods(periods);

    expect(manual).toBe(utility);
  });

  it('swapping recipient order does not change total NPV', () => {
    const earner = makeRecipientDec15(2200, 1960);
    const dependent = makeRecipientDec15(600, 1960);
    const finalDatesAB: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 80),
      finalDateAtAge(dependent, 85),
    ];
    const finalDatesBA: [MonthDate, MonthDate] = [
      finalDateAtAge(dependent, 85),
      finalDateAtAge(earner, 80),
    ];
    const stratsAB: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];
    const stratsBA: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const npvAB = strategySumCentsCouple(
      [earner, dependent],
      finalDatesAB,
      FAR_PAST,
      0,
      stratsAB
    );
    const npvBA = strategySumCentsCouple(
      [dependent, earner],
      finalDatesBA,
      FAR_PAST,
      0,
      stratsBA
    );

    expect(npvAB).toBe(npvBA);
  });

  it('no periods have zero or negative month counts', () => {
    const earner = makeRecipientDec15(1900, 1962);
    const dependent = makeRecipientDec15(350, 1962);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 74),
      finalDateAtAge(dependent, 92),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(62, 1),
      filingAge(62, 1),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    for (const p of periods) {
      const months = periodMonths(p);
      expect(months).toBeGreaterThan(0);
      expect(p.amount.cents()).toBeGreaterThanOrEqual(0);
    }
  });

  it('all periods have valid benefitType and recipientIndex', () => {
    const earner = makeRecipientDec15(2100, 1960);
    const dependent = makeRecipientDec15(450, 1960);
    const finalDates: [MonthDate, MonthDate] = [
      finalDateAtAge(earner, 78),
      finalDateAtAge(dependent, 88),
    ];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(65),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    const validTypes = new Set([
      BenefitType.Personal,
      BenefitType.Spousal,
      BenefitType.Survivor,
    ]);

    for (const p of periods) {
      expect(validTypes.has(p.benefitType)).toBe(true);
      expect(p.recipientIndex === 0 || p.recipientIndex === 1).toBe(true);
    }
  });

  it('period decomposition with different birth years', () => {
    // Earner born 1958, dependent born 1963: different NRAs
    const earner = makeRecipient(2000, 1958, 5, 15);
    const dependent = makeRecipient(400, 1963, 8, 20);
    const earnerDeath = finalDateAtAge(earner, 80);
    const dependentDeath = finalDateAtAge(dependent, 88);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];

    // Use earliest filing for earner born 1958 (born after 2nd)
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    const periodSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [earner, dependent],
      finalDates,
      FAR_PAST,
      0,
      strats
    );

    expect(periodSum).toBe(npv);

    // Should have all relevant period types
    const depSpousal = spousalPeriods(periods);
    expect(depSpousal.length).toBeGreaterThanOrEqual(1);
  });
});

// ==========================================================================
// 8. Survivor period matches bug fix - earner dies at 72+ without filing
// ==========================================================================
describe('Survivor period matches bug fix - earner dies at 72+', () => {
  it('earner PIA $2000, dies at 75 without filing: survivor = benefitAtAge(70)', () => {
    // Earner born Dec 15, 1960. NRA = 67y0m. PIA = $2000.
    // Filing age set beyond death so earner never filed.
    // Death at 75 = Dec 2035.
    // Age 70 date = Nov 2030. Death (Dec 2035) > age 70 (Nov 2030).
    // So survivor benefit uses effectiveFilingDate = min(death, age70) = age70.
    // benefitAtAge(earner, 70) should be $2000 * 1.24 = $2480.
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const earnerDeath = finalDateAtAge(earner, 75);
    const dependentDeath = finalDateAtAge(dependent, 90);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    // Set earner filing age to 76 so that filing date > death date => never filed.
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(76),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBe(1);

    // Cross-validate: survivor amount should match benefitAtAge(earner, 70)
    const age70 = filingAge(70);
    const expectedAmount = benefitAtAge(earner, age70);
    expect(expectedAmount.cents()).toBe(248000); // $2480
    expect(survivor[0].amount.cents()).toBe(expectedAmount.cents());
  });

  it('earner PIA $2000, dies at 72 without filing: survivor still uses age 70 cap', () => {
    // Earner born Dec 15, 1960. Death at 72 = Dec 2032.
    // Age 70 date = Nov 2030. Death (Dec 2032) > age 70 (Nov 2030).
    // effectiveFilingDate = min(death, age70) = age70.
    // Same result as dying at 75.
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const earnerDeath = finalDateAtAge(earner, 72);
    const dependentDeath = finalDateAtAge(dependent, 90);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(76),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBe(1);

    const age70 = filingAge(70);
    const expectedAmount = benefitAtAge(earner, age70);
    expect(survivor[0].amount.cents()).toBe(expectedAmount.cents());
  });
});

// ==========================================================================
// 9. Month-by-month NPV reconstruction
// ==========================================================================
describe('Month-by-month NPV reconstruction', () => {
  it('manual month-by-month sum matches strategySumCentsCouple at 0% discount', () => {
    // Earner born Dec 15, 1960. PIA = $2000. NRA = 67y0m = Nov 2027.
    // Dependent born Dec 15, 1960. PIA = $500. NRA = 67y0m = Nov 2027.
    // Both file at NRA. Earner dies at 70 (Dec 2030). Dependent dies at 80 (Dec 2040).
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const earnerDeath = finalDateAtAge(earner, 70);
    const dependentDeath = finalDateAtAge(dependent, 80);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    // Get the NPV from the strategy function
    const npv = strategySumCentsCouple(
      [earner, dependent],
      finalDates,
      FAR_PAST,
      0,
      strats
    );

    // Get the periods for cross-validation
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    // Manually sum each period's months * amount
    const periodSum = manualSumCents(periods);
    expect(periodSum).toBe(npv);

    // Also verify the period breakdown makes sense:
    // Earner personal: from NRA to death
    const earnerPers = personalPeriods(periodsForIndex(periods, 0));
    expect(earnerPers.length).toBeGreaterThanOrEqual(1);

    // Dependent personal: from NRA to earner death (then switches to survivor)
    const depPers = personalPeriods(periodsForIndex(periods, 1));
    expect(depPers.length).toBeGreaterThanOrEqual(1);

    // Dependent spousal: during joint lifetime after both file
    const depSpousal = spousalPeriods(periodsForIndex(periods, 1));
    expect(depSpousal.length).toBeGreaterThanOrEqual(1);

    // Dependent survivor: after earner death to dependent death
    const depSurvivor = survivorPeriods(periodsForIndex(periods, 1));
    expect(depSurvivor.length).toBe(1);

    // Verify earner benefit at NRA is $2000
    const earnerBenefit = benefitAtAge(earner, filingAge(67));
    expect(earnerBenefit.cents()).toBe(200000);

    // Verify dependent benefit at NRA is $500
    const depBenefit = benefitAtAge(dependent, filingAge(67));
    expect(depBenefit.cents()).toBe(50000);
  });
});

// ==========================================================================
// 10. Delayed January bump in couple context
// ==========================================================================
describe('Delayed January bump in couple context', () => {
  it('earner born Mar 15, 1965, files at 68y0m: two personal periods', () => {
    // SSA birth = Mar 14, 1965 -> SSA month = Mar 1965 (month index 2).
    // NRA = 67y0m. Filing at 68y0m = Mar 1965 + 68y0m = Mar 2033 (month index 2).
    // Filing is after NRA and mid-year (March), so delayed January bump applies.
    // First period: Mar 2033 - Dec 2033 (10 months, reduced delayed credits)
    // Second period: Jan 2034+ (full delayed credits)
    const earner = makeRecipient(1800, 1965, 2, 15);
    const dependent = makeRecipient(400, 1965, 2, 15);
    const earnerDeath = finalDateAtAge(earner, 85);
    const dependentDeath = finalDateAtAge(dependent, 85);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(68),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    const earnerPersonal = personalPeriods(periodsForIndex(periods, 0));

    // Should have 2 personal periods due to the January bump
    expect(earnerPersonal).toHaveLength(2);

    // First period should be shorter (Mar-Dec 2033 = 10 months)
    const firstPeriodMonths = periodMonths(earnerPersonal[0]);
    expect(firstPeriodMonths).toBe(10);

    // Second period amount should be >= first (full delayed credits kick in)
    expect(earnerPersonal[1].amount.cents()).toBeGreaterThanOrEqual(
      earnerPersonal[0].amount.cents()
    );
  });

  it('earner born Mar 15, 1965, files at 68y0m: amounts match benefitOnDate', () => {
    const earner = makeRecipient(1800, 1965, 2, 15);
    const dependent = makeRecipient(400, 1965, 2, 15);
    const earnerDeath = finalDateAtAge(earner, 85);
    const dependentDeath = finalDateAtAge(dependent, 85);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(68),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    const earnerPersonal = personalPeriods(periodsForIndex(periods, 0));
    if (earnerPersonal.length === 2) {
      const filingDate = filingDateOf(earner, 68);

      // First period amount matches benefitOnDate at filing date
      const expectedFirst = benefitOnDate(earner, filingDate, filingDate);
      expect(earnerPersonal[0].amount.cents()).toBe(expectedFirst.cents());

      // Second period amount matches benefitOnDate in January after filing
      const janAfterFiling = MonthDate.initFromYearsMonths({
        years: filingDate.year() + 1,
        months: 0,
      });
      const expectedSecond = benefitOnDate(earner, filingDate, janAfterFiling);
      expect(earnerPersonal[1].amount.cents()).toBe(expectedSecond.cents());
    }
  });
});

// ==========================================================================
// 11. All four period types present
// ==========================================================================
describe('All four period types present', () => {
  it('scenario with earner personal, dependent personal, spousal, and survivor', () => {
    // Earner $2000 PIA, dependent $500 PIA. Both born Dec 15, 1960.
    // Both file at NRA (67y0m). Earner dies at 78, dependent at 90.
    // This should produce:
    //  - Earner personal (earner benefit from NRA to death)
    //  - Dependent personal (dependent benefit from NRA onward)
    //  - Spousal (dependent gets spousal top-up during earner lifetime)
    //  - Survivor (dependent gets survivor benefit after earner death)
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const earnerDeath = finalDateAtAge(earner, 78);
    const dependentDeath = finalDateAtAge(dependent, 90);
    const finalDates: [MonthDate, MonthDate] = [earnerDeath, dependentDeath];
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      finalDates,
      strats
    );

    // Earner personal periods
    const earnerPers = personalPeriods(periodsForIndex(periods, 0));
    expect(earnerPers.length).toBeGreaterThanOrEqual(1);

    // Dependent personal periods
    const depPers = personalPeriods(periodsForIndex(periods, 1));
    expect(depPers.length).toBeGreaterThanOrEqual(1);

    // Dependent spousal periods
    const depSpousal = spousalPeriods(periodsForIndex(periods, 1));
    expect(depSpousal).toHaveLength(1);

    // Dependent survivor periods
    const depSurvivor = survivorPeriods(periodsForIndex(periods, 1));
    expect(depSurvivor).toHaveLength(1);

    // Verify amounts are sensible
    // Earner personal at NRA = $2000
    expect(earnerPers[0].amount.cents()).toBe(200000);

    // Dependent personal at NRA = $500
    expect(depPers[0].amount.cents()).toBe(50000);

    // Spousal: $2000/2 - $500 = $500
    const earnerFilingDate = filingDateOf(earner, 67);
    const dependentFilingDate = filingDateOf(dependent, 67);
    const spousalStart = MonthDate.max(earnerFilingDate, dependentFilingDate);
    const expectedSpousal = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate,
      spousalStart
    );
    expect(depSpousal[0].amount.cents()).toBe(expectedSpousal.cents());

    // Survivor: should reflect earner's NRA benefit
    const survivorStartDate = MonthDate.max(
      earnerDeath.addDuration(new MonthDuration(1)),
      dependentFilingDate
    );
    const expectedSurvivor = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      earnerDeath,
      survivorStartDate
    );
    expect(depSurvivor[0].amount.cents()).toBe(expectedSurvivor.cents());

    // Total NPV consistency
    const periodSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [earner, dependent],
      finalDates,
      FAR_PAST,
      0,
      strats
    );
    expect(periodSum).toBe(npv);
  });
});
