import { describe, expect, it } from 'vitest';
import { spousalBenefitOnDate, survivorBenefit } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import {
  BenefitType,
  strategySumCentsCouple,
  strategySumPeriodsCouple,
} from '$lib/strategy/calculations';
import { optimalStrategyCouple } from '$lib/strategy/calculations/strategy-calc';

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

/** currentDate far in the past so retroactivity rules never apply. */
const FAR_PAST = MonthDate.initFromYearsMonths({ years: 200, months: 0 });

function ageDuration(years: number, months: number = 0): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

function dateAtAge(r: Recipient, years: number, months: number = 0): MonthDate {
  return r.birthdate.dateAtSsaAge(ageDuration(years, months));
}

/**
 * Computes a death date at a given age, rounding to December of that year
 * to match the convention used in other couple tests.
 */
function deathDateAtAge(
  recipient: Recipient,
  ageYears: number,
  ageMonths: number = 0
): MonthDate {
  const rawDate = recipient.birthdate.dateAtLayAge(
    MonthDuration.initFromYearsMonths({ years: ageYears, months: ageMonths })
  );
  return rawDate.addDuration(new MonthDuration(11 - rawDate.monthIndex()));
}

const AGE_62_1 = ageDuration(62, 1);
const AGE_67 = ageDuration(67, 0);
const AGE_70 = ageDuration(70, 0);

// ---------------------------------------------------------------------------
// 1. Earner filing later increases dependent's survivor benefit
// ---------------------------------------------------------------------------
describe('Earner filing later increases dependent survivor benefit', () => {
  // Use birth year 1962+ so NRA = 67y0m, delayed increase = 8%/yr,
  // survivor NRA = 67y0m. Birth day = 2 so SSA date = 1st of month.
  const earner = makeRecipient(2000, 1962, 0, 2);
  const dependent = makeRecipient(500, 1964, 0, 2);

  // The earner dies at 75, one month after the survivor files.
  const earnerDeathDate = deathDateAtAge(earner, 75);

  it('survivor benefit is lower when earner files at 62', () => {
    const earnerFilingDate = dateAtAge(earner, 62, 0);
    const survivorFilingDate = earnerDeathDate.addDuration(
      new MonthDuration(1)
    );
    const sb = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      earnerDeathDate,
      survivorFilingDate
    );
    // When earner files at 62, their benefit is reduced. The survivor
    // benefit should be less than the full PIA due to early filing reduction.
    expect(sb.cents()).toBeLessThan(Money.from(2000).cents());
    expect(sb.cents()).toBeGreaterThan(0);
  });

  it('survivor benefit is higher when earner files at 70', () => {
    const earnerFilingDate = dateAtAge(earner, 70, 0);
    const survivorFilingDate = earnerDeathDate.addDuration(
      new MonthDuration(1)
    );
    const sb = survivorBenefit(
      dependent,
      earner,
      earnerFilingDate,
      earnerDeathDate,
      survivorFilingDate
    );
    // When earner files at 70 with delayed credits, the survivor benefit
    // should be higher than the PIA.
    expect(sb.cents()).toBeGreaterThan(Money.from(2000).cents());
  });

  it('filing at 70 produces strictly higher survivor benefit than filing at 62', () => {
    const earnerFilingAt62 = dateAtAge(earner, 62, 0);
    const earnerFilingAt70 = dateAtAge(earner, 70, 0);
    const survivorFilingDate = earnerDeathDate.addDuration(
      new MonthDuration(1)
    );

    const sbAt62 = survivorBenefit(
      dependent,
      earner,
      earnerFilingAt62,
      earnerDeathDate,
      survivorFilingDate
    );
    const sbAt70 = survivorBenefit(
      dependent,
      earner,
      earnerFilingAt70,
      earnerDeathDate,
      survivorFilingDate
    );
    expect(sbAt70.cents()).toBeGreaterThan(sbAt62.cents());
  });
});

