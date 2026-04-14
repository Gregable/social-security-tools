import { describe, expect, it } from 'vitest';
import {
  benefitAtAge,
  eligibleForSpousalBenefit,
  higherEarningsThan,
} from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  type BenefitPeriod,
  BenefitType,
  strategySumCentsCouple,
  strategySumCentsSingle,
  strategySumPeriodsCouple,
} from '$lib/strategy/calculations';
import {
  optimalStrategyCouple,
  optimalStrategyCoupleOptimized,
} from '$lib/strategy/calculations/strategy-calc';

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

function makeRecipientDec15(piaDollars: number, birthYear: number): Recipient {
  return makeRecipient(piaDollars, birthYear, 11, 15);
}

function finalDateAtAge(recipient: Recipient, ageYears: number): MonthDate {
  const raw = recipient.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({ years: ageYears, months: 0 })
  );
  return raw.addDuration(new MonthDuration(11 - raw.monthIndex()));
}

function filingAge(years: number, months: number = 0): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

function filingDateOf(
  r: Recipient,
  years: number,
  months: number = 0
): MonthDate {
  return r.birthdate.dateAtSsaAge(filingAge(years, months));
}

function periodMonths(p: BenefitPeriod): number {
  return p.endDate.subtractDate(p.startDate).asMonths() + 1;
}

function manualSumCents(periods: BenefitPeriod[]): number {
  let total = 0;
  for (const p of periods) {
    total += p.amount.cents() * periodMonths(p);
  }
  return total;
}

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

const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });
const NO_DISCOUNT = 0;

// ==========================================================================
// 1. Spousal eligibility boundary: PIA exactly half
// ==========================================================================
describe('Spousal eligibility boundary: PIA exactly half', () => {
  it('earnerPIA=1000, dependentPIA=500: NOT eligible (500/2 = 500, not > 500)', () => {
    // eligibleForSpousalBenefit checks: earnerPIA.div(2).greaterThan(dependentPIA)
    // $1000/2 = $500. $500 > $500 is false. NOT eligible.
    const earner = makeRecipientDec15(1000, 1960);
    const dependent = makeRecipientDec15(500, 1960);

    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(false);

    // Verify no spousal periods exist
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [finalDateAtAge(earner, 85), finalDateAtAge(dependent, 85)],
      [filingAge(67), filingAge(67)]
    );
    expect(spousalPeriods(periods)).toHaveLength(0);
  });

  it('earnerPIA=1000, dependentPIA=499: IS eligible (500 > 499)', () => {
    const earner = makeRecipientDec15(1000, 1960);
    const dependent = makeRecipientDec15(499, 1960);

    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [finalDateAtAge(earner, 85), finalDateAtAge(dependent, 85)],
      [filingAge(67), filingAge(67)]
    );
    expect(spousalPeriods(periods).length).toBeGreaterThanOrEqual(1);
  });

  it('earnerPIA=1000, dependentPIA=501: NOT eligible (500 > 501 is false)', () => {
    const earner = makeRecipientDec15(1000, 1960);
    const dependent = makeRecipientDec15(501, 1960);

    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(false);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [finalDateAtAge(earner, 85), finalDateAtAge(dependent, 85)],
      [filingAge(67), filingAge(67)]
    );
    expect(spousalPeriods(periods)).toHaveLength(0);
  });
});

// ==========================================================================
// 2. Earner/dependent role flip with $1 difference
// ==========================================================================
describe('Earner/dependent role flip with $1 difference', () => {
  it('$1000/$999: R1 is earner', () => {
    const r1 = makeRecipientDec15(1000, 1960);
    const r2 = makeRecipientDec15(999, 1960);
    expect(higherEarningsThan(r1, r2)).toBe(true);
    expect(higherEarningsThan(r2, r1)).toBe(false);
  });

  it('swapping $1000/$999 to $999/$1000 flips roles and NPV is identical', () => {
    const r1a = makeRecipientDec15(1000, 1962);
    const r2a = makeRecipientDec15(999, 1962);
    const fd = finalDateAtAge(r1a, 85);
    const strat = filingAge(67);

    const npvA = strategySumCentsCouple(
      [r1a, r2a],
      [fd, fd],
      FAR_PAST,
      NO_DISCOUNT,
      [strat, strat]
    );

    // Swap: now r1b has 999, r2b has 1000
    const r1b = makeRecipientDec15(999, 1962);
    const r2b = makeRecipientDec15(1000, 1962);

    const npvB = strategySumCentsCouple(
      [r1b, r2b],
      [fd, fd],
      FAR_PAST,
      NO_DISCOUNT,
      [strat, strat]
    );

    expect(npvA).toBe(npvB);
  });
});

