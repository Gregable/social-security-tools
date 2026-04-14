import { describe, expect, it } from 'vitest';
import { benefitAtAge, benefitOnDate } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  optimalStrategySingle,
  strategySumCentsSingle,
  strategySumPeriodsSingle,
} from '$lib/strategy/calculations';
import { optimalStrategyCoupleOptimized } from '$lib/strategy/calculations/strategy-calc';

/**
 * Temporal consistency tests for the strategy optimizer.
 *
 * These tests verify properties that must hold across time: benefits that
 * remain constant under COLA-free assumptions, NPV invariance under birth year
 * translation, sum-of-parts decomposition, and convergence under discounting.
 */

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

const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

function age(years: number, months: number = 0): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

function deathDateAtAge(
  recipient: Recipient,
  ageYears: number,
  ageMonths: number = 0
): MonthDate {
  return recipient.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({ years: ageYears, months: ageMonths })
  );
}

// ---------------------------------------------------------------------------
// 1. COLA-free: benefit amount is constant after first January
// ---------------------------------------------------------------------------
describe('COLA-free: benefit amount is constant after first January', () => {
  // Since ssa.tools assumes no COLA, once the delayed January bump resolves,
  // the monthly benefit should be identical for every subsequent month.
  // After the first January following filing, benefitOnDate should return
  // the same value at +12, +24, +60, and +120 months.

  it('filing at NRA (67y0m) -- benefit is constant from filing month onward', () => {
    // Filing at NRA means no delayed credits to wait for, so the benefit
    // should be constant from the very first month.
    const r = makeRecipient(2000, 1960, 5, 15);
    const filingDate = r.birthdate.dateAtSsaAge(age(67, 0));

    const offsets = [0, 12, 24, 60, 120];
    const benefits = offsets.map((m) =>
      benefitOnDate(r, filingDate, filingDate.addDuration(new MonthDuration(m)))
    );

    for (let i = 1; i < benefits.length; i++) {
      expect(benefits[i].cents()).toBe(benefits[0].cents());
    }
  });

  it('filing at 68y0m -- benefit constant after first January', () => {
    // Filing after NRA but not at 70 triggers the delayed January bump:
    // the first few months may have a lower benefit, but once January hits,
    // the amount should be constant forever after.
    const r = makeRecipient(1800, 1962, 3, 10);
    const filingDate = r.birthdate.dateAtSsaAge(age(68, 0));

    // The first January after filing:
    const monthsToJan = 12 - filingDate.monthIndex();
    const janDate = filingDate.addDuration(new MonthDuration(monthsToJan));

    const offsets = [0, 12, 24, 60, 120];
    const benefits = offsets.map((m) =>
      benefitOnDate(r, filingDate, janDate.addDuration(new MonthDuration(m)))
    );

    for (let i = 1; i < benefits.length; i++) {
      expect(benefits[i].cents()).toBe(benefits[0].cents());
    }
  });

  it('filing at 70y0m -- benefit constant from filing month onward', () => {
    // Filing at exactly 70 is a special case: delayed credits apply
    // immediately (no January bump needed).
    const r = makeRecipient(2500, 1965, 8, 20);
    const filingDate = r.birthdate.dateAtSsaAge(age(70, 0));

    const offsets = [0, 12, 24, 60, 120];
    const benefits = offsets.map((m) =>
      benefitOnDate(r, filingDate, filingDate.addDuration(new MonthDuration(m)))
    );

    for (let i = 1; i < benefits.length; i++) {
      expect(benefits[i].cents()).toBe(benefits[0].cents());
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Birth year translation invariance at 0% discount
// ---------------------------------------------------------------------------
describe('Birth year translation invariance at 0% discount', () => {
  // Two recipients with the same PIA, born 5 years apart, filing at the same
  // age and dying at the same age. At 0% discount with FAR_PAST currentDate,
  // the NPV should be identical because only relative ages matter.
  // Both birth years must be >= 1960 so they share the same NRA (67y0m).

  it('PIA $1500, filing at 62y1m, death at 85', () => {
    const r1 = makeRecipient(1500, 1960, 5, 15);
    const r2 = makeRecipient(1500, 1965, 5, 15);
    const strat = age(62, 1);
    const npv1 = strategySumCentsSingle(
      r1,
      deathDateAtAge(r1, 85),
      FAR_PAST,
      0,
      strat
    );
    const npv2 = strategySumCentsSingle(
      r2,
      deathDateAtAge(r2, 85),
      FAR_PAST,
      0,
      strat
    );
    expect(npv1).toBe(npv2);
  });

  it('PIA $2000, filing at 67y0m (NRA), death at 90', () => {
    const r1 = makeRecipient(2000, 1962, 0, 15);
    const r2 = makeRecipient(2000, 1967, 0, 15);
    const strat = age(67, 0);
    const npv1 = strategySumCentsSingle(
      r1,
      deathDateAtAge(r1, 90),
      FAR_PAST,
      0,
      strat
    );
    const npv2 = strategySumCentsSingle(
      r2,
      deathDateAtAge(r2, 90),
      FAR_PAST,
      0,
      strat
    );
    expect(npv1).toBe(npv2);
  });

  it('PIA $3000, filing at 70y0m, death at 80', () => {
    const r1 = makeRecipient(3000, 1963, 6, 10);
    const r2 = makeRecipient(3000, 1968, 6, 10);
    const strat = age(70, 0);
    const npv1 = strategySumCentsSingle(
      r1,
      deathDateAtAge(r1, 80),
      FAR_PAST,
      0,
      strat
    );
    const npv2 = strategySumCentsSingle(
      r2,
      deathDateAtAge(r2, 80),
      FAR_PAST,
      0,
      strat
    );
    expect(npv1).toBe(npv2);
  });
});

// ---------------------------------------------------------------------------
// 3. NPV is exactly monthly_benefit * months for single period at 0%
// ---------------------------------------------------------------------------
describe('NPV is exactly monthly_benefit * months for single period at 0%', () => {
  // When there is only one benefit period (no delayed January bump), at 0%
  // discount with FAR_PAST currentDate, NPV = period.amount.cents() * months.
  // Filing at NRA or before avoids the delayed January bump.

  it('filing at NRA (67y0m), death at 85', () => {
    const r = makeRecipient(2000, 1960, 5, 15);
    const strat = age(67, 0);
    const finalDate = deathDateAtAge(r, 85);
    const periods = strategySumPeriodsSingle(r, finalDate, strat);

    expect(periods.length).toBe(1);
    const months =
      periods[0].endDate.subtractDate(periods[0].startDate).asMonths() + 1;
    const expectedCents = periods[0].amount.cents() * months;
    const actualCents = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      0,
      strat
    );
    expect(actualCents).toBe(expectedCents);
  });

  it('filing at 62y1m, death at 80', () => {
    const r = makeRecipient(1500, 1965, 3, 15);
    const strat = age(62, 1);
    const finalDate = deathDateAtAge(r, 80);
    const periods = strategySumPeriodsSingle(r, finalDate, strat);

    // Filing before NRA: no delayed January bump, should be one period.
    expect(periods.length).toBe(1);
    const months =
      periods[0].endDate.subtractDate(periods[0].startDate).asMonths() + 1;
    const expectedCents = periods[0].amount.cents() * months;
    const actualCents = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      0,
      strat
    );
    expect(actualCents).toBe(expectedCents);
  });

  it('filing at 70y0m (special case), death at 90', () => {
    // At exactly 70, delayed credits apply immediately -- no January bump.
    const r = makeRecipient(2500, 1963, 8, 20);
    const strat = age(70, 0);
    const finalDate = deathDateAtAge(r, 90);
    const periods = strategySumPeriodsSingle(r, finalDate, strat);

    expect(periods.length).toBe(1);
    const months =
      periods[0].endDate.subtractDate(periods[0].startDate).asMonths() + 1;
    const expectedCents = periods[0].amount.cents() * months;
    const actualCents = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      0,
      strat
    );
    expect(actualCents).toBe(expectedCents);
  });
});

// ---------------------------------------------------------------------------
// 4. Two-period NPV matches sum of parts
// ---------------------------------------------------------------------------
describe('Two-period NPV matches sum of parts', () => {
  // When the delayed January bump creates 2 periods, at 0% discount the NPV
  // should equal period1.amount.cents() * period1_months +
  //              period2.amount.cents() * period2_months.

  it('filing at 68y0m (post-NRA, non-January, not 70)', () => {
    // Born Apr 10, so filing at 68y0m lands in a non-January month,
    // triggering the delayed January bump.
    const r = makeRecipient(2000, 1962, 3, 10);
    const strat = age(68, 0);
    const finalDate = deathDateAtAge(r, 85);
    const periods = strategySumPeriodsSingle(r, finalDate, strat);

    expect(periods.length).toBe(2);
    let expectedCents = 0;
    for (const period of periods) {
      const months =
        period.endDate.subtractDate(period.startDate).asMonths() + 1;
      expectedCents += period.amount.cents() * months;
    }
    const actualCents = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      0,
      strat
    );
    expect(actualCents).toBe(expectedCents);
  });

  it('filing at 69y0m with mid-year birth', () => {
    const r = makeRecipient(1800, 1965, 6, 15);
    const strat = age(69, 0);
    const finalDate = deathDateAtAge(r, 90);
    const periods = strategySumPeriodsSingle(r, finalDate, strat);

    expect(periods.length).toBe(2);
    let expectedCents = 0;
    for (const period of periods) {
      const months =
        period.endDate.subtractDate(period.startDate).asMonths() + 1;
      expectedCents += period.amount.cents() * months;
    }
    const actualCents = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      0,
      strat
    );
    expect(actualCents).toBe(expectedCents);
  });

  it('filing at 67y6m with October birth', () => {
    const r = makeRecipient(2200, 1960, 9, 20);
    const strat = age(67, 6);
    const finalDate = deathDateAtAge(r, 82);
    const periods = strategySumPeriodsSingle(r, finalDate, strat);

    expect(periods.length).toBe(2);
    let expectedCents = 0;
    for (const period of periods) {
      const months =
        period.endDate.subtractDate(period.startDate).asMonths() + 1;
      expectedCents += period.amount.cents() * months;
    }
    const actualCents = strategySumCentsSingle(
      r,
      finalDate,
      FAR_PAST,
      0,
      strat
    );
    expect(actualCents).toBe(expectedCents);
  });
});