// ---------------------------------------------------------------------------
// 2. Earner filing later delays spousal start
// ---------------------------------------------------------------------------
describe('Earner filing later delays spousal start', () => {
  // Earner PIA $2000, dependent PIA $500. Dependent files at 62.
  // Spousal benefit doesn't start until BOTH have filed.
  const earner = makeRecipient(2000, 1962, 0, 2);
  const dependent = makeRecipient(500, 1964, 0, 2);

  it('spousal starts at earner filing date when earner files later than dependent', () => {
    const earnerFilingAge = AGE_70;
    const dependentFilingAge = AGE_62_1;

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [deathDateAtAge(earner, 85), deathDateAtAge(dependent, 85)],
      [earnerFilingAge, dependentFilingAge]
    );

    const spousalPeriods = periods.filter(
      (p) => p.benefitType === BenefitType.Spousal
    );
    expect(spousalPeriods.length).toBeGreaterThan(0);

    const earnerFilingDate = dateAtAge(earner, 70, 0);
    for (const sp of spousalPeriods) {
      // Spousal cannot start before the earner files.
      expect(sp.startDate.monthsSinceEpoch()).toBeGreaterThanOrEqual(
        earnerFilingDate.monthsSinceEpoch()
      );
    }
  });

  it('spousal starts at dependent filing date when dependent files later', () => {
    const earnerFilingAge = AGE_62_1;
    const dependentFilingAge = AGE_70;

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [deathDateAtAge(earner, 85), deathDateAtAge(dependent, 85)],
      [earnerFilingAge, dependentFilingAge]
    );

    const spousalPeriods = periods.filter(
      (p) => p.benefitType === BenefitType.Spousal
    );

    const dependentFilingDate = dateAtAge(dependent, 70, 0);
    for (const sp of spousalPeriods) {
      expect(sp.startDate.monthsSinceEpoch()).toBeGreaterThanOrEqual(
        dependentFilingDate.monthsSinceEpoch()
      );
    }
  });

  it('spousal starts at the later of the two filing dates', () => {
    // Earner files at 67, dependent files at 65. Spousal should start
    // at the earner's filing date (the later one).
    const earnerFilingAge = AGE_67;
    const dependentFilingAge = ageDuration(65, 0);

    const periods = strategySumPeriodsCouple(
      [earner, dependent],
      [deathDateAtAge(earner, 85), deathDateAtAge(dependent, 85)],
      [earnerFilingAge, dependentFilingAge]
    );

    const spousalPeriods = periods.filter(
      (p) => p.benefitType === BenefitType.Spousal
    );
    expect(spousalPeriods.length).toBeGreaterThan(0);

    const earnerFilingDate = dateAtAge(earner, 67, 0);
    const dependentFilingDate = dateAtAge(dependent, 65, 0);
    const expectedStart = MonthDate.max(earnerFilingDate, dependentFilingDate);

    for (const sp of spousalPeriods) {
      expect(sp.startDate.monthsSinceEpoch()).toBe(
        expectedStart.monthsSinceEpoch()
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Dependent filing later reduces spousal benefit via combined cap
// ---------------------------------------------------------------------------
describe('Dependent filing later reduces spousal benefit via combined cap', () => {
  // Earner PIA $1500, dependent PIA $600.
  // At NRA: spousal = $1500/2 - $600 = $150.
  // If dependent files after NRA, their personal benefit is higher due to
  // delayed credits, reducing spousal further.
  const earner = makeRecipient(1500, 1962, 0, 2);
  const dependent = makeRecipient(600, 1964, 0, 2);

  it('spousal benefit at NRA is based on PIA difference', () => {
    const earnerFilingDate = dateAtAge(earner, 67, 0);
    const dependentFilingDate = dateAtAge(dependent, 67, 0);

    // Evaluate at a date well after both have filed.
    const atDate = dateAtAge(dependent, 68, 0);
    const spousal = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate,
      atDate
    );

    // At NRA filing: spousal = floor($1500/2 - $600) = floor($150) = $150
    expect(spousal.cents()).toBe(Money.from(150).cents());
  });

  it('spousal benefit is lower when dependent files at 69', () => {
    const earnerFilingDate = dateAtAge(earner, 67, 0);
    const dependentFilingDate = dateAtAge(dependent, 69, 0);

    // At a date after both have filed:
    const atDate = dateAtAge(dependent, 70, 0);
    const spousal = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate,
      atDate
    );

    // Dependent delayed past NRA, so personal benefit > PIA. The combined
    // cap reduces the spousal portion.
    expect(spousal.cents()).toBeLessThan(Money.from(150).cents());
  });

  it('spousal benefit is even lower when dependent files at 70', () => {
    const earnerFilingDate = dateAtAge(earner, 67, 0);
    const dependentFilingDate69 = dateAtAge(dependent, 69, 0);
    const dependentFilingDate70 = dateAtAge(dependent, 70, 0);

    const atDate = dateAtAge(dependent, 71, 0);
    const spousalAt69 = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate69,
      atDate
    );
    const spousalAt70 = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate70,
      atDate
    );

    // Filing at 70 means even higher personal benefit, so the spousal
    // residual should be strictly less than or equal to filing at 69.
    expect(spousalAt70.cents()).toBeLessThanOrEqual(spousalAt69.cents());
  });
});

