<script lang="ts">
  import { Recipient } from "$lib/recipient";
  import { Money } from "$lib/money";
  import { MonthDate } from "$lib/month-time";
  import {
    parseBirthdate as parseBirthdateUtil,
    calculateFinalDates as calculateFinalDatesUtil,
  generateThreeYearBuckets,
  type DeathAgeBucket,
  } from "$lib/strategy/ui";
  import { getDeathProbabilityDistribution } from "$lib/life-tables";

  // Import components
  import RecipientInputs from "./components/RecipientInputs.svelte";
  import DiscountRateInput from "./components/DiscountRateInput.svelte";
  import CalculationControls from "./components/CalculationControls.svelte";
  import StrategyMatrixDisplay from "./components/StrategyMatrixDisplay.svelte";
  import StrategyDetails from "./components/StrategyDetails.svelte";
  import AlternativeStrategiesSection from "./components/AlternativeStrategiesSection.svelte";

  // Constants
  const DEFAULT_BIRTHDATE = "1965-03-15";
  const DEFAULT_PIA_VALUES: [number, number] = [1000, 300];
  const DEFAULT_NAMES: [string, string] = ["Alex", "Chris"];
  const MIN_FILING_AGE = 62;
  // Number of different starting age pairs
  const CALCULATIONS_PER_SCENARIO = Math.pow((70 - 62) * 12 - 1, 2);

  // Calculation state
  let startTime: number;
  let timeElapsed: number = 0;
  let isCalculationComplete = false;
  let isCalculationRunning = false;
  let calculationResults: any[][] = [];

  // New three-year bucket lists
  let deathAgeBuckets1: DeathAgeBucket[] = [];
  let deathAgeBuckets2: DeathAgeBucket[] = [];
  let deathProbDistribution1: { age: number; probability: number }[] = [];
  let deathProbDistribution2: { age: number; probability: number }[] = [];
  let calculationProgress = 0;
  let totalCalculations = 0;
  let minMonthsSinceEpoch: number | null = null;
  let maxMonthsSinceEpoch: number | null = null;
  let displayAsAges: boolean = false;

  let selectedCellData: {
    deathAge1: number;
    deathAge2: number;
    filingAge1Years: number;
    filingAge1Months: number;
    filingDate1: MonthDate;
    filingAge2Years: number;
    filingAge2Months: number;
    filingDate2: MonthDate;
    netPresentValue: Money;
  } | null = null;

  let matrixDisplayElement: HTMLElement;

  // Form inputs
  let birthdateInputs: [string, string] = [
    DEFAULT_BIRTHDATE,
    DEFAULT_BIRTHDATE,
  ];
  let piaValues: [number, number] = [...DEFAULT_PIA_VALUES];
  let discountRatePercent: number = 2.5;

  // Validation state
  let recipientInputsValid = false;
  let discountRateValid = true;
  
  // Overall form validity
  $: formIsValid = recipientInputsValid && discountRateValid;

  // Reactive statement to convert percentage to decimal
  $: discountRate = discountRatePercent / 100;

  // Recipients setup
  let recipients: [Recipient, Recipient] = initializeRecipients();

  // Function to handle recipient data changes
  function handleRecipientUpdate() {
    try {
      // Force reactivity by reassigning the recipients array
      recipients = [...recipients];
      
      // Update death probability distributions if recipients' gender changed
      updateDeathProbabilityDistributions();
    } catch (error) {
      console.warn("Error updating form data:", error);
    }
  }

  /**
   * Update death probability distributions when gender or health mult changes.
   * This is a lightweight operation compared to the full matrix calculation.
   */
  async function updateDeathProbabilityDistributions() {
    try {
      // Get birth years for both recipients
      const birthYear1 = recipients[0].birthdate.layBirthYear();
      const birthYear2 = recipients[1].birthdate.layBirthYear();

      // Get gender from recipient objects
      const gender1 = recipients[0].gender;
      const gender2 = recipients[1].gender;

      // Health multipliers
      const health1 = recipients[0].healthMultiplier ?? 1.0;
      const health2 = recipients[1].healthMultiplier ?? 1.0;

      // Get current year for the probability distribution calculation
      const currentYear = new Date().getFullYear();

      // Fetch death probability distribution for both recipients
      const deathProb1Promise = getDeathProbabilityDistribution(
        gender1,
        birthYear1,
        currentYear,
        health1
      );
      const deathProb2Promise = getDeathProbabilityDistribution(
        gender2,
        birthYear2,
        currentYear,
        health2
      );

      // Wait for both promises to resolve
      [deathProbDistribution1, deathProbDistribution2] = await Promise.all([
        deathProb1Promise,
        deathProb2Promise,
      ]);

      // Force Svelte update by reassigning arrays
      deathProbDistribution1 = [...deathProbDistribution1];
      deathProbDistribution2 = [...deathProbDistribution2];

      // Calculate death age range start ages
      const currentAge1 = currentYear - recipients[0].birthdate.layBirthYear();
      const currentAge2 = currentYear - recipients[1].birthdate.layBirthYear();
      const startAge1 = Math.max(MIN_FILING_AGE, currentAge1);
      const startAge2 = Math.max(MIN_FILING_AGE, currentAge2);

      deathAgeBuckets1 = generateThreeYearBuckets(
        startAge1, deathProbDistribution1);
      deathAgeBuckets2 = generateThreeYearBuckets(
        startAge2, deathProbDistribution2);
    } catch (error) {
      console.warn("Error updating death probability distributions:", error);
    }
  }

    // Function to handle discount rate changes from the DiscountRateInput component
  function handleDiscountRateChange(newDiscountRatePercent: number) {
    try {
      // Update discount rate percent directly
      discountRatePercent = newDiscountRatePercent;
    } catch (error) {
      console.warn("Error updating discount rate:", error);
    }
  }


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

    // Set initial birthdates and PIA values
    try {
      recipient1.birthdate = parseBirthdateUtil(DEFAULT_BIRTHDATE);
      recipient2.birthdate = parseBirthdateUtil(DEFAULT_BIRTHDATE);
      recipient1.setPia(Money.from(DEFAULT_PIA_VALUES[0]));
      recipient2.setPia(Money.from(DEFAULT_PIA_VALUES[1]));
    } catch (error) {
      console.warn("Error setting initial recipient data:", error);
    }

    return [recipient1, recipient2];
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
      // Update death probability distributions first (in case they're not current)
      await updateDeathProbabilityDistributions();

      // Calculate total calculations needed
      totalCalculations =
        deathAgeBuckets1.length *
        deathAgeBuckets2.length *
        CALCULATIONS_PER_SCENARIO;

      // Get current date for optimal strategy calculation
      const now = new Date();
      const currentDate = MonthDate.initFromYearsMonths({
        years: now.getFullYear(),
        months: now.getMonth(),
      });

      // Initialize results matrix
      calculationResults = Array(deathAgeBuckets1.length)
        .fill(null)
        .map(() => Array(deathAgeBuckets2.length).fill(null));

      // Calculate optimal strategy for each death age combination
      for (let i = 0; i < deathAgeBuckets1.length; i++) {
        for (let j = 0; j < deathAgeBuckets2.length; j++) {
          const bucket1 = deathAgeBuckets1[i];
          const bucket2 = deathAgeBuckets2[j];
          // Representative (middle) ages for optimization
          const deathAge1 = bucket1.midAge;
          const deathAge2 = bucket2.midAge;

          // Calculate final dates for this combination
          const finalDates = calculateFinalDatesUtil(
            recipients,
            deathAge1,
            deathAge2
          );

          // Calculate optimal strategy
          const [optimalFilingAge1, optimalFilingAge2, netPresentValue] = optimalStrategyOptimized(
            recipients,
            finalDates,
            currentDate,
            discountRate
          );

          // Store the result using the chosen strategy
          calculationResults[i][j] = {
            deathAge1: bucket1.label,
            deathAge2: bucket2.label,
            bucket1,
            bucket2,
            filingAge1: optimalFilingAge1,
            filingAge2: optimalFilingAge2,
            totalBenefit: Money.fromCents(netPresentValue),
            filingAge1Years: optimalFilingAge1.years(),
            filingAge1Months: optimalFilingAge1.modMonths(),
            filingAge2Years: optimalFilingAge2.years(),
            filingAge2Months: optimalFilingAge2.modMonths(),
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

  // Calculate min and max monthsSinceEpoch for color coding
  $: {
  if (isCalculationComplete && calculationResults.length > 0) {
      let monthsSinceEpochValues: number[] = [];
      calculationResults.forEach((row) => {
        row.forEach((cell) => {
          if (cell && !cell.error) {
            const filingDate1 = recipients[0].birthdate.dateAtLayAge(
              cell.filingAge1
            );
            const filingDate2 = recipients[1].birthdate.dateAtLayAge(
              cell.filingAge2
            );
            monthsSinceEpochValues.push(filingDate1.monthsSinceEpoch());
            monthsSinceEpochValues.push(filingDate2.monthsSinceEpoch());
          }
        });
      });
      if (monthsSinceEpochValues.length > 0) {
        minMonthsSinceEpoch = Math.min(...monthsSinceEpochValues);
        maxMonthsSinceEpoch = Math.max(...monthsSinceEpochValues);
      } else {
        minMonthsSinceEpoch = null;
        maxMonthsSinceEpoch = null;
      }
    } else {
      minMonthsSinceEpoch = null;
      maxMonthsSinceEpoch = null;
    }
  }

  function handleCellSelect(detail: any) {
    selectedCellData = detail;
  }

  let showHint = false;
  let hintTimeout: ReturnType<typeof setTimeout>;

  $: if (selectedCellData) {
    clearTimeout(hintTimeout);
    showHint = true;
    hintTimeout = setTimeout(() => {
      showHint = false;
    }, 3000); // Show hint for 3 seconds
  }

  import { tick } from "svelte";
  import { optimalStrategyOptimized } from "$lib/strategy/calculations/strategy-calc";

  // Scroll to matrix when calculation is complete
  $: if (isCalculationComplete && matrixDisplayElement) {
    (async () => {
      await tick(); // Wait for DOM to update
      window.scrollTo({
        top: matrixDisplayElement.offsetTop,
        behavior: "smooth",
      });
    })();
  }
</script>

<main>
  <div class="limited-width">
    <h1>
      Warning: This is a work in progress and probably incorrect. Please
      disregard.
    </h1>

    <p>
      This calculation shows an "optimal" social security filing strategy for
      your personal situation, for all possible years of death ranging from 62
      to 90. Optimal is defined as the largest sum of money, adjusted by the
      discount rate such that a dollar today is worth more than a dollar in the
      future.
    </p>

    <section class="input-section">
      <h2>Recipient Information</h2>

      <RecipientInputs 
        {recipients} 
        {piaValues} 
        {birthdateInputs} 
        onUpdate={handleRecipientUpdate}
        onValidityChange={(isValid) => recipientInputsValid = isValid}
      />

      <DiscountRateInput 
        {discountRatePercent} 
        onDiscountRateChange={handleDiscountRateChange}
        onValidityChange={(isValid) => discountRateValid = isValid}
      />
      <p class="mortality-guide-note">Mortality assumptions use SSA cohort life tables. You can adjust relative health using the slider above. Learn more in the <a href="/guides/mortality" target="_blank" rel="noopener">mortality & health adjustment guide</a>.</p>
    </section>
  </div>

  <section class="limited-width">
    <CalculationControls
      {isCalculationRunning}
      {calculationProgress}
      {totalCalculations}
      disabled={!formIsValid}
      oncalculate={() => calculateStrategyMatrix()}
    />
  </section>
  <section class="calculation-section" bind:this={matrixDisplayElement}>
  {#if isCalculationComplete && calculationResults.length > 0 && deathProbDistribution1.length > 0 && deathProbDistribution2.length > 0}
      <StrategyMatrixDisplay
        {recipients}
        {calculationResults}
        {deathProbDistribution1}
        {deathProbDistribution2}
        {timeElapsed}
        {isCalculationComplete}
        {minMonthsSinceEpoch}
        {maxMonthsSinceEpoch}
        {selectedCellData}
        bind:displayAsAges
        onselectcell={handleCellSelect}
      />
    {/if}
  </section>
  <section class="limited-width">
    {#if isCalculationComplete && calculationResults.length > 0 && selectedCellData}
      <!-- Find the cell in calculationResults that corresponds to selectedCellData -->
      {@const row = deathAgeBuckets1.findIndex(
        (b) => b.label === String(selectedCellData.deathAge1)
      )}
      {@const col = deathAgeBuckets2.findIndex(
        (b) => b.label === String(selectedCellData.deathAge2)
      )}
      {@const cellData =
        row >= 0 && col >= 0 ? calculationResults[row][col] : null}

      <StrategyDetails
        deathAge1={selectedCellData.deathAge1}
        deathAge2={selectedCellData.deathAge2}
        filingAge1Years={selectedCellData.filingAge1Years}
        filingAge1Months={selectedCellData.filingAge1Months}
        filingDate1={selectedCellData.filingDate1}
        filingAge2Years={selectedCellData.filingAge2Years}
        filingAge2Months={selectedCellData.filingAge2Months}
        filingDate2={selectedCellData.filingDate2}
        netPresentValue={selectedCellData.netPresentValue}
        deathProb1={cellData?.deathProb1}
        deathProb2={cellData?.deathProb2}
        {recipients}
      />

      <AlternativeStrategiesSection
        {recipients}
        {selectedCellData}
        {discountRate}
        bind:displayAsAges
      />
    {/if}
  </section>

  {#if showHint}
    <div class="scroll-hint">
      <p>Scroll for detail</p>
      <div class="arrow-down"></div>
    </div>
  {/if}
</main>

<style>
  main {
    margin: 0 0;
    padding: 0;
    font-family: Arial, sans-serif;
  }

  .limited-width {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.5rem;
  }

  .input-section {
    margin-bottom: 0;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
  }

  .mortality-guide-note {
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #444;
  }
  .mortality-guide-note a {
    color: #0074d9;
    text-decoration: none;
  }
  .mortality-guide-note a:hover {
    text-decoration: underline;
  }

  .calculation-section {
    margin-top: 2rem;
  }

  @media (max-width: 768px) {
    main {
      max-width: 100%;
      padding: 1rem;
    }
    .mortality-guide-note {
      font-size: 0.85rem;
    }
  }

  .scroll-hint {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeInOut 3s forwards;
  }

  .scroll-hint p {
    margin: 0;
    font-size: 0.9em;
  }

  .arrow-down {
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid white;
    margin-top: 5px;
  }

  @keyframes fadeInOut {
    0% {
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
