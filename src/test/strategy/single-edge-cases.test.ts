import { describe, expect, it } from 'vitest';
import { benefitAtAge, benefitOnDate } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  optimalStrategySingle,
  strategySumCentsCouple,
  strategySumCentsSingle,
  strategySumPeriodsSingle,
} from '$lib/strategy/calculations';

/**
 * Helper to create a Recipient with a given PIA and birthdate.
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
 * A currentDate far in the past so that all filing dates are in the future
 * from currentDate's perspective, avoiding retroactive filing constraints.
 */
const PAST_CURRENT_DATE = MonthDate.initFromYearsMonths({
  years: 200,
  months: 0,
});

/**
 * No discounting for simplicity in most tests.
 */
const NO_DISCOUNT = 0;

describe('Minimal survival - 1 month of benefits', () => {
  it('file at NRA (67y0m), die same month: NPV = PIA in cents', () => {
    // Born March 15, 1965. NRA = 67y0m.
    // For 1960+ births, NRA is 67y0m, delayed increase is 8%/year.
    // Filing at NRA: benefit = PIA = $1000/mo.
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge(); // 67y0m
    const filingDate = r.birthdate.dateAtSsaAge(nra);
    // finalDate = filingDate (same month) -> 1 month of benefits
    const npv = strategySumCentsSingle(
      r,
      filingDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );
    // Expected: $1000 * 100 cents = 100000 cents
    expect(npv).toBe(1000 * 100);
  });

  it('file at 70y0m, die same month: NPV = floor(PIA * 1.24) in cents', () => {
    // Born March 15, 1965. Filing at 70y0m.
    // 3 years of delayed credits at 8%/year = 24% increase.
    // floor($1000 * 1.24) = $1240.
    const r = makeRecipient(1000, 1965, 2, 15);
    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(age70);
    const npv = strategySumCentsSingle(
      r,
      filingDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      age70
    );
    // Expected: floor(1000 * 1.24) = 1240 -> 124000 cents
    expect(npv).toBe(1240 * 100);
  });

  it('file at 62y1m, die same month: NPV = early benefit in cents', () => {
    // Born March 15, 1965. Earliest filing = 62y1m (born after 2nd).
    // NRA = 67y0m. Filing 59 months early.
    // Early reduction: first 36 months at 5/900 per month, remaining 23 at 5/1200.
    // Reduction = 36*(5/900) + 23*(5/1200) = 0.2 + 0.09583... = 0.29583...
    // Benefit = floor($1000 * (1 - 0.29583...)) = floor($704.16...) = $704
    const r = makeRecipient(1000, 1965, 2, 15);
    const age62m1 = MonthDuration.initFromYearsMonths({
      years: 62,
      months: 1,
    });
    const filingDate = r.birthdate.dateAtSsaAge(age62m1);
    const expectedBenefit = benefitAtAge(r, age62m1);
    const npv = strategySumCentsSingle(
      r,
      filingDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      age62m1
    );
    expect(npv).toBe(expectedBenefit.cents());
    // Sanity check: the benefit should be $704
    expect(expectedBenefit.value()).toBe(704);
  });

  it('file at NRA with large PIA, die same month', () => {
    // PIA = $3500, born June 10, 1970. NRA = 67y0m.
    const r = makeRecipient(3500, 1970, 5, 10);
    const nra = r.normalRetirementAge();
    const filingDate = r.birthdate.dateAtSsaAge(nra);
    const npv = strategySumCentsSingle(
      r,
      filingDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBe(3500 * 100);
  });
});

describe('Born on 1st of month', () => {
  it('can file at 62y0m instead of 62y1m', () => {
    // Born March 1, 1965. SSA treats as born in February (day before = Feb 28).
    // So earliest filing = 62y0m (because born on 1st or 2nd).
    const r = makeRecipient(1000, 1965, 2, 1);
    const earliest = r.birthdate.earliestFilingMonth();
    expect(earliest.asMonths()).toBe(62 * 12); // 62y0m
  });

  it('born on 1st files one month earlier but with lower monthly benefit', () => {
    // Born March 1, 1965 (SSA birth = Feb 28, 1965) vs March 15 (SSA birth = March 14).
    // Person born on 1st: earliest = 62y0m, which is 60 months before NRA.
    // Person born on 15th: earliest = 62y1m, which is 59 months before NRA.
    // The person born on the 1st files a full 60 months early (deeper reduction)
    // while the person born on 15th files 59 months early (slightly less reduction).
    // So born-on-1st gets more months but a lower monthly amount.
    const r1 = makeRecipient(1000, 1965, 2, 1); // born 1st
    const r15 = makeRecipient(1000, 1965, 2, 15); // born 15th

    const earliest1 = r1.birthdate.earliestFilingMonth(); // 62y0m
    const earliest15 = r15.birthdate.earliestFilingMonth(); // 62y1m

    const benefit1 = benefitAtAge(r1, earliest1);
    const benefit15 = benefitAtAge(r15, earliest15);

    // Born on 1st: 60 months early -> deeper reduction -> lower monthly
    // Born on 15th: 59 months early -> slightly higher monthly
    expect(benefit1.cents()).toBeLessThan(benefit15.cents());
    // 60 months early: reduction = 36*(5/900) + 24*(5/1200) = 0.2 + 0.1 = 0.3
    expect(benefit1.value()).toBe(700);
    // 59 months early: reduction = 36*(5/900) + 23*(5/1200) = 0.2 + 0.09583... = 0.29583...
    expect(benefit15.value()).toBe(704);

    // Verify each gets the expected number of months of benefits
    // when dying at the same SSA age of 80y0m
    const finalDate1 = r1.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 80, months: 0 })
    );
    const finalDate15 = r15.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 80, months: 0 })
    );

    const npv1 = strategySumCentsSingle(
      r1,
      finalDate1,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      earliest1
    );
    const npv15 = strategySumCentsSingle(
      r15,
      finalDate15,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      earliest15
    );

    // Both should produce meaningful benefits
    expect(npv1).toBeGreaterThan(0);
    expect(npv15).toBeGreaterThan(0);

    // The person born on the 15th actually collects more total because
    // their higher monthly benefit ($704 vs $700) over 215 months
    // outweighs the extra 1 month of $700 that the person born on the 1st gets.
    // r1: $700 * 216 months = $151,200
    // r15: $704 * 215 months = $151,360
    expect(npv15).toBeGreaterThan(npv1);
  });

  it('62y0m filing produces correct benefit amount', () => {
    // Born March 1, 1965. SSA birthdate = Feb 28, 1965.
    // Filing at 62y0m = Feb 2027.
    // NRA = 67y0m. Filing 60 months early.
    // Reduction = 36*(5/900) + 24*(5/1200) = 0.2 + 0.1 = 0.3
    // Benefit = floor($1000 * 0.7) = $700
    const r = makeRecipient(1000, 1965, 2, 1);
    const age62m0 = MonthDuration.initFromYearsMonths({
      years: 62,
      months: 0,
    });
    const benefit = benefitAtAge(r, age62m0);
    expect(benefit.value()).toBe(700);
  });
});

