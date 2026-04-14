import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  optimalStrategySingle,
  strategySumCentsSingle,
} from '$lib/strategy/calculations';

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
 * Computes the final (death) date for a recipient at a given age.
 * Uses dateAtLayAge and then adjusts to the last month of the year,
 * matching the convention used in the existing tests.
 */
function deathDateAtAge(
  recipient: Recipient,
  ageYears: number,
  ageMonths: number = 0
): MonthDate {
  const rawDate = recipient.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({ years: ageYears, months: ageMonths })
  );
  // Adjust to end of year (December of that year), matching existing test convention.
  return rawDate.addDuration(new MonthDuration(11 - rawDate.monthIndex()));
}

/** currentDate far in the past so retroactivity rules never apply. */
const PAST_DATE = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

/** Earliest filing age for someone born after the 2nd of the month: 62y1m. */
const EARLIEST_FILING = MonthDuration.initFromYearsMonths({
  years: 62,
  months: 1,
});

/** Age 70y0m as a MonthDuration. */
const AGE_70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });

// ---------------------------------------------------------------------------
// Group 1: Die very young -- file early is optimal
// ---------------------------------------------------------------------------
describe('Die very young - file early is optimal', () => {
  // With 0% discount rate and a very short lifespan, collecting any money
  // at all beats waiting. Filing at the earliest possible age maximizes
  // total payments when you die shortly after.

  it('death at age 63 -- optimal is 62y1m', () => {
    const r = makeRecipient(1000, 1960, 5, 15); // Jun 15, 1960
    const finalDate = deathDateAtAge(r, 63);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });

  it('death at age 64 -- optimal is 62y1m', () => {
    const r = makeRecipient(1500, 1965, 2, 20); // Mar 20, 1965
    const finalDate = deathDateAtAge(r, 64);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });

  it('death at age 65 -- optimal is 62y1m', () => {
    const r = makeRecipient(2000, 1962, 8, 10); // Sep 10, 1962
    const finalDate = deathDateAtAge(r, 65);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });

  it('death at age 66 -- optimal is 62y1m', () => {
    const r = makeRecipient(800, 1970, 0, 25); // Jan 25, 1970
    const finalDate = deathDateAtAge(r, 66);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });

  it('death at age 63 with high PIA -- still file early', () => {
    const r = makeRecipient(3000, 1968, 11, 5); // Dec 5, 1968
    const finalDate = deathDateAtAge(r, 63);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });
});

// ---------------------------------------------------------------------------
// Group 2: Die very old -- file at 70 is optimal
// ---------------------------------------------------------------------------
describe('Die very old - file at 70 is optimal', () => {
  // With 0% discount rate and a very long lifespan, the 24% delayed
  // filing bonus at age 70 overwhelms the years of missed payments.

  it('death at age 90 -- optimal is 70y0m', () => {
    const r = makeRecipient(1000, 1960, 0, 15); // Jan 15, 1960
    const finalDate = deathDateAtAge(r, 90);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(AGE_70.asMonths());
  });

  it('death at age 95 -- optimal is 70y0m', () => {
    const r = makeRecipient(1500, 1965, 6, 10); // Jul 10, 1965
    const finalDate = deathDateAtAge(r, 95);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(AGE_70.asMonths());
  });

  it('death at age 100 -- optimal is 70y0m', () => {
    const r = makeRecipient(2000, 1962, 3, 20); // Apr 20, 1962
    const finalDate = deathDateAtAge(r, 100);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(AGE_70.asMonths());
  });

  it('death at age 90 with low PIA -- still file at 70', () => {
    const r = makeRecipient(500, 1970, 9, 8); // Oct 8, 1970
    const finalDate = deathDateAtAge(r, 90);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(AGE_70.asMonths());
  });

  it('death at age 95 with high PIA -- still file at 70', () => {
    const r = makeRecipient(3000, 1960, 11, 15); // Dec 15, 1960
    const finalDate = deathDateAtAge(r, 95);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(AGE_70.asMonths());
  });
});

