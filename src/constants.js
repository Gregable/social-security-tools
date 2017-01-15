/**
 * This file holds constants that various bits of code need. Most of these
 * constatnts are values from the SSA and other IRS laws and require updating
 * regularly.
 */

// https://www.ssa.gov/pubs/EN-05-10070.pdf
// https://www.ssa.gov/oact/progdata/oasdiRates.html
// https://www.ssa.gov/cgi-bin/awiFactors.cgi
/**const*/ var SSA_MULTIPLIERS = [
  {
    'year': 1956,
    'maximumEarnings': 4200,
    'indexFactor': 13.6166,
    'taxRate': .02
  },
  {
    'year': 1957,
    'maximumEarnings': 4200,
    'indexFactor': 13.2077,
    'taxRate': .02
  },
  {
    'year': 1958,
    'maximumEarnings': 2400,
    'indexFactor': 13.0923,
    'taxRate': .02
  },
  {
    'year': 1959,
    'maximumEarnings': 4800,
    'indexFactor': 12.4744,
    'taxRate': .0225
  },
  {
    'year': 1960,
    'maximumEarnings': 4800,
    'indexFactor': 12.0033,
    'taxRate': .0275
  },
  {
    'year': 1961,
    'maximumEarnings': 4800,
    'indexFactor': 11.7693,
    'taxRate': .0275
  },
  {
    'year': 1962,
    'maximumEarnings': 4800,
    'indexFactor': 11.2081,
    'taxRate': .02875
  },
  {
    'year': 1963,
    'maximumEarnings': 4800,
    'indexFactor': 10.9399,
    'taxRate': .03375
  },
  {
    'year': 1964,
    'maximumEarnings': 4800,
    'indexFactor': 10.5103,
    'taxRate': .03375
  },
  {
    'year': 1965,
    'maximumEarnings': 4800,
    'indexFactor': 10.3244,
    'taxRate': .03375
  },
  {
    'year': 1966,
    'maximumEarnings': 6600,
    'indexFactor': 9.7398,
    'taxRate': .035
  },
  {
    'year': 1967,
    'maximumEarnings': 6600,
    'indexFactor': 9.2259,
    'taxRate': .0355
  },
  {
    'year': 1968,
    'maximumEarnings': 7800,
    'indexFactor': 8.6326,
    'taxRate': .03325
  },
  {
    'year': 1969,
    'maximumEarnings': 7800,
    'indexFactor': 8.1609,
    'taxRate': .03725
  },
  {
    'year': 1970,
    'maximumEarnings': 7800,
    'indexFactor': 7.7751,
    'taxRate': .0365
  },
  {
    'year': 1971,
    'maximumEarnings': 7800,
    'indexFactor': 7.4031,
    'taxRate': .0405
  },
  {
    'year': 1972,
    'maximumEarnings': 9000,
    'indexFactor': 6.7423,
    'taxRate': .0405
  },
  {
    'year': 1973,
    'maximumEarnings': 10800,
    'indexFactor': 6.3453,
    'taxRate': .043
  },
  {
    'year': 1974,
    'maximumEarnings': 13200,
    'indexFactor': 5.9893,
    'taxRate': .04375
  },
  {
    'year': 1975,
    'maximumEarnings': 14100,
    'indexFactor': 5.5728,
    'taxRate': .04375
  },
  {
    'year': 1976,
    'maximumEarnings': 15300,
    'indexFactor': 5.2131,
    'taxRate': .04375
  },
  {
    'year': 1977,
    'maximumEarnings': 16500,
    'indexFactor': 4.9183,
    'taxRate': .04375
  },
  {
    'year': 1978,
    'maximumEarnings': 17700,
    'indexFactor': 4.5565,
    'taxRate': .04275
  },
  {
    'year': 1979,
    'maximumEarnings': 22900,
    'indexFactor': 4.1900,
    'taxRate': .04330
  },
  {
    'year': 1980,
    'maximumEarnings': 25900,
    'indexFactor': 3.8438,
    'taxRate': .0520
  },
  {
    'year': 1981,
    'maximumEarnings': 29700,
    'indexFactor': 3.4922,
    'taxRate': .047
  },
  {
    'year': 1982,
    'maximumEarnings': 32400,
    'indexFactor': 3.3100,
    'taxRate': .04575
  },
  {
    'year': 1983,
    'maximumEarnings': 35700,
    'indexFactor': 3.1562,
    'taxRate': .04775
  },
  {
    'year': 1984,
    'maximumEarnings': 37800,
    'indexFactor': 2.981,
    'taxRate': .052
  },
  {
    'year': 1985,
    'maximumEarnings': 39600,
    'indexFactor': 2.8592,
    'taxRate': .052
  },
  {
    'year': 1986,
    'maximumEarnings': 42000,
    'indexFactor': 2.7768,
    'taxRate': .052
  },
  {
    'year': 1987,
    'maximumEarnings': 43800,
    'indexFactor': 2.6102,
    'taxRate': .052
  },
  {
    'year': 1988,
    'maximumEarnings': 45000,
    'indexFactor': 2.4878,
    'taxRate': .0553
  },
  {
    'year': 1989,
    'maximumEarnings': 48000,
    'indexFactor': 2.3930,
    'taxRate': .0553
  },
  {
    'year': 1990,
    'maximumEarnings': 51300,
    'indexFactor': 2.2874,
    'taxRate': .056
  },
  {
    'year': 1991,
    'maximumEarnings': 53400,
    'indexFactor': 2.2052,
    'taxRate': .056
  },
  {
    'year': 1992,
    'maximumEarnings': 55500,
    'indexFactor': 2.0971,
    'taxRate': .056
  },
  {
    'year': 1993,
    'maximumEarnings': 57600,
    'indexFactor': 2.0793,
    'taxRate': .056
  },
  {
    'year': 1994,
    'maximumEarnings': 60600,
    'indexFactor': 2.0249,
    'taxRate': .0526
  },
  {
    'year': 1995,
    'maximumEarnings': 61200,
    'indexFactor': 1.9469,
    'taxRate': .0526
  },
  {
    'year': 1996,
    'maximumEarnings': 62700,
    'indexFactor': 1.8561,
    'taxRate': .0526
  },
  {
    'year': 1997,
    'maximumEarnings': 65400,
    'indexFactor': 1.7538,
    'taxRate': .0535
  },
  {
    'year': 1998,
    'maximumEarnings': 68400,
    'indexFactor': 1.6665,
    'taxRate': .0535
  },
  {
    'year': 1999,
    'maximumEarnings': 72600,
    'indexFactor': 1.5786,
    'taxRate': .0535
  },
  {
    'year': 2000,
    'maximumEarnings': 76200,
    'indexFactor': 1.4958,
    'taxRate': .053
  },
  {
    'year': 2001,
    'maximumEarnings': 80400,
    'indexFactor': 1.4609,
    'taxRate': .053
  },
  {
    'year': 2002,
    'maximumEarnings': 84900,
    'indexFactor': 1.4465,
    'taxRate': .053
  },
  {
    'year': 2003,
    'maximumEarnings': 87000,
    'indexFactor': 1.4120,
    'taxRate': .053
  },
  {
    'year': 2004,
    'maximumEarnings': 87900,
    'indexFactor': 1.3492,
    'taxRate': .053
  },
  {
    'year': 2005,
    'maximumEarnings': 90000,
    'indexFactor': 1.3016,
    'taxRate': .053
  },
  {
    'year': 2006,
    'maximumEarnings': 94200,
    'indexFactor': 1.2444,
    'taxRate': .053
  },
  {
    'year': 2007,
    'maximumEarnings': 97500,
    'indexFactor': 1.1904,
    'taxRate': .053
  },
  {
    'year': 2008,
    'maximumEarnings': 102000,
    'indexFactor': 1.1636,
    'taxRate': .053
  },
  {
    'year': 2009,
    'maximumEarnings': 106800,
    'indexFactor': 1.1814,
    'taxRate': .053
  },
  {
    'year': 2010,
    'maximumEarnings': 106800,
    'indexFactor': 1.1542,
    'taxRate': .053
  },
  {
    'year': 2011,
    'maximumEarnings': 106800,
    'indexFactor': 1.1191,
    'taxRate': .053
  },
  {
    'year': 2012,
    'maximumEarnings': 111100,
    'indexFactor': 1.0852,
    'taxRate': .053
  },
  {
    'year': 2013,
    'maximumEarnings': 113700,
    'indexFactor': 1.0715,
    'taxRate': .053
  },
  {
    'year': 2014,
    'maximumEarnings': 117000,
    'indexFactor': 1.0348,
    'taxRate': .053
  },
  {
    'year': 2015,
    'maximumEarnings': 118500,
    'indexFactor': 1.00,
    'taxRate': .053
  },
  {
    'year': 2016,
    'maximumEarnings': 118500,
    'indexFactor': 1.00,
    'taxRate': .053
  },
];

