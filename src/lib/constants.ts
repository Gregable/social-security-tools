/**
 * This file holds constants that various bits of code need. Most of these
 * constants are values from the SSA and other IRS laws and require updating
 * annually.
 */

/**
 * The number of credits needed to qualify for retirement benefits
 * https://www.ssa.gov/planners/credits.html
 */
export const MAX_CREDITS: number = 40

/**
 * This is the maximum year for which SSA constants, such as
 * EARNINGS_PER_CREDIT and MAXIMUM_EARNINGS, have been published.
 * This year's values are applied to years in the future if the user
 * manually manipulates the input string.
 * @type {number}
 */
export const MAX_YEAR: number = 2023;

/**
 * For years before 1978, an individual was credited with a quarter of coverage
 * for each quarter in which total wages of at least $50 were paid, or 4
 * quarters of coverage for every taxable year in which total wages of at least
 * $400 were earned. Beginning in 1978, employers generally report wages
 * annually, so the law changed to provide a quarter of coverage for each $250
 * of wages, up to a maximum of four quarters of coverage per year.
 *
 * Since we don't have access to quarterly earning records, we approximate this
 * by using the $50 per quarter credit rule for years before 1978.
 *
 * https://www.ssa.gov/OACT/COLA/QC.html
 */
export const EARNINGS_PER_CREDIT_BEFORE_1978: number = 50;

/**
 * Earnings required for one quarter of coverage per year.
 *
 * Values are in dollars.
 */
export const EARNINGS_PER_CREDIT: {[key: number]: number} = {
  // Values from https://www.ssa.gov/OACT/COLA/QC.html
  1978: 250,
  1979: 260,
  1980: 290,
  1981: 310,
  1982: 340,
  1983: 370,
  1984: 390,
  1985: 410,
  1986: 440,
  1987: 460,
  1988: 470,
  1989: 500,
  1990: 520,
  1991: 540,
  1992: 570,
  1993: 590,
  1994: 620,
  1995: 630,
  1996: 640,
  1997: 670,
  1998: 700,
  1999: 740,
  2000: 780,
  2001: 830,
  2002: 870,
  2003: 890,
  2004: 900,
  2005: 920,
  2006: 970,
  2007: 1000,
  2008: 1050,
  2009: 1090,
  2010: 1120,
  2011: 1120,
  2012: 1130,
  2013: 1160,
  2014: 1200,
  2015: 1220,
  2016: 1260,
  2017: 1300,
  2018: 1320,
  2019: 1360,
  2020: 1410,
  2021: 1470,
  2022: 1510,
  2023: 1640,
};

/**
 * Maximum earnings in each year which contribute to social security benefits.
 *
 * Values are in dollars.
 */
export const MAXIMUM_EARNINGS: {[key: number]: number} = {
  // Values from https://www.ssa.gov/OACT/COLA/cbb.html
  1937: 3000,
  1938: 3000,
  1939: 3000,
  1940: 3000,
  1941: 3000,
  1942: 3000,
  1943: 3000,
  1944: 3000,
  1945: 3000,
  1946: 3000,
  1947: 3000,
  1948: 3000,
  1949: 3000,
  1950: 3000,
  1951: 3600,
  1952: 3600,
  1953: 3600,
  1954: 3600,
  1955: 4200,
  1956: 4200,
  1957: 4200,
  1958: 4200,
  1959: 4800,
  1960: 4800,
  1961: 4800,
  1962: 4800,
  1963: 4800,
  1964: 4800,
  1965: 4800,
  1966: 6600,
  1967: 6600,
  1968: 7800,
  1969: 7800,
  1970: 7800,
  1971: 7800,
  1972: 9000,
  1973: 10800,
  1974: 13200,
  1975: 14100,
  1976: 15300,
  1977: 16500,
  1978: 17700,
  1979: 22900,
  1980: 25900,
  1981: 29700,
  1982: 32400,
  1983: 35700,
  1984: 37800,
  1985: 39600,
  1986: 42000,
  1987: 43800,
  1988: 45000,
  1989: 48000,
  1990: 51300,
  1991: 53400,
  1992: 55500,
  1993: 57600,
  1994: 60600,
  1995: 61200,
  1996: 62700,
  1997: 65400,
  1998: 68400,
  1999: 72600,
  2000: 76200,
  2001: 80400,
  2002: 84900,
  2003: 87000,
  2004: 87900,
  2005: 90000,
  2006: 94200,
  2007: 97500,
  2008: 102000,
  2009: 106800,
  2010: 106800,
  2011: 106800,
  2012: 110100,
  2013: 113700,
  2014: 117000,
  2015: 118500,
  2016: 118500,
  2017: 127200,
  2018: 128400,
  2019: 132900,
  2020: 137700,
  2021: 142800,
  2022: 147000,
  2023: 160200,
};
/**
 * Earliest Year for which we have data for the maximum earnings.
 */
