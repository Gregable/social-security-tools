/**
 * Interface for Treasury yield data
 */
interface TreasuryYieldData {
  date: string;
  rate: number;
  success: boolean;
  error?: string;
}

/**
 * Formats a date as YYYYMM for use in the Treasury API URL
 * @param date - The date to format
 * @returns Formatted date string (YYYYMM)
 */
function formatDateForTreasuryAPI(date: Date, monthOffset: number = 0): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + monthOffset);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // Month is 0-indexed in JavaScript
  return `${year}${month.toString().padStart(2, "0")}`;
}

/**
 * Fetches the latest 20-year Treasury yield from the Treasury Department API
 * @returns Promise resolving to the yield rate as a decimal (e.g., 0.025 for 2.5%)
 */
export async function fetchLatest20YearTreasuryYield(): Promise<TreasuryYieldData> {
  try {
    const currentDate = new Date();
    let formattedDate = formatDateForTreasuryAPI(currentDate);
    let url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_real_yield_curve&field_tdr_date_value_month=${formattedDate}`;

    let response = await fetch(url);
    let xmlText = await response.text();
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(xmlText, "text/xml");
    let entries = xmlDoc.getElementsByTagName("entry");

    // If no data for current month, try previous month
    if (entries.length === 0) {
      console.warn(
        "No Treasury data for current month, trying previous month."
      );
      formattedDate = formatDateForTreasuryAPI(currentDate, -1); // Get previous month
      url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_real_yield_curve&field_tdr_date_value_month=${formattedDate}`;
      response = await fetch(url);
      xmlText = await response.text();
      xmlDoc = parser.parseFromString(xmlText, "text/xml");
      entries = xmlDoc.getElementsByTagName("entry");
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Treasury data: ${response.status} ${response.statusText}`
      );
    }

    if (entries.length === 0) {
      throw new Error(
        "No Treasury yield data found for current or previous month."
      );
    }

    let latestDate: string | null = null;
    let latestYield: number | null = null;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const properties = entry.getElementsByTagName("m:properties");

      if (properties.length > 0) {
        const dateElement = properties[0].getElementsByTagName("d:NEW_DATE");
        const yieldElement = properties[0].getElementsByTagName("d:TC_20YEAR");

        if (
          dateElement.length > 0 &&
          dateElement[0].textContent &&
          yieldElement.length > 0 &&
          yieldElement[0].textContent
        ) {
          const currentDateStr = dateElement[0].textContent;
          const currentYieldVal = parseFloat(yieldElement[0].textContent);

          // Compare dates to find the latest one
          if (!latestDate || currentDateStr > latestDate) {
            latestDate = currentDateStr;
            latestYield = currentYieldVal;
          }
        }
      }
    }

    if (latestDate && latestYield !== null) {
      const yieldDecimal = latestYield / 100;
      return {
        date: latestDate,
        rate: yieldDecimal,
        success: true,
      };
    } else {
      throw new Error("20-year Treasury yield data not found in the response");
    }
  } catch (error) {
    console.error("Error fetching Treasury yield data:", error);
    return {
      date: new Date().toISOString().split("T")[0],
      rate: 0.025, // Default to 2.5% if there's an error
      success: false,
      error: error.message,
    };
  }
}

/**
 * Fetches the latest 20-year inflation-adjusted Treasury yield from FRED (Federal Reserve Economic Data).
 * @returns Promise resolving to the yield rate as a decimal (e.g., 0.025 for 2.5%)
 */
export async function fetchFredDFII20Yield(): Promise<TreasuryYieldData> {
  try {
    const fredResponse = await fetch(
      "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFII20"
    );

    if (!fredResponse.ok) {
      throw new Error(
        `Failed to fetch FRED data: ${fredResponse.status} ${fredResponse.statusText}`
      );
    }

    const csvText = await fredResponse.text();
    const lines = csvText.trim().split("\n");

    // Iterate backward from the end to find the most recent valid data point
    for (let i = lines.length - 1; i >= 1; i--) {
      // Skip header line (index 0)
      const line = lines[i];
      const [date, rateStr] = line.split(",");
      const rate = parseFloat(rateStr);

      if (!isNaN(rate) && rateStr.trim() !== "") {
        // Found a valid rate
        return {
          date: date,
          rate: rate / 100,
          success: true,
        };
      }
    }
    throw new Error("FRED DFII20 data not found or is invalid in the response");
  } catch (error) {
    console.error("Error fetching FRED DFII20 data:", error);
    return {
      date: new Date().toISOString().split("T")[0],
      rate: 0.025, // Default to 2.5% if there's an error
      success: false,
      error: error.message,
    };
  }
}

/**
 * Gets the current recommended discount rate based on Treasury yields
 * Falls back to FRED data, then to a default value of 2.5% if unable to fetch the data.
 * @returns Promise resolving to the recommended discount rate as a decimal
 */
export async function getRecommendedDiscountRate(): Promise<number> {
  try {
    // First try to fetch the latest data from Treasury
    const treasuryData = await fetchLatest20YearTreasuryYield();

    if (treasuryData.success) {
      return treasuryData.rate;
    } else {
      console.warn(
        "Using fallback due to Treasury data error:",
        treasuryData.error
      );

      // If Treasury data fails, try FRED data
      const fredData = await fetchFredDFII20Yield();
      if (fredData.success) {
        return fredData.rate;
      } else {
        console.warn(
          "Using default discount rate due to FRED data error:",
          fredData.error
        );
        return 0.025; // Default to 2.5% if all attempts fail
      }
    }
  } catch (error) {
    console.error("Error getting recommended discount rate:", error);
    return 0.025; // Default to 2.5% if there's an error
  }
}
