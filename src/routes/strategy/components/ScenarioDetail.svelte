<script lang="ts">
  import InfoTip from "$lib/components/InfoTip.svelte";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import type { MonthDate, MonthDuration } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import { BenefitType } from "$lib/strategy/calculations/benefit-period";
  import { strategySumPeriodsCouple } from "$lib/strategy/calculations/strategy-calc";
  import type { StrategyResult } from "$lib/strategy/ui";
  import AlternativeStrategiesGrid from "./AlternativeStrategiesGrid.svelte";

  export let recipients: [Recipient, Recipient];
  export let result: StrategyResult;
  export let discountRate: number;
  export let displayAsAges: boolean = false;
  export let onBack: () => void;

  function formatProbability(prob: number | null | undefined): string {
    if (prob === null || prob === undefined) return "";
    return `${(prob * 100).toFixed(1)}%`;
  }

  function getBenefitTypeString(benefitType: BenefitType): string {
    switch (benefitType) {
      case BenefitType.Personal:
        return "Personal";
      case BenefitType.Spousal:
        return "Spousal";
      case BenefitType.Survivor:
        return "Survivor";
      default:
        return "Unknown";
    }
  }

  $: filingDate1 = recipients[0].birthdate.dateAtLayAge(result.filingAge1);
  $: filingDate2 = recipients[1].birthdate.dateAtLayAge(result.filingAge2);
  $: expectedAge1 = result.bucket1.expectedAge;
  $: expectedAge2 = result.bucket2.expectedAge;
  $: deathDate1 = recipients[0].birthdate.dateAtLayAge(expectedAge1);
  $: deathDate2 = recipients[1].birthdate.dateAtLayAge(expectedAge2);

  // Use expectedAge (probability-weighted) so the timeline matches the death
  // dates the optimizer used to compute totalBenefit and choose filingAge1/2.
  $: finalDates = [
    recipients[0].birthdate.dateAtLayAge(result.bucket1.expectedAge),
    recipients[1].birthdate.dateAtLayAge(result.bucket2.expectedAge),
  ] as [MonthDate, MonthDate];

  $: strats = [result.filingAge1, result.filingAge2] as [
    MonthDuration,
    MonthDuration,
  ];

  $: benefitPeriods = strategySumPeriodsCouple(recipients, finalDates, strats);

  $: formattedPeriods = benefitPeriods.map((period) => ({
    type: getBenefitTypeString(period.benefitType),
    startDate: period.startDate,
    endDate: period.endDate,
    startFormatted: period.startDate.toString(),
    endFormatted: period.endDate.toString(),
    amount: period.amount.string(),
    annualAmount: period.amount.times(12).string(),
    recipient: period.recipientIndex,
    benefitType: period.benefitType,
  }));

  $: recipient1Periods = formattedPeriods
    .filter((p) => p.recipient === 0)
    .sort(
      (a, b) =>
        a.startDate.monthsSinceEpoch() - b.startDate.monthsSinceEpoch() ||
        a.endDate.monthsSinceEpoch() - b.endDate.monthsSinceEpoch()
    );

  $: recipient2Periods = formattedPeriods
    .filter((p) => p.recipient === 1)
    .sort(
      (a, b) =>
        a.startDate.monthsSinceEpoch() - b.startDate.monthsSinceEpoch() ||
        a.endDate.monthsSinceEpoch() - b.endDate.monthsSinceEpoch()
    );
</script>

