<script lang="ts">
  import { MonthDuration } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import { strategySumPeriodsSingle } from "$lib/strategy/calculations/strategy-calc";
  import type { StrategyResult } from "$lib/strategy/ui";

  export let result: StrategyResult;
  export let recipient: Recipient;

  // Compute filing date from filing age
  $: filingDate = recipient.birthdate.dateAtLayAge(result.filingAge1);

  // Expected death age (probability-weighted modeled midpoint)
  $: expectedAge = result.bucket1.expectedAge;
  $: deathDate = recipient.birthdate.dateAtLayAge(expectedAge);

  // Calculate the benefit periods for the selected strategy
  $: finalDate = recipient.birthdate.dateAtLayAge(
    new MonthDuration(result.bucket1.midAge * 12)
  );

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

<div class="strategy-overview-container">
  <h3>Selected Strategy Overview</h3>

  <div class="strategy-summary">
    <table class="summary-table">
      <tbody>
        <tr>
          <td class="row-label">Filing</td>
          <td>{filingDate.toString()} ({result.filingAge1Years}y {result.filingAge1Months}m)</td>
        </tr>
        <tr>
          <td class="row-label">Death</td>
          <td>{deathDate.monthName()} {deathDate.year()} ({expectedAge.toAgeString()})</td>
        </tr>
      </tbody>
    </table>

    <div class="npv-display">
      <strong>Net Present Value: {result.totalBenefit.string()}</strong>
    </div>
  </div>

  <div class="payment-timeline">
    <h4>Payment Timeline</h4>

    {#if formattedPeriods.length === 0}
      <div class="no-benefits">No benefits</div>
    {:else}
      <div class="payment-periods">
        {#each formattedPeriods as period}
          <div class="payment-period">
            <div class="period-dates">
              {period.startFormatted} — {period.endFormatted}
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

<style>
  .strategy-overview-container {
    margin-top: 2rem;
    padding: 1.5rem;
    border: 1px solid #007bff;
    border-radius: 8px;
    background-color: #f8fbff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    max-width: 600px;
  }

  .strategy-overview-container h3 {
    color: #0056b3;
    margin: 0 0 1.5rem 0;
    text-align: center;
    font-size: 1.3rem;
  }

  .strategy-summary {
    margin-bottom: 2rem;
  }

  .summary-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
    font-size: 0.95rem;
  }

  .summary-table td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  .summary-table .row-label {
    font-weight: 600;
    color: #0056b3;
    background-color: #f8f9fa;
    border-right: 1px solid #e0e0e0;
    width: 40%;
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

  .payment-timeline h4 {
    color: #0056b3;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    border-bottom: 1px solid #d0d0d0;
    padding-bottom: 0.5rem;
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
    border-left: 3px solid #007bff;
    background-color: #f0f8ff;
    font-size: 0.9rem;
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

  @media (max-width: 768px) {
    .summary-table {
      font-size: 0.85rem;
    }

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
