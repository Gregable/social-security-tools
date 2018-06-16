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
    $scope.spousalChartSelectedDate = 0;
    $scope.spousalChart_ = new SpousalChart(
        $scope.updateSpousalChartSelectedDate);

    $scope.recipient = new Recipient("Self");
    $scope.spouse = new Recipient("Spouse");
    $scope.spouse.setPrimaryInsuranceAmountValue = 0;
    $scope.recipient.setSpouse($scope.spouse);
    $scope.spouse.setSpouse($scope.recipient);

    $scope.mode = ModeEnum.INITIAL;
    $scope.futureYears = [];
    $scope.futureIsTopValue = false;
    $scope.all_months = ALL_MONTHS;
    $scope.demoId = -1;
  
    $scope.showMedicare = true;
    $scope.showIndexedEarnings = false;

    $scope.breakPointChart_.setRecipient($scope.recipient);
    $scope.ageChart_.setRecipient($scope.recipient);
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
      $scope.updateBirthdate();
      $scope.fetchTestData('averagepaste.txt');
      $scope.refreshSlider();
    }
    if (demoId === 1) {
      $scope.demoId = 1;
      $scope.birth.month = "Aug";
      $scope.birth.year = 1950;
      $scope.birth.maxPossibleYear = 1950;
      $scope.updateBirthdate();
      $scope.fetchTestData('millionpaste.txt');
      $scope.refreshSlider();
    }
    if (demoId === 2) {
      $scope.demoId = 2;
      $scope.birth.month = "Sep";
      $scope.birth.year = 1985;
      $scope.birth.maxPossibleYear = 1985;
      $scope.updateBirthdate();
      $scope.fetchTestData('youngpaste.txt');
      $scope.refreshSlider();
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
        $scope.refreshSlider();
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

  $scope.refreshSlider = function() {
    $timeout(function () {
      $scope.$broadcast('rzSliderForceRender');
		  $scope.layoutSliderChart();
    });
  };
  
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
    $scope.refreshSlider();
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
    
    $scope.refreshSlider();
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
    this.lowerSlider_ = null;
    this.earnerFn = earnerFn;
    this.value = 65 * 12;
    this.options = {
      floor: 62*12,
      ceil: 70*12,
      // minLimit is relative to the floor.
      minLimit: 0,
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
      },
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
    this.setLowerEarnerSlider = function(earnerSlider) {
      self = this;
      this.options.onChange = function() {
        // If the lower earner does not have a personal benefit, it makes no
        // sense for that earner to file for benefits before the higher earner.
        // In this specific case, we set the date of the higher earner's slider
        // as the minimum date for the lower earner's slider.
        var lowerEarner = earnerSlider.earnerFn();
        if (lowerEarner.primaryInsuranceAmountFloored() > 0)
          return;
        var higherEarner = earnerFn();
        var date = higherEarner.dateMonthsAtAge(
            Math.floor(self.value / 12), self.value % 12);
        var lowerAgeAtDate = Math.max(62,
            lowerEarner.monthsOldAtDate(Math.floor(date / 12), date % 12));
        if (earnerSlider.value < lowerAgeAtDate)
          earnerSlider.value = lowerAgeAtDate;
        // This hack lets the lower slider 'ride' left with the upper slider.
        if (earnerSlider.options.minLimit === earnerSlider.value - (62 * 12))
          earnerSlider.value = lowerAgeAtDate;
        earnerSlider.options.minLimit = lowerAgeAtDate - (62 * 12);
        
        $scope.spousalChart_.render();
      }
    }
  }

  $scope.higherEarnerSlider = new spousalSlider($scope.higherEarner);
  $scope.lowerEarnerSlider = new spousalSlider($scope.lowerEarner);
  //$scope.higherEarnerSlider.setLowerEarnerSlider($scope.lowerEarnerSlider);

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

  // This method lays out the spousal age sliders and associated spousal chart.
  // The sliders will be verically aligned by year, adjusting for the spouses
  // ages. The spousal chart will align with the years on the slider.
  $scope.layoutSliderChart = function() {
    // Return early if the spousalBenefit section hasn't been rendered yet.
    var section = document.getElementById('spousalBenefit');
    if (section === null) return;

    var higherSlider = document.getElementById('higherEarnerSlider');
    var lowerSlider = document.getElementById('lowerEarnerSlider');
    var higherSliderBounds = $scope.absoluteBoundingRect(higherSlider);
    var lowerSliderBounds = $scope.absoluteBoundingRect(lowerSlider);
    // Return early if the sliders haven't redrawn and have zero size.
    if (higherSliderBounds.width == 0 || lowerSliderBounds.width == 0)
      return;

    // Refresh the ages for the two sliders.
    $scope.higherEarnerSlider.refresh();
    $scope.lowerEarnerSlider.refresh();

    // TODO: Handle cases where the earners are more than 10
    // years apart in a better way. Currently, the sliders get
    // bunched up since time is represented linearly.


    // The number of months spanned is 8 years (age 62 - 70) plus the
    //  difference in ages of the two earners.
    var higherMonths = $scope.higherEarner().monthsOldAtDate(62, 0);
    var lowerMonths = $scope.lowerEarner().monthsOldAtDate(62, 0);
    var numMonths = Math.abs(higherMonths - lowerMonths) + (8*12);
    // Each slider has a small 'tail' on each side of the slider which is
    // 16px wide that we must ignore in the total width.
    var totalWidth = $scope.absoluteBoundingRect(section).width - 32;
    // Each slider should be 8*12 months wide and the whole thing
    // is totalWidth wide. The margin is the width that each slider will
    // not occupy.
    var newMargin = (1 - (8*12 / numMonths)) * totalWidth;

    // chartStartDate and chartEndDate will be months since year 0. They
    // represent the start and end date for the entire spousal chart.
    var chartStartDate;
    var chartEndDate;
    if (higherMonths < lowerMonths) {  // Higher earner is younger
      higherSlider.setAttribute('style', "margin-left: " + newMargin + "px");
      lowerSlider.setAttribute('style', "margin-right: " + newMargin + "px");
      chartStartDate = $scope.lowerEarner().dateMonthsAtAge(62);
      chartEndDate = $scope.higherEarner().dateMonthsAtAge(70);
    } else if (higherMonths > lowerMonths) {  // Higher earner is older
      higherSlider.setAttribute('style', "margin-right: " + newMargin + "px");
      lowerSlider.setAttribute('style', "margin-left: " + newMargin + "px");
      chartStartDate = $scope.higherEarner().dateMonthsAtAge(62);
      chartEndDate = $scope.lowerEarner().dateMonthsAtAge(70);
    } else { // both earners same birth month and year
      higherSlider.setAttribute('style', "");
      lowerSlider.setAttribute('style', "");
      chartStartDate = $scope.lowerEarner().dateMonthsAtAge(62);
      chartEndDate = $scope.lowerEarner().dateMonthsAtAge(70);
    }

    // We may have resized the element containing the sliders at this point.
    // We want to rebroadcast that the element's children should relayout one
    // more time.
    $scope.$broadcast('rzSliderForceRender');

    // Create the chart or update it's position.
    var absLeft = Math.min(higherSliderBounds.left, lowerSliderBounds.left);
    var absRight = Math.max(higherSliderBounds.right, lowerSliderBounds.right);
    var absWidth = absRight - absLeft;
    var canvas;
    if (!$scope.spousalChart_.isInitialized()) {
      canvas = document.createElement("canvas");
      canvas.setAttribute('id', 'spousal-chart-canvas');
      canvas.setAttribute('width', absWidth);
      canvas.setAttribute('height', 620);
      $scope.spousalChart_.setCanvas(canvas);
      document.body.appendChild(canvas);
    } else {
      canvas = document.getElementById('spousal-chart-canvas');
    }
    // The canvas is absolutely positioned on the page based on the location
    // of other elements, so it must be repositioned on any changes which
    // can relayout the document.
    canvas.style.top = higherSliderBounds.top + 'px'
    canvas.style.left = absLeft + 'px'
    canvas.style.zIndex = "1";

    $scope.spousalChart_.setRecipients(
        $scope.lowerEarner(), $scope.higherEarner());
    $scope.spousalChart_.setSliders(
        $scope.lowerEarnerSlider, $scope.higherEarnerSlider);
    $scope.spousalChart_.setDateRange(chartStartDate, chartEndDate);
    $scope.spousalChart_.render();
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

  // Callback from spousal chart's mouse handlers. |date| is the number of
  // months since epoch of the selected date in the spousal chart.
  $scope.updateSpousalChartSelectedDate = function(dateMonths) {
    $scope.spousalSelection = {};
    $scope.spousalSelection.show = (dateMonths > 0);
    if ($scope.spousalSelection.show) {
      $scope.spousalSelection.dateText =
        ALL_MONTHS[dateMonths % 12] + ' ' + Math.floor(dateMonths / 12);

      var lowerAge = $scope.lowerEarner().ageAtDate(dateMonths);

      if ($scope.lowerEarner().dateMonthsAtAge(0) +
          this.lowerEarnerSlider_.value > dateMonths) {
        $scope.spousalSelection.lowerEarnerBenefit = 0;
      } else if ($scope.higherEarner().dateMonthsAtAge(0) +
               this.higherEarnerSlider_.value > dateMonths) {
        $scope.spousalSelection.lowerEarnerBenefit =
            $scope.lowerEarner().benefitAtAge(
                Math.floor(this.lowerEarnerSlider_.value / 12),
                this.lowerEarnerSlider_.value % 12);
      } else {
        $scope.spousalSelection.lowerEarnerBenefit =
            $scope.lowerEarner().totalBenefitWithSpousal(
                Math.floor(this.lowerEarnerSlider_.value / 12),
                this.lowerEarnerSlider_.value % 12);
      };
      
      if ($scope.higherEarner().dateMonthsAtAge(0) +
          this.higherEarnerSlider_.value > dateMonths) {
        $scope.spousalSelection.higherEarnerBenefit = 0;
      } else {
        $scope.spousalSelection.higherEarnerBenefit =
          $scope.higherEarner().benefitAtAge(
              Math.floor(this.higherEarnerSlider_.value / 12),
              this.higherEarnerSlider_.value % 12);
      };

      $scope.spousalSelection.lowerEarnerBenefit = 
        Math.floor($scope.spousalSelection.lowerEarnerBenefit);
      $scope.spousalSelection.higherEarnerBenefit = 
        Math.floor($scope.spousalSelection.higherEarnerBenefit);
    }
    $scope.$apply();
  }

 
})
