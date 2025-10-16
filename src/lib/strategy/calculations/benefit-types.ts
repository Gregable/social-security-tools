import type { Money } from '$lib/money';
import type { MonthDate } from '$lib/month-time';

/**
 * Enum representing the different types of benefits.
 */
export enum BenefitType {
  Personal = 'Personal',
  Spousal = 'Spousal',
  Survivor = 'Survivor',
}

/**
 * Represents a period of benefits for a recipient.
 */
export class BenefitPeriod {
  // startDate and endDate are inclusive on both sides:
  public startDate: MonthDate;
  public endDate: MonthDate;
  public amount: Money;
  // Index of the recipient (0 or 1) who receives this benefit
  public recipientIndex: number;
  // Type of benefit (Personal, Spousal, or Survivor)
  public benefitType: BenefitType;
} // class BenefitPeriod
