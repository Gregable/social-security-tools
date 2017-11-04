/**
 * Code for driving a breakpoint chart. See partials/breakpoint-chart.html
 * @constructor
 */
function SpousalChart() {
  this.canvas_ = null;
}

/**
 * Returns true if the SpousalChart has been initialized with a canvas element
 * and recipient.
 * @return {boolean}
 */
SpousalChart.prototype.isInitialized = function() {
  return this.canvas_ !== null && this.recipient !== null;
};

/**
 * Sets the canvas on which to render the chart.
 * @param {Element} canvas_element
 */
SpousalChart.prototype.setCanvas = function(canvas_element) {
  this.canvas_ = canvas_element;
  this.context_ = this.canvas_.getContext('2d');
  // Set the font we will use for labels early so we can measure it's width.
  this.context_.font = "bold 14px Helvetica"
  this.monthWidth = (70 - 62) * 12;
};

/**
 * Set the earners from which to pull financial data.
 * @param {Recipient} lowerEarner
 * @param {Recipient} higherEarner
 */
SpousalChart.prototype.setRecipients = function(lowerEarner, higherEarner) {
  this.lowerEarner_ = lowerEarner;
  this.higherEarner_ = higherEarner;
};

/**
 * Set the earners from which to pull financial data.
 * @param {Object} lowerEarnerSlider
 * @param {Object} higherEarnerSlider
 */
SpousalChart.prototype.setSliders = function(
    lowerEarnerSlider, higherEarnerSlider) {
  this.lowerEarnerSlider_ = lowerEarnerSlider;
  this.higherEarnerSlider_ = higherEarnerSlider;
};

/**
 * Set the date range in months that this chart covers.
 * @param {number} startDate
 * @param {number} endDate
 */
SpousalChart.prototype.setDateRange = function(startDate, endDate) {
  this.startDate_ = startDate;
  this.endDate_ = endDate;
};

// Note that with an HTML canvas, the origin (0, 0) is in the upper left.

/**
 * Compute the usable width of the canvas allowable for the chart.
 * @return {number}
 */
SpousalChart.prototype.chartWidth = function() {
  return this.canvas_.width - 32;
};

/**
 * Compute the usable height of the canvas allowable for the chart.
 * @return {number}
 */
SpousalChart.prototype.chartHeight = function() {
  return 240;
};

/**
 * Compute the canvas x-coordinate for a date in months.
 * @param {number} ageMonths
 * @return {number}
 */
SpousalChart.prototype.canvasX = function(ageMonths) {
  var xValue = (ageMonths - this.startDate_) / (this.endDate_ - this.startDate_)
    * this.chartWidth() + 16;
  // To deal with rounding errors, clip to the usable range.
  return Math.round(Math.max(16, Math.min(this.chartWidth() + 16, xValue)));
};
 
/**
 * Render a series of horizontal lines, one per year in the date range.
 */
SpousalChart.prototype.renderYearHorizLines = function() {
  this.context_.save();
  this.context_.strokeStyle = '#666';
  this.context_.setLineDash([2,2]);

  firstYearIdx = this.startDate_;
  // If the start date doesn't fall on a year value, move it forward until
  // it does.
  if (firstYearIdx % 12 !== 0)
    firstYearIdx = (Math.floor(firstYearIdx / 12) + 1) * 12;


  // Iterate over each year within the date range.
  for (var i = firstYearIdx; i <= this.endDate_; i += 12) {
    // Draw vertical line.
    this.context_.beginPath();
    this.context_.moveTo(this.canvasX(i), 40);
    this.context_.lineTo(this.canvasX(i), 600);
    this.context_.stroke();
  
    // Print the year.
    this.context_.save();
    this.context_.translate(this.canvasX(i) + 5, 240);
    this.context_.rotate(-90 * Math.PI / 180);
    this.context_.fillStyle = '#FFF';
    this.context_.fillRect(-8, -13, 50, 16);
    this.context_.fillStyle = '#999';
    this.context_.fillText(i / 12, 0, 0);
    this.context_.restore();
  }
  this.context_.restore();
}

