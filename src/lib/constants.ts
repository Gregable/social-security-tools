import { Money } from '$lib/money';
/**
 * This file holds constants that various bits of code need. Most of these
 * constants are values from the SSA and other IRS laws and require updating
 * annually.
 */

/**
 * The number of credits needed to qualify for retirement benefits
 * https://www.ssa.gov/planners/credits.html
 */
export const MAX_CREDITS: number = 40;

/**
 * This is the maximum year for which SSA constants, such as
 * EARNINGS_PER_CREDIT and MAXIMUM_EARNINGS, have been published.
 * This year's values are applied to years in the future if the user
 * manually manipulates the input string.
 * @type {number}
 */
export const MAX_YEAR: number = 2025;

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
export const EARNINGS_PER_CREDIT_BEFORE_1978: Money = Money.from(50);

/**
 * Earnings required for one quarter of coverage per year.
 */
export const EARNINGS_PER_CREDIT: { [key: number]: Money } = {
  // Values from https://www.ssa.gov/OACT/COLA/QC.html
  1978: Money.from(250),
  1979: Money.from(260),
  1980: Money.from(290),
  1981: Money.from(310),
  1982: Money.from(340),
  1983: Money.from(370),
  1984: Money.from(390),
  1985: Money.from(410),
  1986: Money.from(440),
  1987: Money.from(460),
  1988: Money.from(470),
  1989: Money.from(500),
  1990: Money.from(520),
  1991: Money.from(540),
  1992: Money.from(570),
  1993: Money.from(590),
  1994: Money.from(620),
  1995: Money.from(630),
  1996: Money.from(640),
  1997: Money.from(670),
  1998: Money.from(700),
  1999: Money.from(740),
  2000: Money.from(780),
  2001: Money.from(830),
  2002: Money.from(870),
  2003: Money.from(890),
  2004: Money.from(900),
  2005: Money.from(920),
  2006: Money.from(970),
  2007: Money.from(1000),
  2008: Money.from(1050),
  2009: Money.from(1090),
  2010: Money.from(1120),
  2011: Money.from(1120),
  2012: Money.from(1130),
  2013: Money.from(1160),
  2014: Money.from(1200),
  2015: Money.from(1220),
  2016: Money.from(1260),
  2017: Money.from(1300),
  2018: Money.from(1320),
  2019: Money.from(1360),
  2020: Money.from(1410),
  2021: Money.from(1470),
  2022: Money.from(1510),
  2023: Money.from(1640),
  2024: Money.from(1730),
  2025: Money.from(1810),
};

export const MAX_EARNINGS_PER_CREDIT: number = Math.max(
  ...Object.keys(EARNINGS_PER_CREDIT).map(Number)
);

/**
 * Maximum earnings in each year which contribute to social security benefits.
 */
export const MAXIMUM_EARNINGS: { [key: number]: Money } = {
  // Values from https://www.ssa.gov/OACT/COLA/cbb.html
  1937: Money.from(3000),
  1938: Money.from(3000),
  1939: Money.from(3000),
  1940: Money.from(3000),
  1941: Money.from(3000),
  1942: Money.from(3000),
  1943: Money.from(3000),
  1944: Money.from(3000),
  1945: Money.from(3000),
  1946: Money.from(3000),
  1947: Money.from(3000),
  1948: Money.from(3000),
  1949: Money.from(3000),
  1950: Money.from(3000),
  1951: Money.from(3600),
  1952: Money.from(3600),
  1953: Money.from(3600),
  1954: Money.from(3600),
  1955: Money.from(4200),
  1956: Money.from(4200),
  1957: Money.from(4200),
  1958: Money.from(4200),
  1959: Money.from(4800),
  1960: Money.from(4800),
  1961: Money.from(4800),
  1962: Money.from(4800),
  1963: Money.from(4800),
  1964: Money.from(4800),
  1965: Money.from(4800),
  1966: Money.from(6600),
  1967: Money.from(6600),
  1968: Money.from(7800),
  1969: Money.from(7800),
  1970: Money.from(7800),
  1971: Money.from(7800),
  1972: Money.from(9000),
  1973: Money.from(10800),
  1974: Money.from(13200),
  1975: Money.from(14100),
  1976: Money.from(15300),
  1977: Money.from(16500),
  1978: Money.from(17700),
  1979: Money.from(22900),
  1980: Money.from(25900),
  1981: Money.from(29700),
  1982: Money.from(32400),
  1983: Money.from(35700),
  1984: Money.from(37800),
  1985: Money.from(39600),
  1986: Money.from(42000),
  1987: Money.from(43800),
  1988: Money.from(45000),
  1989: Money.from(48000),
  1990: Money.from(51300),
  1991: Money.from(53400),
  1992: Money.from(55500),
  1993: Money.from(57600),
  1994: Money.from(60600),
  1995: Money.from(61200),
  1996: Money.from(62700),
  1997: Money.from(65400),
  1998: Money.from(68400),
  1999: Money.from(72600),
  2000: Money.from(76200),
  2001: Money.from(80400),
  2002: Money.from(84900),
  2003: Money.from(87000),
  2004: Money.from(87900),
  2005: Money.from(90000),
  2006: Money.from(94200),
  2007: Money.from(97500),
  2008: Money.from(102000),
  2009: Money.from(106800),
  2010: Money.from(106800),
  2011: Money.from(106800),
  2012: Money.from(110100),
  2013: Money.from(113700),
  2014: Money.from(117000),
  2015: Money.from(118500),
  2016: Money.from(118500),
  2017: Money.from(127200),
  2018: Money.from(128400),
  2019: Money.from(132900),
  2020: Money.from(137700),
  2021: Money.from(142800),
  2022: Money.from(147000),
  2023: Money.from(160200),
  2024: Money.from(168600),
  2025: Money.from(176100),
};
/**
 * Earliest Year for which we have data for the maximum earnings.
 */
