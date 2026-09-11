// UI utility functions

export type {
  CellSelectionDetail,
  StrategyResult,
} from './calculation-results.js';
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
  getNeverFilesLabel,
  NEVER_FILES_DETAIL,
  NEVER_FILES_LABEL,
  parseBirthdate,
} from './formatting.js';
export type { CellPosition, DeathAgeBucket } from './grid-sizing.js';
export {
  calculateAgeRangePercentages,
  calculateGridTemplates,
  formatPercentagesToCssGridTemplate,
  generateDeathAgeRange,
  generateMonthlyBuckets,
  generateOneYearBuckets,
  generateThreeYearBuckets,
} from './grid-sizing.js';