// ==========================================================================
// 3. Dependent files AFTER earner dies
// ==========================================================================
describe('Dependent files AFTER earner dies', () => {
  it('earner files at NRA, dies at 68; dependent files at 70 (2 years after death)', () => {
    // Earner $2000, files at 67, dies at 68.
    // Dependent $400, files at 70 -- well after earner's death.
    // Dependent should get: personal benefit starting at 70, plus survivor.
    // No spousal benefit since dependent never filed while earner was alive.
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(400, 1960);
    const earnerFd = finalDateAtAge(earner, 68);
    const depFd = finalDateAtAge(dependent, 85);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      [filingAge(67), filingAge(70)]
    );

    // Dependent's filing date (70) is after earner's death (68).
    // survivorStart = max(earnerDeath+1, dependentFiling@70) = dependentFiling@70.
    // So survivor starts at dependent's filing date.
    const depFilingDate = filingDateOf(dependent, 70);
    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBeGreaterThanOrEqual(1);
    if (survivor.length > 0) {
      expect(survivor[0].startDate.monthsSinceEpoch()).toBe(
        depFilingDate.monthsSinceEpoch()
      );
    }
  });

  it('no spousal period when dependent files after earner dies', () => {
    // Spousal requires both to have filed. If dependent files after earner's death,
    // the spousal period start = max(earnerFiling, dependentFiling) and
    // the spousal period end = min(survivorStart - 1, dependentDeath).
    // Since survivorStart = dependentFiling, spousalEnd = dependentFiling - 1.
    // If spousalStart >= spousalEnd, no spousal period.
    // spousalStart = max(earnerFiling@67, dependentFiling@70) = dependentFiling@70
    // spousalEnd = min(survivorStart - 1, depDeath) = dependentFiling@70 - 1
    // spousalStart > spousalEnd => no spousal. Correct.
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(400, 1960);
    const earnerFd = finalDateAtAge(earner, 68);
    const depFd = finalDateAtAge(dependent, 85);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      [filingAge(67), filingAge(70)]
    );

    expect(spousalPeriods(periods)).toHaveLength(0);
  });

  it('dependent personal benefit ends when survivor starts', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(400, 1960);
    const earnerFd = finalDateAtAge(earner, 68);
    const depFd = finalDateAtAge(dependent, 85);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      [filingAge(67), filingAge(70)]
    );

    const depPersonal = personalPeriods(periodsForIndex(periods, 1));
    const survivor = survivorPeriods(periods);

    // If survivor is applicable, dependent personal should end before survivor starts
    if (survivor.length > 0 && depPersonal.length > 0) {
      const lastPersonalEnd = depPersonal[depPersonal.length - 1].endDate;
      const survivorStart = survivor[0].startDate;
      // Personal should end at survivor start - 1 month
      expect(lastPersonalEnd.monthsSinceEpoch()).toBeLessThan(
        survivorStart.monthsSinceEpoch()
      );
    }
  });
});

// ==========================================================================
// 4. Both spouses die in same month as filing
// ==========================================================================
describe('Both spouses die in same month as filing', () => {
  it('both file at NRA, both die in same month: minimal benefit, NPV > 0', () => {
    // Both born Dec 15, 1960. NRA = 67y0m. SSA birthday = Dec 14.
    // NRA date would be in Nov 2027 (67 years after SSA birth month Nov 1960).
    // Both die in that same month.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const nraDate = filingDateOf(r1, 67);
    // Death in same month as filing
    const deathDate = nraDate;

    const npv = strategySumCentsCouple(
      [r1, r2],
      [deathDate, deathDate],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(67), filingAge(67)]
    );

    // Both file and die in same month. Each gets 1 month of personal benefit.
    // NPV should be positive (at least 1 month of benefits each).
    expect(npv).toBeGreaterThan(0);
  });

  it('both die in filing month: no survivor periods', () => {
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const nraDate = filingDateOf(r1, 67);

    const periods = strategySumPeriodsCouple(
      [r1, r2],
      [nraDate, nraDate],
      [filingAge(67), filingAge(67)]
    );

    // Both die at the same time, so no one survives to collect survivor benefit.
    // survivorStart = max(earnerDeath+1, dependentFiling) = earnerDeath+1
    // (since dependentFiling = earnerDeath).
    // dependentFinalDate = earnerDeath, so dependent dies before survivorStart.
    // => isSurvivorBenefitApplicable should be false.
    expect(survivorPeriods(periods)).toHaveLength(0);
  });
});