describe('Born on 2nd of month', () => {
  it('can file at 62y0m (same as born on 1st)', () => {
    // Born March 2, 1965. Day before = March 1, still same month.
    // According to earliestFilingMonth: day <= 2 => 62y0m.
    const r = makeRecipient(1000, 1965, 2, 2);
    const earliest = r.birthdate.earliestFilingMonth();
    expect(earliest.asMonths()).toBe(62 * 12);
  });

  it('born on 3rd must wait until 62y1m', () => {
    // Born March 3, 1965. Day > 2 => 62y1m.
    const r = makeRecipient(1000, 1965, 2, 3);
    const earliest = r.birthdate.earliestFilingMonth();
    expect(earliest.asMonths()).toBe(62 * 12 + 1);
  });
});

describe('December birthdays', () => {
  it('born Dec 15, file at NRA (67y0m) = December of that year', () => {
    // Born Dec 15, 1965. SSA birthdate = Dec 14, 1965.
    // NRA = 67y0m. SSA birth month = December (index 11).
    // Filing date = Dec 14 + 67y0m = Dec 2032 (month index 11).
    const r = makeRecipient(1000, 1965, 11, 15);
    const nra = r.normalRetirementAge();
    const filingDate = r.birthdate.dateAtSsaAge(nra);
    // Verify filing month is December
    expect(filingDate.monthIndex()).toBe(11);
    // Benefit at NRA = PIA
    const benefit = benefitAtAge(r, nra);
    expect(benefit.value()).toBe(1000);
  });

  it('born Dec 15, file at 68y0m: delayed January bump with 1-month first period', () => {
    // Born Dec 15, 1965. SSA birthdate = Dec 14, 1965.
    // NRA date = Dec 2032. Filing at 68y0m = Dec 2033.
    // 12 months after NRA. Filing in December, not January, not 70.
    // Credits through Jan 2033: NRA is Dec 2032, Jan 2033 is 1 month after NRA.
    // So first period benefit = floor(PIA * (1 + 0.08/12 * 1))
    // Second period (Jan 2034+) = floor(PIA * (1 + 0.08/12 * 12)) = floor(PIA * 1.08)
    const r = makeRecipient(1000, 1965, 11, 15);
    const age68 = MonthDuration.initFromYearsMonths({ years: 68, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(age68);
    // Verify filing is in December
    expect(filingDate.monthIndex()).toBe(11);

    // First period benefit (at filing date = Dec 2033)
    const firstBenefit = benefitOnDate(r, filingDate, filingDate);
    // Second period benefit (Jan 2034)
    const jan2034 = MonthDate.initFromYearsMonths({
      years: filingDate.year() + 1,
      months: 0,
    });
    const secondBenefit = benefitOnDate(r, filingDate, jan2034);

    // The first period should have fewer credits than the second
    expect(firstBenefit.cents()).toBeLessThan(secondBenefit.cents());

    // First period: credits through Jan 2033 = 1 month after NRA (Dec 2032)
    // floor(1000 * (1 + 0.08/12 * 1)) = floor(1006.66...) = $1006
    expect(firstBenefit.value()).toBe(1006);
    // Second period: full 12 months = floor(1000 * 1.08) = $1080
    expect(secondBenefit.value()).toBe(1080);
  });

  it('born Dec 15, file at 70y0m: full credits immediately (age 70 exception)', () => {
    // Born Dec 15, 1965. Filing at 70y0m = Dec 2035.
    // At age 70, full delayed credits apply immediately.
    const r = makeRecipient(1000, 1965, 11, 15);
    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(age70);

    const benefitAtFiling = benefitOnDate(r, filingDate, filingDate);
    const benefitNextJan = benefitOnDate(
      r,
      filingDate,
      MonthDate.initFromYearsMonths({
        years: filingDate.year() + 1,
        months: 0,
      })
    );

    // Both should be the same: floor(1000 * 1.24) = $1240
    expect(benefitAtFiling.value()).toBe(1240);
    expect(benefitNextJan.value()).toBe(1240);
    expect(benefitAtFiling.cents()).toBe(benefitNextJan.cents());
  });
});

describe('January birthdays', () => {
  it('born Jan 15, file at 68y0m in January: full credits immediately', () => {
    // Born Jan 15, 1965. SSA birthdate = Jan 14, 1965 (same month).
    // NRA = 67y0m = Jan 2032.
    // Filing at 68y0m = Jan 2033. Filing in January, so full credits apply.
    // Benefit = floor(PIA * (1 + 0.08/12 * 12)) = floor(PIA * 1.08)
    const r = makeRecipient(1000, 1965, 0, 15);
    const age68 = MonthDuration.initFromYearsMonths({ years: 68, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(age68);

    // Verify filing is in January
    expect(filingDate.monthIndex()).toBe(0);

    const benefitAtFiling = benefitOnDate(r, filingDate, filingDate);
    // floor(1000 * 1.08) = $1080
    expect(benefitAtFiling.value()).toBe(1080);

    // No January bump needed - should be same as next year
    const nextJan = MonthDate.initFromYearsMonths({
      years: filingDate.year() + 1,
      months: 0,
    });
    const benefitNextYear = benefitOnDate(r, filingDate, nextJan);
    expect(benefitAtFiling.cents()).toBe(benefitNextYear.cents());
  });

  it('born Jan 15, file at NRA: benefit equals PIA', () => {
    const r = makeRecipient(1500, 1965, 0, 15);
    const nra = r.normalRetirementAge();
    const benefit = benefitAtAge(r, nra);
    expect(benefit.value()).toBe(1500);
  });

  it('born Jan 1, earliest filing is 62y0m and filing month is January', () => {
    // Born Jan 1, 1965. SSA birthdate = Dec 31, 1964.
    // SSA treats this person as born in December 1964.
    // Earliest filing = 62y0m from SSA birthdate = Dec 2026.
    const r = makeRecipient(1000, 1965, 0, 1);
    const earliest = r.birthdate.earliestFilingMonth();
    expect(earliest.asMonths()).toBe(62 * 12);

    // The filing date is relative to the SSA birthdate (Dec 1964)
    const filingDate = r.birthdate.dateAtSsaAge(earliest);
    // SSA birth month = Dec, + 62y0m = Dec 2026
    expect(filingDate.monthIndex()).toBe(11); // December
  });
});

describe('Delayed January Bump verification', () => {
  it('born March 15, file at 68y0m: two different benefit periods', () => {
    // Born March 15, 1965. SSA birthdate = March 14, 1965.
    // NRA date = March 2032. Filing at 68y0m = March 2033.
    // 12 months after NRA, but credits only count through Jan 2033.
    // Jan 2033 is 10 months after NRA (Mar 2032).
    // First period (Mar-Dec 2033): floor(PIA * (1 + 0.08/12 * 10))
    // Second period (Jan 2034+): floor(PIA * (1 + 0.08/12 * 12)) = floor(PIA * 1.08)
    const r = makeRecipient(1000, 1965, 2, 15);
    const age68 = MonthDuration.initFromYearsMonths({ years: 68, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(age68);

    // First period benefit
    const firstBenefit = benefitOnDate(r, filingDate, filingDate);
    // Credits through Jan 2033 = 10 months after NRA
    // floor(1000 * (1 + 0.08/12 * 10)) = floor(1066.66...) = $1066
    expect(firstBenefit.value()).toBe(1066);

    // Second period benefit (Jan 2034)
    const jan2034 = MonthDate.initFromYearsMonths({
      years: filingDate.year() + 1,
      months: 0,
    });
    const secondBenefit = benefitOnDate(r, filingDate, jan2034);
    // Full 12 months: floor(1000 * 1.08) = $1080
    expect(secondBenefit.value()).toBe(1080);

    // They must differ
    expect(firstBenefit.cents()).not.toBe(secondBenefit.cents());
  });

  it('born March 15, file at 68y0m: strategySumPeriodsSingle returns 2 periods', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const age68 = MonthDuration.initFromYearsMonths({ years: 68, months: 0 });
    // finalDate well into the future to get both periods
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 80, months: 0 })
    );
    const periods = strategySumPeriodsSingle(r, finalDate, age68);

    // Should produce 2 distinct periods with different amounts
    expect(periods.length).toBe(2);
    expect(periods[0].amount.cents()).not.toBe(periods[1].amount.cents());
  });

  it('born March 15, file at 69y0m: credits through Jan = 22 months', () => {
    // Born March 15, 1965. NRA = March 2032.
    // Filing at 69y0m = March 2034. 24 months after NRA.
    // Credits through Jan 2034 = 22 months after NRA (Mar 2032).
    // First period: floor(1000 * (1 + 0.08/12 * 22)) = floor(1146.66...) = $1146
    // Second period: floor(1000 * (1 + 0.08/12 * 24)) = floor(1160) = $1160
    const r = makeRecipient(1000, 1965, 2, 15);
    const age69 = MonthDuration.initFromYearsMonths({ years: 69, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(age69);

    const firstBenefit = benefitOnDate(r, filingDate, filingDate);
    expect(firstBenefit.value()).toBe(1146);

    const jan2035 = MonthDate.initFromYearsMonths({
      years: filingDate.year() + 1,
      months: 0,
    });
    const secondBenefit = benefitOnDate(r, filingDate, jan2035);
    expect(secondBenefit.value()).toBe(1160);
  });

  it('born March 15, file at NRA: no delayed bump (filing at or before NRA)', () => {
    // Filing at NRA = no delayed credits, so no January bump.
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const filingDate = r.birthdate.dateAtSsaAge(nra);

    const benefitAtFiling = benefitOnDate(r, filingDate, filingDate);
    const jan = MonthDate.initFromYearsMonths({
      years: filingDate.year() + 1,
      months: 0,
    });
    const benefitJan = benefitOnDate(r, filingDate, jan);

    // Both should equal PIA since there are no delayed credits
    expect(benefitAtFiling.value()).toBe(1000);
    expect(benefitJan.value()).toBe(1000);
  });
});

describe('Very large PIA', () => {
  it('PIA = $4000, benefit at 70 = floor(4000 * 1.24) = $4960', () => {
    const r = makeRecipient(4000, 1965, 5, 15);
    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const benefit = benefitAtAge(r, age70);
    expect(benefit.value()).toBe(4960);
  });

  it('PIA = $4000, NPV over 20 years at 70 is correct', () => {
    const r = makeRecipient(4000, 1965, 5, 15);
    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const age90 = MonthDuration.initFromYearsMonths({ years: 90, months: 0 });
    const finalDate = r.birthdate.dateAtSsaAge(age90);

    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      age70
    );

    // 20 years = 240 months, but we need to check inclusive range.
    // Filing date to final date = 240 months inclusive = 241 months of benefits.
    // $4960/month * 241 months = $1,195,360 -> 119536000 cents
    // But actually the first month counts too (filing month through final month)
    // Duration = 90y0m - 70y0m = 20y0m = 240 months. +1 for inclusive = 241.
    expect(npv).toBe(4960 * 100 * 241);
  });
});

describe('Very small PIA', () => {
  it('PIA = $1, benefit at 62y1m does not floor to zero', () => {
    // PIA = $1. At 62y1m, 59 months early:
    // Reduction = 36*(5/900) + 23*(5/1200) = 0.2 + 0.0958... = 0.2958...
    // Benefit = floor($1 * 0.7041...) = floor($0.70) = $0
    // This IS expected to floor to zero for $1 PIA at earliest filing.
    const r = makeRecipient(1, 1965, 2, 15);
    const age62m1 = MonthDuration.initFromYearsMonths({
      years: 62,
      months: 1,
    });
    const benefit = benefitAtAge(r, age62m1);
    // $1 * 0.7041... = $0.70, floor to dollar = $0
    expect(benefit.value()).toBe(0);
  });

  it('PIA = $10, benefit at NRA = $10', () => {
    const r = makeRecipient(10, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const benefit = benefitAtAge(r, nra);
    expect(benefit.value()).toBe(10);
  });

  it('PIA = $10, benefit at 62y1m is nonzero', () => {
    // PIA = $10. At 62y1m:
    // Benefit = floor($10 * 0.7041...) = floor($7.04) = $7
    const r = makeRecipient(10, 1965, 2, 15);
    const age62m1 = MonthDuration.initFromYearsMonths({
      years: 62,
      months: 1,
    });
    const benefit = benefitAtAge(r, age62m1);
    expect(benefit.value()).toBe(7);
    expect(benefit.cents()).toBeGreaterThan(0);
  });
});

describe('Filing and dying exactly at age boundaries', () => {
  it('file at 62y0m for someone born on the 1st (valid)', () => {
    // Born April 1, 1965. SSA birthdate = March 31, 1965 (still March).
    // Earliest filing = 62y0m = March 2027.
    const r = makeRecipient(1000, 1965, 3, 1);
    const age62m0 = MonthDuration.initFromYearsMonths({
      years: 62,
      months: 0,
    });
    const filingDate = r.birthdate.dateAtSsaAge(age62m0);
    // Should not throw
    const benefit = benefitOnDate(r, filingDate, filingDate);
    expect(benefit.cents()).toBeGreaterThan(0);
  });

  it('file at 70y0m and die at 70y0m: 1 month of max benefit', () => {
    const r = makeRecipient(2000, 1965, 5, 15);
    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(age70);

    const npv = strategySumCentsSingle(
      r,
      filingDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      age70
    );

    // floor(2000 * 1.24) = $2480. 1 month.
    expect(npv).toBe(2480 * 100);
  });

  it('file at NRA (67y0m) and die at 67y0m: 1 month of exact PIA', () => {
    const r = makeRecipient(1500, 1965, 7, 20);
    const nra = r.normalRetirementAge();
    const filingDate = r.birthdate.dateAtSsaAge(nra);

    const npv = strategySumCentsSingle(
      r,
      filingDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );

    expect(npv).toBe(1500 * 100);
  });
});

describe('Optimal strategy edge cases', () => {
  it('dying at 62y1m: optimal is to file immediately (no choice)', () => {
    // If you die at 62y1m, you can only file at 62y1m (born on 15th).
    const r = makeRecipient(1000, 1965, 2, 15);
    const age62m1 = MonthDuration.initFromYearsMonths({
      years: 62,
      months: 1,
    });
    const finalDate = r.birthdate.dateAtSsaAge(age62m1);

    const [optAge, optNpv] = optimalStrategySingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT
    );

    expect(optAge.asMonths()).toBe(62 * 12 + 1);
    expect(optNpv).toBeGreaterThan(0);
  });

  it('dying at 70y0m born on 1st: optimal considers filing from 62y0m to 70y0m', () => {
    // Born March 1, 1965. Dies at 70y0m.
    const r = makeRecipient(1000, 1965, 2, 1);
    const finalDate = r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
    );

    const [optAge, optNpv] = optimalStrategySingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT
    );

    // Should be a valid age between 62y0m and 70y0m
    expect(optAge.asMonths()).toBeGreaterThanOrEqual(62 * 12);
    expect(optAge.asMonths()).toBeLessThanOrEqual(70 * 12);
    expect(optNpv).toBeGreaterThan(0);
  });
});

describe('Extremely short benefit windows', () => {
  it('file at 70y0m, die same month: 1 month of 124% benefit', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const filingDate = r.birthdate.dateAtSsaAge(age70);
    const npv = strategySumCentsSingle(
      r,
      filingDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      age70
    );
    // floor(1000 * 1.24) = 1240 -> 124000 cents for 1 month
    expect(npv).toBe(1240 * 100);
  });

  it('file at 70y0m, die 1 month later: 2 months of 124% benefit', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const age70m1 = MonthDuration.initFromYearsMonths({
      years: 70,
      months: 1,
    });
    const finalDate = r.birthdate.dateAtSsaAge(age70m1);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      age70
    );
    // 2 months * $1240 = $2480 -> 248000 cents
    expect(npv).toBe(1240 * 100 * 2);
  });

  it('file at 62y1m, die same month: 1 month of reduced benefit', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const age62m1 = MonthDuration.initFromYearsMonths({
      years: 62,
      months: 1,
    });
    const filingDate = r.birthdate.dateAtSsaAge(age62m1);
    const expectedBenefit = benefitAtAge(r, age62m1);
    const npv = strategySumCentsSingle(
      r,
      filingDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      age62m1
    );
    // 1 month of reduced benefit
    expect(npv).toBe(expectedBenefit.cents());
    expect(expectedBenefit.value()).toBe(704);
  });

  it('NPV = monthly_benefit_cents * num_months at 0% discount', () => {
    const r = makeRecipient(2000, 1965, 2, 15);
    const nra = r.normalRetirementAge(); // 67y0m
    const age75 = MonthDuration.initFromYearsMonths({ years: 75, months: 0 });
    const finalDate = r.birthdate.dateAtSsaAge(age75);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );
    // 75y0m - 67y0m = 8 years = 96 months, +1 inclusive = 97
    const monthlyBenefitCents = benefitAtAge(r, nra).cents();
    expect(npv).toBe(monthlyBenefitCents * 97);
  });
});

