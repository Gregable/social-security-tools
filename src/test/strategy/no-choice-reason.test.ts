import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import {
  filingChoices,
  noChoiceReason,
  noChoiceReasons,
  spousalOnlyAdvice,
} from '$lib/components/recommended-filing-card';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { noChoiceVariant } from '$lib/strategy/ui/no-choice';

/** October 2026. */
const currentDate = MonthDate.initFromYearsMonths({ years: 2026, months: 9 });
const month = (year: number, monthIndex: number) =>
  MonthDate.initFromYearsMonths({ years: year, months: monthIndex });

function recipient(pia: number, year: number, monthIndex: number): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(year, monthIndex, 15);
  r.setPia(Money.from(pia));
  return r;
}

/** Born May 1962: 64, with filing ages to choose. */
const deciding = () => recipient(2400, 1962, 4);
/**
 * Born May 1955: 71. (Until 70 and 6 months a claim can still be backdated to
 * before 70, which filingAgeRange counts as a choice.)
 */
const pastSeventy = () => recipient(2400, 1955, 4);
/** No benefit of their own; full retirement age (66y8m) was November 2024. */
const zeroPiaPastFra = () => recipient(0, 1958, 2);
/** No benefit of their own; full retirement age (67) is January 2029. */
const zeroPiaBeforeFra = () => recipient(0, 1962, 0);
/** No benefit of their own; full retirement age (66y10m) is October 2026. */
const zeroPiaFraThisMonth = () => recipient(0, 1959, 11);

describe('noChoiceReason', () => {
  it('is null while a filing age is left to choose', () => {
    expect(noChoiceReason(deciding(), null, currentDate, null)).toBe(null);
  });

  it('is filed once benefits have started', () => {
    // June 2024 is the first full month at 62 for a May 1962 birthdate.
    expect(noChoiceReason(deciding(), null, currentDate, month(2024, 5))).toBe(
      'filed'
    );
  });

  it('is past-seventy once delayed retirement credits have stopped', () => {
    expect(noChoiceReason(pastSeventy(), null, currentDate, null)).toBe(
      'past-seventy'
    );
  });

  it('is spousal-only for someone with no benefit of their own past full retirement age', () => {
    // Filing only starts the spousal benefit on the other's record, and it
    // stops growing at full retirement age.
    expect(
      noChoiceReason(zeroPiaPastFra(), pastSeventy(), currentDate, null)
    ).toBe('spousal-only');
  });

  it('leaves a choice before full retirement age, while the spousal benefit still grows', () => {
    expect(
      noChoiceReason(zeroPiaBeforeFra(), pastSeventy(), currentDate, null)
    ).toBe(null);
  });

  it('counts the month of full retirement age as no longer growing, and not the month before', () => {
    expect(
      noChoiceReason(zeroPiaFraThisMonth(), pastSeventy(), currentDate, null)
    ).toBe('spousal-only');
    expect(
      noChoiceReason(zeroPiaFraThisMonth(), pastSeventy(), month(2026, 8), null)
    ).toBe(null);
  });

  it('names a recorded filing first, then having no benefit of their own, then being past 70', () => {
    // March 1958: the first full month at 62 was April 2020.
    expect(
      noChoiceReason(
        zeroPiaPastFra(),
        pastSeventy(),
        currentDate,
        month(2025, 0)
      )
    ).toBe('filed');
    expect(
      noChoiceReason(recipient(0, 1950, 4), pastSeventy(), currentDate, null)
    ).toBe('spousal-only');
  });

  it('is not spousal-only without a spouse whose record pays a benefit', () => {
    // There is no spousal benefit to wait for; the filing range decides.
    expect(noChoiceReason(zeroPiaPastFra(), null, currentDate, null)).toBe(
      null
    );
    expect(
      noChoiceReason(zeroPiaPastFra(), zeroPiaBeforeFra(), currentDate, null)
    ).toBe(null);
    expect(
      noChoiceReason(
        recipient(0, 1950, 4),
        recipient(0, 1955, 4),
        currentDate,
        null
      )
    ).toBe('past-seventy');
  });

  it('rejects a filed month that could not have happened', () => {
    expect(() =>
      noChoiceReason(deciding(), null, currentDate, month(2019, 0))
    ).toThrow(/invalid filed month/);
  });
});

describe('noChoiceReasons', () => {
  it('gives a reason per spouse, and none for the missing spouse of a single person', () => {
    expect(
      noChoiceReasons(pastSeventy(), zeroPiaPastFra(), currentDate)
    ).toEqual(['past-seventy', 'spousal-only']);
    expect(noChoiceReasons(pastSeventy(), null, currentDate)).toEqual([
      'past-seventy',
      null,
    ]);
  });
});

