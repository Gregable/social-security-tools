import {EarningRecord} from './earning-record';
import {Money} from './money';

/**
 * Given a string which we know to be a number containing possibly a leading
 * dollar sign and internal commas, convert to an actual Money.
 */
export function dollarStringToMoney(dollarString: string): Money {
  // Similar idea here, for the year 1965, the SSA site will display
  // 'Medicare Began in 1966' if the data is unavailable. Record this as
  // a 0 sentinel.
  if (dollarString == 'MedicareBeganIn1966') return Money.from(0);
  if (dollarString == '') return Money.from(0);
  const numberString = dollarString.replace(/[$,]/g, '');
  const value = Number(numberString);
  if (Number.isNaN(value)) return Money.from(0);
  if (value < 0) return Money.from(0);
  return Money.from(value);
};

/**
 * Parses the table format used by the SSA.gov website.
 */
function parseSsaGovTable(lines: string[]): Array<EarningRecord> {
  let earningsRecords: Array<EarningRecord> = [];
  for (let i = 0; i < lines.length; ++i) {
    const line: string = lines[i];
    const columns: Array<string> = line.split(' ');
    if (columns[1] == 'NotYetRecorded') {
      let record = new EarningRecord({
        year: Number.parseInt(columns[0]),
        taxedEarnings: Money.from(0),
        taxedMedicareEarnings: Money.from(0),
      });
      record.incomplete = true;
      earningsRecords.push(record);
    } else {
      let record = new EarningRecord({
        year: Number.parseInt(columns[0]),
        taxedEarnings: dollarStringToMoney(columns[1]),
        taxedMedicareEarnings: columns.length > 2 ?
            dollarStringToMoney(columns[2]) :
            Money.from(0),
      });
      earningsRecords.push(record);
    }
  }
  return earningsRecords;
};

/**
 * Parses a user formatted table of earnings records.
 */
function parseFormattedTable(lines: string[]): Array<EarningRecord> {
  let earningsRecords: Array<EarningRecord> = [];
  for (let i = 0; i < lines.length; ++i) {
    const line: string = lines[i];
    const columns: Array<string> = line.split(' ');
    var record = new EarningRecord({
      year: Number.parseInt(columns[0]),
      taxedEarnings: dollarStringToMoney(columns[1]),
      taxedMedicareEarnings: Money.from(0),
    });
    earningsRecords.push(record);
  }
  return earningsRecords;
};

/**
 * Parses a copy / paste from this site's table.
 */
function parseThisSiteTable(lines: string[]): Array<EarningRecord> {
  let earningsRecords: Array<EarningRecord> = [];
  for (let i = 0; i < lines.length; ++i) {
    const line: string = lines[i];
    const columns: Array<string> = line.split(' ');
    if (columns[1] == 'NotYetRecorded') {
      let record = new EarningRecord({
        year: Number.parseInt(columns[0]),
        taxedEarnings: Money.from(0),
        taxedMedicareEarnings: Money.from(0),
      });
      record.incomplete = true;
      earningsRecords.push(record);
    } else {
      var record = new EarningRecord({
        year: Number.parseInt(columns[0]),
        taxedEarnings: dollarStringToMoney(columns[2]),
        taxedMedicareEarnings: Money.from(0),
      });
      earningsRecords.push(record);
    }
  }
  return earningsRecords;
};

/**
 * Determine if a string might be a year value.
 */
function isYearString(maybeYearStr: string): boolean {
  // If not an int, it's not a year.
  let maybeYear: number = Number.parseInt(maybeYearStr);
  if (Number.isNaN(maybeYear)) return false;
  // parseInt will ignore trailing garbage, so "1A" will be parsed as "1".
  // We don't want this as it could lead us to extract lines that aren't
  // valid.
  if (maybeYear.toString().length !== maybeYearStr.length) return false;

  // According to http://goo.gl/2HEj1H, the oldest person alive may have been
  // born as long back as 1887. This is debated, but it works for our simple
  // validation purposes here.
  if (maybeYear < 1887) return false;

  const CURRENT_YEAR = new Date().getFullYear();
  // If the pasted data is from ssa.gov, it won't have records greater than
  // last year, because the data comes from tax returns, which isn't processed
  // until the following year. However, some users would like to manufacture
  // data to paste into the tool, so we accept any year up to 70y in the
  // future. See https://github.com/Gregable/social-security-tools/issues/130
  if (maybeYear > CURRENT_YEAR + 70) return false;

  return true;
};

export function parsePaste(paste: string): Array<EarningRecord> {
  // We first collapse whitespace on each line as
  // different browsers insert different whitespace for column
  // separation.

  // Normalize and collapse whitespace.
  let replacedStr: string = paste.replace(/[ \t]+/g, ' ');
  // Normalize and collapse newlines.
  replacedStr = replacedStr.replace(/[\r\n]+/g, '\n');
  // Some columns will include the string "Not yet recorded" which breaks
  // columns on spaces in the string. We replace these with "NotYetRecorded".
  replacedStr = replacedStr.replace(/not yet recorded+/gi, 'NotYetRecorded');
  // Similarly, for records in 1965, the Medicare column will include the
  // string "Medicare Began in 1966". We replace this with:
  // "MedicareBeganIn1966".
  replacedStr =
      replacedStr.replace(/medicare began in 1966+/gi, 'MedicareBeganIn1966');

  // Split based on newlines.
  let lines: string[] = replacedStr.split('\n');

  // All valid lines will start with a year indicator.
  let earningsLines: string[] = [];
  for (let i = 0; i < lines.length; ++i) {
    const line: string = lines[i].trim();
    const columns: string[] = line.split(' ');
    if (!isYearString(columns[0])) continue;

    // There must be at least a year and an earnings value.
    if (columns.length < 2) {
      // Some browsers use a newline for column delimiter. See if the next
      // two lines look like dollar values, else, skip this line.
      if (i + 2 >= lines.length)  // Must have 2 more lines.
        continue;
      // Construct a synthetic line with year, dollar dollar.
      let constructedLine: string = columns[0];
      let legitThreeLineValue: boolean = true;
      for (let j = 1; j < 3; ++j) {
        const colValue: string = lines[i + j].trim();
        if (colValue === 'NotYetRecorded' || colValue[0] === '$') {
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
  if (earningsLines.length === 0) return [];

  // There are several different formats we are interested in:
  // 1) The table at ssa.gov's website.
  // 2) The table that we produce from our example data.
  // 3) Simple row format with year + earnings.
  // TODO: Add support for parsing the AnyPIA tool file format.
  //
  // We make a determination which format it is based on the first line.
  const firstLine: string = earningsLines[0];
  const firstLineColumns: string[] = firstLine.split(' ');

  let out: Array<EarningRecord> = [];
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
    out.sort(function(a, b) {
      return a.year - b.year
    });

  return out;
};