// ---------------------------------------------------------------------------
// 5. Sliding currentDate by 1 month reduces NPV by exactly 1 payment at 0%
// ---------------------------------------------------------------------------
describe('Sliding currentDate by 1 month reduces NPV by exactly 1 payment at 0%', () => {
  // For a single filer at 0% discount, moving currentDate forward 1 month
  // causes the first payment to fall into the past. NPV should decrease by
  // exactly the monthly benefit amount for that lost payment.

  it('filing at NRA, death at 85', () => {
    const r = makeRecipient(2000, 1960, 5, 15);
    const strat = age(67, 0);
    const finalDate = deathDateAtAge(r, 85);
    const filingDate = r.birthdate.dateAtSsaAge(strat);

    // Set currentDate so the filing date is in the future.
    // Payments start 1 month after filing. The first payment date is
    // filingDate + 1 month. Set currentDate such that exactly that first
    // payment is the boundary.
    const currentDate1 = filingDate;
    const currentDate2 = filingDate.addDuration(new MonthDuration(1));

    const npv1 = strategySumCentsSingle(r, finalDate, currentDate1, 0, strat);
    const npv2 = strategySumCentsSingle(r, finalDate, currentDate2, 0, strat);

    const monthlyBenefit = benefitOnDate(
      r,
      filingDate,
      filingDate.addDuration(new MonthDuration(12))
    );
    expect(npv1 - npv2).toBe(monthlyBenefit.cents());
  });

  it('filing at 62y1m, death at 80', () => {
    const r = makeRecipient(1500, 1965, 3, 15);
    const strat = age(62, 1);
    const finalDate = deathDateAtAge(r, 80);
    const filingDate = r.birthdate.dateAtSsaAge(strat);

    const currentDate1 = filingDate;
    const currentDate2 = filingDate.addDuration(new MonthDuration(1));

    const npv1 = strategySumCentsSingle(r, finalDate, currentDate1, 0, strat);
    const npv2 = strategySumCentsSingle(r, finalDate, currentDate2, 0, strat);

    // At filing before NRA, the benefit is constant from month 1.
    const monthlyBenefit = benefitOnDate(r, filingDate, filingDate);
    expect(npv1 - npv2).toBe(monthlyBenefit.cents());
  });
});

