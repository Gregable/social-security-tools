import { describe, expect, it } from 'vitest';
import { benefitAtAge } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  strategySumCentsCouple,
  strategySumCentsSingle,
  strategySumPeriodsCouple,
  strategySumPeriodsSingle,
} from '$lib/strategy/calculations';

/**
 * Cross-check tests for NPV calculations against independently computed
 * present-value annuity formulas. These tests use pure math to verify the
 * strategy calculator's discounting logic.
 *
 * The code uses a deferred ordinary annuity formula:
 *
 *   NPV = C * [(1 - (1+r)^(-N)) / r] * (1+r)^(-k)
 *
 * where k = monthsToFirstPayment = effectiveStartPaymentDate - currentDate.
 *
 * This formula places payments at times k+1, k+2, ..., k+N from currentDate.
 * The ordinary annuity's pvFactor contributes an additional 1/(1+r) factor
 * for each payment, so the first payment is discounted to (1+r)^(-(k+1)).
 *
 * At r=0: NPV = C * N (no discounting).
 *
 * Monthly rate from annual: r = (1 + annual)^(1/12) - 1
 *
 * Payment timing in the code:
 *   - effectiveStartPaymentDate = max(currentDate + 1, startDate + 1)
 *   - effectiveEndPaymentDate = endDate + 1
 *   - k = effectiveStartPaymentDate - currentDate
 *   - N = effectiveEndPaymentDate - effectiveStartPaymentDate + 1
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

/** Convert annual discount rate to monthly. */
function monthlyRate(annualRate: number): number {
  if (annualRate === 0) return 0;
  return (1 + annualRate) ** (1 / 12) - 1;
}

/**
 * NPV of N equal monthly payments of C cents using the same deferred ordinary
 * annuity formula the code uses:
 *
 *   NPV = C * [(1 - (1+r)^(-N)) / r] * (1+r)^(-k)
 *
 * At r=0: NPV = C * N
 *
 * This places the first payment at time k+1 from currentDate.
 */
function annuityNPV(C: number, N: number, k: number, r: number): number {
  if (r === 0) return C * N;
  const pvFactor = (1 - (1 + r) ** -N) / r;
  const deferralFactor = (1 + r) ** -k;
  return C * pvFactor * deferralFactor;
}

/**
 * Compute k and N from the code's perspective for a single benefit period.
 *
 * k = effectiveStartPaymentDate - currentDate
 * N = effectiveEndPaymentDate - effectiveStartPaymentDate + 1
 *
 * where:
 *   effectiveStartPaymentDate = max(currentDate + 1, startDate + 1)
 *   effectiveEndPaymentDate = endDate + 1
 */
function computeKAndN(
  startDate: MonthDate,
  endDate: MonthDate,
  currentDate: MonthDate
): { k: number; N: number } | null {
  const firstPaymentDate = startDate.addDuration(new MonthDuration(1));
  const lastPaymentDate = endDate.addDuration(new MonthDuration(1));
  const currentDatePlusOne = currentDate.addDuration(new MonthDuration(1));

  const effectiveStart = MonthDate.max(currentDatePlusOne, firstPaymentDate);
  const effectiveEnd = lastPaymentDate;

  if (effectiveStart.monthsSinceEpoch() > effectiveEnd.monthsSinceEpoch()) {
    return null; // No payments in this period
  }

  const N =
    effectiveEnd.monthsSinceEpoch() - effectiveStart.monthsSinceEpoch() + 1;
  const k = effectiveStart.monthsSinceEpoch() - currentDate.monthsSinceEpoch();

  return { k, N };
}

// Use Dec 15 birthdates for simplicity. For Dec 15 lay birth:
//   - SSA birthday = Dec 14, ssaBirthMonthDate = December
//   - NRA = 67y0m for 1960+ births
//   - Filing at NRA => December of (birthYear + 67)
//   - Filing at NRA means benefit = PIA (no reduction or delayed credits)
//   - December filing avoids the delayed January bump, yielding a single period

/** Create a single-period scenario: file at NRA (67y0m). */
function singlePeriodSetup(piaDollars: number, birthYear: number) {
  const r = makeRecipient(piaDollars, birthYear, 11, 15);
  const filingAge = MonthDuration.initFromYearsMonths({
    years: 67,
    months: 0,
  });
  const filingDate = r.birthdate.dateAtSsaAge(filingAge);
  const benefitCents = benefitAtAge(r, filingAge).cents();
  return { r, filingAge, filingDate, benefitCents };
}