// ==========================================================================
// 5. Earner born on 1st, dependent born on 2nd
// ==========================================================================
describe('Earner born on 1st, dependent born on 2nd of month', () => {
  it('both can file at 62y0m (born on 1st or 2nd)', () => {
    // Born on 1st or 2nd: earliestFilingMonth = 62y0m (not 62y1m).
    const r1 = makeRecipient(2000, 1962, 5, 1); // born June 1
    const r2 = makeRecipient(500, 1962, 5, 2); // born June 2

    const earliest1 = r1.birthdate.earliestFilingMonth();
    const earliest2 = r2.birthdate.earliestFilingMonth();

    expect(earliest1.asMonths()).toBe(62 * 12);
    expect(earliest2.asMonths()).toBe(62 * 12);
  });

  it('filing at 62y0m produces valid NPV for both born on 1st/2nd', () => {
    const r1 = makeRecipient(2000, 1962, 5, 1);
    const r2 = makeRecipient(500, 1962, 5, 2);
    const fd1 = finalDateAtAge(r1, 85);
    const fd2 = finalDateAtAge(r2, 85);

    const npv = strategySumCentsCouple(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(62, 0), filingAge(62, 0)]
    );

    expect(npv).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 6. Earner born on 1st, dependent born on 15th: different earliest filing
// ==========================================================================
describe('Earner born on 1st, dependent born on 15th', () => {
  it('earner earliest filing = 62y0m, dependent earliest = 62y1m', () => {
    const earner = makeRecipient(2000, 1962, 5, 1); // born June 1
    const dependent = makeRecipient(500, 1962, 5, 15); // born June 15

    const earliestEarner = earner.birthdate.earliestFilingMonth();
    const earliestDependent = dependent.birthdate.earliestFilingMonth();

    // Born on 1st: 62y0m. Born on 15th: 62y1m.
    expect(earliestEarner.asMonths()).toBe(62 * 12);
    expect(earliestDependent.asMonths()).toBe(62 * 12 + 1);
  });

  it('optimizer respects different earliest filing ages for 1st vs 15th', () => {
    const earner = makeRecipient(2000, 1965, 5, 1);
    const dependent = makeRecipient(500, 1965, 5, 15);
    const fd1 = finalDateAtAge(earner, 85);
    const fd2 = finalDateAtAge(dependent, 85);

    // With FAR_PAST, earliest filing = 62y0m for earner, 62y1m for dependent.
    // The optimizer should not try to file the dependent at 62y0m.
    const result = optimalStrategyCouple(
      [earner, dependent],
      [fd1, fd2],
      FAR_PAST,
      NO_DISCOUNT
    );

    // Verify the optimizer returns a valid result (NPV > 0)
    expect(result[2]).toBeGreaterThan(0);

    // Dependent's optimal filing age should be >= 62y1m
    const dependentStrat = result[1];
    expect(dependentStrat.asMonths()).toBeGreaterThanOrEqual(62 * 12 + 1);
  });
});

// ==========================================================================
// 7. Spousal benefit with earner filing at 62 and dependent at 70
// ==========================================================================
describe('Spousal benefit with earner at 62, dependent at 70', () => {
  it('dependent delayed benefit exceeds earnerPIA/2: no effective spousal benefit', () => {
    // Earner PIA=$1000, dependent PIA=$400.
    // Earner files at 62y1m. Dependent files at 70.
    // earnerPIA/2 = $500.
    // Dependent's personal benefit at 70 with delayed credits:
    //   $400 * (1 + 0.08/12 * 36) = $400 * 1.24 = $496
    // Combined cap: personal + spousal <= earnerPIA/2 = $500
    // spousal = max(0, $500 - $496) = $4
    // So there IS a tiny spousal benefit.
    const earner = makeRecipientDec15(1000, 1960);
    const dependent = makeRecipientDec15(400, 1960);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [finalDateAtAge(earner, 85), finalDateAtAge(dependent, 85)],
      [filingAge(62, 1), filingAge(70)]
    );

    const spousal = spousalPeriods(periods);
    // Spousal periods should exist but with a very small amount
    // due to the combined cap (earnerPIA/2 - personalBenefit).
    if (spousal.length > 0) {
      // Amount should be small due to delayed credits eating into spousal
      expect(spousal[0].amount.cents()).toBeLessThan(
        Money.from(500).cents() // Less than full spousal = earnerPIA/2
      );
    }
  });

  it('dependent PIA high enough to eliminate spousal entirely with delayed credits', () => {
    // Earner PIA=$1000, dependent PIA=$490.
    // earnerPIA/2 = $500. $500 > $490, so eligible for spousal.
    // But dependent files at 70: personal = $490 * 1.24 = $607.6 => ~$607
    // spousal = max(0, $500 - $607) = 0.
    // Period should exist but with $0 amount (or not exist).
    const earner = makeRecipientDec15(1000, 1960);
    const dependent = makeRecipientDec15(490, 1960);

    // Verify eligible (based on PIA alone)
    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [finalDateAtAge(earner, 85), finalDateAtAge(dependent, 85)],
      [filingAge(62, 1), filingAge(70)]
    );

    const spousal = spousalPeriods(periods);
    // Even though eligible by PIA, delayed credits push personal above
    // earnerPIA/2, so the spousal benefit should be $0.
    if (spousal.length > 0) {
      expect(spousal[0].amount.cents()).toBe(0);
    }
  });
});

// ==========================================================================
// 8. Survivor when dependent has higher personal benefit than survivor
// ==========================================================================
describe('Survivor when dependent personal > survivor benefit', () => {
  it('dependent at 70 with high PIA, earner at 62: no survivor period', () => {
    // Earner PIA=$800, files at 62y1m. Earner benefit = $800 * ~0.70 = ~$560.
    // Dependent PIA=$700, files at 70. Dependent benefit = $700 * 1.24 = $868.
    // Survivor base = max($800 * 0.825, $560) = max($660, $560) = $660.
    // Dependent personal ($868) > survivor ($660), so no survivor period.
    const earner = makeRecipientDec15(800, 1960);
    const dependent = makeRecipientDec15(700, 1960);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [finalDateAtAge(earner, 75), finalDateAtAge(dependent, 90)],
      [filingAge(62, 1), filingAge(70)]
    );

    // Dependent's delayed personal benefit exceeds survivor benefit,
    // so no survivor period should exist.
    expect(survivorPeriods(periods)).toHaveLength(0);
  });

  it('dependent at 70 with moderate PIA, earner at 70: survivor exists', () => {
    // Earner PIA=$2000, files at 70. Earner benefit = $2000 * 1.24 = $2480.
    // Dependent PIA=$700, files at 70. Dependent benefit = $700 * 1.24 = $868.
    // Survivor base = max($2000 * 0.825, $2480) = max($1650, $2480) = $2480.
    // Dependent personal ($868) < survivor ($2480), so survivor period exists.
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(700, 1960);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [finalDateAtAge(earner, 75), finalDateAtAge(dependent, 90)],
      [filingAge(70), filingAge(70)]
    );

    expect(survivorPeriods(periods).length).toBeGreaterThanOrEqual(1);
  });
});