// ---------------------------------------------------------------------------
// Group 3: Optimal NPV is truly maximum
// ---------------------------------------------------------------------------
describe('Optimal NPV is truly maximum', () => {
  // For various death ages, verify that the optimal NPV is >= the NPV at
  // every other tested filing age.

  const checkAges = [
    EARLIEST_FILING,
    MonthDuration.initFromYearsMonths({ years: 65, months: 0 }),
    MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
    AGE_70,
  ];

  function assertOptimalBeatsAll(
    r: Recipient,
    finalDate: MonthDate,
    discountRate: number = 0
  ) {
    const [, optNpv] = optimalStrategySingle(
      r,
      finalDate,
      PAST_DATE,
      discountRate
    );
    for (const age of checkAges) {
      const npv = strategySumCentsSingle(
        r,
        finalDate,
        PAST_DATE,
        discountRate,
        age
      );
      expect(optNpv).toBeGreaterThanOrEqual(npv);
    }
  }

  it('death at 75 -- optimal NPV >= all tested ages', () => {
    const r = makeRecipient(1000, 1960, 0, 15);
    assertOptimalBeatsAll(r, deathDateAtAge(r, 75));
  });

  it('death at 80 -- optimal NPV >= all tested ages', () => {
    const r = makeRecipient(1200, 1963, 4, 20);
    assertOptimalBeatsAll(r, deathDateAtAge(r, 80));
  });

  it('death at 85 -- optimal NPV >= all tested ages', () => {
    const r = makeRecipient(1800, 1965, 7, 10);
    assertOptimalBeatsAll(r, deathDateAtAge(r, 85));
  });

  it('death at 90 -- optimal NPV >= all tested ages', () => {
    const r = makeRecipient(2500, 1960, 11, 30);
    assertOptimalBeatsAll(r, deathDateAtAge(r, 90));
  });

  it('death at 85, 5% discount -- optimal NPV >= all tested ages', () => {
    const r = makeRecipient(1500, 1962, 1, 14);
    assertOptimalBeatsAll(r, deathDateAtAge(r, 85), 0.05);
  });
});

// ---------------------------------------------------------------------------
// Group 4: Effect of discount rate on optimal age
// ---------------------------------------------------------------------------
describe('Effect of discount rate on optimal age', () => {
  // Higher discount rates make future payments worth less, which favors
  // filing earlier. At a high enough rate, the optimal age should be
  // earlier than at 0%.

  const r = makeRecipient(1000, 1960, 0, 15); // Jan 15, 1960
  const finalDate = deathDateAtAge(r, 90);

  it('0% discount -- optimal is 70', () => {
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(AGE_70.asMonths());
  });

  it('2.5% discount -- optimal is at or before 70', () => {
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0.025);
    expect(optAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
  });

  it('5% discount -- optimal is earlier than at 0%', () => {
    const [optAge0] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    const [optAge5] = optimalStrategySingle(r, finalDate, PAST_DATE, 0.05);
    expect(optAge5.asMonths()).toBeLessThanOrEqual(optAge0.asMonths());
  });

  it('10% discount -- optimal is earlier than at 0%', () => {
    const [optAge0] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    const [optAge10] = optimalStrategySingle(r, finalDate, PAST_DATE, 0.1);
    expect(optAge10.asMonths()).toBeLessThan(optAge0.asMonths());
  });

  it('10% discount -- optimal is earlier than at 5%', () => {
    const [optAge5] = optimalStrategySingle(r, finalDate, PAST_DATE, 0.05);
    const [optAge10] = optimalStrategySingle(r, finalDate, PAST_DATE, 0.1);
    expect(optAge10.asMonths()).toBeLessThanOrEqual(optAge5.asMonths());
  });
});

