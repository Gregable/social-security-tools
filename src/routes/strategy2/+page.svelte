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
  const DEFAULT_DEATH_AGES: [number, number] = [85, 85];
  const DEFAULT_NAMES: [string, string] = ["Alex", "Chris"];

  // Calculation state
  let startTime: number;
  let timeElapsed: number = 0;
  let isCalculationComplete = false;
  let isCalculationRunning = false;
  let calculationResult: any = null;

  // Form inputs
  let birthdateInputs: [string, string] = [
    DEFAULT_BIRTHDATE,
    DEFAULT_BIRTHDATE,
  ];
  let piaValues: [number, number] = [...DEFAULT_PIA_VALUES];
  let deathAges: [number, number] = [...DEFAULT_DEATH_AGES];

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
  function calculateFinalDates(): [MonthDate, MonthDate] {
    const finalDates: [MonthDate, MonthDate] = [
      recipients[0].birthdate.dateAtLayAge(
        MonthDuration.initFromYearsMonths({ years: deathAges[0], months: 0 })
      ),
      recipients[1].birthdate.dateAtLayAge(
        MonthDuration.initFromYearsMonths({ years: deathAges[1], months: 0 })
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
   * Main calculation function for optimal strategy
   */
  async function calculateStrategy() {
    if (isCalculationRunning) return;

    isCalculationRunning = true;
    isCalculationComplete = false;
    calculationResult = null;
    startTime = Date.now();

    try {
      // Set birthdates from input strings
      recipients[0].birthdate = parseBirthdate(birthdateInputs[0]);
      recipients[1].birthdate = parseBirthdate(birthdateInputs[1]);

      // Set PIA for recipients
      recipients[0].setPia(Money.from(piaValues[0]));
      recipients[1].setPia(Money.from(piaValues[1]));

      // Calculate final dates from death ages
      const finalDates = calculateFinalDates();

      // Get current date for optimal strategy calculation
      const now = new Date();
      const currentDate = MonthDate.initFromYearsMonths({
        years: now.getFullYear(),
        months: now.getMonth(),
      });

      // Calculate optimal strategy
      const optimal = optimalStrategy(recipients, finalDates, currentDate);

      // Format the result for display
      const filingDate1 = recipients[0].birthdate.dateAtLayAge(optimal[0]);
      const filingDate2 = recipients[1].birthdate.dateAtLayAge(optimal[1]);

      calculationResult = {
        strategy: [
          {
            age: optimal[0],
            benefit: recipients[0].benefitAtAge(optimal[0]),
            filingDate: filingDate1,
          },
          {
            age: optimal[1],
            benefit: recipients[1].benefitAtAge(optimal[1]),
            filingDate: filingDate2,
          },
        ],
        totalLifetimeBenefit: Money.fromCents(optimal[2]),
      };

      isCalculationComplete = true;
    } catch (error) {
      console.error("Calculation error:", error);
      calculationResult = { error: error.message };
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
      on:click={calculateStrategy}
      disabled={isCalculationRunning}
      class="calculate-button"
    >
      {isCalculationRunning ? "Calculating..." : "Calculate Optimal Strategy"}
    </button>

    {#if isCalculationRunning}
      <div class="loading">
        <span class="spinner"></span> Processing...
      </div>
    {/if}

    {#if isCalculationComplete}
      <div class="result-box">
        <h3>Calculation Results</h3>
        <p>Calculation completed in {timeElapsed.toFixed(2)} seconds</p>

        {#if calculationResult && !calculationResult.error}
          <div class="strategy-results">
            <h4>Optimal Filing Strategy:</h4>
            <ul>
              <li>
                <RecipientName r={recipients[0]} /> should file at age
                <strong>{calculationResult.strategy[0].age.years()}</strong>
                years and
                <strong>{calculationResult.strategy[0].age.modMonths()}</strong>
                months ({calculationResult.strategy[0].filingDate.monthName()}
                {calculationResult.strategy[0].filingDate.year()}) for a benefit
                of
                <strong>{calculationResult.strategy[0].benefit.string()}</strong
                >
              </li>
              <li>
                <RecipientName r={recipients[1]} /> should file at age
                <strong>{calculationResult.strategy[1].age.years()}</strong>
                years and
                <strong>{calculationResult.strategy[1].age.modMonths()}</strong>
                months ({calculationResult.strategy[1].filingDate.monthName()}
                {calculationResult.strategy[1].filingDate.year()}) for a benefit
                of
                <strong>{calculationResult.strategy[1].benefit.string()}</strong
                >
              </li>
            </ul>
            <p class="total">
              Total lifetime benefit: <strong
                >{calculationResult.totalLifetimeBenefit.string()}</strong
              >
            </p>
          </div>
        {:else if calculationResult?.error}
          <div class="error">
            <h4>Error:</h4>
            <p>{calculationResult.error}</p>
          </div>
        {/if}
      </div>
    {/if}
  </section>
</main>

<style>
  main {
    max-width: 800px;
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

  .strategy-results {
    margin-top: 1rem;
  }

  .strategy-results ul {
    list-style-type: none;
    padding: 0;
  }

  .strategy-results li {
    margin: 1rem 0;
    padding: 1rem;
    background-color: white;
    border-radius: 4px;
    border-left: 4px solid #007bff;
  }

  .total {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #e8f4f8;
    border-radius: 4px;
    font-size: 1.1rem;
    text-align: center;
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
  }
</style>