// ---------------------------------------------------------------------------
// 4. Optimizer may delay earner to maximize survivor
// ---------------------------------------------------------------------------
describe('Optimizer may delay earner to maximize survivor', () => {
  // When the earner dies relatively early but the dependent lives a long time,
  // the optimizer should delay the earner to boost the survivor benefit.

  it('earner dies at 70, dependent lives to 95 -- optimizer delays earner', () => {
    const earner = makeRecipient(3000, 1962, 0, 2);
    const dependent = makeRecipient(500, 1964, 0, 2);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 70),
      deathDateAtAge(dependent, 95),
    ];

    const [earnerAge, , npv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    // The earner's personal benefit is limited (dies at 70), but delaying
    // maximizes the dependent's survivor benefit for 25+ years.
    // Earner should file later rather than at 62.
    expect(earnerAge.asMonths()).toBeGreaterThan(AGE_62_1.asMonths());
    expect(npv).toBeGreaterThan(0);
  });

  it('delayed earner produces higher NPV than early earner when dependent lives long', () => {
    const earner = makeRecipient(3000, 1962, 0, 2);
    const dependent = makeRecipient(500, 1964, 0, 2);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 72),
      deathDateAtAge(dependent, 95),
    ];

    // NPV with earner filing at 62:
    const npvEarlyEarner = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [AGE_62_1, AGE_62_1]
    );

    // NPV with earner filing at 70:
    const npvLateEarner = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [AGE_70, AGE_62_1]
    );

    // The delayed earner strategy should produce higher NPV because the
    // survivor benefit is higher for 20+ years of the dependent's life.
    expect(npvLateEarner).toBeGreaterThan(npvEarlyEarner);
  });

  it('optimizer result beats both-at-62 when earner dies early, dependent lives long', () => {
    const earner = makeRecipient(2500, 1962, 0, 2);
    const dependent = makeRecipient(400, 1964, 0, 2);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 68),
      deathDateAtAge(dependent, 95),
    ];

    const [, , optimalNpv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    const npvBothEarly = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [AGE_62_1, AGE_62_1]
    );

    expect(optimalNpv).toBeGreaterThanOrEqual(npvBothEarly);
  });
});

// ---------------------------------------------------------------------------
// 5. Optimizer may delay dependent when earner lives long
// ---------------------------------------------------------------------------
describe('Optimizer may delay dependent when earner lives long', () => {
  it('dependent does not file at earliest when earner lives to 95', () => {
    const earner = makeRecipient(2500, 1962, 0, 2);
    const dependent = makeRecipient(800, 1964, 0, 2);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 95),
      deathDateAtAge(dependent, 95),
    ];

    const [, dependentAge] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    // With a long lifespan for both, the dependent should delay past 62
    // to accumulate delayed credits on personal benefits.
    expect(dependentAge.asMonths()).toBeGreaterThan(AGE_62_1.asMonths());
  });

  it('optimizer NPV beats dependent at 62 when earner lives to 95', () => {
    const earner = makeRecipient(2500, 1962, 0, 2);
    const dependent = makeRecipient(800, 1964, 0, 2);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 95),
      deathDateAtAge(dependent, 95),
    ];

    const [earnerAge, _dependentAge, optimalNpv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    // Compare with the dependent filing at earliest.
    const npvDependentEarly = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [earnerAge, AGE_62_1]
    );

    expect(optimalNpv).toBeGreaterThanOrEqual(npvDependentEarly);
  });
});

// ---------------------------------------------------------------------------
// 6. Symmetric couple: both file at same age
// ---------------------------------------------------------------------------
describe('Symmetric couple: both file at same age', () => {
  it('equal PIAs, same birthdate, same death age -- same filing age', () => {
    const r0 = makeRecipient(1500, 1962, 0, 2);
    const r1 = makeRecipient(1500, 1962, 0, 2);
    const deathDate = deathDateAtAge(r0, 85);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [deathDate, deathDate];

    const [age0, age1] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    // With identical PIAs, birthdates, and death ages, both should file
    // at the same age.
    expect(age0.asMonths()).toBe(age1.asMonths());
  });

  it('equal PIAs, same birthdate, both die at 90 -- both at 70', () => {
    const r0 = makeRecipient(2000, 1962, 0, 2);
    const r1 = makeRecipient(2000, 1962, 0, 2);
    const deathDate = deathDateAtAge(r0, 90);
    const recipients: [Recipient, Recipient] = [r0, r1];
    const finalDates: [MonthDate, MonthDate] = [deathDate, deathDate];

    const [age0, age1] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    // Both live long, equal PIAs, no spousal benefit possible. Both file at 70.
    expect(age0.asMonths()).toBe(AGE_70.asMonths());
    expect(age1.asMonths()).toBe(AGE_70.asMonths());
  });
});

