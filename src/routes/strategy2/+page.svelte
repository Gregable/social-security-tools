<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts">
  import { Birthdate } from "$lib/birthday";
  import { Recipient } from "$lib/recipient";
  import { Money } from "$lib/money";
  import { MonthDate, MonthDuration } from "$lib/month-time";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { optimalStrategy } from "$lib/strategy/strategy-calc";

  // Constants
  const DEFAULT_BIRTHDATE = "1960-03-15";
  const DEFAULT_PIA_VALUES: [number, number] = [1000, 300];
  const DEFAULT_NAMES: [string, string] = ["Alex", "Chris"];
  const MIN_DEATH_AGE = 62;
  const MAX_DEATH_AGE = 90;
  // Number of different starting age pairs
  const CALCULATIONS_PER_SCENARIO = Math.pow((70 - 62) * 12 - 1, 2);

  // Calculation state
  let startTime: number;
  let timeElapsed: number = 0;
  let isCalculationComplete = false;
  let isCalculationRunning = false;
  let calculationResults: any[][] = [];
  let deathAgeRange: number[] = [];
  let calculationProgress = 0;
  let totalCalculations = 0;

  // Form inputs
  let birthdateInputs: [string, string] = [
    DEFAULT_BIRTHDATE,
    DEFAULT_BIRTHDATE,
  ];
  let piaValues: [number, number] = [...DEFAULT_PIA_VALUES];

  // Recipients setup
  let recipients: [Recipient, Recipient] = initializeRecipients();

  /**
   * Initialize recipients with default values
   */
  function initializeRecipients(): [Recipient, Recipient] {
    const recipient1 = new Recipient();
    const recipient2 = new Recipient();

    recipient1.markFirst();
    recipient2.markSecond();
    recipient1.name = DEFAULT_NAMES[0];
    recipient2.name = DEFAULT_NAMES[1];

    return [recipient1, recipient2];
  }

  /**
   * Convert date string to formatted birthdate
   */
  function formatBirthdate(dateString: string): string {
    try {
      const [year, month, day] = dateString.split("-").map(Number);
      const birthdate = Birthdate.FromYMD(year, month - 1, day);
      return birthdate.layBirthdateString();
    } catch (error) {
      console.warn("Invalid date format:", dateString);
      return "Invalid Date";
    }
  }

  /**
   * Parse date string and return Birthdate object
   */
  function parseBirthdate(dateString: string): Birthdate {
    const [year, month, day] = dateString.split("-").map(Number);
    return Birthdate.FromYMD(year, month - 1, day); // Month is 0-indexed
  }

  /**
   * Calculate final dates from death ages
   */
  function calculateFinalDates(
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
  function calculateAgeRange(): number[] {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Calculate current ages for both recipients
    const currentAge1 =
      currentYear - new Date(birthdateInputs[0]).getFullYear();
    const currentAge2 =
      currentYear - new Date(birthdateInputs[1]).getFullYear();

    // Start at the later of age 62 or current age
    const startAge = Math.max(
      MIN_DEATH_AGE,
      Math.max(currentAge1, currentAge2)
    );

    const ages = [];
    for (let age = startAge; age <= MAX_DEATH_AGE; age++) {
      ages.push(age);
    }
    return ages;
  }

  /**
   * Get cell value for comparison (combination of both filing ages)
   */
  function getCellValue(result: any): string {
    if (!result || result.error) return "error";
    return `${result.filingAge1Years}y${result.filingAge1Months}m-${result.filingAge2Years}y${result.filingAge2Months}m`;
  }

  /**
   * Check if cell should have right border removed (same as right neighbor)
   */
  function shouldRemoveRightBorder(i: number, j: number): boolean {
    if (j >= deathAgeRange.length - 1) return false;
    if (
      !calculationResults[i] ||
      !calculationResults[i][j] ||
      !calculationResults[i][j + 1]
    )
      return false;
    return (
      getCellValue(calculationResults[i][j]) ===
      getCellValue(calculationResults[i][j + 1])
    );
  }

  /**
   * Check if cell should have bottom border removed (same as bottom neighbor)
   */
  function shouldRemoveBottomBorder(i: number, j: number): boolean {
    if (i >= deathAgeRange.length - 1) return false;
    if (
      !calculationResults[i] ||
      !calculationResults[i + 1] ||
      !calculationResults[i][j] ||
      !calculationResults[i + 1][j]
    )
      return false;
    return (
      getCellValue(calculationResults[i][j]) ===
      getCellValue(calculationResults[i + 1][j])
    );
  }

  /**
   * Check if cell should have left border removed (same as left neighbor)
   */
  function shouldRemoveLeftBorder(i: number, j: number): boolean {
    if (j <= 0) return false;
    if (
      !calculationResults[i] ||
      !calculationResults[i][j] ||
      !calculationResults[i][j - 1]
    )
      return false;
    return (
      getCellValue(calculationResults[i][j]) ===
      getCellValue(calculationResults[i][j - 1])
    );
  }

  /**
   * Check if cell should have top border removed (same as top neighbor)
   */
  function shouldRemoveTopBorder(i: number, j: number): boolean {
    if (i <= 0) return false;
    if (
      !calculationResults[i] ||
      !calculationResults[i - 1] ||
      !calculationResults[i][j] ||
      !calculationResults[i - 1][j]
    )
      return false;
    return (
      getCellValue(calculationResults[i][j]) ===
      getCellValue(calculationResults[i - 1][j])
    );
  }

  /**
   * Main calculation function for optimal strategy matrix
   */
  async function calculateStrategyMatrix() {
    if (isCalculationRunning) return;

    isCalculationRunning = true;
    isCalculationComplete = false;
    calculationResults = [];
    calculationProgress = 0;
    startTime = Date.now();

    try {
      // Set birthdates from input strings
      recipients[0].birthdate = parseBirthdate(birthdateInputs[0]);
      recipients[1].birthdate = parseBirthdate(birthdateInputs[1]);

      // Set PIA for recipients
      recipients[0].setPia(Money.from(piaValues[0]));
      recipients[1].setPia(Money.from(piaValues[1]));

      // Calculate age range
      deathAgeRange = calculateAgeRange();
      totalCalculations =
        deathAgeRange.length * deathAgeRange.length * CALCULATIONS_PER_SCENARIO;

      // Get current date for optimal strategy calculation
      const now = new Date();
      const currentDate = MonthDate.initFromYearsMonths({
        years: now.getFullYear(),
        months: now.getMonth(),
      });

      // Initialize results matrix
      calculationResults = Array(deathAgeRange.length)
        .fill(null)
        .map(() => Array(deathAgeRange.length).fill(null));

      // Calculate optimal strategy for each death age combination
      for (let i = 0; i < deathAgeRange.length; i++) {
        for (let j = 0; j < deathAgeRange.length; j++) {
          const deathAge1 = deathAgeRange[i];
          const deathAge2 = deathAgeRange[j];

          // Calculate final dates for this combination
          const finalDates = calculateFinalDates(deathAge1, deathAge2);

          // Calculate optimal strategy
          const optimal = optimalStrategy(recipients, finalDates, currentDate);

          // Store the result
          calculationResults[i][j] = {
            deathAge1,
            deathAge2,
            filingAge1: optimal[0],
            filingAge2: optimal[1],
            totalBenefit: Money.fromCents(optimal[2]),
            filingAge1Years: optimal[0].years(),
            filingAge1Months: optimal[0].modMonths(),
            filingAge2Years: optimal[1].years(),
            filingAge2Months: optimal[1].modMonths(),
          };

          calculationProgress += CALCULATIONS_PER_SCENARIO;
        }
        // Allow UI to update
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      isCalculationComplete = true;
    } catch (error) {
      console.error("Calculation error:", error);
      calculationResults = [[{ error: error.message }]];
    } finally {
      timeElapsed = (Date.now() - startTime) / 1000;
      isCalculationRunning = false;
    }
  }

  // Reactive formatted birthdates
  $: formattedBirthdates = [
    formatBirthdate(birthdateInputs[0]),
    formatBirthdate(birthdateInputs[1]),
  ];
</script>

<main>
  <h1>
    Warning: This is a work in progress and probably incorrect. Please
    disregard.
  </h1>

  <section class="input-section">
    <h2>Recipient Information</h2>

    <div class="recipient-inputs">
      <div class="recipient-group">
        <label for="name1">Name:</label>
        <input id="name1" type="text" bind:value={recipients[0].name} />

        <label for="pia1"><RecipientName r={recipients[0]} /> PIA:</label>
        <input id="pia1" type="number" bind:value={piaValues[0]} />

        <label for="birthdate1"
          ><RecipientName r={recipients[0]} /> Birthdate:</label
        >
        <input id="birthdate1" type="date" bind:value={birthdateInputs[0]} />
      </div>

      <div class="recipient-group">
        <label for="name2">Name:</label>
        <input id="name2" type="text" bind:value={recipients[1].name} />

        <label for="pia2"><RecipientName r={recipients[1]} /> PIA:</label>
        <input id="pia2" type="number" bind:value={piaValues[1]} />

        <label for="birthdate2"
          ><RecipientName r={recipients[1]} /> Birthdate:</label
        >
        <input id="birthdate2" type="date" bind:value={birthdateInputs[1]} />
      </div>
    </div>
  </section>

  <section class="summary-section">
    <p>
      This page shows the optimal Social Security claiming strategy for a couple
      with the following characteristics:
    </p>
    <ul>
      <li>
        <RecipientName r={recipients[0]} /> PIA = ${piaValues[0]}, born
        {formattedBirthdates[0]}
      </li>
      <li>
        <RecipientName r={recipients[1]} /> PIA = ${piaValues[1]}, born
        {formattedBirthdates[1]}
      </li>
    </ul>
  </section>

  <section class="calculation-section">
    <button
      on:click={calculateStrategyMatrix}
      disabled={isCalculationRunning}
      class="calculate-button"
    >
      {isCalculationRunning
        ? "Calculating..."
        : "Calculate Optimal Strategy Matrix"}
    </button>

    {#if isCalculationRunning}
      <div class="loading">
        <span class="spinner"></span> Processing {calculationProgress} of {totalCalculations}
        combinations...
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          style="width: {totalCalculations > 0
            ? (calculationProgress / totalCalculations) * 100
            : 0}%"
        ></div>
      </div>
    {/if}

    {#if isCalculationComplete && calculationResults.length > 0}
      <div class="result-box">
        <h3>Optimal Strategy Matrix</h3>
        <p>Calculation completed in {timeElapsed.toFixed(2)} seconds</p>
        <p>
          Matrix shows optimal filing ages for different death age combinations
        </p>

        {#if calculationResults[0][0]?.error}
          <div class="error">
            <h4>Error:</h4>
            <p>{calculationResults[0][0].error}</p>
          </div>
        {:else}
          <div class="matrix-container">
            <div class="matrix-legend">
              <p>
                <strong>Row:</strong>
                <RecipientName r={recipients[0]} /> death age
              </p>
              <p>
                <strong>Column:</strong>
                <RecipientName r={recipients[1]} /> death age
              </p>
              <p>
                <strong>Cell format:</strong> [<RecipientName
                  r={recipients[0]}
                /> filing age] / [<RecipientName r={recipients[1]} /> filing age]
              </p>
            </div>

            <div class="strategy-matrix">
              <table>
                <thead>
                  <!-- Column recipient header -->
                  <tr>
                    <th></th>
                    <th></th>
                    <th
                      colspan={deathAgeRange.length}
                      class="recipient-header col-header"
                    >
                      <RecipientName r={recipients[1]} /> Death Age
                    </th>
                  </tr>
                  <!-- Column age numbers -->
                  <tr>
                    <th></th>
                    <th></th>
                    {#each deathAgeRange as deathAge2}
                      <th class="age-header">{deathAge2}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each deathAgeRange as deathAge1, i}
                    <tr>
                      {#if i === 0}
                        <th
                          rowspan={deathAgeRange.length}
                          class="recipient-header row-header"
                        >
                          <div class="header-text">
                            <RecipientName r={recipients[0]} /> Death Age
                          </div>
                        </th>
                      {/if}
                      <th class="age-header">{deathAge1}</th>
                      {#each deathAgeRange as deathAge2, j}
                        <td
                          class="strategy-cell"
                          class:no-right-border={shouldRemoveRightBorder(i, j)}
                          class:no-bottom-border={shouldRemoveBottomBorder(
                            i,
                            j
                          )}
                          class:no-left-border={shouldRemoveLeftBorder(i, j)}
                          class:no-top-border={shouldRemoveTopBorder(i, j)}
                          title="Total benefit: {calculationResults[i][
                            j
                          ]?.totalBenefit.string() || 'N/A'}"
                        >
                          <div class="filing-ages">
                            {calculationResults[i][j]?.filingAge1Years ||
                              "N/A"}y{calculationResults[i][j]
                              ?.filingAge1Months || 0}m
                            <br />
                            {calculationResults[i][j]?.filingAge2Years ||
                              "N/A"}y{calculationResults[i][j]
                              ?.filingAge2Months || 0}m
                          </div>
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </section>
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: Arial, sans-serif;
  }

  .input-section {
    margin-bottom: 2rem;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
  }

  .recipient-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .recipient-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .recipient-group label {
    font-weight: bold;
    margin-top: 1rem;
  }

  .recipient-group label:first-child {
    margin-top: 0;
  }

  .recipient-group input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .summary-section {
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
  }

  .calculation-section {
    margin-top: 2rem;
  }

  .calculate-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .calculate-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .loading {
    margin: 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progress-bar {
    width: 100%;
    height: 20px;
    background-color: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
    margin: 1rem 0;
  }

  .progress-fill {
    height: 100%;
    background-color: #007bff;
    transition: width 0.3s ease;
  }

  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .result-box {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f8f9fa;
  }

  .matrix-container {
    margin-top: 1rem;
  }

  .matrix-legend {
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: #e9ecef;
    border-radius: 4px;
  }

  .matrix-legend p {
    margin: 0.5rem 0;
  }

  .strategy-matrix {
    overflow-x: auto;
  }

  .strategy-matrix table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .strategy-matrix th,
  .strategy-matrix td {
    border: 2px solid #333;
    padding: 0.5rem;
    text-align: center;
  }

  .strategy-matrix th {
    background-color: #f8f9fa;
    font-weight: bold;
  }

  .recipient-header {
    background-color: #e9ecef !important;
    font-weight: bold;
    font-size: 0.9rem;
    padding: 0.75rem 0.5rem;
  }

  .row-header {
    writing-mode: vertical-lr;
    text-orientation: mixed;
    vertical-align: middle;
    width: 2rem;
    min-width: 2rem;
    max-width: 2rem;
  }

  .row-header .header-text {
    transform: rotate(180deg);
    white-space: nowrap;
  }

  .col-header {
    text-align: center;
    vertical-align: middle;
  }

  .age-header {
    background-color: #e9ecef !important;
    color: #495057;
    font-weight: 600;
    font-size: 0.8rem;
  }

  .strategy-cell {
    background-color: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .strategy-cell:hover {
    background-color: #f0f8ff;
  }

  .filing-ages {
    line-height: 1.2;
  }

  /* Border removal classes for connected cells with same values */
  .strategy-cell.no-right-border {
    border-right: none !important;
  }

  .strategy-cell.no-bottom-border {
    border-bottom: none !important;
  }

  .strategy-cell.no-left-border {
    border-left: none !important;
  }

  .strategy-cell.no-top-border {
    border-top: none !important;
  }

  .error {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    color: #721c24;
  }

  @media (max-width: 768px) {
    .recipient-inputs {
      grid-template-columns: 1fr;
    }

    main {
      max-width: 100%;
      padding: 1rem;
    }

    .strategy-matrix {
      font-size: 0.75rem;
    }

    .strategy-matrix th,
    .strategy-matrix td {
      padding: 0.25rem;
    }
  }
</style>
