import { describe, expect, it } from 'vitest';
import { benefitAtAge, benefitOnDate } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

/**
 * Creates a Recipient in PIA-only mode with the given PIA and birthdate.
 *
 * @param piaDollars PIA in whole dollars
 * @param birthYear Lay birth year
 * @param birthMonth Lay birth month (0-indexed: 0=Jan, 11=Dec)
 * @param birthDay Lay birth day (1-indexed)
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

function age(years: number, months: number): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

/**
 * Computes the expected benefit in cents using the SSA formula.
 *
 * The benefitAtAge function does:
 *   floor(PIA to dollar) -> multiply by (1 + multiplier) -> floor to dollar
 *
 * Money.times(factor) internally computes Math.round(cents * factor),
 * then floorToDollar does Math.floor(cents / 100) * 100.
 *
 * @param piaCents PIA in cents (already floored to dollar by benefitAtAge)
 * @param nraMonths NRA in total months
 * @param ageMonths Filing age in total months
 * @param delayedIncrease Annual delayed retirement increase (e.g. 0.08)
 * @returns Expected benefit in cents
 */
function expectedBenefitCents(
  piaCents: number,
  nraMonths: number,
  ageMonths: number,
  delayedIncrease: number
): number {
  // Floor PIA to whole dollar first
  const piaFloored = Math.floor(piaCents / 100) * 100;

  let multiplier: number;
  if (ageMonths < nraMonths) {
    // Early filing
    const monthsBefore = nraMonths - ageMonths;
    multiplier =
      -1.0 *
      ((Math.min(36, monthsBefore) * 5) / 900 +
        (Math.max(0, monthsBefore - 36) * 5) / 1200);
  } else {
    // At or after NRA
    const monthsAfter = ageMonths - nraMonths;
    multiplier = (delayedIncrease / 12) * monthsAfter;
  }

  // Money.times does Math.round(cents * factor)
  const afterMultiply = Math.round(piaFloored * (1 + multiplier));
  // Then floorToDollar
  return Math.floor(afterMultiply / 100) * 100;
}

// ---------------------------------------------------------------------------
// 1. benefitAtAge at NRA
// ---------------------------------------------------------------------------