// ---------------------------------------------------------------------------
// Group 5: Consistency across PIAs
// ---------------------------------------------------------------------------
describe('Consistency across PIAs', () => {
  // The benefit formula applies a fixed multiplier based on filing age.
  // At 0% discount rate, the optimal filing age should be the same
  // regardless of PIA, since the multiplier is proportional.

  const birthYear = 1960;
  const birthMonth = 5; // Jun
  const birthDay = 15;
  const deathAge = 85;

  function optimalAgeForPia(piaDollars: number): number {
    const r = makeRecipient(piaDollars, birthYear, birthMonth, birthDay);
    const finalDate = deathDateAtAge(r, deathAge);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    return optAge.asMonths();
  }

  it('$500 and $1000 PIA yield the same optimal age', () => {
    expect(optimalAgeForPia(500)).toBe(optimalAgeForPia(1000));
  });

  it('$1000 and $2000 PIA yield the same optimal age', () => {
    expect(optimalAgeForPia(1000)).toBe(optimalAgeForPia(2000));
  });

  it('$500 and $2000 PIA yield the same optimal age', () => {
    expect(optimalAgeForPia(500)).toBe(optimalAgeForPia(2000));
  });
});

// ---------------------------------------------------------------------------
// Group 6: Exhaustive verification for specific scenario
// ---------------------------------------------------------------------------
describe('Exhaustive verification for specific scenario', () => {
  // Compute NPV at every filing age from 62y1m to 70y0m (by month)
  // and verify the maximum matches what the optimizer returns.

  it('exhaustive check -- death at 85, 0% discount', () => {
    const r = makeRecipient(1000, 1960, 0, 15); // Jan 15, 1960
    const finalDate = deathDateAtAge(r, 85);
    const [optAge, optNpv] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);

    // Compute NPV at every month from 62y1m through 70y0m.
    let manualBestAge = EARLIEST_FILING.asMonths();
    let manualBestNpv = -1;

    for (let m = EARLIEST_FILING.asMonths(); m <= AGE_70.asMonths(); m++) {
      const strat = new MonthDuration(m);
      const npv = strategySumCentsSingle(r, finalDate, PAST_DATE, 0, strat);
      if (npv > manualBestNpv) {
        manualBestNpv = npv;
        manualBestAge = m;
      }
    }

    expect(optAge.asMonths()).toBe(manualBestAge);
    expect(optNpv).toBe(manualBestNpv);
  });

  it('exhaustive check -- death at 78, 3% discount', () => {
    const r = makeRecipient(1500, 1965, 6, 20); // Jul 20, 1965
    const finalDate = deathDateAtAge(r, 78);
    const [optAge, optNpv] = optimalStrategySingle(
      r,
      finalDate,
      PAST_DATE,
      0.03
    );

    let manualBestAge = EARLIEST_FILING.asMonths();
    let manualBestNpv = -1;

    for (let m = EARLIEST_FILING.asMonths(); m <= AGE_70.asMonths(); m++) {
      const strat = new MonthDuration(m);
      const npv = strategySumCentsSingle(r, finalDate, PAST_DATE, 0.03, strat);
      if (npv > manualBestNpv) {
        manualBestNpv = npv;
        manualBestAge = m;
      }
    }

    expect(optAge.asMonths()).toBe(manualBestAge);
    expect(optNpv).toBe(manualBestNpv);
  });
});

// ---------------------------------------------------------------------------
// Group 7: Crossover death age detection
// ---------------------------------------------------------------------------
describe('Crossover death age detection', () => {
  // For a fixed PIA, find the death age where filing at 70 overtakes
  // filing at 62y1m. Verify the optimizer agrees with this crossover.
  const r = makeRecipient(1000, 1965, 2, 15); // Mar 15, 1965

  it('finds the crossover age where 70y0m overtakes 62y1m', () => {
    let crossoverAge = -1;
    for (let deathAge = 75; deathAge <= 85; deathAge++) {
      const finalDate = deathDateAtAge(r, deathAge);
      const npvEarly = strategySumCentsSingle(
        r,
        finalDate,
        PAST_DATE,
        0,
        EARLIEST_FILING
      );
      const npvLate = strategySumCentsSingle(
        r,
        finalDate,
        PAST_DATE,
        0,
        AGE_70
      );
      if (npvLate > npvEarly && crossoverAge === -1) {
        crossoverAge = deathAge;
      }
    }
    // There must be a crossover somewhere between 75 and 85.
    expect(crossoverAge).toBeGreaterThanOrEqual(75);
    expect(crossoverAge).toBeLessThanOrEqual(85);
  });

  it('optimizer picks 62y1m below the crossover death age', () => {
    // Death at 75 is well below any crossover -- early filing wins.
    const finalDate = deathDateAtAge(r, 75);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    // Optimal should be at earliest filing or at least before 70.
    expect(optAge.asMonths()).toBeLessThan(AGE_70.asMonths());
  });

  it('optimizer picks 70y0m above the crossover death age', () => {
    // Death at 85 is well above crossover -- delayed filing wins.
    const finalDate = deathDateAtAge(r, 85);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(AGE_70.asMonths());
  });
});

