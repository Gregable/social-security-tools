// UI utility functions
export {
  formatBirthdate,
  parseBirthdate,
  calculateFinalDates,
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
