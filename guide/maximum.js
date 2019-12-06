var guidesApp = angular.module("guidesApp", []);

function monthlyBenefit(ageInYears, earnYears=35) {
  r = new Recipient('name');
  r.updateBirthdate(new Date(CURRENT_YEAR - ageInYears, 1, 1));
  
  earningsRecords = []
  // Loop over most recent 35 years, not including the current year.
  for (var year = CURRENT_YEAR - earnYears; year <= CURRENT_YEAR - 1; year++) {
    record = new EarningRecord();
    record.year = year;
    record.taxedEarnings = MAXIMUM_EARNINGS[year];
    earningsRecords.push(record);
  }
  r.initFromEarningsRecords(earningsRecords);

  var month = 0;
  // Can't actually file at age 62.
  if (ageInYears == 62)
    month = 1;
  return r.benefitAtAge(
      new MonthDuration().initFromYearsMonths(ageInYears, month));
}

guidesApp.controller("MaximumGuideController", function ($scope) {
 /**
   * Initialization
   */
  $scope.init = function() {
    $scope.CURRENT_YEAR = CURRENT_YEAR;
    $scope.earlyMaximumMonthlyBenefit = monthlyBenefit(62);
    $scope.normalMaximumMonthlyBenefit = monthlyBenefit(66);
    $scope.maximumMonthlyBenefit = monthlyBenefit(70);
    $scope.spouseMax = Math.floor(monthlyBenefit(70) / 2.0);
    $scope.familyMax = $scope.maximumMonthlyBenefit + $scope.spouseMax;
    document.title += ' for ' + CURRENT_YEAR;

    $scope.max30 = monthlyBenefit(70, 30);
    $scope.max25 = monthlyBenefit(70, 25);
  };
});