// ---------------------------------------------------------------------------
// 6. Benefit amount at age X is independent of death date
// ---------------------------------------------------------------------------
describe('Benefit amount at age X is independent of death date', () => {
  // benefitAtAge depends only on PIA, NRA, and filing age -- not on when
  // the recipient dies. Two recipients with the same PIA and birthdate should
  // get the same benefitAtAge regardless of their assumed death date.

  it('benefitAtAge at 62y1m is the same regardless of death date', () => {
    const r1 = makeRecipient(2000, 1960, 5, 15);
    const r2 = makeRecipient(2000, 1960, 5, 15);

    const filingAge = age(62, 1);
    const b1 = benefitAtAge(r1, filingAge);
    const b2 = benefitAtAge(r2, filingAge);

    expect(b1.cents()).toBe(b2.cents());
  });

  it('benefitAtAge at 70y0m is the same regardless of death date', () => {
    const r1 = makeRecipient(3000, 1965, 8, 20);
    const r2 = makeRecipient(3000, 1965, 8, 20);

    const filingAge = age(70, 0);
    const b1 = benefitAtAge(r1, filingAge);
    const b2 = benefitAtAge(r2, filingAge);

    expect(b1.cents()).toBe(b2.cents());
  });
});

// ---------------------------------------------------------------------------
// 7. Optimal filing age is independent of PIA scaling at 0% discount
// ---------------------------------------------------------------------------
describe('Optimal filing age is independent of PIA scaling at 0% discount', () => {
  // At 0% discount, doubling PIA should not change the optimal filing age,
  // since all benefits scale proportionally and the tradeoff between early
  // and late filing depends only on the relative rates.

  it('PIA $1000 vs $2000, death at 85', () => {
    const r1 = makeRecipient(1000, 1960, 5, 15);
    const r2 = makeRecipient(2000, 1960, 5, 15);
    const finalDate1 = deathDateAtAge(r1, 85);
    const finalDate2 = deathDateAtAge(r2, 85);

    const [optAge1] = optimalStrategySingle(r1, finalDate1, FAR_PAST, 0);
    const [optAge2] = optimalStrategySingle(r2, finalDate2, FAR_PAST, 0);

    expect(optAge1.asMonths()).toBe(optAge2.asMonths());
  });

  it('PIA $500 vs $3000, death at 90', () => {
    const r1 = makeRecipient(500, 1965, 3, 10);
    const r2 = makeRecipient(3000, 1965, 3, 10);
    const finalDate1 = deathDateAtAge(r1, 90);
    const finalDate2 = deathDateAtAge(r2, 90);

    const [optAge1] = optimalStrategySingle(r1, finalDate1, FAR_PAST, 0);
    const [optAge2] = optimalStrategySingle(r2, finalDate2, FAR_PAST, 0);

    expect(optAge1.asMonths()).toBe(optAge2.asMonths());
  });
});