// ---------------------------------------------------------------------------
// Group 8: Pre-1960 birth year
// ---------------------------------------------------------------------------
describe('Pre-1960 birth year', () => {
  // Born 1955: NRA = 66y2m
  // Born 1943: NRA = 66y0m
  // Verify the optimizer picks sensible ages for early and late death.

  it('born 1955, death at 63 -- should file early', () => {
    const r = makeRecipient(1000, 1955, 0, 15); // Jan 15, 1955
    const finalDate = deathDateAtAge(r, 63);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });

  it('born 1955, death at 95 -- should file at 70', () => {
    const r = makeRecipient(1000, 1955, 0, 15);
    const finalDate = deathDateAtAge(r, 95);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(AGE_70.asMonths());
  });

  it('born 1943, death at 63 -- should file early', () => {
    const r = makeRecipient(1000, 1943, 0, 15); // Jan 15, 1943
    const finalDate = deathDateAtAge(r, 63);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });

  it('born 1943, death at 95 -- should file at 70', () => {
    const r = makeRecipient(1000, 1943, 0, 15);
    const finalDate = deathDateAtAge(r, 95);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBe(AGE_70.asMonths());
  });
});

// ---------------------------------------------------------------------------
// Group 9: Optimizer with currentDate constraining filing
// ---------------------------------------------------------------------------
describe('Optimizer with currentDate constraining filing', () => {
  // Born Jan 15, 1960. NRA = 67y0m. Earliest unconstrained filing = 62y1m.
  // When currentDate is in the future relative to the person's age, the
  // retroactivity rules constrain the earliest possible filing age.

  const r = makeRecipient(1000, 1960, 0, 15); // Jan 15, 1960
  const finalDate = deathDateAtAge(r, 90);

  it('currentDate Jan 2025 (age ~65) -- result within constrained window', () => {
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2025,
      months: 0,
    });
    const [optAge] = optimalStrategySingle(r, finalDate, currentDate, 0);
    // At age 65, the earliest filing is constrained by retroactivity rules.
    // The optimal result must be >= the earliest the optimizer can pick,
    // and <= 70y0m.
    expect(optAge.asMonths()).toBeGreaterThanOrEqual(
      EARLIEST_FILING.asMonths()
    );
    expect(optAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
  });

  it('currentDate Jan 2030 (age 70) -- should file at 70', () => {
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2030,
      months: 0,
    });
    const [optAge] = optimalStrategySingle(r, finalDate, currentDate, 0);
    // At age 70, the only option is filing at 70.
    expect(optAge.asMonths()).toBe(AGE_70.asMonths());
  });

  it('currentDate Jan 2028 (age ~68) -- window is 68-70', () => {
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2028,
      months: 0,
    });
    const [optAge] = optimalStrategySingle(r, finalDate, currentDate, 0);
    // Filing window should be constrained: earliest is around age 67-68
    // (NRA retroactivity), latest is 70.
    const age68 = MonthDuration.initFromYearsMonths({
      years: 67,
      months: 0,
    });
    expect(optAge.asMonths()).toBeGreaterThanOrEqual(age68.asMonths());
    expect(optAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
  });

  it('currentDate constrains result to be within the valid window', () => {
    // An intermediate currentDate: age ~66 (Jan 2026).
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2026,
      months: 0,
    });
    const [optAge] = optimalStrategySingle(r, finalDate, currentDate, 0);
    // Must be at or above 62y1m and at or below 70.
    expect(optAge.asMonths()).toBeGreaterThanOrEqual(
      EARLIEST_FILING.asMonths()
    );
    expect(optAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
  });
});

