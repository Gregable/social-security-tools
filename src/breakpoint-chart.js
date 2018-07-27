/**
 * Code for driving a breakpoint chart. See partials/breakpoint-chart.html
 * @constructor
 */
function BreakPointChart() {
  this.canvas_ = null;
  this.recipient_ = null;
  this.lastRenderedXDollars = -1;
  this.maxRenderedXDollars = -1;
}

/**
 * Returns true if the BreakPointChart has been initialized with a canvas
 * element and recipient.
 * @return {boolean}
 */
BreakPointChart.prototype.isInitialized = function() {
  return this.canvas_ !== null && this.recipient !== null;
};

/**
 * Sets the canvas on which to render the chart.
 * @param {Element} canvas_element
 */
BreakPointChart.prototype.setCanvas = function(canvas_element) {
  this.canvas_ = canvas_element;
  this.context_ = this.canvas_.getContext('2d');
  // Set the font we will use for labels early so we can measure it's width.
  this.context_.font = "bold 14px Helvetica"
  this.mouseToggle = 'ON';

  this.canvas_.addEventListener('mousedown', this.mouseClickListener());
  this.canvas_.addEventListener('mousemove', this.mouseMoveListener());
};

/**
 * Set the recipient from which to pull financial data.
 * @param {Recipient} recipient
 */
BreakPointChart.prototype.setRecipient = function(recipient) {
  this.recipient_ = recipient;
};

/**
 * Compute the usable width of the canvas allowable for the chart.
 * @return {number}
 */
