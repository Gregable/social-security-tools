import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import { strategySumCentsSingle } from './strategy-calc';

export interface AlternativeResult {
  filingAge: MonthDuration;
  npv: Money;
  percentOfOptimal: number;
  isOptimal: boolean;
  isPlaceholder?: boolean;
  placeholderReason?: string;
}

export interface YearGroup {
  year: number;
  results: AlternativeResult[];
}

/**
 * Returns the color for a strategy box based on how close it is to optimal.
 */
export function getStrategyColor(
  percentOfOptimal: number,
  isOptimal: boolean
): string {
  if (isOptimal) return 'rgb(0, 100, 0)'; // Dark green for optimal
  if (percentOfOptimal >= 99) return 'rgb(34, 139, 34)'; // Forest green (very close)
  if (percentOfOptimal >= 95) return 'rgb(100, 170, 50)'; // Lime green
  if (percentOfOptimal >= 90) return 'rgb(190, 210, 50)'; // Yellow-green (more yellow)
  if (percentOfOptimal >= 85) return 'rgb(255, 215, 0)'; // Gold
  if (percentOfOptimal >= 80) return 'rgb(255, 165, 0)'; // Orange
  return 'rgb(220, 20, 60)'; // Red
}

/**
 * Formats a filing age for display.
 * @param filingAge The filing age as a MonthDuration
 * @param displayAsAges If true, shows as "62y 3m", otherwise shows as date
 * @param birthdate The recipient's birthdate (required when displayAsAges is false)
 */
export function formatFilingAgeDisplay(
  filingAge: MonthDuration,
  displayAsAges: boolean,
  birthdate?: { dateAtSsaAge: (age: MonthDuration) => MonthDate }
): string {
  if (displayAsAges) {
    const years = filingAge.years();
    const months = filingAge.modMonths();
    if (months === 0) {
      return `${years}y`;
    }
    return `${years}y${months}m`;
  } else {
    if (!birthdate) {
      throw new Error('birthdate required when displayAsAges is false');
    }
    const date = birthdate.dateAtSsaAge(filingAge);
    const d = new Date(date.year(), date.monthIndex());
    return d.toLocaleString('default', { month: 'short', year: '2-digit' });
  }
}

/**
 * Calculates alternative filing strategies grouped by year.
 */
export function calculateAlternativeStrategies(
  recipient: Recipient,
  deathAge: MonthDuration,
  discountRate: number,
  optimalNPV: Money,
  optimalFilingAge: MonthDuration,
  currentDate?: MonthDate
): YearGroup[] {
  const now = currentDate
    ? currentDate
    : MonthDate.initFromYearsMonths({
        years: new Date().getFullYear(),
        months: new Date().getMonth(),
      });

  const finalDate = recipient.birthdate.dateAtLayAge(deathAge);
  const results: AlternativeResult[] = [];

  // Calculate the recipient's current age in months
  const currentAgeMonths = recipient.birthdate.ageAtSsaDate(now).asMonths();

  // Generate all monthly filing ages from earliest eligible to 70
  const earliestFilingMonths = recipient.birthdate
    .earliestFilingMonth()
    .asMonths();
  const latestFilingMonths = 70 * 12; // Age 70

  for (
    let months = earliestFilingMonths;
    months <= latestFilingMonths;
    months++
  ) {
    const filingAge = new MonthDuration(months);

    // Skip if filing age is after death
    if (filingAge.greaterThan(deathAge)) continue;

    // Check if this filing age is in the past
    if (filingAge.asMonths() < currentAgeMonths) {
      results.push({
        filingAge,
        npv: Money.fromCents(0),
        percentOfOptimal: 0,
        isOptimal: false,
        isPlaceholder: true,
        placeholderReason: 'Already passed',
      });
      continue;
    }

    const npvCents = strategySumCentsSingle(
      recipient,
      finalDate,
      now,
      discountRate,
      filingAge
    );
    const npv = Money.fromCents(npvCents);
    const percentOfOptimal =
      optimalNPV.cents() > 0 ? (npvCents / optimalNPV.cents()) * 100 : 0;

    results.push({
      filingAge,
      npv,
      percentOfOptimal,
      isOptimal: filingAge.asMonths() === optimalFilingAge.asMonths(),
    });
  }

  // Group results by year
  const groups = new Map<number, AlternativeResult[]>();
  for (const result of results) {
    const year = result.filingAge.years();
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year)!.push(result);
  }

  // Convert to array sorted by year
  const yearGroups = Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, yearResults]) => ({ year, results: yearResults }));

  // Add placeholders for unavailable months at the start of the first year
  if (yearGroups.length > 0) {
    const firstGroup = yearGroups[0];
    const firstResult = firstGroup.results[0];
    const firstMonth = firstResult.filingAge.modMonths();

    if (firstMonth > 0) {
      const placeholders: AlternativeResult[] = [];
      for (let m = 0; m < firstMonth; m++) {
        placeholders.push({
          filingAge: new MonthDuration(firstGroup.year * 12 + m),
          npv: Money.fromCents(0),
          percentOfOptimal: 0,
          isOptimal: false,
          isPlaceholder: true,
          placeholderReason: 'Not yet eligible',
        });
      }
      firstGroup.results = [...placeholders, ...firstGroup.results];
    }
  }

  return yearGroups;
}