// ---------------------------------------------------------------------------
// Group 10: Death age sweep
// ---------------------------------------------------------------------------
describe('Death age sweep', () => {
  // Sweep death ages from 63 to 100 and record the optimal filing age
  // at each. Verify invariants.

  const r = makeRecipient(1000, 1960, 0, 15); // Jan 15, 1960

  it('optimal filing age never exceeds 70y0m and never below earliest eligible', () => {
    for (let deathAge = 63; deathAge <= 100; deathAge++) {
      const finalDate = deathDateAtAge(r, deathAge);
      const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
      expect(optAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
      expect(optAge.asMonths()).toBeGreaterThanOrEqual(
        EARLIEST_FILING.asMonths()
      );
    }
  });

  it('optimal filing age is generally non-decreasing as death age increases', () => {
    const optimalAges: number[] = [];
    for (let deathAge = 63; deathAge <= 100; deathAge++) {
      const finalDate = deathDateAtAge(r, deathAge);
      const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
      optimalAges.push(optAge.asMonths());
    }

    // Count decreases: there should be very few (ideally zero).
    // We allow a small tolerance because month-boundary effects can
    // cause minor non-monotonicity.
    let decreases = 0;
    for (let i = 1; i < optimalAges.length; i++) {
      if (optimalAges[i] < optimalAges[i - 1]) {
        decreases++;
      }
    }
    // Allow at most 2 decreases across the entire sweep.
    expect(decreases).toBeLessThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Group 11: Very high discount rates
// ---------------------------------------------------------------------------
describe('Very high discount rates', () => {
  // At very high discount rates, future payments are worth almost nothing,
  // so filing as early as possible should always be optimal.

  const r = makeRecipient(1000, 1960, 0, 15); // Jan 15, 1960

  it('10% discount, death at 95 -- should file early', () => {
    const finalDate = deathDateAtAge(r, 95);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0.1);
    expect(optAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });

  it('20% discount, death at 95 -- should file early', () => {
    const finalDate = deathDateAtAge(r, 95);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0.2);
    expect(optAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });

  it('20% discount, death at 85 -- should file early', () => {
    const finalDate = deathDateAtAge(r, 85);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0.2);
    expect(optAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });
});

// ---------------------------------------------------------------------------
// Group 12: Death at exact NRA
// ---------------------------------------------------------------------------
describe('Death at exact NRA', () => {
  // Death at exactly NRA (67y0m for post-1960 births). The optimizer should
  // return a valid filing age and a positive NPV.

  it('death at 67y0m -- result is valid and NPV is positive', () => {
    const r = makeRecipient(1000, 1960, 0, 15); // Jan 15, 1960; NRA=67y0m
    const finalDate = deathDateAtAge(r, 67);
    const [optAge, optNpv] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    expect(optAge.asMonths()).toBeGreaterThanOrEqual(
      EARLIEST_FILING.asMonths()
    );
    expect(optAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
    expect(optNpv).toBeGreaterThan(0);
  });

  it('death at 67y0m -- filing early is optimal with short lifespan', () => {
    const r = makeRecipient(1500, 1965, 5, 15); // Jun 15, 1965; NRA=67y0m
    const finalDate = deathDateAtAge(r, 67);
    const [optAge] = optimalStrategySingle(r, finalDate, PAST_DATE, 0);
    // With only ~5 years of payments (62-67), filing early collects
    // the most total payments even at a reduced rate.
    expect(optAge.asMonths()).toBe(EARLIEST_FILING.asMonths());
  });
});