export const MIN_MAXIMUM_EARNINGS_YEAR: number = 1937;
/**
 * Latest Year for which we have data for the maximum earnings.
 */
export const MAX_MAXIMUM_EARNINGS_YEAR: number = Math.max(
  ...Object.keys(MAXIMUM_EARNINGS).map(Number)
);

/**
 * Tax rates for social security contributions by year.
 *
 * Values are expressed as a decimal, e.g. 0.062 for 6.2%.
 */
export const TAX_RATES: { [key: number]: number } = {
  // Values from https://www.ssa.gov/oact/progdata/oasdiRates.html
  1956: 0.02,
  1957: 0.02,
  1958: 0.02,
  1959: 0.0225,
  1960: 0.0275,
  1961: 0.0275,
  1962: 0.02875,
  1963: 0.03375,
  1964: 0.03375,
  1965: 0.03375,
  1966: 0.035,
  1967: 0.0355,
  1968: 0.03325,
  1969: 0.03725,
  1970: 0.0365,
  1971: 0.0405,
  1972: 0.0405,
  1973: 0.043,
  1974: 0.04375,
  1975: 0.04375,
  1976: 0.04375,
  1977: 0.04375,
  1978: 0.04275,
  1979: 0.0433,
  1980: 0.052,
  1981: 0.047,
  1982: 0.04575,
  1983: 0.04775,
  1984: 0.052,
  1985: 0.052,
  1986: 0.052,
  1987: 0.052,
  1988: 0.0553,
  1989: 0.0553,
  1990: 0.056,
  1991: 0.056,
  1992: 0.056,
  1993: 0.056,
  1994: 0.0526,
  1995: 0.0526,
  1996: 0.0526,
  1997: 0.0535,
  1998: 0.0535,
  1999: 0.0535,
  2000: 0.053,
  2001: 0.053,
  2002: 0.053,
  2003: 0.053,
  2004: 0.053,
  2005: 0.053,
  2006: 0.053,
  2007: 0.053,
  2008: 0.053,
  2009: 0.053,
  2010: 0.053,
  2011: 0.053,
  2012: 0.053,
  2013: 0.053,
  2014: 0.053,
  2015: 0.053,
  2016: 0.0515,
  2017: 0.0515,
  2018: 0.0515,
  2019: 0.053,
  2020: 0.053,
  2021: 0.053,
  2022: 0.053,
  2023: 0.053,
  2024: 0.053,
  2025: 0.053,
};

// Values from https://www.ssa.gov/oact/cola/piaformula.html

/* The first bend in dollars in 1977 for the PIA formula. */
export const BENDPOINT1_IN_1977: Money = Money.from(180.0);
/* The second bend in dollars in 1977 for the PIA formula. */
export const BENDPOINT2_IN_1977: Money = Money.from(1085.0);
/* PIA formula multiplier before the first bend point. */
export const BEFORE_BENDPOINT1_MULTIPLIER: number = 0.9;
/* PIA formula multiplier after the first bend point but before the second.
 */
export const BEFORE_BENDPOINT2_MULTIPLIER: number = 0.32;
/* PIA formula multiplier after the second bend point. */
export const AFTER_BENDPOINT2_MULTIPLIER: number = 0.15;

