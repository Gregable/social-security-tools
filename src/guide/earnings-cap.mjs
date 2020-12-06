import * as constants from "../constants.mjs"
import * as utils from "../utils.mjs"

let guidesApp = angular.module("guidesApp", []);

function earningsCaps() {
  let out = [];
  for (const year in constants.MAXIMUM_EARNINGS) {
    out.push({ 'year': year, 'amount': constants.MAXIMUM_EARNINGS[year] });
  }
  console.log(out);
  return out;
};

guidesApp.controller("EarningsCapController", function ($scope) {
  /**
   * Initialization
   */
  $scope.init = function() {
    $scope.earningsCaps = earningsCaps();
    $scope.MAX_CAP_YEAR = $scope.earningsCaps[$scope.earningsCaps.length - 1].year;
    $scope.MAX_CAP = $scope.earningsCaps[$scope.earningsCaps.length - 1].amount;
  };
});
