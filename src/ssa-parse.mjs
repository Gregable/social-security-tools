import * as constants from './constants.mjs';
import { EarningRecord } from './recipient.mjs';

/**
 * Given a string which we know to be a number containing possibly a leading
 * dollar sign and internal commas, convert to an actual number.
 * @param {string} dollar_string
 * @return {Number}
 */
var dollarStringToNumber = function(dollar_string) {
  // For the current year, the SSA site will display 'Not yet recorded'
  // if the data is unavailable so far, presumably because taxes haven't
  // yet been filed. Record this as a -1 sentinel for now.
  if (dollar_string === 'NotYetRecorded')
    return -1;
  var number_string = dollar_string.replace(/[$,]/g, '');
  return Number(number_string);
}
export { dollarStringToNumber };

var parseSsaGovTable = function(lines) {
  let earningsRecords = [];
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    const columns = line.split(' ');
    var record = new EarningRecord();
    record.year = Number.parseInt(columns[0]);
    record.taxedEarnings = dollarStringToNumber(columns[1]);
    record.taxedMedicareEarnings = dollarStringToNumber(columns[2]);
    earningsRecords.push(record);
  }
  return earningsRecords;
}
var parseFormattedTable = function(lines) {
  let earningsRecords = [];
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    const columns = line.split(' ');
    var record = new EarningRecord();
    record.year = Number.parseInt(columns[0]);
    record.taxedEarnings = dollarStringToNumber(columns[1]);
    earningsRecords.push(record);
  }
  return earningsRecords;
}
var parseThisSiteTable = function(lines) {
  let earningsRecords = [];
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    const columns = line.split(' ');
    var record = new EarningRecord();
    record.year = Number.parseInt(columns[0]);
    record.taxedEarnings = dollarStringToNumber(columns[2]);
    earningsRecords.push(record);
  }
  return earningsRecords;
}

function isYearString(maybeYearStr) {
  // If not an int, it's not a year.
  let maybeYear = Number.parseInt(maybeYearStr);
  if (Number.isNaN(maybeYear))
    return false;
  // parseInt will ignore trailing garbage, so "1A" will be parsed as "1".
  // We don't want this as it could lead us to extract lines that aren't
  // valid.
  if (maybeYear.toString().length !== maybeYearStr.length)
    return false;

  // According to http://goo.gl/2HEj1H, the oldest person alive may have been
  // born as long back as 1887. This is debated, but it works for our simple
  // validation purposes here.
  if (maybeYear < 1887)
    return false;

  // If the pasted data is from ssa.gov, it won't have records greater than
  // last year, because the data comes from tax returns, which isn't processed
  // until the following year. However, some users would like to manufacture
  // data to paste into the tool, so we accept any year up to 70y in the future.
  // See https://github.com/Gregable/social-security-tools/issues/130
  if (maybeYear > constants.CURRENT_YEAR + 70)
    return false;

  return true;
}

var parsePaste = function(paste) {
  // We first collapse whitespace on each line as
  // different browsers insert different whitespace for column
  // separation.

  // Normalize and collapse whitespace.
  let replacedStr = paste.replace(/[ \t]+/g, " ");
  // Normalize and collapse newlines.
  replacedStr = replacedStr.replace(/[\r\n]+/g, "\n");
  // Some columns will include the string "Not yet recorded" which breaks
  // columns on spaces in the string. We replace these with "NotYetRecorded".
  replacedStr = replacedStr.replace(/not yet recorded+/gi, "NotYetRecorded");

  // Split based on newlines.
  let lines = replacedStr.split("\n");

  // All valid lines will start with a year indicator.
  let earningsLines = [];
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i].trim();
    const columns = line.split(' ');
    if (!isYearString(columns[0]))
      continue;

    // There must be at least a year and an earnings value.
    if (columns.length < 2) {
      // Some browsers use a newline for column delimiter. See if the next
      // two lines look like dollar values, else, skip this line.
      if (i + 2 >= lines.length)  // Must have 2 more lines.
        continue;
      // Construct a synthetic line with year, dollar dollar.
      let constructedLine = columns[0];
      let legitThreeLineValue = true;
      for (let j = 1; j < 3; ++j) {
        const colValue = lines[i + j].trim();
        if (colValue === 'NotYetRecorded' ||
            colValue[0] === '$') {
          constructedLine += ' ' + colValue;
        } else {
          legitThreeLineValue = false;
        }
      }
      // If we found three lines, add it to the list of earnings lines
      // and advance 2 extra lines.
      if (legitThreeLineValue) {
        earningsLines.push(constructedLine);
        i += 2;
      }
    } else {
      earningsLines.push(line);
    }
  }
  if (earningsLines.length === 0)
    return [];

  // There are several different formats we are interested in:
  // 1) The table at ssa.gov's website.
  // 2) The table that we produce from our example data.
  // 3) Simple row format with year + earnings.
  // TODO: Add support for parsing the AnyPIA tool file format.
  //
  // We make a determination which format it is based on the first line.
  const firstLine = earningsLines[0];
  const firstLineColumns = firstLine.split(' ');

  let out = [];
  // The SSA website format looks like:
  //   1974 $500 $500
  if (firstLineColumns.length === 3) {
    out = parseSsaGovTable(earningsLines);
  }
  // User formatted input looks like:
  //   1974 $500
  if (firstLineColumns.length === 2) {
    out = parseFormattedTable(earningsLines);
  }
  // The table that this tool produces has lines that look like:
  //   1974 24 $500 x 5.19 = $2,595 Top 35 Value
  if (firstLineColumns.length >= 7 && firstLineColumns[3] === 'x' &&
      firstLineColumns[5] === '=') {
    out = parseThisSiteTable(earningsLines);
  }

  // SSA's tables display years in reverse chronological order which makes
  // sense for display, but is not what code usually expects, so we sort
  // output so that it's in chronological order. This also lets us handle
  // errors in user formatted years or whatnot.
  if (out.length > 1)
    out.sort(function(a, b) { return a.year - b.year });

  return out;
}
export { parsePaste };
