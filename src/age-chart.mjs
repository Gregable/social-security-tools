import * as utils from './utils.mjs';

/**
 * Code for driving a breakpoint chart. See partials/breakpoint-chart.html
 * @constructor
 */
function AgeChart() {
  this.canvas_ = null;
  // isDirty_ tracks if the chart has been rendered since the last relevant
  // change to the inputs of the chart.
  this.isDirty_ = true;
  // lastRecipientMutation_ tracks the last time that this.recipient_ has
  // changed. If this.recipient_.lastMutation() differes from
  // lastRecipientMutation_, then the chart is dirty, even if isDirty_ is false.
  this.lastRecipientMutation_ = -1;
  // lastWidth_ tracks the last width of the AgeChart. If it differs from
  // this.canvas.width, then the chart is dirty, even if isDirty_ is false.
  this.lastWidth_ = -1;
}

export { AgeChart };

/**
 * Returns true if the AgeChart has been initialized with a canvas element
 * and recipient.
 * @return {boolean}
 */
AgeChart.prototype.isInitialized = function() {
  return this.canvas_ !== null && this.recipient_ !== null;
};

/**
 * Sets the canvas on which to render the chart.
 * @param {Element} canvas_element
 */
AgeChart.prototype.setCanvas = function (canvas_element) {
  this.isDirty_ = true;
  this.canvas_ = canvas_element;
  this.context_ = this.canvas_.getContext('2d');
  // Set the font we will use for labels early so we can measure it's width.
  this.context_.font = "bold 14px Helvetica"
  this.mouseToggle_ = 'ON';

  this.canvas_.addEventListener('mousedown', this.mouseClickListener());
  this.canvas_.addEventListener('mousemove', this.mouseMoveListener());
  this.monthWidth = (70 - 62) * 12;
};

/**
 * Set the recipient from which to pull financial data.
 * @param {Recipient} recipient
 */
AgeChart.prototype.setRecipient = function(recipient) {
  this.recipient_ = recipient;
  this.isDirty_ = true;
};

/**
 * Compute the usable width of the canvas allowable for the chart.
 * @return {number}
 */
AgeChart.prototype.chartWidth = function() {
  // A 6-digit social security payment would be about the highest we
  // would imagine someone receiving, so we reserve space on the right
  // to display such a value with a little added padding.
  var reservedWidth = Math.ceil(
      this.context_.measureText('$999,999').width) + 10;
  var usableWidth = this.canvas_.width - reservedWidth;
  return usableWidth;
};

/**
 * Compute the usable height of the canvas allowable for the chart.
 * @return {number}
 */
AgeChart.prototype.chartHeight = function() {
  // A 12pt font is 16 pixels high. We reserve a little extra for padding.
  var reservedHeight = 16 + 10;
  var usableHeight = this.canvas_.height - reservedHeight;
  return usableHeight;
};

/**
 * Compute the canvas x-coordinate for an age in months.
 * @param {number} ageMonths
 * @return {number}
 */
AgeChart.prototype.canvasX = function(ageMonths) {
  // Number of months between age 62 and age 70, the range displayed.
  var xValue = Math.floor(
      (ageMonths - (62*12)) / this.monthWidth * this.chartWidth());
  var xClipped = Math.min(xValue, this.chartWidth());
  return xValue;
};

/**
 * Compute the canvas y-coordinate for a benefit dollars value.
 * @param {number} benefitY
 * @return {number}
 */
AgeChart.prototype.canvasY = function(benefitY) {
  var yValue = this.chartHeight() -
      Math.floor(benefitY / this.maxRenderedYDollars() * this.chartHeight());
  var yClipped = Math.min(yValue, this.chartHeight());
  return yClipped;
};

/**
 * Compute the canvas age for an x-coordinate value.
 * Used for computations involving mouse interactions.
 * @param {number} canvasX
 * @return {utils.MonthDuration}
 */
AgeChart.prototype.ageAtX = function(canvasX) {
  // compute the number of months greater than 62 years old the canvasX
  // corresponds to.
  var xValue = Math.floor(canvasX / this.chartWidth() * this.monthWidth);
  var xClipped = Math.max(0, Math.min(xValue, this.monthWidth));
  // Add 62 years to the age.
  return new utils.MonthDuration().initFromMonths(xClipped).add(
      new utils.MonthDuration().initFromYearsMonths(62, 0));
};

/**
 * Selects a y-coordinate (in dollars) to be the topmost edge
 * of our chart.
 * @return {Number}
 */
AgeChart.prototype.maxRenderedYDollars = function() {
  return this.recipient_.benefitAtAge(
        new utils.MonthDuration().initFromYearsMonths(70, 0));
};

/**
 * Utility method which walls lineTo on this.canvas_ after transforming
 * monthsX and dollarY into canvas x/y coordinates.
 * @param {Number} monthsX
 * @param {Number} dollarY
 */
AgeChart.prototype.lineTo = function(monthsX, dollarY) {
  this.context_.lineTo(this.canvasX(monthsX), this.canvasY(dollarY));
};

/**
 * Utility method which walls moveTo on this.canvas_ after transforming
 * monthsX and dollarY into canvas x/y coordinates.
 * @param {Number} monthsX
 * @param {Number} dollarY
 */
AgeChart.prototype.moveTo = function(monthsX, dollarY) {
  this.context_.moveTo(this.canvasX(monthsX), this.canvasY(dollarY));
};

/**
 *  Render the bounding box for our chart.
 */