describe('filingChoices with no benefit on one record', () => {
  it('gives no choice to a spouse past full retirement age with no benefit of their own', () => {
    expect(filingChoices(pastSeventy(), zeroPiaPastFra(), currentDate)).toEqual(
      [false, false]
    );
    expect(filingChoices(deciding(), zeroPiaPastFra(), currentDate)).toEqual([
      true,
      false,
    ]);
  });

  it('keeps the choice for such a spouse before full retirement age', () => {
    expect(
      filingChoices(pastSeventy(), zeroPiaBeforeFra(), currentDate)
    ).toEqual([false, true]);
  });

  it('keeps the choice when neither record pays a benefit', () => {
    expect(
      filingChoices(zeroPiaPastFra(), zeroPiaBeforeFra(), currentDate)
    ).toEqual([true, true]);
  });
});

describe('noChoiceVariant', () => {
  it('names a couple both receiving benefits', () => {
    expect(noChoiceVariant(['filed', 'filed'])).toBe('both-filed');
  });

  it('names one filed and one past 70, in either order', () => {
    expect(noChoiceVariant(['filed', 'past-seventy'])).toBe(
      'filed-and-past-seventy'
    );
    expect(noChoiceVariant(['past-seventy', 'filed'])).toBe(
      'filed-and-past-seventy'
    );
  });

  it('names a couple both past 70', () => {
    expect(noChoiceVariant(['past-seventy', 'past-seventy'])).toBe(
      'both-past-seventy'
    );
  });

  it('names a spouse whose spousal benefit has stopped growing, beside one filed or past 70', () => {
    expect(noChoiceVariant(['filed', 'spousal-only'])).toBe(
      'filed-and-spousal-only'
    );
    expect(noChoiceVariant(['spousal-only', 'filed'])).toBe(
      'filed-and-spousal-only'
    );
    expect(noChoiceVariant(['spousal-only', 'past-seventy'])).toBe(
      'past-seventy-and-spousal-only'
    );
  });
});

describe('spousalOnlyAdvice', () => {
  it('files with the other spouse when their benefits start later', () => {
    // The spousal benefit cannot start before the other's benefits do.
    expect(
      spousalOnlyAdvice(
        zeroPiaPastFra(),
        { month: month(2027, 2), filed: false },
        currentDate
      )
    ).toEqual({ kind: 'with-other', month: month(2027, 2) });
  });

  it('files with the other spouse when they are to file this month', () => {
    expect(
      spousalOnlyAdvice(
        zeroPiaPastFra(),
        { month: currentDate, filed: false },
        currentDate
      )
    ).toEqual({ kind: 'with-other', month: currentDate });
  });

  it('files now, with nothing to backdate, when the other spouse started this month', () => {
    expect(
      spousalOnlyAdvice(
        zeroPiaPastFra(),
        { month: currentDate, filed: true },
        currentDate
      )
    ).toEqual({ kind: 'now', backdateTo: null, limit: 'other-start' });
  });

  it('backdates six months once the other spouse has long been paid', () => {
    expect(
      spousalOnlyAdvice(
        zeroPiaPastFra(),
        { month: month(2022, 4), filed: true },
        currentDate
      )
    ).toEqual({ kind: 'now', backdateTo: month(2026, 3), limit: 'six-months' });
  });

  it('backdates no further than the month the other spouse started', () => {
    expect(
      spousalOnlyAdvice(
        zeroPiaPastFra(),
        { month: month(2026, 6), filed: true },
        currentDate
      )
    ).toEqual({
      kind: 'now',
      backdateTo: month(2026, 6),
      limit: 'other-start',
    });
  });

  it("backdates no further than the other spouse's own backdated start", () => {
    // Past 70 and not yet filed: their claim goes back six months too.
    expect(
      spousalOnlyAdvice(
        zeroPiaPastFra(),
        { month: month(2026, 3), filed: false },
        currentDate
      )
    ).toEqual({
      kind: 'now',
      backdateTo: month(2026, 3),
      limit: 'other-start',
    });
  });

  it('backdates no further than their own full retirement age', () => {
    // Born October 1959: full retirement age in August 2026.
    expect(
      spousalOnlyAdvice(
        recipient(0, 1959, 9),
        { month: month(2022, 4), filed: true },
        currentDate
      )
    ).toEqual({
      kind: 'now',
      backdateTo: month(2026, 7),
      limit: 'full-retirement-age',
    });
  });

  it('files now, with nothing to backdate, in the month of full retirement age', () => {
    expect(
      spousalOnlyAdvice(
        zeroPiaFraThisMonth(),
        { month: month(2022, 4), filed: true },
        currentDate
      )
    ).toEqual({ kind: 'now', backdateTo: null, limit: 'full-retirement-age' });
  });
});