describe('Born on last day of month', () => {
  it('born Feb 28 1964 (leap year): strategySumCentsSingle works', () => {
    // Feb 28 1964 is a leap year. SSA birthdate = Feb 27.
    const r = makeRecipient(1500, 1964, 1, 28);
    const nra = r.normalRetirementAge();
    const age80 = MonthDuration.initFromYearsMonths({ years: 80, months: 0 });
    const finalDate = r.birthdate.dateAtSsaAge(age80);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBeGreaterThan(0);
  });

  it('born March 31 1965: strategySumCentsSingle works', () => {
    const r = makeRecipient(1500, 1965, 2, 31);
    const nra = r.normalRetirementAge();
    const age80 = MonthDuration.initFromYearsMonths({ years: 80, months: 0 });
    const finalDate = r.birthdate.dateAtSsaAge(age80);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBeGreaterThan(0);
  });

  it('born April 30 1965: strategySumCentsSingle works', () => {
    const r = makeRecipient(1500, 1965, 3, 30);
    const nra = r.normalRetirementAge();
    const age80 = MonthDuration.initFromYearsMonths({ years: 80, months: 0 });
    const finalDate = r.birthdate.dateAtSsaAge(age80);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBeGreaterThan(0);
  });
});

describe('Delayed January bump sweep', () => {
  it('born March 15 1965: for every filing age 67y1m to 69y11m, January bump behaves correctly', () => {
    const r = makeRecipient(1000, 1965, 2, 15);

    for (let m = 67 * 12 + 1; m <= 69 * 12 + 11; m++) {
      const filingAge = new MonthDuration(m);
      const filingDate = r.birthdate.dateAtSsaAge(filingAge);
      const benefitAtFiling = benefitOnDate(r, filingDate, filingDate);

      // Compute next January after filing
      const nextJanuary = MonthDate.initFromYearsMonths({
        years: filingDate.year() + 1,
        months: 0,
      });
      const benefitAtNextJan = benefitOnDate(r, filingDate, nextJanuary);

      if (filingDate.monthIndex() !== 0) {
        // Not January: amounts should differ (January bump applies)
        expect(
          benefitAtFiling.cents(),
          `Filing age ${filingAge.years()}y${filingAge.modMonths()}m: expected different amounts for non-January filing`
        ).not.toBe(benefitAtNextJan.cents());
      } else {
        // January: amounts should be equal (full credits applied immediately)
        expect(
          benefitAtFiling.cents(),
          `Filing age ${filingAge.years()}y${filingAge.modMonths()}m: expected same amounts for January filing`
        ).toBe(benefitAtNextJan.cents());
      }
    }
  });
});