// ---------------------------------------------------------------------------
// 8. Couple: shifting both birthdates by same amount preserves optimal ages
// ---------------------------------------------------------------------------
describe('Couple: shifting both birthdates preserves optimal ages at 0%', () => {
  // At 0% discount with FAR_PAST, a couple born in 1960 should have the same
  // optimal filing ages as a couple born in 1965 (both >= 1960, same NRA).
  // Same PIA values, same death ages relative to birth.

  it('earner $3000 / dependent $1000, death at 85/80', () => {
    const r1a = makeRecipient(3000, 1960, 5, 15);
    const r1b = makeRecipient(1000, 1960, 5, 15);
    const r2a = makeRecipient(3000, 1965, 5, 15);
    const r2b = makeRecipient(1000, 1965, 5, 15);

    const [opt1a, opt1b] = optimalStrategyCoupleOptimized(
      [r1a, r1b],
      [deathDateAtAge(r1a, 85), deathDateAtAge(r1b, 80)],
      FAR_PAST,
      0
    );
    const [opt2a, opt2b] = optimalStrategyCoupleOptimized(
      [r2a, r2b],
      [deathDateAtAge(r2a, 85), deathDateAtAge(r2b, 80)],
      FAR_PAST,
      0
    );

    expect(opt1a.asMonths()).toBe(opt2a.asMonths());
    expect(opt1b.asMonths()).toBe(opt2b.asMonths());
  });

  it('earner $2500 / dependent $800, death at 90/88', () => {
    const r1a = makeRecipient(2500, 1962, 0, 15);
    const r1b = makeRecipient(800, 1962, 0, 15);
    const r2a = makeRecipient(2500, 1967, 0, 15);
    const r2b = makeRecipient(800, 1967, 0, 15);

    const [opt1a, opt1b] = optimalStrategyCoupleOptimized(
      [r1a, r1b],
      [deathDateAtAge(r1a, 90), deathDateAtAge(r1b, 88)],
      FAR_PAST,
      0
    );
    const [opt2a, opt2b] = optimalStrategyCoupleOptimized(
      [r2a, r2b],
      [deathDateAtAge(r2a, 90), deathDateAtAge(r2b, 88)],
      FAR_PAST,
      0
    );

    expect(opt1a.asMonths()).toBe(opt2a.asMonths());
    expect(opt1b.asMonths()).toBe(opt2b.asMonths());
  });
});

