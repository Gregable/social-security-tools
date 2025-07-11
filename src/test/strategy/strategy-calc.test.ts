import { describe, expect, it } from 'vitest';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import { Birthdate } from '$lib/birthday';
import {
  optimalStrategy,
  strategySumCents,
  strategySumTotalPeriods,
} from '$lib/strategy/strategy-calc';

/**
 * Given PIA, birthdate, final age year, and strategy age year, returns the
 * strategy sum.
 *
 * @returns number
 */
function calculateStrategySum({
  pia1,
  pia2,
  birthdate1,
  birthdate2,
  finalAge1,
  finalAge2,
  strategy1Year,
  strategy2Year,
  currentDate = MonthDate.initFromYearsMonths({
    years: 200,
    months: 0,
  }),
  discountRate = 0,
}) {
  let recipient1 = new Recipient();
  recipient1.birthdate = birthdate1;
  recipient1.setPia(pia1);

  let recipient2 = new Recipient();
  recipient2.birthdate = birthdate2;
  recipient2.setPia(pia2);

  let finalDates: [MonthDate, MonthDate] = [
    recipient1.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: finalAge1, months: 0 })
    ),
    recipient2.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: finalAge2, months: 0 })
    ),
  ];

  // Adjust the final dates to be the last month of the year
  for (let i = 0; i < 2; ++i) {
    finalDates[i] = finalDates[i].addDuration(
      new MonthDuration(11 - finalDates[i].monthIndex())
    );
  }

  let strategies: [MonthDuration, MonthDuration] = [
    MonthDuration.initFromYearsMonths({ years: strategy1Year, months: 0 }),
    MonthDuration.initFromYearsMonths({ years: strategy2Year, months: 0 }),
  ];

  if (strategy1Year === 62) {
    strategies[0] = strategies[0].add(new MonthDuration(1));
  }
  if (strategy2Year == 62) {
    strategies[1] = strategies[1].add(new MonthDuration(1));
  }

  return strategySumTotalPeriods(
    [recipient1, recipient2],
    finalDates,
    currentDate,
    discountRate,
    strategies
  ).value();
}