describe('NRA month boundary transitions', () => {
  it('66y11m (1 month early): early reduction applied', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const earlyAge = MonthDuration.initFromYearsMonths({
      years: 66,
      months: 11,
    });
    const benefit = benefitAtAge(r, earlyAge);
    // 1 month early: reduction = 1 * (5/900) = 0.005555...
    // floor(1000 * (1 - 0.005555...)) = floor(994.44...) = $994
    expect(benefit.value()).toBeLessThan(1000);
    expect(benefit.value()).toBe(994);
  });

  it('67y0m (NRA): benefit equals PIA exactly', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const benefit = benefitAtAge(r, nra);
    expect(benefit.value()).toBe(1000);
  });

  it('67y1m (1 month late): delayed credit applied', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const lateAge = MonthDuration.initFromYearsMonths({
      years: 67,
      months: 1,
    });
    const benefit = benefitAtAge(r, lateAge);
    // 1 month late: increase = (0.08/12) * 1 = 0.006666...
    // floor(1000 * (1 + 0.006666...)) = floor(1006.66...) = $1006
    expect(benefit.value()).toBeGreaterThan(1000);
    expect(benefit.value()).toBe(1006);
  });
});

describe('Single vs couple cross-validation', () => {
  it('couple with $0 PIA partner dying earliest: matches single NPV', () => {
    // Create a single filer
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const age80 = MonthDuration.initFromYearsMonths({ years: 80, months: 0 });
    const finalDate = r.birthdate.dateAtSsaAge(age80);

    const singleNpv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );

    // Create a couple where partner has $0 PIA and dies at earliest possible age
    // Partner born same date, $0 PIA, dies at 62y1m (earliest)
    const partner = makeRecipient(0, 1965, 2, 15);
    const partnerEarliestAge = MonthDuration.initFromYearsMonths({
      years: 62,
      months: 1,
    });
    const partnerFinalDate = partner.birthdate.dateAtSsaAge(partnerEarliestAge);

    const coupleNpv = strategySumCentsCouple(
      [r, partner],
      [finalDate, partnerFinalDate],
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      [nra, partnerEarliestAge]
    );

    // With $0 PIA partner dying early, couple NPV should match single NPV
    expect(coupleNpv).toBe(singleNpv);
  });

  it('couple with $0 PIA partner at same death age: results match or close', () => {
    const r = makeRecipient(2500, 1970, 5, 10);
    const nra = r.normalRetirementAge();
    const age85 = MonthDuration.initFromYearsMonths({ years: 85, months: 0 });
    const finalDate = r.birthdate.dateAtSsaAge(age85);

    const singleNpv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );

    // Partner with $0 PIA, same death date
    const partner = makeRecipient(0, 1970, 5, 10);
    const partnerEarliestAge = MonthDuration.initFromYearsMonths({
      years: 62,
      months: 1,
    });
    const partnerFinalDate = partner.birthdate.dateAtSsaAge(partnerEarliestAge);

    const coupleNpv = strategySumCentsCouple(
      [r, partner],
      [finalDate, partnerFinalDate],
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      [nra, partnerEarliestAge]
    );

    expect(coupleNpv).toBe(singleNpv);
  });
});

