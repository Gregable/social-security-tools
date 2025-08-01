<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import type { Money } from "$lib/money";
  import { MonthDate, MonthDuration } from "$lib/month-time";
  import { calculateFinalDates as calculateFinalDatesUtil } from "$lib/strategy/ui";
  import { strategySumCents } from "$lib/strategy/calculations/strategy-calc";
  import RecipientName from "$lib/components/RecipientName.svelte";

  // Props
  export let recipients: [Recipient, Recipient];
  export let deathAge1: number;
  export let deathAge2: number;
  export let discountRate: number;
  export let optimalNPV: Money;

  // State
  let alternativeResults = [];
  let filingAgeRange1 = [];
  let filingAgeRange2 = [];
  let isCalculating = false;
  let minNPV = null;
  let maxNPV = null;

  // Calculate current date
  const now = new Date();
  let currentDate;
  $: currentDate = MonthDate.initFromYearsMonths({
    years: now.getFullYear(),
    months: now.getMonth(),
  });

  // Generate filing age ranges (all months from earliest filing age to 70+0, clipped to future dates)
  /**
   * Generates all possible filing age combinations for both recipients.
   * 
   * This function creates monthly filing age ranges from each recipient's 
   * earliest eligible filing month (typically 62+0 or 62+1 based on birth day) 
   * up to exactly age 70+0. The ranges are clipped to exclude any ages in the 
   * past.
   * 
   * @returns {Array<Array<{years: number, months: number}>>} A 2-element array
   * where each element contains an array of age objects with years and
   * months properties.
   *    Index 0 is for recipient 1, index 1 is for recipient 2.
   */
  function generateFilingAgeRanges() {
    const ranges = [[], []];
    
    for (let recipientIndex = 0; recipientIndex < 2; recipientIndex++) {
      const recipient = recipients[recipientIndex];
      const currentAge = recipient.birthdate.ageAtSsaDate(currentDate);
      const currentAgeMonths = currentAge.asMonths();
      
      // Get the earliest filing age for this recipient
      const earliestFiling = recipient.birthdate.earliestFilingMonth();
      const earliestFilingMonths = earliestFiling.asMonths();
      
      // Start from the maximum of earliest filing age or current age
      const startingAgeMonths = Math.max(earliestFilingMonths, currentAgeMonths);
      
      // Generate all monthly combinations from starting age to exactly 70+0
      for (let totalMonths = startingAgeMonths; totalMonths <= 70 * 12; totalMonths++) {
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        
        ranges[recipientIndex].push({ years, months });
      }
    }
    
    return ranges;
  }

  // Generate year headers with month spans
  /**
   * Creates year-based header objects that span across multiple months.
   * 
   * Takes an array of monthly age ranges and groups them by year, calculating
   * how many months each year spans. This is used to create column and row
   * headers that show only the year (e.g., "62", "63") but span across all
   * the months within that year in the grid.
   *
   * @param {Array<{years: number, months: number}>} ageRange - Array of age
   * objects containing years and months properties
   * @returns {Array<{year: number, colspan: number}>} Array of header objects
   * where each object contains the year to display and the number of months it 
   * spans
   */
  function generateYearHeaders(ageRange) {
    const yearHeaders = [];
    let currentYear = null;
    let monthCount = 0;
    
    for (const age of ageRange) {
      if (age.years !== currentYear) {
        if (currentYear !== null && monthCount > 0) {
          yearHeaders.push({
            year: currentYear,
            colspan: monthCount
          });
        }
        currentYear = age.years;
        monthCount = 1;
      } else {
        monthCount++;
      }
    }
    
    // Add the last year
    if (currentYear !== null && monthCount > 0) {
      yearHeaders.push({
        year: currentYear,
        colspan: monthCount
      });
    }
    
    return yearHeaders;
  }

  // Calculate alternative strategies when inputs change
  $: if (recipients && deathAge1 && deathAge2 && discountRate !== undefined && optimalNPV) {
    calculateAlternativeStrategies();
  }

  /**
   * Calculates NPV for all possible filing strategy combinations.
   * 
   * This is the main calculation function that generates a comprehensive matrix
   * of net present values for every possible monthly filing age combination
   * between the two recipients. The calculation respects each recipient's
   * earliest eligible filing age and current age constraints.
   * 
   * The function runs asynchronously with periodic yielding to prevent UI blocking
   * during large calculations (potentially 100x100 = 10,000 combinations).
   * 
   * Updates the component state with:
   * - alternativeResults: 2D array of NPV results and metadata
   * - minNPV/maxNPV: Range values for color coding
   * - isCalculating: Loading state flag
   */
  async function calculateAlternativeStrategies() {
    if (isCalculating) return;
    
    isCalculating = true;
    
    try {
      // Generate age ranges
      [filingAgeRange1, filingAgeRange2] = generateFilingAgeRanges();
      
      // Calculate final dates for the death ages
      const finalDates = calculateFinalDatesUtil(recipients, deathAge1, deathAge2);
      
      // Initialize results matrix
      alternativeResults = Array(filingAgeRange1.length)
        .fill(null)
        .map(() => Array(filingAgeRange2.length).fill(null));
      
      let npvValues: number[] = [];
      
      // Calculate NPV for each filing strategy combination (monthly precision)
      for (let i = 0; i < filingAgeRange1.length; i++) {
        for (let j = 0; j < filingAgeRange2.length; j++) {
          const age1 = filingAgeRange1[i];
          const age2 = filingAgeRange2[j];
          
          // Convert to MonthDuration
          const strategy1 = MonthDuration.initFromYearsMonths({
            years: age1.years,
            months: age1.months
          });
          const strategy2 = MonthDuration.initFromYearsMonths({
            years: age2.years,
            months: age2.months
          });
          
          // Calculate NPV for this strategy
          const npv = strategySumCents(
            recipients,
            finalDates,
            currentDate,
            discountRate,
            [strategy1, strategy2]
          );
          
          // Calculate percentage of optimal
          const percentOfOptimal = (npv / optimalNPV.cents()) * 100;
          
          alternativeResults[i][j] = {
            filingAge1Years: age1.years,
            filingAge1Months: age1.months,
            filingAge2Years: age2.years,
            filingAge2Months: age2.months,
            npv: npv,
            percentOfOptimal
          };
          
          npvValues.push(npv);
        }
        
        // Allow UI to update periodically
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      // Calculate min/max for color coding
      if (npvValues.length > 0) {
        minNPV = Math.min(...npvValues);
        maxNPV = Math.max(...npvValues);
      }
      
    } catch (error) {
      console.error("Error calculating alternative strategies:", error);
    } finally {
      isCalculating = false;
    }
  }

  // Get color for NPV value based on percentage of optimal
  /**
   * Determines the background color for a grid cell based on NPV performance.
   * 
   * Uses a color scale to visually represent how close each filing strategy
   * combination comes to the optimal NPV. Includes special handling for
   * strategies that exactly match the optimal NPV.
   * 
   * Color scale:
   * - Dark green (rgb(0, 100, 0)): Exact optimal match (100%)
   * - Green (rgb(34, 139, 34)): 95-100% of optimal
   * - Yellow-green (rgb(154, 205, 50)): 90-95% of optimal  
   * - Gold (rgb(255, 215, 0)): 85-90% of optimal
   * - Orange (rgb(255, 165, 0)): 80-85% of optimal
   * - Red (rgb(220, 20, 60)): <80% of optimal
   * 
   * @param {number} percentOfOptimal - The NPV as a percentage of the optimal NPV
   * @param {number} npv - The actual NPV value in cents
   * @param {number} optimalNPVCents - The optimal NPV value in cents for exact comparison
   * @returns {string} RGB color string for use in CSS background-color
   */
  function getColor(percentOfOptimal, npv, optimalNPVCents) {
    // Special color for exact 100% match (same NPV as optimal)
    if (npv === optimalNPVCents) return 'rgb(0, 100, 0)'; // Dark green for exact match
    
    // Color scale from red (bad) to green (optimal)
    if (percentOfOptimal >= 95) return 'rgb(34, 139, 34)'; // Green
    if (percentOfOptimal >= 90) return 'rgb(154, 205, 50)'; // Yellow-green
    if (percentOfOptimal >= 85) return 'rgb(255, 215, 0)'; // Gold
    if (percentOfOptimal >= 80) return 'rgb(255, 165, 0)'; // Orange
    return 'rgb(220, 20, 60)'; // Red
  }

  /**
   * Formats a monetary value in cents to a USD currency string.
   * 
   * Converts cents to dollars and formats with proper currency symbols,
   * thousands separators, and no decimal places for cleaner display.
   * 
   * @param {number} cents - The monetary value in cents
   * @returns {string} Formatted currency string (e.g., "$1,234,567")
   */
  function formatCurrency(cents) {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  /**
   * Formats an age for display in year headers (years only).
   * 
   * @param {number} years - The age in years
   * @param {number} months - The additional months (ignored in this format)
   * @returns {string} The age formatted as years only (e.g., "65")
   */
  function formatAge(years, months) {
    return `${years}`;
  }
  
  /**
   * Formats an age for display with full precision (years + months).
   * 
   * Used in tooltips and detailed displays where the exact monthly
   * filing age is important.
   * 
   * @param {number} years - The age in years
   * @param {number} months - The additional months (0-11)
   * @returns {string} The age formatted as "years+months" (e.g., "65+6") 
   *   or just "years" if months is 0
   */
  function formatFullAge(years, months) {
    if (months === 0) {
      return `${years}`;
    } else {
      return `${years}+${months}`;
    }
  }
</script>

<div class="alternative-strategies-container">
  <h3>Alternative Filing Strategies</h3>
  <p>
    This grid shows the net present value for all possible filing age combinations for the selected death ages 
    (<RecipientName r={recipients[0]} />: {deathAge1}, <RecipientName r={recipients[1]} />: {deathAge2}). 
    Values are color-coded relative to the optimal strategy.
  </p>
  
  {#if isCalculating}
    <div class="loading">
      <p>Calculating alternative strategies...</p>
    </div>
  {:else if alternativeResults.length > 0}
    {@const yearHeaders1 = generateYearHeaders(filingAgeRange1)}
    {@const yearHeaders2 = generateYearHeaders(filingAgeRange2)}
    
    <div class="grid-container">
      <div class="grid-wrapper">
        <!-- Year headers (Recipient 2 ages) -->
        <div class="year-header-row">
          <div class="corner-cell">
          </div>
          {#each yearHeaders2 as yearHeader}
            <div 
              class="year-header-cell"
              style="width: {yearHeader.colspan * 8}px"
              title="{recipients[1].name}: Age {yearHeader.year}"
            >
              {yearHeader.year === 70 ? '' : yearHeader.year}
            </div>
          {/each}
        </div>
        
        <!-- Main grid with monthly detail -->
        <div class="main-grid">
          <!-- Row year headers column -->
          <div class="row-year-headers">
            {#each yearHeaders1 as yearHeader1}
              <div 
                class="row-year-header"
                style="height: {yearHeader1.colspan * 8}px"
                title="{recipients[0].name}: Age {yearHeader1.year}"
              >
                <span class="year-text">{yearHeader1.year === 70 ? '' : yearHeader1.year}</span>
              </div>
            {/each}
          </div>
          
          <!-- Data grid -->
          <div class="data-grid">
            {#each filingAgeRange1 as age1, i}
              <div class="grid-row">
                {#each filingAgeRange2 as age2, j}
                  {@const result = alternativeResults[i][j]}
                  <div 
                    class="data-cell"
                    style="background-color: {getColor(result.percentOfOptimal, result.npv, optimalNPV.cents())}"
                    title="Filing ages:
{recipients[0].name}: {formatFullAge(result.filingAge1Years, result.filingAge1Months)}
{recipients[1].name}: {formatFullAge(result.filingAge2Years, result.filingAge2Months)}
NPV: {formatCurrency(result.npv)} ({result.percentOfOptimal.toFixed(1)}% of optimal)"
                  >
                    <!-- Cell content removed for cleaner visual -->
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="legend">
        <h4>Legend</h4>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color" style="background-color: rgb(0, 100, 0)"></div>
            <span>Exact optimal match (100%)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: rgb(34, 139, 34)"></div>
            <span>95-100% of optimal</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: rgb(154, 205, 50)"></div>
            <span>90-95% of optimal</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: rgb(255, 215, 0)"></div>
            <span>85-90% of optimal</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: rgb(255, 165, 0)"></div>
            <span>80-85% of optimal</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: rgb(220, 20, 60)"></div>
            <span>&lt;80% of optimal</span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .alternative-strategies-container {
    margin-top: 2rem;
    padding: 1.5rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
  }

  .alternative-strategies-container h3 {
    color: #0056b3;
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    font-style: italic;
    color: #666;
  }

  .grid-container {
    margin-top: 1rem;
  }

  .grid-wrapper {
    overflow-x: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .year-header-row {
    display: flex;
    background-color: #f0f0f0;
    border-bottom: 2px solid #ccc;
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .year-header-cell {
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    background-color: #f5f5f5;
    font-size: 0.7rem;
    border-right: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    box-sizing: border-box;
  }

  .main-grid {
    display: flex;
  }

  .row-year-headers {
    display: flex;
    flex-direction: column;
    background-color: #f0f0f0;
    border-right: 2px solid #ccc;
    position: sticky;
    left: 0;
    z-index: 1;
  }

  .row-year-header {
    width: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    background-color: #f0f0f0;
    border-bottom: 1px solid #ddd;
    font-size: 0.7rem;
    box-sizing: border-box;
  }

  .year-text {
    transform: rotate(-90deg);
    white-space: nowrap;
  }

  .data-grid {
    display: flex;
    flex-direction: column;
  }

  .grid-row {
    display: flex;
  }

  .corner-cell {
    width: 25px;
    height: 20px;
    background-color: #e0e0e0;
    border-right: 2px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.5rem;
    box-sizing: border-box;
  }

  .data-cell {
    width: 8px;
    height: 8px;
    border-right: 1px solid #ddd;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
  }

  .legend {
    margin-top: 1rem;
  }

  .legend h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .legend-color {
    width: 20px;
    height: 15px;
    border: 1px solid #ccc;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    .alternative-strategies-container {
      padding: 1rem;
    }

    .legend-items {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .corner-cell {
      width: 20px;
      height: 15px;
      font-size: 0.4rem;
      box-sizing: border-box;
    }
    
    .year-header-cell {
      height: 15px;
      font-size: 0.6rem;
      box-sizing: border-box;
    }
    
    .row-year-header {
      width: 20px;
      font-size: 0.6rem;
      box-sizing: border-box;
    }
    
    .data-cell {
      width: 6px;
      height: 6px;
      box-sizing: border-box;
    }
  }
</style>