/**
 * Render a pair of Axis in the bottom and left side of the chart.
 */
SpousalChart.prototype.renderAxes = function() {
  this.context_.save();
  this.context_.strokeStyle = '#000';
  this.context_.lineWidth = 1;

  this.context_.beginPath();
  this.context_.moveTo(0, 260);
  this.context_.lineTo(0, 600);
  this.context_.lineTo(620, 600);
  this.context_.stroke();

  this.context_.restore();
}

/**
 * Render the earnings of the higher earner.
 */
SpousalChart.prototype.renderHigherEarner = function() {
  this.context_.save();
  var xValue = this.higherEarner_.dateMonthsAtAge(62) +
    this.higherEarnerSlider_.value - (62 * 12);

  var age = this.higherEarner_.monthsOldAtDate(
      Math.floor(xValue / 12), xValue % 12);
  var dollars = this.higherEarner_.benefitAtAge(Math.floor(age / 12), age % 12);
  
  this.context_.strokeStyle = '#600';
  this.context_.beginPath();
  this.context_.moveTo(this.canvasX(xValue), 600);
  this.context_.lineTo(this.canvasX(xValue), this.canvasY(dollars));
  this.context_.lineTo(this.canvas_.width, this.canvasY(dollars));
  this.context_.stroke();

  this.context_.restore();
}

/**
 * Render the earnings of the lower earner.
 */
SpousalChart.prototype.renderLowerEarner = function() {
  this.context_.save();
  var xValue = this.lowerEarner_.dateMonthsAtAge(62) +
    this.lowerEarnerSlider_.value - (62 * 12);

  var age = this.lowerEarner_.monthsOldAtDate(
      Math.floor(xValue / 12), xValue % 12);
  var dollars = this.lowerEarner_.benefitAtAge(Math.floor(age / 12), age % 12);
  
  this.context_.strokeStyle = '#060';
  this.context_.beginPath();
  this.context_.moveTo(this.canvasX(xValue), 600);
  this.context_.lineTo(this.canvasX(xValue), this.canvasY(dollars));
  this.context_.lineTo(this.canvas_.width, this.canvasY(dollars));
  this.context_.stroke();

  this.context_.restore();
}

/** Render the spousal chart. */
SpousalChart.prototype.render = function() {
  // Canvas tutorial:
  // http://www.html5canvastutorials.com/tutorials/html5-canvas-element/
  this.context_.save();
  this.context_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  
  this.renderYearHorizLines();
  this.renderAxes();
  this.renderHigherEarner();
  this.renderLowerEarner();

  this.context_.restore();
}

/**
 * Selects a y-coordinate (in dollars) to be the topmost edge
 * of our chart.
 * @return {Number}
 */
SpousalChart.prototype.maxRenderedYDollars = function() {
  return Math.max(
      this.higherEarner_.benefitAtAge(70, 0) * 1.5,
      this.higherEarner_.benefitAtAge(70, 0) +
      this.lowerEarner_.benefitAtAge(70, 0));
};

/**
 * Compute the canvas y-coordinate for a benefit dollars value.
 * @param {number} benefitY
 * @return {number}
 */
SpousalChart.prototype.canvasY = function(benefitY) {
  var yValue = this.canvas_.height -
      Math.floor(benefitY / this.maxRenderedYDollars() * this.chartHeight());
  return yValue;
};

////////////////////// Unchanged below this line.
//
/**
 * Compute the canvas age for an x-coordinate value.
 * Used for computations involving mouse interactions.
 * @param {number} canvasX
 * @return {number}
 */
SpousalChart.prototype.ageX = function(canvasX) {
  var xValue = Math.floor(canvasX / this.chartWidth() * this.monthWidth);
  var xClipped = this.monthWidth;
  var months = Math.max(0, Math.min(xValue, xClipped));
  return {
    year: 62 + Math.floor(months / 12),
    month: months % 12
  };
};


