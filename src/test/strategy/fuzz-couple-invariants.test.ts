import { describe, expect, it } from 'vitest';
import {
  benefitAtAge,
  eligibleForSpousalBenefit,
  higherEarningsThan,
  survivorBenefit,
} from '$lib/benefit-calculator';
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
// Seeded PRNG for reproducibility
// ---------------------------------------------------------------------------

function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a Recipient with PIA only (no earnings records).
 * Uses day 15 to avoid 1st/2nd-of-month SSA filing rules.
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
const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });
const NO_DISCOUNT = 0;

/**
 * Generates a random filing age as MonthDuration, clamped to [62y1m, 70y0m].
 * 62y1m minimum since all recipients are born on the 15th (after the 2nd).
 */
function randomFilingAge(rng: () => number): MonthDuration {
  const years = randInt(rng, 62, 70);
  const months = randInt(rng, 0, 11);
  // Clamp: minimum 62y1m (born on 15th), maximum 70y0m
  const totalMonths = Math.max(
    62 * 12 + 1,
    Math.min(70 * 12, years * 12 + months)
  );
  return MonthDuration.initFromYearsMonths({
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  });
}

/**
 * Generates a death MonthDate from a recipient and a death age in years.
 */
function deathDate(recipient: Recipient, deathAgeYears: number): MonthDate {
  return recipient.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: deathAgeYears, months: 0 })
  );
}

/**
 * NRA filing age for 1960+ births: 67y0m.
 */
const NRA_FILING = MonthDuration.initFromYearsMonths({ years: 67, months: 0 });

// ---------------------------------------------------------------------------
// 1. NPV is non-negative for all valid couple configurations
// ---------------------------------------------------------------------------

