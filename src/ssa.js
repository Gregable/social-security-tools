var ssaApp = angular.module("ssaApp", ['ngAnimate', 'rzModule']);

var ModeEnum = {
  INITIAL: 'INITIAL',
  PASTE_CONFIRMATION: 'PASTE_CONFIRMATION',
  PASTE_APOLOGY: 'PASTE_APOLOGY',
  AGE_REQUEST: 'AGE_REQUEST',
  RENDER_EARNINGS: 'RENDER_EARNINGS'
};

ssaApp.controller("SSAController", function ($scope, $filter, $http, $timeout) {
  $scope.pasteArea = {
    contents: '',
    mode: ModeEnum.INITIAL,
    // Cleaner here than newlines in the actual template.
    placeholder: '\n\nPaste Result Here'
  };

  /**
   * Initialization
   */
  $scope.init = function() {
    $scope.breakPointChart_ = new BreakPointChart();
    $scope.ageChart_ = new AgeChart();
    $scope.taxEngine = new TaxEngine();
    $scope.mode = ModeEnum.INITIAL;
    $scope.futureYears = [];
    $scope.futureIsTopValue = false;
    $scope.all_months = ALL_MONTHS;
    $scope.demoId = -1;
  
    $scope.showMedicare = true;
    $scope.showIndexedEarnings = false;

    $scope.breakPointChart_.setTaxEngine($scope.taxEngine);
    $scope.ageChart_.setTaxEngine($scope.taxEngine);
    $scope.maybeRenderCharts();
  };

  $scope.loadDemoData = function(demoId) {
    // User may have scrolled down. Since we aren't actually chaning URL,
    // we need to scroll back up to the top for them.
    window.scrollTo(0, 0);

    if (demoId === 0) {
      $scope.demoId = 0;
      $scope.birth.month = "Jul";
      $scope.birth.year = 1950;
      $scope.birth.maxPossibleYear = 1950;
      $scope.taxEngine.updateBirthdate($scope.birth);
      $scope.fetchTestData('averagepaste.txt');
    }
    if (demoId === 1) {
      $scope.demoId = 1;
      $scope.birth.month = "Aug";
      $scope.birth.year = 1950;
      $scope.birth.maxPossibleYear = 1950;
      $scope.taxEngine.updateBirthdate($scope.birth);
      $scope.fetchTestData('millionpaste.txt');
    }
    if (demoId === 2) {
      $scope.demoId = 2;
      $scope.birth.month = "Sep";
      $scope.birth.year = 1985;
      $scope.birth.maxPossibleYear = 1985;
      $scope.taxEngine.updateBirthdate($scope.birth);
      $scope.fetchTestData('youngpaste.txt');
    }
  }

  // Rather that using copy/paste, this fn immediately loads an example test
  // paste via a json request. This allows the user to try out the interface
  // before committing to the effort of retrieving their earnings record from
  // ssa.gov.
  $scope.fetchTestData = function(filename) {
    $http.get(filename).then(
      function(contents) {
        var records = parseYearRecords(contents.data);
        $scope.taxEngine.initFromEarningsRecords(records);
        $scope.pasteArea.mode = ModeEnum.RENDER_EARNINGS;
        $scope.maybeRenderCharts();
      }, 
      function(jqxhr, textStatus, error) {
        console.log("Error loading Test Data");
        console.log(textStatus);
        console.log(error);
      }
    );
  };

  $scope.$watch('pasteArea.contents', function(newValue) {
    /** @type {!Array<!TaxRecord>} */
    var records = parseYearRecords(newValue);
    if (records.length === 0)
      return;

    $scope.taxEngine.initFromEarningsRecords(records);
    $scope.pasteArea.mode = ModeEnum.PASTE_CONFIRMATION;
    $scope.pasteArea.contents = '';

    // This is conservative as it assumes the user had wage income the
    // year they were born. I'm not sure if this is even possible, but
    // who knows.
    $scope.birth.maxPossibleYear = records[0].year;
  });
  
  $scope.confirmEarningsParse = function(confirmationValue) {
    if (confirmationValue === 'incorrect') {
      $scope.pasteArea.mode = ModeEnum.PASTE_APOLOGY;
    } else if (confirmationValue === 'correct') {
      $scope.pasteArea.mode = ModeEnum.AGE_REQUEST;
    }
  };
  
  $scope.confirmBirthDate = function() {
    $scope.taxEngine.updateBirthdate($scope.birth);
    $scope.pasteArea.mode = ModeEnum.RENDER_EARNINGS;
    $scope.maybeRenderCharts();
  }

  $scope.showPastePrompt = function() {
    return $scope.pasteArea.mode === ModeEnum.INITIAL;
  };
  $scope.showPasteConfirmation = function() {
    return $scope.pasteArea.mode === ModeEnum.PASTE_CONFIRMATION;
  };
  $scope.showPasteApology = function() {
    return $scope.pasteArea.mode === ModeEnum.PASTE_APOLOGY;
  };
  $scope.showAgeRequest = function() {
    return $scope.pasteArea.mode === ModeEnum.AGE_REQUEST;
  };
  $scope.showReport = function() {
    return $scope.pasteArea.mode === ModeEnum.RENDER_EARNINGS;
  };

  $scope.earningsRecords = function() {
    return $scope.taxEngine.earningsRecords;
  };

  /**
   * Triggers a rendering of both charts iff each chart's initialization
   * requirements have all been met, otherwise does nothing.
   */
  $scope.maybeRenderCharts = function() {
    if ($scope.breakPointChart_.isInitialized())
      $scope.breakPointChart_.render();
    if ($scope.ageChart_.isInitialized())
      $scope.ageChart_.render();
  };

  /**
   * Runs as the various partial html files have loaded. Runs code
   * specific to initializting them.
   */
  $scope.$on("$includeContentLoaded", function(event, templateName) {
    var tryRender = false;
    if (templateName == 'partials/primary-insurance-amount.html') {
      $scope.breakPointChart_.setCanvas(
          document.getElementById('breakpoint-chart-canvas'));
      tryRender = true;
    }
    if (templateName == 'partials/benefit-estimate.html') {
      $scope.ageChart_.setCanvas(
          document.getElementById('age-chart-canvas'));
      tryRender = true;
    }

    if (tryRender)
      $scope.maybeRenderCharts();
  });

  $scope.reset = function() {
    $scope.taxEngine = new TaxEngine();
    $scope.pasteArea.mode = ModeEnum.INITIAL;
  };

  $scope.pastYears = function() {
    var pastYears = [];
    // We want a multiple of 7 years, want to be sure to include the user's
    // birth year, and don't want to include more than we need to.
    
    // Start at 70 years ago, anyone older than that is already collecting
    // social security (and can just pick 70 for example).
    const start = CURRENT_YEAR - 70;
    // End at the first year we have earnings records for. I don't think anyone
    // could have earnings records before they were born.
    var end = $scope.birth.maxPossibleYear;
    // Add a few years to make sure we have a multiple of 7:
    end += (7 - (end - start + 1) % 7)

    for (var i = start; i <= end; ++i) {
      pastYears.push(i);
    }
    return pastYears;
  }

  $scope.isLastYearIncomplete = function() {
    for (var i = 0; i < $scope.taxEngine.earningsRecords.length; ++i) {
      record = $scope.taxEngine.earningsRecords[i];
      if (record.year === (CURRENT_YEAR - 1))
        return record.taxedEarnings === -1;
    }
    return false;
  }

  $scope.updateFutureYears = function(id) {
    $scope.taxEngine.simulateFutureEarningsYears(
        /*numYears=*/$scope.futureYearsWorkSlider.minValue,
        /*wage=*/$scope.futureWageWorkSlider.minValue);
    $scope.maybeRenderCharts();
    $scope.futureYears = [];
    var incompleteAdj = $scope.isLastYearIncomplete() ? 1 : 0;
    for (var i = 0; i < $scope.futureYearsWorkSlider.minValue; i++) {
      $scope.futureYears.push(i + CURRENT_YEAR - incompleteAdj);
    }

    $scope.futureIsTopValue = (
        ($scope.futureWageWorkSlider.minValue >=
         $scope.taxEngine.cutoffIndexedEarnings) &&
        ($scope.futureWageWorkSlider.minValue > 0));
  }
 
  $scope.futureYearsWorkSlider = {
    minValue: 0,
    options: {
     floor: 0,
     ceil: 35,
     step: 1,
     translate: function(value, sliderId, label) {
      if (label === 'model') {
       if (value === 35)
        return value + '+'
       return value;
      }
      return '';
     },
     onChange: $scope.updateFutureYears,
    },

  };

  $scope.futureWageWorkSlider = {
    minValue: 1000,
    options: {
     floor: 1000,
     ceil: MAXIMUM_EARNINGS[CURRENT_YEAR],
     step: 1000,
     translate: function(value, sliderId, label) {
      if (label === 'model') {
       if (value === this.options.ceil)
        return '$' + $filter('number')(value) + '+'
       return '$' + $filter('number')(value);
      }
      return '';
     },
     onChange: $scope.updateFutureYears,
    }
  };

  $scope.$on("slideEnded", function() {
    $scope.taxEngine.simulateFutureEarningsYears(
      /*numYears=*/$scope.futureYearsWorkSlider.minValue,
      /*wage=*/$scope.futureWageWorkSlider.minValue);
    $scope.maybeRenderCharts();
  });

  $scope.birth = {
    month: "",
    year: 0
  }

  $scope.birthDateSelected = function() {
    return $scope.birth.year !== 0 && $scope.birth.month !== "";
  }

  $scope.updateBirthdate = function() {
    // Only update once there are some non-default values set.
    if (!$scope.birthDateSelected())
      return; 
    $scope.birth.year = parseInt($scope.birth.year);
    $scope.taxEngine.updateBirthdate($scope.birth);
  }
});