/**
 * The average wage index for each year, in dollars.
 */
export const WAGE_INDICES: { [key: number]: Money } = {
  // Data from https://www.ssa.gov/oact/cola/awiseries.html
  1951: Money.from(2799.16),
  1952: Money.from(2973.32),
  1953: Money.from(3139.44),
  1954: Money.from(3155.64),
  1955: Money.from(3301.44),
  1956: Money.from(3532.36),
  1957: Money.from(3641.72),
  1958: Money.from(3673.8),
  1959: Money.from(3855.8),
  1960: Money.from(4007.12),
  1961: Money.from(4086.76),
  1962: Money.from(4291.4),
  1963: Money.from(4396.64),
  1964: Money.from(4576.32),
  1965: Money.from(4658.72),
  1966: Money.from(4938.36),
  1967: Money.from(5213.44),
  1968: Money.from(5571.76),
  1969: Money.from(5893.76),
  1970: Money.from(6186.24),
  1971: Money.from(6497.08),
  1972: Money.from(7133.8),
  1973: Money.from(7580.16),
  1974: Money.from(8030.76),
  1975: Money.from(8630.92),
  1976: Money.from(9226.48),
  1977: Money.from(9779.44),
  1978: Money.from(10556.03),
  1979: Money.from(11479.46),
  1980: Money.from(12513.46),
  1981: Money.from(13773.1),
  1982: Money.from(14531.34),
  1983: Money.from(15239.24),
  1984: Money.from(16135.07),
  1985: Money.from(16822.51),
  1986: Money.from(17321.82),
  1987: Money.from(18426.51),
  1988: Money.from(19334.04),
  1989: Money.from(20099.55),
  1990: Money.from(21027.98),
  1991: Money.from(21811.6),
  1992: Money.from(22935.42),
  1993: Money.from(23132.67),
  1994: Money.from(23753.53),
  1995: Money.from(24705.66),
  1996: Money.from(25913.9),
  1997: Money.from(27426.0),
  1998: Money.from(28861.44),
  1999: Money.from(30469.84),
  2000: Money.from(32154.82),
  2001: Money.from(32921.92),
  2002: Money.from(33252.09),
  2003: Money.from(34064.95),
  2004: Money.from(35648.55),
  2005: Money.from(36952.94),
  2006: Money.from(38651.41),
  2007: Money.from(40405.48),
  2008: Money.from(41334.97),
  2009: Money.from(40711.61),
  2010: Money.from(41673.83),
  2011: Money.from(42979.61),
  2012: Money.from(44321.67),
  2013: Money.from(44888.16),
  2014: Money.from(46481.52),
  2015: Money.from(48098.63),
  2016: Money.from(48642.15),
  2017: Money.from(50321.89),
  2018: Money.from(52145.8),
  2019: Money.from(54099.99),
  2020: Money.from(55628.6),
  2021: Money.from(60575.07),
  2022: Money.from(63795.13),
  2023: Money.from(66621.8),
};
/**
 * The minimum year for which we have wage index data.
 */
export const MIN_WAGE_INDEX_YEAR: number = 1951;

/**
 * The maximum year for which we have wage index data.
 */
export const MAX_WAGE_INDEX_YEAR: number = Math.max(
  ...Object.keys(WAGE_INDICES).map(Number)
);

/**
 * COLA Adjustments percentages per year. Values are in whole percentages,
 * e.g. 1.0 = 1%.
 */
export const COLA: { [key: number]: number } = {
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
  2023: 3.2,
  2024: 2.5,
};

/**
 * The maximum year for which we have COLA data.
 */
export const MAX_COLA_YEAR: number = Math.max(...Object.keys(COLA).map(Number));

/**
 * Number of top years of earnings which contribute to SSA calculations.
 */
export const SSA_EARNINGS_YEARS: number = 35;

/**
 * The current calendar year.
 */
export const CURRENT_YEAR: number = new Date().getFullYear();

/**
 * All months, in order, as 3-letter abbreviations.
 */
export const ALL_MONTHS: string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * All months, in order, as full names.
 */
export const ALL_MONTHS_FULL: string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Full retirement age (FRA) for each year of birth.
 * - `minYear` and `maxYear` are inclusive.
 * - `ageYears` and `ageMonths` are the age at FRA.
 * - `delatedIncreaseAnnual` is the increase amount every year after full
 *   retirement age. This is a percentage of the PIA, e.g. 0.065 = 6.5%.
 */
