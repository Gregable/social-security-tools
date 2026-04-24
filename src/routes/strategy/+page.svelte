<script lang="ts">
  import { onDestroy } from "svelte";
  import { slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import Header from "$lib/components/Header.svelte";
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
  let displayAsAges: boolean = true;
  let optimalSingleResult: FilingAgeResult | undefined = undefined;
  let optimalCoupleResult: CoupleFilingAgeResult | undefined = undefined;

  let isSingle: boolean = false;
  let birthdateInputs: [string, string] = ["", ""];
  let piaValues: [number | null, number | null] = [null, null];
  let discountRatePercent: number = 2.5;

  let recipientInputsValid = false;
  let discountRateValid = true;
  let formErrorMessage: string | null = null;

  let rerunPending = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isRunning = false;

  let tunableSentinelEl: HTMLDivElement | null = null;
  let tunableWrapperEl: HTMLDivElement | null = null;
  let tunableIsStuck = false;
  let tunableExpandedHeight = 0;
  let tunableObserver: IntersectionObserver | null = null;
  let tunableResizeObserver: ResizeObserver | null = null;

  $: observeTunableSentinel(tunableSentinelEl);
  $: observeTunableWrapper(tunableWrapperEl);

  function observeTunableSentinel(el: HTMLDivElement | null) {
    tunableObserver?.disconnect();
    tunableObserver = null;
    if (!el || typeof IntersectionObserver === "undefined") return;
    tunableObserver = new IntersectionObserver(
      (entries) => {
        if (entries.length === 0) return;
        tunableIsStuck = !entries[0].isIntersecting;
      },
      { threshold: 0 }
    );
    tunableObserver.observe(el);
  }

  function observeTunableWrapper(el: HTMLDivElement | null) {
    tunableResizeObserver?.disconnect();
    tunableResizeObserver = null;
    if (!el || typeof ResizeObserver === "undefined") return;
    tunableResizeObserver = new ResizeObserver(() => {
      // Only track size while expanded — that's the "natural" height the
      // spacer needs to reserve when we flip to fixed/compact.
      if (!tunableIsStuck) {
        tunableExpandedHeight = el.offsetHeight;
      }
    });
    tunableResizeObserver.observe(el);
  }

  onDestroy(() => {
    tunableObserver?.disconnect();
    tunableResizeObserver?.disconnect();
    if (debounceTimer !== null) clearTimeout(debounceTimer);
  });

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
      // Reactive path has no banner; log and leave prior results visible.
      calculateStrategyMatrix().catch((err) => {
        console.error("Reactive recompute failed:", err);
      });
    }, REACTIVE_DEBOUNCE_MS);
  }

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
    recipient1.name = "Self";
    recipient2.name = "Spouse";
    recipient1.setPia(Money.from(0));
    recipient2.setPia(Money.from(0));
    return [recipient1, recipient2];
  }

  function snapshotHealthMultipliers(): [number, number] {
    return [recipients[0].healthMultiplier, recipients[1].healthMultiplier];
  }

  function handleModeSelect(single: boolean) {
    isSingle = single;
    // Couple mode marks the two recipients so <RecipientName> shows their
    // colored names. Single mode leaves recipient1's default (only=true)
    // intact so <RecipientName> renders slot content ("Your") instead.
    if (!single) {
      recipients[0].markFirst();
      recipients[1].markSecond();
      if (recipients[1].name === "") recipients[1].name = "Spouse";
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
    // Preserve health tunings across Start over — they're exploration state,
    // not identity data.
    const prevHealth = snapshotHealthMultipliers();
    birthdateInputs = ["", ""];
    piaValues = [null, null];
    recipients = initializeRecipients();
    recipients[0].healthMultiplier = prevHealth[0];
    recipients[1].healthMultiplier = prevHealth[1];
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
        calculateStrategyMatrix().catch((err) => {
          console.error("Queued reactive rerun failed:", err);
        });
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

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css?family=Lato:400,700,900&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<Header />

<main>
  <div class="limited-width">
    {#if stage === "mode"}
      <header
        class="page-hero"
        transition:slide={{ duration: 320, easing: cubicOut }}
      >
        <h1 class="page-hero__title">
          Find your <span class="accent">optimal</span> filing strategy
        </h1>
        <p class="page-hero__lede">
          See the Social Security filing strategy that maximizes your expected
          benefits across every plausible life span. <em>Optimal</em> means
          the largest total, adjusted by a discount rate so a dollar today is
          worth more than a dollar in the future.
        </p>
      </header>
    {/if}

    {#if stage === "mode"}
      <section
        class="stage-section"
        transition:slide={{ duration: 320, easing: cubicOut }}
      >
        <ModePicker onselect={handleModeSelect} />
      </section>
    {/if}

    {#if stage === "form"}
      <section
        class="stage-section"
        transition:slide={{ duration: 320, easing: cubicOut }}
      >
        <RecipientInputs
          {recipients}
          {isSingle}
          bind:piaValues
          bind:birthdateInputs
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
      <section
        class="stage-section locked-section"
        transition:slide={{ duration: 320, easing: cubicOut }}
      >
        <LockedSummary {recipients} {isSingle} onedit={handleEdit} />
      </section>
    {/if}
  </div>

  {#if stage === "results"}
    <div class="tunable-sentinel" bind:this={tunableSentinelEl}></div>
    <!-- Placeholder reserves the element's natural expanded height in flow
         while the sticky is detached (position: fixed) in stuck/compact
         mode, so the document height never changes. -->
    <div
      class="tunable-placeholder"
      style:height={tunableIsStuck ? `${tunableExpandedHeight}px` : "0"}
    ></div>
    <div
      class="tunable-sticky-outer"
      class:is-stuck={tunableIsStuck}
      bind:this={tunableWrapperEl}
    >
      <div class="limited-width tunable-sticky-inner">
        <TunableAssumptions
          {recipients}
          {isSingle}
          isStuck={tunableIsStuck}
          bind:discountRatePercent
          onRecipientUpdate={handleRecipientUpdate}
          onDiscountRateValidityChange={(isValid) =>
            (discountRateValid = isValid)}
        />
      </div>
    </div>

    <section class="calculation-section">
      {#if calculationResults.status() === CalculationStatus.Complete}
        <div class="limited-width">
          <OptimalStrategyHeadline
            {isSingle}
            singleResult={optimalSingleResult}
            coupleResult={optimalCoupleResult}
            {recipients}
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
    font-family: "Lato", -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .limited-width {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.5rem;
  }

  .page-hero {
    padding: 2.75rem 0.25rem 2.25rem;
    margin: 0;
    text-align: center;
  }

  .page-hero__title {
    color: #060606;
    font-family: inherit;
    font-size: 2.5rem;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -0.01em;
    margin: 0 0 1rem;
  }

  .page-hero__title .accent {
    color: #081d88;
  }

  .page-hero__lede {
    color: #4b4b4b;
    font-family: inherit;
    font-size: 1.125rem;
    line-height: 1.55;
    max-width: 62ch;
    margin: 0 auto;
  }

  .page-hero__lede em {
    font-style: normal;
    font-weight: 700;
    color: #333;
  }

  @media (max-width: 640px) {
    .page-hero {
      padding: 1.75rem 0.25rem 1.25rem;
    }

    .page-hero__title {
      font-size: 1.875rem;
    }

    .page-hero__lede {
      font-size: 1rem;
    }
  }

  .stage-section {
    margin-bottom: 0;
  }

  .locked-section {
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #f5f7fa;
  }

  .tunable-sentinel {
    position: relative;
    height: 1px;
    width: 100%;
    margin-bottom: -1px;
    pointer-events: none;
  }

  .tunable-placeholder {
    flex: none;
    width: 100%;
  }

  .tunable-sticky-outer {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: box-shadow 0.15s ease;
  }

  .tunable-sticky-outer.is-stuck {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  }

  .tunable-sticky-inner {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
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
