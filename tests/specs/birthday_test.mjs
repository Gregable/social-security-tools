import * as utils from '../../src/utils.mjs'
import { Birthdate } from '../../src/birthday.mjs'

describe("Birthdate Initialization", function () {
  it ("FromLayBirthdate", function() {
    let bd = new Birthdate().initFromLayBirthdate(2000, 1, 2);
    expect(bd.layBirthYear()).toBe(2000);
    expect(bd.layBirthMonth()).toBe(1);
    expect(bd.layBirthDayOfMonth()).toBe(2);
  });

  it ("FromLayDateObj", function() {
    let bd = new Birthdate().initFromLayDateObj(new Date(2000, 1, 2));
    expect(bd.layBirthYear()).toBe(2000);
    expect(bd.layBirthMonth()).toBe(1);
    expect(bd.layBirthDayOfMonth()).toBe(2);
  });
});
describe("englishBirthdate", function() {
  it ("subtracts one day", function() {
    let bd = new Birthdate().initFromLayBirthdate(2000, 1, 2);
    let ebd = bd.englishBirthdate();
    expect(ebd.getFullYear()).toBe(2000);
    expect(ebd.getMonth()).toBe(1);
    expect(ebd.getDate()).toBe(1);
  });
});
describe("layBirth", function() {
  it ("is correct Day, Month and Year", function() {
    let bd = new Birthdate().initFromLayBirthdate(2000, 0, 1);
    expect(bd.layBirthDayOfMonth()).toBe(1);
    expect(bd.layBirthYear()).toBe(2000);
    expect(bd.layBirthMonth()).toBe(0);
  });
});
describe("ssaBirth", function() {
  it ("is correct Month and Year", function() {
    let bd = new Birthdate().initFromLayBirthdate(2000, 0, 1);
    expect(bd.ssaBirthYear()).toBe(1999);
    expect(bd.ssaBirthMonth()).toBe(11);
  });
});
describe("exampleSsaAge", function() {
  it ("is correct dictionary", function() {
    let bd = new Birthdate().initFromLayBirthdate(2000, 0, 1);
    let example = bd.exampleSsaAge(2005);
    expect(example.month).toBe("December");
    expect(example.day).toBe(31);
    expect(example.year).toBe(2005);
    expect(example.age).toBe(6);
  });
});