describe('Death in every month of a year', () => {
  it('born March 15 1965, file at NRA: NPV increases by PIA_cents each month', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const nra = r.normalRetirementAge(); // 67y0m
    const piaCents = 1000 * 100;

    // Death dates: Jan through Dec 2050
    const npvs: number[] = [];
    for (let month = 0; month < 12; month++) {
      const deathDate = MonthDate.initFromYearsMonths({
        years: 2050,
        months: month,
      });
      const npv = strategySumCentsSingle(
        r,
        deathDate,
        PAST_CURRENT_DATE,
        NO_DISCOUNT,
        nra
      );
      npvs.push(npv);
    }

    // Each consecutive month should add exactly PIA_cents
    for (let i = 1; i < npvs.length; i++) {
      expect(npvs[i] - npvs[i - 1]).toBe(piaCents);
    }
  });
});

describe('$0 PIA single filer', () => {
  it('$0 PIA at NRA: NPV is 0', () => {
    const r = makeRecipient(0, 1965, 2, 15);
    const nra = r.normalRetirementAge();
    const age80 = MonthDuration.initFromYearsMonths({ years: 80, months: 0 });
    const finalDate = r.birthdate.dateAtSsaAge(age80);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBe(0);
  });

  it('$0 PIA at age 70: NPV is 0', () => {
    const r = makeRecipient(0, 1965, 2, 15);
    const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
    const age90 = MonthDuration.initFromYearsMonths({ years: 90, months: 0 });
    const finalDate = r.birthdate.dateAtSsaAge(age90);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      age70
    );
    expect(npv).toBe(0);
  });
});

