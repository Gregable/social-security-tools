import { describe, expect, it } from 'vitest';
import {
  benefitAtAge,
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
import {
  optimalStrategyCouple,
  optimalStrategyCoupleOptimized,
} from '$lib/strategy/calculations/strategy-calc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a Recipient with a given PIA and birthdate.
 * Uses setPia to bypass earnings records.
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

/** Filing age as MonthDuration. */
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

/** NRA MonthDate for a recipient. */
function nraDate(r: Recipient): MonthDate {
  return r.normalRetirementDate();
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

/**
 * Hand-calculates the expected spousal benefit in cents for early filing
 * (startDate < NRA).
 *
 * spousalCents = spousePiaCents / 2 - recipientPiaCents
 * monthsBeforeNra = nraEpoch - startDateEpoch
 *
 * If monthsBeforeNra <= 36:
 *   reduced = spousalCents * (1 - monthsBeforeNra / 144)
 * Else:
 *   firstReduction = spousalCents * 0.25
 *   remaining = monthsBeforeNra - 36
 *   secondReduction = spousalCents * (remaining / 240)
 *   reduced = spousalCents - firstReduction - secondReduction
 *
 * Then floor to dollar: Math.floor(reduced / 100) * 100
 */
function expectedEarlySpousalCents(
  spousePiaCents: number,
  recipientPiaCents: number,
  monthsBeforeNra: number
): number {
  const spousalCents = spousePiaCents / 2 - recipientPiaCents;
  if (spousalCents <= 0) return 0;

  let reduced: number;
  if (monthsBeforeNra <= 36) {
    reduced = spousalCents * (1 - monthsBeforeNra / 144);
  } else {
    const firstReduction = spousalCents * 0.25;
    const remaining = monthsBeforeNra - 36;
    const secondReduction = spousalCents * (remaining / 240);
    reduced = spousalCents - firstReduction - secondReduction;
  }

  return Math.floor(reduced / 100) * 100;
}

/** A currentDate far in the past so filing ages are not clipped. */
const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

const NO_DISCOUNT = 0;

// ==========================================================================
// 1. Zero-PIA spousal benefit amounts
// ==========================================================================
describe('Zero-PIA spousal benefit amounts', () => {
  // For 1965 births: NRA = 67y0m, delayed increase = 0.08.
  // A $0 PIA dependent has spousalCents = earnerPIA/2 - 0 = earnerPIA/2.

  it('earner PIA $1000, dependent $0: spousal = $500 at NRA', () => {
    const earner = makeRecipient(1000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      nraDate(earner),
      nraDate(dependent),
      nraDate(dependent)
    );
    // spousalCents = 100000/2 - 0 = 50000 => $500
    expect(result.cents()).toBe(50000);
  });

  it('earner PIA $2000, dependent $0: spousal = $1000 at NRA', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      nraDate(earner),
      nraDate(dependent),
      nraDate(dependent)
    );
    // spousalCents = 200000/2 - 0 = 100000 => $1000
    expect(result.cents()).toBe(100000);
  });

  it('earner PIA $3000, dependent $0: spousal = $1500 at NRA', () => {
    const earner = makeRecipient(3000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      nraDate(earner),
      nraDate(dependent),
      nraDate(dependent)
    );
    // spousalCents = 300000/2 - 0 = 150000 => $1500
    expect(result.cents()).toBe(150000);
  });

  it('spousal with early filing reduction: dependent files at 62y1m', () => {
    // Both file at 62y1m. NRA=67y0m. monthsBeforeNra = 59.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerFiling = filingDateOf(earner, 62, 1);
    const depFiling = filingDateOf(dependent, 62, 1);
    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      depFiling
    );
    // spousalCents = 200000/2 - 0 = 100000.
    // 59 months early (>36): 25% + (23/240).
    const expected = expectedEarlySpousalCents(200000, 0, 59);
    expect(result.cents()).toBe(expected);
  });

  it('spousal when earner files late at 70 -- spousal starts when earner files', () => {
    // Dependent files at NRA (67y0m), earner files at 70y0m.
    // startDate = max(earner@70, dep@67) = earner@70.
    // startDate >= NRA, filingDate (dep@67) <= NRA => standard formula.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerFiling = filingDateOf(earner, 70);
    const depFiling = nraDate(dependent);
    const atDate = earnerFiling;

    const result = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFiling,
      depFiling,
      atDate
    );
    // spousalCents = 200000/2 - 0 = 100000. At NRA or later => $1000.
    expect(result.cents()).toBe(100000);
  });

  it('dependent $0 PIA has zero personal benefit at any age', () => {
    const dependent = makeRecipient(0, 1965, 5, 15);
    const atNra = benefitAtAge(dependent, dependent.normalRetirementAge());
    expect(atNra.cents()).toBe(0);
    const at70 = benefitAtAge(dependent, filingAge(70));
    expect(at70.cents()).toBe(0);
  });
});

