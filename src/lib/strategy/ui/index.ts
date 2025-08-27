// UI utility functions
export {
  formatBirthdate,
  parseBirthdate,
  calculateAgeRange,
  getFilingDate,
  getFilingAge,
  createValueExtractor,
  createBorderRemovalFunctions,
} from './formatting.js';

export { getMonthYearColor } from './colors.js';

export {
  calculateAgeRangePercentages,
  formatPercentagesToCssGridTemplate,
  generateDeathAgeRange,
  calculateGridTemplates,
  generateThreeYearBuckets,
} from './grid-sizing.js';

export type { DeathAgeBucket } from './grid-sizing.js';

export {
  CalculationResults,
  CalculationStatus,
} from './calculation-results.js';
export type { StrategyResult } from './calculation-results.js';
