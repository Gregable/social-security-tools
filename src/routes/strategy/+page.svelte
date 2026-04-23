<script lang="ts">
  import { onDestroy } from "svelte";
  import { getDeathProbabilityDistribution } from "$lib/life-tables";
  import { Money } from "$lib/money";
  import { MonthDate } from "$lib/month-time";
  import { Recipient } from "$lib/recipient";
  import { optimalStrategyCoupleFast } from "$lib/strategy/calculations/optimal-strategy-fast";
  import { optimalStrategySingle } from "$lib/strategy/calculations/strategy-calc";
  import {
    CalculationResults,
    CalculationStatus,
    type CellSelectionDetail,
    type DeathAgeBucket,
    generateMonthlyBuckets,
    generateThreeYearBuckets,
  } from "$lib/strategy/ui";
  import { writable } from "svelte/store";
  import AlternativeStrategiesSection from "./components/AlternativeStrategiesSection.svelte";
  import AlternativeStrategiesRow from "./components/AlternativeStrategiesRow.svelte";
  import LockedSummary from "./components/LockedSummary.svelte";
  import ModePicker from "./components/ModePicker.svelte";
  import RecipientInputs from "./components/RecipientInputs.svelte";
  import StrategyDetails from "./components/StrategyDetails.svelte";
  import StrategyDetailsSingle from "./components/StrategyDetailsSingle.svelte";
  import StrategyMatrixDisplay from "./components/StrategyMatrixDisplay.svelte";
  import StrategyPlotSingle from "./components/StrategyPlotSingle.svelte";
  import TunableAssumptions from "./components/TunableAssumptions.svelte";
  import {
    expectedNPVSingle,
    expectedNPVCoupleOptimized,
    type FilingAgeResult,
    type CoupleFilingAgeResult,
  } from "$lib/strategy/calculations/expected-npv";
  import OptimalStrategyHeadline from "./components/OptimalStrategyHeadline.svelte";

  const MIN_FILING_AGE = 62;
  const REACTIVE_DEBOUNCE_MS = 200;

  type Stage = "mode" | "form" | "results";
  let stage: Stage = "mode";

  const calculationResultsStore = writable<CalculationResults>(
    new CalculationResults()
  );
  let calculationResults: CalculationResults;
  const unsubscribeResults = calculationResultsStore.subscribe(
    (v) => (calculationResults = v)
  );
  onDestroy(unsubscribeResults);

  let deathAgeBuckets1: DeathAgeBucket[] = [];
  let deathAgeBuckets2: DeathAgeBucket[] = [];
  let deathProbDistribution1: { age: number; probability: number }[] = [];
  let deathProbDistribution2: { age: number; probability: number }[] = [];
  let displayAsAges: boolean = false;
  let optimalSingleResult: FilingAgeResult | undefined = undefined;
  let optimalCoupleResult: CoupleFilingAgeResult | undefined = undefined;

  let isSingle: boolean = false;
  let birthdateInputs: [string, string] = ["", ""];
  let piaValues: [number, number] = [0, 0];
  let discountRatePercent: number = 2.5;

  let recipientInputsValid = false;
  let discountRateValid = true;
  let formErrorMessage: string | null = null;

  let rerunPending = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isRunning = false;

  $: formIsValid = recipientInputsValid && discountRateValid;
  $: discountRate = discountRatePercent / 100;

  $: maybeScheduleReactiveRecompute(
    recipients[0].healthMultiplier,
    isSingle ? 0 : recipients[1].healthMultiplier,
    discountRatePercent,
    isSingle
  );

  function maybeScheduleReactiveRecompute(
    _h1: number,
    _h2: number,
    _d: number,
    _s: boolean
  ): void {
    if (stage !== "results") return;
    if (!formIsValid) return;
    scheduleRecompute();
  }

  function scheduleRecompute(): void {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      calculateStrategyMatrix();
    }, REACTIVE_DEBOUNCE_MS);
  }

  onDestroy(() => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
  });

  let recipients: [Recipient, Recipient] = initializeRecipients();

  function handleRecipientUpdate() {
    try {
      recipients = [...recipients];
      updateDeathProbabilityDistributions();
    } catch (error) {
      console.warn("Error updating form data:", error);
    }
  }

  async function updateDeathProbabilityDistributions() {
    try {
      const currentYear = new Date().getFullYear();
      [deathProbDistribution1, deathProbDistribution2] = await Promise.all([
        getDeathProbabilityDistribution(recipients[0], currentYear),
        getDeathProbabilityDistribution(recipients[1], currentYear),
      ]);
      deathProbDistribution1 = [...deathProbDistribution1];
      deathProbDistribution2 = [...deathProbDistribution2];

      const startAge1 = Math.max(
        MIN_FILING_AGE,
        recipients[0].birthdate.currentAge()
      );
      const startAge2 = Math.max(
        MIN_FILING_AGE,
        recipients[1].birthdate.currentAge()
      );

      deathAgeBuckets1 = isSingle
        ? generateMonthlyBuckets(startAge1, deathProbDistribution1)
        : generateThreeYearBuckets(startAge1, deathProbDistribution1);
      deathAgeBuckets2 = generateThreeYearBuckets(
        startAge2,
        deathProbDistribution2
      );
    } catch (error) {
      console.warn("Error updating death probability distributions:", error);
    }
  }

  function initializeRecipients(): [Recipient, Recipient] {
    const recipient1 = new Recipient();
    const recipient2 = new Recipient();
    recipient1.markFirst();
    recipient2.markSecond();
    recipient1.name = "Self";
    recipient2.name = "Spouse";
    recipient1.setPia(Money.from(0));
    recipient2.setPia(Money.from(0));
    return [recipient1, recipient2];
  }

  function handleModeSelect(single: boolean) {
    isSingle = single;
    if (!single && recipients[1].name === "") {
      recipients[1].name = "Spouse";
      recipients = [...recipients];
    }
    stage = "form";
  }

  async function handleContinue() {
    formErrorMessage = null;
    try {
      await calculateStrategyMatrix();
      if (calculationResults.status() === CalculationStatus.Complete) {
        stage = "results";
      }
    } catch (error) {
      console.error("Continue failed:", error);
      formErrorMessage =
        "Could not compute results. Check your inputs and try again.";
    }
  }

  function handleEdit() {
    stage = "form";
  }

  function handleStartOver() {
    formErrorMessage = null;
    birthdateInputs = ["", ""];
    piaValues = [0, 0];
    recipients = initializeRecipients();
    calculationResultsStore.set(new CalculationResults());
    stage = "mode";
  }

  async function calculateStrategyMatrix() {
    if (isRunning) {
      rerunPending = true;
      return;
    }
    isRunning = true;

    const prevSelected = calculationResults.getSelectedLabels();

    try {
      await updateDeathProbabilityDistributions();

      const next = new CalculationResults(
        deathAgeBuckets1.length,
        isSingle ? 1 : deathAgeBuckets2.length
      );
      next.beginRun();

      const now = new Date();
      const currentDate = MonthDate.initFromYearsMonths({
        years: now.getFullYear(),
        months: now.getMonth(),
      });

      if (isSingle) {
        for (let i = 0; i < deathAgeBuckets1.length; i++) {
          const bucket1 = deathAgeBuckets1[i];
          const deathAge1 = bucket1.expectedAge;
          const finalDate = recipients[0].birthdate.dateAtLayAge(deathAge1);

          const [optimalFilingAge, netPresentValue] = optimalStrategySingle(
            recipients[0],
            finalDate,
            currentDate,
            discountRate
          );

          next.set(i, 0, {
            deathAge1: bucket1.label,
            bucket1,
            filingAge1: optimalFilingAge,
            totalBenefit: Money.fromCents(netPresentValue),
            filingAge1Years: optimalFilingAge.years(),
            filingAge1Months: optimalFilingAge.modMonths(),
          });
        }
      } else {
        for (let i = 0; i < deathAgeBuckets1.length; i++) {
          for (let j = 0; j < deathAgeBuckets2.length; j++) {
            const bucket1 = deathAgeBuckets1[i];
            const bucket2 = deathAgeBuckets2[j];
            const deathAge1 = bucket1.expectedAge;
            const deathAge2 = bucket2.expectedAge;

            const finalDates: [MonthDate, MonthDate] = [
              recipients[0].birthdate.dateAtLayAge(deathAge1),
              recipients[1].birthdate.dateAtLayAge(deathAge2),
            ];

            const [optimalFilingAge1, optimalFilingAge2, netPresentValue] =
              optimalStrategyCoupleFast(
                recipients,
                finalDates,
                currentDate,
                discountRate
              );

            next.set(i, j, {
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
          }
        }
      }
      next.completeRun();

      if (isSingle) {
        const singleResults = expectedNPVSingle(
          recipients[0],
          currentDate,
          discountRate,
          deathProbDistribution1
        );
        optimalSingleResult =
          singleResults.length > 0 ? singleResults[0] : undefined;
        optimalCoupleResult = undefined;
      } else {
        const coupleResults = expectedNPVCoupleOptimized(
          recipients,
          currentDate,
          discountRate,
          [deathProbDistribution1, deathProbDistribution2]
        );
        optimalCoupleResult =
          coupleResults.length > 0 ? coupleResults[0] : undefined;
        optimalSingleResult = undefined;
      }

      if (prevSelected) {
        next.setSelectedByLabels(prevSelected.rowLabel, prevSelected.colLabel);
      }

      calculationResultsStore.set(next);
    } catch (error) {
      console.error("Calculation error:", error);
      throw error;
    } finally {
      isRunning = false;
      if (rerunPending) {
        rerunPending = false;
        calculateStrategyMatrix();
      }
    }
  }

  function handleCellSelect(detail: CellSelectionDetail) {
    calculationResults.setSelectedByLabels(detail.deathAge1, detail.deathAge2);
    calculationResultsStore.set(calculationResults);
  }

  function handleSinglePointSelect(detail: { rowIndex: number } | null) {
    if (detail === null) {
      calculationResults.clearSelectedCell();
    } else {
      calculationResults.setSelectedCell(detail.rowIndex, 0);
    }
    calculationResultsStore.set(calculationResults);
  }
</script>

<main>
  <div class="limited-width">
    <p>
      This calculation shows an "optimal" social security filing strategy for
      your personal situation, for all possible years of death ranging from 62
      to 90. Optimal is defined as the largest sum of money, adjusted by the
      discount rate such that a dollar today is worth more than a dollar in the
      future.
    </p>

    {#if stage === "mode"}
      <section class="stage-section">
        <ModePicker onselect={handleModeSelect} />
      </section>
    {/if}

    {#if stage === "form"}
      <section class="stage-section input-section">
        <RecipientInputs
          {recipients}
          {isSingle}
          {piaValues}
          {birthdateInputs}
          continueDisabled={!formIsValid}
          errorMessage={formErrorMessage}
          onUpdate={handleRecipientUpdate}
          onValidityChange={(isValid) => (recipientInputsValid = isValid)}
          oncontinue={handleContinue}
          onstartover={handleStartOver}
        />
      </section>
    {/if}

    {#if stage === "results"}
      <section class="stage-section locked-section">
        <LockedSummary {recipients} {isSingle} onedit={handleEdit} />
        <TunableAssumptions
          {recipients}
          {isSingle}
          bind:discountRatePercent
          onRecipientUpdate={handleRecipientUpdate}
          onDiscountRateValidityChange={(isValid) =>
            (discountRateValid = isValid)}
        />
      </section>
    {/if}
  </div>

  {#if stage === "results"}
    <section class="calculation-section">
      {#if calculationResults.status() === CalculationStatus.Complete}
        <div class="limited-width">
          <OptimalStrategyHeadline
            {isSingle}
            singleResult={optimalSingleResult}
            coupleResult={optimalCoupleResult}
            recipientNames={[recipients[0].name, recipients[1].name]}
          />
        </div>
        {#if isSingle}
          <StrategyPlotSingle
            recipient={recipients[0]}
            {calculationResults}
            deathProbDistribution={deathProbDistribution1}
            bind:displayAsAges
            onselectpoint={handleSinglePointSelect}
          />
        {:else}
          <StrategyMatrixDisplay
            {recipients}
            {calculationResults}
            {deathProbDistribution1}
            {deathProbDistribution2}
            bind:displayAsAges
            onselectcell={handleCellSelect}
          />
        {/if}
      {/if}
    </section>
    <section class="limited-width">
      {#if calculationResults.getSelectedCellData() && !isSingle}
        {#key calculationResults.getSelectedCellData()}
          <StrategyDetails
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
      {#if calculationResults.getSelectedCellData() && isSingle}
        {#key calculationResults.getSelectedCellData()}
          <StrategyDetailsSingle
            recipient={recipients[0]}
            result={calculationResults.getSelectedCellData()}
          />
          <AlternativeStrategiesRow
            recipient={recipients[0]}
            deathAge={calculationResults.getSelectedCellData().bucket1
              .expectedAge}
            {discountRate}
            optimalNPV={calculationResults.getSelectedCellData().totalBenefit}
            optimalFilingAge={calculationResults.getSelectedCellData()
              .filingAge1}
            bind:displayAsAges
          />
        {/key}
      {/if}
    </section>
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

  .stage-section {
    margin-bottom: 0;
  }

  .input-section {
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
  }

  .locked-section {
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #f5f7fa;
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
</style>