/**
 * Utility method which walls lineTo on this.canvas_ after transforming
 * monthsX and dollarY into canvas x/y coordinates.
 * @param {Number} monthsX
 * @param {Number} dollarY
 */
SpousalChart.prototype.lineTo = function(monthsX, dollarY) {
  this.context_.lineTo(this.canvasX(monthsX), this.canvasY(dollarY));
};

/**
 * Utility method which walls moveTo on this.canvas_ after transforming
 * monthsX and dollarY into canvas x/y coordinates.
 * @param {Number} monthsX
 * @param {Number} dollarY
 */
SpousalChart.prototype.moveTo = function(monthsX, dollarY) {
  this.context_.moveTo(this.canvasX(monthsX), this.canvasY(dollarY));
};

/**
 *  Render the benefit curve (age vs benefit).
 */
SpousalChart.prototype.renderBenefitCurve = function() {
  // Show the lines between the breakpoints. These are always the same.
  this.context_.save();
  this.context_.lineWidth = 4;

  this.context_.beginPath();
  this.moveTo(12 * 62, this.recipient_.benefitAtAge(62, 0));
  for (var y = 62; y <= 70; ++y) {
    for (var m = 0; m < 12; ++m) {
      this.lineTo(12 * y + m, this.recipient_.benefitAtAge(y, m));
    }
  }
  this.context_.stroke();

  this.context_.restore();
};


/**
 * Renders a rectangle with three rounded corners.
 * @param {Number} x canvas x coordinate to draw upper-left corner.
 * @param {Number} y canvas y coordinate to dray upper-left corner.
 * @param {Number} width of rectangle
 * @param {Number} height of rectangle
 * @param {Number} cornerRadius
 * @param {Number} squaredCorner (1 = upper left, then clockwise)
 */
SpousalChart.prototype.roundedBox =
    function(x, y, width, height, cornerRadius, squaredCorner) {
  this.context_.save();
  this.context_.beginPath();
  this.context_.lineCap = 'square';

  if (squaredCorner === 1) {
    this.context_.moveTo(x, y);
  } else {
    this.context_.moveTo(x + cornerRadius, y);
  }
  if (squaredCorner === 2) {
    this.context_.lineTo(x + width, y);
  } else {
    this.context_.lineTo(x + width - cornerRadius, y);
    this.context_.arcTo(x + width, y,
                        x + width, y + cornerRadius,
                        cornerRadius);
  }
  if (squaredCorner === 3) {
    this.context_.lineTo(x + width, y + height);
  } else {
    this.context_.lineTo(x + width, y + height - cornerRadius);
    this.context_.arcTo(x + width, y + height,
                        x + width - cornerRadius, y + height,
                        cornerRadius);
  }
  if (squaredCorner === 4) {
    this.context_.lineTo(x, y + height);
  } else {
    this.context_.lineTo(x + cornerRadius, y + height);
    this.context_.arcTo(x, y + height,
                        x, y + height - cornerRadius,
                        cornerRadius);
  }
  if (squaredCorner === 1) {
    this.context_.lineTo(x, y);
  } else {
    this.context_.lineTo(x, y + cornerRadius);
    this.context_.arcTo(x, y,
                        x + cornerRadius, y,
                        cornerRadius);
  }

  this.context_.fill();
  this.context_.stroke();
  this.context_.restore();
};

/**
 * Renders a point on the age curve.
 * @param {number} year
 * @param {number} month
 */