// ---------------------------------------------------------------------------
// 1. Single payment NPV at various discount rates
// ---------------------------------------------------------------------------

describe('Single payment NPV at various discount rates', () => {
  // File and die in the same month => 1 payment.
  // N = 1, k = effectiveStartPaymentDate - currentDate.
  // NPV = C * [(1-(1+r)^(-1))/r] * (1+r)^(-k) = C/(1+r) * (1+r)^(-k)

  it('0% discount rate', () => {
    const setup = singlePeriodSetup(2000, 1960);
    const deathDate = MonthDate.copyFrom(setup.filingDate);
    const currentDate = setup.filingDate.subtractDuration(new MonthDuration(1));

    const params = computeKAndN(setup.filingDate, deathDate, currentDate);
    expect(params).not.toBeNull();

    const expected = annuityNPV(setup.benefitCents, params!.N, params!.k, 0);
    const actual = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0,
      setup.filingAge
    );
    expect(actual).toBeCloseTo(expected, 0);
  });

  it('3% discount rate', () => {
    const setup = singlePeriodSetup(2000, 1960);
    const deathDate = MonthDate.copyFrom(setup.filingDate);
    const currentDate = setup.filingDate.subtractDuration(
      new MonthDuration(12)
    );

    const params = computeKAndN(setup.filingDate, deathDate, currentDate);
    expect(params).not.toBeNull();
    const rm = monthlyRate(0.03);

    const expected = annuityNPV(setup.benefitCents, params!.N, params!.k, rm);
    const actual = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0.03,
      setup.filingAge
    );
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  });

  it('6% discount rate', () => {
    const setup = singlePeriodSetup(2000, 1960);
    const deathDate = MonthDate.copyFrom(setup.filingDate);
    const currentDate = setup.filingDate.subtractDuration(
      new MonthDuration(24)
    );

    const params = computeKAndN(setup.filingDate, deathDate, currentDate);
    expect(params).not.toBeNull();
    const rm = monthlyRate(0.06);

    const expected = annuityNPV(setup.benefitCents, params!.N, params!.k, rm);
    const actual = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0.06,
      setup.filingAge
    );
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  });

  it('12% discount rate', () => {
    const setup = singlePeriodSetup(2000, 1960);
    const deathDate = MonthDate.copyFrom(setup.filingDate);
    const currentDate = setup.filingDate.subtractDuration(
      new MonthDuration(36)
    );

    const params = computeKAndN(setup.filingDate, deathDate, currentDate);
    expect(params).not.toBeNull();
    const rm = monthlyRate(0.12);

    const expected = annuityNPV(setup.benefitCents, params!.N, params!.k, rm);
    const actual = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0.12,
      setup.filingAge
    );
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 2. Multi-payment annuity at 0% discount
// ---------------------------------------------------------------------------

describe('Multi-payment annuity at 0% discount', () => {
  // At 0% discount, NPV = C * N regardless of timing.

  it('12 payments', () => {
    const setup = singlePeriodSetup(1500, 1962);
    const deathDate = setup.filingDate.addDuration(new MonthDuration(11));
    const currentDate = MonthDate.initFromYearsMonths({
      years: 200,
      months: 0,
    });

    const N = 12;
    const expected = setup.benefitCents * N;
    const actual = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0,
      setup.filingAge
    );
    expect(actual).toBe(expected);
  });

  it('60 payments', () => {
    const setup = singlePeriodSetup(1800, 1963);
    const deathDate = setup.filingDate.addDuration(new MonthDuration(59));
    const currentDate = MonthDate.initFromYearsMonths({
      years: 200,
      months: 0,
    });

    const N = 60;
    const expected = setup.benefitCents * N;
    const actual = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0,
      setup.filingAge
    );
    expect(actual).toBe(expected);
  });

  it('216 payments', () => {
    const setup = singlePeriodSetup(2500, 1964);
    const deathDate = setup.filingDate.addDuration(new MonthDuration(215));
    const currentDate = MonthDate.initFromYearsMonths({
      years: 200,
      months: 0,
    });

    const N = 216;
    const expected = setup.benefitCents * N;
    const actual = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0,
      setup.filingAge
    );
    expect(actual).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 3. Multi-payment annuity at non-zero discount
// ---------------------------------------------------------------------------

describe('Multi-payment annuity at non-zero discount', () => {
  // Use the full deferred ordinary annuity formula and compare within
  // 1 cent tolerance.

  it('2% discount, 36 payments', () => {
    const setup = singlePeriodSetup(2000, 1961);
    const N = 36;
    const deathDate = setup.filingDate.addDuration(new MonthDuration(N - 1));
    const currentDate = setup.filingDate.subtractDuration(
      new MonthDuration(12)
    );

    const params = computeKAndN(setup.filingDate, deathDate, currentDate);
    expect(params).not.toBeNull();
    expect(params!.N).toBe(N);
    const rm = monthlyRate(0.02);

    const expected = annuityNPV(setup.benefitCents, params!.N, params!.k, rm);
    const actual = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0.02,
      setup.filingAge
    );
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  });

  it('5% discount, 120 payments', () => {
    const setup = singlePeriodSetup(1200, 1965);
    const N = 120;
    const deathDate = setup.filingDate.addDuration(new MonthDuration(N - 1));
    const currentDate = setup.filingDate.subtractDuration(new MonthDuration(6));

    const params = computeKAndN(setup.filingDate, deathDate, currentDate);
    expect(params).not.toBeNull();
    expect(params!.N).toBe(N);
    const rm = monthlyRate(0.05);

    const expected = annuityNPV(setup.benefitCents, params!.N, params!.k, rm);
    const actual = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0.05,
      setup.filingAge
    );
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  });

  it('8% discount, 180 payments', () => {
    const setup = singlePeriodSetup(3000, 1966);
    const N = 180;
    const deathDate = setup.filingDate.addDuration(new MonthDuration(N - 1));
    const currentDate = setup.filingDate.subtractDuration(
      new MonthDuration(24)
    );

    const params = computeKAndN(setup.filingDate, deathDate, currentDate);
    expect(params).not.toBeNull();
    expect(params!.N).toBe(N);
    const rm = monthlyRate(0.08);

    const expected = annuityNPV(setup.benefitCents, params!.N, params!.k, rm);
    const actual = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0.08,
      setup.filingAge
    );
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  });

  it('5% discount, 240 payments', () => {
    const setup = singlePeriodSetup(2200, 1967);
    const N = 240;
    const deathDate = setup.filingDate.addDuration(new MonthDuration(N - 1));
    const currentDate = setup.filingDate.subtractDuration(
      new MonthDuration(36)
    );

    const params = computeKAndN(setup.filingDate, deathDate, currentDate);
    expect(params).not.toBeNull();
    expect(params!.N).toBe(N);
    const rm = monthlyRate(0.05);

    const expected = annuityNPV(setup.benefitCents, params!.N, params!.k, rm);
    const actual = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0.05,
      setup.filingAge
    );
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 4. Two-period NPV (delayed January bump)
// ---------------------------------------------------------------------------

describe('Two-period NPV (delayed January bump)', () => {
  // When filing after NRA in a non-January month (and not at age 70), the
  // code creates two periods:
  //   Period 1: filing month through December of that year (lower amount)
  //   Period 2: January of next year onward (full delayed credits)
  //
  // Using a Jun 15 birthdate (SSA birth month = May). Filing at 68y0m puts
  // the filing date in May, which is after NRA and not in January => January
  // bump creates 2 periods.

  it('3% discount, two periods', () => {
    const r = makeRecipient(2000, 1962, 5, 15);
    const filingAge = MonthDuration.initFromYearsMonths({
      years: 68,
      months: 0,
    });
    const filingDate = r.birthdate.dateAtSsaAge(filingAge);
    const finalDate = filingDate.addDuration(new MonthDuration(35));
    const currentDate = filingDate.subtractDuration(new MonthDuration(12));

    const periods = strategySumPeriodsSingle(r, finalDate, filingAge);
    expect(periods.length).toBe(2);

    const annualRate = 0.03;
    const rm = monthlyRate(annualRate);

    let expectedTotal = 0;
    for (const period of periods) {
      const params = computeKAndN(
        period.startDate,
        period.endDate,
        currentDate
      );
      if (params === null) continue;
      expectedTotal += annuityNPV(
        period.amount.cents(),
        params.N,
        params.k,
        rm
      );
    }

    const actual = strategySumCentsSingle(
      r,
      finalDate,
      currentDate,
      annualRate,
      filingAge
    );
    expect(Math.abs(actual - expectedTotal)).toBeLessThanOrEqual(1);
  });

  it('5% discount, two periods with longer duration', () => {
    const r = makeRecipient(2500, 1963, 5, 15);
    const filingAge = MonthDuration.initFromYearsMonths({
      years: 68,
      months: 6,
    });
    const filingDate = r.birthdate.dateAtSsaAge(filingAge);
    const finalDate = filingDate.addDuration(new MonthDuration(119));
    const currentDate = filingDate.subtractDuration(new MonthDuration(6));

    const periods = strategySumPeriodsSingle(r, finalDate, filingAge);
    expect(periods.length).toBe(2);

    const annualRate = 0.05;
    const rm = monthlyRate(annualRate);

    let expectedTotal = 0;
    for (const period of periods) {
      const params = computeKAndN(
        period.startDate,
        period.endDate,
        currentDate
      );
      if (params === null) continue;
      expectedTotal += annuityNPV(
        period.amount.cents(),
        params.N,
        params.k,
        rm
      );
    }

    const actual = strategySumCentsSingle(
      r,
      finalDate,
      currentDate,
      annualRate,
      filingAge
    );
    expect(Math.abs(actual - expectedTotal)).toBeLessThanOrEqual(1);
  });

  it('0% discount, two periods sum to C1*N1 + C2*N2', () => {
    const r = makeRecipient(1800, 1964, 5, 15);
    const filingAge = MonthDuration.initFromYearsMonths({
      years: 69,
      months: 0,
    });
    const filingDate = r.birthdate.dateAtSsaAge(filingAge);
    const finalDate = filingDate.addDuration(new MonthDuration(59));
    const currentDate = MonthDate.initFromYearsMonths({
      years: 200,
      months: 0,
    });

    const periods = strategySumPeriodsSingle(r, finalDate, filingAge);
    expect(periods.length).toBe(2);

    let expectedTotal = 0;
    for (const period of periods) {
      const N =
        period.endDate.monthsSinceEpoch() -
        period.startDate.monthsSinceEpoch() +
        1;
      expectedTotal += period.amount.cents() * N;
    }

    const actual = strategySumCentsSingle(
      r,
      finalDate,
      currentDate,
      0,
      filingAge
    );
    expect(actual).toBe(expectedTotal);
  });
});

// ---------------------------------------------------------------------------
// 5. Discount factor monotonicity
// ---------------------------------------------------------------------------

describe('Discount factor monotonicity', () => {
  it('NPV decreases as discount rate increases for single recipient', () => {
    const setup = singlePeriodSetup(2000, 1960);
    const deathDate = setup.filingDate.addDuration(new MonthDuration(119));
    const currentDate = setup.filingDate.subtractDuration(
      new MonthDuration(12)
    );

    const rates = [0, 0.01, 0.03, 0.05, 0.08, 0.12, 0.2];
    const npvs = rates.map((rate) =>
      strategySumCentsSingle(
        setup.r,
        deathDate,
        currentDate,
        rate,
        setup.filingAge
      )
    );

    for (let i = 1; i < npvs.length; i++) {
      expect(npvs[i]).toBeLessThan(npvs[i - 1]);
    }
  });

  it('NPV decreases monotonically for a range of fine-grained rates', () => {
    const setup = singlePeriodSetup(1500, 1965);
    const deathDate = setup.filingDate.addDuration(new MonthDuration(59));
    const currentDate = setup.filingDate.subtractDuration(
      new MonthDuration(24)
    );

    const rates = [0.001, 0.005, 0.01, 0.02, 0.04, 0.06, 0.1, 0.15];
    const npvs = rates.map((rate) =>
      strategySumCentsSingle(
        setup.r,
        deathDate,
        currentDate,
        rate,
        setup.filingAge
      )
    );

    for (let i = 1; i < npvs.length; i++) {
      expect(npvs[i]).toBeLessThan(npvs[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. NPV approaches 0 as discount rate approaches infinity
// ---------------------------------------------------------------------------

describe('NPV approaches 0 as discount rate approaches infinity', () => {
  it('NPV at 50% is much smaller than NPV at 0%', () => {
    const setup = singlePeriodSetup(2000, 1960);
    const deathDate = setup.filingDate.addDuration(new MonthDuration(119));
    const currentDate = setup.filingDate.subtractDuration(
      new MonthDuration(12)
    );

    const npv = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0.5,
      setup.filingAge
    );
    expect(npv).toBeGreaterThanOrEqual(0);

    const npvZero = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0,
      setup.filingAge
    );
    // At 50% annual rate over 10 years with 1 year deferral, NPV should
    // be a small fraction of undiscounted total
    expect(npv).toBeLessThan(npvZero * 0.25);
  });

  it('NPV at 100% and 500% are progressively smaller', () => {
    const setup = singlePeriodSetup(2000, 1960);
    const deathDate = setup.filingDate.addDuration(new MonthDuration(59));
    const currentDate = setup.filingDate.subtractDuration(new MonthDuration(6));

    const npv100 = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      1.0,
      setup.filingAge
    );
    const npv500 = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      5.0,
      setup.filingAge
    );

    expect(npv100).toBeGreaterThanOrEqual(0);
    expect(npv500).toBeGreaterThanOrEqual(0);
    expect(npv500).toBeLessThan(npv100);
  });
});

// ---------------------------------------------------------------------------
// 7. NPV approaches C*N as discount rate approaches 0
// ---------------------------------------------------------------------------

describe('NPV approaches C*N as discount rate approaches 0', () => {
  it('NPV at 0.001% is within 1% of NPV at 0%', () => {
    const setup = singlePeriodSetup(2000, 1960);
    const deathDate = setup.filingDate.addDuration(new MonthDuration(119));
    const currentDate = setup.filingDate.subtractDuration(
      new MonthDuration(12)
    );

    const npvZero = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0,
      setup.filingAge
    );
    const npvTiny = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0.00001,
      setup.filingAge
    );

    const ratio = npvTiny / npvZero;
    expect(ratio).toBeGreaterThan(0.99);
    expect(ratio).toBeLessThanOrEqual(1.0);
  });

  it('NPV at 0.01% is within 1% of C*N for 60 payments', () => {
    const setup = singlePeriodSetup(1500, 1963);
    const N = 60;
    const deathDate = setup.filingDate.addDuration(new MonthDuration(N - 1));
    const currentDate = setup.filingDate.subtractDuration(new MonthDuration(1));

    const npvZero = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0,
      setup.filingAge
    );
    const npvSmall = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate,
      0.0001,
      setup.filingAge
    );

    const ratio = npvSmall / npvZero;
    expect(ratio).toBeGreaterThan(0.99);
    expect(ratio).toBeLessThanOrEqual(1.0);
  });
});

// ---------------------------------------------------------------------------
// 8. Couple NPV = sum of period annuities
// ---------------------------------------------------------------------------

describe('Couple NPV = sum of period annuities', () => {
  // For a couple where neither is eligible for spousal benefits (both PIAs
  // are close), each person contributes their own personal benefit periods.
  // We get the actual periods from strategySumPeriodsCouple, compute NPV
  // for each period independently using the annuity formula, and compare
  // with strategySumCentsCouple.

  function setupCouple() {
    // Two recipients with similar PIAs so no spousal benefits.
    const r0 = makeRecipient(2000, 1962, 11, 15);
    const r1 = makeRecipient(1900, 1963, 11, 15);
    // Both file at NRA (67y0m)
    const strat0 = MonthDuration.initFromYearsMonths({
      years: 67,
      months: 0,
    });
    const strat1 = MonthDuration.initFromYearsMonths({
      years: 67,
      months: 0,
    });
    // Death dates
    const finalDate0 = r0.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 82, months: 0 })
    );
    const finalDate1 = r1.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 85, months: 0 })
    );

    return {
      recipients: [r0, r1] as [Recipient, Recipient],
      finalDates: [finalDate0, finalDate1] as [MonthDate, MonthDate],
      strats: [strat0, strat1] as [MonthDuration, MonthDuration],
    };
  }

  function computeExpectedCoupleNPV(
    recipients: [Recipient, Recipient],
    finalDates: [MonthDate, MonthDate],
    strats: [MonthDuration, MonthDuration],
    currentDate: MonthDate,
    annualRate: number
  ): number {
    const rm = monthlyRate(annualRate);
    const periods = strategySumPeriodsCouple(recipients, finalDates, strats);

    let expectedTotal = 0;
    for (const period of periods) {
      const params = computeKAndN(
        period.startDate,
        period.endDate,
        currentDate
      );
      if (params === null) continue;
      expectedTotal += annuityNPV(
        period.amount.cents(),
        params.N,
        params.k,
        rm
      );
    }

    return expectedTotal;
  }

  it('0% discount rate', () => {
    const { recipients, finalDates, strats } = setupCouple();
    const currentDate = MonthDate.initFromYearsMonths({
      years: 200,
      months: 0,
    });

    const expected = computeExpectedCoupleNPV(
      recipients,
      finalDates,
      strats,
      currentDate,
      0
    );
    const actual = strategySumCentsCouple(
      recipients,
      finalDates,
      currentDate,
      0,
      strats
    );
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  });

  it('3% discount rate', () => {
    const { recipients, finalDates, strats } = setupCouple();
    const filingDate0 = recipients[0].birthdate.dateAtSsaAge(strats[0]);
    const currentDate = filingDate0.subtractDuration(new MonthDuration(12));

    const expected = computeExpectedCoupleNPV(
      recipients,
      finalDates,
      strats,
      currentDate,
      0.03
    );
    const actual = strategySumCentsCouple(
      recipients,
      finalDates,
      currentDate,
      0.03,
      strats
    );
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  });

  it('7% discount rate', () => {
    const { recipients, finalDates, strats } = setupCouple();
    const filingDate0 = recipients[0].birthdate.dateAtSsaAge(strats[0]);
    const currentDate = filingDate0.subtractDuration(new MonthDuration(24));

    const expected = computeExpectedCoupleNPV(
      recipients,
      finalDates,
      strats,
      currentDate,
      0.07
    );
    const actual = strategySumCentsCouple(
      recipients,
      finalDates,
      currentDate,
      0.07,
      strats
    );
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 9. Present value of deferred annuity formula
// ---------------------------------------------------------------------------

describe('Present value of deferred annuity formula', () => {
  // Moving currentDate earlier by M months should multiply the NPV by
  // (1+r)^(-M), since all payments are M months further away.

  it('deferring currentDate by 12 months scales NPV by (1+r)^(-12)', () => {
    const setup = singlePeriodSetup(2000, 1960);
    const N = 60;
    const deathDate = setup.filingDate.addDuration(new MonthDuration(N - 1));
    const annualRate = 0.05;

    // currentDate at filing
    const currentDate1 = MonthDate.copyFrom(setup.filingDate);
    // currentDate 12 months before filing
    const currentDate2 = setup.filingDate.subtractDuration(
      new MonthDuration(12)
    );

    const npv1 = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate1,
      annualRate,
      setup.filingAge
    );
    const npv2 = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate2,
      annualRate,
      setup.filingAge
    );

    // npv2 should equal npv1 * (1+r_monthly)^(-12) because currentDate2 is
    // 12 months earlier, meaning all payments are 12 months further away.
    const rm = monthlyRate(annualRate);
    const scaleFactor = (1 + rm) ** -12;
    const expectedNpv2 = npv1 * scaleFactor;

    const relativeError = Math.abs(npv2 - expectedNpv2) / expectedNpv2;
    expect(relativeError).toBeLessThan(0.001);
  });

  it('deferring currentDate by 24 months scales NPV by (1+r)^(-24)', () => {
    const setup = singlePeriodSetup(1500, 1965);
    const N = 120;
    const deathDate = setup.filingDate.addDuration(new MonthDuration(N - 1));
    const annualRate = 0.08;

    const currentDate1 = MonthDate.copyFrom(setup.filingDate);
    const currentDate2 = setup.filingDate.subtractDuration(
      new MonthDuration(24)
    );

    const npv1 = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate1,
      annualRate,
      setup.filingAge
    );
    const npv2 = strategySumCentsSingle(
      setup.r,
      deathDate,
      currentDate2,
      annualRate,
      setup.filingAge
    );

    const rm = monthlyRate(annualRate);
    const scaleFactor = (1 + rm) ** -24;
    const expectedNpv2 = npv1 * scaleFactor;

    const relativeError = Math.abs(npv2 - expectedNpv2) / expectedNpv2;
    expect(relativeError).toBeLessThan(0.001);
  });
});
