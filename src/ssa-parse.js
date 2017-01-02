
/**
 * Determines if the given string seems like it could reasonably be a year
 * from a SSA website table.
 * @param {string} maybe_year
 * @return {boolean}
 */
var IsStringSSAYearLine = function(maybe_year) {
  // If not a number, it's not a year.
  maybe_year = parseFloat(maybe_year);
  if (!angular.isNumber(maybe_year))
    return false;

  // If not an integer, it's not a year.
  if (!Math.floor(maybe_year) == maybe_year)
    return false;

  // According to http://goo.gl/2HEj1H, the oldest person alive may have been
  // born as long back as 1887. This is debated, but it works for our simple
  // validation purposes here.
  // Note that this code has a Y2050 bug. Meh.
  return (maybe_year >= 1887 && maybe_year <= 2050);
}

/**
 * Given a string which we know to be a number containing possibly a leading
 * dollar sign and internal commas, convert to an actual number.
 * @param {string} dollar_string
 * @return {Number}
 */
var dollarStringToNumber = function(dollar_string) {
  var number_string = dollar_string.replace(/[$,]/g, '');
  return Number(number_string);
}

/* Parses earnings records from a parse of user data from 
 * the SSA.gov website.
 * @param {string} earningsRecordsRaw
 * @return {!Array<!TaxRecord>}
 */
var parseYearRecords = function(earningsRecordsRaw) {
  earningsRecords = [];

  var columnNames = ["year", "taxedEarnings", "taxedMedicareEarnings"];
  var lines = earningsRecordsRaw.split("\n");

  var seenStartLine = false;
  var column = 0;
  var record = new TaxRecord();
  for (var i = 0; i < lines.length; ++i) {
    var line = lines[i];

    // We ignore lines until we see a line that looks like a SSA website year.
    // At this point we begin processing all later lines.
    if (!seenStartLine && IsStringSSAYearLine(line)) {
      seenStartLine = true;
    }

    // If we haven't gotten to a start line yet, then just skip this line.
    if (!seenStartLine)
      continue;

    // If the 1st column data isn't a year, we're past the earnings table and
    // can ignore the rest of the input lines.
    if (column == 0 && !IsStringSSAYearLine(line))
      break;

    // There are 3 columns, so we rotate through each one once for eay year.
    var value = dollarStringToNumber(line);
    switch(column) {
      case 0:
        record.year = value;
        break;
      case 1:
        record.taxedEarnings = value;
        break;
      case 2:
        record.taxedMedicareEarnings = value;
        break;
      default:
        console.error("Unknown column: " + column);
    }


    // A column of 3 indicates that we reached the end of the record.
    column += 1;
    if (column === 3) {
      earningsRecords.push(record);
      record = new TaxRecord();
      column = 0;
    }
  }

  // SSA's tables display years in reverse chronological order which makes
  // sense for display, but is not what code usually expects, so we sort
  // output so that it's in chronological order.
  earningsRecords.sort(function(a, b) { return a.year - b.year });

  return earningsRecords;
}
