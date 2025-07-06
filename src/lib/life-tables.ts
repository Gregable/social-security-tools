export interface LifeTableEntry {
  x: number;
  q_x: number;
}

export type GenderOption = "male" | "female" | "blended";

/**
 * Fetches life table data for a specific gender and year from pre-processed JSON files.
 * @param gender The gender ('male', 'female', or 'blended').
 * @param year The cohort year.
 * @returns A promise that resolves to an array of LifeTableEntry objects, or null if not found.
 */
export async function getLifeTableData(
  gender: GenderOption,
  year: number
): Promise<LifeTableEntry[] | null> {
  try {
    if (gender === "blended") {
      // Fetch both male and female data
      const maleDataPromise = fetchLifeTableData("male", year);
      const femaleDataPromise = fetchLifeTableData("female", year);

      const [maleData, femaleData] = await Promise.all([
        maleDataPromise,
        femaleDataPromise,
      ]);

      if (!maleData || !femaleData) return null;

      // Blend the data by averaging probabilities at each age
      return maleData.map((maleEntry, index) => {
        const femaleEntry = femaleData[index];
        return {
          x: maleEntry.x,
          q_x: (maleEntry.q_x + femaleEntry.q_x) / 2,
        };
      });
    } else {
      // For male or female, use direct fetch
      return await fetchLifeTableData(gender, year);
    }
  } catch (error) {
    console.error(
      `Error fetching life table data for ${gender} ${year}:`,
      error
    );
    return null;
  }
}

/**
 * Returns the probability of death at each future age for a person currently alive.
 * @param gender The gender ('male', 'female', or 'blended').
 * @param birthYear The year the person was born.
 * @param currentYear The current year (defaults to current date's year if not provided).
 * @returns A promise that resolves to an array of objects containing age and probability of death at that age.
 */
export async function getDeathProbabilityDistribution(
  gender: GenderOption,
  birthYear: number,
  currentYear: number = new Date().getFullYear()
): Promise<{ age: number; probability: number }[] | null> {
  // Calculate current age
  const currentAge = currentYear - birthYear;

  // Get the life table data
  const lifeTableData = await getLifeTableData(gender, birthYear);

  if (!lifeTableData) return null;

  // Filter to only include entries from current age through 119
  const relevantData = lifeTableData.filter((entry) => entry.x >= currentAge);

  // Calculate the probability of death at each age
  const deathProbabilities: { age: number; probability: number }[] = [];

  // Survival probability starts at 1.0 (person is alive now)
  let survivalProbability = 1.0;

  // Calculate for each age from current age to 119
  for (const entry of relevantData) {
    // Probability of death at this age = probability of surviving to this age × probability of dying during this year
    const deathProbability = survivalProbability * entry.q_x;

    deathProbabilities.push({
      age: entry.x,
      probability: deathProbability,
    });

    // Update survival probability for next age
    survivalProbability *= 1 - entry.q_x;
  }

  // Add age 120 with the remaining probability (ensure total probability sums to 1.0)
  if (survivalProbability > 0) {
    deathProbabilities.push({
      age: 120,
      probability: survivalProbability,
    });
  }

  return deathProbabilities;
}

/**
 * Helper function to fetch data directly for a specific gender.
 * @param gender The gender ('male' or 'female').
 * @param year The cohort year.
 * @returns A promise that resolves to an array of LifeTableEntry objects, or null if not found.
 */
async function fetchLifeTableData(
  gender: "male" | "female",
  year: number
): Promise<LifeTableEntry[] | null> {
  try {
    const filePath = `/data/processed/${gender}_${year}.json`;
    const response = await fetch(filePath);

    if (!response.ok) {
      console.error(
        `Failed to fetch life table data for ${gender} ${year}: ${response.statusText}`
      );
      return null;
    }

    const data: LifeTableEntry[] = await response.json();
    return data;
  } catch (error) {
    console.error(
      `Error fetching life table data for ${gender} ${year}:`,
      error
    );
    return null;
  }
}