export const MIN_MAXIMUM_EARNINGS_YEAR = 1937;

/**
 * Tax rates for social security contributions by year.
 *
 * Values are expressed as a decimal, e.g. 0.062 for 6.2%.
 */
export const TAX_RATES: {[key: number]: number} = {
  // Values from https://www.ssa.gov/oact/progdata/oasdiRates.html
  1956: .02,
  1957: .02,
  1958: .02,
  1959: .0225,
  1960: .0275,
  1961: .0275,
  1962: .02875,
  1963: .03375,
  1964: .03375,
  1965: .03375,
  1966: .035,
  1967: .0355,
  1968: .03325,
  1969: .03725,
  1970: .0365,
  1971: .0405,
  1972: .0405,
  1973: .043,
  1974: .04375,
  1975: .04375,
  1976: .04375,
  1977: .04375,
  1978: .04275,
  1979: .04330,
  1980: .0520,
  1981: .047,
  1982: .04575,
  1983: .04775,
  1984: .052,
  1985: .052,
  1986: .052,
  1987: .052,
  1988: .0553,
  1989: .0553,
  1990: .056,
  1991: .056,
  1992: .056,
  1993: .056,
  1994: .0526,
  1995: .0526,
  1996: .0526,
  1997: .0535,
  1998: .0535,
  1999: .0535,
  2000: .053,
  2001: .053,
  2002: .053,
  2003: .053,
  2004: .053,
  2005: .053,
  2006: .053,
  2007: .053,
  2008: .053,
  2009: .053,
  2010: .053,
  2011: .053,
  2012: .053,
  2013: .053,
  2014: .053,
  2015: .053,
  2016: .0515,
  2017: .0515,
  2018: .0515,
  2019: .053,
  2020: .053,
  2021: .053,
  2022: .053,
  2023: .053,
};

// Values from https://www.ssa.gov/oact/cola/piaformula.html

/* The first bend in dollars in 1977 for the PIA formula. */
export const BENDPOINT1_IN_1977: number = 180.0
/* The second bend in dollars in 1977 for the PIA formula. */
export const BENDPOINT2_IN_1977: number = 1085.0
/* PIA formula multiplier before the first bend point. */
export const BEFORE_BENDPOINT1_MULTIPLIER: number = 0.9
/* PIA formula multiplier after the first bend point but before the second.
 */
export const BEFORE_BENDPOINT2_MULTIPLIER: number = 0.32
/* PIA formula multiplier after the second bend point. */
export const AFTER_BENDPOINT2_MULTIPLIER: number = 0.15

/**
 * The average wage index for each year, in dollars.
 */
export const WAGE_INDICES: {[key: number]: number} = {
  // Data from https://www.ssa.gov/oact/cola/awiseries.html
  1951: 2799.16,
  1952: 2973.32,
  1953: 3139.44,
  1954: 3155.64,
  1955: 3301.44,
  1956: 3532.36,
  1957: 3641.72,
  1958: 3673.80,
  1959: 3855.80,
  1960: 4007.12,
  1961: 4086.76,
  1962: 4291.40,
  1963: 4396.64,
  1964: 4576.32,
  1965: 4658.72,
  1966: 4938.36,
  1967: 5213.44,
  1968: 5571.76,
  1969: 5893.76,
  1970: 6186.24,
  1971: 6497.08,
  1972: 7133.80,
  1973: 7580.16,
  1974: 8030.76,
  1975: 8630.92,
  1976: 9226.48,
  1977: 9779.44,
  1978: 10556.03,
  1979: 11479.46,
  1980: 12513.46,
  1981: 13773.10,
  1982: 14531.34,
  1983: 15239.24,
  1984: 16135.07,
  1985: 16822.51,
  1986: 17321.82,
  1987: 18426.51,
  1988: 19334.04,
  1989: 20099.55,
  1990: 21027.98,
  1991: 21811.60,
  1992: 22935.42,
  1993: 23132.67,
  1994: 23753.53,
  1995: 24705.66,
  1996: 25913.90,
  1997: 27426.00,
  1998: 28861.44,
  1999: 30469.84,
  2000: 32154.82,
  2001: 32921.92,
  2002: 33252.09,
  2003: 34064.95,
  2004: 35648.55,
  2005: 36952.94,
  2006: 38651.41,
  2007: 40405.48,
  2008: 41334.97,
  2009: 40711.61,
  2010: 41673.83,
  2011: 42979.61,
  2012: 44321.67,
  2013: 44888.16,
  2014: 46481.52,
  2015: 48098.63,
  2016: 48642.15,
  2017: 50321.89,
  2018: 52145.80,
  2019: 54099.99,
  2020: 55628.60,
  2021: 60575.07,
};
/**
 * The minimum year for which we have wage index data.
 */
