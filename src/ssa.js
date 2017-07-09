var ssaApp = angular.module("ssaApp", ['ngAnimate', 'rzModule', 'ui.bootstrap']);

// The app has 5 modes which the user can be in, based on the information
// entered so far.
var ModeEnum = {
  // Starting in initial mode, we render paste-prompt.html and request
  // either a ssa.gov paste or to load demo data.
  INITIAL: 'INITIAL',
  // When ssa.gov data is entered, we initially display the earings record
  // in the same css style as ssa.gov, and have a "yes/no" confirmation box.
  // This is paste-confirm.html
  PASTE_CONFIRMATION: 'PASTE_CONFIRMATION',
  // If the user selects "no" to the paste, we display a "Sorry" view with a
  // button to call reset(). This is also paste-confirm.html
  PASTE_APOLOGY: 'PASTE_APOLOGY',
  // If the user selects "yes", we then prompt them to enter their age. This
  // is age-request.html.
  AGE_REQUEST: 'AGE_REQUEST',
  // Finally, once age is selected, we move into render earnings mode.
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
    $scope.Math = window.Math;
    $scope.breakPointChart_ = new BreakPointChart();
    $scope.ageChart_ = new AgeChart();

    $scope.recipient = new Recipient("Greg");
    $scope.spouse = new Recipient("Cristin");
    $scope.spouse.primaryInsuranceAmountValue = 200;

    $scope.recipient.setSpouse($scope.spouse);
    $scope.spouse.setSpouse($scope.recipient);

    $scope.mode = ModeEnum.INITIAL;
    $scope.futureYears = [];
    $scope.futureIsTopValue = false;
    $scope.all_months = ALL_MONTHS;
    $scope.demoId = -1;
  
    $scope.showMedicare = true;
    $scope.showIndexedEarnings = false;
    $scope.spousalBenefitLayoutRun = false;

    $scope.breakPointChart_.setRecipient($scope.recipient);
    $scope.ageChart_.setRecipient($scope.recipient);
    $scope.maybeRenderCharts();

    $scope.loadDemoData(0);
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
      $scope.updateBirthdate();
      $scope.fetchTestData('averagepaste.txt');
    }
    if (demoId === 1) {
      $scope.demoId = 1;
      $scope.birth.month = "Aug";
      $scope.birth.year = 1950;
      $scope.birth.maxPossibleYear = 1950;
      $scope.updateBirthdate();
      $scope.fetchTestData('millionpaste.txt');
    }
    if (demoId === 2) {
      $scope.demoId = 2;
      $scope.birth.month = "Sep";
      $scope.birth.year = 1985;
      $scope.birth.maxPossibleYear = 1985;
      $scope.updateBirthdate();
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
        $scope.recipient.initFromEarningsRecords(records);
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
    /** @type {!Array<!EarningRecord>} */
    var records = parseYearRecords(newValue);
    if (records.length === 0)
      return;

    $scope.recipient.initFromEarningsRecords(records);
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
    $scope.updateBirthdate();
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
    return $scope.recipient.earningsRecords;
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
    // Recompute sliders as well.
    $scope.higherEarnerSlider.refresh();
    $scope.lowerEarnerSlider.refresh();
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
    $scope.recipient = new Recipient();
    $scope.pasteArea.mode = ModeEnum.INITIAL;
  };

  $scope.primaryEarnerYears = function() {
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

  $scope.allAgeYears = function() {
    var pastYears = [];
    // We want a multiple of 7 years, want to be sure to include the user's
    // birth year, and don't want to include more than we need to.
    
    // Start at 70 years ago, anyone older than that is already collecting
    // social security (and can just pick 70 for example).
    const start = CURRENT_YEAR - 70;
    // I'm going to assume that anyone married is at least 18. While it's
    // possibly incorrect technically, I think it's close enough for our
    // purposes here.
    var end = CURRENT_YEAR - 18;
    // Add a few years to make sure we have a multiple of 7:
    end += (7 - (end - start + 1) % 7)

    for (var i = start; i <= end; ++i) {
      pastYears.push(i);
    }
    return pastYears;
  }

  $scope.isLastYearIncomplete = function() {
    for (var record of $scope.recipient.earningsRecords) {
      if (record.year === (CURRENT_YEAR - 1))
        return record.taxedEarnings === -1;
    }
    return false;
  }

  $scope.updateFutureYears = function(id) {
    $scope.recipient.simulateFutureEarningsYears(
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
         $scope.recipient.cutoffIndexedEarnings) &&
        ($scope.futureWageWorkSlider.minValue > 0));
  }
 
  $scope.futureYearsWorkSlider = {
    minValue: 0,
    options: {
     showSelectionBar: true,
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
     showSelectionBar: true,
     floor: 1000,
     ceil: MAXIMUM_EARNINGS[CURRENT_YEAR - 1],
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

  $scope.birth = {
    month: "",
    year: 0
  }

  $scope.spouseBirth = {
    month: "",
    year: 0,
  }

  $scope.birthDateSelected = function(birthdate) {
    return birthdate.year !== 0 && birthdate.month !== "";
  }

  $scope.updateBirthdate = function() {
    // Only update once there are some non-default values set.
    if (!$scope.birthDateSelected($scope.birth))
      return; 
    $scope.birth.year = parseInt($scope.birth.year);
    $scope.recipient.updateBirthdate($scope.birth);

    // Also set the spouses birthdate to the same, which is a
    // reasonable default to start with, until the user selects
    // differently.
    $scope.spouseBirth.month = $scope.birth.month;
    $scope.spouseBirth.year = $scope.birth.year;
    $scope.spouse.updateBirthdate($scope.spouseBirth);
     
    $scope.higherEarnerSlider.refresh();
		$scope.adjustSliderConnectionLine();
  }
 
  // Called whenever the spousal birthdate is modified.
  $scope.updateSpouseBirthdate = function() {
    // Only update once there are some non-default values set.
    if (!$scope.birthDateSelected($scope.spouseBirth))
      return; 
    $scope.spouseBirth.year = parseInt($scope.spouseBirth.year);
    $scope.spouse.updateBirthdate($scope.spouseBirth);

    $scope.lowerEarnerSlider.refresh();
		$scope.adjustSliderConnectionLine();
  }

  $scope.higherEarner = function() {
    if ($scope.recipient.primaryInsuranceAmount() >=
        $scope.spouse.primaryInsuranceAmount()) {
      return $scope.recipient;
    } else {
      return $scope.spouse;
    }
  }

  $scope.lowerEarner = function() {
    if ($scope.recipient.primaryInsuranceAmount() <
        $scope.spouse.primaryInsuranceAmount()) {
      return $scope.recipient;
    } else {
      return $scope.spouse;
    }
  }

  $scope.spousalMax = function() {
    return $scope.higherEarner().primaryInsuranceAmount() / 2.0;
  }

  $scope.spousalBenefit = function() {
    return Math.max(0, 
        $scope.spousalMax() - $scope.lowerEarner().primaryInsuranceAmount());
  }

  $scope.spousalBenefitFraction = function() {
    var actualFraction = Math.min(1.0, 
          ($scope.lowerEarner().primaryInsuranceAmount() /
           $scope.spousalMax())) * 100.0;
    // If the actual number is > 0, return at least 1%.
    if (actualFraction > 0 ||
        ($scope.lowerEarner().primaryInsuranceAmount() == 0)) {
      return actualFraction;
    }
    return 1;
  }

  // If the lower earner's PIA is more than half of the higher
  // earner's PIA, then the spousal benefit would be smaller than
  // their own benefit, and there is nothing to collect.
  $scope.isSpousalBenefit = function() {
    // Bug fix. The slider may not initially be visible, so we need to tell
    // it to re-render after it becomes visible the first time.
    if (!$scope.spousalBenefitLayoutRun && $scope.spousalBenefit() > 0) {
      $scope.spousalBenefitLayoutRun = true;
      $timeout(function() {
        $scope.$broadcast('rzSliderForceRender');
      }, 40, false);
    }
    return $scope.spousalBenefit() > 0;
  }

  // Steps Array method for higherEarnerSlider below.
  $scope.stepsArray = function(normal_retirement_age) {
    out = [];
    for (i = 62*12; i <= 70*12; i += 1) {
      if (i === normal_retirement_age) {
        out.push({ value: i, legend: 'NRA' });
      } else {
        out.push({ value: i});
      }
    }
    return out;
  }
  $scope.ticksTooltip = function(normal_retirement_age, value) {
    if (value === normal_retirement_age - 62*12)
      return 'Normal Retirement Age';
  };

  $scope.higherEarnerSlider = {
    value: 65*12,
    options: {
     floor: 62*12,
     ceil: 70*12,
     showSelectionBarEnd: true,
     translate: function(value, sliderId, label) {
      const ageYears = Math.floor(value / 12);
      const ageMonths = value % 12;
      // model is the text above the slider pointer
      if (label === 'model') {
        if (ageMonths === 0)
          return ageYears;
        return ageYears + ' ' + ageMonths + ' mo';
      }
      // tick-value is the text above each tick mark
      if (label === 'tick-value') {
        return ageYears;
      }
      return '';
     },
     // Show every 12th tick, so yearly.
     showTicksValues: 12,
     ticksTooltip: $scope.ticksTooltip.bind(null, -1),
     stepsArray: $scope.stepsArray(-1),
     id: 'slider-id',
     onChange: function(id) { $scope.adjustSliderConnectionLine(); },
    },
    // Refresh to pick up certain changes.
    refresh: function() {
      var normal_retirement_age = 65;
      if ($scope.showReport())  // before this point, the data may be missing.
        normal_retirement_age = 
          (12 * $scope.higherEarner().normalRetirement.ageYears) +
          $scope.higherEarner().normalRetirement.ageMonths;

      $scope.higherEarnerSlider.options.stepsArray =
        $scope.stepsArray(normal_retirement_age);
      $scope.higherEarnerSlider.options.ticksTooltip =
        $scope.ticksTooltip.bind(null, normal_retirement_age);
      $scope.higherEarnerSlider.value = normal_retirement_age;
      $scope.adjustSliderConnectionLine();
    },
  };

  $scope.higherEarnerFilingDate = function() {
    const ageYears = Math.floor($scope.higherEarnerSlider.value / 12);
    const ageMonths = Math.floor($scope.higherEarnerSlider.value % 12);
    return $scope.higherEarner().dateAtAge(ageYears, ageMonths);
  }

  $scope.createLineElement = function(x, y, length, angle) {
    var line = document.createElement("div");
    var styles = 'border: 1px solid #5cb85c; '
               + 'width: ' + length + 'px; '
               + 'height: 0px; '
               + '-moz-transform: rotate(' + angle + 'rad); '
               + '-webkit-transform: rotate(' + angle + 'rad); '
               + '-o-transform: rotate(' + angle + 'rad); '  
               + '-ms-transform: rotate(' + angle + 'rad); '  
               + 'position: absolute; '
               + 'top: ' + y + 'px; '
               + 'left: ' + x + 'px; ';
    line.setAttribute('style', styles);  
    return line;
	}

	$scope.createLine = function(x1, y1, x2, y2) {
    var a = x1 - x2,
        b = y1 - y2,
        c = Math.sqrt(a * a + b * b);

    var sx = (x1 + x2) / 2,
        sy = (y1 + y2) / 2;

    var x = sx - c / 2,
        y = sy;

    var alpha = Math.PI - Math.atan2(-b, a);

    return $scope.createLineElement(x, y, c, alpha);
	}

  $scope.centerOfElement = function(el) {
    var center = {x: 0, y: 0};
    var bounds = el.getBoundingClientRect();
    center.x = (bounds.left + bounds.right) / 2 + window.scrollX;
    center.y = (bounds.top + bounds.bottom) / 2 + window.scrollY;
    return center;
  }

  $scope.adjustSliderConnectionLine = function() {
    var pointerList = $('#higherEarnerSlider div.rzslider span.rz-pointer');
    if (pointerList.length === 0)  // Not loaded yet;
      return;
    var highCenter = $scope.centerOfElement(
        $('#higherEarnerSlider div.rzslider span.rz-pointer')[0]);
    var lowCenterLeft = $scope.centerOfElement(
        $('#lowerEarnerSlider div.rzslider ul li')[0]);
    var lowCenterRight = $scope.centerOfElement(
        $('#lowerEarnerSlider div.rzslider ul li')[8]);

    dateAtHigherFiling = $scope.higherEarnerFilingDate();
    lowerAgeAtHigherFiling = $scope.lowerEarner().ageAtDate(
        dateAtHigherFiling.year, monthIndex(dateAtHigherFiling.month));
    lowerAgeInMonths = 
      lowerAgeAtHigherFiling.year * 12 +
      monthIndex(lowerAgeAtHigherFiling.month);
    var lowerAgeX;
    if (lowerAgeInMonths < 62 * 12) {
      lowerAgeX = lowCenterLeft.x - 5;
    } else if (lowerAgeInMonths > 70 * 12) {
      lowerAgeX = lowCenterRight.x + 5;
    } else {
      lowerAgeX = ((lowerAgeInMonths - 62*12) / (8*12)) *
        (lowCenterRight.x - lowCenterLeft.x) + lowCenterLeft.x;
    }

    // Remove the old line, if present.
    var lineEl = $('#ageConnectorLine');
    if (lineEl.length !== 0)
      document.body.removeChild(lineEl[0]);

    // Add a new line.
    var newLineEl =
        $scope.createLine(highCenter.x, highCenter.y,
                          lowerAgeX, lowCenterLeft.y);
    newLineEl.setAttribute('id', 'ageConnectorLine');
		document.body.appendChild(newLineEl);
  };

  //$scope.$on("slideEnded", $scope.adjustSliderConnectionLine);
 
  $scope.lowerEarnerSlider = {
    value: 65*12,
    options: {
     floor: 62*12,
     ceil: 70*12,
     showSelectionBarEnd: true,
     translate: function(value, sliderId, label) {
      const ageYears = Math.floor(value / 12);
      const ageMonths = value % 12;
      // model is the text above the slider pointer
      if (label === 'model') {
        if (ageMonths === 0)
          return ageYears;
        return ageYears + ' ' + ageMonths + ' mo';
      }
      // tick-value is the text above each tick mark
      if (label === 'tick-value') {
        return ageYears;
      }
      return '';
     },
     // Show every 12th tick, so yearly.
     showTicksValues: 12,
     ticksTooltip: $scope.ticksTooltip.bind(null, -1),
     stepsArray: $scope.stepsArray(-1),
    },
    // Refresh to pick up certain changes.
    refresh: function() {
      var normal_retirement_age = 65;
      if ($scope.showReport())  // before this point, the data may be missing.
        normal_retirement_age = 
          (12 * $scope.lowerEarner().normalRetirement.ageYears) +
          $scope.lowerEarner().normalRetirement.ageMonths;

      $scope.lowerEarnerSlider.options.stepsArray =
        $scope.stepsArray(normal_retirement_age);
      $scope.lowerEarnerSlider.options.ticksTooltip =
        $scope.ticksTooltip.bind(null, normal_retirement_age);
      $scope.lowerEarnerSlider.value = normal_retirement_age;
      $scope.adjustSliderConnectionLine();
    }
  }


 
  $scope.lowerEarnerFilingDate = function() {
    const ageYears = Math.floor($scope.lowerEarnerSlider.value / 12);
    const ageMonths = Math.floor($scope.lowerEarnerSlider.value % 12);
    return $scope.lowerEarner().dateAtAge(ageYears, ageMonths);
  }
})