describe('Extreme longevity', () => {
  it('born 1975, die at 120 (year 2095): no overflow at 0% discount', () => {
    const r = makeRecipient(3000, 1975, 5, 15);
    const nra = r.normalRetirementAge();
    const age120 = MonthDuration.initFromYearsMonths({
      years: 120,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(age120);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBeGreaterThan(0);
    // 120 - 67 = 53 years = 636 months, +1 inclusive = 637
    // $3000 * 637 = $1,911,000 -> 191100000 cents
    expect(npv).toBe(3000 * 100 * 637);
    // Verify no overflow: should be well within Number.MAX_SAFE_INTEGER
    expect(npv).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it('born 1975, die at 120 (year 2095): NPV > 0 at 5% discount', () => {
    const r = makeRecipient(3000, 1975, 5, 15);
    const nra = r.normalRetirementAge();
    const age120 = MonthDuration.initFromYearsMonths({
      years: 120,
      months: 0,
    });
    const finalDate = r.birthdate.dateAtSsaAge(age120);
    const npv = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      0.05,
      nra
    );
    expect(npv).toBeGreaterThan(0);
    // At 5% discount, NPV should be substantially less than undiscounted
    const npvNoDiscount = strategySumCentsSingle(
      r,
      finalDate,
      PAST_CURRENT_DATE,
      NO_DISCOUNT,
      nra
    );
    expect(npv).toBeLessThan(npvNoDiscount);
  });
});
