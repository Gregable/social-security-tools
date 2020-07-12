import * as constants from "/src/constants.mjs"
import * as utils from "/src/utils.mjs"
import { EarningRecord, Recipient } from '/src/recipient.mjs';

let guidesApp = angular.module("guidesApp", []);

function monthlyBenefit(ageInYears, earnYears=35) {
  let r = new Recipient('name');
  r.updateBirthdate(new Date(constants.CURRENT_YEAR - ageInYears, 1, 1));

  let earningsRecords = []
  // Loop over most recent 35 years, not including the current year.
  for (let year = constants.CURRENT_YEAR - earnYears;
       year <= constants.CURRENT_YEAR - 1; year++) {
    let record = new EarningRecord();
    record.year = year;
    record.taxedEarnings = constants.MAXIMUM_EARNINGS[year];
    earningsRecords.push(record);
  }
  r.initFromEarningsRecords(earningsRecords);

  let month = 0;
  // Can't actually file at age 62.
  if (ageInYears == 62)
    month = 1;
  return r.benefitAtAge(
      new utils.MonthDuration().initFromYearsMonths(ageInYears, month));
}

guidesApp.controller("MaximumGuideController", function ($scope) {
 /**
   * Initialization
   */
  $scope.init = function() {
    $scope.CURRENT_YEAR = constants.CURRENT_YEAR;
    $scope.earlyMaximumMonthlyBenefit = monthlyBenefit(62);
    $scope.normalMaximumMonthlyBenefit = monthlyBenefit(66);
    $scope.maximumMonthlyBenefit = monthlyBenefit(70);
    // spouseMax is half of the NRA benefit.
    $scope.spouseMax = Math.floor(monthlyBenefit(66) / 2.0);
    $scope.familyMax = $scope.maximumMonthlyBenefit + $scope.spouseMax;
    document.title += ' for ' + constants.CURRENT_YEAR;

    $scope.max30 = monthlyBenefit(70, 30);
    $scope.max25 = monthlyBenefit(70, 25);
  };
});