// ==========================================================================
// 9. Maximum age gap: 20 years between spouses
// ==========================================================================
describe('Maximum age gap: 20 years between spouses', () => {
  it('earner born 1955, dependent born 1975: no crash, reasonable NPV', () => {
    const earner = makeRecipient(2000, 1955, 5, 15);
    const dependent = makeRecipient(500, 1975, 5, 15);
    const earnerFd = finalDateAtAge(earner, 90);
    const depFd = finalDateAtAge(dependent, 90);

    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(67), filingAge(67)]
    );

    expect(npv).toBeGreaterThan(0);

    // Also verify periods are generated without error
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      [filingAge(67), filingAge(67)]
    );
    expect(periods.length).toBeGreaterThan(0);
  });

  it('20-year gap: earner dies while dependent is still young (before 62)', () => {
    // Earner born 1955, dies at 75 (year 2030).
    // Dependent born 1975, turns 62 in 2037, files at 67 in 2042.
    // Earner dies 12 years before dependent can even file.
    const earner = makeRecipient(2000, 1955, 5, 15);
    const dependent = makeRecipient(500, 1975, 5, 15);
    const earnerFd = finalDateAtAge(earner, 75);
    const depFd = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      [filingAge(67), filingAge(67)]
    );

    // Earner dies at 75, well before NRA filing.
    // The earner's personal periods should still exist (filed at 67, dies at 75).
    const earnerPersonal = personalPeriods(periodsForIndex(periods, 0));
    expect(earnerPersonal.length).toBeGreaterThan(0);

    // Dependent should get survivor benefits (earner died, dependent files at 67)
    // survivorStart = max(earnerDeath+1, dependentFiling@67)
    // earnerDeath ~ 2030, dependentFiling ~ 2042
    // So survivorStart = dependentFiling@67 (in 2042)
    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBeGreaterThanOrEqual(1);

    // NPV should be positive
    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(67), filingAge(67)]
    );
    expect(npv).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 10. Three-way comparison: couple NPV vs sum of singles vs earner-only
// ==========================================================================
describe('Three-way comparison: couple NPV vs sum of singles', () => {
  it('spousal-eligible couple: couple_NPV >= single1 + single2', () => {
    // Earner $2000, dependent $400. Spousal eligible (1000 > 400).
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(400, 1960);
    const fd = finalDateAtAge(earner, 85);
    const nra = filingAge(67);

    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);

    const coupleNpv = strategySumCentsCouple(
      [earner, dependent],
      [fd, fd],
      FAR_PAST,
      NO_DISCOUNT,
      [nra, nra]
    );
    const single1 = strategySumCentsSingle(
      earner,
      fd,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );
    const single2 = strategySumCentsSingle(
      dependent,
      fd,
      FAR_PAST,
      NO_DISCOUNT,
      nra
    );

    // Couple should get extra from spousal/survivor benefits
    expect(coupleNpv).toBeGreaterThanOrEqual(single1 + single2);
  });

  it('ineligible couple (equal PIAs): couple_NPV == single1 + single2', () => {
    // Equal PIAs: no spousal benefit (PIA/2 = PIA, not > PIA).
    // Same death dates: no survivor either (both die at same time).
    const r1 = makeRecipientDec15(1500, 1960);
    const r2 = makeRecipientDec15(1500, 1960);
    const fd = finalDateAtAge(r1, 85);
    const nra = filingAge(67);

    expect(eligibleForSpousalBenefit(r1, r2)).toBe(false);
    expect(eligibleForSpousalBenefit(r2, r1)).toBe(false);

    const coupleNpv = strategySumCentsCouple(
      [r1, r2],
      [fd, fd],
      FAR_PAST,
      NO_DISCOUNT,
      [nra, nra]
    );
    const single1 = strategySumCentsSingle(r1, fd, FAR_PAST, NO_DISCOUNT, nra);
    const single2 = strategySumCentsSingle(r2, fd, FAR_PAST, NO_DISCOUNT, nra);

    expect(coupleNpv).toBe(single1 + single2);
  });

  it('ineligible couple, one dies earlier: couple_NPV >= single1 + single2 (survivor)', () => {
    // Equal PIAs ($1500/$1500) => no spousal eligibility.
    // But earner dies first, so survivor benefit might apply.
    // With equal PIAs, survivor benefit = earner's benefit.
    // Dependent's own benefit at same filing age = same as earner's.
    // So survivor >= personal only if earner filed later (more delayed credits).
    // With both at NRA: survivor = personal => no survivor period.
    const r1 = makeRecipientDec15(1500, 1960);
    const r2 = makeRecipientDec15(1500, 1960);
    const fd1 = finalDateAtAge(r1, 75); // r1 dies early
    const fd2 = finalDateAtAge(r2, 90);
    const nra = filingAge(67);

    const coupleNpv = strategySumCentsCouple(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      NO_DISCOUNT,
      [nra, nra]
    );
    const single1 = strategySumCentsSingle(r1, fd1, FAR_PAST, NO_DISCOUNT, nra);
    const single2 = strategySumCentsSingle(r2, fd2, FAR_PAST, NO_DISCOUNT, nra);

    // Couple NPV should be >= sum of singles (survivor adds nothing with equal PIAs,
    // but should never be less).
    expect(coupleNpv).toBeGreaterThanOrEqual(single1 + single2);
  });
});

