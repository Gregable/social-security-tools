import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { MonthDate, MonthDuration } from '$lib/month-time';

describe('Birthdate Initialization', () => {
  it('FromLayBirthdate', () => {
    const bd = Birthdate.FromYMD(2000, 1, 2); // Feb 2, 2000
    expect(bd.layBirthYear()).toBe(2000);
    expect(bd.layBirthMonth()).toBe(1);
    expect(bd.layBirthDayOfMonth()).toBe(2);
  });

  it('FromLayDateObj', () => {
    const bd = Birthdate.FromYMD(2000, 1, 2); // Feb 2, 2000
    expect(bd.layBirthYear()).toBe(2000);
    expect(bd.layBirthMonth()).toBe(1); // Feb
    expect(bd.layBirthDayOfMonth()).toBe(2);
  });
});
describe('englishBirthdate', () => {
  it('subtracts one day', () => {
    const bd = Birthdate.FromYMD(2000, 1, 2); // Feb 2, 2000
    const ebd = bd.ssaBirthdate();
    expect(ebd.getFullYear()).toBe(2000);
    expect(ebd.getUTCMonth()).toBe(1);
    expect(ebd.getUTCDate()).toBe(1);
  });
});
describe('layBirth', () => {
  it('is correct Day, Month and Year', () => {
    const bd = Birthdate.FromYMD(2000, 0, 1); // Jan 1, 2000
    expect(bd.layBirthDayOfMonth()).toBe(1);
    expect(bd.layBirthYear()).toBe(2000);
    expect(bd.layBirthMonth()).toBe(0);
  });
});
describe('ssaBirth', () => {
  it('is correct Month and Year', () => {
    const bd = Birthdate.FromYMD(2000, 0, 1); // Jan 1, 2000
    expect(bd.ssaBirthYear()).toBe(1999);
    expect(bd.ssaBirthMonth()).toBe(11);
  });
});
describe('dateAtSssAge', () => {
  it('is correct if born on first of month', () => {
    const bd = Birthdate.FromYMD(2000, 0, 1); // Jan 1, 2000
    const date = bd.dateAtSsaAge(new MonthDuration(13));
    expect(date.year()).toBe(2001);
    expect(date.monthIndex()).toBe(0);
  });
  it('is correct if born on tenth of month', () => {
    const bd = Birthdate.FromYMD(2000, 0, 10); // Jan 10, 2000
    const date = bd.dateAtSsaAge(new MonthDuration(13));
    expect(date.year()).toBe(2001);
    expect(date.monthIndex()).toBe(1);
  });
});
describe('yearTurningSsaAge', () => {
  it('is correct if born on first of month', () => {
    const bd = Birthdate.FromYMD(2000, 0, 1); // Jan 1, 2000
    const year = bd.yearTurningSsaAge(13);
    expect(year).toBe(2012);
  });
  it('is correct if born on tenth of month', () => {
    const bd = Birthdate.FromYMD(2000, 0, 10); // Jan 10, 2000
    const year = bd.yearTurningSsaAge(13);
    expect(year).toBe(2013);
  });
});
describe('ageAtSsaDate', () => {
  it('is correct if born on first of month', () => {
    const bd = Birthdate.FromYMD(2000, 0, 1); // Jan 1, 2000
    const age = bd.ageAtSsaDate(
      MonthDate.initFromYearsMonths({ years: 2001, months: 0 })
    );
    expect(age.asMonths()).toBe(13);
  });
  it('is correct if born on tenth of month', () => {
    const bd = Birthdate.FromYMD(2000, 0, 10); // Jan 10, 2000
    const age = bd.ageAtSsaDate(
      MonthDate.initFromYearsMonths({ years: 2001, months: 0 })
    );
    expect(age.asMonths()).toBe(12);
  });
});
describe('UTC tests', () => {
  it('correctFromYMD', () => {
    const bd = Birthdate.FromYMD(2000, 0, 1); // Jan 1, 2000
    expect(bd.isFirstOfMonth());
    expect(bd.layBirthdateString()).toBe('Jan 1, 2000');
    expect(bd.layBirthYear()).toBe(2000);
    expect(bd.layBirthMonth()).toBe(0);
    expect(bd.layBirthDayOfMonth()).toBe(1);
  });
});

describe('exampleSsaAge', () => {
  it('is correct dictionary', () => {
    const bd = Birthdate.FromYMD(2000, 0, 1);
    const example = bd.exampleSsaAge(2005);
    expect(example.month).toBe('December');
    expect(example.day).toBe(31);
    expect(example.year).toBe(2005);
    expect(example.age).toBe(6);
  });
  it('is correct for another test', () => {
    const bd = Birthdate.FromYMD(1950, 8, 1); // Sep 1, 1950
    expect(bd.ssaBirthdate().getUTCMonth()).toBe(7);
    const example = bd.exampleSsaAge(2023);
    expect(example.month).toBe('August');
    expect(example.day).toBe(31);
    expect(example.year).toBe(2023);
    expect(example.age).toBe(73);
  });
});