describe('benefitAtAge at NRA', () => {
  // For births 1960+, NRA = 67y0m. At NRA, multiplier = 0, benefit = PIA.
  // Use birthdate mid-month (e.g. 15th) to avoid SSA birth year shifting.

  it('PIA $1000 at NRA returns $1000', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    const result = benefitAtAge(r, age(67, 0));
    expect(result.cents()).toBe(100000);
  });

  it('PIA $1500 at NRA returns $1500', () => {
    const r = makeRecipient(1500, 1970, 3, 15);
    const result = benefitAtAge(r, age(67, 0));
    expect(result.cents()).toBe(150000);
  });

  it('PIA $2000 at NRA returns $2000', () => {
    const r = makeRecipient(2000, 1975, 8, 15);
    const result = benefitAtAge(r, age(67, 0));
    expect(result.cents()).toBe(200000);
  });

  it('PIA $3822 at NRA returns $3822', () => {
    const r = makeRecipient(3822, 1962, 6, 10);
    const result = benefitAtAge(r, age(67, 0));
    expect(result.cents()).toBe(382200);
  });

  it('PIA $50 at NRA returns $50', () => {
    const r = makeRecipient(50, 1980, 11, 20);
    const result = benefitAtAge(r, age(67, 0));
    expect(result.cents()).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// 2. benefitAtAge early filing - round years
// ---------------------------------------------------------------------------

describe('benefitAtAge early filing - round years', () => {
  // All use births 1960+ (NRA = 67y0m, delayed increase = 0.08).
  // Use birthdate on the 15th to keep SSA birth year = lay birth year.
  const nra = 67 * 12;
  const delay = 0.08;

  // --- PIA $1000 ---

  it('PIA $1000 at age 62y0m', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // 60 months early: min(36,60)*5/900 + max(0,24)*5/1200 = 0.2 + 0.1 = 0.3
    // benefit = floor(round(100000 * 0.7) / 100) * 100 = floor(70000/100)*100
    const expected = expectedBenefitCents(100000, nra, 62 * 12, delay);
    expect(expected).toBe(70000); // $700
    expect(benefitAtAge(r, age(62, 0)).cents()).toBe(expected);
  });

  it('PIA $1000 at age 63y0m', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // 48 months early: 36*5/900 + 12*5/1200 = 0.2 + 0.05 = 0.25
    const expected = expectedBenefitCents(100000, nra, 63 * 12, delay);
    expect(expected).toBe(75000); // $750
    expect(benefitAtAge(r, age(63, 0)).cents()).toBe(expected);
  });

  it('PIA $1000 at age 64y0m', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // 36 months early: 36*5/900 = 0.2
    const expected = expectedBenefitCents(100000, nra, 64 * 12, delay);
    expect(expected).toBe(80000); // $800
    expect(benefitAtAge(r, age(64, 0)).cents()).toBe(expected);
  });

  it('PIA $1000 at age 65y0m', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // 24 months early: 24*5/900 = 0.13333...
    // round(100000 * 0.86666...) = round(86666.66...) = 86667
    // floor(86667/100)*100 = 86600
    const expected = expectedBenefitCents(100000, nra, 65 * 12, delay);
    expect(expected).toBe(86600); // $866
    expect(benefitAtAge(r, age(65, 0)).cents()).toBe(expected);
  });

  it('PIA $1000 at age 66y0m', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // 12 months early: 12*5/900 = 0.06666...
    // round(100000 * 0.93333...) = round(93333.33...) = 93333
    // floor(93333/100)*100 = 93300
    const expected = expectedBenefitCents(100000, nra, 66 * 12, delay);
    expect(expected).toBe(93300); // $933
    expect(benefitAtAge(r, age(66, 0)).cents()).toBe(expected);
  });

  // --- PIA $1500 ---

  it('PIA $1500 at age 62y0m', () => {
    const r = makeRecipient(1500, 1968, 7, 15);
    // 0.3 reduction -> 1500*0.7 = 1050
    const expected = expectedBenefitCents(150000, nra, 62 * 12, delay);
    expect(expected).toBe(105000); // $1050
    expect(benefitAtAge(r, age(62, 0)).cents()).toBe(expected);
  });

  it('PIA $1500 at age 64y0m', () => {
    const r = makeRecipient(1500, 1968, 7, 15);
    // 0.2 reduction -> 1500*0.8 = 1200
    const expected = expectedBenefitCents(150000, nra, 64 * 12, delay);
    expect(expected).toBe(120000); // $1200
    expect(benefitAtAge(r, age(64, 0)).cents()).toBe(expected);
  });

  // --- PIA $2000 ---

  it('PIA $2000 at age 62y0m', () => {
    const r = makeRecipient(2000, 1972, 2, 15);
    // 0.3 reduction -> 2000*0.7 = 1400
    const expected = expectedBenefitCents(200000, nra, 62 * 12, delay);
    expect(expected).toBe(140000); // $1400
    expect(benefitAtAge(r, age(62, 0)).cents()).toBe(expected);
  });

  it('PIA $2000 at age 65y0m', () => {
    const r = makeRecipient(2000, 1972, 2, 15);
    // 24 months early: reduction = 24*5/900 = 0.13333...
    // round(200000 * 0.86666...) = round(173333.33...) = 173333
    // floor(173333/100)*100 = 173300
    const expected = expectedBenefitCents(200000, nra, 65 * 12, delay);
    expect(expected).toBe(173300); // $1733
    expect(benefitAtAge(r, age(65, 0)).cents()).toBe(expected);
  });

  it('PIA $2000 at age 66y0m', () => {
    const r = makeRecipient(2000, 1972, 2, 15);
    // 12 months early: reduction = 12*5/900 = 0.06666...
    // round(200000 * 0.93333...) = round(186666.66...) = 186667
    // floor(186667/100)*100 = 186600
    const expected = expectedBenefitCents(200000, nra, 66 * 12, delay);
    expect(expected).toBe(186600); // $1866
    expect(benefitAtAge(r, age(66, 0)).cents()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 3. benefitAtAge early filing - specific months
// ---------------------------------------------------------------------------

describe('benefitAtAge early filing - specific months', () => {
  const nra = 67 * 12;
  const delay = 0.08;

  it('PIA $1000 at age 62y1m (59 months early)', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // 59 months early: min(36,59)*5/900 + max(0,23)*5/1200
    // = 0.2 + 23*5/1200 = 0.2 + 115/1200
    const expected = expectedBenefitCents(100000, nra, 62 * 12 + 1, delay);
    expect(benefitAtAge(r, age(62, 1)).cents()).toBe(expected);
  });

  it('PIA $1000 at age 62y6m (54 months early)', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // 54 months early: 36*5/900 + 18*5/1200 = 0.2 + 0.075 = 0.275
    // round(100000 * 0.725) = 72500
    // floor(72500/100)*100 = 72500
    const expected = expectedBenefitCents(100000, nra, 62 * 12 + 6, delay);
    expect(expected).toBe(72500); // $725
    expect(benefitAtAge(r, age(62, 6)).cents()).toBe(expected);
  });

  it('PIA $1234 at age 63y3m (45 months early)', () => {
    const r = makeRecipient(1234, 1965, 5, 15);
    // 45 months early: 36*5/900 + 9*5/1200 = 0.2 + 0.0375 = 0.2375
    // PIA floored = 123400 (already whole dollar)
    // round(123400 * (1 - 0.2375)) = round(123400 * 0.7625) = round(94092.5) = 94093
    // floor(94093/100)*100 = 94000
    const expected = expectedBenefitCents(123400, nra, 63 * 12 + 3, delay);
    expect(benefitAtAge(r, age(63, 3)).cents()).toBe(expected);
  });

  it('PIA $2777 at age 64y9m (27 months early)', () => {
    const r = makeRecipient(2777, 1965, 5, 15);
    // 27 months early: 27*5/900 = 0.15
    // PIA floored = 277700
    // round(277700 * 0.85) = round(236045) = 236045
    // floor(236045/100)*100 = 236000
    const expected = expectedBenefitCents(277700, nra, 64 * 12 + 9, delay);
    expect(expected).toBe(236000); // $2360
    expect(benefitAtAge(r, age(64, 9)).cents()).toBe(expected);
  });

  it('PIA $1000 at age 65y6m (18 months early)', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // 18 months early: 18*5/900 = 0.1
    // round(100000 * 0.9) = 90000
    const expected = expectedBenefitCents(100000, nra, 65 * 12 + 6, delay);
    expect(expected).toBe(90000); // $900
    expect(benefitAtAge(r, age(65, 6)).cents()).toBe(expected);
  });

  it('PIA $1234 at age 66y6m (6 months early)', () => {
    const r = makeRecipient(1234, 1965, 5, 15);
    // 6 months early: 6*5/900 = 0.03333...
    // round(123400 * 0.96666...) = round(119286.66...) = 119287
    // floor(119287/100)*100 = 119200
    const expected = expectedBenefitCents(123400, nra, 66 * 12 + 6, delay);
    expect(benefitAtAge(r, age(66, 6)).cents()).toBe(expected);
  });

  it('PIA $2777 at age 66y11m (1 month early)', () => {
    const r = makeRecipient(2777, 1965, 5, 15);
    // 1 month early: 1*5/900 = 0.005555...
    // round(277700 * 0.99444...) = round(276157.777...) = 276158
    // floor(276158/100)*100 = 276100
    const expected = expectedBenefitCents(277700, nra, 66 * 12 + 11, delay);
    expect(benefitAtAge(r, age(66, 11)).cents()).toBe(expected);
  });

  it('PIA $1000 at age 64y1m (35 months early)', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // 35 months early: exactly within the first 36 month band
    // 35*5/900 = 0.19444...
    // round(100000 * 0.80555...) = round(80555.55...) = 80556
    // floor(80556/100)*100 = 80500
    const expected = expectedBenefitCents(100000, nra, 64 * 12 + 1, delay);
    expect(expected).toBe(80500); // $805
    expect(benefitAtAge(r, age(64, 1)).cents()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 4. benefitAtAge delayed filing
// ---------------------------------------------------------------------------

describe('benefitAtAge delayed filing', () => {
  const nra = 67 * 12;
  const delay = 0.08;

  it('PIA $1000 at age 67y1m (1 month delayed)', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // increase = 0.08/12 * 1
    // round(100000 * (1 + 0.08/12)) = round(100000 * 1.006666...) = round(100666.66...) = 100667
    // floor(100667/100)*100 = 100600
    const expected = expectedBenefitCents(100000, nra, 67 * 12 + 1, delay);
    expect(expected).toBe(100600); // $1006
    expect(benefitAtAge(r, age(67, 1)).cents()).toBe(expected);
  });

  it('PIA $1000 at age 67y6m (6 months delayed)', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // increase = 0.08/12 * 6 = 0.04
    // round(100000 * 1.04) = 104000
    const expected = expectedBenefitCents(100000, nra, 67 * 12 + 6, delay);
    expect(expected).toBe(104000); // $1040
    expect(benefitAtAge(r, age(67, 6)).cents()).toBe(expected);
  });

  it('PIA $1000 at age 68y0m (12 months delayed)', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // increase = 0.08/12 * 12 = 0.08
    // round(100000 * 1.08) = 108000
    const expected = expectedBenefitCents(100000, nra, 68 * 12, delay);
    expect(expected).toBe(108000); // $1080
    expect(benefitAtAge(r, age(68, 0)).cents()).toBe(expected);
  });

  it('PIA $1500 at age 68y6m (18 months delayed)', () => {
    const r = makeRecipient(1500, 1968, 7, 15);
    // increase = 0.08/12 * 18 = 0.12
    // round(150000 * 1.12) = 168000
    const expected = expectedBenefitCents(150000, nra, 68 * 12 + 6, delay);
    expect(expected).toBe(168000); // $1680
    expect(benefitAtAge(r, age(68, 6)).cents()).toBe(expected);
  });

  it('PIA $2000 at age 69y0m (24 months delayed)', () => {
    const r = makeRecipient(2000, 1972, 2, 15);
    // increase = 0.08/12 * 24 = 0.16
    // round(200000 * 1.16) = 232000
    const expected = expectedBenefitCents(200000, nra, 69 * 12, delay);
    expect(expected).toBe(232000); // $2320
    expect(benefitAtAge(r, age(69, 0)).cents()).toBe(expected);
  });

  it('PIA $1234 at age 69y6m (30 months delayed)', () => {
    const r = makeRecipient(1234, 1965, 5, 15);
    // increase = 0.08/12 * 30 = 0.2
    // round(123400 * 1.2) = round(148080) = 148080
    // floor(148080/100)*100 = 148000
    const expected = expectedBenefitCents(123400, nra, 69 * 12 + 6, delay);
    expect(expected).toBe(148000); // $1480
    expect(benefitAtAge(r, age(69, 6)).cents()).toBe(expected);
  });

  it('PIA $1000 at age 70y0m (36 months delayed)', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // increase = 0.08/12 * 36 = 0.24
    // round(100000 * 1.24) = 124000
    const expected = expectedBenefitCents(100000, nra, 70 * 12, delay);
    expect(expected).toBe(124000); // $1240
    expect(benefitAtAge(r, age(70, 0)).cents()).toBe(expected);
  });

  it('PIA $2777 at age 70y0m (36 months delayed)', () => {
    const r = makeRecipient(2777, 1965, 5, 15);
    // increase = 0.24
    // round(277700 * 1.24) = round(344348) = 344348
    // floor(344348/100)*100 = 344300
    const expected = expectedBenefitCents(277700, nra, 70 * 12, delay);
    expect(expected).toBe(344300); // $3443
    expect(benefitAtAge(r, age(70, 0)).cents()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 5. benefitAtAge with non-round PIA
// ---------------------------------------------------------------------------

describe('benefitAtAge with non-round PIA', () => {
  // These PIAs are already whole dollars (Money.from rounds to cents),
  // so the first floorToDollar is a no-op. The interesting part is
  // whether the second floorToDollar correctly truncates the result.
  const nra = 67 * 12;
  const delay = 0.08;

  it('PIA $1234 at age 62y0m', () => {
    const r = makeRecipient(1234, 1965, 5, 15);
    // reduction = 0.3 -> round(123400 * 0.7) = round(86380) = 86380
    // floor(86380/100)*100 = 86300
    const expected = expectedBenefitCents(123400, nra, 62 * 12, delay);
    expect(expected).toBe(86300); // $863
    expect(benefitAtAge(r, age(62, 0)).cents()).toBe(expected);
  });

  it('PIA $567 at age 65y0m', () => {
    const r = makeRecipient(567, 1965, 5, 15);
    // 24 months early: reduction = 24*5/900 = 0.13333...
    // round(56700 * 0.86666...) = round(49140) = 49140
    // floor(49140/100)*100 = 49100
    const expected = expectedBenefitCents(56700, nra, 65 * 12, delay);
    expect(benefitAtAge(r, age(65, 0)).cents()).toBe(expected);
  });

  it('PIA $2999 at age 66y6m', () => {
    const r = makeRecipient(2999, 1965, 5, 15);
    // 6 months early: reduction = 6*5/900 = 0.03333...
    // round(299900 * 0.96666...) = round(289903.333...) = 289903
    // floor(289903/100)*100 = 289900
    const expected = expectedBenefitCents(299900, nra, 66 * 12 + 6, delay);
    expect(benefitAtAge(r, age(66, 6)).cents()).toBe(expected);
  });

  it('PIA $50 at age 62y0m', () => {
    const r = makeRecipient(50, 1980, 11, 20);
    // reduction = 0.3 -> round(5000 * 0.7) = round(3500) = 3500
    // floor(3500/100)*100 = 3500
    const expected = expectedBenefitCents(5000, nra, 62 * 12, delay);
    expect(expected).toBe(3500); // $35
    expect(benefitAtAge(r, age(62, 0)).cents()).toBe(expected);
  });

  it('PIA $2999 at age 70y0m', () => {
    const r = makeRecipient(2999, 1965, 5, 15);
    // increase = 0.24
    // round(299900 * 1.24) = round(371876) = 371876
    // floor(371876/100)*100 = 371800
    const expected = expectedBenefitCents(299900, nra, 70 * 12, delay);
    expect(expected).toBe(371800); // $3718
    expect(benefitAtAge(r, age(70, 0)).cents()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 6. benefitAtAge pre-1960 births
// ---------------------------------------------------------------------------

describe('benefitAtAge pre-1960 births', () => {
  // Pre-1960 births have different NRAs. Use mid-month birthdates
  // to avoid SSA birth year shifting.
  // All have delayedIncreaseAnnual = 0.08.

  it('born 1950 (NRA 66y0m), PIA $1000 at NRA', () => {
    // 1943-1954: NRA = 66y0m
    const r = makeRecipient(1000, 1950, 5, 15);
    const result = benefitAtAge(r, age(66, 0));
    expect(result.cents()).toBe(100000); // $1000
  });

  it('born 1950 (NRA 66y0m), PIA $1000 at 62y0m', () => {
    const r = makeRecipient(1000, 1950, 5, 15);
    // NRA = 66y0m = 792 months
    // 48 months early: 36*5/900 + 12*5/1200 = 0.2 + 0.05 = 0.25
    // round(100000 * 0.75) = 75000
    const nra66 = 66 * 12;
    const expected = expectedBenefitCents(100000, nra66, 62 * 12, 0.08);
    expect(expected).toBe(75000); // $750
    expect(benefitAtAge(r, age(62, 0)).cents()).toBe(expected);
  });

  it('born 1955 (NRA 66y2m), PIA $1500 at NRA', () => {
    const r = makeRecipient(1500, 1955, 5, 15);
    const result = benefitAtAge(r, age(66, 2));
    expect(result.cents()).toBe(150000); // $1500
  });

  it('born 1956 (NRA 66y4m), PIA $1000 at 62y0m', () => {
    const r = makeRecipient(1000, 1956, 5, 15);
    // NRA = 66y4m = 796 months, filing at 744 months
    // 52 months early: 36*5/900 + 16*5/1200 = 0.2 + 0.06666... = 0.26666...
    // round(100000 * 0.73333...) = round(73333.33...) = 73333
    // floor(73333/100)*100 = 73300
    const nra66_4 = 66 * 12 + 4;
    const expected = expectedBenefitCents(100000, nra66_4, 62 * 12, 0.08);
    expect(expected).toBe(73300); // $733
    expect(benefitAtAge(r, age(62, 0)).cents()).toBe(expected);
  });

  it('born 1957 (NRA 66y6m), PIA $2000 at 70y0m', () => {
    const r = makeRecipient(2000, 1957, 5, 15);
    // NRA = 66y6m = 798 months, filing at 840 months
    // 42 months delayed: increase = 0.08/12 * 42 = 0.28
    // round(200000 * 1.28) = 256000
    const nra66_6 = 66 * 12 + 6;
    const expected = expectedBenefitCents(200000, nra66_6, 70 * 12, 0.08);
    expect(expected).toBe(256000); // $2560
    expect(benefitAtAge(r, age(70, 0)).cents()).toBe(expected);
  });

  it('born 1958 (NRA 66y8m), PIA $1000 at 66y8m', () => {
    const r = makeRecipient(1000, 1958, 5, 15);
    // At NRA, benefit = PIA
    const result = benefitAtAge(r, age(66, 8));
    expect(result.cents()).toBe(100000); // $1000
  });

  it('born 1959 (NRA 66y10m), PIA $1000 at 62y0m', () => {
    const r = makeRecipient(1000, 1959, 5, 15);
    // NRA = 66y10m = 802 months, filing at 744 months
    // 58 months early: 36*5/900 + 22*5/1200 = 0.2 + 0.09166... = 0.29166...
    // round(100000 * 0.70833...) = round(70833.33...) = 70833
    // floor(70833/100)*100 = 70800
    const nra66_10 = 66 * 12 + 10;
    const expected = expectedBenefitCents(100000, nra66_10, 62 * 12, 0.08);
    expect(expected).toBe(70800); // $708
    expect(benefitAtAge(r, age(62, 0)).cents()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 7. benefitOnDate delayed January bump
// ---------------------------------------------------------------------------

describe('benefitOnDate delayed January bump', () => {
  // Born March 15, 1965: SSA birth = March 1965, NRA = 67y0m = March 2032.
  // delayedRetirementIncrease = 0.08.

  it('file at 68y0m (March 2033), benefit at filing date has partial credits', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    // NRA date = March 2032. Filing at 68y0m = March 2033.
    const filingDate = MonthDate.initFromYearsMonths({
      years: 2033,
      months: 2,
    });
    // At filing date: same year as filing, not Jan, not at/before NRA, not 70.
    // benefitComputationDate = max(NRA=Mar2032, Jan2033) = Jan 2033
    // Age at Jan 2033 from SSA birth (Mar 1965) = 67y10m = 10 months after NRA.
    // Benefit = floor(round(100000 * (1 + 0.08/12 * 10)) / 100) * 100
    const expected = expectedBenefitCents(100000, 67 * 12, 67 * 12 + 10, 0.08);
    expect(benefitOnDate(r, filingDate, filingDate).cents()).toBe(expected);
  });

  it('file at 68y0m (March 2033), benefit at Jan 2034 has full credits', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const filingDate = MonthDate.initFromYearsMonths({
      years: 2033,
      months: 2,
    });
    const atDate = MonthDate.initFromYearsMonths({ years: 2034, months: 0 });
    // filingDate.year()=2033 < atDate.year()=2034: full credits.
    // filingAge = 68y0m = 12 months after NRA.
    // Benefit = floor(round(100000 * (1 + 0.08)) / 100) * 100
    const expected = expectedBenefitCents(100000, 67 * 12, 68 * 12, 0.08);
    expect(expected).toBe(108000); // $1080
    expect(benefitOnDate(r, filingDate, atDate).cents()).toBe(expected);
  });

  it('file at 69y0m (March 2034), benefit at filing date has partial credits', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const filingDate = MonthDate.initFromYearsMonths({
      years: 2034,
      months: 2,
    });
    // benefitComputationDate = max(NRA=Mar2032, Jan2034) = Jan 2034
    // Age at Jan 2034 from SSA birth (Mar 1965) = 68y10m = 22 months after NRA.
    const expected = expectedBenefitCents(100000, 67 * 12, 67 * 12 + 22, 0.08);
    expect(benefitOnDate(r, filingDate, filingDate).cents()).toBe(expected);
  });

  it('file at 69y0m (March 2034), benefit at Jan 2035 has full credits', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    const filingDate = MonthDate.initFromYearsMonths({
      years: 2034,
      months: 2,
    });
    const atDate = MonthDate.initFromYearsMonths({ years: 2035, months: 0 });
    // filingDate.year()=2034 < atDate.year()=2035: full 24 months.
    const expected = expectedBenefitCents(100000, 67 * 12, 69 * 12, 0.08);
    expect(expected).toBe(116000); // $1160
    expect(benefitOnDate(r, filingDate, atDate).cents()).toBe(expected);
  });

  it('file at NRA: no bump (same amount at filing and next Jan)', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    // NRA date = March 2032. Filing at NRA.
    const filingDate = MonthDate.initFromYearsMonths({
      years: 2032,
      months: 2,
    });
    const nextJan = MonthDate.initFromYearsMonths({ years: 2033, months: 0 });
    // Filing at/before NRA: benefit = benefitAtAge(filingAge) = PIA = $1000
    const atFiling = benefitOnDate(r, filingDate, filingDate).cents();
    const atNextJan = benefitOnDate(r, filingDate, nextJan).cents();
    expect(atFiling).toBe(100000);
    expect(atNextJan).toBe(100000);
  });

  it('file at 70: no bump (exception, full credits immediately)', () => {
    const r = makeRecipient(1000, 1965, 2, 15);
    // Age 70y0m = March 2035.
    const filingDate = MonthDate.initFromYearsMonths({
      years: 2035,
      months: 2,
    });
    // 70 exception: full credits at filing.
    // 36 months after NRA.
    const expected = expectedBenefitCents(100000, 67 * 12, 70 * 12, 0.08);
    expect(expected).toBe(124000); // $1240
    expect(benefitOnDate(r, filingDate, filingDate).cents()).toBe(expected);
  });

  it('born Jan 15, 1965, file at 68y0m (Jan 2033): January filing = no bump', () => {
    const r = makeRecipient(1000, 1965, 0, 15);
    // SSA birth = Jan 14, 1965 -> MonthDate Jan 1965.
    // NRA = 67y0m -> NRA date = Jan 2032.
    // Filing at 68y0m = Jan 2033 (monthIndex 0).
    const filingDate = MonthDate.initFromYearsMonths({
      years: 2033,
      months: 0,
    });
    // January filing: full credits immediately. filingAge = 68y0m = 12 months after NRA.
    const expected = expectedBenefitCents(100000, 67 * 12, 68 * 12, 0.08);
    expect(expected).toBe(108000); // $1080
    expect(benefitOnDate(r, filingDate, filingDate).cents()).toBe(expected);
  });

  it('partial credits differ from full credits', () => {
    // Verify the partial amount is strictly less than the full amount.
    const r = makeRecipient(1000, 1965, 2, 15);
    const filingDate = MonthDate.initFromYearsMonths({
      years: 2033,
      months: 2,
    });
    const atFiling = benefitOnDate(r, filingDate, filingDate).cents();
    const atNextJan = benefitOnDate(
      r,
      filingDate,
      MonthDate.initFromYearsMonths({ years: 2034, months: 0 })
    ).cents();
    expect(atFiling).toBeLessThan(atNextJan);
  });
});

// ---------------------------------------------------------------------------
// 8. NRA boundary transitions
// ---------------------------------------------------------------------------

describe('NRA boundary transitions', () => {
  // Born June 15, 1965. NRA = 67y0m. delayedIncrease = 0.08.
  const nra = 67 * 12;
  const delay = 0.08;

  it('file at 66y11m (1 month before NRA): early reduction', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // 1 month early: reduction = 1*5/900 = 0.00555...
    // round(100000 * 0.99444...) = round(99444.44...) = 99444
    // floor(99444/100)*100 = 99400
    const expected = expectedBenefitCents(100000, nra, 66 * 12 + 11, delay);
    expect(expected).toBe(99400);
    expect(benefitAtAge(r, age(66, 11)).cents()).toBe(expected);
  });

  it('file at 67y0m (exactly NRA): full PIA', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    const expected = expectedBenefitCents(100000, nra, 67 * 12, delay);
    expect(expected).toBe(100000);
    expect(benefitAtAge(r, age(67, 0)).cents()).toBe(expected);
  });

  it('file at 67y1m (1 month after NRA): delayed increase', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    // 1 month delayed: increase = 0.08/12 * 1 = 0.00666...
    // round(100000 * 1.00666...) = round(100666.66...) = 100667
    // floor(100667/100)*100 = 100600
    const expected = expectedBenefitCents(100000, nra, 67 * 12 + 1, delay);
    expect(expected).toBe(100600);
    expect(benefitAtAge(r, age(67, 1)).cents()).toBe(expected);
  });

  it('transition from reduction to increase is correct across NRA', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    const before = benefitAtAge(r, age(66, 11)).cents();
    const atNra = benefitAtAge(r, age(67, 0)).cents();
    const after = benefitAtAge(r, age(67, 1)).cents();
    // before < atNra < after
    expect(before).toBeLessThan(atNra);
    expect(atNra).toBeLessThan(after);
  });
});

// ---------------------------------------------------------------------------
// 9. Exhaustive monthly sweep
// ---------------------------------------------------------------------------

describe('Exhaustive monthly sweep', () => {
  const nra = 67 * 12;
  const delay = 0.08;

  /**
   * Computes expected benefit cents for a given PIA and filing age,
   * using the same SSA formula as expectedBenefitCents.
   */
  function ssaExpected(piaCents: number, ageMonths: number): number {
    const piaFloored = Math.floor(piaCents / 100) * 100;
    let multiplier: number;
    if (ageMonths < nra) {
      const monthsBefore = nra - ageMonths;
      multiplier =
        -1.0 *
        ((Math.min(36, monthsBefore) * 5) / 900 +
          (Math.max(0, monthsBefore - 36) * 5) / 1200);
    } else {
      const monthsAfter = ageMonths - nra;
      multiplier = (delay / 12) * monthsAfter;
    }
    const afterMultiply = Math.round(piaFloored * (1 + multiplier));
    return Math.floor(afterMultiply / 100) * 100;
  }

  it('PIA $1000: every month from 62y0m to 70y0m matches SSA formula', () => {
    const r = makeRecipient(1000, 1965, 5, 15);
    for (let ageMonths = 62 * 12; ageMonths <= 70 * 12; ageMonths++) {
      const years = Math.floor(ageMonths / 12);
      const months = ageMonths % 12;
      const expected = ssaExpected(100000, ageMonths);
      const actual = benefitAtAge(r, age(years, months)).cents();
      expect(
        actual,
        `Mismatch at age ${years}y${months}m: expected ${expected}, got ${actual}`
      ).toBe(expected);
    }
  });

  it('PIA $2345: every month from 62y0m to 70y0m matches SSA formula', () => {
    const r = makeRecipient(2345, 1965, 5, 15);
    for (let ageMonths = 62 * 12; ageMonths <= 70 * 12; ageMonths++) {
      const years = Math.floor(ageMonths / 12);
      const months = ageMonths % 12;
      const expected = ssaExpected(234500, ageMonths);
      const actual = benefitAtAge(r, age(years, months)).cents();
      expect(
        actual,
        `Mismatch at age ${years}y${months}m: expected ${expected}, got ${actual}`
      ).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// 10. Floor behavior with small PIAs
// ---------------------------------------------------------------------------

describe('Floor behavior with small PIAs', () => {
  const nra = 67 * 12;
  const delay = 0.08;

  it('PIA $3 at 62y0m', () => {
    const r = makeRecipient(3, 1965, 5, 15);
    // PIA = 300 cents. 60 months early: reduction = 0.3
    // round(300 * 0.7) = round(210) = 210
    // floor(210/100)*100 = 200
    const expected = expectedBenefitCents(300, nra, 62 * 12, delay);
    expect(expected).toBe(200); // $2
    expect(benefitAtAge(r, age(62, 0)).cents()).toBe(expected);
  });

  it('PIA $7 at 65y0m', () => {
    const r = makeRecipient(7, 1965, 5, 15);
    // PIA = 700 cents. 24 months early: reduction = 24*5/900 = 0.13333...
    // round(700 * 0.86666...) = round(606.66...) = 607
    // floor(607/100)*100 = 600
    const expected = expectedBenefitCents(700, nra, 65 * 12, delay);
    expect(expected).toBe(600); // $6
    expect(benefitAtAge(r, age(65, 0)).cents()).toBe(expected);
  });

  it('PIA $13 at 67y6m', () => {
    const r = makeRecipient(13, 1965, 5, 15);
    // PIA = 1300 cents. 6 months delayed: increase = 0.08/12 * 6 = 0.04
    // round(1300 * 1.04) = round(1352) = 1352
    // floor(1352/100)*100 = 1300
    const expected = expectedBenefitCents(1300, nra, 67 * 12 + 6, delay);
    expect(expected).toBe(1300); // $13 -- increase is too small to survive floor
    expect(benefitAtAge(r, age(67, 6)).cents()).toBe(expected);
  });

  it('PIA $997 at 70y0m', () => {
    const r = makeRecipient(997, 1965, 5, 15);
    // PIA = 99700 cents. 36 months delayed: increase = 0.24
    // round(99700 * 1.24) = round(123628) = 123628
    // floor(123628/100)*100 = 123600
    const expected = expectedBenefitCents(99700, nra, 70 * 12, delay);
    expect(expected).toBe(123600); // $1236
    expect(benefitAtAge(r, age(70, 0)).cents()).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 11. Non-integer PIA via Money.fromCents
// ---------------------------------------------------------------------------

describe('Non-integer PIA via Money.fromCents', () => {
  const nra = 67 * 12;
  const delay = 0.08;

  /**
   * Creates a Recipient with a PIA set via Money.fromCents (allowing
   * sub-dollar precision).
   */
  function makeRecipientFromCents(
    piaCents: number,
    birthYear: number,
    birthMonth: number,
    birthDay: number
  ): Recipient {
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(birthYear, birthMonth, birthDay);
    r.setPia(Money.fromCents(piaCents));
    return r;
  }

  it('PIA $1000.50 at NRA: .50 cents dropped by floorToDollar', () => {
    const r = makeRecipientFromCents(100050, 1965, 5, 15);
    // floorToDollar(100050) = 100000. At NRA, multiplier = 0.
    // round(100000 * 1.0) = 100000. floor(100000/100)*100 = 100000.
    const expected = expectedBenefitCents(100050, nra, 67 * 12, delay);
    expect(expected).toBe(100000); // $1000, not $1000.50
    expect(benefitAtAge(r, age(67, 0)).cents()).toBe(expected);
  });

  it('PIA $1000.50 at 62y0m: .50 dropped before reduction', () => {
    const r = makeRecipientFromCents(100050, 1965, 5, 15);
    // floorToDollar(100050) = 100000. 60 months early: reduction = 0.3
    // round(100000 * 0.7) = 70000. floor(70000/100)*100 = 70000.
    const expected = expectedBenefitCents(100050, nra, 62 * 12, delay);
    expect(expected).toBe(70000); // $700
    expect(benefitAtAge(r, age(62, 0)).cents()).toBe(expected);
  });

  it('PIA $1000.50 at 70y0m: .50 dropped before increase', () => {
    const r = makeRecipientFromCents(100050, 1965, 5, 15);
    // floorToDollar(100050) = 100000. 36 months delayed: increase = 0.24
    // round(100000 * 1.24) = 124000. floor(124000/100)*100 = 124000.
    const expected = expectedBenefitCents(100050, nra, 70 * 12, delay);
    expect(expected).toBe(124000); // $1240
    expect(benefitAtAge(r, age(70, 0)).cents()).toBe(expected);
  });
});