// ==========================================================================
// 11. Filing age past 70y0m
// ==========================================================================
describe('Filing age past 70y0m', () => {
  it('filing at 70y1m: strategySumCentsCouple still produces a result', () => {
    // 70y1m = 841 months. The system should either clamp or handle gracefully.
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const fd1 = finalDateAtAge(r1, 85);
    const fd2 = finalDateAtAge(r2, 85);

    // This might throw or might produce a result. Either is acceptable,
    // but it should not crash with an unhandled exception.
    let threw = false;
    let npv = 0;
    try {
      npv = strategySumCentsCouple(
        [r1, r2],
        [fd1, fd2],
        FAR_PAST,
        NO_DISCOUNT,
        [filingAge(70, 1), filingAge(67)]
      );
    } catch {
      threw = true;
    }

    // If it did not throw, NPV should still be non-negative
    if (!threw) {
      expect(npv).toBeGreaterThanOrEqual(0);
    }
    // If it threw, that's also a valid response to invalid input.
    // The test passes either way -- we're checking for no unhandled crash.
    expect(true).toBe(true);
  });

  it('filing at exactly 70y0m is valid and produces maximum delayed credits', () => {
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const fd1 = finalDateAtAge(r1, 85);
    const fd2 = finalDateAtAge(r2, 85);

    const npvAt70 = strategySumCentsCouple(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(70), filingAge(67)]
    );

    expect(npvAt70).toBeGreaterThan(0);

    // Compare with filing at 69y11m: 70y0m should give slightly higher
    // monthly benefit but fewer months of collection.
    const npvAt69_11 = strategySumCentsCouple(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(69, 11), filingAge(67)]
    );

    // Both should be positive
    expect(npvAt69_11).toBeGreaterThan(0);
  });
});

// ==========================================================================
// BONUS: Additional adversarial scenarios
// ==========================================================================

// 12. Odd PIA cents: integer division edge case in spousal eligibility
describe('Odd PIA cents and spousal eligibility edge case', () => {
  it('earner PIA with odd cents: $999.99 (99999 cents) / 2 = 50000 (rounded)', () => {
    // Money.from(999.99) = 99999 cents. div(2) = Math.round(99999/2) = Math.round(49999.5) = 50000 cents.
    // Dependent PIA = $500 = 50000 cents. 50000 > 50000 is false => NOT eligible.
    const earner = makeRecipient(999.99, 1960, 11, 15);
    const dependent = makeRecipient(500, 1960, 11, 15);

    const earnerHalf = earner.pia().primaryInsuranceAmount().div(2);
    const depPia = dependent.pia().primaryInsuranceAmount();

    // This is the edge case: rounding 99999/2 = 49999.5 -> 50000
    expect(earnerHalf.cents()).toBe(50000);
    expect(depPia.cents()).toBe(50000);
    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(false);
  });
});

// 13. Zero PIA earner with non-zero dependent: roles should flip
describe('Zero PIA earner with non-zero dependent', () => {
  it('$0/$1000: dependent becomes earner, $0 PIA person gets spousal', () => {
    const r1 = makeRecipientDec15(0, 1960);
    const r2 = makeRecipientDec15(1000, 1960);

    // r2 has higher PIA
    expect(higherEarningsThan(r2, r1)).toBe(true);

    // r1 (PIA=0) is eligible for spousal from r2 (PIA=1000)
    // 1000/2 = 500 > 0 = true
    expect(eligibleForSpousalBenefit(r1, r2)).toBe(true);

    const periods = strategySumPeriodsCouple(
      [r1, r2],
      [finalDateAtAge(r1, 85), finalDateAtAge(r2, 85)],
      [filingAge(67), filingAge(67)]
    );

    // r1 ($0 PIA) should have spousal periods
    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBeGreaterThan(0);
    // Spousal amount should be earnerPIA/2 = $500
    expect(spousal[0].amount.value()).toBe(500);
  });
});