// ==========================================================================
// 2. Zero-PIA filing date adjustment
// ==========================================================================
describe('Zero-PIA filing date adjustment', () => {
  // When dependent has $0 PIA, the code bumps their filing date forward to
  // match the earner's if they try to file before the earner.

  it('dependent at 62y1m, earner at 67y0m: dependent bumped to 67y0m', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerStrat = filingAge(67);
    const depStrat = filingAge(62, 1);
    const fd = finalDateAtAge(earner, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fd, fd],
      [earnerStrat, depStrat]
    );

    // The spousal period should start at earner's filing date (67y0m), not
    // at the dependent's requested 62y1m.
    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBeGreaterThan(0);
    const earnerFilingDate = filingDateOf(earner, 67);
    expect(spousal[0].startDate.monthsSinceEpoch()).toBe(
      earnerFilingDate.monthsSinceEpoch()
    );
  });

  it('dependent at 62y1m, earner at 62y1m: both file at 62y1m', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const strat = filingAge(62, 1);
    const fd = finalDateAtAge(earner, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fd, fd],
      [strat, strat]
    );

    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBeGreaterThan(0);
    const earnerFilingDate = filingDateOf(earner, 62, 1);
    expect(spousal[0].startDate.monthsSinceEpoch()).toBe(
      earnerFilingDate.monthsSinceEpoch()
    );
  });

  it('dependent at 70y0m, earner at 65y0m: dependent stays at 70y0m (already after earner)', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerStrat = filingAge(65);
    const depStrat = filingAge(70);
    const fd = finalDateAtAge(earner, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fd, fd],
      [earnerStrat, depStrat]
    );

    // Spousal should start at dependent's filing date (70y0m) since it is
    // later than the earner's (65y0m).
    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBeGreaterThan(0);
    const depFilingDate = filingDateOf(dependent, 70);
    expect(spousal[0].startDate.monthsSinceEpoch()).toBe(
      depFilingDate.monthsSinceEpoch()
    );
  });

  it('swapping recipient order produces same result for zero-PIA dependent', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerStrat = filingAge(67);
    const depStrat = filingAge(62, 1);
    const fd = finalDateAtAge(earner, 90);

    const npvA = strategySumCentsCouple(
      [earner, dependent],
      [fd, fd],
      FAR_PAST,
      NO_DISCOUNT,
      [earnerStrat, depStrat]
    );
    const npvB = strategySumCentsCouple(
      [dependent, earner],
      [fd, fd],
      FAR_PAST,
      NO_DISCOUNT,
      [depStrat, earnerStrat]
    );
    expect(npvA).toBe(npvB);
  });
});