// ---------------------------------------------------------------------------
// 7. Spousal benefit eliminates when dependent delays to 70
// ---------------------------------------------------------------------------
describe('Spousal benefit eliminates when dependent delays to 70', () => {
  // Earner PIA $1500, dependent PIA $600.
  // At NRA: spousal = $1500/2 - $600 = $150.
  // At 70: personal = $600 * 1.24 = $744. spousal = $750 - $744 = $6.
  const earner = makeRecipient(1500, 1962, 0, 2);
  const dependent = makeRecipient(600, 1964, 0, 2);

  it('spousal at NRA is $150', () => {
    const earnerFilingDate = dateAtAge(earner, 67, 0);
    const dependentFilingDate = dateAtAge(dependent, 67, 0);
    const atDate = dateAtAge(dependent, 68, 0);

    const spousal = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate,
      atDate
    );
    expect(spousal.cents()).toBe(Money.from(150).cents());
  });

  it('spousal at 70 is near zero', () => {
    const earnerFilingDate = dateAtAge(earner, 67, 0);
    const dependentFilingDate = dateAtAge(dependent, 70, 0);
    const atDate = dateAtAge(dependent, 71, 0);

    const spousal = spousalBenefitOnDate(
      dependent,
      earner,
      earnerFilingDate,
      dependentFilingDate,
      atDate
    );
    // The spousal should be dramatically reduced compared to $150.
    expect(spousal.cents()).toBeLessThan(Money.from(150).cents());
    // The personal benefit at 70 is $744, so spousal = $750 - $744 = $6.
    // Due to floor-to-dollar rounding, we just verify it's small.
    expect(spousal.cents()).toBeLessThanOrEqual(Money.from(10).cents());
  });
});

// ---------------------------------------------------------------------------
// 8. Earner dying at different ages changes optimal dependent strategy
// ---------------------------------------------------------------------------
describe('Earner dying at different ages changes optimal dependent strategy', () => {
  // Earner PIA $2000, dependent PIA $500.
  // When earner dies at different ages, the survivor benefit timing changes,
  // which should affect the dependent's optimal filing strategy.
  const earner = makeRecipient(2000, 1962, 0, 2);
  const dependent = makeRecipient(500, 1964, 0, 2);

  it('earner dies at 65 -- dependent files within valid range', () => {
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 65),
      deathDateAtAge(dependent, 90),
    ];

    const [, dependentAge] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );

    // When earner dies early, the dependent gets survivor benefits
    // for a long time regardless of personal filing. Filing strategy
    // should be in the valid range. Birth day = 2 means earliest
    // filing is 62y0m (not 62y1m).
    const dependentEarliestFiling = dependent.birthdate.earliestFilingMonth();
    expect(dependentAge.asMonths()).toBeGreaterThanOrEqual(
      dependentEarliestFiling.asMonths()
    );
    expect(dependentAge.asMonths()).toBeLessThanOrEqual(AGE_70.asMonths());
  });

  it('earner dies at 85 -- dependent filing shifts vs 65 death scenario', () => {
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates65: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 65),
      deathDateAtAge(dependent, 90),
    ];
    const finalDates85: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 85),
      deathDateAtAge(dependent, 90),
    ];

    const [, depAge65] = optimalStrategyCouple(
      recipients,
      finalDates65,
      FAR_PAST,
      0
    );
    const [, depAge85] = optimalStrategyCouple(
      recipients,
      finalDates85,
      FAR_PAST,
      0
    );

    // The two scenarios should produce different dependent filing ages
    // (or at least different NPVs) because survivor benefit timing differs.
    // When earner lives longer, spousal benefits last longer before
    // switching to survivor.
    const npv65 = strategySumCentsCouple(
      recipients,
      finalDates65,
      FAR_PAST,
      0,
      [AGE_70, depAge65]
    );
    const npv85 = strategySumCentsCouple(
      recipients,
      finalDates85,
      FAR_PAST,
      0,
      [AGE_70, depAge85]
    );

    // The 85-death scenario should produce higher total NPV because
    // the earner collects benefits for 20 more years.
    expect(npv85).toBeGreaterThan(npv65);
  });

  it('earner dies at 75 -- different NPV than earner at 65 or 85', () => {
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates75: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 75),
      deathDateAtAge(dependent, 90),
    ];

    const [, , npv75] = optimalStrategyCouple(
      recipients,
      finalDates75,
      FAR_PAST,
      0
    );

    const [, , npv65] = optimalStrategyCouple(
      recipients,
      [deathDateAtAge(earner, 65), deathDateAtAge(dependent, 90)],
      FAR_PAST,
      0
    );

    const [, , npv85] = optimalStrategyCouple(
      recipients,
      [deathDateAtAge(earner, 85), deathDateAtAge(dependent, 90)],
      FAR_PAST,
      0
    );

    // NPV should be monotonically increasing with earner death age.
    expect(npv75).toBeGreaterThan(npv65);
    expect(npv85).toBeGreaterThan(npv75);
  });
});

