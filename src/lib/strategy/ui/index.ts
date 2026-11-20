// UI utility functions

export type {
  CellSelectionDetail,
  StrategyResult,
  WidowedPlan,
  WidowedStrategyResult,
} from './calculation-results.js';
export {
  CalculationResults,
  CalculationStatus,
  isWidowedResult,
} from './calculation-results.js';
export { getMonthYearColor } from './colors.js';
export {
  calculateAgeRange,
  createBorderRemovalFunctions,
  createValueExtractor,
  formatBirthdate,
  getFilingAge,
  getFilingDate,
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
export type { StrategyMode, StrategyModeLabel } from './strategy-mode.js';
export { STRATEGY_MODE_LABELS, STRATEGY_MODES } from './strategy-mode.js';