describe('strategySumCents', () => {
  // Random Tests:
  const testCases = [
    {
      pia1: Money.from(1000),
      pia2: Money.from(1000),
      birthdate1: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      birthdate2: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      finalAge1: 85,
      finalAge2: 85,
      strategy1Year: 70,
      strategy2Year: 70,
      expectedTotalBenefit: 476160,
    },
    {
      pia1: Money.from(1500),
      pia2: Money.from(1200),
      birthdate1: Birthdate.FromYMD(1962, 5, 10), // June 10, 1962
      birthdate2: Birthdate.FromYMD(1963, 8, 20), // Sep 20, 1963
      finalAge1: 90,
      finalAge2: 88,
      strategy1Year: 67,
      strategy2Year: 65,
      expectedTotalBenefit: 715700,
    },
    {
      pia1: Money.from(2000),
      pia2: Money.from(0),
      birthdate1: Birthdate.FromYMD(1958, 11, 1), // Dec 1, 1958
      birthdate2: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      finalAge1: 95,
      finalAge2: 95,
      strategy1Year: 69,
      strategy2Year: 68,
      expectedTotalBenefit: 1113808,
    },
    {
      pia1: Money.from(800),
      pia2: Money.from(1800),
      birthdate1: Birthdate.FromYMD(1965, 2, 25), // Mar 25, 1965
      birthdate2: Birthdate.FromYMD(1961, 7, 5), // Aug 5, 1961
      finalAge1: 80,
      finalAge2: 92,
      strategy1Year: 63,
      strategy2Year: 70,
      expectedTotalBenefit: 745338,
    },
    {
      pia1: Money.from(2500),
      pia2: Money.from(2500),
      birthdate1: Birthdate.FromYMD(1959, 6, 30), // July 30, 1959
      birthdate2: Birthdate.FromYMD(1959, 6, 30), // July 30, 1959
      finalAge1: 87,
      finalAge2: 87,
      strategy1Year: 68,
      strategy2Year: 68,
      expectedTotalBenefit: 1277844,
    },
    {
      pia1: Money.from(1200),
      pia2: Money.from(1500),
      birthdate1: Birthdate.FromYMD(1964, 9, 12), // Oct 12, 1964
      birthdate2: Birthdate.FromYMD(1964, 9, 12), // Oct 12, 1964
      finalAge1: 89,
      finalAge2: 89,
      strategy1Year: 66,
      strategy2Year: 69,
      expectedTotalBenefit: 735030,
    },
    {
      pia1: Money.from(1800),
      pia2: Money.from(800),
      birthdate1: Birthdate.FromYMD(1961, 7, 5), // Aug 5, 1961
      birthdate2: Birthdate.FromYMD(1965, 2, 25), // Mar 25, 1965
      finalAge1: 92,
      finalAge2: 80,
      strategy1Year: 70,
      strategy2Year: 63,
      expectedTotalBenefit: 745338,
    },
    {
      pia1: Money.from(0),
      pia2: Money.from(2000),
      birthdate1: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      birthdate2: Birthdate.FromYMD(1958, 11, 1), // Dec 1, 1958
      finalAge1: 95,
      finalAge2: 95,
      strategy1Year: 63,
      strategy2Year: 70,
      expectedTotalBenefit: 1127758,
    },
    {
      pia1: Money.from(1000),
      pia2: Money.from(1000),
      birthdate1: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      birthdate2: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      finalAge1: 80,
      finalAge2: 80,
      strategy1Year: 65,
      strategy2Year: 65,
      expectedTotalBenefit: 332544,
    },
    {
      pia1: Money.from(1000),
      pia2: Money.from(1000),
      birthdate1: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      birthdate2: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      finalAge1: 90,
      finalAge2: 90,
      strategy1Year: 70,
      strategy2Year: 70,
      expectedTotalBenefit: 624960,
    },
    {
      pia1: Money.from(1000),
      pia2: Money.from(0),
      birthdate1: Birthdate.FromYMD(1970, 3, 15), // Apr 15, 1970
      birthdate2: Birthdate.FromYMD(1970, 3, 15), // Apr 15, 1970
      finalAge1: 70,
      finalAge2: 71,
      strategy1Year: 62,
      strategy2Year: 62,
      expectedTotalBenefit: 117124,
    },
  ];

  it.each(testCases)(
    'calculates correct values for strategySumCents for %j',
    (testcase) => {
      expect(calculateStrategySum(testcase)).toBe(
        testcase['expectedTotalBenefit']
      );
    }
  );

  it('works with zero pia', () => {
    const result1 = calculateStrategySum({
      pia1: Money.from(0),
      pia2: Money.from(0),
      birthdate1: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      birthdate2: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      finalAge1: 90,
      finalAge2: 90,
      strategy1Year: 70,
      strategy2Year: 70,
    });
    expect(result1).toBe(0);
  });

  it('either recipient can be the primary earner', () => {
    const result2 = calculateStrategySum({
      pia1: Money.from(1000),
      pia2: Money.from(0),
      birthdate1: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      birthdate2: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      finalAge1: 90,
      finalAge2: 90,
      strategy1Year: 70,
      strategy2Year: 70,
    });
    expect(result2).toBe(438480);

    const result3 = calculateStrategySum({
      pia1: Money.from(0),
      pia2: Money.from(1000),
      birthdate1: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      birthdate2: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      finalAge1: 90,
      finalAge2: 90,
      strategy1Year: 70,
      strategy2Year: 70,
    });
    expect(result3).toBe(438480);
  });

  // This test is a duplicate of the earlier "works with zero pia" test.
  // Keeping it for now, but it could be removed.
  it('works with zero pia (duplicate)', () => {
    const result = calculateStrategySum({
      pia1: Money.from(0),
      pia2: Money.from(0),
      birthdate1: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      birthdate2: Birthdate.FromYMD(1960, 0, 15), // Jan 15, 1960
      finalAge1: 90,
      finalAge2: 90,
      strategy1Year: 70,
      strategy2Year: 70,
    });
    expect(result).toBe(0);
  });

  it('works with Dec birthdate', () => {
    const result = calculateStrategySum({
      pia1: Money.from(1000),
      pia2: Money.from(500),
      birthdate1: Birthdate.FromYMD(1960, 11, 15), // Dec 15, 1960
      birthdate2: Birthdate.FromYMD(1960, 11, 15), // Dec 15, 1960
      finalAge1: 90,
      finalAge2: 90,
      strategy1Year: 70,
      strategy2Year: 70,
    });
    expect(result).toBe(448260);
  });

  it('works with only 1 month survival', () => {
    // In this case, both recipients start in Dec 2030, when they turn 70.
    // They also die in Dec 20230, so they only collect benefits for a month.
    // Delayed filing of 3 years @ 8% per year is 24% increase in benefits.
    // $1,000 x 1.24 = $1,240. $1,240 x 2 recipients is $2,480.
    const result = calculateStrategySum({
      pia1: Money.from(1000),
      pia2: Money.from(1000),
      birthdate1: Birthdate.FromYMD(1960, 11, 15), // Dec 15, 1960
      birthdate2: Birthdate.FromYMD(1960, 11, 15), // Dec 15, 1960
      finalAge1: 70,
      finalAge2: 70,
      strategy1Year: 70,
      strategy2Year: 70,
    });
    expect(result).toBe(2480);
  });

  it('works with only 2 months survival', () => {
    // This is identical to "works with only 1 month survival", except that the
    // recipients are born in Nov. They still die in Dec 2030, therefore they
    // collect 2 months, so the benefit is doubled.
    const result = calculateStrategySum({
      pia1: Money.from(1000),
      pia2: Money.from(1000),
      birthdate1: Birthdate.FromYMD(1960, 10, 15), // Nov 15, 1960
      birthdate2: Birthdate.FromYMD(1960, 10, 15), // Nov 15, 1960
      finalAge1: 70,
      finalAge2: 70,
      strategy1Year: 70,
      strategy2Year: 70,
    });
    expect(result).toBe(2480 * 2);
  });

  it('Survivor benefits applied for one year', () => {
    // In this case, the first recipient collects only 1 month of benefits in
    // Dec 2030. This is $1,240. The second recipient also collects 1 month of
    // spousal benefits for that month: $500.
    // The second recipient then collects 12 additional months of survivor
    // benefits.
    const result = calculateStrategySum({
      pia1: Money.from(1000),
      pia2: Money.from(0),
      birthdate1: Birthdate.FromYMD(1960, 11, 15), // Dec 15, 1960
      birthdate2: Birthdate.FromYMD(1960, 11, 15), // Dec 15, 1960
      finalAge1: 70,
      finalAge2: 71,
      strategy1Year: 70,
      strategy2Year: 69,
    });
    expect(result).toBe(1240 * 13 + 500);
  });
});