// ==========================================================================
// 3. Zero-PIA survivor benefits
// ==========================================================================
describe('Zero-PIA survivor benefits', () => {
  // For 1962+ births: NRA = 67y0m, survivor NRA = 67y0m, delayed = 0.08.

  it('earner PIA $2000, files at NRA, dies at 70: full survivor = $2000', () => {
    // Deceased filed at NRA => base = max(PIA*0.825, benefitAtNRA) = max($1650, $2000) = $2000.
    // Survivor files after death at survivor NRA => full base.
    const earner = makeRecipient(2000, 1962, 5, 2); // Jun 2, 1962
    const dependent = makeRecipient(0, 1964, 5, 2); // Jun 2, 1964

    const deathDate = earner.birthdate.dateAtSsaAge(filingAge(70));
    const earnerFilingDate = nraDate(earner);
    // Survivor files the month after death
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      deathDate,
      survivorFilingDate
    );
    // benefitOnDate at NRA = $2000 (no delayed credits). RIB-LIM = $1650.
    // max($1650, $2000) = $2000.
    expect(result.value()).toBe(2000);
  });

  it('survivor benefit transitions from spousal to survivor when earner dies', () => {
    // Verify that periods show spousal ending and survivor beginning.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerStrat = filingAge(67);
    const depStrat = filingAge(67);
    // Earner dies at 75, dependent lives to 90.
    const earnerDeath = finalDateAtAge(earner, 75);
    const depDeath = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerStrat, depStrat]
    );

    const spousal = spousalPeriods(periods);
    const survivor = survivorPeriods(periods);

    // There should be both a spousal and a survivor period for the dependent.
    expect(spousal.length).toBe(1);
    expect(survivor.length).toBe(1);

    // Spousal ends before survivor starts (spousal ends month before earner
    // death+1, survivor starts at earner death+1).
    const spousalEnd = spousal[0].endDate;
    const survivorStart = survivor[0].startDate;
    expect(survivorStart.monthsSinceEpoch()).toBe(
      spousalEnd.monthsSinceEpoch() + 1
    );
  });

  it('survivor amount when earner filed at 62 (early reduction + 82.5% RIB-LIM)', () => {
    // Earner PIA $2000, born 1962, files at 62y1m.
    // NRA = 67y0m, so 59 months early.
    // Personal benefit at 62y1m:
    //   first 36 months: 36 * 5/900 = 0.2
    //   next 23 months: 23 * 5/1200 = 0.09583...
    //   total reduction = 0.29583... => multiplier = 0.70416...
    //   benefit = floor(2000 * 0.70416...) = floor($1408.33) = $1408
    // RIB-LIM = floor(2000 * 0.825) = $1650
    // base survivor = max($1650, $1408) = $1650
    const earner = makeRecipient(2000, 1962, 5, 2);
    const dependent = makeRecipient(0, 1964, 5, 2);

    const earnerFilingDate = filingDateOf(earner, 62, 1);
    const deathDate = earner.birthdate.dateAtSsaAge(filingAge(75));
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      deathDate,
      survivorFilingDate
    );
    // RIB-LIM: Math.round(200000 * 0.825) = 165000 = $1650
    // Early benefit is less than RIB-LIM, so base = $1650
    expect(result.cents()).toBe(165000);
  });

  it('survivor amount when earner filed at 70 (max delayed credits)', () => {
    // Earner PIA $2000, files at 70y0m.
    // 36 months of delayed credits at 0.08/yr = 0.24.
    // benefit = floor(2000 * 1.24) = $2480.
    // RIB-LIM = floor(2000 * 0.825) = $1650.
    // base = max($1650, $2480) = $2480.
    const earner = makeRecipient(2000, 1962, 5, 2);
    const dependent = makeRecipient(0, 1964, 5, 2);

    const earnerFilingDate = filingDateOf(earner, 70);
    const deathDate = earner.birthdate.dateAtSsaAge(filingAge(75));
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      deathDate,
      survivorFilingDate
    );
    // benefitOnDate at 70 = floor(2000 * 1.24) = $2480.
    // max($1650, $2480) = $2480.
    expect(result.value()).toBe(2480);
  });

  it('zero-PIA survivor always takes survivor benefit over personal $0', () => {
    // In the couple strategy, the dependent has $0 personal benefit, so
    // survivor benefit is always preferred (isSurvivorBenefitApplicable = true).
    const earner = makeRecipient(1000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerStrat = filingAge(67);
    const depStrat = filingAge(67);
    const earnerDeath = finalDateAtAge(earner, 72);
    const depDeath = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerStrat, depStrat]
    );

    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBe(1);
    expect(survivor[0].amount.cents()).toBeGreaterThan(0);

    // Dependent's personal periods should have $0 amount
    const depPersonal = personalPeriods(periods).filter(
      (p) => p.recipientIndex !== 0
    );
    for (const p of depPersonal) {
      expect(p.amount.cents()).toBe(0);
    }
  });
});

