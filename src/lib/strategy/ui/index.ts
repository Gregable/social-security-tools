// UI utility functions

export type { StrategyResult } from './calculation-results.js';
export {
  CalculationResults,
  CalculationStatus,
} from './calculation-results.js';
export { getMonthYearColor } from './colors.js';
export {
  calculateAgeRange,
  createBorderRemovalFunctions,
  createValueExtractor,
  formatBirthdate,
  getFilingAge,
  getFilingDate,
  parseBirthdate,
} from './formatting.js';
export type { DeathAgeBucket } from './grid-sizing.js';
export {
  calculateAgeRangePercentages,
  calculateGridTemplates,
  formatPercentagesToCssGridTemplate,
  generateDeathAgeRange,
  generateThreeYearBuckets,
} from './grid-sizing.js';
