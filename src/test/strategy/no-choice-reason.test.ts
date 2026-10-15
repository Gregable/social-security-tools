import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import {
  filingChoices,
  noChoiceReason,
  spousalOnlyAdvice,
} from '$lib/components/recommended-filing-card';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { noChoiceVariant } from '$lib/strategy/ui/no-choice';

/** October 2026. */
const currentDate = MonthDate.initFromYearsMonths({ years: 2026, months: 9 });

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

describe('noChoiceReason', () => {
  it('is null while a filing age is left to choose', () => {
    expect(noChoiceReason(deciding(), null, currentDate, null)).toBe(null);
  });

  it('is filed once benefits have started', () => {
    // June 2024 is the first full month at 62 for a May 1962 birthdate.
    const filed = MonthDate.initFromYearsMonths({ years: 2024, months: 5 });
    expect(noChoiceReason(deciding(), null, currentDate, filed)).toBe('filed');
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

  it('counts the month of full retirement age as no longer growing', () => {
    // Born December 1959: full retirement age, 66 and 10 months, is
    // October 2026. Born January 1960: 67, in January 2027.
    expect(
      noChoiceReason(recipient(0, 1959, 11), pastSeventy(), currentDate, null)
    ).toBe('spousal-only');
    expect(
      noChoiceReason(recipient(0, 1960, 0), pastSeventy(), currentDate, null)
    ).toBe(null);
  });

  it('names having no benefit of their own over being past 70', () => {
    expect(
      noChoiceReason(recipient(0, 1950, 4), pastSeventy(), currentDate, null)
    ).toBe('spousal-only');
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
  const month = (year: number, monthIndex: number) =>
    MonthDate.initFromYearsMonths({ years: year, months: monthIndex });

  it('files with the other spouse when their benefits start later', () => {
    // The spousal benefit cannot start before the other's benefits do.
    expect(
      spousalOnlyAdvice(zeroPiaPastFra(), month(2027, 2), currentDate)
    ).toEqual({ kind: 'file-in', month: month(2027, 2) });
  });

  it('files this month when the other spouse starts this month', () => {
    expect(
      spousalOnlyAdvice(zeroPiaPastFra(), currentDate, currentDate)
    ).toEqual({ kind: 'file-in', month: currentDate });
  });

  it('files now, backdated six months, once the other spouse has long been paid', () => {
    expect(
      spousalOnlyAdvice(zeroPiaPastFra(), month(2022, 4), currentDate)
    ).toEqual({ kind: 'file-now', backdateTo: month(2026, 3) });
  });

  it('backdates no further than the month the other spouse started', () => {
    expect(
      spousalOnlyAdvice(zeroPiaPastFra(), month(2026, 6), currentDate)
    ).toEqual({ kind: 'file-now', backdateTo: month(2026, 6) });
  });

  it('backdates no further than their own full retirement age', () => {
    // Born December 1959: full retirement age in October 2026, this month,
    // so there is nothing to backdate. Born October 1959: August 2026.
    expect(
      spousalOnlyAdvice(recipient(0, 1959, 11), month(2022, 4), currentDate)
    ).toEqual({ kind: 'file-in', month: currentDate });
    expect(
      spousalOnlyAdvice(recipient(0, 1959, 9), month(2022, 4), currentDate)
    ).toEqual({ kind: 'file-now', backdateTo: month(2026, 7) });
  });
});
