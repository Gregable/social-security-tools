/**
 * Regression tests for the survivor-death-past-71 bug fix.
 *
 * Bug: When the deceased died after age 71 without filing, survivorBenefit()
 * returned $0 because benefitOnDate(deceased, deathDate, age71date) returned
 * $0 when filingDate > atDate. The fix caps the effective filing date at
 * age 70 using MonthDate.min(deathDate, age70date).
 *
 * These tests verify the fix works correctly at every layer: survivorBenefit()
 * directly, couple period construction, NPV calculation, and the optimizer.
 */
import { describe, expect, it } from 'vitest';
import { benefitAtAge, survivorBenefit } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  BenefitType,
  strategySumCentsCouple,
  strategySumCentsSingle,
  strategySumPeriodsCouple,
} from '$lib/strategy/calculations';
import { optimalStrategyCoupleOptimized } from '$lib/strategy/calculations/strategy-calc';

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

/** currentDate set far in the past so retroactivity rules never apply. */
const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

/** Age as a MonthDuration at whole years. */
function ageMonths(years: number, months: number = 0): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

/** Death date for a recipient at a given SSA age. */
function deathDateAtSsaAge(
  r: Recipient,
  years: number,
  months: number = 0
): MonthDate {
  return r.birthdate.dateAtSsaAge(ageMonths(years, months));
}

/**
 * Expected age-70 benefit for a 1960+ birth with 8% annual delayed increase.
 * NRA = 67y0m, so 36 months of delayed credits => multiplier = 1.24.
 * Result = floor(PIA * 1.24).
 */
function expectedAge70Benefit(piaDollars: number): Money {
  return Money.from(piaDollars).times(1.24).floorToDollar();
}

/**
 * Filter benefit periods to find survivor periods.
 */
function survivorPeriods(periods: ReturnType<typeof strategySumPeriodsCouple>) {
  return periods.filter((p) => p.benefitType === BenefitType.Survivor);
}

// ---------------------------------------------------------------------------
// 1. survivorBenefit returns correct amount at death ages 71-100
// ---------------------------------------------------------------------------

