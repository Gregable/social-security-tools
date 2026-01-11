// UI utility functions

export {
  CalculationResults,
  CalculationStatus,
} from "./calculation-results.js";
export type { StrategyResult } from "./calculation-results.js";
export { getMonthYearColor } from "./colors.js";
export {
  calculateAgeRange,
  createBorderRemovalFunctions,
  createValueExtractor,
  formatBirthdate,
  getFilingAge,
  getFilingDate,
  parseBirthdate,
} from "./formatting.js";
export {
  calculateAgeRangePercentages,
  calculateGridTemplates,
  formatPercentagesToCssGridTemplate,
  generateDeathAgeRange,
  generateMonthlyBuckets,
  generateOneYearBuckets,
  generateThreeYearBuckets,
} from "./grid-sizing.js";
export type { DeathAgeBucket } from "./grid-sizing.js";
