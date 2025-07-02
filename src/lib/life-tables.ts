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
