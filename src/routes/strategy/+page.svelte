<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import { slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import Header from "$lib/components/Header.svelte";
  import { getDeathProbabilityDistribution } from "$lib/life-tables";
  import { Birthdate } from "$lib/birthday";
  import { Money } from "$lib/money";
  import { MonthDate } from "$lib/month-time";
  import { Recipient } from "$lib/recipient";
  import { optimalStrategyCoupleFast } from "$lib/strategy/calculations/optimal-strategy-fast";
  import {
    earliestModelableDeathAge,
    optimalStrategySingle,
  } from "$lib/strategy/calculations/strategy-calc";
  import {
    currentMonthDate,
    filingChoices,
  } from "$lib/components/recommended-filing-card";
  import {
    CalculationResults,
    CalculationStatus,
    type CellSelectionDetail,
    type DeathAgeBucket,
    generateMonthlyBuckets,
    generateThreeYearBuckets,
  } from "$lib/strategy/ui";
  import { writable } from "svelte/store";
  import posthog from "posthog-js";
  import { UrlParams, buildStrategyHash } from "$lib/url-params";
  import LockedSummary from "./components/LockedSummary.svelte";
  import ModePicker from "./components/ModePicker.svelte";
  import NoFilingDecisionPanel from "./components/NoFilingDecisionPanel.svelte";
  import RecipientInputs from "./components/RecipientInputs.svelte";
  import ScenarioDetail from "./components/ScenarioDetail.svelte";
  import ScenarioDetailSingle from "./components/ScenarioDetailSingle.svelte";
  import StrategyMatrixDisplay from "./components/StrategyMatrixDisplay.svelte";
  import StrategyPlotSingle from "./components/StrategyPlotSingle.svelte";
  import TunableAssumptions from "./components/TunableAssumptions.svelte";
  import {
    expectedNPVSingle,
    expectedNPVCoupleOptimized,
    type FilingAgeResult,
    type CoupleFilingAgeResult,
  } from "$lib/strategy/calculations/expected-npv";
  import OptimalStrategyHeadline from "$lib/components/OptimalStrategyHeadline.svelte";
  import AdvisorPrompt from "$lib/components/AdvisorPrompt.svelte";
  import {
    WebApplicationSchema,
    renderActionSchema,
    renderWebsiteSocialMeta,
  } from "$lib/schema-org";

  const pageTitle =
    "Social Security Filing Strategy Optimizer - SSA.tools";
  const pageDescription =
    "Find the Social Security filing strategy that maximizes your expected lifetime benefits. Free optimizer for singles and couples that accounts for life expectancy and a discount rate.";
  const pageUrl = "https://ssa.tools/strategy";
  const pageImage = "/strategy-og.png";
  const pageImageAlt =
    "Recommended Social Security filing ages for a couple, with expected combined lifetime benefit";

  const webAppSchema = new WebApplicationSchema();
  webAppSchema.url = pageUrl;
  webAppSchema.name = pageTitle;
  webAppSchema.description = pageDescription;

  const strategyActionJsonLd = renderActionSchema({
    name: "Optimize Social Security filing strategy",
    description:
      "Pre-populate the SSA.tools strategy optimizer from URL hash parameters. Finds the claim age(s) that maximize expected lifetime benefits. Supplying both pia2 and dob2 switches the optimizer to couple mode.",
    urlTemplate:
      "https://ssa.tools/strategy#pia1={pia1}&dob1={dob1}&name1={name1?}&gender1={gender1?}&pia2={pia2?}&dob2={dob2?}&name2={name2?}&gender2={gender2?}",
    targetUrl: pageUrl,
    parameters: [
      {
        name: "pia1",
        description:
          "Primary Insurance Amount in whole US dollars for recipient 1.",
        required: true,
        valuePattern: "^\\d+$",
      },
      {
        name: "dob1",
        description: "Date of birth for recipient 1 in YYYY-MM-DD format.",
        required: true,
        valuePattern: "^\\d{4}-\\d{2}-\\d{2}$",
      },
      {
        name: "name1",
        description: "Display name for recipient 1.",
        required: false,
      },
      {
        name: "gender1",
        description:
          "Mortality table for recipient 1: male, female, or blended (default).",
        required: false,
        valuePattern: "^(male|female|blended)$",
      },
      {
        name: "pia2",
        description:
          "Spouse's Primary Insurance Amount in whole US dollars (couple mode).",
        required: false,
        valuePattern: "^\\d+$",
      },
      {
        name: "dob2",
        description: "Spouse's date of birth in YYYY-MM-DD format.",
        required: false,
        valuePattern: "^\\d{4}-\\d{2}-\\d{2}$",
      },
      {
        name: "name2",
        description: "Spouse's display name.",
        required: false,
      },
      {
        name: "gender2",
        description:
          "Mortality table for spouse: male, female, or blended (default).",
        required: false,
        valuePattern: "^(male|female|blended)$",
      },
    ],
  });

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
  // Set when a recompute triggered from the results stage fails. The form's
  // banner is not mounted there, so the results stage needs its own.
  let recomputeErrorMessage: string | null = null;

  let rerunPending = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isRunning = false;

  let tunableSentinelEl: HTMLDivElement | null = null;
  let widgetEndSentinelEl: HTMLDivElement | null = null;
  let tunableWrapperEl: HTMLDivElement | null = null;
  let tunableIsStuck = false;
  let tunablePastWidget = false;
  let tunableExpandedHeight = 0;
  let tunableObserver: IntersectionObserver | null = null;
  let widgetEndObserver: IntersectionObserver | null = null;
  let tunableResizeObserver: ResizeObserver | null = null;
  // The sticky compact bar overflows on narrow viewports and the placeholder
  // it reserves leaves a visible gap. Disable the sticky behavior below this
  // breakpoint and let the tunables flow normally.
  let tunableMobileMq: MediaQueryList | null = null;
  let tunableMobile = false;
  const handleTunableMqChange = (e: MediaQueryListEvent | MediaQueryList) => {
    tunableMobile = e.matches;
    if (tunableMobile) tunableIsStuck = false;
  };

  let widgetAnchorEl: HTMLDivElement | null = null;
  let scenarioAnchorEl: HTMLElement | null = null;
  let backToMatrixTimer: ReturnType<typeof setTimeout> | null = null;

  $: observeTunableSentinel(tunableSentinelEl);
  $: observeWidgetEndSentinel(widgetEndSentinelEl);
  $: observeTunableWrapper(tunableWrapperEl);

  function observeTunableSentinel(el: HTMLDivElement | null) {
    tunableObserver?.disconnect();
    tunableObserver = null;
    if (!el || typeof IntersectionObserver === "undefined") return;
    tunableObserver = new IntersectionObserver(
      (entries) => {
        if (entries.length === 0) return;
        tunableIsStuck = !entries[0].isIntersecting && !tunableMobile;
      },
      { threshold: 0 }
    );
    tunableObserver.observe(el);
  }

  function observeWidgetEndSentinel(el: HTMLDivElement | null) {
    widgetEndObserver?.disconnect();
    widgetEndObserver = null;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // rootMargin shrinks the top of the observer's root by 40% of the
    // viewport, so the sentinel "leaves" intersection — and the bar
    // begins to hide — once the bottom of the widget is 40% down from the
    // top of the real viewport. That makes the bar fade as the widget
    // starts to slide out, rather than waiting until it's fully gone.
    widgetEndObserver = new IntersectionObserver(
      (entries) => {
        if (entries.length === 0) return;
        const entry = entries[0];
        const triggerLine = window.innerHeight * 0.4;
        tunablePastWidget = entry.boundingClientRect.top < triggerLine;
      },
      { rootMargin: "-40% 0px 0px 0px", threshold: 0 }
    );
    widgetEndObserver.observe(el);
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

  onMount(() => {
    tunableMobileMq = window.matchMedia("(max-width: 768px)");
    handleTunableMqChange(tunableMobileMq);
    tunableMobileMq.addEventListener("change", handleTunableMqChange);

    hydrateFromHash();
  });

  function parseBirthdate(dateStr: string): Birthdate | null {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    try {
      return Birthdate.FromYMD(year, month, day);
    } catch {
      return null;
    }
  }

  function hydrateFromHash() {
    const params = new UrlParams(window.location.hash);
    if (!params.hasValidRecipientParams()) return;

    try {
      const dob1 = params.getRecipientDob()!;
      const bd1 = parseBirthdate(dob1);
      if (!bd1) return;

      const hasSpouse =
        params.getSpousePia() !== null && params.getSpouseDob() !== null;
      isSingle = !hasSpouse;

      // Mirror handleModeSelect: couple mode needs markFirst/markSecond so
      // RecipientName renders colored names.
      if (!isSingle) {
        recipients[0].markFirst();
        recipients[1].markSecond();
      }

      const pia1 = params.getRecipientPia()!;
      birthdateInputs[0] = dob1;
      piaValues[0] = pia1;
      recipients[0].setPia(Money.from(pia1));
      recipients[0].birthdate = bd1;
      if (params.getRecipientName()) recipients[0].name = params.getRecipientName()!;
      recipients[0].gender = params.getRecipientGender();

      if (!isSingle) {
        const dob2 = params.getSpouseDob()!;
        const bd2 = parseBirthdate(dob2);
        if (!bd2) { isSingle = true; } else {
          const pia2 = params.getSpousePia()!;
          birthdateInputs[1] = dob2;
          piaValues[1] = pia2;
          recipients[1].setPia(Money.from(pia2));
          recipients[1].birthdate = bd2;
          if (params.getSpouseName()) recipients[1].name = params.getSpouseName()!;
          recipients[1].gender = params.getSpouseGender();
        }
      }

      birthdateInputs = [...birthdateInputs];
      piaValues = [...piaValues];
      recipients = [...recipients];
      stage = "form";
    } catch {
      // Invalid URL params — leave the page at the mode-picker stage
    }
  }

  onDestroy(() => {
    tunableObserver?.disconnect();
    widgetEndObserver?.disconnect();
    tunableResizeObserver?.disconnect();
    tunableMobileMq?.removeEventListener("change", handleTunableMqChange);
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    if (backToMatrixTimer !== null) clearTimeout(backToMatrixTimer);
  });

  $: formIsValid = recipientInputsValid && discountRateValid;

  // A recipient with no filing choice left has only one option: file now.
  // The headline and the grids need to know so they do not present that as a
  // decision. Assigned inside calculateStrategyMatrix from the same
  // currentDate as the results it describes — deriving it reactively from
  // live form state would let it flip a card to "File now" while the figures
  // beside it still belong to the previous birthdate.
  let hasFilingChoice: [boolean, boolean] = [true, true];
  $: discountRate = discountRatePercent / 100;
  $: shareUrl = buildShareUrl(recipients, isSingle, piaValues, birthdateInputs);

  function buildShareUrl(
    rs: [typeof recipients[0], typeof recipients[1]],
    single: boolean,
    pias: [number | null, number | null],
    dobs: [string, string]
  ): string {
    if (!dobs[0] || pias[0] === null) return "";
    const hash = buildStrategyHash({
      isSingle: single,
      pia1: pias[0],
      dob1: dobs[0],
      name1: rs[0].name && rs[0].name !== "Self" ? rs[0].name : undefined,
      gender1: rs[0].gender,
      ...(
        !single && pias[1] !== null && dobs[1]
          ? {
              pia2: pias[1],
              dob2: dobs[1],
              name2: rs[1].name && rs[1].name !== "Spouse" ? rs[1].name : undefined,
              gender2: rs[1].gender,
            }
          : {}
      ),
    });
    return `https://ssa.tools/strategy${hash}`;
  }

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
      calculateStrategyMatrix()
        .then(() => {
          recomputeErrorMessage = null;
        })
        .catch((err) => {
          console.error("Reactive recompute failed:", err);
          // The figures still on screen were computed for the previous
          // inputs. Leaving them unlabelled is worse than showing nothing:
          // they look like an answer to what the user just typed.
          recomputeErrorMessage =
            "These figures are out of date — we could not recompute them " +
            "for your latest changes.";
        });
    }, REACTIVE_DEBOUNCE_MS);
  }

  let recipients: [Recipient, Recipient] = initializeRecipients();

  function handleRecipientUpdate() {
    recipients = [...recipients];
    // A speculative refresh while the user is still typing. Failures here are
    // not worth interrupting them for: calculateStrategyMatrix awaits the
    // same function on Continue, and surfaces the error then.
    updateDeathProbabilityDistributions().catch((error) => {
      console.warn("Error updating death probability distributions:", error);
    });
  }

  /**
   * Loads mortality data and rebuilds the death-age buckets.
   *
   * Throws rather than swallowing. Returning quietly on failure leaves the
   * buckets empty, and an empty bucket list still runs to "Complete" with
   * nothing in it — which is exactly how the over-70 bug stayed invisible.
   */
  async function updateDeathProbabilityDistributions() {
    const currentYear = new Date().getFullYear();
    [deathProbDistribution1, deathProbDistribution2] = await Promise.all([
      getDeathProbabilityDistribution(recipients[0], currentYear),
      getDeathProbabilityDistribution(recipients[1], currentYear),
    ]);
    deathProbDistribution1 = [...deathProbDistribution1];
    deathProbDistribution2 = [...deathProbDistribution2];

    // Monthly buckets start at the first death age that admits any filing at
    // all: the later of "now" and the earliest month the recipient could file.
    // A death age below that leaves the optimizer nothing to search — it is
    // not a scenario worth modelling, and asking about it is what produced
    // the "file at age 0" result. currentAge() is whole years, so the month
    // precision has to come from earliestFiling.
    const currentDate = currentMonthDate();
    const startAgeMonths1 = Math.max(
      MIN_FILING_AGE * 12,
      earliestModelableDeathAge(recipients[0], currentDate).asMonths()
    );

    // Three-year buckets represent each bucket by its midpoint (start + 18
    // months), so they clear the earliest filing age without this adjustment.
    const startAge1Years = Math.max(
      MIN_FILING_AGE,
      recipients[0].birthdate.currentAge()
    );
    const startAge2Years = Math.max(
      MIN_FILING_AGE,
      recipients[1].birthdate.currentAge()
    );

    deathAgeBuckets1 = isSingle
      ? generateMonthlyBuckets(startAgeMonths1, deathProbDistribution1)
      : generateThreeYearBuckets(startAge1Years, deathProbDistribution1);
    deathAgeBuckets2 = generateThreeYearBuckets(
      startAge2Years,
      deathProbDistribution2
    );

    // A run over no scenarios is a failure, not a result.
    if (deathAgeBuckets1.length === 0 || deathAgeBuckets2.length === 0) {
      throw new Error(
        `no death-age buckets (recipient 0: ${deathAgeBuckets1.length}, ` +
          `recipient 1: ${deathAgeBuckets2.length}); mortality data is ` +
          "missing or unusable"
      );
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
    posthog.capture("Strategy: Mode Selected", { mode: single ? "single" : "couple" });
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
    recomputeErrorMessage = null;
    try {
      await calculateStrategyMatrix();
      if (calculationResults.status() === CalculationStatus.Complete) {
        posthog.capture("Strategy: Results Computed", {
          mode: isSingle ? "single" : "couple",
        });
        stage = "results";
      }
    } catch (error) {
      console.error("Continue failed:", error);
      // Every input the form accepts should produce a result, so reaching
      // here means a bug on our side rather than bad data. Say so: telling
      // people to "check your inputs" sends them hunting for a mistake they
      // did not make.
      formErrorMessage =
        "Something went wrong while working out your results. This looks " +
        "like a problem on our end, not with what you entered.";
    }
  }

  function handleEdit() {
    stage = "form";
  }

  function handleStartOver() {
    formErrorMessage = null;
    recomputeErrorMessage = null;
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

      const currentDate = currentMonthDate();
      hasFilingChoice = filingChoices(
        recipients[0],
        isSingle ? null : recipients[1],
        currentDate
      );

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

  async function handleCellSelect(detail: CellSelectionDetail) {
    calculationResults.setSelectedByLabels(detail.deathAge1, detail.deathAge2);
    calculationResultsStore.set(calculationResults);
    await tick();
    scenarioAnchorEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSinglePointSelect(
    detail: { rowIndex: number } | null
  ) {
    if (detail === null) {
      calculationResults.clearSelectedCell();
      calculationResultsStore.set(calculationResults);
      return;
    }
    calculationResults.setSelectedCell(detail.rowIndex, 0);
    calculationResultsStore.set(calculationResults);
    await tick();
    scenarioAnchorEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleBackToMatrix() {
    widgetAnchorEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Clear the selection after the smooth scroll has had time to start, so
    // the scenario card stays visible during the scroll-out and only unmounts
    // once the user has reached the matrix.
    if (backToMatrixTimer !== null) clearTimeout(backToMatrixTimer);
    backToMatrixTimer = setTimeout(() => {
      backToMatrixTimer = null;
      calculationResults.clearSelectedCell();
      calculationResultsStore.set(calculationResults);
    }, 450);
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <link rel="canonical" href={pageUrl} />

  <!-- Open Graph / Social Meta Tags -->
  {@html renderWebsiteSocialMeta({
    url: pageUrl,
    title: pageTitle,
    description: pageDescription,
    image: pageImage,
    imageAlt: pageImageAlt,
  })}

  <!-- Structured Data -->
  {@html webAppSchema.render()}
  {@html strategyActionJsonLd}

  <link
    href="https://fonts.googleapis.com/css?family=Lato:400,700,900&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<Header active="Strategy" />

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
        class="stage-section"
        transition:slide={{ duration: 320, easing: cubicOut }}
      >
        <LockedSummary {recipients} {isSingle} {shareUrl} onedit={handleEdit} />
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
      class:is-hidden={tunableIsStuck && tunablePastWidget}
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
      {#if recomputeErrorMessage}
        <div class="limited-width">
          <p class="stale-banner" role="alert">{recomputeErrorMessage}</p>
        </div>
      {/if}
      {#if calculationResults.status() === CalculationStatus.Complete}
        <div class="limited-width" class:is-stale={recomputeErrorMessage}>
          <div class="hero-row">
            <OptimalStrategyHeadline
              {isSingle}
              singleResult={optimalSingleResult}
              coupleResult={optimalCoupleResult}
              {recipients}
              {hasFilingChoice}
              currentDate={currentMonthDate()}
            />
            <AdvisorPrompt />
          </div>
        </div>
        <div
          class="widget-anchor"
          bind:this={widgetAnchorEl}
        >
          {#if isSingle && !hasFilingChoice[0]}
            <div class="limited-width">
              <NoFilingDecisionPanel />
            </div>
          {:else if isSingle}
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
              {hasFilingChoice}
              bind:displayAsAges
              onselectcell={handleCellSelect}
            />
          {/if}
        </div>
        <div
          class="widget-end-sentinel"
          bind:this={widgetEndSentinelEl}
        ></div>
      {/if}
    </section>
    <section
      class="limited-width scenario-anchor"
      bind:this={scenarioAnchorEl}
    >
      {#if calculationResults.getSelectedCellData() && !isSingle}
        {#key calculationResults.getSelectedCellData()}
          <ScenarioDetail
            {recipients}
            result={calculationResults.getSelectedCellData()}
            {discountRate}
            bind:displayAsAges
            onBack={handleBackToMatrix}
          />
        {/key}
      {/if}
      {#if calculationResults.getSelectedCellData() && isSingle}
        {#key calculationResults.getSelectedCellData()}
          <ScenarioDetailSingle
            recipient={recipients[0]}
            result={calculationResults.getSelectedCellData()}
            {discountRate}
            bind:displayAsAges
            onBack={handleBackToMatrix}
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

  .stale-banner {
    margin: 0.75rem auto;
    padding: 0.7rem 0.95rem;
    background: #fef8ec;
    border: 1px solid #e8cf9a;
    color: #7a5606;
    border-radius: 6px;
    font-size: 0.9rem;
  }

  /* Dim figures that no longer match the inputs on screen, so they are not
     read as the answer to what the user just changed. */
  .limited-width.is-stale {
    opacity: 0.55;
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
    transition:
      box-shadow 0.15s ease,
      opacity 0.18s ease,
      transform 0.18s ease;
  }

  .tunable-sticky-outer.is-stuck {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  }

  /* Once the user has scrolled past the matrix/chart, the sliders no longer
     act on what's on screen — fade the bar out (but keep its placeholder so
     the page doesn't jump when the user scrolls back up). */
  .tunable-sticky-outer.is-stuck.is-hidden {
    opacity: 0;
    transform: translateY(-100%);
    pointer-events: none;
  }

  .widget-end-sentinel {
    height: 1px;
    width: 100%;
    margin-top: -1px;
    pointer-events: none;
  }

  .tunable-sticky-inner {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }

  .calculation-section {
    margin-top: 2rem;
  }

  .hero-row {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    align-items: center;
    margin: 0.75rem 0 1.75rem;
  }

  .hero-row :global(.headline),
  .hero-row :global(.advisor-prompt) {
    flex: 1 1 320px;
    min-width: 0;
    max-width: none;
    margin: 0;
  }

  /* Scroll-margin keeps the matrix and the scenario card clear of the sticky
     tunable bar when the user clicks a cell or hits "Back to matrix". */
  .widget-anchor,
  .scenario-anchor {
    scroll-margin-top: 96px;
  }

  @media (max-width: 768px) {
    main {
      max-width: 100%;
      padding: 1rem;
    }
  }
</style>
