import { Birthdate } from '$lib/birthday';
import { MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';

/**
 * Convert date string to formatted birthdate
 */
export function formatBirthdate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const birthdate = Birthdate.FromYMD(year, month - 1, day);
    return birthdate.layBirthdateString();
  } catch {
    console.warn('Invalid date format:', dateString);
    return 'Invalid Date';
  }
}

/**
 * Parse date string and return Birthdate object
 */
export function parseBirthdate(dateString: string): Birthdate {
  const [year, month, day] = dateString.split('-').map(Number);
  return Birthdate.FromYMD(year, month - 1, day); // Month is 0-indexed
}

/**
 * Calculate final dates from death ages
 */
export function calculateFinalDates(
  recipients: [Recipient, Recipient],
  deathAge1: number,
  deathAge2: number
): [MonthDate, MonthDate] {
  const finalDates: [MonthDate, MonthDate] = [
    recipients[0].birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: deathAge1, months: 0 })
    ),
    recipients[1].birthdate.dateAtLayAge(
      MonthDuration.initFromYearsMonths({ years: deathAge2, months: 0 })
    ),
  ];

  // Adjust the final dates to be the last month of the year
  for (let i = 0; i < 2; ++i) {
    finalDates[i] = finalDates[i].addDuration(
      new MonthDuration(11 - finalDates[i].monthIndex())
    );
  }

  return finalDates;
}

/**
 * Calculate age range for death ages
 */
export function calculateAgeRange(
  MIN_DEATH_AGE: number,
  MAX_DEATH_AGE: number,
  birthdateInput: string
): number[] {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Calculate current ages for both recipients
  const currentAge = currentYear - new Date(birthdateInput).getFullYear();

  // Start at the later of age 62 or current age
  const startAge = Math.max(MIN_DEATH_AGE, currentAge);

  const ages = [];
  for (let age = startAge; age <= MAX_DEATH_AGE; age += 2) {
    ages.push(age);
  }
  return ages;
}

/**
 * Converts filing age to filing date for a recipient
 * @param recipients The recipients array
 * @param recipientIndex The recipient index (0 or 1)
 * @param filingAgeYears Years component of filing age
 * @param filingAgeMonths Months component of filing age
 * @param cellWidth The computed width of the cell in pixels
 * @param cellHeight The computed height of the cell in pixels
 */
export function getFilingDate(
  recipients: [Recipient, Recipient],
  recipientIndex: number,
  filingAgeYears: number,
  filingAgeMonths: number,
  cellWidth: number = 0,
  _cellHeight: number = 0
): string {
  const birthdate = recipients[recipientIndex].birthdate;
  const filingAge = MonthDuration.initFromYearsMonths({
    years: filingAgeYears,
    months: filingAgeMonths,
  });
  const filingDate = birthdate.dateAtLayAge(filingAge);

  // Use different formats based on cell dimensions
  if (cellWidth < 35) {
    // Very small cell - only show the year.
    return `'${filingDate.twoDigitYear()}`;
  } else if (cellWidth < 50) {
    // Very small cell - use MM/YY format
    return `${(filingDate.monthIndex() + 1).toString().padStart(2, '0')}/${filingDate.twoDigitYear()}`;
  } else if (cellWidth < 80) {
    // Medium cell - use MMM YY format
    return `${filingDate.monthName()} '${filingDate.twoDigitYear()}`;
  } else {
    // Large cell - use full MMM YYYY format
    return `${filingDate.monthName()} ${filingDate.year()}`;
  }
}

/**
 * Creates a function to extract filing date value for a specific recipient
 * @param recipients The recipients array
 * @param recipientIndex The recipient index (1 or 2)
 */
export function createValueExtractor(
  recipients: [Recipient, Recipient],
  recipientIndex: number
) {
  return (calculationResult: any): string => {
    if (!calculationResult || calculationResult.error) return 'error';
    // Convert to 0-based index for internal functions
    const zeroBasedIndex = recipientIndex - 1;
    return getFilingDate(
      recipients,
      zeroBasedIndex,
      calculationResult[`filingAge${recipientIndex}Years`],
      calculationResult[`filingAge${recipientIndex}Months`]
    );
  };
}

/**
 * Factory function to create border removal functions
 * @param valueExtractor Function that extracts the value to compare
 * @returns Object with functions for each border direction
 */
export function createBorderRemovalFunctions(
  valueExtractor: (result: any) => string,
  calculationResults: any[][]
) {
  return {
    right: (i: number, j: number): boolean => {
      if (j >= calculationResults[0].length - 1) return false;
      if (
        !calculationResults[i] ||
        !calculationResults[i][j] ||
        !calculationResults[i][j + 1]
      )
        return false;
      return (
        valueExtractor(calculationResults[i][j]) ===
        valueExtractor(calculationResults[i][j + 1])
      );
    },

    bottom: (i: number, j: number): boolean => {
      if (i >= calculationResults.length - 1) return false;
      if (
        !calculationResults[i] ||
        !calculationResults[i + 1] ||
        !calculationResults[i][j] ||
        !calculationResults[i + 1][j]
      )
        return false;
      return (
        valueExtractor(calculationResults[i][j]) ===
        valueExtractor(calculationResults[i + 1][j])
      );
    },

    left: (i: number, j: number): boolean => {
      if (j <= 0) return false;
      if (
        !calculationResults[i] ||
        !calculationResults[i][j] ||
        !calculationResults[i][j - 1]
      )
        return false;
      return (
        valueExtractor(calculationResults[i][j]) ===
        valueExtractor(calculationResults[i][j - 1])
      );
    },

    top: (i: number, j: number): boolean => {
      if (i <= 0) return false;
      if (
        !calculationResults[i] ||
        !calculationResults[i - 1] ||
        !calculationResults[i][j] ||
        !calculationResults[i - 1][j]
      )
        return false;
      return (
        valueExtractor(calculationResults[i][j]) ===
        valueExtractor(calculationResults[i - 1][j])
      );
    },
  };
}