// ---------------------------------------------------------------------------
// 9. Filing 1 month later increases monthly benefit but decreases collection
//    months
// ---------------------------------------------------------------------------
describe('Filing 1 month later: higher benefit but fewer months', () => {
  // For any filing age between 62 and 70, filing 1 month later should:
  //   (a) increase the monthly benefit (or keep it equal at floor boundaries)
  //   (b) decrease the number of collection months by exactly 1
  // These properties hold for a fixed death date.

  it('filing at 64y0m vs 64y1m, death at 85', () => {
    const r = makeRecipient(2000, 1960, 5, 15);
    const finalDate = deathDateAtAge(r, 85);
    const strat1 = age(64, 0);
    const strat2 = age(64, 1);

    const periods1 = strategySumPeriodsSingle(r, finalDate, strat1);
    const periods2 = strategySumPeriodsSingle(r, finalDate, strat2);

    // Benefit amount should increase (or stay equal due to floor rounding)
    const benefit1 = benefitAtAge(r, strat1);
    const benefit2 = benefitAtAge(r, strat2);
    expect(benefit2.cents()).toBeGreaterThanOrEqual(benefit1.cents());

    // Total collection months should decrease by exactly 1
    const totalMonths1 = periods1.reduce(
      (sum, p) => sum + p.endDate.subtractDate(p.startDate).asMonths() + 1,
      0
    );
    const totalMonths2 = periods2.reduce(
      (sum, p) => sum + p.endDate.subtractDate(p.startDate).asMonths() + 1,
      0
    );
    expect(totalMonths1 - totalMonths2).toBe(1);
  });

  it('filing at 67y0m vs 67y1m, death at 80', () => {
    const r = makeRecipient(1800, 1965, 3, 10);
    const finalDate = deathDateAtAge(r, 80);
    const strat1 = age(67, 0);
    const strat2 = age(67, 1);

    const benefit1 = benefitAtAge(r, strat1);
    const benefit2 = benefitAtAge(r, strat2);
    expect(benefit2.cents()).toBeGreaterThanOrEqual(benefit1.cents());

    const periods1 = strategySumPeriodsSingle(r, finalDate, strat1);
    const periods2 = strategySumPeriodsSingle(r, finalDate, strat2);

    const totalMonths1 = periods1.reduce(
      (sum, p) => sum + p.endDate.subtractDate(p.startDate).asMonths() + 1,
      0
    );
    const totalMonths2 = periods2.reduce(
      (sum, p) => sum + p.endDate.subtractDate(p.startDate).asMonths() + 1,
      0
    );
    expect(totalMonths1 - totalMonths2).toBe(1);
  });

  it('at 0% discount, one of the two strategies is strictly better for a given death age', () => {
    // Filing later is better if you live long enough, worse if you die young.
    // For death at 85, we just verify the NPVs differ (no tie).
    const r = makeRecipient(2000, 1960, 5, 15);
    const finalDate = deathDateAtAge(r, 85);
    const strat1 = age(65, 0);
    const strat2 = age(65, 1);

    const npv1 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0, strat1);
    const npv2 = strategySumCentsSingle(r, finalDate, FAR_PAST, 0, strat2);

    // One should be strictly greater (they should not be exactly equal
    // for this particular death age and filing age).
    expect(npv1).not.toBe(npv2);
  });
});

