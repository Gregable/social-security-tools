import { describe, expect, it } from 'vitest';
import {
  COLA,
  MAX_COLA_YEAR,
  MAX_YEAR,
  MEDICARE_PART_B_PREMIUM,
} from '$lib/constants';
import {
  colaGrowthExample,
  EXAMPLE_PIA,
  medicareDeductionExample,
  spousalExample,
  stopWorkingExample,
} from '$lib/estimate-differences-example';
import { Money } from '$lib/money';
import { applyColas } from '$lib/pia';

describe('applyColas', () => {
  it('returns the PIA unchanged over an empty range', () => {
    expect(
      applyColas(Money.from(1000), 2025, 2024).equals(Money.from(1000))
    ).toBe(true);
  });

  it('rounds down to the dime after each year', () => {
    // 2.5% of $1,000.30 is $25.0075, so $1,025.3075 floors to $1,025.30.
    expect(COLA[2024]).toBe(2.5);
    expect(
      applyColas(Money.from(1000.3), 2024, 2024).equals(Money.from(1025.3))
    ).toBe(true);
  });

  it('skips years with no published COLA', () => {
    const later = MAX_COLA_YEAR + 5;
    expect(
      applyColas(Money.from(1000), later, later + 2).equals(Money.from(1000))
    ).toBe(true);
  });
});

describe('stopWorkingExample', () => {
  const example = stopWorkingExample();

  it('is age 55 in the latest year the constants cover', () => {
    expect(MAX_YEAR - example.birthYear).toBe(55);
  });

  it('projects earnings through the full-retirement-age year, as SSA does', () => {
    expect(example.projectedYears).toBe(example.fraYear - MAX_YEAR + 1);
    expect(example.careerYears + example.projectedYears).toBeGreaterThan(35);
  });

  it('leaves the stopped career short of 35 years', () => {
    expect(example.careerYears).toBeLessThan(35);
    expect(example.missingYearsIfStopped).toBe(35 - example.careerYears);
  });

  it('pays less if the worker stops now', () => {
    expect(example.piaIfStopNow.lessThan(example.piaIfKeepWorking)).toBe(true);
    expect(
      example.difference.equals(
        example.piaIfKeepWorking.sub(example.piaIfStopNow)
      )
    ).toBe(true);
  });

  it('keeps both AIMEs in the 32% bracket, as the guide says', () => {
    expect(example.bothInSecondBracket).toBe(true);
  });

  // Golden values. When these move (usually the annual constants update),
  // re-read the guide's prose around the stop-working example.
  it('matches the published figures', () => {
    expect(example.birthYear).toBe(1972);
    expect(example.fraYear).toBe(2039);
    expect(example.projectedYears).toBe(13);
    expect(example.piaIfKeepWorking.string()).toBe('$2,910.30');
    expect(example.piaIfStopNow.string()).toBe('$2,605.60');
    expect(example.difference.string()).toBe('$304.70');
  });
});

describe('colaGrowthExample', () => {
  const example = colaGrowthExample();

  it('starts five COLAs before the newest one', () => {
    expect(example.turned62In).toBe(MAX_COLA_YEAR - 5);
    expect(example.rows.map((r) => r.year)).toEqual([
      MAX_COLA_YEAR - 5,
      MAX_COLA_YEAR - 4,
      MAX_COLA_YEAR - 3,
      MAX_COLA_YEAR - 2,
      MAX_COLA_YEAR - 1,
      MAX_COLA_YEAR,
    ]);
  });

  it('chains each row from the one before', () => {
    let previous = example.piaAt62;
    for (const row of example.rows) {
      expect(row.piaBefore.equals(previous)).toBe(true);
      expect(row.cola).toBe(COLA[row.year]);
      expect(row.firstPaidYear).toBe(row.year + 1);
      previous = row.piaAfter;
    }
    expect(example.piaNow.equals(previous)).toBe(true);
  });

  it('agrees with applying all the COLAs at once', () => {
    expect(
      example.piaNow.equals(
        applyColas(EXAMPLE_PIA, example.turned62In, MAX_COLA_YEAR)
      )
    ).toBe(true);
  });

  it('matches the published figures', () => {
    expect(example.turned62In).toBe(2021);
    expect(example.rows.map((r) => r.piaAfter.string())).toEqual([
      '$2,118.00',
      '$2,302.20',
      '$2,375.80',
      '$2,435.10',
      '$2,503.20',
      '$2,593.30',
    ]);
    expect(example.increase.string()).toBe('$593.30');
    expect(example.percentIncrease.toFixed(1)).toBe('29.7');
  });
});

describe('medicareDeductionExample', () => {
  const example = medicareDeductionExample();

  it('uses the newest published Part B premium', () => {
    const newest = Math.max(
      ...Object.keys(MEDICARE_PART_B_PREMIUM).map(Number)
    );
    expect(example.premiumYear).toBe(newest);
    expect(example.premium.equals(MEDICARE_PART_B_PREMIUM[newest])).toBe(true);
  });

  it('deposits the benefit less the premium, rounded down to the dollar', () => {
    expect(example.benefit.equals(EXAMPLE_PIA)).toBe(true);
    expect(
      example.deposit.equals(
        example.benefit.sub(example.premium).floorToDollar()
      )
    ).toBe(true);
  });

  it('matches the published figures', () => {
    expect(example.premiumYear).toBe(2026);
    expect(example.premium.string()).toBe('$202.90');
    expect(example.deposit.string()).toBe('$1,797.00');
  });
});

describe('spousalExample', () => {
  const example = spousalExample();

  it('has the worker claim at 70 before the spouse files', () => {
    expect(MAX_YEAR - example.workerBirthYear).toBe(70);
    expect(MAX_YEAR - example.spouseBirthYear).toBe(62);
  });

  it('pays half the PIA at the spouse full retirement age, not half the age-70 check', () => {
    expect(example.spousalAtFra.equals(example.workerPia.div(2))).toBe(true);
    expect(example.spousalAtFra.lessThan(example.halfOfWorkerCheck)).toBe(true);
  });

  it('reduces a spousal claim at 62', () => {
    expect(example.spousalAt62.lessThan(example.spousalAtFra)).toBe(true);
  });

  it('matches the published figures', () => {
    expect(example.workerBenefitAt70.string()).toBe('$2,560.00');
    expect(example.halfOfWorkerCheck.string()).toBe('$1,280.00');
    expect(example.spousalAtFra.string()).toBe('$1,000.00');
    expect(example.spousalAt62.string()).toBe('$650.00');
  });
});