describe('survivorBenefit returns correct amount at death ages 71-100', () => {
  // Earner: born 1960-06-15, PIA $2000, NRA = 67y0m, delayed increase 8%/yr.
  // Survivor: born 1962-06-15, PIA $500, survivor NRA = 67y0m.
  // When survivor files at/past survivor NRA, base survivor benefit should
  // equal benefitAtAge(earner, 70y0m) since credits cap at 70.
  const earner = makeRecipient(2000, 1960, 5, 15);
  const survivor = makeRecipient(500, 1962, 5, 15);

  const age70Benefit = benefitAtAge(earner, ageMonths(70));

  for (const deathAge of [71, 75, 80, 85, 100]) {
    it(`earner dies at age ${deathAge} without filing`, () => {
      const deathDate = deathDateAtSsaAge(earner, deathAge);
      // Survivor files one month after earner's death, at survivor NRA or later.
      const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

      const result = survivorBenefit(
        survivor,
        earner,
        /* deceasedFilingDate (never filed) */ deathDate,
        deathDate,
        survivorFilingDate
      );

      expect(result.cents()).toBeGreaterThan(0);
      expect(result.cents()).toEqual(age70Benefit.cents());
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Survivor periods in couple have correct amount when earner dies past 71
// ---------------------------------------------------------------------------

describe('survivor periods in couple have correct amount when earner dies past 71', () => {
  // Earner: PIA $2500, born 1960-03-15 (NRA = 67, delayed = 8%/yr).
  // Dependent: PIA $800, born 1962-03-15 (lower earner).
  // Both file at age 70. Earner dies at various ages past 71.
  // The earner never filed before death in these scenarios -- earner strategy
  // is set to age 70 but earner dies before 70 would take effect (or after,
  // in which case the filing date equals or exceeds death date).
  //
  // Since we want the "never filed" path, we set earner's filing age to 70
  // and earner dies at 72+. In strategySumPeriodsCouple, earnerStratDate is
  // the date at age 70 which is before death, so this actually tests the
  // "filed before death" path. To test the "never filed" path through periods,
  // we need earnerStratDate >= deathDate. So we set earner strat to age 70
  // but earner dies at 72. stratDate at 70 < deathDate at 72, so this tests
  // the filed path. For the unfiled path, we would need strat > deathAge.
  //
  // Actually, the strategy logic passes earnerStratDate to survivorBenefit as
  // deceasedFilingDate. When earnerStratDate < earnerFinalDate, it takes the
  // "filed before death" branch. When earnerStratDate >= earnerFinalDate,
  // it takes the "never filed" branch.
  //
  // To hit the bug's code path (never filed, death past 71), we set the
  // earner's strategy to age 70 and death date to something before
  // the strategy date, OR set strategy after death. We'll use strategy age
  // 70 and death at 69 to show filed-before vs strategy age 70 and death at
  // 68 to show not-applicable. Actually the simplest: set earner strat
  // to be at or after death.

  for (const deathAge of [72, 75, 80, 85]) {
    it(`earner dies at age ${deathAge}, strategy age > death age (never filed path)`, () => {
      const earner = makeRecipient(2500, 1960, 2, 15);
      const dependent = makeRecipient(800, 1962, 2, 15);

      const earnerDeathDate = deathDateAtSsaAge(earner, deathAge);
      const dependentDeathDate = deathDateAtSsaAge(dependent, 90);

      // Set earner strategy to an age past death so earnerStratDate >= deathDate,
      // triggering the "never filed" branch. Use age 70 + death offset.
      // Actually, we need earnerStratDate >= earnerFinalDate. If earner dies
      // at 72, setting strat to 70 means strat < death (filed before death).
      // We need strat >= death. But strat is capped at 70 in the optimizer.
      // In the raw strategySumPeriodsCouple, strat can be any age.
      // However for the "never filed" scenario through the strategy layer,
      // we must have earnerStratDate >= earnerFinalDate.
      // Since death is at 72 and max strat is 70, earnerStratDate (at 70) < death (72).
      // This means through the strategy layer, death past 70 with strat at 70
      // always takes the "filed before death" branch.
      //
      // The "never filed" branch in survivorBenefit is hit when
      // deceasedFilingDate >= deceasedDeathDate. In strategy-calc, this happens
      // when earnerStratDate >= earnerFinalDate, meaning the earner's chosen
      // filing age corresponds to a date at or after their death.
      //
      // For earner born 1960-03-15 dying at 72:
      //   deathDate ~ 2032-02 (SSA age 72)
      //   stratDate at 70 ~ 2030-02
      //   70 < 72, so filed-before-death branch
      //
      // To test the never-filed path, we need earner strat >= death age.
      // Since death is at 72, set strat to 72 (or higher). But the optimizer
      // caps at 70. We can still call strategySumPeriodsCouple directly with
      // a strat > 70. Let's use strat = deathAge which is >= 72.
      const periods = strategySumPeriodsCouple(
        [earner, dependent],
        [earnerDeathDate, dependentDeathDate],
        [ageMonths(deathAge), ageMonths(67)]
      );

      const sPeriods = survivorPeriods(periods);
      // Survivor benefit should exist and be non-zero
      expect(sPeriods.length).toBeGreaterThanOrEqual(1);

      const expected = expectedAge70Benefit(2500);
      for (const sp of sPeriods) {
        expect(sp.amount.cents()).toBeGreaterThan(0);
        expect(sp.amount.cents()).toEqual(expected.cents());
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Couple NPV is non-zero when earner dies past 71 without filing
// ---------------------------------------------------------------------------

describe('couple NPV is non-zero when earner dies past 71 without filing', () => {
  it('NPV at 0% discount is positive when earner dies at 75', () => {
    const earner = makeRecipient(2000, 1960, 5, 15);
    const dependent = makeRecipient(600, 1963, 5, 15);

    const earnerDeath = deathDateAtSsaAge(earner, 75);
    const dependentDeath = deathDateAtSsaAge(dependent, 90);

    // Strategy: earner at age 75 (never filed, since strat >= death),
    // dependent at NRA 67.
    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0, // 0% discount
      [ageMonths(75), ageMonths(67)]
    );

    expect(npv).toBeGreaterThan(0);
  });

  it('NPV at 0% includes survivor benefits (higher than dependent-only)', () => {
    const earner = makeRecipient(3000, 1960, 5, 15);
    const dependent = makeRecipient(500, 1963, 5, 15);

    const earnerDeath = deathDateAtSsaAge(earner, 72);
    const dependentDeath = deathDateAtSsaAge(dependent, 90);

    // With earner filing at 70 (before death at 72): filed-before-death path
    const npvFiled = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0,
      [ageMonths(70), ageMonths(67)]
    );

    // Dependent-only (single) NPV for comparison
    const npvSingle = strategySumCentsSingle(
      dependent,
      dependentDeath,
      FAR_PAST,
      0,
      ageMonths(67)
    );

    // Couple NPV should exceed dependent-only because earner's benefits
    // and survivor benefits contribute additional value.
    expect(npvFiled).toBeGreaterThan(npvSingle);
  });

  it('NPV with earner dying at 80 and never filing is positive', () => {
    const earner = makeRecipient(2500, 1960, 5, 15);
    const dependent = makeRecipient(700, 1963, 5, 15);

    const earnerDeath = deathDateAtSsaAge(earner, 80);
    const dependentDeath = deathDateAtSsaAge(dependent, 92);

    // earner strat at 80 >= death at 80 => never-filed path
    const npv = strategySumCentsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0,
      [ageMonths(80), ageMonths(67)]
    );

    expect(npv).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Optimizer produces reasonable result when earner expected to die at 72+
// ---------------------------------------------------------------------------

describe('optimizer produces reasonable result when earner expected to die at 72+', () => {
  it('optimal NPV is positive when earner dies at 75, dependent at 90', () => {
    const earner = makeRecipient(2000, 1960, 5, 15);
    const dependent = makeRecipient(600, 1963, 5, 15);

    const earnerDeath = deathDateAtSsaAge(earner, 75);
    const dependentDeath = deathDateAtSsaAge(dependent, 90);

    const [, , optimalNpv] = optimalStrategyCoupleOptimized(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0
    );

    expect(optimalNpv).toBeGreaterThan(0);
  });

  it('optimal NPV is positive when earner dies at 80, dependent at 95', () => {
    const earner = makeRecipient(2500, 1960, 5, 15);
    const dependent = makeRecipient(500, 1963, 5, 15);

    const earnerDeath = deathDateAtSsaAge(earner, 80);
    const dependentDeath = deathDateAtSsaAge(dependent, 95);

    const [, , optimalNpv] = optimalStrategyCoupleOptimized(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0
    );

    expect(optimalNpv).toBeGreaterThan(0);
  });

  it('optimal NPV exceeds dependent-only NPV due to survivor benefits', () => {
    const earner = makeRecipient(3000, 1960, 5, 15);
    const dependent = makeRecipient(400, 1963, 5, 15);

    const earnerDeath = deathDateAtSsaAge(earner, 73);
    const dependentDeath = deathDateAtSsaAge(dependent, 90);

    const [, , optimalNpv] = optimalStrategyCoupleOptimized(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      FAR_PAST,
      0
    );

    // Dependent-only NPV at best single filing age
    const singleNpvAt67 = strategySumCentsSingle(
      dependent,
      dependentDeath,
      FAR_PAST,
      0,
      ageMonths(67)
    );

    expect(optimalNpv).toBeGreaterThan(singleNpvAt67);
  });
});

// ---------------------------------------------------------------------------
// 5. Death at 70 vs 71 vs 72: survivor amounts should be equal
// ---------------------------------------------------------------------------

describe('death at 70 vs 71 vs 72: survivor amounts should be equal', () => {
  // Since delayed credits cap at 70, dying at 70, 71, or 72 without filing
  // should all produce the same survivor benefit (based on age-70 credits).
  const earner = makeRecipient(2000, 1960, 5, 15);
  const survivor = makeRecipient(500, 1962, 5, 15);

  function survivorAmountAtDeathAge(deathAge: number): number {
    const deathDate = deathDateAtSsaAge(earner, deathAge);
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));
    return survivorBenefit(
      survivor,
      earner,
      deathDate, // never filed
      deathDate,
      survivorFilingDate
    ).cents();
  }

  it('death at 70 and 71 produce equal survivor benefits', () => {
    const at70 = survivorAmountAtDeathAge(70);
    const at71 = survivorAmountAtDeathAge(71);
    expect(at70).toBeGreaterThan(0);
    expect(at71).toEqual(at70);
  });

  it('death at 70 and 72 produce equal survivor benefits', () => {
    const at70 = survivorAmountAtDeathAge(70);
    const at72 = survivorAmountAtDeathAge(72);
    expect(at70).toBeGreaterThan(0);
    expect(at72).toEqual(at70);
  });
});

// ---------------------------------------------------------------------------
// 6. Death at 69 vs 70: survivor amounts should differ
// ---------------------------------------------------------------------------

describe('death at 69 vs 70: survivor amounts should differ', () => {
  // For 1960+ births: NRA = 67, delayed increase = 8%/yr = 0.6667%/month.
  // At 69: 24 months of delayed credits past NRA.
  // At 70: 36 months of delayed credits past NRA.
  // The difference is 12 months of credits.
  const earner = makeRecipient(2000, 1960, 5, 15);
  const survivor = makeRecipient(500, 1962, 5, 15);

  function survivorAmountAtDeathAge(deathAge: number): number {
    const deathDate = deathDateAtSsaAge(earner, deathAge);
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));
    return survivorBenefit(
      survivor,
      earner,
      deathDate, // never filed
      deathDate,
      survivorFilingDate
    ).cents();
  }

  it('death at 69 produces lower survivor benefit than death at 70', () => {
    const at69 = survivorAmountAtDeathAge(69);
    const at70 = survivorAmountAtDeathAge(70);

    expect(at70).toBeGreaterThan(at69);
  });

  it('difference between 69 and 70 reflects 12 months of delayed credits', () => {
    const at69 = survivorAmountAtDeathAge(69);
    const at70 = survivorAmountAtDeathAge(70);

    // benefitAtAge at 69 vs 70:
    const benefitAt69 = benefitAtAge(earner, ageMonths(69));
    const benefitAt70 = benefitAtAge(earner, ageMonths(70));

    // The survivor amounts should match the personal benefit amounts at those
    // filing ages (since survivor files at/past survivor NRA).
    expect(at69).toEqual(benefitAt69.cents());
    expect(at70).toEqual(benefitAt70.cents());

    // Verify the two are actually different
    expect(benefitAt70.cents()).toBeGreaterThan(benefitAt69.cents());
  });
});

// ---------------------------------------------------------------------------
// 7. Bug fix doesn't affect earner-filed-before-death cases
// ---------------------------------------------------------------------------

describe('bug fix does not affect earner-filed-before-death cases', () => {
  // When the earner DID file before death, the fix (capping at age 70)
  // should NOT change the calculation (different code path).
  const earner = makeRecipient(2000, 1960, 5, 15);
  const survivor = makeRecipient(500, 1962, 5, 15);

  it('earner filed at 62, dies at 75', () => {
    const filingDate = earner.birthdate.dateAtSsaAge(
      earner.birthdate.earliestFilingMonth()
    );
    const deathDate = deathDateAtSsaAge(earner, 75);
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      survivor,
      earner,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // When earner filed at 62, benefit is reduced. Survivor gets the greater
    // of the earner's benefit or 82.5% of PIA.
    const earnerBenefitAtFiling = benefitAtAge(
      earner,
      earner.birthdate.earliestFilingMonth()
    );
    const floor825 = Money.from(2000).times(0.825).floorToDollar();
    const expectedBase = Money.max(earnerBenefitAtFiling, floor825);

    expect(result.cents()).toBeGreaterThan(0);
    expect(result.cents()).toEqual(expectedBase.floorToDollar().cents());
  });

  it('earner filed at NRA (67), dies at 72', () => {
    const filingDate = earner.birthdate.dateAtSsaAge(ageMonths(67));
    const deathDate = deathDateAtSsaAge(earner, 72);
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      survivor,
      earner,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // At NRA, benefit = PIA. Survivor benefit = max(PIA, 82.5% * PIA) = PIA.
    const pia = Money.from(2000);
    expect(result.cents()).toEqual(pia.cents());
  });

  it('earner filed at 70, dies at 75', () => {
    const filingDate = earner.birthdate.dateAtSsaAge(ageMonths(70));
    const deathDate = deathDateAtSsaAge(earner, 75);
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      survivor,
      earner,
      filingDate,
      deathDate,
      survivorFilingDate
    );

    // At 70, benefit = PIA * 1.24. Survivor gets max(that, 82.5% * PIA).
    const age70Benefit = benefitAtAge(earner, ageMonths(70));
    const floor825 = Money.from(2000).times(0.825).floorToDollar();
    const expectedBase = Money.max(age70Benefit, floor825);

    expect(result.cents()).toEqual(expectedBase.floorToDollar().cents());
  });
});

// ---------------------------------------------------------------------------
// 8. Bug fix with different PIAs
// ---------------------------------------------------------------------------

describe('bug fix with different PIAs', () => {
  // Earner dies at 75 without filing. Verify survivor = floor(PIA * 1.24)
  // for each PIA value (since credits cap at 70 => 36 months delayed credit).

  for (const piaDollars of [500, 2000, 4000]) {
    it(`PIA = $${piaDollars}, earner dies at 75 without filing`, () => {
      const earner = makeRecipient(piaDollars, 1960, 5, 15);
      // Survivor has much lower PIA so survivor benefit is applicable.
      const survivor = makeRecipient(100, 1962, 5, 15);

      const deathDate = deathDateAtSsaAge(earner, 75);
      const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

      const result = survivorBenefit(
        survivor,
        earner,
        deathDate, // never filed
        deathDate,
        survivorFilingDate
      );

      const expected = expectedAge70Benefit(piaDollars);
      expect(result.cents()).toEqual(expected.cents());
    });
  }
});

// ---------------------------------------------------------------------------
// Additional regression tests
// ---------------------------------------------------------------------------

describe('additional regression coverage', () => {
  it('survivorBenefit at exact boundary: earner dies at age 70y1m', () => {
    // Age 70y1m is past 70 but just barely. Credits should still cap at 70.
    const earner = makeRecipient(1800, 1960, 5, 15);
    const survivor = makeRecipient(400, 1962, 5, 15);

    const deathDate = deathDateAtSsaAge(earner, 70, 1);
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      survivor,
      earner,
      deathDate,
      deathDate,
      survivorFilingDate
    );

    const expected = benefitAtAge(earner, ageMonths(70));
    expect(result.cents()).toEqual(expected.cents());
  });

  it('survivor benefit through couple periods matches direct call', () => {
    // Verify that the survivor benefit amount in the period matches what
    // survivorBenefit() returns directly.
    const earner = makeRecipient(2500, 1960, 5, 15);
    const dependent = makeRecipient(600, 1963, 5, 15);

    const earnerDeath = deathDateAtSsaAge(earner, 73);
    const dependentDeath = deathDateAtSsaAge(dependent, 90);

    // Earner strat at 70 => files before death at 73 (filed-before path)
    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      [ageMonths(70), ageMonths(67)]
    );

    const sPeriods = survivorPeriods(periods);
    if (sPeriods.length > 0) {
      const earnerStratDate = earner.birthdate.dateAtSsaAge(ageMonths(70));
      const survivorStartDate = MonthDate.max(
        earnerDeath.addDuration(new MonthDuration(1)),
        dependent.birthdate.dateAtSsaAge(ageMonths(67))
      );

      const directSurvivor = survivorBenefit(
        dependent,
        earner,
        earnerStratDate,
        earnerDeath,
        survivorStartDate
      );

      expect(sPeriods[0].amount.cents()).toEqual(directSurvivor.cents());
    }
  });

  it('never-filed death at 90 still returns age-70 benefit', () => {
    const earner = makeRecipient(3000, 1960, 5, 15);
    const survivor = makeRecipient(200, 1965, 5, 15);

    const deathDate = deathDateAtSsaAge(earner, 90);
    const survivorFilingDate = deathDate.addDuration(new MonthDuration(1));

    const result = survivorBenefit(
      survivor,
      earner,
      deathDate,
      deathDate,
      survivorFilingDate
    );

    const expected = benefitAtAge(earner, ageMonths(70));
    expect(result.cents()).toEqual(expected.cents());
  });

  it('couple NPV never-filed vs filed-at-70 produces same survivor amount', () => {
    // When earner dies at 72:
    // - Never filed (strat >= death): effective filing capped at 70
    // - Filed at 70 (strat = 70 < death): benefit at 70
    // Both should yield the same survivor benefit amount.
    const earner = makeRecipient(2000, 1960, 5, 15);
    const dependent = makeRecipient(500, 1963, 5, 15);

    const earnerDeath = deathDateAtSsaAge(earner, 72);
    const dependentDeath = deathDateAtSsaAge(dependent, 90);

    // Filed at 70 (strat 70 < death 72)
    const periodsFiled = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      [ageMonths(70), ageMonths(67)]
    );

    // Never filed (strat 72 >= death 72)
    const periodsNeverFiled = strategySumPeriodsCouple(
      [earner, dependent],
      [earnerDeath, dependentDeath],
      [ageMonths(72), ageMonths(67)]
    );

    const survivorFiled = survivorPeriods(periodsFiled);
    const survivorNeverFiled = survivorPeriods(periodsNeverFiled);

    // Both scenarios should have survivor periods
    expect(survivorFiled.length).toBeGreaterThanOrEqual(1);
    expect(survivorNeverFiled.length).toBeGreaterThanOrEqual(1);

    // The survivor benefit amounts should be equal since both resolve to
    // the age-70 benefit.
    expect(survivorNeverFiled[0].amount.cents()).toEqual(
      survivorFiled[0].amount.cents()
    );
  });
});