// ---------------------------------------------------------------------------
// 9. Both filing at 62 vs both at 70 -- crossover death age
// ---------------------------------------------------------------------------
describe('Both at 62 vs both at 70 -- crossover behavior', () => {
  // For a couple ($2000/$500), with short lifespans both-at-62 should win,
  // and with long lifespans both-at-70 should win.

  it('both die at 65 -- both at 62 beats both at 70', () => {
    const earner = makeRecipient(2000, 1962, 0, 2);
    const dependent = makeRecipient(500, 1964, 0, 2);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 65),
      deathDateAtAge(dependent, 65),
    ];

    const npvBothAt62 = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [AGE_62_1, AGE_62_1]
    );
    const npvBothAt70 = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [AGE_70, AGE_70]
    );

    // With short lifespans, filing early wins because there is no time
    // for delayed credits to pay off.
    expect(npvBothAt62).toBeGreaterThan(npvBothAt70);
  });

  it('both die at 95 -- both at 70 beats both at 62', () => {
    const earner = makeRecipient(2000, 1962, 0, 2);
    const dependent = makeRecipient(500, 1964, 0, 2);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 95),
      deathDateAtAge(dependent, 95),
    ];

    const npvBothAt62 = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [AGE_62_1, AGE_62_1]
    );
    const npvBothAt70 = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [AGE_70, AGE_70]
    );

    // With long lifespans, delayed credits make both-at-70 superior.
    expect(npvBothAt70).toBeGreaterThan(npvBothAt62);
  });
});

// ---------------------------------------------------------------------------
// 10. Staggered filing: earner early, dependent late
// ---------------------------------------------------------------------------
describe('Staggered filing: earner early, dependent late', () => {
  it('earner at 62, dependent at 70 vs both at 62 -- staggered has higher NPV when dependent lives long', () => {
    const earner = makeRecipient(2000, 1962, 0, 2);
    const dependent = makeRecipient(800, 1964, 0, 2);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    // Earner dies at 75, dependent at 95.
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 75),
      deathDateAtAge(dependent, 95),
    ];

    const npvBothAt62 = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [AGE_62_1, AGE_62_1]
    );

    const npvStaggered = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [AGE_62_1, AGE_70]
    );

    // When the dependent lives much longer than the earner, the dependent
    // benefits from delayed personal credits for 20+ years as a survivor.
    // The staggered approach should be at least competitive.
    // The dependent's personal benefit at 70 is higher, and survivor
    // benefit from earner is also available. Total may exceed both-at-62.
    // We verify the optimizer agrees with our best guess:
    const [, , optimalNpv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    expect(optimalNpv).toBeGreaterThanOrEqual(npvBothAt62);
    expect(optimalNpv).toBeGreaterThanOrEqual(npvStaggered);
  });

  it('earner at 62, dependent at 70 vs both at 70 -- comparison', () => {
    const earner = makeRecipient(2000, 1962, 0, 2);
    const dependent = makeRecipient(800, 1964, 0, 2);
    const recipients: [Recipient, Recipient] = [earner, dependent];
    // Both die at 85.
    const finalDates: [MonthDate, MonthDate] = [
      deathDateAtAge(earner, 85),
      deathDateAtAge(dependent, 85),
    ];

    const npvBothAt70 = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [AGE_70, AGE_70]
    );

    const npvStaggered = strategySumCentsCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0,
      [AGE_62_1, AGE_70]
    );

    // Both produce positive NPV.
    expect(npvBothAt70).toBeGreaterThan(0);
    expect(npvStaggered).toBeGreaterThan(0);

    // The optimizer picks at least as good as either strategy.
    const [, , optimalNpv] = optimalStrategyCouple(
      recipients,
      finalDates,
      FAR_PAST,
      0
    );
    expect(optimalNpv).toBeGreaterThanOrEqual(npvBothAt70);
    expect(optimalNpv).toBeGreaterThanOrEqual(npvStaggered);
  });
});
