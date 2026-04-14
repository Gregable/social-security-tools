import { describe, expect, it } from 'vitest';
import { benefitAtAge } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  optimalStrategySingle,
  strategySumCentsSingle,
  strategySumPeriodsSingle,
} from '$lib/strategy/calculations';

/**
 * Creates a Recipient with a given PIA and birthdate.
 * Uses setPia so we don't need earnings records.
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
 * A currentDate far in the past so that all filing ages are available.
 * This avoids "can't file retroactively" restrictions.
 */
const PAST_CURRENT_DATE = MonthDate.initFromYearsMonths({
  years: 200,
  months: 0,
});

/**
 * Converts an age (years, months) to a MonthDate representing the death date
 * for a given recipient, using the lay birthdate offset.
 */
function deathDateAtAge(
  recipient: Recipient,
  years: number,
  months: number = 0
): MonthDate {
  return recipient.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({ years, months })
  );
}

/**
 * Shorthand to build a MonthDuration from years and months.
 */
function age(years: number, months: number = 0): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

// ---------------------------------------------------------------------------
// 1. NPV increases with later death age (fixed filing age, 0% discount)
// ---------------------------------------------------------------------------
describe('NPV increases with later death age (fixed filing age, 0% discount)', () => {
  const deathAges = [70, 75, 80, 85, 90, 95, 100];
  const recipient = makeRecipient(1500, 1960, 5, 15);

  it('filing at 62y1m', () => {
    const strat = age(62, 1);
    let prevNpv = -Infinity;
    for (const da of deathAges) {
      const finalDate = deathDateAtAge(recipient, da);
      const npv = strategySumCentsSingle(
        recipient,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(npv).toBeGreaterThanOrEqual(prevNpv);
      prevNpv = npv;
    }
  });

  it('filing at 67y0m (NRA)', () => {
    const strat = age(67, 0);
    let prevNpv = -Infinity;
    for (const da of deathAges) {
      const finalDate = deathDateAtAge(recipient, da);
      const npv = strategySumCentsSingle(
        recipient,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(npv).toBeGreaterThanOrEqual(prevNpv);
      prevNpv = npv;
    }
  });

  it('filing at 70y0m', () => {
    const strat = age(70, 0);
    let prevNpv = -Infinity;
    for (const da of deathAges) {
      const finalDate = deathDateAtAge(recipient, da);
      const npv = strategySumCentsSingle(
        recipient,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(npv).toBeGreaterThanOrEqual(prevNpv);
      prevNpv = npv;
    }
  });

  it('filing at 65y0m (intermediate)', () => {
    const strat = age(65, 0);
    let prevNpv = -Infinity;
    for (const da of deathAges) {
      const finalDate = deathDateAtAge(recipient, da);
      const npv = strategySumCentsSingle(
        recipient,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(npv).toBeGreaterThanOrEqual(prevNpv);
      prevNpv = npv;
    }
  });
});

// ---------------------------------------------------------------------------
// 2. NPV is non-negative
// ---------------------------------------------------------------------------
describe('NPV is non-negative', () => {
  const recipient = makeRecipient(2000, 1962, 3, 10);

  it('for filing ages 62y1m through 70y0m, death ages from filing to 100 (PIA=$2000)', () => {
    for (let filingYear = 62; filingYear <= 70; filingYear++) {
      const filingMonths = filingYear === 62 ? 1 : 0;
      const strat = age(filingYear, filingMonths);
      for (let deathYear = filingYear + 1; deathYear <= 100; deathYear += 5) {
        const finalDate = deathDateAtAge(recipient, deathYear);
        const npv = strategySumCentsSingle(
          recipient,
          finalDate,
          PAST_CURRENT_DATE,
          0,
          strat
        );
        expect(npv).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('for filing ages 62y1m through 70y0m (PIA=$500, small benefit)', () => {
    const smallRecipient = makeRecipient(500, 1965, 0, 20);
    for (let filingYear = 62; filingYear <= 70; filingYear++) {
      const filingMonths = filingYear === 62 ? 1 : 0;
      const strat = age(filingYear, filingMonths);
      const finalDate = deathDateAtAge(smallRecipient, 85);
      const npv = strategySumCentsSingle(
        smallRecipient,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(npv).toBeGreaterThanOrEqual(0);
    }
  });

  it('for filing ages 62y1m through 70y0m with 5% discount rate (PIA=$1500)', () => {
    const r = makeRecipient(1500, 1963, 8, 5);
    for (let filingYear = 62; filingYear <= 70; filingYear++) {
      const filingMonths = filingYear === 62 ? 1 : 0;
      const strat = age(filingYear, filingMonths);
      const finalDate = deathDateAtAge(r, 90);
      const npv = strategySumCentsSingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        0.05,
        strat
      );
      expect(npv).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. NPV scales proportionally with PIA (at 0% discount)
// ---------------------------------------------------------------------------
describe('NPV scales proportionally with PIA (at 0% discount)', () => {
  it('PIA=$1000 vs PIA=$2000, filing at 67y0m, death at 85', () => {
    const r1 = makeRecipient(1000, 1960, 5, 15);
    const r2 = makeRecipient(2000, 1960, 5, 15);
    const strat = age(67, 0);
    const finalDate1 = deathDateAtAge(r1, 85);
    const finalDate2 = deathDateAtAge(r2, 85);

    const npv1 = strategySumCentsSingle(
      r1,
      finalDate1,
      PAST_CURRENT_DATE,
      0,
      strat
    );
    const npv2 = strategySumCentsSingle(
      r2,
      finalDate2,
      PAST_CURRENT_DATE,
      0,
      strat
    );

    const ratio = npv2 / npv1;
    expect(ratio).toBeGreaterThan(1.99);
    expect(ratio).toBeLessThan(2.01);
  });

  it('PIA=$500 vs PIA=$1500, filing at 62y1m, death at 90', () => {
    const r1 = makeRecipient(500, 1962, 1, 15);
    const r2 = makeRecipient(1500, 1962, 1, 15);
    const strat = age(62, 1);
    const finalDate1 = deathDateAtAge(r1, 90);
    const finalDate2 = deathDateAtAge(r2, 90);

    const npv1 = strategySumCentsSingle(
      r1,
      finalDate1,
      PAST_CURRENT_DATE,
      0,
      strat
    );
    const npv2 = strategySumCentsSingle(
      r2,
      finalDate2,
      PAST_CURRENT_DATE,
      0,
      strat
    );

    const ratio = npv2 / npv1;
    expect(ratio).toBeGreaterThan(2.99);
    expect(ratio).toBeLessThan(3.01);
  });

  it('PIA=$1000 vs PIA=$3000, filing at 70y0m, death at 80', () => {
    const r1 = makeRecipient(1000, 1964, 7, 15);
    const r2 = makeRecipient(3000, 1964, 7, 15);
    const strat = age(70, 0);
    const finalDate1 = deathDateAtAge(r1, 80);
    const finalDate2 = deathDateAtAge(r2, 80);

    const npv1 = strategySumCentsSingle(
      r1,
      finalDate1,
      PAST_CURRENT_DATE,
      0,
      strat
    );
    const npv2 = strategySumCentsSingle(
      r2,
      finalDate2,
      PAST_CURRENT_DATE,
      0,
      strat
    );

    const ratio = npv2 / npv1;
    expect(ratio).toBeGreaterThan(2.99);
    expect(ratio).toBeLessThan(3.01);
  });
});

// ---------------------------------------------------------------------------
// 4. benefitAtAge is monotonically non-decreasing with age
// ---------------------------------------------------------------------------
describe('benefitAtAge is monotonically non-decreasing with age', () => {
  it('PIA=$1000', () => {
    const r = makeRecipient(1000, 1960, 5, 15);
    let prevBenefit = 0;
    for (let m = 62 * 12; m <= 70 * 12; m++) {
      const a = new MonthDuration(m);
      const benefit = benefitAtAge(r, a).cents();
      expect(benefit).toBeGreaterThanOrEqual(prevBenefit);
      prevBenefit = benefit;
    }
  });

  it('PIA=$1500', () => {
    const r = makeRecipient(1500, 1963, 2, 20);
    let prevBenefit = 0;
    for (let m = 62 * 12; m <= 70 * 12; m++) {
      const a = new MonthDuration(m);
      const benefit = benefitAtAge(r, a).cents();
      expect(benefit).toBeGreaterThanOrEqual(prevBenefit);
      prevBenefit = benefit;
    }
  });

  it('PIA=$2500', () => {
    const r = makeRecipient(2500, 1965, 10, 5);
    let prevBenefit = 0;
    for (let m = 62 * 12; m <= 70 * 12; m++) {
      const a = new MonthDuration(m);
      const benefit = benefitAtAge(r, a).cents();
      expect(benefit).toBeGreaterThanOrEqual(prevBenefit);
      prevBenefit = benefit;
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Optimal NPV >= NPV at any filing age
// ---------------------------------------------------------------------------
describe('Optimal NPV >= NPV at any filing age', () => {
  const recipient = makeRecipient(1800, 1960, 5, 15);

  it('death at 75', () => {
    const finalDate = deathDateAtAge(recipient, 75);
    const [, optimalNpv] = optimalStrategySingle(
      recipient,
      finalDate,
      PAST_CURRENT_DATE,
      0
    );
    for (let filingYear = 62; filingYear <= 70; filingYear++) {
      const filingMonths = filingYear === 62 ? 1 : 0;
      const strat = age(filingYear, filingMonths);
      const npv = strategySumCentsSingle(
        recipient,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(optimalNpv).toBeGreaterThanOrEqual(npv);
    }
  });

  it('death at 85', () => {
    const finalDate = deathDateAtAge(recipient, 85);
    const [, optimalNpv] = optimalStrategySingle(
      recipient,
      finalDate,
      PAST_CURRENT_DATE,
      0
    );
    for (let filingYear = 62; filingYear <= 70; filingYear++) {
      const filingMonths = filingYear === 62 ? 1 : 0;
      const strat = age(filingYear, filingMonths);
      const npv = strategySumCentsSingle(
        recipient,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(optimalNpv).toBeGreaterThanOrEqual(npv);
    }
  });

  it('death at 95', () => {
    const finalDate = deathDateAtAge(recipient, 95);
    const [, optimalNpv] = optimalStrategySingle(
      recipient,
      finalDate,
      PAST_CURRENT_DATE,
      0
    );
    for (let filingYear = 62; filingYear <= 70; filingYear++) {
      const filingMonths = filingYear === 62 ? 1 : 0;
      const strat = age(filingYear, filingMonths);
      const npv = strategySumCentsSingle(
        recipient,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(optimalNpv).toBeGreaterThanOrEqual(npv);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Filing later never decreases monthly benefit
// ---------------------------------------------------------------------------
describe('Filing later never decreases monthly benefit', () => {
  it('PIA=$1200, month by month from 62y0m to 70y0m', () => {
    const r = makeRecipient(1200, 1961, 6, 15);
    let prevBenefit = 0;
    for (let m = 62 * 12; m <= 70 * 12; m++) {
      const a = new MonthDuration(m);
      const benefit = benefitAtAge(r, a).cents();
      expect(benefit).toBeGreaterThanOrEqual(prevBenefit);
      prevBenefit = benefit;
    }
  });

  it('PIA=$3000, month by month from 62y0m to 70y0m', () => {
    const r = makeRecipient(3000, 1966, 11, 10);
    let prevBenefit = 0;
    for (let m = 62 * 12; m <= 70 * 12; m++) {
      const a = new MonthDuration(m);
      const benefit = benefitAtAge(r, a).cents();
      expect(benefit).toBeGreaterThanOrEqual(prevBenefit);
      prevBenefit = benefit;
    }
  });
});

// ---------------------------------------------------------------------------
// 7. NPV at death before filing is 0
// ---------------------------------------------------------------------------
describe('NPV at death before filing is 0', () => {
  it('file at 67y0m but die at 65', () => {
    const r = makeRecipient(2000, 1960, 5, 15);
    const finalDate = deathDateAtAge(r, 65);
    const strat = age(67, 0);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      0,
      strat
    );
    expect(npv).toBe(0);
  });

  it('file at 70y0m but die at 68', () => {
    const r = makeRecipient(1500, 1962, 3, 10);
    const finalDate = deathDateAtAge(r, 68);
    const strat = age(70, 0);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      0,
      strat
    );
    expect(npv).toBe(0);
  });

  it('file at 67y0m but die at 62 (well before NRA)', () => {
    const r = makeRecipient(1000, 1964, 0, 20);
    const finalDate = deathDateAtAge(r, 62);
    const strat = age(67, 0);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      0,
      strat
    );
    expect(npv).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Benefit periods cover expected date ranges
// ---------------------------------------------------------------------------
describe('Benefit periods cover expected date ranges', () => {
  it('filing at 62y1m, death at 85 - periods are within bounds', () => {
    const r = makeRecipient(1500, 1960, 5, 15);
    const strat = age(62, 1);
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    const finalDate = deathDateAtAge(r, 85);
    const periods = strategySumPeriodsSingle(r, finalDate, strat);

    expect(periods.length).toBeGreaterThan(0);
    for (const period of periods) {
      // startDate >= filingDate
      expect(period.startDate.greaterThanOrEqual(filingDate)).toBe(true);
      // endDate <= finalDate
      expect(period.endDate.lessThanOrEqual(finalDate)).toBe(true);
      // Amounts are positive
      expect(period.amount.cents()).toBeGreaterThan(0);
    }

    // No overlapping periods: each period's startDate is after the previous
    // period's endDate. Sort by startDate first.
    const sorted = [...periods].sort(
      (a, b) => a.startDate.monthsSinceEpoch() - b.startDate.monthsSinceEpoch()
    );
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startDate.greaterThan(sorted[i - 1].endDate)).toBe(true);
    }
  });

  it('filing at 67y0m (NRA), death at 90 - periods are within bounds', () => {
    const r = makeRecipient(2000, 1963, 2, 10);
    const strat = age(67, 0);
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    const finalDate = deathDateAtAge(r, 90);
    const periods = strategySumPeriodsSingle(r, finalDate, strat);

    expect(periods.length).toBeGreaterThan(0);
    for (const period of periods) {
      expect(period.startDate.greaterThanOrEqual(filingDate)).toBe(true);
      expect(period.endDate.lessThanOrEqual(finalDate)).toBe(true);
      expect(period.amount.cents()).toBeGreaterThan(0);
    }

    const sorted = [...periods].sort(
      (a, b) => a.startDate.monthsSinceEpoch() - b.startDate.monthsSinceEpoch()
    );
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startDate.greaterThan(sorted[i - 1].endDate)).toBe(true);
    }
  });

  it('filing at 70y0m, death at 95 - periods are within bounds', () => {
    const r = makeRecipient(1000, 1965, 10, 5);
    const strat = age(70, 0);
    const filingDate = r.birthdate.dateAtSsaAge(strat);
    const finalDate = deathDateAtAge(r, 95);
    const periods = strategySumPeriodsSingle(r, finalDate, strat);

    expect(periods.length).toBeGreaterThan(0);
    for (const period of periods) {
      expect(period.startDate.greaterThanOrEqual(filingDate)).toBe(true);
      expect(period.endDate.lessThanOrEqual(finalDate)).toBe(true);
      expect(period.amount.cents()).toBeGreaterThan(0);
    }

    const sorted = [...periods].sort(
      (a, b) => a.startDate.monthsSinceEpoch() - b.startDate.monthsSinceEpoch()
    );
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startDate.greaterThan(sorted[i - 1].endDate)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Discount rate reduces NPV
// ---------------------------------------------------------------------------
describe('Discount rate reduces NPV', () => {
  it('0% > 5% > 10% discount rate, filing at 67y0m, death at 85', () => {
    const r = makeRecipient(2000, 1960, 5, 15);
    const strat = age(67, 0);
    const finalDate = deathDateAtAge(r, 85);

    const npv0 = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      0,
      strat
    );
    const npv5 = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      0.05,
      strat
    );
    const npv10 = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      0.1,
      strat
    );

    expect(npv0).toBeGreaterThan(npv5);
    expect(npv5).toBeGreaterThan(npv10);
    // All should still be positive
    expect(npv10).toBeGreaterThan(0);
  });

  it('0% > 3% > 7% discount rate, filing at 62y1m, death at 90', () => {
    const r = makeRecipient(1500, 1963, 8, 5);
    const strat = age(62, 1);
    const finalDate = deathDateAtAge(r, 90);

    const npv0 = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      0,
      strat
    );
    const npv3 = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      0.03,
      strat
    );
    const npv7 = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      0.07,
      strat
    );

    expect(npv0).toBeGreaterThan(npv3);
    expect(npv3).toBeGreaterThan(npv7);
    expect(npv7).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 10. NPV continuity
// ---------------------------------------------------------------------------
describe('NPV continuity', () => {
  it('adjacent filing months differ by < 50% of the larger value (PIA=$1000)', () => {
    const r = makeRecipient(1000, 1960, 5, 15);
    const finalDate = deathDateAtAge(r, 85);

    const npvs: number[] = [];
    for (let m = 62 * 12 + 1; m <= 70 * 12; m++) {
      npvs.push(
        strategySumCentsSingle(
          r,
          finalDate,
          PAST_CURRENT_DATE,
          0,
          new MonthDuration(m)
        )
      );
    }

    for (let i = 1; i < npvs.length; i++) {
      const diff = Math.abs(npvs[i] - npvs[i - 1]);
      const larger = Math.max(npvs[i], npvs[i - 1]);
      expect(diff).toBeLessThan(larger * 0.5);
    }
  });

  it('adjacent filing months differ by < 50% of the larger value (PIA=$2000)', () => {
    const r = makeRecipient(2000, 1962, 3, 10);
    const finalDate = deathDateAtAge(r, 85);

    const npvs: number[] = [];
    for (let m = 62 * 12 + 1; m <= 70 * 12; m++) {
      npvs.push(
        strategySumCentsSingle(
          r,
          finalDate,
          PAST_CURRENT_DATE,
          0,
          new MonthDuration(m)
        )
      );
    }

    for (let i = 1; i < npvs.length; i++) {
      const diff = Math.abs(npvs[i] - npvs[i - 1]);
      const larger = Math.max(npvs[i], npvs[i - 1]);
      expect(diff).toBeLessThan(larger * 0.5);
    }
  });

  it('adjacent filing months differ by < 50% of the larger value (PIA=$500)', () => {
    const r = makeRecipient(500, 1965, 0, 20);
    const finalDate = deathDateAtAge(r, 85);

    const npvs: number[] = [];
    for (let m = 62 * 12 + 1; m <= 70 * 12; m++) {
      npvs.push(
        strategySumCentsSingle(
          r,
          finalDate,
          PAST_CURRENT_DATE,
          0,
          new MonthDuration(m)
        )
      );
    }

    for (let i = 1; i < npvs.length; i++) {
      const diff = Math.abs(npvs[i] - npvs[i - 1]);
      const larger = Math.max(npvs[i], npvs[i - 1]);
      expect(diff).toBeLessThan(larger * 0.5);
    }
  });
});

// ---------------------------------------------------------------------------
// 11. Optimal strategy stable under PIA perturbation
// ---------------------------------------------------------------------------
describe('Optimal strategy stable under PIA perturbation', () => {
  it('PIA=$999, $1000, $1001 yield optimal ages within 6 months at death 80', () => {
    const results = [999, 1000, 1001].map((pia) => {
      const r = makeRecipient(pia, 1960, 5, 15);
      const finalDate = deathDateAtAge(r, 80);
      const [optAge] = optimalStrategySingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        0
      );
      return optAge.asMonths();
    });
    expect(Math.abs(results[0] - results[1])).toBeLessThanOrEqual(6);
    expect(Math.abs(results[1] - results[2])).toBeLessThanOrEqual(6);
  });

  it('PIA=$999, $1000, $1001 yield optimal ages within 6 months at death 85', () => {
    const results = [999, 1000, 1001].map((pia) => {
      const r = makeRecipient(pia, 1960, 5, 15);
      const finalDate = deathDateAtAge(r, 85);
      const [optAge] = optimalStrategySingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        0
      );
      return optAge.asMonths();
    });
    expect(Math.abs(results[0] - results[1])).toBeLessThanOrEqual(6);
    expect(Math.abs(results[1] - results[2])).toBeLessThanOrEqual(6);
  });

  it('PIA=$999, $1000, $1001 yield optimal ages within 6 months at death 90', () => {
    const results = [999, 1000, 1001].map((pia) => {
      const r = makeRecipient(pia, 1960, 5, 15);
      const finalDate = deathDateAtAge(r, 90);
      const [optAge] = optimalStrategySingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        0
      );
      return optAge.asMonths();
    });
    expect(Math.abs(results[0] - results[1])).toBeLessThanOrEqual(6);
    expect(Math.abs(results[1] - results[2])).toBeLessThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// 12. NPV additivity over benefit periods
// ---------------------------------------------------------------------------
describe('NPV additivity over benefit periods', () => {
  const filingAges = [
    age(62, 1),
    age(63, 0),
    age(64, 0),
    age(65, 0),
    age(66, 0),
    age(67, 0),
    age(68, 0),
    age(69, 0),
    age(70, 0),
  ];

  it('manual period sum matches strategySumCentsSingle at 0% discount (PIA=$1500, death 85)', () => {
    const r = makeRecipient(1500, 1960, 5, 15);
    const finalDate = deathDateAtAge(r, 85);

    for (const strat of filingAges) {
      const periods = strategySumPeriodsSingle(r, finalDate, strat);
      const manualSum = periods.reduce((sum, period) => {
        const months =
          period.endDate.subtractDate(period.startDate).asMonths() + 1;
        return sum + period.amount.cents() * months;
      }, 0);

      const npv = strategySumCentsSingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );

      expect(manualSum).toBe(npv);
    }
  });

  it('manual period sum matches strategySumCentsSingle at 0% discount (PIA=$2000, death 90)', () => {
    const r = makeRecipient(2000, 1963, 2, 10);
    const finalDate = deathDateAtAge(r, 90);

    for (const strat of filingAges) {
      const periods = strategySumPeriodsSingle(r, finalDate, strat);
      const manualSum = periods.reduce((sum, period) => {
        const months =
          period.endDate.subtractDate(period.startDate).asMonths() + 1;
        return sum + period.amount.cents() * months;
      }, 0);

      const npv = strategySumCentsSingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );

      expect(manualSum).toBe(npv);
    }
  });

  it('manual period sum matches strategySumCentsSingle at 0% discount (PIA=$800, death 95)', () => {
    const r = makeRecipient(800, 1965, 10, 5);
    const finalDate = deathDateAtAge(r, 95);

    for (const strat of filingAges) {
      const periods = strategySumPeriodsSingle(r, finalDate, strat);
      const manualSum = periods.reduce((sum, period) => {
        const months =
          period.endDate.subtractDate(period.startDate).asMonths() + 1;
        return sum + period.amount.cents() * months;
      }, 0);

      const npv = strategySumCentsSingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );

      expect(manualSum).toBe(npv);
    }
  });
});

// ---------------------------------------------------------------------------
// 13. PIA-NPV monotonicity sweep
// ---------------------------------------------------------------------------
describe('PIA-NPV monotonicity sweep', () => {
  const pias = [100, 500, 1000, 2000, 4000];

  it('NPV increases monotonically with PIA, filing at 67y0m, death at 85', () => {
    const strat = age(67, 0);
    let prevNpv = -Infinity;
    for (const pia of pias) {
      const r = makeRecipient(pia, 1960, 5, 15);
      const finalDate = deathDateAtAge(r, 85);
      const npv = strategySumCentsSingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(npv).toBeGreaterThan(prevNpv);
      prevNpv = npv;
    }
  });

  it('NPV increases monotonically with PIA, filing at 62y1m, death at 90', () => {
    const strat = age(62, 1);
    let prevNpv = -Infinity;
    for (const pia of pias) {
      const r = makeRecipient(pia, 1962, 3, 10);
      const finalDate = deathDateAtAge(r, 90);
      const npv = strategySumCentsSingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(npv).toBeGreaterThan(prevNpv);
      prevNpv = npv;
    }
  });
});

// ---------------------------------------------------------------------------
// 14. Discount rate strictly decreasing
// ---------------------------------------------------------------------------
describe('Discount rate strictly decreasing', () => {
  const rates = [0, 0.01, 0.02, 0.03, 0.05, 0.07, 0.1];

  it('each NPV strictly less than previous at filing 67y0m, death 85', () => {
    const r = makeRecipient(1500, 1960, 5, 15);
    const strat = age(67, 0);
    const finalDate = deathDateAtAge(r, 85);

    let prevNpv = Infinity;
    for (const rate of rates) {
      const npv = strategySumCentsSingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        rate,
        strat
      );
      expect(npv).toBeLessThan(prevNpv);
      prevNpv = npv;
    }
  });

  it('each NPV strictly less than previous at filing 62y1m, death 90', () => {
    const r = makeRecipient(2000, 1963, 8, 5);
    const strat = age(62, 1);
    const finalDate = deathDateAtAge(r, 90);

    let prevNpv = Infinity;
    for (const rate of rates) {
      const npv = strategySumCentsSingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        rate,
        strat
      );
      expect(npv).toBeLessThan(prevNpv);
      prevNpv = npv;
    }
  });
});

// ---------------------------------------------------------------------------
// 15. Seeded fuzz test
// ---------------------------------------------------------------------------
describe('Seeded fuzz test', () => {
  function makeRng(initialSeed: number) {
    let seed = initialSeed;
    return function rand(): number {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  it('50 random scenarios all yield NPV >= 0 (seed=42)', () => {
    const rand = makeRng(42);
    for (let i = 0; i < 50; i++) {
      const pia = Math.floor(rand() * 3900) + 100; // 100-4000
      const birthYear = Math.floor(rand() * 21) + 1960; // 1960-1980
      const r = makeRecipient(pia, birthYear, 0, 15);

      // Filing age between 62y1m and 70y0m
      const filingMonths =
        62 * 12 + 1 + Math.floor(rand() * (70 * 12 - 62 * 12));
      const strat = new MonthDuration(filingMonths);

      // Death age: at least filing year + 1 up to 100
      const filingYears = Math.ceil(filingMonths / 12);
      const minDeathAge = filingYears + 1;
      const deathAge =
        minDeathAge + Math.floor(rand() * (100 - minDeathAge + 1));
      const finalDate = deathDateAtAge(r, deathAge);

      const npv = strategySumCentsSingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(npv).toBeGreaterThanOrEqual(0);
    }
  });

  it('50 random scenarios all yield NPV >= 0 (seed=12345)', () => {
    const rand = makeRng(12345);
    for (let i = 0; i < 50; i++) {
      const pia = Math.floor(rand() * 3900) + 100;
      const birthYear = Math.floor(rand() * 21) + 1960;
      const r = makeRecipient(pia, birthYear, 0, 15);

      const filingMonths =
        62 * 12 + 1 + Math.floor(rand() * (70 * 12 - 62 * 12));
      const strat = new MonthDuration(filingMonths);

      const filingYears = Math.ceil(filingMonths / 12);
      const minDeathAge = filingYears + 1;
      const deathAge =
        minDeathAge + Math.floor(rand() * (100 - minDeathAge + 1));
      const finalDate = deathDateAtAge(r, deathAge);

      const npv = strategySumCentsSingle(
        r,
        finalDate,
        PAST_CURRENT_DATE,
        0,
        strat
      );
      expect(npv).toBeGreaterThanOrEqual(0);
    }
  });
});
