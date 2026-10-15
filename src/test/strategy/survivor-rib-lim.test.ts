import { describe, expect, it } from 'vitest';
import { survivorBenefit } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

/**
 * The widow(er)'s limit (RIB-LIM) and the survivor's age reduction, in the
 * order the statute applies them.
 *
 * Act 202(e)(2)(D) caps the widow(er)'s benefit "as determined under
 * subparagraph (A) and after application of subsection (q)" — that is, after
 * the age reduction — at the larger of the deceased's reduced retirement
 * benefit and 82.5% of their PIA. POMS RS 00615.320 says the same: the limit
 * applies "when the WIB after adjustment for the family maximum and
 * reduction for age is more than BOTH 82 1/2 percent of the NH's death PIA
 * and the RIB". The age reduction is applied to 100% of the PIA, never to
 * the limited amount:
 *
 *   WIB = min(PIA × ageFactor, max(deceased's reduced RIB, 82.5% × PIA))
 *
 * Every case below: deceased born 2 Jan 1962 (FRA 67), PIA $2,000; survivor
 * born 2 Jan 1968 (survivor FRA 67, so 84 months from 60 to FRA). The age
 * factor at age a is 0.715 + 0.285 × (a − 60y) / 84 months.
 */

function makeRecipient(piaDollars: number, birthYear: number): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(birthYear, 0, 2);
  r.setPia(Money.from(piaDollars));
  return r;
}

function age(years: number, months: number): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

const deceased = makeRecipient(2000, 1962);
const survivor = makeRecipient(800, 1968);

function survivorAt(
  deceasedFiledAt: MonthDuration,
  deceasedDiedAt: MonthDuration,
  survivorFilesAt: MonthDuration
): number {
  return survivorBenefit(
    survivor,
    deceased,
    deceased.birthdate.dateAtSsaAge(deceasedFiledAt),
    deceased.birthdate.dateAtSsaAge(deceasedDiedAt),
    survivor.birthdate.dateAtSsaAge(survivorFilesAt)
  ).value();
}

describe('RIB-LIM is applied after the survivor age reduction', () => {
  it('reduces the full PIA for age when that stays under the limit', () => {
    // Deceased filed at 63: 48 months early, 75% of PIA = $1,500.
    // Limit = max($1,500, 82.5% × $2,000 = $1,650) = $1,650.
    // Survivor at 61: factor 0.715 + 0.285 × 12/84 = 0.755714...
    // $2,000 × 0.755714 = $1,511.43, under the limit, floored to $1,511.
    // (Reducing the limit instead would give $1,650 × 0.755714 = $1,246.)
    expect(survivorAt(age(63, 0), age(65, 0), age(61, 0))).toBe(1511);
  });

  it('caps at 82.5% of PIA once the reduced amount passes it', () => {
    // Survivor at 66: factor 0.715 + 0.285 × 72/84 = 0.959286.
    // $2,000 × 0.959286 = $1,918.57, over the $1,650 limit.
    expect(survivorAt(age(63, 0), age(65, 0), age(66, 0))).toBe(1650);
  });

  it("caps at the deceased's own reduced benefit when that is larger", () => {
    // Deceased filed at 66: 12 months early, 1 − 12 × 5/900 = 93.33%,
    // $1,866 after flooring. Limit = max($1,866, $1,650) = $1,866.
    // Survivor at 66: $1,918.57 reduced, capped at $1,866.
    expect(survivorAt(age(66, 0), age(66, 6), age(66, 0))).toBe(1866);
    // Survivor at 63: factor 0.715 + 0.285 × 36/84 = 0.837143.
    // $2,000 × 0.837143 = $1,674.29, under the $1,866 limit.
    expect(survivorAt(age(66, 0), age(66, 6), age(63, 0))).toBe(1674);
  });

  it('pays the limit unreduced at survivor full retirement age', () => {
    // At survivor FRA there is no age reduction: min($2,000, $1,650).
    expect(survivorAt(age(63, 0), age(65, 0), age(67, 0))).toBe(1650);
  });

  it('has no limit when the deceased claimed after full retirement age', () => {
    // Deceased filed at 68: 12 months of 8%/yr credits, $2,160.
    // Survivor at 63: $2,160 × 0.837143 = $1,808.23, floored to $1,808.
    expect(survivorAt(age(68, 0), age(68, 6), age(63, 0))).toBe(1808);
  });

  it('has no limit when the deceased died before claiming', () => {
    // Never filed (filing month = death month), died before FRA: 100% PIA.
    expect(survivorAt(age(65, 0), age(65, 0), age(61, 0))).toBe(1511);
  });
});