// Breakpoints at which the multiplier for indexed earnings to benefits changes.
// These values are for annual values of indexed earnings, not monthly in the
// way the SSA likes to display them.
// https://www.ssa.gov/OACT/COLA/autoAdj.html
/** const */ var BENEFIT_BRACKETS = [
  {
    max: 10620,
    multiplier: 0.9
  },
  {
    min: 10620,
    max: 64032,
    multiplier: 0.32
  },
  {
    min: 64032,
    multiplier: 0.15
  },
];

// Number of top years of earnings which contribute to SSA calculations.
/** const */ var SSA_EARNINGS_YEARS = 35;

/** const */ var CURRENT_YEAR = 2017;

/** const */ var ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// https://www.ssa.gov/planners/retire/retirechart.html
// https://www.ssa.gov/planners/retire/agereduction.html
// https://www.ssa.gov/planners/retire/delayret.html
// https://www.ssa.gov/oact/quickcalc/early_late.html
// delatedIncreaseAnnual is the increase amount every year after full
// retirement age. These are different denominators essentially, and should be
// normalized (TODO) for sanity. They are presented in this way in ssa docs.
/** const */ var FULL_RETIREMENT_AGE = [
  {
    minYear: 0,
    maxYear: 1937,
    ageYears: 65,
    ageMonths: 0,
    delayedIncreaseAnnual: 0.065
  },
  {
    minYear: 1938,
    maxYear: 1938,
    ageYears: 65,
    ageMonths: 2,
    delayedIncreaseAnnual: 0.065
  },
  {
    minYear: 1939,
    maxYear: 1939,
    ageYears: 65,
    ageMonths: 4,
    delayedIncreaseAnnual: 0.07
  },
  {
    minYear: 1940,
    maxYear: 1940,
    ageYears: 65,
    ageMonths: 6,
    delayedIncreaseAnnual: 0.07
  },
  {
    minYear: 1941,
    maxYear: 1941,
    ageYears: 65,
    ageMonths: 8,
    delayedIncreaseAnnual: 0.075
  },
  {
    minYear: 1942,
    maxYear: 1942,
    ageYears: 65,
    ageMonths: 10,
    delayedIncreaseAnnual: 0.075
  },
  {
    minYear: 1943,
    maxYear: 1954,
    ageYears: 66,
    ageMonths: 0,
    delayedIncreaseAnnual: 0.08
  },
  {
    minYear: 1955,
    maxYear: 1955,
    ageYears: 66,
    ageMonths: 2,
    delayedIncreaseAnnual: 0.08
  },
  {
    minYear: 1956,
    maxYear: 1956,
    ageYears: 66,
    ageMonths: 4,
    delayedIncreaseAnnual: 0.08
  },
  {
    minYear: 1957,
    maxYear: 1957,
    ageYears: 66,
    ageMonths: 6,
    delayedIncreaseAnnual: 0.08
  },
  {
    minYear: 1958,
    maxYear: 1958,
    ageYears: 66,
    ageMonths: 8,
    delayedIncreaseAnnual: 0.08
  },
  {
    minYear: 1959,
    maxYear: 1959,
    ageYears: 66,
    ageMonths: 10,
    delayedIncreaseAnnual: 0.08
  },
  {
    minYear: 1960,
    maxYear: 10000,
    ageYears: 67,
    ageMonths: 0,
    delayedIncreaseAnnual: 0.08
  },
];
