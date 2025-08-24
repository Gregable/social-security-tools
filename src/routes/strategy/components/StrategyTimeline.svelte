<script lang="ts">
  import type { Recipient } from '$lib/recipient';
  import type { StrategyResult } from '$lib/strategy/ui';
  import { MonthDate, MonthDuration } from '$lib/month-time';
  import { strategySumPeriods, BenefitType } from '$lib/strategy/calculations/strategy-calc';
  import RecipientName from '$lib/components/RecipientName.svelte';

  export let result: StrategyResult;
  export let recipients: [Recipient, Recipient];

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

  $: benefitPeriods = strategySumPeriods(recipients, finalDates, strats);

  $: formattedPeriods = benefitPeriods.map((period) => ({
    type: getBenefitTypeString(period.benefitType),
    startFormatted: period.startDate.toString(),
    endFormatted: period.endDate.toString(),
    amount: period.amount.string(),
    recipient: period.recipientIndex,
  }));

  $: recipient1Periods = formattedPeriods.filter((p) => p.recipient === 0);
  $: recipient2Periods = formattedPeriods.filter((p) => p.recipient === 1);

  function getBenefitTypeString(benefitType: BenefitType): string {
    switch (benefitType) {
      case BenefitType.Personal:
        return 'Personal';
      case BenefitType.Spousal:
        return 'Spousal';
      case BenefitType.Survivor:
        return 'Survivor';
      default:
        return 'Unknown';
    }
  }
</script>

<div class="strategy-timeline-container">
  <h3>Payment Timeline</h3>
  <p class="timeline-description">
    This timeline shows when each recipient will receive benefits and the
    monthly payment amounts.
  </p>

  <div class="recipients-timeline">
    <!-- Recipient 1 Timeline -->
    <div class="recipient-timeline">
      <h4><RecipientName r={recipients[0]} /></h4>
      {#if recipient1Periods.length === 0}
        <div class="no-benefits">No benefits for this recipient</div>
      {:else}
        {#each recipient1Periods as period}
          <div class="timeline-period {period.type.toLowerCase()}">
            <div class="period-header">
              <span class="benefit-type">{period.type} Benefit</span>
              <span class="benefit-amount">{period.amount}/month</span>
            </div>
            <div class="period-dates">
              {period.startFormatted} - {period.endFormatted}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Recipient 2 Timeline -->
    <div class="recipient-timeline">
      <h4><RecipientName r={recipients[1]} /></h4>
      {#if recipient2Periods.length === 0}
        <div class="no-benefits">No benefits for this recipient</div>
      {:else}
        {#each recipient2Periods as period}
          <div class="timeline-period {period.type.toLowerCase()}">
            <div class="period-header">
              <span class="benefit-type">{period.type} Benefit</span>
              <span class="benefit-amount">{period.amount}/month</span>
            </div>
            <div class="period-dates">
              {period.startFormatted} - {period.endFormatted}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .strategy-timeline-container {
    margin-top: 2rem;
    padding: 1.5rem;
    border: 1px solid #28a745;
    border-radius: 8px;
    background-color: #f8fff9;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .strategy-timeline-container h3 {
    color: #155724;
    margin-top: 0;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .timeline-description {
    color: #666;
    font-size: 0.95rem;
    text-align: center;
    margin-bottom: 1.5rem;
    font-style: italic;
  }

  .recipients-timeline {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 768px) {
    .recipients-timeline {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  .recipient-timeline h4 {
    color: #155724;
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 2px solid #28a745;
    padding-bottom: 0.5rem;
    text-align: center;
  }

  .timeline-period {
    margin-bottom: 1rem;
    padding: 0.75rem;
    border-radius: 6px;
    border-left: 4px solid;
  }

  .timeline-period.personal {
    border-left-color: #007bff;
    background-color: #e7f3ff;
  }

  .timeline-period.spousal {
    border-left-color: #fd7e14;
    background-color: #fff3e0;
  }

  .timeline-period.survivor {
    border-left-color: #6f42c1;
    background-color: #f8f0ff;
  }

  .period-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .benefit-type {
    font-weight: bold;
    font-size: 0.9rem;
  }

  .personal .benefit-type {
    color: #0056b3;
  }

  .spousal .benefit-type {
    color: #cc5500;
  }

  .survivor .benefit-type {
    color: #5a2d91;
  }

  .benefit-amount {
    font-weight: bold;
    font-size: 1.1rem;
    color: #155724;
  }

  .period-dates {
    font-size: 0.85rem;
    color: #666;
    font-style: italic;
  }

  .no-benefits {
    text-align: center;
    color: #6c757d;
    font-style: italic;
    padding: 2rem;
    border: 2px dashed #dee2e6;
    border-radius: 6px;
    background-color: #f8f9fa;
  }
</style>
