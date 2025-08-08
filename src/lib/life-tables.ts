export interface LifeTableEntry {
  age: number; // Renamed from 'x' for clarity
  mortalityRate: number; // Renamed from 'q_x' for clarity
}

export type GenderOption = 'male' | 'female' | 'blended';

export interface DeathProbability {
  age: number;
  probability: number;
}

// Configuration constants
const CONFIG = {
  DATA_PATH_PREFIX: '/data/processed',
  MAX_AGE: 120,
  MIN_BIRTH_YEAR: 1900, // Reasonable bounds
  MAX_BIRTH_YEAR: 2100,
} as const;

// Custom error types
export class LifeTableError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'LifeTableError';
  }
}

export class DataNotFoundError extends LifeTableError {
  constructor(gender: GenderOption, year: number) {
    super(`Life table data not found for ${gender} ${year}`);
    this.name = 'DataNotFoundError';
  }
}

// Input validation utilities
function validateGender(gender: GenderOption): void {
  if (!['male', 'female', 'blended'].includes(gender)) {
    throw new LifeTableError(`Invalid gender: ${gender}`);
  }
}

function validateBirthYear(year: number): void {
  if (
    !Number.isInteger(year) ||
    year < CONFIG.MIN_BIRTH_YEAR ||
    year > CONFIG.MAX_BIRTH_YEAR
  ) {
    throw new LifeTableError(
      `Invalid birth year: ${year}. Must be between ${CONFIG.MIN_BIRTH_YEAR} and ${CONFIG.MAX_BIRTH_YEAR}`
    );
  }
}

function validateCurrentAge(age: number): void {
  if (!Number.isInteger(age) || age < 0 || age > CONFIG.MAX_AGE) {
    throw new LifeTableError(
      `Invalid current age: ${age}. Must be between 0 and ${CONFIG.MAX_AGE}`
    );
  }
}

/**
 * Fetches raw life table data for a specific gender and birth year.
 * This is a low-level function that should typically not be called directly.
 */
async function fetchRawLifeTableData(
  gender: Exclude<GenderOption, 'blended'>,
  year: number
): Promise<LifeTableEntry[]> {
  validateGender(gender);
  validateBirthYear(year);

  const filePath = `${CONFIG.DATA_PATH_PREFIX}/${gender}_${year}.json`;

  try {
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new DataNotFoundError(gender, year);
    }

    const rawData: { x: number; q_x: number }[] = await response.json();

    // Transform data to use clearer property names
    return rawData.map((entry) => ({
      age: entry.x,
      mortalityRate: entry.q_x,
    }));
  } catch (error) {
    if (error instanceof LifeTableError) {
      throw error;
    }
    throw new LifeTableError(
      `Failed to fetch life table data for ${gender} ${year}`,
      error
    );
  }
}

/**
 * Gets life table data for any gender, including blended data.
 * Blended data is calculated by averaging male and female mortality rates.
 * @param gender The gender ('male', 'female', or 'blended').
 * @param year The cohort year.
 * @returns A promise that resolves to an array of LifeTableEntry objects.
 */
export async function getLifeTableData(
  gender: GenderOption,
  year: number
): Promise<LifeTableEntry[]> {
  validateGender(gender);
  validateBirthYear(year);

  if (gender === 'blended') {
    const [maleData, femaleData] = await Promise.all([
      fetchRawLifeTableData('male', year),
      fetchRawLifeTableData('female', year),
    ]);

    // Ensure both datasets have the same length and age progression
    if (maleData.length !== femaleData.length) {
      throw new LifeTableError(
        'Male and female life table data have different lengths'
      );
    }

    return maleData.map((maleEntry, index) => {
      const femaleEntry = femaleData[index];

      if (maleEntry.age !== femaleEntry.age) {
        throw new LifeTableError(
          `Age mismatch at index ${index}: male=${maleEntry.age}, female=${femaleEntry.age}`
        );
      }

      return {
        age: maleEntry.age,
        mortalityRate:
          (maleEntry.mortalityRate + femaleEntry.mortalityRate) / 2,
      };
    });
  }

  return fetchRawLifeTableData(gender, year);
}

/**
 * Returns the probability of death at each future age for a person currently
 * alive.
 * @param gender The gender ('male', 'female', or 'blended').
 * @param birthYear The year the person was born.
 * @param currentYear The current year (defaults to current date's year if not
 * provided).
 * @returns A promise that resolves to an array of objects containing age and
 * probability of death at that age.
 */
export async function getDeathProbabilityDistribution(
  gender: GenderOption,
  birthYear: number,
  currentYear: number = new Date().getFullYear(),
  healthMultiplier: number = 1.0
): Promise<{ age: number; probability: number }[]> {
  validateGender(gender);
  validateBirthYear(birthYear);

  // Calculate current age
  const currentAge = currentYear - birthYear;
  validateCurrentAge(currentAge);

  // Get the life table data
  const lifeTableDataRaw = await getLifeTableData(gender, birthYear);

  // Apply health multiplier safely to mortality rates
  const multiplier = Number.isFinite(healthMultiplier)
    ? Math.max(0, healthMultiplier)
    : 1.0;
  const MAX_Q = 0.999; // Prevent 100% mortality within a year for stability
  const lifeTableData = lifeTableDataRaw.map((entry) => ({
    age: entry.age,
    mortalityRate: Math.min(MAX_Q, entry.mortalityRate * multiplier),
  }));

  // Filter to only include entries from current age through 119
  const relevantData = lifeTableData.filter((entry) => entry.age >= currentAge);

  if (relevantData.length === 0) {
    throw new LifeTableError(
      `No life table data available for current age ${currentAge}`
    );
  }

  return calculateDeathProbabilities(relevantData);
}

/**
 * Pure function to calculate death probabilities from life table data.
 * Separated for easier testing and reusability.
 */
function calculateDeathProbabilities(
  lifeTableData: LifeTableEntry[]
): DeathProbability[] {
  const deathProbabilities: DeathProbability[] = [];
  let survivalProbability = 1.0;

  for (const entry of lifeTableData) {
    // Probability of death at this age = P(survive to this age) × P(die during this year)
    const deathProbability = survivalProbability * entry.mortalityRate;

    deathProbabilities.push({
      age: entry.age,
      probability: deathProbability,
    });

    // Update survival probability for next iteration
    survivalProbability *= 1 - entry.mortalityRate;
  }

  // Ensure any remaining probability goes to max age
  if (survivalProbability > 0) {
    deathProbabilities.push({
      age: CONFIG.MAX_AGE,
      probability: survivalProbability,
    });
  }

  return deathProbabilities;
}

/**
 * Utility function to get the current age of a person.
 */
export function getCurrentAge(
  birthYear: number,
  currentYear: number = new Date().getFullYear()
): number {
  validateBirthYear(birthYear);
  const age = currentYear - birthYear;
  validateCurrentAge(age);
  return age;
}

/**
 * Utility function to validate if life table data is available for a given year and gender.
 */
export async function isLifeTableDataAvailable(
  gender: GenderOption,
  year: number
): Promise<boolean> {
  try {
    await getLifeTableData(gender, year);
    return true;
  } catch (error) {
    if (error instanceof DataNotFoundError) {
      return false;
    }
    throw error; // Re-throw other errors
  }
}
