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
    $scope.spousalChart_ = new SpousalChart();

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

    // TODO(gregable): Remove this line:
    $scope.spouseBirth.year += 2;

    $scope.updateSpouseBirthdate();
  }
 
  // Called whenever the spousal birthdate is modified.
  $scope.updateSpouseBirthdate = function() {
    // Only update once there are some non-default values set.
    if (!$scope.birthDateSelected($scope.spouseBirth))
      return; 
    $scope.spouseBirth.year = parseInt($scope.spouseBirth.year);
    $scope.spouse.updateBirthdate($scope.spouseBirth);

		$scope.adjustSliderTimelines();
  }

  $scope.runOnceSpousalReportIsVisible = function() {
    // Bug fix. The slider may not initially be visible, so we need to tell
    // it to re-render after it becomes visible the first time. This f'n
    // is triggered by a hidden span in the spousal report.
    if (!$scope.spousalBenefitLayoutRun && $scope.spousalBenefit() > 0) {
      $scope.spousalBenefitLayoutRun = true;
      $scope.adjustSliderTimelines();
    }
    return false;
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
    return $scope.spousalBenefit() > 0;
  }

  // Steps Array method for spousalSlider below. Produces the full
  // array of all valid options on the slider bar, which is one for
  // each month between 62 and 70 years of age. Adds ticks at every
  // year of age and the legend 'NRA' at the user's Normal Retirement
  // Age.
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
  // Ticks tooltip function for the spousalSlider below.
  $scope.ticksTooltip = function(normal_retirement_age, value) {
    if (value === normal_retirement_age - 62*12)
      return 'Normal Retirement Age';
  };

  // Config for choosing a benefits starting age for a single spouse. We
  // instantiate two of these.
  function spousalSlider(earnerFn) {
    this.earnerFn = earnerFn;
    this.value = 65 * 12;
    this.options = {
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
      onChange: function(id) {
        $scope.spousalChart_.render();
      }
    },
    // Refresh method called externally for some events to cause redraw.
    this.refresh = function() {
      var normalRetirementAgeMonths = 12 * 65;
      if ($scope.showReport())  // before this point, the data may be missing.
        normalRetirementAgeMonths = 
          (12 * this.earnerFn().normalRetirement.ageYears) +
          this.earnerFn().normalRetirement.ageMonths;

      this.options.stepsArray = $scope.stepsArray(normalRetirementAgeMonths);
      this.options.ticksTooltip =
        $scope.ticksTooltip.bind(null, normalRetirementAgeMonths);
      this.value = normalRetirementAgeMonths;
    }
  }

  $scope.higherEarnerSlider = new spousalSlider($scope.higherEarner);
  $scope.lowerEarnerSlider = new spousalSlider($scope.lowerEarner);

  $scope.createCanvasElement = function(x, y, width, height) {
    var canvas = document.createElement("canvas");
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    canvas.setAttribute('id', 'spousal-chart-canvas');
    canvas.setAttribute('style', 'top: ' + y + 'px; left: ' + x + 'px; ');

    return canvas;
	}

  $scope.absoluteBoundingRect = function(element) {
    var doc  = document;
    var win  = window;
    var body = doc.body;

    // pageXOffset and pageYOffset work everywhere except IE <9.
    var offsetX = win.pageXOffset !== undefined ? win.pageXOffset :
            (doc.documentElement || body.parentNode || body).scrollLeft;
    var offsetY = win.pageYOffset !== undefined ? win.pageYOffset :
            (doc.documentElement || body.parentNode || body).scrollTop;

    var rect = element.getBoundingClientRect();

    if (element !== body) {
        var parent = element.parentNode;

        // The element's rect will be affected by the scroll positions of
        // *all* of its scrollable parents, not just the window, so we have
        // to walk up the tree and collect every scroll offset. Good times.
        while (parent !== body) {
            offsetX += parent.scrollLeft;
            offsetY += parent.scrollTop;
            parent   = parent.parentNode;
        }
    }

    return {
        bottom: rect.bottom + offsetY,
        height: rect.height,
        left  : rect.left + offsetX,
        right : rect.right + offsetX,
        top   : rect.top + offsetY,
        width : rect.width
    };
  }

  $scope.createLineElement = function(x, y, length, angle) {
    var line = document.createElement("div");
    var styles = 'width: ' + length + 'px; '
               + '-moz-transform: rotate(' + angle + 'rad); '
               + '-webkit-transform: rotate(' + angle + 'rad); '
               + '-o-transform: rotate(' + angle + 'rad); '  
               + '-ms-transform: rotate(' + angle + 'rad); '  
               + 'top: ' + y + 'px; '
               + 'left: ' + x + 'px; ';
    line.setAttribute('style', styles);  
    line.setAttribute('class', 'lineElement');
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

  // Method adjusts the spousal age sliders so that they are vertically
  // aligned by year.
  $scope.adjustSliderTimelines = function() {
    // First refresh the ages for the two sliders.
    $scope.higherEarnerSlider.refresh();
    $scope.lowerEarnerSlider.refresh();

    var section = document.getElementById('spousalBenefit');
    if (section === null) return;
    // Each slider has a small 'tail' on each side of the slider which is
    // 16px wide that we must ignore in the total width;
    var totalWidth = $scope.absoluteBoundingRect(section).width - 32;
    var higherMonths = $scope.higherEarner().monthsOldAtDate(62, 0);
    var lowerMonths = $scope.lowerEarner().monthsOldAtDate(62, 0);
    var higherSlider = document.getElementById('higherEarnerSlider');
    var lowerSlider = document.getElementById('lowerEarnerSlider');

    // TODO: We should handle cases where the earners are more than 8
    // years apart in a better way.

    var numMonths = Math.abs(higherMonths - lowerMonths) + (8*12);
    // Each slider should be 8*12 months wide and the whole thing
    // is totalWidth wide.
    var newMargin = (1 - (8*12 / numMonths)) * totalWidth;
    if (higherMonths < lowerMonths) {  // Higher earner is younger
      higherSlider.setAttribute('style', "margin-left: " + newMargin + "px");
      lowerSlider.setAttribute('style', "margin-right: " + newMargin + "px");
      $scope.drawSliderYears($scope.lowerEarner().dateMonthsAtAge(62),
                             $scope.higherEarner().dateMonthsAtAge(70));
    } else if (higherMonths > lowerMonths) {  // Higher earner is older
      higherSlider.setAttribute('style', "margin-right: " + newMargin + "px");
      lowerSlider.setAttribute('style', "margin-left: " + newMargin + "px");
      $scope.drawSliderYears($scope.higherEarner().dateMonthsAtAge(62),
                             $scope.lowerEarner().dateMonthsAtAge(70));
    } else { // both earners same birth month and year
      higherSlider.setAttribute('style', "");
      lowerSlider.setAttribute('style', "");
      $scope.drawSliderYears($scope.lowerEarner().dateMonthsAtAge(62),
                             $scope.lowerEarner().dateMonthsAtAge(70));
    }
    // Force a rerender of the slider.
    $scope.$broadcast('rzSliderForceRender');
  }

  // startDate and endDate must be in months since year 0.
  $scope.drawSliderYears = function(startDate, endDate) {
    var higherSlider = document.getElementById('higherEarnerSlider');
    var higherBounds = $scope.absoluteBoundingRect(higherSlider);
    var lowerSlider = document.getElementById('lowerEarnerSlider');
    var lowerBounds = $scope.absoluteBoundingRect(lowerSlider);
        
    var absLeft = Math.min(higherBounds.left, lowerBounds.left);
    var absRight = Math.max(higherBounds.right, lowerBounds.right);
    var absWidth = absRight - absLeft;

    if (!$scope.spousalChart_.isInitialized()) {
      var canvas = $scope.createCanvasElement(
          absLeft, higherBounds.top, absWidth, 600);
      document.body.appendChild(canvas);
      $scope.spousalChart_.setCanvas(canvas);
    }

    $scope.spousalChart_.setRecipients(
        $scope.lowerEarner(), $scope.higherEarner());
    $scope.spousalChart_.setSliders(
        $scope.lowerEarnerSlider, $scope.higherEarnerSlider);
    $scope.spousalChart_.setDateRange(startDate, endDate);
    $scope.spousalChart_.render();

    /*
    // Remove the old line, present.
    var oldLines = $('div.lineElement');
    for (var i = 0; i < oldLines.size(); ++i)
      document.body.removeChild(oldLines[i]);

    var startY = higherBounds.top;
    var endY = lowerBounds.bottom;
    var leftX = higherBounds.left + 16;
    var rightX = lowerBounds.right - 16;

    console.log(startDate);
    console.log(endDate);
    for (var i = startDate; i <= endDate; ++i) {
      console.log(i);
      if (i % 12 !== 0)
        continue;

      var x = (i - startDate) / (endDate - startDate) *
        (rightX - leftX) + leftX;
      console.log(x);

      var line = $scope.createLine(x, startY, x, endY);
      line.setAttribute('id', 'sliderLine');
      document.body.appendChild(line);
    }
    */
  }
  
  $scope.filingDate = function(sliderValue, earner) {
    const ageYears = Math.floor(sliderValue / 12);
    const ageMonths = Math.floor(sliderValue % 12);
    return earner.dateAtAge(ageYears, ageMonths);
  }

  $scope.higherEarnerFilingDate = function() {
    return $scope.filingDate(
        $scope.higherEarnerSlider.value, $scope.higherEarner());
  }
 
  $scope.lowerEarnerFilingDate = function() {
    return $scope.filingDate(
        $scope.lowerEarnerSlider.value, $scope.lowerEarner());
  }
})