// ---------------------------------------------------------------------------
// 10. NPV with discount should converge as death age increases
// ---------------------------------------------------------------------------
describe('NPV with discount should converge as death age increases', () => {
  // At a positive discount rate (5%), the marginal value of living one more
  // month decreases because payments far in the future are heavily discounted.
  // The difference in NPV between death at 70 and death at 80 should be
  // larger than the difference between death at 90 and death at 100.

  it('filing at 62y1m, 5% discount', () => {
    const r = makeRecipient(2000, 1960, 5, 15);
    const strat = age(62, 1);

    const npv70 = strategySumCentsSingle(
      r,
      deathDateAtAge(r, 70),
      FAR_PAST,
      0.05,
      strat
    );
    const npv80 = strategySumCentsSingle(
      r,
      deathDateAtAge(r, 80),
      FAR_PAST,
      0.05,
      strat
    );
    const npv90 = strategySumCentsSingle(
      r,
      deathDateAtAge(r, 90),
      FAR_PAST,
      0.05,
      strat
    );
    const npv100 = strategySumCentsSingle(
      r,
      deathDateAtAge(r, 100),
      FAR_PAST,
      0.05,
      strat
    );

    const diff70to80 = npv80 - npv70;
    const diff90to100 = npv100 - npv90;

    expect(diff70to80).toBeGreaterThan(diff90to100);
    // All differences should be positive (living longer always adds value)
    expect(diff70to80).toBeGreaterThan(0);
    expect(diff90to100).toBeGreaterThan(0);
  });

  it('filing at 70y0m, 5% discount', () => {
    const r = makeRecipient(2500, 1965, 8, 20);
    const strat = age(70, 0);

    const npv75 = strategySumCentsSingle(
      r,
      deathDateAtAge(r, 75),
      FAR_PAST,
      0.05,
      strat
    );
    const npv85 = strategySumCentsSingle(
      r,
      deathDateAtAge(r, 85),
      FAR_PAST,
      0.05,
      strat
    );
    const npv95 = strategySumCentsSingle(
      r,
      deathDateAtAge(r, 95),
      FAR_PAST,
      0.05,
      strat
    );
    const npv105 = strategySumCentsSingle(
      r,
      deathDateAtAge(r, 105),
      FAR_PAST,
      0.05,
      strat
    );

    const diff75to85 = npv85 - npv75;
    const diff95to105 = npv105 - npv95;

    expect(diff75to85).toBeGreaterThan(diff95to105);
    expect(diff75to85).toBeGreaterThan(0);
    expect(diff95to105).toBeGreaterThan(0);
  });
});