export const FULL_RETIREMENT_AGE: Array<{
  minYear: number;
  maxYear: number;
  ageYears: number;
  ageMonths: number;
  delayedIncreaseAnnual: number;
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
      delayedIncreaseAnnual: 0.065,
    },
    {
      minYear: 1938,
      maxYear: 1938,
      ageYears: 65,
      ageMonths: 2,
      delayedIncreaseAnnual: 0.065,
    },
    {
      minYear: 1939,
      maxYear: 1939,
      ageYears: 65,
      ageMonths: 4,
      delayedIncreaseAnnual: 0.07,
    },
    {
      minYear: 1940,
      maxYear: 1940,
      ageYears: 65,
      ageMonths: 6,
      delayedIncreaseAnnual: 0.07,
    },
    {
      minYear: 1941,
      maxYear: 1941,
      ageYears: 65,
      ageMonths: 8,
      delayedIncreaseAnnual: 0.075,
    },
    {
      minYear: 1942,
      maxYear: 1942,
      ageYears: 65,
      ageMonths: 10,
      delayedIncreaseAnnual: 0.075,
    },
    {
      minYear: 1943,
      maxYear: 1954,
      ageYears: 66,
      ageMonths: 0,
      delayedIncreaseAnnual: 0.08,
    },
    {
      minYear: 1955,
      maxYear: 1955,
      ageYears: 66,
      ageMonths: 2,
      delayedIncreaseAnnual: 0.08,
    },
    {
      minYear: 1956,
      maxYear: 1956,
      ageYears: 66,
      ageMonths: 4,
      delayedIncreaseAnnual: 0.08,
    },
    {
      minYear: 1957,
      maxYear: 1957,
      ageYears: 66,
      ageMonths: 6,
      delayedIncreaseAnnual: 0.08,
    },
    {
      minYear: 1958,
      maxYear: 1958,
      ageYears: 66,
      ageMonths: 8,
      delayedIncreaseAnnual: 0.08,
    },
    {
      minYear: 1959,
      maxYear: 1959,
      ageYears: 66,
      ageMonths: 10,
      delayedIncreaseAnnual: 0.08,
    },
    {
      minYear: 1960,
      maxYear: 10000,
      ageYears: 67,
      ageMonths: 0,
      delayedIncreaseAnnual: 0.08,
    },
  ];

/**
 * Full retirement age (FRA) for survivor benefits for each year of birth.
 * - `minYear` and `maxYear` are inclusive
 * - `ageYears` and `ageMonths` are the age at FRA.
 * My understanding is that these dates are all just +2 years from the
 * corresponding retirement age.
 */
export const FULL_RETIREMENT_AGE_SURVIVOR: Array<{
  minYear: number;
  maxYear: number;
  ageYears: number;
  ageMonths: number;
}> =
  /* https://www.ssa.gov/pubs/EN-05-10084.pdf
   * https://www.ssa.gov/benefits/survivors/survivorchartred.html
   */
  [
    {
      minYear: 0,
      maxYear: 1939,
      ageYears: 65,
      ageMonths: 0,
    },
    {
      minYear: 1940,
      maxYear: 1940,
      ageYears: 65,
      ageMonths: 2,
    },
    {
      minYear: 1941,
      maxYear: 1941,
      ageYears: 65,
      ageMonths: 4,
    },
    {
      minYear: 1942,
      maxYear: 1942,
      ageYears: 65,
      ageMonths: 6,
    },
    {
      minYear: 1943,
      maxYear: 1943,
      ageYears: 65,
      ageMonths: 8,
    },
    {
      minYear: 1944,
      maxYear: 1944,
      ageYears: 65,
      ageMonths: 10,
    },
    {
      minYear: 1945,
      maxYear: 1956,
      ageYears: 66,
      ageMonths: 0,
    },
    {
      minYear: 1957,
      maxYear: 1957,
      ageYears: 66,
      ageMonths: 2,
    },
    {
      minYear: 1958,
      maxYear: 1958,
      ageYears: 66,
      ageMonths: 4,
    },
    {
      minYear: 1959,
      maxYear: 1959,
      ageYears: 66,
      ageMonths: 6,
    },
    {
      minYear: 1960,
      maxYear: 1960,
      ageYears: 66,
      ageMonths: 8,
    },
    {
      minYear: 1961,
      maxYear: 1961,
      ageYears: 66,
      ageMonths: 10,
    },
    {
      minYear: 1962,
      maxYear: 10000,
      ageYears: 67,
      ageMonths: 0,
    },
  ];
