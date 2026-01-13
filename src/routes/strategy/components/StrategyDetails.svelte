<script lang="ts">
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { MonthDate, MonthDuration } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import { BenefitType } from "$lib/strategy/calculations/benefit-period";
  import { strategySumPeriodsCouple } from "$lib/strategy/calculations/strategy-calc";
  import type { StrategyResult } from "$lib/strategy/ui";

  export let result: StrategyResult;
  export let recipients: [Recipient, Recipient];

  // Format probability for display (as percentage with 2 decimal places)
  function formatProbability(prob: number | null): string {
    if (prob === null) return "Unknown";
    return `${(prob * 100).toFixed(2)}%`;
  }

  // Compute filing dates from filing ages
  $: filingDate1 = recipients[0].birthdate.dateAtLayAge(result.filingAge1);
  $: filingDate2 = recipients[1].birthdate.dateAtLayAge(result.filingAge2);

  // Expected death ages (probability-weighted modeled midpoint) are always defined.
  $: expectedAge1 = result.bucket1.expectedAge;
  $: expectedAge2 = result.bucket2.expectedAge;
  $: deathDate1 = recipients[0].birthdate.dateAtLayAge(expectedAge1);
  $: deathDate2 = recipients[1].birthdate.dateAtLayAge(expectedAge2);

  // Calculate the benefit periods for the selected strategy
  $: finalDates = [
    recipients[0].birthdate.dateAtLayAge(
      new MonthDuration(result.bucket1.midAge * 12)
    ),
    recipients[1].birthdate.dateAtLayAge(
      new MonthDuration(result.bucket2.midAge * 12)
    ),
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
    .sort((a, b) => {
      // Sort by start date first
      const startComparison =
        a.startDate.monthsSinceEpoch() - b.startDate.monthsSinceEpoch();
      if (startComparison !== 0) {
        return startComparison;
      }
      // If start dates are equal, sort by end date
      return a.endDate.monthsSinceEpoch() - b.endDate.monthsSinceEpoch();
    });

  $: recipient2Periods = formattedPeriods
    .filter((p) => p.recipient === 1)
    .sort((a, b) => {
      // Sort by start date first
      const startComparison =
        a.startDate.monthsSinceEpoch() - b.startDate.monthsSinceEpoch();
      if (startComparison !== 0) {
        return startComparison;
      }
      // If start dates are equal, sort by end date
      return a.endDate.monthsSinceEpoch() - b.endDate.monthsSinceEpoch();
    });

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
</script>

<div class="strategy-overview-container">
  <h3>Selected Strategy Overview</h3>

  <!-- High-density strategy summary table -->
  <div class="strategy-summary">
    <table class="summary-table">
      <thead>
        <tr>
          <th></th>
          <th><RecipientName r={recipients[0]} /></th>
          <th><RecipientName r={recipients[1]} /></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="row-label">Filing</td>
          <td>{filingDate1.toString()} ({result.filingAge1Years}y {result.filingAge1Months}m)</td>
          <td>{filingDate2.toString()} ({result.filingAge2Years}y {result.filingAge2Months}m)</td>
        </tr>
        <tr>
          <td class="row-label">Death</td>
          <td>
            {deathDate1.monthName()} {deathDate1.year()} ({expectedAge1.toAgeString()})
            {#if result.deathProb1 !== undefined}
              <span class="probability"
                >{formatProbability(result.deathProb1 ?? null)}</span
              >
            {/if}
          </td>
          <td>
            {deathDate2.monthName()} {deathDate2.year()} ({expectedAge2.toAgeString()})
            {#if result.deathProb2 !== undefined}
              <span class="probability"
                >{formatProbability(result.deathProb2 ?? null)}</span
              >
            {/if}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="npv-display">
      <strong>Net Present Value: {result.totalBenefit.string()}</strong>
    </div>
  </div>

  <!-- Compact payment timeline -->
  <div class="payment-timeline">
    <h4>Payment Timeline</h4>

    <div class="recipients-payments">
      <!-- Recipient 1 Payments -->
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
                    >{period.startFormatted} — {period.endFormatted}</span
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

      <!-- Recipient 2 Payments -->
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
                    >{period.startFormatted} — {period.endFormatted}</span
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
  </div>
</div>

<style>
  .strategy-overview-container {
    margin-top: 2rem;
    padding: 1.5rem;
    border: 1px solid #007bff;
    border-radius: 8px;
    background-color: #f8fbff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .strategy-overview-container h3 {
    color: #0056b3;
    margin: 0 0 1.5rem 0;
    text-align: center;
    font-size: 1.3rem;
  }

  /* Strategy Summary Table */
  .strategy-summary {
    margin-bottom: 2rem;
  }

  .summary-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
    font-size: 0.95rem;
  }

  .summary-table th,
  .summary-table td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  .summary-table th {
    background-color: #e9ecef;
    font-weight: bold;
    color: #495057;
    text-align: center;
  }

  .summary-table .row-label {
    font-weight: 600;
    color: #0056b3;
    background-color: #f8f9fa;
    border-right: 1px solid #e0e0e0;
  }

  .summary-table td:not(.row-label) {
    text-align: center;
  }

  .probability {
    font-size: 0.8rem;
    color: #6c757d;
  }

  .npv-display {
    text-align: center;
    padding: 1rem;
    background-color: #e7f3ff;
    border: 1px solid #b3d9ff;
    border-radius: 6px;
    font-size: 1.1rem;
    color: #0056b3;
  }

  /* Payment Timeline */
  .payment-timeline h4 {
    color: #0056b3;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    border-bottom: 1px solid #d0d0d0;
    padding-bottom: 0.5rem;
  }

  .recipients-payments {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .recipient-payments h5 {
    margin: 0 0 0.75rem 0;
    color: #495057;
    font-size: 1rem;
    font-weight: 600;
  }

  .payment-periods {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .payment-period {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    border-left: 3px solid;
    font-size: 0.9rem;
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
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.2rem;
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
    font-size: 0.8rem;
    color: #6c757d;
  }

  .no-benefits {
    text-align: center;
    color: #6c757d;
    font-style: italic;
    padding: 1rem;
    border: 1px dashed #dee2e6;
    border-radius: 4px;
    background-color: #f8f9fa;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .recipients-payments {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .summary-table {
      font-size: 0.85rem;
    }

    .summary-table th,
    .summary-table td {
      padding: 0.4rem 0.5rem;
    }

    .payment-period {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .benefit-amounts {
      align-items: flex-start;
      text-align: left;
    }
  }
</style>