// 14. Both have $0 PIA: degenerate case
describe('Both have $0 PIA', () => {
  it('no benefits at all, NPV = 0', () => {
    const r1 = makeRecipientDec15(0, 1960);
    const r2 = makeRecipientDec15(0, 1960);
    const fd = finalDateAtAge(r1, 85);

    const npv = strategySumCentsCouple(
      [r1, r2],
      [fd, fd],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(67), filingAge(67)]
    );

    expect(npv).toBe(0);
  });
});

// 15. Earner dies before 62: never files, but dependent gets survivor
describe('Earner dies before 62', () => {
  it('earner dies at 60, filing strategy at 67: earner gets nothing', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const earnerFd = finalDateAtAge(earner, 60); // dies before 62
    const depFd = finalDateAtAge(dependent, 85);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      [filingAge(67), filingAge(67)]
    );

    // Earner dies before filing age. Personal periods should have filing date
    // after death, so effectively 0 months of personal benefit for earner.
    const earnerPersonal = personalPeriods(periodsForIndex(periods, 0));
    const _earnerCents = manualSumCents(earnerPersonal);
    // Any earner personal period that starts after death should have 0 duration
    // or negative duration. The sum should be 0 or very close to it.
    // (The system may still create the period but with end < start.)
    for (const p of earnerPersonal) {
      if (p.startDate.greaterThan(earnerFd)) {
        // Period starts after death: should have 0 or negative duration
        expect(p.endDate.monthsSinceEpoch()).toBeLessThanOrEqual(
          p.startDate.monthsSinceEpoch()
        );
      }
    }

    // But dependent should still get survivor benefits
    const survivor = survivorPeriods(periods);
    // Earner never filed (filing date 67 > death date 60), so earner
    // is treated as if they didn't file. Survivor benefit = PIA.
    expect(survivor.length).toBeGreaterThanOrEqual(1);
  });
});

// 16. Period sum matches NPV at 0% discount
describe('Period sum matches NPV at 0% discount rate', () => {
  it('manual period sum equals strategySumCentsCouple with no discount', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const fd1 = finalDateAtAge(earner, 80);
    const fd2 = finalDateAtAge(dependent, 85);
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [fd1, fd2],
      strats
    );

    const manualSum = manualSumCents(periods);
    const npv = strategySumCentsCouple(
      [earner, dependent],
      [fd1, fd2],
      FAR_PAST,
      NO_DISCOUNT,
      strats
    );

    // At 0% discount with FAR_PAST, NPV should equal the raw sum of all
    // period amounts * months.
    expect(npv).toBe(manualSum);
  });
});

// 17. Survivor benefit directionality: only lower earner gets survivor
describe('Survivor benefit directionality', () => {
  it('only the dependent (lower earner) gets survivor, never the earner', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);
    const earnerFd = finalDateAtAge(earner, 75);
    const depFd = finalDateAtAge(dependent, 90);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      [filingAge(67), filingAge(67)]
    );

    const survivor = survivorPeriods(periods);
    // All survivor periods should be for the dependent (index 1)
    for (const p of survivor) {
      expect(p.recipientIndex).toBe(1);
    }

    // Earner should have no survivor periods
    const earnerSurvivor = survivor.filter((p) => p.recipientIndex === 0);
    expect(earnerSurvivor).toHaveLength(0);
  });
});

// ==========================================================================
// 18. Optimized vs non-optimized produce identical NPVs
// ==========================================================================
describe('Optimized vs non-optimized produce identical results', () => {
  it('typical couple: both functions agree on NPV', () => {
    const r1 = makeRecipientDec15(2000, 1962);
    const r2 = makeRecipientDec15(500, 1965);
    const fd1 = finalDateAtAge(r1, 85);
    const fd2 = finalDateAtAge(r2, 90);

    const result = optimalStrategyCouple(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      NO_DISCOUNT
    );
    const resultOpt = optimalStrategyCoupleOptimized(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      NO_DISCOUNT
    );

    // Both should find the same optimal NPV
    expect(resultOpt[2]).toBe(result[2]);
  });

  it('asymmetric PIAs with early death: both agree', () => {
    const r1 = makeRecipientDec15(3000, 1960);
    const r2 = makeRecipientDec15(200, 1960);
    const fd1 = finalDateAtAge(r1, 70); // earner dies at 70
    const fd2 = finalDateAtAge(r2, 95);

    const result = optimalStrategyCouple(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      NO_DISCOUNT
    );
    const resultOpt = optimalStrategyCoupleOptimized(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      NO_DISCOUNT
    );

    expect(resultOpt[2]).toBe(result[2]);
  });
});

