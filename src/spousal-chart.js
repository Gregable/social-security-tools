/**
 * Code for driving a chart displaying spousal benefits.
 * @constructor
 */
function SpousalChart(selectedDateCb) {
  this.updateSelectedDate = selectedDateCb;
  this.canvas_ = null;
}

/**
 * Returns true if the SpousalChart has been initialized with a canvas element
 * and recipient.
 * @return {boolean}
 */
SpousalChart.prototype.isInitialized = function() {
  if (this.canvas_ === null || 
      this.lowerarner_ === null ||
      this.higherEarner_ === null)
    return false;
  return true;
};

/**
 * Sets the canvas on which to render the chart.
 * @param {Element} canvas_element
 */
SpousalChart.prototype.setCanvas = function(canvas_element) {
  this.canvas_ = canvas_element;
  this.context_ = this.canvas_.getContext('2d');
  // Set the font we will use for labels early so we can measure it's width.
  this.context_.font = "bold 14px Helvetica";
  this.mouseToggle = 'ON';
  this.canvas_.addEventListener('mouseout', this.mouseOutListener());
  this.canvas_.addEventListener('mousemove', this.mouseMoveListener());
  this.canvas_.addEventListener('mousedown', this.mouseClickListener());
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
 * Set the earners from which to pull starting age data.
 * @param {Object} lowerEarnerSlider
 * @param {Object} higherEarnerSlider
 */
SpousalChart.prototype.setSliders = function(
    lowerEarnerSlider, higherEarnerSlider) {
  this.lowerEarnerSlider = lowerEarnerSlider;
  this.higherEarnerSlider = higherEarnerSlider;
};

/**
 * Set the date range in months that this chart covers.
 * @param {MonthDate} startDate
 * @param {MonthDate} endDate
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
  // We use the width of the sliders, which reserves 40 pixels on the left for
  // dollar labels and 32 pixels to account for the slider tails.
  return this.canvas_.width - 32 - 40;
};

/**
 * Compute the usable height of the canvas allowable for the chart.
 * @return {number}
 */
SpousalChart.prototype.chartHeight = function() {
  return 270;
};

/**
 * Compute the canvas x-coordinate for a date.
 * @param {MonthDate} date
 * @return {number}
 */
SpousalChart.prototype.canvasX = function(date) {
  var xValue = ((date.subtractDate(this.startDate_).asMonths() /
                 this.endDate_.subtractDate(this.startDate_).asMonths())
                * this.chartWidth()) + 16 + 40;
  // To deal with rounding errors, clip to the usable range.
  return Math.round(
      Math.max(16, Math.min(this.chartWidth() + 16 + 40, xValue)));
};

/**
 * Inverse of canvasX, computes a date for a canvas x-coordinate.
 * @param {number} x
 * @return {MonthDate}
 */
SpousalChart.prototype.dateX = function(x) {
  // Clip x to a range smaller than the chart.
  x = Math.max(16 + 40, Math.min(this.chartWidth() + 16 + 40, x));
  var percent = (x - 16 - 40) / this.chartWidth();
  var numMonths = Math.round(
      this.endDate_.subtractDate(this.startDate_).asMonths() * percent);
  return this.startDate_.addDuration(
      new MonthDuration().initFromMonths(numMonths));
};

SpousalChart.prototype.renderTextInWhiteBox = function(text, x, y) {
  var textWidth = this.context_.measureText(text).width;

  // First, draw the white box.
  this.context_.save();
  this.context_.fillStyle = '#FFF';
  this.context_.fillRect(x - 7, y - 14, textWidth + 14, 18);
  this.context_.restore();

  // Then draw the text.
  this.context_.fillText(text, x, y);
}

/**
 * Render a series of vertical lines, one per year in the date range.
 */
SpousalChart.prototype.renderYearVerticalLines = function() {
  this.context_.save();
  // Grey dashed lines.
  this.context_.strokeStyle = '#666';
  this.context_.setLineDash([2,2]);

  firstYear = this.startDate_;
  // If the start date doesn't fall on a year value, move it forward until
  // it does.
  if (firstYear.monthIndex() !== 0)
    firstYear = new MonthDate().initFromYearsMonths(firstYear.year() + 1, 0);

  // Iterate over each year within the date range.
  for (var date = new MonthDate().initFromMonthDate(firstYear);
       !this.endDate_.lessThan(date);
       date = date.addDuration(new MonthDuration().initFromMonths(12))) {
    // Draw vertical line.
    this.context_.beginPath();
    this.context_.moveTo(this.canvasX(date), 40);
    this.context_.lineTo(this.canvasX(date), 600);
    this.context_.stroke();
  
    // Print the year vertically atop the line, with a white rectangle behind
    // the text, so that the line isn't going through the text.
    text = '' + date.year();
    var textWidth = this.context_.measureText(text).width;
    var xpos = 210 + textWidth;

    this.context_.save();
    this.context_.translate(this.canvasX(date) + 5, xpos);
    this.context_.rotate(-90 * Math.PI / 180);
    this.context_.fillStyle = '#999';
    this.renderTextInWhiteBox(text, 0, 0);
    this.context_.restore();
  }
  this.context_.restore();
};

SpousalChart.prototype.renderHorizontalLine = function(dollarY, canvasY) {
  this.context_.beginPath();
  this.context_.moveTo(0, canvasY);
  this.context_.lineTo(600, canvasY);
  this.context_.stroke();

  var text = '$' + insertNumericalCommas(dollarY);

  this.context_.save();
  this.context_.fillStyle = '#AAA';
  this.renderTextInWhiteBox(text, 6, canvasY + 5);
  this.context_.restore();
}

/**
 * Render a series of horizontal lines representing the dollar amounts at
 * each y-level.
 */
SpousalChart.prototype.renderHorizontalLines = function() {
  this.context_.save();
  // Grey dashed lines.
  this.context_.strokeStyle = '#BBB';
  this.context_.lineWidth = 1;
  this.context_.setLineDash([2,2]);

  // Render the $0 line.
  this.renderHorizontalLine(0, this.midpointYValue());

  if (this.maxRenderedYDollars() < 500) {
    this.context_.restore();
    return;
  }

  // Work out a reasonable increment to show dollar lines.
  var increment = 100;
  if (this.maxRenderedYDollars() > 1000)
    increment = 250;
  if (this.maxRenderedYDollars() > 1500)
    increment = 500;
  if (this.maxRenderedYDollars() > 3000)
    increment = 1000;

  const maxAge = new MonthDuration().initFromYearsMonths(70, 0);
  const higherMaxY = this.higherEarner_.benefitAtAge(maxAge);
  const lowerMaxY = this.lowerEarner_.totalBenefitWithSpousal(maxAge, maxAge);
  for (var i = increment; i < higherMaxY; i += increment)
    this.renderHorizontalLine(i, this.canvasHigherY(i));
  for (var i = increment; i < lowerMaxY; i += increment)
    this.renderHorizontalLine(i, this.canvasLowerY(i));

  this.context_.restore();
}

/**
 * Renders a single vertical line at the user's selected date.
 * @param {number} canvasX x-coordinate of vertical line we should render.
 */
SpousalChart.prototype.renderSelectedDateVerticalLine = function(canvasX) {
  var date = this.dateX(canvasX);
  this.updateSelectedDate(date);
  var text = date.monthName() + ' ' + date.year();

  this.context_.save();
  // Bluish dashed lines.
  this.context_.strokeStyle = '#337ab7';
  this.context_.setLineDash([6,4]);
  this.context_.lineCap = 'butt';
  this.context_.lineWidth = 2;

  // Draw vertical line.
  this.context_.beginPath();
  this.context_.moveTo(canvasX, 40);
  this.context_.lineTo(canvasX, 620);
  this.context_.stroke();

  var textWidth = this.context_.measureText(text).width;
  var xpos = 210 + textWidth;

  // Print the year vertically atop the line, with a white rectangle behind
  // the text, so that the line isn't going through the text.
  this.context_.save();
  this.context_.translate(canvasX + 5, xpos);
  this.context_.rotate(-90 * Math.PI / 180);
  this.context_.fillStyle = '#337ab7';
  this.renderTextInWhiteBox(text, 0, 0);
  this.context_.restore();

  this.context_.restore();
};

/**
 * Computes the date that the higher earner starts receiving benefits.
 * @return {MonthDate}
 */
SpousalChart.prototype.higherEarnerStartDate = function() {
  return this.higherEarnerSlider.selectedDate();
};

/**
 * Computes the date that the lower earner starts receiving benefits.
 * @return {MonthDate}
 */
SpousalChart.prototype.lowerEarnerStartDate = function() {
  // Typically this is the date of the lower earner's slider. However, if the
  // lower earner has no personal benefit, the lower earner will wait until
  // the higher earner has filed, or effectively 70, whichever is earlier.
  
  // If the lower earner has a personal benefit, start at lower earner's date.
  if (this.lowerEarner_.primaryInsuranceAmountFloored() > 0)
    return this.lowerEarnerSlider.selectedDate();
  // If the lower earner files at or after the higher earner, start at lower
  // earner's date.
  if (this.lowerEarnerSlider.selectedDate() >=
      this.higherEarnerSlider.selectedDate())
    return this.lowerEarnerSlider.selectedDate();
  // If the higher earner files after the lower earner is already 70, just use
  // the date the lower earner turns 70.
  if (this.lowerEarner_.ageAtDate(this.higherEarnerStartDate()).greaterThan(
          new MonthDuration().initFromYearsMonths(70, 0)))
    return this.lowerEarner_.dateAtYearsOld(70);
  // Otherwise, use the date that the higher earner files.
  return this.higherEarnerStartDate();
};

/**
 * Computes the age that the higher earner starts receiving benefits.
 * @return {MonthDuration}
 */
SpousalChart.prototype.higherEarnerStartAge = function() {
  return this.higherEarnerSlider.selectedAge();
};

/**
 * Computes the age that the lower earner starts receiving benefits.
 * @return {MonthDuration}
 */
SpousalChart.prototype.lowerEarnerStartAge = function() {
  return this.lowerEarner_.ageAtDate(this.lowerEarnerStartDate());
};

/**
 * Render the earnings of the higher earner.
 */
SpousalChart.prototype.renderHigherEarner = function() {
  this.context_.save();
  this.context_.strokeStyle = '#e69f00';
  this.context_.lineWidth = 2;
  var startDate = this.higherEarnerStartDate();
  var startAge = this.higherEarnerStartAge();
  var dollars = this.higherEarnerPersonalBenefit();
 
  // Draw a shaded box showing the earnings per year given the selection.
  this.context_.strokeStyle = '#e69f00';
  this.context_.beginPath();
  this.context_.moveTo(this.canvas_.width - 1, this.canvasHigherY(0));
  this.context_.lineTo(this.canvasX(startDate), this.canvasHigherY(0));
  const maxDate = this.dateX(this.canvas_.width - 1);
  var yDollars;
  var lastY = -1;
  var boxes = [];
  for (i = startDate; i.lessThanOrEqual(maxDate);) {
    var thisX = this.canvasX(i);
    yDollars =  this.higherEarner_.totalBenefitAtDate(
        i, this.higherEarnerStartDate(), this.lowerEarnerStartDate());
    var thisY = this.canvasHigherY(yDollars);

    if (yDollars !== lastY) {
      boxes.push([thisX, thisY, yDollars]);
      lastY = yDollars;
    }

    // Vertical line first, often 0 height;
    this.context_.lineTo(thisX, thisY);

    // Horizontal line to next month.
    i = i.addDuration(new MonthDuration().initFromMonths(1));
    this.context_.lineTo(this.canvasX(i), thisY);
  }
  // Make sure we draw all of the way to the edge of the chart.
  this.context_.lineTo(this.canvas_.width - 1, this.canvasHigherY(yDollars));

  this.context_.fillStyle = '#f6dfad';
  this.context_.fill();
  this.context_.stroke();
  this.context_.restore();

  // Find the box with the largest minimum dimension.
  var rootX = this.canvas_.width - 1;
  var rootY = this.canvasHigherY(0);
  var bestBox = [rootX, rootY];
  for (var i = 0; i < boxes.length; ++i) {
    if (boxMinimumDimension(bestBox, rootX, rootY) <
        boxMinimumDimension(boxes[i], rootX, rootY))
      bestBox = boxes[i];
  }

  var regionWidth = rootX - bestBox[0];
  var regionHeight = rootY - bestBox[1];
  var centerX = rootX - regionWidth / 2;
  var centerY = rootY - regionHeight / 2;

  // Add the user's name to the box:
  this.context_.save();
  this.context_.fillStyle = '#5e4000';
  for (font_height = 24; font_height >= 10; font_height--) {
    this.context_.font = font_height + "px Helvetica";
    var textBox = this.context_.measureText(this.higherEarner_.name);
    // If there is enough space at this font size, draw the user's name,
    // else try a smaller font.
    if ((textBox.width + 20) < regionWidth &&
        (font_height + 20) < regionHeight) {
      this.context_.fillText(this.higherEarner_.name,
                             centerX - (textBox.width / 2),
                             centerY + (font_height * 0.4));
      break;
    }
  }
  this.context_.restore();

  // Add the dollar amounts below the box.
  this.context_.save();
  this.context_.fillStyle = '#5e4000';
  this.context_.font = "14px Helvetica";
  var font_height = 12;

  var nextBoxMinX = 1;
  var nextBoxMaxY = rootY;
  
  for (var boxIt = 0; boxIt < boxes.length; ++boxIt) {
    var boxMinX = nextBoxMinX;
    var boxMaxY = nextBoxMaxY;
    // Default is the edge of our box.
    var nextBoxMinX = boxes[boxIt][0];
    var nextBoxMaxY = boxes[boxIt][1];

    // Prefer to fix text above, rather than left.
    var text = '$' + insertNumericalCommas(boxes[boxIt][2]) + ' / mo';
    var textBox = this.context_.measureText(text);
    var horizSpace = rootX - boxes[boxIt][0];
    if (boxes.length - 1 > boxIt)
      horizSpace = boxes[boxIt + 1][0] - boxes[boxIt][0];
    var vertSpace = 100;  // typically have plenty to top of chart.
    if (boxes.length - 1 > boxIt)
      vertSpace = boxes[boxIt][1] - boxes[boxIt + 1][1];
    if ((textBox.width + 10) < horizSpace &&
        (font_height + 10 < vertSpace)) {
      this.renderTextInWhiteBox(
          text, boxes[boxIt][0] + 5, boxes[boxIt][1] - 5);
      // We need to bound the area for the next box, so we don't overlap.
      nextBoxMinX = boxes[boxIt][0] + 10 + textBox.width;
      nextBoxMaxY = boxes[boxIt][1] + 10 + font_height;
      continue;
    }
    // Again above, using shorter text.
    var text = '$' + insertNumericalCommas(boxes[boxIt][2]);
    var textBox = this.context_.measureText(text);
    if ((textBox.width + 10) < horizSpace &&
        (font_height + 10 < vertSpace)) {
      foundFit = true;
      this.renderTextInWhiteBox(
          text, boxes[boxIt][0] + 5, boxes[boxIt][1] - 5);
      // We need to bound the area for the next box, so we don't overlap.
      nextBoxMinX = boxes[boxIt][0] + 10 + textBox.width;
      nextBoxMaxY = boxes[boxIt][1] + 10 + font_height;
      continue;
    }

    // Attempt to fix box 0 to the left of the text
    var text = '$' + insertNumericalCommas(boxes[boxIt][2]) + ' / mo';
    var textBox = this.context_.measureText(text);
    var horizSpace = boxes[boxIt][0] - boxMinX;
    var vertSpace = boxMaxY - boxes[boxIt][1];
    if ((textBox.width + 15) < horizSpace &&
        (font_height + 15 < vertSpace)) {
      this.renderTextInWhiteBox(
          text,
          boxes[boxIt][0] - 8 - textBox.width,
          boxMaxY - ((vertSpace - font_height) / 2) - font_height);
      continue;
    }
    // Try again with shorter text, removing ' / mo';
    var text = '$' + insertNumericalCommas(boxes[boxIt][2]);
    var textBox = this.context_.measureText(text);
    if ((textBox.width + 15) < horizSpace &&
        (font_height + 15 < vertSpace)) {
      this.renderTextInWhiteBox(
          text,
          boxes[boxIt][0] - 8 - textBox.width,
          boxMaxY - ((vertSpace - font_height) / 2) - font_height);
      continue;
    }
    // Give up and move to next box.
  }

  // Draw a thin line showing the earnings per year for other selections.
  this.context_.save();
  this.context_.strokeStyle = '#e69f00';
  this.context_.globalAlpha = 0.6;
  this.context_.beginPath();
  var start = this.higherEarner_.dateAtYearsOld(62);
  if (!this.higherEarner_.isFullMonth)
    start = start.addDuration(new MonthDuration().initFromMonths(1));
  var end = this.higherEarner_.dateAtYearsOld(70);
  for (i = start; i.lessThanOrEqual(end);) {
    var thisX = this.canvasX(i);
    var yDollars =  this.higherEarner_.totalBenefitAtDate(
        this.higherEarner_.dateAtYearsOld(71),
        i, this.lowerEarnerStartDate());
    var thisY = this.canvasHigherY(yDollars);
    if (i.monthsSinceEpoch() === start.monthsSinceEpoch()) {
      this.context_.moveTo(thisX, thisY);
    } else {
      this.context_.lineTo(thisX, thisY);
    }
    i = i.addDuration(new MonthDuration().initFromMonths(1));
  }
  this.context_.stroke();
  this.context_.restore();

  this.context_.restore();
};

/**
 * Compute the start date when the spousal benefits start.
 * @return {MonthDate}
 */
SpousalChart.prototype.spousalStartDate = function() {
  var dateA = this.lowerEarnerStartDate();
  var dateB = this.higherEarnerStartDate();
  return dateA.greaterThan(dateB) ? dateA : dateB;
};

/**
 * Compute the higher earner's personal benefit in dollars.
 */
SpousalChart.prototype.higherEarnerPersonalBenefit = function() {
  return this.higherEarner_.benefitAtAge(this.higherEarnerStartAge());
};

/**
 * Compute the lower earner's personal benefit in dollars.
 */
SpousalChart.prototype.lowerEarnerPersonalBenefit = function() {
  return this.lowerEarner_.benefitAtAge(this.lowerEarnerStartAge());
};

/**
 * Compute the lower earner's total benefit (personal + spousal) in dollars.
 */
SpousalChart.prototype.lowerEarnerTotalBenefit = function() {
  return this.lowerEarner_.totalBenefitWithSpousal(
      this.lowerEarnerStartAge(),
      this.lowerEarner_.ageAtDate(this.spousalStartDate()));
};

function boxMinimumDimension(box, rootX, rootY) {
  const xDim = Math.abs(box[0] - rootX);
  const yDim = Math.abs(box[1] - rootY);
  return Math.min(xDim, yDim);
}

/**
 * Render the earnings of the lower earner.
 */
SpousalChart.prototype.renderLowerEarner = function() {
  this.context_.save();
  this.context_.lineWidth = 2;

  // Compute the various bend point dates and dollar values.
  var startDate = this.lowerEarnerStartDate();
  var spousalStartDate = this.spousalStartDate();
  var personal = this.lowerEarnerPersonalBenefit();
  var total = this.lowerEarnerTotalBenefit();

  var actualStartDate = startDate;
  if (personal === 0 && startDate.lessThan(spousalStartDate))
    actualStartDate = spousalStartDate;
 
  this.context_.strokeStyle = '#060';
  this.context_.beginPath();
  this.context_.moveTo(this.canvas_.width - 1, this.canvasLowerY(0));
  this.context_.lineTo(this.canvasX(actualStartDate), this.canvasLowerY(0));

  const maxDate = this.dateX(this.canvas_.width - 1);
  var yDollars;
  var lastY = -1;
  var boxes = [];
  for (i = actualStartDate; i.lessThanOrEqual(maxDate);) {
    var thisX = this.canvasX(i);
    yDollars =  this.lowerEarner_.totalBenefitAtDate(
        i, actualStartDate, this.higherEarnerStartDate());
    var thisY = this.canvasLowerY(yDollars);

    if (yDollars !== lastY) {
      boxes.push([thisX, thisY, yDollars]);
      lastY = yDollars;
    }

    // vertical line first, often 0 height.
    this.context_.lineTo(thisX, thisY);

    // horizontal line to next month.
    i = i.addDuration(new MonthDuration().initFromMonths(1));
    this.context_.lineTo(this.canvasX(i), thisY);
  }
  // Make sure we draw all of the way to the edge of the chart.
  this.context_.lineTo(this.canvas_.width - 1, this.canvasLowerY(yDollars));

  this.context_.fillStyle = '#d9ebd9';
  this.context_.fill();
  this.context_.stroke();
  this.context_.restore();

  // Find the box with the largest minimum dimension.
  var rootX = this.canvas_.width - 1;
  var rootY = this.canvasLowerY(0);
  var bestBox = [rootX, rootY];
  for (var i = 0; i < boxes.length; ++i) {
    if (boxMinimumDimension(bestBox, rootX, rootY) <
        boxMinimumDimension(boxes[i], rootX, rootY))
      bestBox = boxes[i];
  }

  var regionWidth = rootX - bestBox[0];
  var regionHeight = bestBox[1] - rootY;
  var centerX = rootX - regionWidth / 2;
  var centerY = rootY + regionHeight / 2;

  // Add the user's name to the box:
  this.context_.save();
  this.context_.fillStyle = '#004000';
  for (font_height = 24; font_height >= 10; font_height--) {
    this.context_.font = font_height + "px Helvetica";
    var textBox = this.context_.measureText(this.lowerEarner_.name);
    // If there is enough space at this font size, draw the user's name,
    // else try a smaller font.
    if ((textBox.width + 20) < regionWidth &&
        (font_height + 20) < regionHeight) {
      this.context_.fillText(this.lowerEarner_.name,
                             centerX - (textBox.width / 2),
                             centerY + (font_height * 0.4));
      break;
    }
  }
  this.context_.restore();

  this.context_.save();
  this.context_.fillStyle = '#004000';
  this.context_.font = "14px Helvetica";
  var font_height = 12;

  var nextBoxMinX = 1;
  var nextBoxMinY = rootY;

  for (var boxIt = 0; boxIt < boxes.length; ++boxIt) {
    var boxMinX = nextBoxMinX;
    var boxMinY = nextBoxMinY;
    // Default is the edge of our box.
    var nextBoxMinX = boxes[boxIt][0];
    var nextBoxMinY = boxes[boxIt][1];

    // Prefer to fix text below, rather than left.
    var text = '$' + insertNumericalCommas(boxes[boxIt][2]) + ' / mo';
    var textBox = this.context_.measureText(text);
    var horizSpace = rootX - boxes[boxIt][0];
    if (boxes.length - 1 > boxIt)
      horizSpace = boxes[boxIt + 1][0] - boxes[boxIt][0];
    var vertSpace = 100;  // typically have plenty to bottom of chart.
    if (boxes.length - 1 > boxIt)
      vertSpace = boxes[boxIt + 1][1] - boxes[boxIt][1];
    if ((textBox.width + 10) < horizSpace &&
        (font_height + 10 < vertSpace)) {
      this.renderTextInWhiteBox(
          text,
          boxes[boxIt][0] + 5,
          boxes[boxIt][1] + font_height + 5);
      // We need to bound the area for the next box, so we don't overlap.
      nextBoxMinX = boxes[boxIt][0] + 10 + textBox.width;
      nextBoxMinY = boxes[boxIt][1] + 10 + font_height;
      continue;
    }
    // Again below, using shorter text.
    var text = '$' + insertNumericalCommas(boxes[boxIt][2]);
    var textBox = this.context_.measureText(text);
    if ((textBox.width + 10) < horizSpace &&
        (font_height + 10 < vertSpace)) {
      foundFit = true;
      this.renderTextInWhiteBox(
          text,
          boxes[boxIt][0] + 5,
          boxes[boxIt][1] + font_height + 5);
      // We need to bound the area for the next box, so we don't overlap.
      nextBoxMinX = boxes[boxIt][0] + 10 + textBox.width;
      nextBoxMinY = boxes[boxIt][1] + 10 + font_height;
      continue;
    }

    // Attempt to fix box 0 to the left of the text
    var text = '$' + insertNumericalCommas(boxes[boxIt][2]) + ' / mo';
    var textBox = this.context_.measureText(text);
    var horizSpace = boxes[boxIt][0] - boxMinX;
    var vertSpace = boxes[boxIt][1] - boxMinY;
    if ((textBox.width + 15) < horizSpace &&
        (font_height + 15 < vertSpace)) {
      this.renderTextInWhiteBox(
          text,
          boxes[boxIt][0] - 8 - textBox.width,
          boxMinY + ((vertSpace - font_height) / 2) + font_height);
      continue;
    }
    // Try again with shorter text, removing ' / mo';
    var text = '$' + insertNumericalCommas(boxes[boxIt][2]);
    var textBox = this.context_.measureText(text);
    if ((textBox.width + 15) < horizSpace &&
        (font_height + 15 < vertSpace)) {
      this.renderTextInWhiteBox(
          text,
          boxes[boxIt][0] - 8 - textBox.width,
          (vertSpace - font_height) / 2 + boxMinY + font_height);
      continue;
    }
    // Give up and move to next box.
  }

  // Draw a thin line showing the earnings per year for other selections.
  this.context_.save();
  this.context_.beginPath();
  this.context_.globalAlpha = 0.3;
  var start = this.lowerEarner_.dateAtYearsOld(62);
  if (!this.lowerEarner_.isFullMonth)
    start = start.addDuration(new MonthDuration().initFromMonths(1));
  if (personal === 0 && start.lessThan(this.higherEarnerStartDate()))
    start = this.higherEarnerStartDate();
  var end = this.lowerEarner_.dateAtYearsOld(70);
  for (i = start; i.lessThanOrEqual(end);) {
    var thisX = this.canvasX(i);
    var shownDate = (personal === 0 ||
        i.greaterThanOrEqual(this.higherEarnerStartDate())) ?
      this.lowerEarner_.dateAtYearsOld(71) :
      this.higherEarnerStartDate().subtractDuration(
          new MonthDuration().initFromMonths(1)) ;
    var yDollars =  this.lowerEarner_.totalBenefitAtDate(
        shownDate, i, this.higherEarnerStartDate());
    var thisY = this.canvasLowerY(yDollars);
    if (i.monthsSinceEpoch() === start.monthsSinceEpoch()) {
      this.context_.moveTo(thisX, thisY);
    } else {
      this.context_.lineTo(thisX, thisY);
    }
    i = i.addDuration(new MonthDuration().initFromMonths(1));
  }
  this.context_.stroke();
  this.context_.restore();

  this.context_.restore();
};

/** Render the spousal chart. */
SpousalChart.prototype.render = function() {
  if (!this.isInitialized())
    return;

  // Canvas tutorial:
  // http://www.html5canvastutorials.com/tutorials/html5-canvas-element/
  this.context_.save();
  this.context_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  
  this.renderHorizontalLines();
  this.renderYearVerticalLines();
  this.renderHigherEarner();
  this.renderLowerEarner();

  if (this.mouseToggle === 'OFF')
    this.renderSelectedDateVerticalLine(this.lastMouseX);

  this.context_.restore();
};

/**
 * Returns the maximum dollars that will be displayed on this chart. This is
 * the maximum benefit for both lower and higher earner summed.
 * @return {Number}
 */
SpousalChart.prototype.maxRenderedYDollars = function() {
  const maxAge = new MonthDuration().initFromYearsMonths(70, 0);
  return this.higherEarner_.benefitAtAge(maxAge) +
         this.lowerEarner_.totalBenefitWithSpousal(maxAge, maxAge);
};

SpousalChart.prototype.midpointYValue = function() {
  // The midpoint line is the canvas y position of the 0 benefit line.
  const maxAge = new MonthDuration().initFromYearsMonths(70, 0);
  var spousalDollars = this.lowerEarner_.totalBenefitWithSpousal(
      maxAge, maxAge);
  var midpointYValue = this.canvas_.height -
      Math.floor(spousalDollars / this.maxRenderedYDollars()
          * this.chartHeight()) - 45;

  return midpointYValue;
}

/**
 * Compute the canvas y-coordinate for a benefit dollars value of the lower
 * earner, shown on the bottom of the chart.
 * @param {number} benefitY
 * @return {number}
 */
SpousalChart.prototype.canvasLowerY = function(benefitY) {
  // canvasYValue is the absolute number canvas pixels that this point
  // represents above 0.
  var canvasYValue =
      Math.floor(benefitY / this.maxRenderedYDollars() * this.chartHeight());

  return this.midpointYValue() + canvasYValue;
};

/**
 * Compute the canvas y-coordinate for a benefit dollars value of the higher
 * earner, shown on the top of the chart.
 * @param {number} benefitY
 * @return {number}
 */
SpousalChart.prototype.canvasHigherY = function(benefitY) {
  // canvasYValue is the absolute number canvas pixels that this point
  // represents above 0.
  var canvasYValue =
      Math.floor(benefitY / this.maxRenderedYDollars() * this.chartHeight());

  return this.midpointYValue() - canvasYValue - 1;
};

/** Renders specific value boxes based on mouse location. */
SpousalChart.prototype.mouseOutListener = function() {
  var self = this;
  return function(e) {
    if (self.mouseToggle == 'OFF')
      return;
    self.updateSelectedDate(new MonthDate());
    self.render();
  };
};

/** Toggles on/off functionality of mouseMoveListener. */
SpousalChart.prototype.mouseClickListener = function() {
  var self = this;
  return function(e) {
    var canvasY = e.clientY - self.canvas_.getBoundingClientRect().top;
    if (canvasY < 180) {
      self.updateSelectedDate(new MonthDate());
      return;
    }
    if (self.mouseToggle === 'ON') {
      self.mouseToggle = 'OFF';
      self.lastMouseX = e.clientX - self.canvas_.getBoundingClientRect().left;
    } else {
      self.mouseToggle = 'ON';
      // Immediately trigger a rendering based on mouse location.
      self.mouseMoveListener()(e);
    }
  };
};

/** Renders specific value boxes based on mouse location. */
SpousalChart.prototype.mouseMoveListener = function() {
  var self = this;
  return function(e) {
    if (self.mouseToggle == 'ON') {
      self.render();
      var canvasY = e.clientY - self.canvas_.getBoundingClientRect().top;
      if (canvasY < 180) {
        self.updateSelectedDate(new MonthDate());
        return;
      }
      var canvasX = e.clientX - self.canvas_.getBoundingClientRect().left;
      self.renderSelectedDateVerticalLine(canvasX);
    }
  };
};
