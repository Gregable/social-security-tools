<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts">
  import { Recipient } from "$lib/recipient";
  import { Money } from "$lib/money";
  import { MonthDate, MonthDuration } from "$lib/month-time";
  import {
    optimalStrategy,
    strategySumTotalPeriods,
  } from "$lib/strategy/strategy-calc";
  import { ALL_MONTHS } from "$lib/constants";
  import { getDeathProbabilityDistribution } from "$lib/life-tables";

  // Import components
  import RecipientInputs from "./components/RecipientInputs.svelte";
  import DiscountRateInput from "./components/DiscountRateInput.svelte";
  import CalculationControls from "./components/CalculationControls.svelte";
  import StrategyMatrixDisplay from "./components/StrategyMatrixDisplay.svelte";
  import StrategyDetails from "./components/StrategyDetails.svelte";

  // Import utility functions
  import {
    formatBirthdate as formatBirthdateUtil,
    parseBirthdate as parseBirthdateUtil,
    calculateFinalDates as calculateFinalDatesUtil,
    calculateAgeRange as calculateAgeRangeUtil,
  } from "./utils/StrategyCalculationUtils";

  // Constants
  const DEFAULT_BIRTHDATE = "1965-03-15";
  const DEFAULT_PIA_VALUES: [number, number] = [1000, 300];
  const DEFAULT_NAMES: [string, string] = ["Alex", "Chris"];
  const MIN_DEATH_AGE = 62;
  const MAX_DEATH_AGE = 120;
  // Number of different starting age pairs
  const CALCULATIONS_PER_SCENARIO = Math.pow((70 - 62) * 12 - 1, 2);
  // Strategy tolerance percentage for creating larger grouped areas
  const STRATEGY_TOLERANCE_PERCENT = 0.01;

  // Calculation state
  let startTime: number;
  let timeElapsed: number = 0;
  let isCalculationComplete = false;
  let isCalculationRunning = false;
  let calculationResults: any[][] = [];
  let deathAgeRange1: number[] = [];
  let deathAgeRange2: number[] = [];
  let calculationProgress = 0;
  let totalCalculations = 0;
  let minMonthsSinceEpoch: number | null = null;
  let maxMonthsSinceEpoch: number | null = null;

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

  // Reactive statement to convert percentage to decimal
  $: discountRate = discountRatePercent / 100;

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
   * Converts filing age to human readable filing date string for a recipient
   * @param recipientIndex The recipient index (0 or 1)
   * @param filingAgeYears Years component of filing age
   * @param filingAgeMonths Months component of filing age
   */
  function getFilingDate(
    recipient: Recipient,
    filingAgeYears: number,
    filingAgeMonths: number
  ): string {
    const birthdate = recipient.birthdate;
    const filingAge = MonthDuration.initFromYearsMonths({
      years: filingAgeYears,
      months: filingAgeMonths,
    });
    const filingDate = birthdate.dateAtLayAge(filingAge);

    // Format as MMM YYYY (e.g., "Jan 2025")
    return `${ALL_MONTHS[filingDate.monthIndex()]} ${filingDate.year()}`;
  }

  /**
   * Creates a function to extract filing date value for a specific recipient
   * @param recipientIndex The recipient index (1 or 2)
   */
  function createValueExtractor(
    recipientIndex: number
  ): (result: any) => string {
    return (result: any): string => {
      if (!result || result.error) return "error";
      return getFilingDate(
        recipients[recipientIndex],
        result[`filingAge${recipientIndex}Years`],
        result[`filingAge${recipientIndex}Months`]
      );
    };
  }

  // Create value extractors
  const getRecipient1Value = createValueExtractor(0);
  const getRecipient2Value = createValueExtractor(1);

  /**
   * Factory function to create border removal functions
   * @param valueExtractor Function that extracts the value to compare
   * @returns Object with functions for each border direction
   */
  function createBorderRemovalFunctions(
    valueExtractor: (result: any) => string
  ) {
    return {
      right: (i: number, j: number): boolean => {
        if (j >= deathAgeRange1.length - 1) return false;
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
        if (i >= deathAgeRange2.length - 1) return false;
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

  // Create border removal functions for each recipient
  // Index 0: Recipient 1 table border functions
  // Index 1: Recipient 2 table border functions
  const borderRemovalFunctions = [
    createBorderRemovalFunctions(getRecipient1Value),
    createBorderRemovalFunctions(getRecipient2Value),
  ];

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
      recipients[0].birthdate = parseBirthdateUtil(birthdateInputs[0]);
      recipients[1].birthdate = parseBirthdateUtil(birthdateInputs[1]);

      // Set PIA for recipients
      recipients[0].setPia(Money.from(piaValues[0]));
      recipients[1].setPia(Money.from(piaValues[1]));

      // Get birth years for both recipients
      const birthYear1 = recipients[0].birthdate.layBirthYear();
      const birthYear2 = recipients[1].birthdate.layBirthYear();

      // Get gender from recipient objects
      const gender1 = recipients[0].gender;
      const gender2 = recipients[1].gender;

      // Get current year for the probability distribution calculation
      const currentYear = new Date().getFullYear();

      // Fetch death probability distribution for both recipients
      const deathProb1Promise = getDeathProbabilityDistribution(
        gender1,
        birthYear1,
        currentYear
      );
      const deathProb2Promise = getDeathProbabilityDistribution(
        gender2,
        birthYear2,
        currentYear
      );

      // Wait for both promises to resolve
      const [deathProbDistribution1, deathProbDistribution2] =
        await Promise.all([deathProb1Promise, deathProb2Promise]);

      // Calculate age range
      deathAgeRange1 = calculateAgeRangeUtil(
        MIN_DEATH_AGE,
        MAX_DEATH_AGE,
        birthdateInputs[0]
      );
      deathAgeRange2 = calculateAgeRangeUtil(
        MIN_DEATH_AGE,
        MAX_DEATH_AGE,
        birthdateInputs[1]
      );
      totalCalculations =
        deathAgeRange1.length *
        deathAgeRange2.length *
        CALCULATIONS_PER_SCENARIO;

      // Get current date for optimal strategy calculation
      const now = new Date();
      const currentDate = MonthDate.initFromYearsMonths({
        years: now.getFullYear(),
        months: now.getMonth(),
      });

      // Initialize results matrix
      calculationResults = Array(deathAgeRange1.length)
        .fill(null)
        .map(() => Array(deathAgeRange2.length).fill(null));

      // Calculate optimal strategy for each death age combination
      let probDeath1 = 0;
      let probDeath2 = 0;
      for (let i = 0; i < deathAgeRange1.length; i++) {
        for (let j = 0; j < deathAgeRange2.length; j++) {
          const deathAge1 = deathAgeRange1[i];
          const deathAge2 = deathAgeRange2[j];

          // Calculate final dates for this combination
          const finalDates = calculateFinalDatesUtil(
            recipients,
            deathAge1,
            deathAge2
          );

          // Calculate optimal strategy
          const optimal = optimalStrategy(
            recipients,
            finalDates,
            currentDate,
            discountRate
          );

          // Strategy smoothing: check if we can use a neighboring strategy within tolerance
          let chosenStrategy = [optimal[0], optimal[1]];
          let chosenValue = optimal[2];

          // Helper function to check if a strategy is within tolerance
          const isWithinTolerance = (
            neighborValue: number,
            optimalValue: number
          ): boolean => {
            const toleranceRatio = STRATEGY_TOLERANCE_PERCENT / 100;
            // Ensure tolerance is reasonable (between 0 and 100%)
            if (toleranceRatio < 0 || toleranceRatio > 1) {
              console.warn(
                `Invalid tolerance percentage: ${STRATEGY_TOLERANCE_PERCENT}%. Using optimal strategy.`
              );
              return false;
            }
            return neighborValue / optimalValue >= 1 - toleranceRatio;
          };

          // Helper function to evaluate a strategy for the current scenario
          const evaluateStrategy = (
            strategy: [MonthDuration, MonthDuration]
          ): number => {
            return strategySumTotalPeriods(
              recipients,
              finalDates,
              currentDate,
              discountRate,
              strategy
            ).cents();
          };

          // Track if we are still using the optimal strategy or not:
          let modifiedStrategy: boolean = false;

          // Check left neighbor first (same row, previous column)
          if (j > 0 && calculationResults[i][j - 1]) {
            const leftNeighbor = calculationResults[i][j - 1];
            const leftStrategy: [MonthDuration, MonthDuration] = [
              leftNeighbor.filingAge1,
              leftNeighbor.filingAge2,
            ];
            const leftValue = evaluateStrategy(leftStrategy);

            if (isWithinTolerance(leftValue, optimal[2])) {
              modifiedStrategy = true;
              chosenStrategy = leftStrategy;
              chosenValue = leftValue;
            }
          }

          if (!modifiedStrategy && i > 0 && calculationResults[i - 1][j]) {
            const aboveNeighbor = calculationResults[i - 1][j];
            const aboveStrategy: [MonthDuration, MonthDuration] = [
              aboveNeighbor.filingAge1,
              aboveNeighbor.filingAge2,
            ];
            const aboveValue = evaluateStrategy(aboveStrategy);

            if (isWithinTolerance(aboveValue, optimal[2])) {
              chosenStrategy = aboveStrategy;
              chosenValue = aboveValue;
            }
          }

          // Find probability for these death ages from probability distributions
          const probEntry1 = deathProbDistribution1?.find(
            (entry) => entry.age === deathAge1
          );
          const probEntry2 = deathProbDistribution2?.find(
            (entry) => entry.age === deathAge2
          );

          // Get actual death probability for these ages, or default to null if not found
          const deathProb1 = probEntry1?.probability || null;
          const deathProb2 = probEntry2?.probability || null;

          // Store the result using the chosen strategy with probability data
          calculationResults[i][j] = {
            deathAge1,
            deathAge2,
            deathProb1,
            deathProb2,
            filingAge1: chosenStrategy[0],
            filingAge2: chosenStrategy[1],
            totalBenefit: Money.fromCents(chosenValue),
            filingAge1Years: chosenStrategy[0].years(),
            filingAge1Months: chosenStrategy[0].modMonths(),
            filingAge2Years: chosenStrategy[1].years(),
            filingAge2Months: chosenStrategy[1].modMonths(),
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

  // Reactive formatted birthdates
  $: formattedBirthdates = [
    formatBirthdateUtil(birthdateInputs[0]),
    formatBirthdateUtil(birthdateInputs[1]),
  ] as [string, string];

  function handleCellSelect(event: CustomEvent) {
    selectedCellData = event.detail;
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

      <RecipientInputs {recipients} {piaValues} {birthdateInputs} />

      <DiscountRateInput bind:discountRatePercent />
    </section>
  </div>

  <section class="limited-width">
    <CalculationControls
      {isCalculationRunning}
      {calculationProgress}
      {totalCalculations}
      on:calculate={() => calculateStrategyMatrix()}
    />
  </section>
  <section class="calculation-section" bind:this={matrixDisplayElement}>
    {#if isCalculationComplete && calculationResults.length > 0}
      <StrategyMatrixDisplay
        {recipients}
        {deathAgeRange1}
        {deathAgeRange2}
        {calculationResults}
        {timeElapsed}
        {isCalculationComplete}
        {minMonthsSinceEpoch}
        {maxMonthsSinceEpoch}
        {selectedCellData}
        on:selectcell={handleCellSelect}
      />
    {/if}
  </section>
  <section class="limited-width">
    {#if isCalculationComplete && calculationResults.length > 0 && selectedCellData}
      <!-- Find the cell in calculationResults that corresponds to selectedCellData -->
      {@const row = deathAgeRange1.findIndex(
        (age) => age === selectedCellData.deathAge1
      )}
      {@const col = deathAgeRange2.findIndex(
        (age) => age === selectedCellData.deathAge2
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

  .calculation-section {
    margin-top: 2rem;
  }

  @media (max-width: 768px) {
    main {
      max-width: 100%;
      padding: 1rem;
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