BreakPointChart.prototype.chartWidth = function() {
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
BreakPointChart.prototype.chartHeight = function() {
  // A 12pt font is 16 pixels high. We reserve a little extra for padding.
  var reservedHeight = 16 + 10;
  var usableHeight = this.canvas_.height - reservedHeight;
  return usableHeight;
};

/**
 * Compute the canvas x-coordinate for a earnings dollars value.
 * @param {number} earningsX
 * @return {number}
 */
BreakPointChart.prototype.canvasX = function(earningsX) {
  var xValue = Math.floor(
      earningsX / this.maxRenderedXDollars * this.chartWidth());
  var xClipped = Math.min(xValue, this.chartWidth());
  return xClipped;
};

/**
 * Compute the canvas y-coordinate for a benefit dollars value.
 * @param {number} benefitY
 * @return {number}
 */
BreakPointChart.prototype.canvasY = function(benefitY) {
  var yValue = this.chartHeight() -
      Math.floor(benefitY / this.maxRenderedYDollars * this.chartHeight());
  var yClipped = Math.min(yValue, this.chartHeight());
  return yClipped;
};

/**
 * Compute the canvas earnings dollars for an x-coordinate value.
 * Used for computations involving mouse interactions.
 * @param {number} canvasX
 * @return {number}
 */
BreakPointChart.prototype.earningsX = function(canvasX) {
  var xValue = Math.floor(
      Math.max(0, canvasX / this.chartWidth()) * this.maxRenderedXDollars);
  var xClipped = this.maxRenderedXDollars;
  return Math.min(xValue, xClipped);
};

/**
 * Selects an x and y-coordinate (in dollars) as the top-right edge.
 */
BreakPointChart.prototype.recomputeBounds = function() {
  // There are a few goals here when selecting this value:
  // 1) Show all of the breakpoints so the user can get a feel visually
  //    for how these breakpoints affect the computation.
  var breakpoint_min = secondBendPoint(this.recipient_.indexingYear()) * 1.25;
  // 2) Show the user's current earnings with some space on either side
  //    so that they can explore the graph to either direction.
  var user_min = this.recipient_.monthlyIndexedEarnings * 2;

  var computed = Math.max(breakpoint_min, user_min);

  // We would prefer to keep the viewport fixed as the user changes
  // the benefit, so that it's easier to see what is going on. However
  // we will adjust if the value gets too close to the edges.
  if (this.lastRenderedXDollars === -1 ||
      this.lastRenderedXDollars > computed * 1.3 ||
      this.lastRenderedXDollars < computed / 1.3)
   this.lastRenderedXDollars = computed;

  this.maxRenderedXDollars = this.lastRenderedXDollars;
  
  this.maxRenderedYDollars = this.primaryInsuranceAmount(
      this.maxRenderedXDollars);
}

/**
 * Utility method which walls lineTo on this.canvas_ after transforming
 * dollarX and dollarY into canvas x/y coordinates.
 * @param {Number} dollarX
 * @param {Number} dollarY
 */
BreakPointChart.prototype.lineTo = function(dollarX, dollarY) {
  this.context_.lineTo(this.canvasX(dollarX), this.canvasY(dollarY));
};

/**
 * Utility method which walls moveTo on this.canvas_ after transforming
 * dollarX and dollarY into canvas x/y coordinates.
 * @param {Number} dollarX
 * @param {Number} dollarY
 */
BreakPointChart.prototype.moveTo = function(dollarX, dollarY) {
  this.context_.moveTo(this.canvasX(dollarX), this.canvasY(dollarY));
};

/**
 *  Render the bounding box for our chart.
 */
BreakPointChart.prototype.renderBoundingBox = function() {
  this.recomputeBounds();

  this.context_.save();
  this.context_.lineWidth = 1;

  this.context_.beginPath();
  this.moveTo(0, 0);
  this.lineTo(0, this.maxRenderedYDollars);
  this.lineTo(this.maxRenderedXDollars, this.maxRenderedYDollars);
  this.lineTo(this.maxRenderedXDollars, 0);
  this.lineTo(0, 0);
  this.context_.stroke();

  this.context_.restore();
};

/**
 *  Render the breakpoint curves. These are constants.
 */
BreakPointChart.prototype.renderBreakPoints = function() {
  // Show the lines between the breakpoints. These are always the same.
  this.context_.save();
  this.context_.lineWidth = 4;

  this.context_.beginPath();
  this.moveTo(0, 0);

  const firstBend = firstBendPoint(this.recipient_.indexingYear());
  const secondBend = secondBendPoint(this.recipient_.indexingYear());

  var dollarX;
  var dollarY;

  // Origin to first bend point
  dollarX = firstBend;
  dollarY = this.primaryInsuranceAmount(dollarX);
  this.lineTo(dollarX, dollarY);

  // First to second bend point
  dollarX = secondBend;
  dollarY = this.primaryInsuranceAmount(dollarX);
  this.lineTo(dollarX, dollarY);

  // Second to third bend point
  dollarX = this.maxRenderedXDollars;
  dollarY = this.primaryInsuranceAmount(dollarX);
  this.lineTo(dollarX, dollarY);

  this.context_.stroke();
  this.context_.restore();


  // Now lets show vertical bars indicating where the breakpoints live.
  this.context_.save();

  // Line between 1st and 2nd breakpoints:
  this.context_.beginPath();
  this.context_.lineWidth = 0.5;
  dollarX = firstBend;
  dollarY = this.primaryInsuranceAmount(dollarX);
  this.moveTo(dollarX, dollarY - 200);
  this.lineTo(dollarX, dollarY + 200);
  this.context_.stroke();

  // Line between 2nd and 3rd breakpoints:
  this.context_.beginPath();
  this.context_.lineWidth = 0.5;
  dollarX = secondBend;
  dollarY = this.primaryInsuranceAmount(dollarX);
  this.moveTo(dollarX, dollarY - 200);
  this.lineTo(dollarX, dollarY + 200);
  this.context_.stroke();

  // Some text indicating the slope of the curve along each section delineated
  // by the vertical bars above.
  const textWidth = this.context_.measureText('XX%').width / 2;
  this.context_.fillStyle = '#78B'

  // Compute the angle at which the chart dimensions are distoring slopes.
  const chartAngle = (this.chartHeight() / this.chartWidth() *
      this.maxRenderedXDollars / this.maxRenderedYDollars);
  this.context_.fillText('32%', 0, 0);

  this.context_.save();
  dollarX = firstBend / 2;
  dollarY = this.primaryInsuranceAmount(dollarX);
  this.context_.translate(
      this.canvasX(dollarX) - textWidth,
      this.canvasY(dollarY));
  // For very high earners, the space for this text can get pretty cramped,
  // so we simply don't show it in this case.
  if (this.canvasX(dollarX) - this.canvasX(0) > textWidth + 5) {
    this.context_.rotate(-1 * Math.atan(.90 * chartAngle));
    this.context_.fillText('90%', 0, 0);
  }
  this.context_.restore();

  this.context_.save();
  dollarX = ((secondBend - firstBend) / 2) + firstBend;
  dollarY = this.primaryInsuranceAmount(dollarX);
  this.context_.translate(
      this.canvasX(dollarX) - textWidth,
      this.canvasY(dollarY));
  this.context_.rotate(-1 * Math.atan(.32 * chartAngle));
  this.context_.fillText('32%', 0, 0);
  this.context_.restore();

  this.context_.save();
  dollarX = ((this.maxRenderedXDollars - secondBend) / 2) + secondBend;
  dollarY = this.primaryInsuranceAmount(dollarX);
  pixelY = this.canvasY(dollarY);
  // If this is too close to the top of the chart, flip it to below the line.
  if (pixelY < 100)
    pixelY += 20;
  this.context_.translate(
      this.canvasX(dollarX) - textWidth, pixelY);
  this.context_.rotate(-1 * Math.atan(.15 * chartAngle));
  this.context_.fillText('15%', 0, 0);
  this.context_.restore();

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
BreakPointChart.prototype.roundedBox =
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


BreakPointChart.prototype.primaryInsuranceAmount = function(earningsX) {
  return primaryInsuranceAmountForEarnings(
      this.recipient_.indexingYear(),
      this.recipient_.dateAtYearsOld(62).year(),
      earningsX);
}

/**
 * Renders a point on the breakpoint curve.
 * @param {earningsX} earnings dollar value which a point is rendered for.
 */
BreakPointChart.prototype.renderEarningsPoint = function(earningsX) {
  this.context_.save();
    
  // Where on the breakpoint 'curve' the user's benefit values lie.
  const x = Math.floor(earningsX);
  const y = Math.floor(this.primaryInsuranceAmount(earningsX));


  // Thin dashed lines out from the user benefit point
  this.context_.lineWidth = 2;
  this.context_.lineCap = 'butt';
  this.context_.setLineDash([3, 5]);

  // Both lines starting at the point and radiating out makes a nifty
  // animation affect with the dashed lines at the edges of the chart.
  this.context_.beginPath();
  this.moveTo(x, y);
  this.lineTo(x, 0);
  this.context_.stroke();
  
  this.context_.beginPath();
  this.moveTo(x, y);
  this.lineTo(this.maxRenderedXDollars, y);
  this.context_.stroke();

  // White filled circle with black edge showing the user benefit point.
  this.context_.setLineDash([]);  // Disable the dashed line from above.
  this.context_.fillStyle = this.context_.strokeStyle;

  this.context_.beginPath();
  this.context_.arc(
      this.canvasX(x),
      this.canvasY(y),
      /*radius=*/ 5,
      /*startAngle=*/ 0,
      /*endAngle=*/ 2 * Math.PI);
  this.context_.fill();
  this.context_.stroke();

  // Text at the edges showing the actual values, white on colored chip.

  // Add dollar sign and commas for better looking formatting.
  const xText = '$' + insertNumericalCommas(x);
  const yText = '$' + insertNumericalCommas(y);

  // Chip on the bottom edge
  this.roundedBox(this.canvasX(x), this.canvasY(0),
                  this.context_.measureText(xText).width + 6, 19,
                  5, /*squaredCorner=*/ 1);
  // Chip on the right edge
  this.roundedBox(this.canvasX(this.maxRenderedXDollars) + 1,
                  this.canvasY(y),
                  this.context_.measureText(yText).width + 6, 19,
                  5, /*squaredCorner=*/ 1);

  this.context_.fillStyle = 'white'
  this.context_.fillText(  // Text on the bottom edge.
      xText,
      this.canvasX(x) + 2,
      this.canvasY(0) + 15);
  this.context_.fillText(  // Text on the right edge.
      yText, 
      this.canvasX(this.maxRenderedXDollars) + 3,
      this.canvasY(y) + 15);

  this.context_.restore();
}

/** Render the breakpoint chart. */
BreakPointChart.prototype.render = function() {
  if (!this.isInitialized())
    return;

  // Canvas tutorial:
  // http://www.html5canvastutorials.com/tutorials/html5-canvas-element/
  this.context_.save();
  this.context_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  
  this.context_.strokeStyle = '#666';
  this.renderBoundingBox();
  this.renderBreakPoints();
  this.context_.strokeStyle = '#5cb85c';

  this.renderEarningsPoint(this.recipient_.monthlyIndexedEarnings);

  this.context_.restore();
};

/** Toggles on/off functionality of mouseMoveListener. */
BreakPointChart.prototype.mouseClickListener = function() {
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
BreakPointChart.prototype.mouseMoveListener = function() {
  var self = this;
  return function(e) {
    if (self.mouseToggle == 'OFF')
      return;

    self.render();

    self.context_.save();
    self.context_.strokeStyle = '#337ab7';
    var canvasX = e.clientX - self.canvas_.getBoundingClientRect().left;
    self.renderEarningsPoint(self.earningsX(canvasX));
    self.context_.restore();
  };
}