describe('currentAge', () => {
  it('before birthday in year', () => {
    const bd = Birthdate.FromYMD(2000, 1, 2); // Feb 2 2000
    const asOf = new Date(Date.UTC(2025, 0, 15)); // Jan 15 2025
    expect(bd.currentAge(asOf)).toBe(24); // Not yet 25
  });
  it('on birthday', () => {
    const bd = Birthdate.FromYMD(2000, 1, 2); // Feb 2 2000
    const asOf = new Date(Date.UTC(2025, 1, 2)); // Feb 2 2025
    expect(bd.currentAge(asOf)).toBe(25);
  });
  it('after birthday in year', () => {
    const bd = Birthdate.FromYMD(2000, 1, 2); // Feb 2 2000
    const asOf = new Date(Date.UTC(2025, 5, 1)); // Jun 1 2025
    expect(bd.currentAge(asOf)).toBe(25);
  });
});

describe('Birthdate serialization', () => {
  it('serializes to plain object', () => {
    const bd = Birthdate.FromYMD(1965, 5, 15); // Jun 15, 1965

    const serialized = bd.serialize();

    expect(serialized).toEqual({
      year: 1965,
      month: 5,
      day: 15,
    });
  });

  it('deserializes back to Birthdate', () => {
    const serialized = { year: 1965, month: 5, day: 15 };

    const bd = Birthdate.deserialize(serialized);

    expect(bd.layBirthYear()).toBe(1965);
    expect(bd.layBirthMonth()).toBe(5);
    expect(bd.layBirthDayOfMonth()).toBe(15);
  });

  it('round-trips correctly', () => {
    const original = Birthdate.FromYMD(1980, 11, 25); // Dec 25, 1980

    const roundTripped = Birthdate.deserialize(original.serialize());

    expect(roundTripped.layBirthYear()).toBe(original.layBirthYear());
    expect(roundTripped.layBirthMonth()).toBe(original.layBirthMonth());
    expect(roundTripped.layBirthDayOfMonth()).toBe(
      original.layBirthDayOfMonth()
    );
  });

  it('preserves SSA date calculations after round-trip', () => {
    const original = Birthdate.FromYMD(2000, 0, 1); // Jan 1, 2000

    const roundTripped = Birthdate.deserialize(original.serialize());

    expect(roundTripped.ssaBirthYear()).toBe(original.ssaBirthYear());
    expect(roundTripped.ssaBirthMonth()).toBe(original.ssaBirthMonth());
  });
});

describe('FromYMD validation', () => {
  it('rejects Feb 31', () => {
    expect(() => Birthdate.FromYMD(2000, 1, 31)).toThrow(
      'Invalid date: 2000-2-31 does not exist'
    );
  });

  it('rejects Feb 30', () => {
    expect(() => Birthdate.FromYMD(2000, 1, 30)).toThrow(
      'Invalid date: 2000-2-30 does not exist'
    );
  });

  it('rejects Feb 29 in non-leap year', () => {
    expect(() => Birthdate.FromYMD(2001, 1, 29)).toThrow(
      'Invalid date: 2001-2-29 does not exist'
    );
  });

  it('accepts Feb 29 in leap year', () => {
    const bd = Birthdate.FromYMD(2000, 1, 29); // 2000 is a leap year
    expect(bd.layBirthYear()).toBe(2000);
    expect(bd.layBirthMonth()).toBe(1);
    expect(bd.layBirthDayOfMonth()).toBe(29);
  });

  it('rejects April 31', () => {
    expect(() => Birthdate.FromYMD(2000, 3, 31)).toThrow(
      'Invalid date: 2000-4-31 does not exist'
    );
  });

  it('rejects June 31', () => {
    expect(() => Birthdate.FromYMD(2000, 5, 31)).toThrow(
      'Invalid date: 2000-6-31 does not exist'
    );
  });

  it('rejects September 31', () => {
    expect(() => Birthdate.FromYMD(2000, 8, 31)).toThrow(
      'Invalid date: 2000-9-31 does not exist'
    );
  });

  it('rejects November 31', () => {
    expect(() => Birthdate.FromYMD(2000, 10, 31)).toThrow(
      'Invalid date: 2000-11-31 does not exist'
    );
  });

  it('accepts valid 31-day months', () => {
    // January, March, May, July, August, October, December all have 31 days
    expect(Birthdate.FromYMD(2000, 0, 31).layBirthDayOfMonth()).toBe(31); // Jan
    expect(Birthdate.FromYMD(2000, 2, 31).layBirthDayOfMonth()).toBe(31); // Mar
    expect(Birthdate.FromYMD(2000, 4, 31).layBirthDayOfMonth()).toBe(31); // May
    expect(Birthdate.FromYMD(2000, 6, 31).layBirthDayOfMonth()).toBe(31); // Jul
    expect(Birthdate.FromYMD(2000, 7, 31).layBirthDayOfMonth()).toBe(31); // Aug
    expect(Birthdate.FromYMD(2000, 9, 31).layBirthDayOfMonth()).toBe(31); // Oct
    expect(Birthdate.FromYMD(2000, 11, 31).layBirthDayOfMonth()).toBe(31); // Dec
  });

  it('accepts valid 30-day months', () => {
    expect(Birthdate.FromYMD(2000, 3, 30).layBirthDayOfMonth()).toBe(30); // Apr
    expect(Birthdate.FromYMD(2000, 5, 30).layBirthDayOfMonth()).toBe(30); // Jun
    expect(Birthdate.FromYMD(2000, 8, 30).layBirthDayOfMonth()).toBe(30); // Sep
    expect(Birthdate.FromYMD(2000, 10, 30).layBirthDayOfMonth()).toBe(30); // Nov
  });
});
