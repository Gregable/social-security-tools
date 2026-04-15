// Core strategy calculation functions

export { BenefitPeriod, BenefitType } from './benefit-period.js';
export {
  classifyEarnerDependent,
  type EarnerDependentClassification,
} from './earner-dependent.js';
export {
  type CoupleFilingAgeResult,
  expectedNPVCouple,
  expectedNPVSingle,
  type FilingAgeResult,
} from './expected-npv.js';

export {
  PersonalBenefitPeriods,
  sumBenefitPeriods,
} from './recipient-personal-benefits.js';
export {
  calculateMonthlyDiscountRate,
  earliestFiling,
  optimalStrategyCouple,
  optimalStrategySingle,
  strategySumCentsCouple,
  strategySumCentsSingle,
  strategySumPeriodsCouple,
  strategySumPeriodsSingle,
  strategySumTotalPeriodsCouple,
  strategySumTotalPeriodsSingle,
} from './strategy-calc.js';