AgeChart.prototype.renderBoundingBox = function() {
  this.context_.save();
  this.context_.lineWidth = 1;

  this.context_.beginPath();
  this.moveTo(12 * 62, 0);
  this.lineTo(12 * 62, this.maxRenderedYDollars());
  this.lineTo(12 * 70, this.maxRenderedYDollars());
  this.lineTo(12 * 70, 0);
  this.lineTo(12 * 62, 0);
  this.context_.stroke();

  this.context_.restore();
};

/**
 *  Render the benefit curve (age vs benefit).
 */
AgeChart.prototype.renderBenefitCurve = function() {
  // Show the lines between the breakpoints. These are always the same.
  this.context_.save();
  this.context_.lineWidth = 4;

  this.context_.beginPath();
  this.moveTo(12 * 62, this.recipient_.benefitAtAge(
        new utils.MonthDuration().initFromYearsMonths(62, 0)));
  for (var y = 62; y <= 70; ++y) {
    for (var m = 0; m < 12; ++m) {
      var age = new utils.MonthDuration().initFromYearsMonths(y, m)
      this.lineTo(12 * y + m, this.recipient_.benefitAtAge(age));
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
AgeChart.prototype.roundedBox =
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
 * @param {utils.MonthDuration} age
 */
AgeChart.prototype.renderAgePoint = function(age) {
  this.context_.save();

  if (age.asMonths() === 12 * 62 && !this.recipient_.isFullMonth)
    age.add(new utils.MonthDuration().initFromMonths(1));

  var benefit = this.recipient_.benefitAtAge(age);

  // Add formatting to the text labels.

  // Thin dashed lines out from the user benefit point
  this.context_.lineWidth = 2;
  this.context_.lineCap = 'butt';
  this.context_.setLineDash([3, 5]);

  // Both lines starting at the point and radiating out makes a nifty
  // animation affect with the dashed lines at the edges of the chart.
  this.context_.beginPath();
  this.moveTo(age.asMonths(), benefit);
  this.lineTo(age.asMonths(), 0);
  this.context_.stroke();

  this.context_.beginPath();
  this.moveTo(age.asMonths(), benefit);
  this.lineTo(70 * 12, benefit);
  this.context_.stroke();

  // White filled circle with black edge showing the user benefit point.
  this.context_.setLineDash([]);  // Disable the dashed line from above.
  this.context_.fillStyle = this.context_.strokeStyle;

  this.context_.beginPath();
  this.context_.arc(
      this.canvasX(age.asMonths()),
      this.canvasY(benefit),
      /*radius=*/ 5,
      /*startAngle=*/ 0,
      /*endAngle=*/ 2 * Math.PI);
  this.context_.fill();
  this.context_.stroke();

  // Text at the edges showing the actual values, white on colored chip.
  var xText = age.years() + 'y ' + age.modMonths() + 'mo';
  var yText = utils.insertNumericalCommas('$' + benefit);

  // Chip on the bottom edge
  this.roundedBox(this.canvasX(age.asMonths()), this.canvasY(0),
                  this.context_.measureText(xText).width + 6, 19,
                  5, /*squaredCorner=*/ 1);
  // Chip on the right edge
  this.roundedBox(this.canvasX(70 * 12) + 1,
                  this.canvasY(benefit),
                  this.context_.measureText(yText).width + 6, 19,
                  5, /*squaredCorner=*/ 1);

  this.context_.fillStyle = 'white'
  this.context_.fillText(  // Text on the bottom edge.
      xText,
      this.canvasX(age.asMonths()) + 2,
      this.canvasY(0) + 15);
  this.context_.fillText(  // Text on the right edge.
      yText,
      this.canvasX(70 * 12) + 3,
      this.canvasY(benefit) + 15);

  this.context_.restore();
}

/** Determine if the last render is OK or dirty (needs to be re-rendered). */
AgeChart.prototype.isDirty = function () {
  if (this.lastRecipientMutation_ != this.recipient_.lastMutation())
    this.isDirty_ = true;
  this.lastRecipientMutation_ = this.recipient_.lastMutation();
  if (this.lastWidth_ != this.canvas_.width)
    this.isDirty_ = true;
  this.lastWidth_ = this.canvas_.width;
  return this.isDirty_;
}

/** Render the breakpoint chart.
 *  Returns true iff there was some change to the render.
 */
AgeChart.prototype.render = function () {
  if (!this.isInitialized()) return false;
  // Nothing has changed, the last time we rendered this is still fine.
  if (!this.isDirty()) return false;

  this.context_.font = "bold 14px Helvetica"
  this.context_.save();
  this.context_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);

  this.context_.strokeStyle = '#666';
  this.renderBoundingBox();
  this.renderBenefitCurve();
  this.context_.strokeStyle = '#5cb85c';

  this.renderAgePoint(this.recipient_.normalRetirementAge());

  this.context_.restore();
  this.isDirty_ = false;
  return true;
};

/** Toggles on/off functionality of mouseMoveListener. */
AgeChart.prototype.mouseClickListener = function() {
  var self = this;
  return function(e) {
    if (self.mouseToggle_ === 'ON') {
      self.mouseToggle_ = 'OFF';
    } else {
      self.mouseToggle_ = 'ON';
      // Immediately trigger a rendering based on mouse location.
      self.mouseMoveListener()(e);
    }
  };
}

/** Renders a 2nd earnings value based on mouse location. */
AgeChart.prototype.mouseMoveListener = function() {
  var self = this;
  return function(e) {
    if (self.mouseToggle_ == 'OFF')
      return;

    // The mouse just moved, we need to re-render.
    self.isDirty_ = true;
    self.render();

    self.context_.save();
    self.context_.strokeStyle = '#337ab7';
    var canvasX = e.clientX - self.canvas_.getBoundingClientRect().left;
    self.renderAgePoint(self.ageAtX(canvasX));
    self.context_.restore();
  };
}
