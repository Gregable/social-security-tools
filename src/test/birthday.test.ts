import {Birthdate} from '$lib/birthday'
import {MonthDate, MonthDuration} from '$lib/month-time'
import {describe, expect, it} from 'vitest'


describe('Birthdate Initialization', function() {
  it('FromLayBirthdate', function() {
    let bd = Birthdate.FromYMD(2000, 1, 2);
    expect(bd.layBirthYear()).toBe(2000);
    expect(bd.layBirthMonth()).toBe(1);
    expect(bd.layBirthDayOfMonth()).toBe(2);
  });

  it('FromLayDateObj', function() {
    let bd = new Birthdate(new Date(2000, 1, 2));
    expect(bd.layBirthYear()).toBe(2000);
    expect(bd.layBirthMonth()).toBe(1);
    expect(bd.layBirthDayOfMonth()).toBe(2);
  });
});
describe('englishBirthdate', function() {
  it('subtracts one day', function() {
    let bd = Birthdate.FromYMD(2000, 1, 2);
    let ebd = bd.ssaBirthdate();
    expect(ebd.getFullYear()).toBe(2000);
    expect(ebd.getMonth()).toBe(1);
    expect(ebd.getDate()).toBe(1);
  });
});
describe('layBirth', function() {
  it('is correct Day, Month and Year', function() {
    let bd = Birthdate.FromYMD(2000, 0, 1);
    expect(bd.layBirthDayOfMonth()).toBe(1);
    expect(bd.layBirthYear()).toBe(2000);
    expect(bd.layBirthMonth()).toBe(0);
  });
});
describe('ssaBirth', function() {
  it('is correct Month and Year', function() {
    let bd = Birthdate.FromYMD(2000, 0, 1);
    expect(bd.ssaBirthYear()).toBe(1999);
    expect(bd.ssaBirthMonth()).toBe(11);
  });
});
describe('dateAtSssAge', function() {
  it('is correct if born on first of month', function() {
    let bd = Birthdate.FromYMD(2000, 0, 1);
    let date = bd.dateAtSsaAge(new MonthDuration(13));
    expect(date.year()).toBe(2001);
    expect(date.monthIndex()).toBe(0);
  });
  it('is correct if born on tenth of month', function() {
    let bd = Birthdate.FromYMD(2000, 0, 10);
    let date = bd.dateAtSsaAge(new MonthDuration(13));
    expect(date.year()).toBe(2001);
    expect(date.monthIndex()).toBe(1);
  });
});
describe('yearTurningSsaAge', function() {
  it('is correct if born on first of month', function() {
    let bd = Birthdate.FromYMD(2000, 0, 1);
    let year = bd.yearTurningSsaAge(13);
    expect(year).toBe(2012);
  });
  it('is correct if born on tenth of month', function() {
    let bd = Birthdate.FromYMD(2000, 0, 10);
    let year = bd.yearTurningSsaAge(13);
    expect(year).toBe(2013);
  });
});
describe('ageAtSsaDate', function() {
  it('is correct if born on first of month', function() {
    let bd = Birthdate.FromYMD(2000, 0, 1);
    let age = bd.ageAtSsaDate(
        MonthDate.initFromYearsMonths({years: 2001, months: 0}));
    expect(age.asMonths()).toBe(13);
  });
  it('is correct if born on tenth of month', function() {
    let bd = Birthdate.FromYMD(2000, 0, 10);
    let age = bd.ageAtSsaDate(
        MonthDate.initFromYearsMonths({years: 2001, months: 0}));
    expect(age.asMonths()).toBe(12);
  });
});
describe('exampleSsaAge', function() {
  it('is correct dictionary', function() {
    let bd = Birthdate.FromYMD(2000, 0, 1);
    let example = bd.exampleSsaAge(2005);
    expect(example.month).toBe('December');
    expect(example.day).toBe(31);
    expect(example.year).toBe(2005);
    expect(example.age).toBe(6);
  });
});
