<script lang="ts">
  import { Recipient } from '$lib/recipient';
  import { Money } from '$lib/money';
  import { MonthDate } from '$lib/month-time';
  import {
    parseBirthdate as parseBirthdateUtil,
    calculateFinalDates as calculateFinalDatesUtil,
    generateThreeYearBuckets,
    type DeathAgeBucket,
  } from '$lib/strategy/ui';
  import { getDeathProbabilityDistribution } from '$lib/life-tables';
  import { optimalStrategyOptimized } from '$lib/strategy/calculations/strategy-calc';

  // Import components
  import RecipientInputs from './components/RecipientInputs.svelte';
  import DiscountRateInput from './components/DiscountRateInput.svelte';
  import CalculationControls from './components/CalculationControls.svelte';
  import StrategyMatrixDisplay from './components/StrategyMatrixDisplay.svelte';
  import StrategyDetails from './components/StrategyDetails.svelte';
  import StrategyTimeline from './components/StrategyTimeline.svelte';
  import AlternativeStrategiesSection from './components/AlternativeStrategiesSection.svelte';
  import { CalculationResults, CalculationStatus } from '$lib/strategy/ui';
  import { writable } from 'svelte/store';

  // Constants
  const DEFAULT_BIRTHDATE = '1965-03-15';
  const DEFAULT_PIA_VALUES: [number, number] = [1000, 300];
  const DEFAULT_NAMES: [string, string] = ['Alex', 'Chris'];
  const MIN_FILING_AGE = 62;
  // Wrap results in a store so internal mutations (status/selection) can trigger UI updates
  const calculationResultsStore = writable<CalculationResults>(
    new CalculationResults()
  );
  let calculationResults: CalculationResults;
  calculationResultsStore.subscribe((v) => (calculationResults = v));

  // New three-year bucket lists
  let deathAgeBuckets1: DeathAgeBucket[] = [];
  let deathAgeBuckets2: DeathAgeBucket[] = [];
  let deathProbDistribution1: { age: number; probability: number }[] = [];
  let deathProbDistribution2: { age: number; probability: number }[] = [];
  // Elapsed time now accessed directly inside StrategyMatrixDisplay
  let displayAsAges: boolean = false;

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
      console.warn('Error updating form data:', error);
    }
  }

  /**
   * Update death probability distributions when gender or health mult changes.
   * This is a lightweight operation compared to the full matrix calculation.
   */
  async function updateDeathProbabilityDistributions() {
    try {
      // Get current year for the probability distribution calculation
      const currentYear = new Date().getFullYear();

      // Fetch death probability distribution for both recipients
      const deathProb1Promise: Promise<{ age: number; probability: number }[]> =
        getDeathProbabilityDistribution(recipients[0], currentYear);
      const deathProb2Promise: Promise<{ age: number; probability: number }[]> =
        getDeathProbabilityDistribution(recipients[1], currentYear);

      // Wait for both promises to resolve
      [deathProbDistribution1, deathProbDistribution2] = await Promise.all([
        deathProb1Promise,
        deathProb2Promise,
      ]);

      // Force Svelte update by reassigning arrays
      deathProbDistribution1 = [...deathProbDistribution1];
      deathProbDistribution2 = [...deathProbDistribution2];

      // Calculate death age range start ages
      const startAge1 = Math.max(
        MIN_FILING_AGE,
        recipients[0].birthdate.currentAge()
      );
      const startAge2 = Math.max(
        MIN_FILING_AGE,
        recipients[1].birthdate.currentAge()
      );

      deathAgeBuckets1 = generateThreeYearBuckets(
        startAge1,
        deathProbDistribution1
      );
      deathAgeBuckets2 = generateThreeYearBuckets(
        startAge2,
        deathProbDistribution2
      );
    } catch (error) {
      console.warn('Error updating death probability distributions:', error);
    }
  }

  // Discount rate now updated via two-way binding on DiscountRateInput.

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
      console.warn('Error setting initial recipient data:', error);
    }

    return [recipient1, recipient2];
  }

  /**
   * Main calculation function for optimal strategy matrix
   */
  async function calculateStrategyMatrix() {
    if (calculationResults.status() === CalculationStatus.Running) return;
    const fresh = new CalculationResults();
    calculationResultsStore.set(fresh);

    try {
      // Update death probability distributions first (in case they're not current)
      await updateDeathProbabilityDistributions();

      // Calculate total calculations needed
      const sized = new CalculationResults(
        deathAgeBuckets1.length,
        deathAgeBuckets2.length
      );
      sized.beginRun();
      calculationResultsStore.set(sized);

      // Get current date for optimal strategy calculation
      const now = new Date();
      const currentDate = MonthDate.initFromYearsMonths({
        years: now.getFullYear(),
        months: now.getMonth(),
      });

      // Initialize results matrix

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
          const [optimalFilingAge1, optimalFilingAge2, netPresentValue] =
            optimalStrategyOptimized(
              recipients,
              finalDates,
              currentDate,
              discountRate
            );

          // Store the result using the chosen strategy
          calculationResults.set(i, j, {
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
          });

          calculationResults.addScenarioProgress();
        }
        calculationResultsStore.set(calculationResults); // update row progress
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      calculationResults.completeRun();
      calculationResultsStore.set(calculationResults);
    } catch (error) {
      console.error('Calculation error:', error);
      calculationResults.failRun(error.message || String(error));
      calculationResultsStore.set(calculationResults);
    } finally {
      if (calculationResults.status() === CalculationStatus.Running) {
        calculationResults.setStatus(CalculationStatus.Idle);
        calculationResultsStore.set(calculationResults);
      }
    }
  }
  function handleCellSelect(detail: any) {
    calculationResults.setSelectedByLabels(
      String(detail.deathAge1),
      String(detail.deathAge2)
    );
    calculationResultsStore.set(calculationResults);
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
        onValidityChange={(isValid) => (recipientInputsValid = isValid)}
      />

      <DiscountRateInput
        bind:discountRatePercent
        onValidityChange={(isValid) => (discountRateValid = isValid)}
      />
      <p class="mortality-guide-note">
        Mortality assumptions use SSA cohort life tables. You can adjust
        relative health using the slider above. Learn more in the <a
          href="/guides/mortality"
          target="_blank"
          rel="noopener">mortality & health adjustment guide</a
        >.
      </p>
    </section>
  </div>

  <section class="limited-width">
    <CalculationControls
      {calculationResults}
      disabled={!formIsValid}
      oncalculate={calculateStrategyMatrix}
    />
  </section>
  <section class="calculation-section">
    {#if calculationResults.status() === CalculationStatus.Complete}
      <StrategyMatrixDisplay
        {recipients}
        {calculationResults}
        {deathProbDistribution1}
        {deathProbDistribution2}
        bind:displayAsAges
        onselectcell={handleCellSelect}
      />
    {/if}
  </section>
  <section class="limited-width">
    {#if calculationResults.getSelectedCellData()}
      {#key calculationResults.getSelectedCellData()}
        <!-- Pull the selected cell from CalculationResults and render details -->
        <StrategyDetails
          {recipients}
          result={calculationResults.getSelectedCellData()}
        />
        <StrategyTimeline
          {recipients}
          result={calculationResults.getSelectedCellData()}
        />
        <AlternativeStrategiesSection
          {recipients}
          result={calculationResults.getSelectedCellData()}
          {discountRate}
          bind:displayAsAges
        />
      {/key}
    {/if}
  </section>
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