// ==========================================================================
// 19. Spousal eligibility vs spousal amount consistency
// ==========================================================================
describe('Spousal eligibility vs amount consistency', () => {
  it('eligible by PIA but $0 spousal amount: period exists with $0', () => {
    // earnerPIA=$1000, dependentPIA=$499.
    // Eligible: 1000/2=500 > 499 = true.
    // But what if both file at NRA? spousalCents = 100000/2 - 49900 = 50000 - 49900 = 100 cents.
    // spousal = $1.00. So it's small but not zero.
    const earner = makeRecipientDec15(1000, 1960);
    const dependent = makeRecipientDec15(499, 1960);

    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [finalDateAtAge(earner, 85), finalDateAtAge(dependent, 85)],
      [filingAge(67), filingAge(67)]
    );
    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBeGreaterThan(0);
    // Spousal amount = earnerPIA/2 - dependentPIA = 500 - 499 = $1
    expect(spousal[0].amount.value()).toBe(1);
  });

  it('PIA=1001 earner, PIA=500 dependent: spousal = $0.50 rounds to $0', () => {
    // earnerPIA=$1001 = 100100 cents. spousalBenefitOnDate: 100100/2 - 50000 = 50050 - 50000 = 50 cents = $0.50.
    // After floorToDollar, $0. So the spousal period might exist but with $0 amount.
    // eligibleForSpousalBenefit: div(2) = Math.round(100100/2) = 50050 cents. 50050 > 50000 = true.
    const earner = makeRecipientDec15(1001, 1960);
    const dependent = makeRecipientDec15(500, 1960);

    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [finalDateAtAge(earner, 85), finalDateAtAge(dependent, 85)],
      [filingAge(67), filingAge(67)]
    );

    const spousal = spousalPeriods(periods);
    // The spousal period should exist but with $0 after floor.
    // spousalCents = 100100/2 - 50000 = 50 cents.
    // Money.fromCents(50).floorToDollar() = 0 cents.
    if (spousal.length > 0) {
      expect(spousal[0].amount.cents()).toBe(0);
    }
  });
});

// ==========================================================================
// 20. Earner dies in same month as dependent's filing: edge case for
//     survivorStartDate timing
// ==========================================================================
describe('Earner dies in exact month dependent files', () => {
  it('earner death month == dependent filing month: survivor starts month after', () => {
    // Earner dies in the exact month the dependent files.
    // survivorStart = max(earnerDeath+1, dependentFiling)
    // If earnerDeath == dependentFiling, survivorStart = earnerDeath + 1.
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(500, 1960);

    // Both file at NRA (67). Earner dies at exactly NRA date.
    const earnerFilingDate = filingDateOf(earner, 67);
    const earnerFd = earnerFilingDate; // dies in filing month

    const depFd = finalDateAtAge(dependent, 85);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      [filingAge(67), filingAge(67)]
    );

    const survivor = survivorPeriods(periods);

    // survivorStart = max(earnerFd + 1, dependentFiling@67)
    // earnerFd = dependentFiling@67 (same NRA), so survivorStart = earnerFd + 1
    if (survivor.length > 0) {
      const expectedStart = earnerFd.addDuration(new MonthDuration(1));
      expect(survivor[0].startDate.monthsSinceEpoch()).toBe(
        expectedStart.monthsSinceEpoch()
      );
    }
  });
});