export const MIN_WAGE_INDEX_YEAR: number = 1951;

/**
 * The maximum year for which we have wage index data.
 */
export const MAX_WAGE_INDEX_YEAR: number =
    Math.max(...Object.keys(WAGE_INDICES).map(Number));

/**
 * COLA Adjustments percentages per year. Values are in whole percentages,
 * e.g. 1.0 = 1%.
 */
export const COLA: {[key: number]: number} = {
  // Data from https://www.ssa.gov/OACT/COLA/colaseries.html
  1975: 8.0,
  1976: 6.4,
  1977: 5.9,
  1978: 6.5,
  1979: 9.9,
  1980: 14.3,
  1981: 11.2,
  1982: 7.4,
  1983: 3.5,
  1984: 3.5,
  1985: 3.1,
  1986: 1.3,
  1987: 4.2,
  1988: 4.0,
  1989: 4.7,
  1990: 5.4,
  1991: 3.7,
  1992: 3.0,
  1993: 2.6,
  1994: 2.8,
  1995: 2.6,
  1996: 2.9,
  1997: 2.1,
  1998: 1.3,
  1999: 2.5,
  2000: 3.5,
  2001: 2.6,
  2002: 1.4,
  2003: 2.1,
  2004: 2.7,
  2005: 4.1,
  2006: 3.3,
  2007: 2.3,
  2008: 5.8,
  2009: 0.0,
  2010: 0.0,
  2011: 3.6,
  2012: 1.7,
  2013: 1.5,
  2014: 1.7,
  2015: 0.0,
  2016: 0.3,
  2017: 2.0,
  2018: 2.8,
  2019: 1.6,
  2020: 1.3,
  2021: 5.9,
  2022: 8.7,
};

/**
 * Number of top years of earnings which contribute to SSA calculations.
 */
export const SSA_EARNINGS_YEARS: number = 35;

/**
 * The current calendar year, or the next calendar year if the URL parameter
 * "next_year" is set.
 */
export let CURRENT_YEAR: number = new Date().getFullYear();
if (MAX_YEAR > CURRENT_YEAR &&
    typeof window !== 'undefined') {  // Tests can't access DOM:
  const urlParams = new URLSearchParams(window.location.search);
  const parameterNextYear = urlParams.get('next_year');
  if (parameterNextYear !== null) {
    CURRENT_YEAR += 1;
  }
}

/**
 * All months, in order, as 3-letter abbreviations.
 */
export const ALL_MONTHS: string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
  'Dec'
];

/**
 * All months, in order, as full names.
 */
export const ALL_MONTHS_FULL: string[] = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];


/**
 * Full retirement age (FRA) for each year of birth.
 * - `minYear` and `maxYear` are inclusive.
 * - `ageYears` and `ageMonths` are the age at FRA.
 * - `delatedIncreaseAnnual` is the increase amount every year after full
 *   retirement age. This is a percentage of the PIA, e.g. 0.065 = 6.5%.
 */
export const FULL_RETIREMENT_AGE: Array<{
  minYear: number,
  maxYear: number,
  ageYears: number,
  ageMonths: number,
  delayedIncreaseAnnual: number
}> =
    /* https://www.ssa.gov/planners/retire/retirechart.html
     * https://www.ssa.gov/planners/retire/agereduction.html
     * https://www.ssa.gov/planners/retire/delayret.html
     * https://www.ssa.gov/oact/quickcalc/early_late.html
     */
    [
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