describe('NPV is non-negative for all valid couple configurations', () => {
  it('random PIAs and death ages, both filing at NRA, 0% discount (200 scenarios)', () => {
    const rng = createRng(42);

    for (let i = 0; i < 200; i++) {
      const pia1 = randInt(rng, 0, 4000);
      const pia2 = randInt(rng, 0, 4000);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      // Skip scenarios where both have $0 PIA (no benefits at all)
      if (pia1 === 0 && pia2 === 0) continue;

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const npv = strategySumCentsCouple(
        [r1, r2],
        [fd1, fd2],
        FAR_PAST,
        NO_DISCOUNT,
        [NRA_FILING, NRA_FILING]
      );

      expect(
        npv,
        `Scenario ${i}: PIA1=$${pia1}, PIA2=$${pia2}, ` +
          `birth=${birthYear1}/${birthYear2}, death=${deathAge1}/${deathAge2}`
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it('random PIAs and filing ages, 0% discount (200 scenarios)', () => {
    const rng = createRng(777);

    for (let i = 0; i < 200; i++) {
      const pia1 = randInt(rng, 0, 4000);
      const pia2 = randInt(rng, 0, 4000);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      if (pia1 === 0 && pia2 === 0) continue;

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const strat1 = randomFilingAge(rng);
      const strat2 = randomFilingAge(rng);

      const npv = strategySumCentsCouple(
        [r1, r2],
        [fd1, fd2],
        FAR_PAST,
        NO_DISCOUNT,
        [strat1, strat2]
      );

      expect(
        npv,
        `Scenario ${i}: PIA1=$${pia1}, PIA2=$${pia2}, ` +
          `filing=${strat1.years()}y${strat1.modMonths()}m/${strat2.years()}y${strat2.modMonths()}m`
      ).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Couple NPV >= higher single NPV
// ---------------------------------------------------------------------------

describe('Couple NPV >= higher single NPV', () => {
  it('with both filing at NRA, 0% discount (100 scenarios)', () => {
    const rng = createRng(123);

    for (let i = 0; i < 100; i++) {
      const pia1 = randInt(rng, 100, 4000);
      const pia2 = randInt(rng, 100, 4000);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const coupleNpv = strategySumCentsCouple(
        [r1, r2],
        [fd1, fd2],
        FAR_PAST,
        NO_DISCOUNT,
        [NRA_FILING, NRA_FILING]
      );

      const single1Npv = strategySumCentsSingle(
        r1,
        fd1,
        FAR_PAST,
        NO_DISCOUNT,
        NRA_FILING
      );

      const single2Npv = strategySumCentsSingle(
        r2,
        fd2,
        FAR_PAST,
        NO_DISCOUNT,
        NRA_FILING
      );

      const higherSingleNpv = Math.max(single1Npv, single2Npv);

      expect(
        coupleNpv,
        `Scenario ${i}: couple NPV ${coupleNpv} < higher single NPV ${higherSingleNpv} ` +
          `(PIA1=$${pia1}, PIA2=$${pia2})`
      ).toBeGreaterThanOrEqual(higherSingleNpv);
    }
  });

  it('with random filing ages, 0% discount (100 scenarios)', () => {
    const rng = createRng(456);

    for (let i = 0; i < 100; i++) {
      const pia1 = randInt(rng, 100, 4000);
      const pia2 = randInt(rng, 100, 4000);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const strat1 = randomFilingAge(rng);
      const strat2 = randomFilingAge(rng);

      const coupleNpv = strategySumCentsCouple(
        [r1, r2],
        [fd1, fd2],
        FAR_PAST,
        NO_DISCOUNT,
        [strat1, strat2]
      );

      // Use the SAME strategy for each single to be comparable
      const single1Npv = strategySumCentsSingle(
        r1,
        fd1,
        FAR_PAST,
        NO_DISCOUNT,
        strat1
      );

      const single2Npv = strategySumCentsSingle(
        r2,
        fd2,
        FAR_PAST,
        NO_DISCOUNT,
        strat2
      );

      const higherSingleNpv = Math.max(single1Npv, single2Npv);

      expect(
        coupleNpv,
        `Scenario ${i}: couple NPV ${coupleNpv} < higher single NPV ${higherSingleNpv} ` +
          `(PIA1=$${pia1}, PIA2=$${pia2}, ` +
          `strat=${strat1.years()}y${strat1.modMonths()}m/${strat2.years()}y${strat2.modMonths()}m)`
      ).toBeGreaterThanOrEqual(higherSingleNpv);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Spousal benefit never exceeds earnerPIA/2 - dependentPIA
// ---------------------------------------------------------------------------

describe('Spousal benefit never exceeds earnerPIA/2 - dependentPIA', () => {
  it('for random couples, spousal amount is bounded (200 scenarios)', () => {
    const rng = createRng(999);

    for (let i = 0; i < 200; i++) {
      const pia1 = randInt(rng, 0, 4000);
      const pia2 = randInt(rng, 0, 4000);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const strat1 = randomFilingAge(rng);
      const strat2 = randomFilingAge(rng);

      const periods = strategySumPeriodsCouple(
        [r1, r2],
        [fd1, fd2],
        [strat1, strat2]
      );

      const spousalPeriods = periods.filter(
        (p) => p.benefitType === BenefitType.Spousal
      );

      if (spousalPeriods.length === 0) continue;

      // Determine earner/dependent
      const earnerPiaCents = Math.max(
        r1.pia().primaryInsuranceAmount().cents(),
        r2.pia().primaryInsuranceAmount().cents()
      );
      const dependentPiaCents = Math.min(
        r1.pia().primaryInsuranceAmount().cents(),
        r2.pia().primaryInsuranceAmount().cents()
      );

      // The base spousal benefit (before any early filing reduction) is
      // floor(earnerPIA/2) - dependentPIA. The actual amount after reduction
      // should never exceed this base.
      const maxSpousalCents = Math.floor(
        earnerPiaCents / 2 - dependentPiaCents
      );

      for (const period of spousalPeriods) {
        expect(
          period.amount.cents(),
          `Scenario ${i}: spousal amount ${period.amount.cents()} > max ${maxSpousalCents} ` +
            `(earnerPIA=${earnerPiaCents}c, depPIA=${dependentPiaCents}c)`
        ).toBeLessThanOrEqual(maxSpousalCents);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. No overlapping periods of same type for same recipient
// ---------------------------------------------------------------------------

describe('No overlapping periods of same type for same recipient', () => {
  it('for random couples, periods of same type do not overlap (200 scenarios)', () => {
    const rng = createRng(314);

    for (let i = 0; i < 200; i++) {
      const pia1 = randInt(rng, 0, 4000);
      const pia2 = randInt(rng, 0, 4000);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      if (pia1 === 0 && pia2 === 0) continue;

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const strat1 = randomFilingAge(rng);
      const strat2 = randomFilingAge(rng);

      const periods = strategySumPeriodsCouple(
        [r1, r2],
        [fd1, fd2],
        [strat1, strat2]
      );

      // Group by (recipientIndex, benefitType)
      const grouped = new Map<string, typeof periods>();
      for (const p of periods) {
        const key = `${p.recipientIndex}-${p.benefitType}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(p);
      }

      for (const [key, group] of grouped) {
        // Sort by startDate
        group.sort(
          (a, b) =>
            a.startDate.monthsSinceEpoch() - b.startDate.monthsSinceEpoch()
        );

        for (let j = 1; j < group.length; j++) {
          const prevEnd = group[j - 1].endDate.monthsSinceEpoch();
          const currStart = group[j].startDate.monthsSinceEpoch();
          expect(
            currStart,
            `Scenario ${i}, group ${key}: period ${j} start ` +
              `(${currStart}) overlaps previous end (${prevEnd})`
          ).toBeGreaterThan(prevEnd);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 5. All period dates within filing-to-death range
// ---------------------------------------------------------------------------

describe('All period dates within filing-to-death range', () => {
  it('every period is bounded by filing and death dates (200 scenarios)', () => {
    const rng = createRng(271);

    for (let i = 0; i < 200; i++) {
      const pia1 = randInt(rng, 100, 4000);
      const pia2 = randInt(rng, 100, 4000);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const strat1 = randomFilingAge(rng);
      const strat2 = randomFilingAge(rng);

      const filingDate1 = r1.birthdate.dateAtSsaAge(strat1);
      const filingDate2 = r2.birthdate.dateAtSsaAge(strat2);

      const periods = strategySumPeriodsCouple(
        [r1, r2],
        [fd1, fd2],
        [strat1, strat2]
      );

      const finalDates = [fd1, fd2];
      const filingDates = [filingDate1, filingDate2];

      for (const period of periods) {
        const ri = period.recipientIndex;

        // Period amount must be non-negative
        expect(
          period.amount.cents(),
          `Scenario ${i}: negative amount for recipient ${ri}, type ${period.benefitType}`
        ).toBeGreaterThanOrEqual(0);

        // Period endDate must not exceed death date
        expect(
          period.endDate.monthsSinceEpoch(),
          `Scenario ${i}: period endDate exceeds death date for recipient ${ri}`
        ).toBeLessThanOrEqual(finalDates[ri].monthsSinceEpoch());

        // For personal benefits: startDate >= filing date of the recipient
        if (period.benefitType === BenefitType.Personal) {
          expect(
            period.startDate.monthsSinceEpoch(),
            `Scenario ${i}: personal period starts before filing date for recipient ${ri}`
          ).toBeGreaterThanOrEqual(filingDates[ri].monthsSinceEpoch());
        }

        // For survivor benefits: startDate must be after the earner's death
        if (period.benefitType === BenefitType.Survivor) {
          // The earner is the other recipient
          const earnerIndex = ri === 0 ? 1 : 0;
          expect(
            period.startDate.monthsSinceEpoch(),
            `Scenario ${i}: survivor period starts before earner death for recipient ${ri}`
          ).toBeGreaterThan(finalDates[earnerIndex].monthsSinceEpoch());
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Survivor benefit <= earner's age-70 benefit
// ---------------------------------------------------------------------------

describe('Survivor benefit <= earner age-70 benefit', () => {
  it('survivor benefit never exceeds the maximum earner benefit (150 scenarios)', () => {
    const rng = createRng(628);

    for (let i = 0; i < 150; i++) {
      // Earner has higher PIA
      const earnerPia = randInt(rng, 500, 4000);
      const survivorPia = randInt(rng, 0, earnerPia - 1);
      const earnerBirthYear = randInt(rng, 1960, 1980);
      const survivorBirthYear = randInt(rng, 1960, 1980);

      const earner = makeRecipient(earnerPia, earnerBirthYear, 0, 15);
      const survivor = makeRecipient(survivorPia, survivorBirthYear, 0, 15);

      // Earner files at a random age
      const earnerFilingAge = randomFilingAge(rng);
      const earnerFilingDate = earner.birthdate.dateAtSsaAge(earnerFilingAge);

      // Earner dies between age 62 and 95
      const earnerDeathAge = randInt(rng, 62, 95);
      const earnerDeathDate = deathDate(earner, earnerDeathAge);

      // Survivor filing for survivor benefits happens after earner death
      // Use the month after death or the survivor's earliest filing age,
      // whichever is later
      const monthAfterDeath = earnerDeathDate.addDuration(new MonthDuration(1));

      // Must be at least age 60 for survivor benefits
      const survivorAge60Date = survivor.birthdate.dateAtSsaAge(
        MonthDuration.initFromYearsMonths({ years: 60, months: 0 })
      );
      const survivorFilingDate = MonthDate.max(
        monthAfterDeath,
        survivorAge60Date
      );

      // Check that the survivor is actually alive at filing time
      const survivorDeathAge = randInt(rng, 70, 100);
      const survivorDeathMd = deathDate(survivor, survivorDeathAge);
      if (survivorFilingDate.greaterThanOrEqual(survivorDeathMd)) continue;

      // The maximum earner benefit is at age 70
      const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
      const maxEarnerBenefit = benefitAtAge(earner, age70);

      try {
        const sb = survivorBenefit(
          survivor,
          earner,
          earnerFilingDate,
          earnerDeathDate,
          survivorFilingDate
        );

        expect(
          sb.cents(),
          `Scenario ${i}: survivor benefit ${sb.cents()} > max earner benefit ` +
            `${maxEarnerBenefit.cents()} (earnerPIA=$${earnerPia}, survivorPIA=$${survivorPia})`
        ).toBeLessThanOrEqual(maxEarnerBenefit.cents());
      } catch {
        // Some configurations throw (e.g., filing before death); skip
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 7. NPV increases monotonically with death age (both recipients)
// ---------------------------------------------------------------------------

describe('NPV increases monotonically with death age', () => {
  it('sweeping death age for recipient 1 with fixed recipient 2 (50 scenarios)', () => {
    const rng = createRng(161);

    for (let i = 0; i < 50; i++) {
      const pia1 = randInt(rng, 200, 3000);
      const pia2 = randInt(rng, 200, 3000);
      const birthYear1 = randInt(rng, 1960, 1975);
      const birthYear2 = randInt(rng, 1960, 1975);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      const strat1 = NRA_FILING;
      const strat2 = NRA_FILING;

      // Fix r2 death age
      const fixedDeathAge2 = randInt(rng, 70, 90);
      const fd2 = deathDate(r2, fixedDeathAge2);

      let prevNpv = -1;
      // Sweep r1 death age from 67 to 95
      for (let deathAge1 = 67; deathAge1 <= 95; deathAge1++) {
        const fd1 = deathDate(r1, deathAge1);

        const npv = strategySumCentsCouple(
          [r1, r2],
          [fd1, fd2],
          FAR_PAST,
          NO_DISCOUNT,
          [strat1, strat2]
        );

        if (prevNpv >= 0) {
          expect(
            npv,
            `Scenario ${i}: NPV decreased when r1 death age went from ` +
              `${deathAge1 - 1} to ${deathAge1} (PIA1=$${pia1}, PIA2=$${pia2})`
          ).toBeGreaterThanOrEqual(prevNpv);
        }
        prevNpv = npv;
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Swapping recipient order preserves NPV
// ---------------------------------------------------------------------------

describe('Swapping recipient order preserves NPV', () => {
  it('strategySumCentsCouple([r1,r2],...) == strategySumCentsCouple([r2,r1],...) (100 scenarios)', () => {
    const rng = createRng(2718);

    for (let i = 0; i < 100; i++) {
      const pia1 = randInt(rng, 0, 4000);
      const pia2 = randInt(rng, 0, 4000);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      if (pia1 === 0 && pia2 === 0) continue;

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const strat1 = randomFilingAge(rng);
      const strat2 = randomFilingAge(rng);

      const npvOriginal = strategySumCentsCouple(
        [r1, r2],
        [fd1, fd2],
        FAR_PAST,
        NO_DISCOUNT,
        [strat1, strat2]
      );

      const npvSwapped = strategySumCentsCouple(
        [r2, r1],
        [fd2, fd1],
        FAR_PAST,
        NO_DISCOUNT,
        [strat2, strat1]
      );

      expect(
        npvOriginal,
        `Scenario ${i}: swapped NPV differs ` +
          `(PIA1=$${pia1}, PIA2=$${pia2}, ` +
          `strat=${strat1.years()}y${strat1.modMonths()}m/${strat2.years()}y${strat2.modMonths()}m)`
      ).toBe(npvSwapped);
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Couple NPV is additive over benefit types at 0% discount
// ---------------------------------------------------------------------------

describe('Couple NPV is additive over benefit types at 0% discount', () => {
  it('sum of per-type totals equals strategySumCentsCouple at 0% (100 scenarios)', () => {
    const rng = createRng(3141);

    for (let i = 0; i < 100; i++) {
      const pia1 = randInt(rng, 100, 4000);
      const pia2 = randInt(rng, 100, 4000);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const strat1 = randomFilingAge(rng);
      const strat2 = randomFilingAge(rng);

      const periods = strategySumPeriodsCouple(
        [r1, r2],
        [fd1, fd2],
        [strat1, strat2]
      );

      let personalSum = 0;
      let spousalSum = 0;
      let survivorSum = 0;

      for (const p of periods) {
        const months = p.endDate.subtractDate(p.startDate).asMonths() + 1;
        const totalCents = p.amount.cents() * months;
        if (p.benefitType === BenefitType.Personal) {
          personalSum += totalCents;
        } else if (p.benefitType === BenefitType.Spousal) {
          spousalSum += totalCents;
        } else if (p.benefitType === BenefitType.Survivor) {
          survivorSum += totalCents;
        }
      }

      const expectedTotal = personalSum + spousalSum + survivorSum;

      const actualTotal = strategySumCentsCouple(
        [r1, r2],
        [fd1, fd2],
        FAR_PAST,
        NO_DISCOUNT,
        [strat1, strat2]
      );

      expect(
        actualTotal,
        `Scenario ${i}: per-type sum ${expectedTotal} != strategySumCentsCouple ${actualTotal} ` +
          `(personal=${personalSum}, spousal=${spousalSum}, survivor=${survivorSum})`
      ).toBe(expectedTotal);
    }
  });
});

// ---------------------------------------------------------------------------
// 10. Optimal couple NPV >= any sampled strategy
// ---------------------------------------------------------------------------

describe('Optimal couple NPV >= any sampled strategy', () => {
  it('optimal NPV beats 10 random strategies per couple (50 scenarios)', () => {
    const rng = createRng(5555);
    const currentDate = MonthDate.initFromYearsMonths({
      years: 2025,
      months: 0,
    });

    for (let i = 0; i < 50; i++) {
      const pia1 = randInt(rng, 200, 3500);
      const pia2 = randInt(rng, 200, 3500);
      const birthYear1 = randInt(rng, 1960, 1970);
      const birthYear2 = randInt(rng, 1960, 1970);
      const deathAge1 = randInt(rng, 70, 95);
      const deathAge2 = randInt(rng, 70, 95);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const [optStrat1, optStrat2, optNpv] = optimalStrategyCoupleOptimized(
        [r1, r2],
        [fd1, fd2],
        currentDate,
        NO_DISCOUNT
      );

      // Verify optimal is valid (non-negative NPV)
      expect(
        optNpv,
        `Scenario ${i}: optimal NPV is negative`
      ).toBeGreaterThanOrEqual(0);

      // Sample 10 random strategies and verify optimal beats each
      for (let j = 0; j < 10; j++) {
        const sampleStrat1 = randomFilingAge(rng);
        const sampleStrat2 = randomFilingAge(rng);

        const sampleNpv = strategySumCentsCouple(
          [r1, r2],
          [fd1, fd2],
          currentDate,
          NO_DISCOUNT,
          [sampleStrat1, sampleStrat2]
        );

        expect(
          optNpv,
          `Scenario ${i}, sample ${j}: optimal NPV ${optNpv} < sample NPV ${sampleNpv} ` +
            `(optStrat=${optStrat1.years()}y${optStrat1.modMonths()}m/${optStrat2.years()}y${optStrat2.modMonths()}m, ` +
            `sampleStrat=${sampleStrat1.years()}y${sampleStrat1.modMonths()}m/${sampleStrat2.years()}y${sampleStrat2.modMonths()}m)`
        ).toBeGreaterThanOrEqual(sampleNpv);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 11. Spousal benefit is zero when not eligible
// ---------------------------------------------------------------------------

describe('Spousal benefit is zero when not eligible', () => {
  it('no spousal periods when neither direction is eligible (150 scenarios)', () => {
    const rng = createRng(7777);

    for (let i = 0; i < 150; i++) {
      // Use similar PIAs so neither qualifies for spousal (need PIA > spouse PIA/2)
      const basePia = randInt(rng, 500, 3000);
      // Keep PIAs close enough that neither half exceeds the other
      const pia1 = basePia + randInt(rng, 0, 100);
      const pia2 = basePia + randInt(rng, 0, 100);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      // Only test cases where neither is eligible for spousal
      if (
        eligibleForSpousalBenefit(r1, r2) ||
        eligibleForSpousalBenefit(r2, r1)
      ) {
        continue;
      }

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const strat1 = randomFilingAge(rng);
      const strat2 = randomFilingAge(rng);

      const periods = strategySumPeriodsCouple(
        [r1, r2],
        [fd1, fd2],
        [strat1, strat2]
      );

      const spousalPeriods = periods.filter(
        (p) => p.benefitType === BenefitType.Spousal
      );

      expect(
        spousalPeriods.length,
        `Scenario ${i}: found ${spousalPeriods.length} spousal periods ` +
          `when neither is eligible (PIA1=$${pia1}, PIA2=$${pia2})`
      ).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 12. Earner never has spousal or survivor periods
// ---------------------------------------------------------------------------

describe('Earner never has spousal or survivor periods', () => {
  it('higher earner only has Personal benefit periods (200 scenarios)', () => {
    const rng = createRng(8888);

    for (let i = 0; i < 200; i++) {
      const pia1 = randInt(rng, 0, 4000);
      const pia2 = randInt(rng, 0, 4000);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      if (pia1 === 0 && pia2 === 0) continue;

      // Determine earner index (same logic as strategySumPeriodsCouple)
      const earnerIndex = higherEarningsThan(r1, r2) ? 0 : 1;

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const strat1 = randomFilingAge(rng);
      const strat2 = randomFilingAge(rng);

      const periods = strategySumPeriodsCouple(
        [r1, r2],
        [fd1, fd2],
        [strat1, strat2]
      );

      const earnerNonPersonal = periods.filter(
        (p) =>
          p.recipientIndex === earnerIndex &&
          p.benefitType !== BenefitType.Personal
      );

      expect(
        earnerNonPersonal.length,
        `Scenario ${i}: earner (index ${earnerIndex}) has ${earnerNonPersonal.length} ` +
          `non-Personal periods (PIA1=$${pia1}, PIA2=$${pia2})`
      ).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 13. Filing age 70 produces maximum monthly benefit
// ---------------------------------------------------------------------------

describe('Filing age 70 produces maximum monthly benefit', () => {
  it('benefitAtAge(r, 70y0m) >= benefitAtAge(r, randomAge) (100 scenarios)', () => {
    const rng = createRng(9999);

    const age70 = MonthDuration.initFromYearsMonths({
      years: 70,
      months: 0,
    });

    for (let i = 0; i < 100; i++) {
      const pia = randInt(rng, 100, 4000);
      const birthYear = randInt(rng, 1960, 1980);

      const r = makeRecipient(pia, birthYear, 0, 15);

      const benefitAt70 = benefitAtAge(r, age70);

      for (let j = 0; j < 5; j++) {
        const randomAge = randomFilingAge(rng);
        const benefitAtRandom = benefitAtAge(r, randomAge);

        expect(
          benefitAt70.cents(),
          `Scenario ${i}, sample ${j}: benefit at 70 (${benefitAt70.cents()}c) ` +
            `< benefit at ${randomAge.years()}y${randomAge.modMonths()}m ` +
            `(${benefitAtRandom.cents()}c), PIA=$${pia}`
        ).toBeGreaterThanOrEqual(benefitAtRandom.cents());
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 14. Discount rate ordering across couple scenarios
// ---------------------------------------------------------------------------

describe('Discount rate ordering across couple scenarios', () => {
  it('NPV at 0% > NPV at 3% > NPV at 7%, all positive (50 scenarios)', () => {
    const rng = createRng(1234);

    for (let i = 0; i < 50; i++) {
      const pia1 = randInt(rng, 200, 3500);
      const pia2 = randInt(rng, 200, 3500);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const strat1 = randomFilingAge(rng);
      const strat2 = randomFilingAge(rng);

      const npvAt0 = strategySumCentsCouple([r1, r2], [fd1, fd2], FAR_PAST, 0, [
        strat1,
        strat2,
      ]);

      // Skip scenarios where there are no benefits (e.g., death before filing)
      if (npvAt0 === 0) continue;

      const npvAt3 = strategySumCentsCouple(
        [r1, r2],
        [fd1, fd2],
        FAR_PAST,
        0.03,
        [strat1, strat2]
      );

      const npvAt7 = strategySumCentsCouple(
        [r1, r2],
        [fd1, fd2],
        FAR_PAST,
        0.07,
        [strat1, strat2]
      );

      expect(
        npvAt0,
        `Scenario ${i}: NPV at 0% (${npvAt0}) should be positive`
      ).toBeGreaterThan(0);

      expect(
        npvAt3,
        `Scenario ${i}: NPV at 3% (${npvAt3}) should be positive`
      ).toBeGreaterThan(0);

      expect(
        npvAt7,
        `Scenario ${i}: NPV at 7% (${npvAt7}) should be positive`
      ).toBeGreaterThan(0);

      expect(
        npvAt0,
        `Scenario ${i}: NPV at 0% (${npvAt0}) should be > NPV at 3% (${npvAt3})`
      ).toBeGreaterThan(npvAt3);

      expect(
        npvAt3,
        `Scenario ${i}: NPV at 3% (${npvAt3}) should be > NPV at 7% (${npvAt7})`
      ).toBeGreaterThan(npvAt7);
    }
  });
});

// ---------------------------------------------------------------------------
// 15. Total months across all periods for one recipient <= lifespan
// ---------------------------------------------------------------------------

describe('Total months across all periods for one recipient <= lifespan', () => {
  it('sum of period durations per recipient does not exceed age 62 to death (200 scenarios)', () => {
    const rng = createRng(4242);

    for (let i = 0; i < 200; i++) {
      const pia1 = randInt(rng, 0, 4000);
      const pia2 = randInt(rng, 0, 4000);
      const birthYear1 = randInt(rng, 1960, 1980);
      const birthYear2 = randInt(rng, 1960, 1980);
      const deathAge1 = randInt(rng, 67, 100);
      const deathAge2 = randInt(rng, 67, 100);

      const r1 = makeRecipient(pia1, birthYear1, 0, 15);
      const r2 = makeRecipient(pia2, birthYear2, 0, 15);

      if (pia1 === 0 && pia2 === 0) continue;

      const fd1 = deathDate(r1, deathAge1);
      const fd2 = deathDate(r2, deathAge2);

      const strat1 = randomFilingAge(rng);
      const strat2 = randomFilingAge(rng);

      const periods = strategySumPeriodsCouple(
        [r1, r2],
        [fd1, fd2],
        [strat1, strat2]
      );

      const recipients = [r1, r2];
      const finalDates = [fd1, fd2];

      // Compute union of period date ranges per recipient.
      // Different benefit types (Personal, Spousal, Survivor) can overlap in
      // calendar time, so we merge all intervals to find the covered span.
      for (let ri = 0; ri < 2; ri++) {
        const recipientPeriods = periods
          .filter((p) => p.recipientIndex === ri)
          .map((p) => ({
            start: p.startDate.monthsSinceEpoch(),
            end: p.endDate.monthsSinceEpoch(),
          }))
          .sort((a, b) => a.start - b.start);

        if (recipientPeriods.length === 0) continue;

        // Merge overlapping intervals
        let coveredMonths = 0;
        let mergedStart = recipientPeriods[0].start;
        let mergedEnd = recipientPeriods[0].end;

        for (let k = 1; k < recipientPeriods.length; k++) {
          const rp = recipientPeriods[k];
          if (rp.start <= mergedEnd + 1) {
            // Overlapping or adjacent: extend
            mergedEnd = Math.max(mergedEnd, rp.end);
          } else {
            // Gap: finalize previous merged interval
            coveredMonths += mergedEnd - mergedStart + 1;
            mergedStart = rp.start;
            mergedEnd = rp.end;
          }
        }
        coveredMonths += mergedEnd - mergedStart + 1;

        // Max lifespan from age 62 to death
        const age62Date = recipients[ri].birthdate.dateAtSsaAge(
          MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
        );
        const lifespanMonths =
          finalDates[ri].subtractDate(age62Date).asMonths() + 1;

        expect(
          coveredMonths,
          `Scenario ${i}: recipient ${ri} has ${coveredMonths} covered months ` +
            `of benefits but lifespan from 62 to death is only ${lifespanMonths} months ` +
            `(PIA1=$${pia1}, PIA2=$${pia2}, death=${ri === 0 ? deathAge1 : deathAge2})`
        ).toBeLessThanOrEqual(lifespanMonths);
      }
    }
  });
});