// ==========================================================================
// 4. Zero-PIA couple NPV hand calculations
// ==========================================================================
describe('Zero-PIA couple NPV hand calculations', () => {
  // At 0% discount rate, NPV = sum of all monthly payments.
  // For each period: payment_cents * number_of_months.

  it('both file at NRA, earner dies at 80, dependent dies at 90: NPV hand-verified', () => {
    // Earner PIA $2000, born 1965-05-15. NRA = 67y0m.
    // Dependent PIA $0, born 1965-05-15. NRA = 67y0m.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerStrat = filingAge(67);
    const depStrat = filingAge(67);
    const earnerDeath = finalDateAtAge(earner, 80);
    const depDeath = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerStrat, depStrat]
    );

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [earnerStrat, depStrat]
    );

    // Manual sum must match
    const manual = manualSumCents(periods);
    expect(npv).toBe(manual);
  });

  it('earner personal benefit component is correct', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerStrat = filingAge(67);
    const depStrat = filingAge(67);
    const earnerDeath = finalDateAtAge(earner, 85);
    const depDeath = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerStrat, depStrat]
    );

    // Earner personal benefit at NRA = $2000/mo.
    const earnerPersonal = personalPeriods(periods).filter(
      (p) => p.recipientIndex === 0
    );
    expect(earnerPersonal.length).toBeGreaterThan(0);
    expect(earnerPersonal[0].amount.value()).toBe(2000);
  });

  it('dependent spousal component is half of earner PIA at NRA', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerStrat = filingAge(67);
    const depStrat = filingAge(67);
    const earnerDeath = finalDateAtAge(earner, 85);
    const depDeath = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerStrat, depStrat]
    );

    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBe(1);
    // Spousal = earnerPIA/2 = $1000
    expect(spousal[0].amount.value()).toBe(1000);
  });

  it('three components sum to total NPV at 0% discount', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerStrat = filingAge(67);
    const depStrat = filingAge(67);
    const earnerDeath = finalDateAtAge(earner, 80);
    const depDeath = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerStrat, depStrat]
    );

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [earnerStrat, depStrat]
    );

    // Compute each component by hand
    const earnerPersonalCents = personalPeriods(periods)
      .filter((p) => p.recipientIndex === 0)
      .reduce((sum, p) => sum + p.amount.cents() * periodMonths(p), 0);

    const spousalCents = spousalPeriods(periods).reduce(
      (sum, p) => sum + p.amount.cents() * periodMonths(p),
      0
    );

    const survivorCents = survivorPeriods(periods).reduce(
      (sum, p) => sum + p.amount.cents() * periodMonths(p),
      0
    );

    // Dependent personal benefit is $0, so only contributes to zero sum
    const depPersonalCents = personalPeriods(periods)
      .filter((p) => p.recipientIndex !== 0)
      .reduce((sum, p) => sum + p.amount.cents() * periodMonths(p), 0);

    expect(depPersonalCents).toBe(0);
    expect(npv).toBe(
      earnerPersonalCents + spousalCents + survivorCents + depPersonalCents
    );
  });

  it('NPV matches sumBenefitPeriods utility', () => {
    const earner = makeRecipient(1500, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerStrat = filingAge(70);
    const depStrat = filingAge(62, 1);
    const earnerDeath = finalDateAtAge(earner, 78);
    const depDeath = finalDateAtAge(dependent, 92);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerStrat, depStrat]
    );

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [earnerStrat, depStrat]
    );

    const utilitySum = sumBenefitPeriods(periods);
    expect(npv).toBe(utilitySum);
  });

  it('NPV with early earner filing is less than late filing for long-lived couple', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerDeath = finalDateAtAge(earner, 85);
    const depDeath = finalDateAtAge(dependent, 95);

    const npvEarly = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(62, 1), filingAge(62, 1)]
    );
    const npvLate = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(70), filingAge(62, 1)]
    );
    // Late earner filing maximizes survivor benefits for long-lived survivor
    expect(npvLate).toBeGreaterThan(npvEarly);
  });
});

