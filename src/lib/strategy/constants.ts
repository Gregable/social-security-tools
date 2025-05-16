import { MonthDuration } from "$lib/month-time";

// Age range to generate strategies for:
export const MIN_AGE = 62;
export const MAX_AGE = 110;

// Minimum / Maximum age that a person could file at.
export const MIN_STRATEGY_AGE = MonthDuration.initFromYearsMonths({
  years: 62,
  months: 0,
});
export const MAX_STRATEGY_AGE = MonthDuration.initFromYearsMonths({
  years: 70,
  months: 0,
});
export const MONTHS_IN_YEAR = 12;