function calculateOptimalStrategy({
  pia1,
  pia2,
  birthdate1,
  birthdate2,
  finalAge1,
  finalAge2,
  currentDate,
  discountRate,
}) {
  let recipient1 = new Recipient();
  recipient1.birthdate = birthdate1;
  recipient1.setPia(pia1);

  let recipient2 = new Recipient();
  recipient2.birthdate = birthdate2;
  recipient2.setPia(pia2);

  let finalDates: [MonthDate, MonthDate] = [
    recipient1.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: finalAge1, months: 0 })
    ),
    recipient2.birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: finalAge2, months: 0 })
    ),
  ];

  // Adjust the final dates to be the last month of the year
  for (let i = 0; i < 2; ++i) {
    finalDates[i] = finalDates[i].addDuration(
      new MonthDuration(11 - finalDates[i].monthIndex())
    );
  }

  return optimalStrategy(
    [recipient1, recipient2],
    finalDates,
    currentDate,
    discountRate
  );
}

describe('optimalStrategy', () => {
  it('Survivor benefits applied for one year', () => {
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2032,
      months: 0,
    }); // January 2032
    const strategy = calculateOptimalStrategy({
      pia1: Money.from(1000),
      pia2: Money.from(0),
      birthdate1: Birthdate.FromYMD(1970, 3, 15), // Apr 15, 1970
      birthdate2: Birthdate.FromYMD(1970, 3, 15), // Apr 15, 1970
      finalAge1: 70,
      finalAge2: 71,
      currentDate: currentDate,
      discountRate: 0,
    });
    expect(strategy[0].asMonths()).toEqual(62 * 12 + 1);
    expect(strategy[1].asMonths()).toEqual(62 * 12 + 1);
    expect(strategy[2] / 100).toEqual(117124);
  });
});