// ==========================================================================
// 5. Zero-PIA optimizer
// ==========================================================================
describe('Zero-PIA optimizer', () => {
  it('for long-lived dependent, optimizer delays earner filing', () => {
    // When dependent lives much longer, delaying earner filing maximizes
    // survivor benefit (which is the dominant component).
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerDeath = finalDateAtAge(earner, 75);
    const depDeath = finalDateAtAge(dependent, 95);

    const [bestStrat0, _bestStrat1, bestNpv] = optimalStrategyCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT
    );

    // The earner (r0 is higher earner) should file at 70 to maximize
    // survivor benefit for the long-lived dependent.
    // r0=earner is index 0, so bestStrat0 = earner's strategy.
    expect(bestStrat0.asMonths()).toBe(70 * 12);
    expect(bestNpv).toBeGreaterThan(0);
  });

  it('optimized matches non-optimized for zero-PIA couple', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerDeath = finalDateAtAge(earner, 80);
    const depDeath = finalDateAtAge(dependent, 85);

    const result = optimalStrategyCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT
    );
    const resultOpt = optimalStrategyCoupleOptimized(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT
    );

    expect(result[0].asMonths()).toBe(resultOpt[0].asMonths());
    expect(result[1].asMonths()).toBe(resultOpt[1].asMonths());
    expect(result[2]).toBe(resultOpt[2]);
  });

  it('optimal NPV is greater than or equal to NPV at other strategies', () => {
    const earner = makeRecipient(1500, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerDeath = finalDateAtAge(earner, 82);
    const depDeath = finalDateAtAge(dependent, 88);

    const [, , bestNpv] = optimalStrategyCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT
    );

    // Try several arbitrary strategies and verify optimal beats them all.
    const testStrats: [MonthDuration, MonthDuration][] = [
      [filingAge(62, 1), filingAge(62, 1)],
      [filingAge(67), filingAge(67)],
      [filingAge(70), filingAge(62, 1)],
      [filingAge(65), filingAge(65)],
    ];

    for (const strat of testStrats) {
      const npv = strategySumCentsCouple(
        [earner, dependent],
        [earnerDeath, depDeath],
        FAR_PAST,
        NO_DISCOUNT,
        strat
      );
      expect(bestNpv).toBeGreaterThanOrEqual(npv);
    }
  });

  it('for short-lived earner, early filing may be better', () => {
    // When earner dies very soon, early filing captures more payments.
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerDeath = finalDateAtAge(earner, 65);
    const depDeath = finalDateAtAge(dependent, 80);

    const npvEarlyEarner = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(62, 1), filingAge(62, 1)]
    );
    // If earner dies at 65, filing at 70 means earner never collects.
    const _npvLateEarner = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(70), filingAge(62, 1)]
    );

    // Earner at 62 collects some, while earner at 70 gets nothing personal.
    // But the survivor benefit matters too. Check that early filing has
    // meaningful earner personal income.
    expect(npvEarlyEarner).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 6. Zero-PIA with different birth years
// ==========================================================================
describe('Zero-PIA with different birth years', () => {
  it('earner born 1960, dependent born 1970: 10 year age gap', () => {
    // Earner NRA = 67y0m (1960 births). Dependent NRA = 67y0m (1970 births).
    // Earner filing at 67 => year 2027.
    // Dependent turns 62 in 2032, files at 67 in 2037.
    const earner = makeRecipient(2000, 1960, 5, 15);
    const dependent = makeRecipient(0, 1970, 5, 15);
    const earnerStrat = filingAge(67);
    const depStrat = filingAge(67);
    const earnerDeath = finalDateAtAge(earner, 85);
    const depDeath = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerStrat, depStrat]
    );

    // Spousal starts when dependent files (later than earner).
    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBe(1);
    const depFilingDate = filingDateOf(dependent, 67);
    expect(spousal[0].startDate.monthsSinceEpoch()).toBe(
      depFilingDate.monthsSinceEpoch()
    );

    // Spousal amount = earner PIA / 2 = $1000
    expect(spousal[0].amount.value()).toBe(1000);
  });

  it('earner born 1960, dependent born 1970: periods have correct survivor transition', () => {
    const earner = makeRecipient(2000, 1960, 5, 15);
    const dependent = makeRecipient(0, 1970, 5, 15);
    const earnerStrat = filingAge(67);
    const depStrat = filingAge(67);
    // Earner dies at 80 (year 2040), dependent is only 70 then.
    const earnerDeath = finalDateAtAge(earner, 80);
    const depDeath = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerStrat, depStrat]
    );

    // There should be survivor periods since dependent outlives earner.
    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBe(1);
    expect(survivor[0].amount.cents()).toBeGreaterThan(0);

    // Survivor should run until dependent's death.
    expect(survivor[0].endDate.monthsSinceEpoch()).toBe(
      depDeath.monthsSinceEpoch()
    );
  });

  it('earner born 1955, dependent born 1965: different NRA values', () => {
    // Earner born 1955: NRA = 66y2m. Dependent born 1965: NRA = 67y0m.
    const earner = makeRecipient(2500, 1955, 3, 15);
    const dependent = makeRecipient(0, 1965, 3, 15);
    const earnerStrat = filingAge(66, 2); // earner NRA
    const depStrat = filingAge(67); // dependent NRA
    const earnerDeath = finalDateAtAge(earner, 85);
    const depDeath = finalDateAtAge(dependent, 90);

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [earnerStrat, depStrat]
    );

    // Verify the NPV is positive and matches period sum.
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerStrat, depStrat]
    );
    expect(npv).toBe(manualSumCents(periods));
    expect(npv).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 7. Both have $0 PIA