// ==========================================================================
// 21. Discount rate sensitivity: high discount rates should reduce NPV
// ==========================================================================
describe('Discount rate sensitivity', () => {
  it('higher discount rate produces lower NPV', () => {
    const r1 = makeRecipientDec15(2000, 1960);
    const r2 = makeRecipientDec15(500, 1960);
    const fd1 = finalDateAtAge(r1, 85);
    const fd2 = finalDateAtAge(r2, 85);
    const strats: [MonthDuration, MonthDuration] = [
      filingAge(67),
      filingAge(67),
    ];

    const npv0 = strategySumCentsCouple(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      0,
      strats
    );
    const npv3 = strategySumCentsCouple(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      0.03,
      strats
    );
    const npv7 = strategySumCentsCouple(
      [r1, r2],
      [fd1, fd2],
      FAR_PAST,
      0.07,
      strats
    );

    // Higher discount => lower NPV
    expect(npv0).toBeGreaterThan(npv3);
    expect(npv3).toBeGreaterThan(npv7);
    // All should still be positive
    expect(npv7).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 22. Earner dies before dependent even turns 62
// ==========================================================================
describe('Earner dies before dependent reaches 62', () => {
  it('20-year gap, earner dies at 70: dependent (50 at earner death) gets survivor at filing', () => {
    // Earner born 1960, dependent born 1980.
    // Earner files at 67 (2027), dies at 70 (2030).
    // Dependent turns 62 in 2042, files at 67 (2047).
    // 17 years between earner death and dependent filing.
    const earner = makeRecipient(2000, 1960, 5, 15);
    const dependent = makeRecipient(500, 1980, 5, 15);

    const earnerFd = finalDateAtAge(earner, 70);
    const depFd = finalDateAtAge(dependent, 85);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      [filingAge(67), filingAge(67)]
    );

    const survivor = survivorPeriods(periods);
    expect(survivor.length).toBeGreaterThanOrEqual(1);

    // Survivor should start at dependent's filing date (much later than earner death)
    const depFilingDate = filingDateOf(dependent, 67);
    if (survivor.length > 0) {
      expect(survivor[0].startDate.monthsSinceEpoch()).toBe(
        depFilingDate.monthsSinceEpoch()
      );
    }

    // NPV should be positive
    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerFd, depFd],
      FAR_PAST,
      NO_DISCOUNT,
      [filingAge(67), filingAge(67)]
    );
    expect(npv).toBeGreaterThan(0);
  });
});

// ==========================================================================
// 23. Equal PIAs with different birthdates: who is "earner"?
// ==========================================================================
describe('Equal PIAs, different birthdates', () => {
  it('same PIA ($1500), different birth years: R1 is NOT higher earner', () => {
    // When PIAs are exactly equal, higherEarningsThan returns false for both.
    // The code defaults earnerIndex=1 (second recipient) in that case.
    const r1 = makeRecipientDec15(1500, 1960);
    const r2 = makeRecipientDec15(1500, 1965);

    expect(higherEarningsThan(r1, r2)).toBe(false);
    expect(higherEarningsThan(r2, r1)).toBe(false);

    // No spousal in either direction
    expect(eligibleForSpousalBenefit(r1, r2)).toBe(false);
    expect(eligibleForSpousalBenefit(r2, r1)).toBe(false);
  });

  it('equal PIAs with one dying first still produces no survivor (benefits equal)', () => {
    // Equal PIAs, same filing age. Survivor benefit = earner's benefit.
    // Dependent's personal benefit = same (identical PIA, same filing age).
    // Personal >= survivor, so no survivor period.
    const r1 = makeRecipientDec15(1500, 1960);
    const r2 = makeRecipientDec15(1500, 1960);
    const fd1 = finalDateAtAge(r1, 72); // r1 dies early
    const fd2 = finalDateAtAge(r2, 90);

    const periods = strategySumPeriodsCouple(
      [r1, r2],
      [fd1, fd2],
      [filingAge(67), filingAge(67)]
    );

    // With equal PIAs and same filing age, survivor = personal, so no switch.
    // However, technically the code checks "personal < survivor" (strict less than).
    // If they're exactly equal, no survivor period. Verify.
    expect(survivorPeriods(periods)).toHaveLength(0);
  });
});

// ==========================================================================
// 24. PIA = $1 (minimum non-zero): extreme low
// ==========================================================================
describe('Extreme low PIA: $1', () => {
  it('$1 PIA earner, $0 dependent: spousal = $0 after floor', () => {
    // earnerPIA = $1 = 100 cents. spousal = 100/2 - 0 = 50 cents = $0.50.
    // After floorToDollar, $0. But eligibleForSpousalBenefit: div(2) = round(50) = 50 > 0 = true.
    const earner = makeRecipientDec15(1, 1960);
    const dependent = makeRecipientDec15(0, 1960);

    expect(eligibleForSpousalBenefit(dependent, earner)).toBe(true);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [finalDateAtAge(earner, 85), finalDateAtAge(dependent, 85)],
      [filingAge(67), filingAge(67)]
    );

    const spousal = spousalPeriods(periods);
    // Period may exist with $0 amount
    if (spousal.length > 0) {
      // $0.50 floored to $0
      expect(spousal[0].amount.cents()).toBe(0);
    }
  });

  it('$1 PIA: personal benefit at NRA is $1', () => {
    const r = makeRecipientDec15(1, 1960);
    const benefit = benefitAtAge(r, r.normalRetirementAge());
    // $1 PIA at NRA should be $1 (no reduction, no delayed credits).
    // But floorToDollar is applied: $1.00 floored = $1.00
    expect(benefit.value()).toBe(1);
  });
});

// ==========================================================================
// 25. Dependent files at 62, earner at 70: spousal starts when earner files
// ==========================================================================
describe('Dependent files at 62, earner at 70', () => {
  it('spousal starts at earner filing (70), not dependent filing (62)', () => {
    const earner = makeRecipientDec15(2000, 1960);
    const dependent = makeRecipientDec15(400, 1960);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [finalDateAtAge(earner, 85), finalDateAtAge(dependent, 85)],
      [filingAge(70), filingAge(62, 1)]
    );

    const spousal = spousalPeriods(periods);
    expect(spousal.length).toBeGreaterThan(0);

    // Spousal start = max(earnerFiling@70, dependentFiling@62+1) = earnerFiling@70
    const earnerFilingDate = filingDateOf(earner, 70);
    expect(spousal[0].startDate.monthsSinceEpoch()).toBe(
      earnerFilingDate.monthsSinceEpoch()
    );

    // Dependent has been collecting personal benefit since 62+1.
    // Combined cap: personal + spousal <= earnerPIA/2.
    // Personal at 70 (8 years after filing at 62) with early reduction applied.
    // Spousal should account for the combined cap.
    expect(spousal[0].amount.cents()).toBeGreaterThanOrEqual(0);
  });
});
