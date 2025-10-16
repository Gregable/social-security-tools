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