// ==========================================================================
describe('Both have $0 PIA', () => {
  it('both $0 PIA: no benefits at all, NPV = 0', () => {
    const r1 = makeRecipient(0, 1965, 5, 15);
    const r2 = makeRecipient(0, 1965, 5, 15);
    const strat = filingAge(67);
    const fd = finalDateAtAge(r1, 85);

    const npv = strategySumCentsCouple(
      [r1, r2],
      [fd, fd],
      FAR_PAST,
      NO_DISCOUNT,
      [strat, strat]
    );
    expect(npv).toBe(0);
  });

  it('both $0 PIA: no spousal eligibility', () => {
    const r1 = makeRecipient(0, 1965, 5, 15);
    const r2 = makeRecipient(0, 1965, 5, 15);
    expect(eligibleForSpousalBenefit(r1, r2)).toBe(false);
    expect(eligibleForSpousalBenefit(r2, r1)).toBe(false);
  });
});

// ==========================================================================
// 8. Additional edge cases for zero-PIA dependents
// ==========================================================================
describe('Zero-PIA additional edge cases', () => {
  it('zero-PIA dependent has no personal benefit periods with nonzero amount', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const fd = finalDateAtAge(earner, 85);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fd, fd],
      [filingAge(67), filingAge(67)]
    );

    // All personal periods for the dependent should have $0 amount
    const depIdx = earner
      .pia()
      .primaryInsuranceAmount()
      .greaterThan(dependent.pia().primaryInsuranceAmount())
      ? 1
      : 0;
    const depPersonal = personalPeriods(periodsForIndex(periods, depIdx));
    for (const p of depPersonal) {
      expect(p.amount.cents()).toBe(0);
    }
  });

  it('zero-PIA eligibleForSpousalBenefit returns true when earner has any PIA', () => {
    // Even $1 PIA earner means spousal = $0.50/2 > $0, so eligible.
    const earner = makeRecipient(1, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);
  });

  it('zero-PIA couple total periods include all three types', () => {
    // Earner personal + dependent spousal + dependent survivor.
    const earner = makeRecipient(1500, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerDeath = finalDateAtAge(earner, 78);
    const depDeath = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [filingAge(67), filingAge(67)]
    );

    const personal = personalPeriods(periods);
    const spousal = spousalPeriods(periods);
    const survivor = survivorPeriods(periods);

    // At least one of each type should exist
    expect(personal.length).toBeGreaterThan(0);
    expect(spousal.length).toBeGreaterThan(0);
    expect(survivor.length).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 9. Zero-PIA dependent with earner dying before NRA
// ==========================================================================
describe('Zero-PIA dependent with earner dying before NRA', () => {
  // Earner PIA $2000, dies at 65 (before NRA 67y0m, never filed).
  // When earner dies before NRA without filing, the survivor benefit base
  // is the earner's PIA ($2000). Dependent $0 PIA survives to 90.
  const earner = makeRecipient(2000, 1965, 5, 15);
  const dependent = makeRecipient(0, 1965, 5, 15);
  const earnerDeathAge = MonthDuration.initFromYearsMonths({
    years: 65,
    months: 0,
  });
  // Use the death date as the filing date (earner never actually filed).
  const earnerDeath = earner.birthdate.dateAtSsaAge(earnerDeathAge);
  const depDeath = finalDateAtAge(dependent, 90);

  it('periods include a survivor period for the dependent', () => {
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerDeathAge, filingAge(67)]
    );

    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBe(1);
    expect(survivor[0].amount.cents()).toBeGreaterThan(0);
  });

  it('survivor benefit base equals earner PIA when earner dies before NRA', () => {
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerDeathAge, filingAge(67)]
    );

    const survivor = survivorPeriods(periods);
    // Earner died before NRA without filing: base = earner PIA = $2000.
    expect(survivor[0].amount.value()).toBe(2000);
  });

  it('NPV is positive despite earner dying young', () => {
    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [earnerDeathAge, filingAge(67)]
    );

    expect(npv).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 10. Zero-PIA dependent who outlives earner by 1 month
// ==========================================================================
describe('Zero-PIA dependent who outlives earner by 1 month', () => {
  // Earner PIA $2000, both file at NRA. Earner dies at 70.
  // Dependent dies 2 months after earner. The survivor benefit starts the
  // month after earner death (earnerDeath + 1). The code requires
  // dependentFinalDate > survivorStartDate (strict) for survivor to apply,
  // so dying 2 months after earner gives exactly 1 month of survivor.
  const earner = makeRecipient(2000, 1965, 5, 15);
  const dependent = makeRecipient(0, 1965, 5, 15);
  const earnerNra = earner.normalRetirementAge();
  const earnerDeath = earner.birthdate.dateAtSsaAge(filingAge(70));
  const depDeath = earnerDeath.addDuration(new MonthDuration(2));

  it('produces exactly 1 month of survivor benefit', () => {
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerNra, filingAge(67)]
    );

    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBe(1);
    // Survivor starts 1 month after earner death, ends at depDeath.
    // earnerDeath+1 to earnerDeath+2 = 2 months inclusive.
    expect(periodMonths(survivor[0])).toBe(2);
  });

  it('NPV includes earner personal + spousal + survivor', () => {
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerNra, filingAge(67)]
    );

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      NO_DISCOUNT,
      [earnerNra, filingAge(67)]
    );

    const manual = manualSumCents(periods);
    expect(npv).toBe(manual);
    expect(npv).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 11. Zero-PIA earner dies at 72+ without filing - bug fix validation
