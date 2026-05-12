<script lang="ts">
  import InfoTip from "$lib/components/InfoTip.svelte";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import type { Recipient } from "$lib/recipient";
  import { strategySumPeriodsSingle } from "$lib/strategy/calculations/strategy-calc";
  import type { StrategyResult } from "$lib/strategy/ui";
  import AlternativeStrategiesRow from "./AlternativeStrategiesRow.svelte";

  export let recipient: Recipient;
  export let result: StrategyResult;
  export let discountRate: number;
  export let displayAsAges: boolean = false;
  export let onBack: () => void;

  function formatProbability(prob: number | null | undefined): string {
    if (prob === null || prob === undefined) return "";
    return `${(prob * 100).toFixed(1)}%`;
  }

  $: filingDate = recipient.birthdate.dateAtSsaAge(result.filingAge1);
  $: expectedAge = result.bucket1.expectedAge;
  $: deathDate = recipient.birthdate.dateAtLayAge(expectedAge);

  // Use expectedAge (probability-weighted) so the timeline matches the death
  // date the optimizer used to compute totalBenefit and choose filingAge1.
  $: finalDate = recipient.birthdate.dateAtLayAge(result.bucket1.expectedAge);

  $: benefitPeriods = strategySumPeriodsSingle(
    recipient,
    finalDate,
    result.filingAge1
  );

  $: formattedPeriods = benefitPeriods.map((period) => ({
    startFormatted: period.startDate.toString(),
    endFormatted: period.endDate.toString(),
    amount: period.amount.string(),
    annualAmount: period.amount.times(12).string(),
  }));
</script>

<div class="scenario-card">
  <header class="section-header">
    <p class="section-kicker">Scenario detail</p>
    <button
      type="button"
      class="back-btn"
      on:click={onBack}
      aria-label="Back to chart"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      Back to chart
    </button>
  </header>
  <p class="scenario-summary">
    Modeling: <RecipientName r={recipient} apos>You</RecipientName> die in
    <strong>{deathDate.monthName()} {deathDate.year()}</strong>
    (age {expectedAge.toAgeString()}{#if result.deathProb1 !== undefined},
      <span class="prob">{formatProbability(result.deathProb1)} chance</span
      >{/if})
  </p>

  <section class="filing-section">
    <h3 class="section-title">Optimal filing in this scenario</h3>
    <div class="filing-grid">
      <div class="filing-summary">
        <p class="filing-age">{result.filingAge1.toFullAgeString()}</p>
        <p class="filing-date">{filingDate.toString()}</p>
      </div>
      <div class="npv-card">
        <span class="npv-label">
          Net Present Value
          <InfoTip label="About expected NPV">
            This scenario's lifetime benefits expressed in today's dollars,
            using the discount rate above. A dollar in 10 years is worth less
            than a dollar today, and the discount rate captures that gap.
          </InfoTip>
        </span>
        <span class="npv-amount">{result.totalBenefit.string()}</span>
      </div>
    </div>

    <h4 class="subsection-title">Payment timeline</h4>
    {#if formattedPeriods.length === 0}
      <div class="no-benefits">No benefits</div>
    {:else}
      <div class="payment-periods">
        {#each formattedPeriods as period}
          <div class="payment-period">
            <div class="period-dates">
              {period.startFormatted} – {period.endFormatted}
            </div>
            <div class="benefit-amounts">
              <span class="monthly-amount">{period.amount}/mo</span>
              <span class="annual-amount">{period.annualAmount}/yr</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section class="alternatives-section">
    <h3 class="section-title">Other filing ages in this scenario</h3>
    <p class="section-lede">
      Each box is one filing age. Numbers show the dollar gap from the
      optimal strategy at this death age. Color shifts from green
      (close to optimal) to red (significant loss).
    </p>
    <AlternativeStrategiesRow
      {recipient}
      deathAge={result.bucket1.expectedAge}
      {discountRate}
      optimalNPV={result.totalBenefit}
      optimalFilingAge={result.filingAge1}
      {displayAsAges}
    />
  </section>
</div>

<style>
  .scenario-card {
    margin-top: 2rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding-bottom: 0.5rem;
    margin-bottom: 0.6rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-kicker {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .scenario-summary {
    margin: 0 0 1.25rem;
    font-size: 1rem;
    line-height: 1.5;
    color: #1f2937;
  }

  .scenario-summary strong {
    color: #081d88;
    font-weight: 700;
  }

  .scenario-summary .prob {
    color: #6b7280;
    font-size: 0.85rem;
  }

  .back-btn {
    flex: 0 0 auto;
    background: transparent;
    border: none;
    color: #4b5563;
    padding: 0.25rem 0.4rem;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    transition: color 0.15s ease;
  }

  .back-btn:hover,
  .back-btn:focus-visible {
    color: #081d88;
    outline: none;
  }

  .back-btn:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 2px;
  }

  .filing-section {
    margin-bottom: 1.5rem;
  }

  .section-title {
    margin: 0 0 0.75rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: #060606;
  }

  .section-lede {
    margin: 0 0 1rem;
    font-size: 0.9rem;
    color: #4b5563;
    line-height: 1.5;
  }

  .filing-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1.25rem;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .filing-summary {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .filing-age {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #060606;
  }

  .filing-date {
    margin: 0;
    font-size: 0.85rem;
    color: #6b7280;
  }

  .npv-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.9rem 1.4rem;
    background: #f0f4ff;
    border: 1px solid #d6dffb;
    border-radius: 8px;
    min-width: 200px;
  }

  .npv-label {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: #4b4b4b;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .npv-amount {
    margin-top: 0.15rem;
    font-size: 1.4rem;
    font-weight: 800;
    color: #081d88;
    line-height: 1.1;
  }

  .subsection-title {
    margin: 0.25rem 0 0.6rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: #1f2937;
  }

  .payment-periods {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .payment-period {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.45rem 0.65rem;
    border-radius: 4px;
    border-left: 3px solid #007bff;
    background: #f0f8ff;
    font-size: 0.88rem;
  }

  .period-dates {
    font-weight: 500;
    color: #333;
  }

  .benefit-amounts {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
  }

  .monthly-amount {
    font-weight: 600;
    color: #0056b3;
  }

  .annual-amount {
    font-size: 0.78rem;
    color: #6c757d;
  }

  .no-benefits {
    text-align: center;
    color: #6c757d;
    font-style: italic;
    padding: 1rem;
    border: 1px dashed #dee2e6;
    border-radius: 4px;
    background: #f8f9fa;
  }

  @media (max-width: 768px) {
    .filing-grid {
      grid-template-columns: 1fr;
    }

    .npv-card {
      min-width: auto;
    }

    .payment-period {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.35rem;
    }

    .benefit-amounts {
      align-items: flex-start;
      text-align: left;
    }
  }
</style>