<div class="scenario-card">
  <header class="section-header">
    <p class="section-kicker">Scenario detail</p>
    <button
      type="button"
      class="back-btn"
      on:click={onBack}
      aria-label="Back to matrix"
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
      Back to matrix
    </button>
  </header>
  <p class="scenario-summary">
    Modeling: <RecipientName r={recipients[0]} /> dies in
    <strong>{deathDate1.monthName()} {deathDate1.year()}</strong>
    (age {expectedAge1.toAgeString()}{#if result.deathProb1 !== undefined},
      <span class="prob">{formatProbability(result.deathProb1)} chance</span
      >{/if}) ·
    <RecipientName r={recipients[1]} /> dies in
    <strong>{deathDate2.monthName()} {deathDate2.year()}</strong>
    (age {expectedAge2.toAgeString()}{#if result.deathProb2 !== undefined},
      <span class="prob">{formatProbability(result.deathProb2)} chance</span
      >{/if})
  </p>

  <section class="filing-section">
    <h3 class="section-title">Optimal filing in this scenario</h3>
    <div class="filing-grid">
      <div class="filing-summary">
        <div class="filing-person">
          <p class="person-name"><RecipientName r={recipients[0]} /></p>
          <p class="filing-age">{result.filingAge1.toFullAgeString()}</p>
          <p class="filing-date">{filingDate1.toString()}</p>
        </div>
        <div class="filing-person">
          <p class="person-name"><RecipientName r={recipients[1]} /></p>
          <p class="filing-age">{result.filingAge2.toFullAgeString()}</p>
          <p class="filing-date">{filingDate2.toString()}</p>
        </div>
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
    <div class="recipients-payments">
      <div class="recipient-payments">
        <h5><RecipientName r={recipients[0]} /></h5>
        {#if recipient1Periods.length === 0}
          <div class="no-benefits">No benefits</div>
        {:else}
          <div class="payment-periods">
            {#each recipient1Periods as period}
              <div class="payment-period {period.type.toLowerCase()}">
                <div class="period-info">
                  <span class="benefit-type">{period.type}</span>
                  <span class="period-dates"
                    >{period.startFormatted} – {period.endFormatted}</span
                  >
                </div>
                <div class="benefit-amounts">
                  <span class="monthly-amount">{period.amount}/mo</span>
                  <span class="annual-amount">{period.annualAmount}/yr</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      <div class="recipient-payments">
        <h5><RecipientName r={recipients[1]} /></h5>
        {#if recipient2Periods.length === 0}
          <div class="no-benefits">No benefits</div>
        {:else}
          <div class="payment-periods">
            {#each recipient2Periods as period}
              <div class="payment-period {period.type.toLowerCase()}">
                <div class="period-info">
                  <span class="benefit-type">{period.type}</span>
                  <span class="period-dates"
                    >{period.startFormatted} – {period.endFormatted}</span
                  >
                </div>
                <div class="benefit-amounts">
                  <span class="monthly-amount">{period.amount}/mo</span>
                  <span class="annual-amount">{period.annualAmount}/yr</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </section>

  <section class="alternatives-section">
    <h3 class="section-title">Other filing combinations in this scenario</h3>
    <p class="section-lede">
      Each cell is one filing-age combination. Color shows how its NPV
      compares to the optimal (green) all the way to a poor outcome (red).
      Hover or tap any cell to see the dollar gap from the optimal strategy.
    </p>
    <AlternativeStrategiesGrid
      {recipients}
      deathAge1={result.bucket1.expectedAge}
      deathAge2={result.bucket2.expectedAge}
      {discountRate}
      optimalNPV={result.totalBenefit}
      optimalFilingAges={[result.filingAge1, result.filingAge2]}
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  .filing-person {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .person-name {
    margin: 0 0 0.25rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: #1f2937;
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

  .recipients-payments {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  .recipient-payments h5 {
    margin: 0 0 0.5rem 0;
    color: #1f2937;
    font-size: 0.9rem;
    font-weight: 600;
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
    border-left: 3px solid;
    font-size: 0.88rem;
  }

  .payment-period.personal {
    border-left-color: #007bff;
    background-color: #f0f8ff;
  }

  .payment-period.spousal {
    border-left-color: #fd7e14;
    background-color: #fff8f0;
  }

  .payment-period.survivor {
    border-left-color: #6f42c1;
    background-color: #f8f5ff;
  }

  .period-info {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .benefit-type {
    font-weight: 600;
    color: #333;
  }

  .period-dates {
    font-size: 0.78rem;
    color: #666;
    margin-top: 0.15rem;
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

    .filing-summary {
      grid-template-columns: 1fr;
    }

    .npv-card {
      min-width: auto;
    }

    .recipients-payments {
      grid-template-columns: 1fr;
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
