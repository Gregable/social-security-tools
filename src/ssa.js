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

// partials/navbar.html
ssaApp.controller("NavbarController", function ($scope) {
  // scollTo scrolls the window to position the element `id` at the top of the
  // page. It is used in the navbar partial to jump to different sections of the
  // document using data-ng-click.
  $scope.scrollTo = function(id) {
    var el = $('#' + id);
    var pos = el.position();
    window.scrollTo(pos.left, pos.top + 10);
  };
});

// partials/age-request.html
ssaApp.controller("AgeRequestController", function ($scope) {
 /**
   * Initialization
   */
  $scope.init = function() {
    $scope.all_months = ALL_MONTHS;
  }

  /** 
   * Used to produce the birthdate picker for the primary earner. Enumerates
   * possible birth years for the primary earner. Always returns a multiple of
   * 7 number of years, so that the picker is a grid.
   * @return {Array<number>}
   */
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
  };
});

// partials/birthdate.html
ssaApp.controller("BirthdateController", function ($scope) {
  $scope.ShouldRender = function() {
    // Only render in the report mode.
    if ($scope.mode !== ModeEnum.RENDER_EARNINGS)
      return false;
    // Only render if not a demo.
    return $scope.demoId === -1;
  };
});

ssaApp.controller("SSAController", function ($scope, $filter, $http, $timeout) {
 /**
   * Initialization
   */
  $scope.init = function() {
    $scope.Math = window.Math;
    $scope.breakPointChart_ = new BreakPointChart();
    $scope.ageChart_ = new AgeChart();
    $scope.spousalChartSelectedDate = new MonthDate();
    
    $scope.selfBirthdayInput = '0000-01-01'
    $scope.spouseBirthdayInput = '0000-01-01'

    $scope.recipient = new Recipient("Self");
    $scope.spouse = new Recipient("Spouse");
    $scope.spouse.setPrimaryInsuranceAmountValue = 0;
    $scope.recipient.setSpouse($scope.spouse);
    $scope.spouse.setSpouse($scope.recipient);

    $scope.spousalChart_ = new SpousalChart(
        $scope.updateSpousalChartSelectedDate);

    $scope.$watch('recipient', function() {$scope.spousalChart_.render()});
    $scope.$watch('spouse', function() {$scope.spousalChart_.render()});
    $scope.$watch('selfBirthdayInput', function() {$scope.refreshSlider});
    $scope.$watch('spouseBirthdayInput', function() {$scope.refreshSlider});

    $scope.mode = ModeEnum.INITIAL;
    $scope.all_months = ALL_MONTHS;
    $scope.all_days = [];
    for (var i = 1; i < 32; ++i)
      $scope.all_days.push(i);
    $scope.demoId = -1;
    $scope.married = {
        value: "false"
    };
  
    $scope.showMedicare = true;
    $scope.showIndexedEarnings = false;

    $scope.breakPointChart_.setRecipient($scope.recipient);
    $scope.ageChart_.setRecipient($scope.recipient);
    // The maximum PIA that can be achieved for a user. Used in the spousal
    //  chart inputs to set a maximum value for the user-entered PIA value.
    $scope.maximumPIA = maximumPIA();
    $scope.maybeRenderCharts();
  };

  // Aliased so ModeEnum can be used in template conditionals, such as:
  //   ng-if="mode === ModeEnum.INITIAL"
  $scope.ModeEnum = ModeEnum;

  $scope.pasteArea = {
    contents: '',
    // This is just a constant, but it's cleaner here than newlines in the
    // actual template.
    placeholder: '\n\nPaste Result Here'
  };

  // Rather that using copy/paste, this fn immediately loads an example test
  // paste via a json request. This allows the user to try out the interface
  // before committing to the effort of retrieving their earnings record from
  // ssa.gov.
  fetchTestData = function(filename) {
    $http.get(filename).then(
      function(contents) {
        var records = parsePaste(contents.data);
        $scope.recipient.initFromEarningsRecords(records);
        $scope.mode = ModeEnum.RENDER_EARNINGS;
        $scope.maybeRenderCharts();
      }, 
      function(jqxhr, textStatus, error) {
        console.error("Error loading Test Data");
        console.error(textStatus);
        console.error(error);
      }
    );
  };

  $scope.loadDemoData = function(demoId) {
    // User may have scrolled down. Since we aren't actually changing URL,
    // we need to scroll back up to the top for them.
    window.scrollTo(0, 0);

    // Record an generic analytics event that indicates user interaction.
    // Don't even record which demo was loaded.
    ga('send', 'event', 'DemoData', 'load');

    if (demoId === 0) {
      $scope.demoId = 0;
      $scope.spouse.primaryInsuranceAmountValue = 400;
      $scope.selfBirthdayInput = "1950-07-01";
      $scope.updateBirthdate();
      $scope.spouseBirthdayInput = "1949-03-01";
      $scope.updateSpouseBirthdate();
      fetchTestData('averagepaste.txt');
      $scope.married.value = "true";
      $scope.lowerEarnerSlider.value = 66 * 12;
    }
    if (demoId === 1) {
      $scope.demoId = 1;
      $scope.spouse.primaryInsuranceAmountValue = 600;
      $scope.selfBirthdayInput = "1950-08-02";
      $scope.updateBirthdate();
      $scope.spouseBirthdayInput = "1951-12-02";
      $scope.updateSpouseBirthdate();
      fetchTestData('millionpaste.txt');
      $scope.married.value = "true";
      $scope.lowerEarnerSlider.value = 66 * 12;
    }
    if (demoId === 2) {
      $scope.demoId = 2;
      $scope.selfBirthdayInput = "1985-09-03";
      $scope.updateBirthdate();
      $scope.updateSpouseBirthdate();
      fetchTestData('youngpaste.txt');
    }
  }

  // Called whenever a user modifies the contents of the pasteArea textarea.
  $scope.$watch('pasteArea.contents', function(newValue) {
    if (newValue == "") return;
    /** @type {!Array<!EarningRecord>} */
    var records = parsePaste(newValue);
    if (records.length === 0) {
      // Ignore someone just typing in the field or otherwise broken input.
      if (newValue.length > 50)
        // Send basic event indicating that the user entered something and we
        // failed in parsing it. Never records what a user entered.
        ga('send', 'event', 'PasteData', 'FailParse');
      return;
    }
    // Send basic event indicating that the user entered something and we
    // succeeded in parsing it. Never records what a user entered.
    ga('send', 'event', 'PasteData', 'SucceedParse');

    $scope.recipient.initFromEarningsRecords(records);
<<<<<<< HEAD
    $scope.pasteArea.mode = ModeEnum.PASTE_CONFIRMATION;
    $scope.pasteArea.contents = '';
=======
    $scope.mode = ModeEnum.PASTE_CONFIRMATION;

    // This is conservative as it assumes the user had wage income the
    // year they were born. I'm not sure if this is even possible, but
    // who knows.
    $scope.birth.maxPossibleYear = records[0].year;
>>>>>>> master
  });

  $scope.refreshSlider = function() {
    $scope.updateSliderMin();
    $timeout(function () {
      $scope.$broadcast('rzSliderForceRender');
		  $scope.layoutSliderChart();
    });
  };
  
  $scope.confirmEarningsParse = function(confirmationValue) {
    if (confirmationValue === 'incorrect') {
      $scope.mode = ModeEnum.PASTE_APOLOGY;
      $scope.pasteArea.contents = '';
      // Send basic event indicating that the user rejected the earnings
      // data parsing results. Never records what a user entered.
      ga('send', 'event', 'PasteData', 'RejectParse');
    } else if (confirmationValue === 'correct') {
      // Send basic event indicating that the user accepted the earnings
      // data parsing results. Never records what a user entered.
      ga('send', 'event', 'PasteData', 'ConfirmParse');
      $scope.mode = ModeEnum.AGE_REQUEST;
    }
  };
  
  // User button click triggered function which confirms the user's birthdate
  // selection.
  $scope.confirmBirthDate = function() {
    // Send basic event indicating that the user entered their own birthdate.
    // Never records what birthdate a user entered.
    ga('send', 'event', 'PasteData', 'ConfirmBirthDate');
    $scope.updateBirthdate();
    $scope.mode = ModeEnum.RENDER_EARNINGS;
    $scope.maybeRenderCharts();
    $scope.$emit('mode');
  }

  $scope.isMarried = function() {
    return $scope.married.value == "true";
  };

  $scope.earningsRecords = function() {
    return $scope.recipient.earningsRecords();
  };
  
  $scope.earningsRecordsIncludeMedicare = function() {
    for (let i = 0; i < $scope.recipient.earningsRecords.length; ++i) {
      if ($scope.recipient.earningsRecords[i].taxedMedicareEarnings >= 0)
        return true;
    }
    return false;
  };

  // Functions in utils.js.
  $scope.firstBendPoint = firstBendPoint;
  $scope.secondBendPoint = secondBendPoint;

  /**
   * Special case method for init'ing an 'Age'. Ages are durations, and this
   * is syntactical sugar usable in template expressions.
   * @param {number} years
   * @param {number} months
   * @return {MonthDuration}
   */
  $scope.initAge = function(years, months) {
    if (months === undefined)
      months = 0;
    return new MonthDuration().initFromYearsMonths(years, months);
  }

  /**
   * Triggers a rendering of both charts iff each chart's initialization
   * requirements have all been met, otherwise does nothing.
   */
  $scope.maybeRenderCharts = function() {
    if ($scope.breakPointChart_.isInitialized())
      $scope.breakPointChart_.render();
    if ($scope.ageChart_.isInitialized())
      $scope.ageChart_.render();
    $scope.refreshSlider();
  };

  $scope.affixNavbar = function() {
    $('#navbar').affix({offset: {top: 80} });
  };

  /**
   * Runs as the various partial html files have loaded. Runs code
   * specific to initializing them.
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
    $scope.mode = ModeEnum.INITIAL;
  };

<<<<<<< HEAD
=======
 /**
   * Used to produce the birthdate picker for the spouse earner.
   * @return {Array<number>}
   */
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

>>>>>>> master
  $scope.updateFutureYears = function(id) {
    $scope.recipient.simulateFutureEarningsYears(
        /*numYears=*/$scope.futureYearsWorkSlider.minValue,
        /*wage=*/$scope.futureWageWorkSlider.minValue);
    $scope.maybeRenderCharts();
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
     ceil: MAXIMUM_EARNINGS[CURRENT_YEAR],
     stepsArray: (function() {
       out = [];
       for (i = 1000; i < MAXIMUM_EARNINGS[CURRENT_YEAR]; i += 1000) {
         out.push({value: i});
       }
       out.push({value: MAXIMUM_EARNINGS[CURRENT_YEAR]});
       return out;
     })(),
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

<<<<<<< HEAD
  $scope.selfBirthdateInput = "";
  $scope.spouseBirthdateInput = "";
=======
  $scope.birth = {
    day: 1,
    month: "Jan",
    year: 0,
    isSelected: function() {
      return this.year !== 0 && this.month !== "";
    }
  }

  $scope.spouseBirth = {
    day: 1,
    month: "Jan",
    year: 0,
    isSelected: function() {
      return this.year !== 0 && this.month !== "";
    }
  }

  // Given an input array above, returns a Date object representing the same.
  $scope.dateFromInputArray = function(inputDate) {
    var day = inputDate.day;
    var monthIndex = ALL_MONTHS.indexOf(inputDate.month);
    var year = inputDate.year;

    return new Date(year, monthIndex, day);
  }
>>>>>>> master

  $scope.followingMonth = function(input) {
    var out = {};
    out.month = ALL_MONTHS_FULL[
      (ALL_MONTHS_FULL.indexOf(input.month) + 1) % 12];
    out.year = input.year;
    if (ALL_MONTHS_FULL.indexOf(input.month) === 11)
      out.year += 1;
    return out;
  }

  // Called when the primary birthdate is modified.
  $scope.updateBirthdate = function() {
    // Only update once there are some non-default values set.
<<<<<<< HEAD
    if ($scope.selfBirthdayInput == "0000-01-01")
=======
    if (!$scope.birth.isSelected())
>>>>>>> master
      return; 
    const layBirthday = new Date($scope.selfBirthdateInput);
    $scope.recipient.updateBirthdate(layBirthday);

    // Also set the spouses birthdate to the same, which is a
    // reasonable default to start with, until the user selects
    // differently.
    $scope.spouseBirthdateInput = $scope.selfBirthdayInput;
    $scope.updateSpouseBirthdate();
  }
 
  // Called whenever the spousal birthdate is modified.
  $scope.updateSpouseBirthdate = function() {
    // Only update once there are some non-default values set.
<<<<<<< HEAD
    if ($scope.spouseBirthdayInput == "")
=======
    if (!$scope.spouseBirth.isSelected())
>>>>>>> master
      return; 
    const layBirthday = new Date($scope.spouseBirthdateInput);
    $scope.spouse.updateBirthdate(layBirthday);
   
    $scope.higherEarnerSlider.updateBirthDate();
    $scope.lowerEarnerSlider.updateBirthDate();
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
    return Math.floor(Math.max(0, 
        $scope.spousalMax() - $scope.lowerEarner().primaryInsuranceAmount()));
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
  // @param {MonthDuration} normalRetirementAge
  stepsArray = function(normalRetirementAge) {
    out = [];
    for (i = 62 * 12; i <= 70 * 12; i += 1) {
      if (i === normalRetirementAge.asMonths()) {
        out.push({ value: i, legend: 'NRA' });
      } else {
        out.push({ value: i});
      }
    }
    return out;
  }
  // Ticks tooltip function for the spousalSlider below.
  // @param {MonthDuration} normalRetirementAge
  $scope.ticksTooltip = function(normalRetirementAge, value) {
    if (value === normalRetirementAge.asMonths())
      return 'Normal Retirement Age';
  };

  // Config for choosing a benefits starting age for a single spouse. We
  // instantiate two of these.
  function spousalSlider(earnerFn) {
    this.lowerSlider_ = null;
    this.earnerFn = earnerFn;
    this.value = 65 * 12;
    this.options = {
      floor: 62 * 12,
      ceil: 70 * 12,
      // minLimit is relative to the floor.
      minLimit: 0,
      showSelectionBarEnd: true,
      translate: function(value, sliderId, label) {
        const age = new MonthDuration().initFromMonths(value);
        // model is the text above the slider pointer
        if (label === 'model') {
          if (age.modMonths() === 0)
            return age.years();
          return age.years() + ' ' + age.modMonths() + ' mo';
        }
        // tick-value is the text above each tick mark
        if (label === 'tick-value') {
          return age.years();
        }
        return '';
      },
      // Show every 12th tick, so yearly.
      showTicksValues: 12,
      ticksTooltip: $scope.ticksTooltip.bind(null, new MonthDuration()),
      stepsArray: stepsArray(new MonthDuration()),
      onChange: function(id) {
        $scope.updateSliderMin();
        $scope.spousalChart_.render();
      },
    },
    // Called on age changes for some events to cause redraw.
    this.updateBirthDate = function() {
      var normalRetirementAge = this.earnerFn().normalRetirementAge();
      this.options.stepsArray = stepsArray(normalRetirementAge);
      this.options.ticksTooltip =
        $scope.ticksTooltip.bind(null, normalRetirementAge);
      this.value = normalRetirementAge.asMonths();
      this.options.minLimit = 0;
      if (!this.earnerFn().isFullMonth)
        this.options.minLimit = 1;
      $scope.refreshSlider();
    }
    this.selectedAge = function() {
      return new MonthDuration().initFromMonths(this.value);
    }
    this.selectedDate = function() {
      return earnerFn().birthDate().ssaBirthDate().addDuration(
          this.selectedAge());
    }
  }

  $scope.higherEarnerSlider = new spousalSlider($scope.higherEarner);
  $scope.lowerEarnerSlider = new spousalSlider($scope.lowerEarner);

  $scope.updateSliderMin = function() {
    var regularMin = $scope.lowerEarner().isFullMonth ? 0 : 1;
    // If the lower earner will be 70 before the higher earner files, bail.
    if ($scope.lowerEarner().dateAtAge(
          new MonthDuration().initFromYearsMonths(70, 0)).lessThan(
              $scope.higherEarnerSlider.selectedDate())) {
      $scope.lowerEarnerSlider.options.minLimit = regularMin;
    } else if ($scope.lowerEarner().primaryInsuranceAmountFloored() == 0) {
      // If the lower earner does not have a personal benefit, it makes no
      // sense for that earner to file for benefits before the higher earner.
      // In this specific case, we set the date of the higher earner's slider
      // as the minimum date for the lower earner's slider.
      var lowerAgeAtDate = $scope.lowerEarner().ageAtDate(
          $scope.higherEarnerSlider.selectedDate()).asMonths();
      if (lowerAgeAtDate > new MonthDuration().initFromYearsMonths(70, 0)) {
        $scope.lowerEarnerSlider.options.minLimit = regularMin;
        return;
      }

      if ($scope.lowerEarnerSlider.value < lowerAgeAtDate)
        $scope.lowerEarnerSlider.value = lowerAgeAtDate;
      // options.minLimit is relative to options.floor for some reason.
      $scope.lowerEarnerSlider.options.minLimit = lowerAgeAtDate - (62 * 12);
    } else {
      $scope.lowerEarnerSlider.options.minLimit = regularMin;
    }
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

  // This method lays out the spousal age sliders and associated spousal chart.
  // The sliders will be verically aligned by year, adjusting for the spouses
  // ages. The spousal chart will align with the years on the slider.
  $scope.layoutSliderChart = function() {
    // Return early if the spousalBenefit section hasn't been rendered yet.
    var section = document.getElementById('spousal-box');
    if (section === null) return;

    var higherSlider = document.getElementById('higherEarnerSlider');
    var lowerSlider = document.getElementById('lowerEarnerSlider');

    // TODO: Handle cases where the earners are more than 10
    // years apart in a better way. Currently, the sliders get
    // bunched up since time is represented linearly.

    // The number of months spanned is 8 years (age 62 - 70) plus the
    // difference in ages of the two earners.
    var higherBirth = $scope.higherEarner().birthDate().ssaBirthDate();
    var lowerBirth = $scope.lowerEarner().birthDate().ssaBirthDate();
    var numMonths = Math.abs(higherBirth.subtractDate(lowerBirth).asMonths()) +
      (8 * 12);
    // Each slider has a small 'tail' on each side of the slider which is
    // 16px wide that we must ignore in the total width. We also want to save
    // off 40px on the left for dollar labels.
    var totalWidth = $scope.absoluteBoundingRect(section).width - 32 - 40;
    // Each slider should be 8*12 months wide and the whole thing
    // is totalWidth wide. The margin is the width that each slider will
    // not occupy.
    var newMargin = (1 - (8*12 / numMonths)) * totalWidth;

    // These represent the start and end date for the entire spousal chart.
    var chartStartDate;
    var chartEndDate;
    if (higherBirth.greaterThan(lowerBirth)) {  // Higher earner is younger
      higherSlider.setAttribute('style',
          "margin-left: " + (newMargin + 40) + "px");
      lowerSlider.setAttribute('style',
          "margin-right: " + (newMargin) + "px; margin-left: 40px;");
      chartStartDate = $scope.lowerEarner().dateAtYearsOld(62);
      chartEndDate = $scope.higherEarner().dateAtYearsOld(70);
    } else if (higherBirth.lessThan(lowerBirth)) {
      // Higher earner is older
      higherSlider.setAttribute('style',
          "margin-right: " + (newMargin) + "px; margin-left: 40px;");
      lowerSlider.setAttribute('style',
          "margin-left: " + (newMargin + 40) + "px");
      chartStartDate = $scope.higherEarner().dateAtYearsOld(62);
      chartEndDate = $scope.lowerEarner().dateAtYearsOld(70);
    } else { // both earners same birth month and year
      higherSlider.setAttribute('style',
          "margin-left: " + (newMargin + 40) + "px");
      lowerSlider.setAttribute('style',
          "margin-left: " + (newMargin + 40) + "px");
      chartStartDate = $scope.lowerEarner().dateAtYearsOld(62);
      chartEndDate = $scope.lowerEarner().dateAtYearsOld(70);
    }

    // We may have resized the element containing the sliders at this point.
    // We want to rebroadcast that the element's children should relayout one
    // more time.
    $scope.$broadcast('rzSliderForceRender');

    var canvas = document.getElementById('spousal-chart-canvas');
    if (!$scope.spousalChart_.isInitialized()) {
      $scope.spousalChart_.setCanvas(canvas);
    }
    $scope.spousalChart_.setRecipients(
        $scope.lowerEarner(), $scope.higherEarner());
    $scope.spousalChart_.setSliders(
        $scope.lowerEarnerSlider, $scope.higherEarnerSlider);
    $scope.spousalChart_.setDateRange(chartStartDate, chartEndDate);
    $scope.spousalChart_.render();
  }
 
  /*
   * @return {MonthDate}
   */ 
  $scope.filingDate = function(sliderValue, earner) {
    return earner.dateAtAge(new MonthDuration().initFromMonths(sliderValue));
  }

  /*
   * @return {MonthDate}
   */ 
  $scope.higherEarnerFilingDate = function() {
    return $scope.filingDate(
        $scope.higherEarnerSlider.value, $scope.higherEarner());
  }
 
  /*
   * @return {MonthDate}
   */ 
  $scope.lowerEarnerFilingDate = function() {
    return $scope.filingDate(
        $scope.lowerEarnerSlider.value, $scope.lowerEarner());
  }

  // Callback from spousal chart's mouse handlers.
  // @param {MonthDate} date
  $scope.updateSpousalChartSelectedDate = function(date) {
    $scope.spousalSelection = {};
    // Zero is used as a sentinel to indicate no selected date.
    $scope.spousalSelection.show = (date.monthsSinceEpoch() > 0);
    if (!$scope.spousalSelection.show) {
      $scope.$apply();
      return;
    }

    // Determine the displayed date.
    $scope.spousalSelection.dateText =
      date.monthName() + ' ' + date.year();

    // Determine the displayed benefit dollar values.
    $scope.spousalSelection.higherEarnerBenefit = 
        $scope.higherEarner().totalBenefitAtDate(
            date,
            $scope.higherEarnerSlider.selectedDate(),
            $scope.lowerEarnerSlider.selectedDate());
    $scope.spousalSelection.lowerEarnerBenefit = 
        $scope.lowerEarner().totalBenefitAtDate(
            date,
            $scope.lowerEarnerSlider.selectedDate(),
            $scope.higherEarnerSlider.selectedDate());

    $scope.$apply();
  }
})
