export interface LifeTableEntry {
  x: number;
  q_x: number;
}

/**
 * Fetches life table data for a specific gender and year from pre-processed JSON files.
 * @param gender The gender ('male' or 'female').
 * @param year The cohort year.
 * @returns A promise that resolves to an array of LifeTableEntry objects, or null if not found.
 */
export async function getLifeTableData(
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