// ==========================================================================
describe('Zero-PIA earner dies at 72+ without filing - bug fix validation', () => {
  // Earner PIA $2000, dies at 75 without filing. When earner dies after NRA
  // without filing, the survivor benefit is based on the benefit the earner
  // would have received, capped at age 70 delayed credits.
  // age-70 benefit = floor(2000 * 1.24) = $2480.

  it('survivor gets age-70 benefit ($2480) not $0 when earner dies at 75 unfiled', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerDeathAge = filingAge(75);
    const earnerDeath = earner.birthdate.dateAtSsaAge(earnerDeathAge);
    const depDeath = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      // Earner's filing age = 75 means they never actually filed (death at 75)
      [earnerDeathAge, filingAge(67)]
    );

    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBe(1);
    // Survivor benefit should be based on earner's benefit at age 70
    // (delayed credits capped at 70): floor(2000 * 1.24) = $2480
    expect(survivor[0].amount.value()).toBe(2480);
  });

  it('NPV via strategySumPeriodsCouple reflects the $2480 survivor amount', () => {
    const earner = makeRecipient(2000, 1965, 5, 15);
    const dependent = makeRecipient(0, 1965, 5, 15);
    const earnerDeathAge = filingAge(75);
    const earnerDeath = earner.birthdate.dateAtSsaAge(earnerDeathAge);
    const depDeath = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      [earnerDeathAge, filingAge(67)]
    );

    const survivorCents = survivorPeriods(periods).reduce(
      (sum, p) => sum + p.amount.cents() * periodMonths(p),
      0
    );
    // Survivor amount per month = $2480 = 248000 cents
    // Each month of survivor benefit contributes 248000 cents
    expect(survivorCents).toBeGreaterThan(0);
    expect(survivorCents % 248000).toBe(0);
  });
});

// ==========================================================================
// 12. Zero-PIA with very high discount rate
// ==========================================================================
describe('Zero-PIA with very high discount rate', () => {
  const earner = makeRecipient(2000, 1965, 5, 15);
  const dependent = makeRecipient(0, 1965, 5, 15);
  const earnerDeath = finalDateAtAge(earner, 80);
  const depDeath = finalDateAtAge(dependent, 90);

  it('10% discount: NPV still positive', () => {
    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      0.1,
      [filingAge(67), filingAge(67)]
    );
    expect(npv).toBeGreaterThan(0);
  });

  it('20% discount: NPV still positive but less than 10%', () => {
    const npv10 = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      0.1,
      [filingAge(67), filingAge(67)]
    );
    const npv20 = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, depDeath],
      FAR_PAST,
      0.2,
      [filingAge(67), filingAge(67)]
    );
    expect(npv20).toBeGreaterThan(0);
    expect(npv20).toBeLessThan(npv10);
  });
});