SpousalChart.prototype.renderAgePoint = function(years, months) {
  this.context_.save();

  // Where on the breakpoint 'curve' the user's benefit values lie.
  var userSSA = {
    ageYears: years,
    ageMonths: months,
    x: years * 12 + months,
    y: Math.round(this.recipient_.benefitAtAge(years, months))
  };

  // Add formatting to the text labels.
  userSSA.xText = userSSA.ageYears + 'y ' + userSSA.ageMonths + 'mo';
  userSSA.yText = ('$' + userSSA.y).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");

  // Thin dashed lines out from the user benefit point
  this.context_.lineWidth = 2;
  this.context_.lineCap = 'butt';
  this.context_.setLineDash([3, 5]);

  // Both lines starting at the point and radiating out makes a nifty
  // animation affect with the dashed lines at the edges of the chart.
  this.context_.beginPath();
  this.moveTo(userSSA.x, userSSA.y);
  this.lineTo(userSSA.x, 0);
  this.context_.stroke();
  
  this.context_.beginPath();
  this.moveTo(userSSA.x, userSSA.y);
  this.lineTo(70 * 12, userSSA.y);
  this.context_.stroke();

  // White filled circle with black edge showing the user benefit point.
  this.context_.setLineDash([]);  // Disable the dashed line from above.
  this.context_.fillStyle = this.context_.strokeStyle;

  this.context_.beginPath();
  this.context_.arc(
      this.canvasX(userSSA.x),
      this.canvasY(userSSA.y),
      /*radius=*/ 5,
      /*startAngle=*/ 0,
      /*endAngle=*/ 2 * Math.PI);
  this.context_.fill();
  this.context_.stroke();

  // Text at the edges showing the actual values, white on colored chip.

  // TODO: Low Priority. Switch which edge of the chip the dotted line
  // intersects with so as to avoid the two chips ever overlapping.

  // Chip on the bottom edge
  this.roundedBox(this.canvasX(userSSA.x), this.canvasY(0),
                  this.context_.measureText(userSSA.xText).width + 6, 19,
                  5, /*squaredCorner=*/ 1);
  // Chip on the right edge
  this.roundedBox(this.canvasX(70 * 12) + 1,
                  this.canvasY(userSSA.y),
                  this.context_.measureText(userSSA.yText).width + 6, 19,
                  5, /*squaredCorner=*/ 1);

  this.context_.fillStyle = 'white'
  this.context_.fillText(  // Text on the bottom edge.
      userSSA.xText,
      this.canvasX(userSSA.x) + 2,
      this.canvasY(0) + 15);
  this.context_.fillText(  // Text on the right edge.
      userSSA.yText, 
      this.canvasX(70 * 12) + 3,
      this.canvasY(userSSA.y) + 15);

  this.context_.restore();
}

/** Render the breakpoint chart.
SpousalChart.prototype.render = function() {
  // Canvas tutorial:
  // http://www.html5canvastutorials.com/tutorials/html5-canvas-element/
  this.context_.save();
  this.context_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  
  this.context_.strokeStyle = '#666';
  this.renderBenefitCurve();
  this.context_.strokeStyle = '#5cb85c';

  this.renderAgePoint(this.recipient_.normalRetirement.ageYears,
                      this.recipient_.normalRetirement.ageMonths);

  this.context_.restore();
};
*/

/** Toggles on/off functionality of mouseMoveListener. */
SpousalChart.prototype.mouseClickListener = function() {
  var self = this;
  return function(e) {
    if (self.mouseToggle === 'ON') {
      self.mouseToggle = 'OFF'
    } else {
      self.mouseToggle = 'ON'
      // Immediately trigger a rendering based on mouse location.
      self.mouseMoveListener()(e);
    }
  };
}

/** Renders a 2nd earnings value based on mouse location. */
SpousalChart.prototype.mouseMoveListener = function() {
  var self = this;
  return function(e) {
    if (self.mouseToggle == 'OFF')
      return;

    self.render();

    self.context_.save();
    self.context_.strokeStyle = '#337ab7';
    var canvasX = e.clientX - self.canvas_.getBoundingClientRect().left;
    var agePoint = self.ageX(canvasX);
    self.renderAgePoint(agePoint.year, agePoint.month);
    self.context_.restore();
  };
}
