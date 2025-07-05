<script lang="ts">
  import type { MonthDate } from "$lib/month-time";
  import type { Money } from "$lib/money";
  import type { Recipient } from "$lib/recipient";
  import RecipientName from "$lib/components/RecipientName.svelte";

  export let deathAge1: number;
  export let deathAge2: number;
  export let filingAge1Years: number;
  export let filingAge1Months: number;
  export let filingDate1: MonthDate;
  export let filingAge2Years: number;
  export let filingAge2Months: number;
  export let filingDate2: MonthDate;
  export let netPresentValue: Money;
  export let recipients: [Recipient, Recipient];

  // Optional death probability fields (may be available from calculationResults)
  export let deathProb1: number | null = null;
  export let deathProb2: number | null = null;

  // Format probability for display (as percentage with 2 decimal places)
  function formatProbability(prob: number | null): string {
    if (prob === null) return "Unknown";
    return (prob * 100).toFixed(2) + "%";
  }
</script>

<div class="strategy-details-container">
  <h3>Selected Strategy Details</h3>
  <div class="detail-item">
    <strong><RecipientName r={recipients[0]} apos /> Death Age:</strong>
    {deathAge1}
    {#if deathProb1 !== null}
      <span class="probability-badge">
        Probability: {formatProbability(deathProb1)}
      </span>
    {/if}
  </div>
  <div class="detail-item">
    <strong><RecipientName r={recipients[1]} apos /> Death Age:</strong>
    {deathAge2}
    {#if deathProb2 !== null}
      <span class="probability-badge">
        Probability: {formatProbability(deathProb2)}
      </span>
    {/if}
  </div>
  <h4><RecipientName r={recipients[0]} apos /> Filing Strategy</h4>
  <div class="detail-item">
    <strong>Age:</strong>
    {filingAge1Years} years, {filingAge1Months} months
  </div>
  <div class="detail-item">
    <strong>Date:</strong>
    {filingDate1.toString()}
  </div>

  <h4><RecipientName r={recipients[1]} apos /> Filing Strategy</h4>
  <div class="detail-item">
    <strong>Age:</strong>
    {filingAge2Years} years, {filingAge2Months} months
  </div>
  <div class="detail-item">
    <strong>Date:</strong>
    {filingDate2.toString()}
  </div>

  <div class="detail-item total-npv">
    <strong>Net Present Value:</strong>
    {netPresentValue.string()}
  </div>
</div>

<style>
  .strategy-details-container h4 {
    color: #0056b3;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #a0c8f7;
    padding-bottom: 0.3rem;
  }

  .total-npv {
    margin-top: 1.5rem;
    font-size: 1.2rem;
    font-weight: bold;
    color: #003366;
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid #a0c8f7;
  }
  .strategy-details-container {
    margin-top: 2rem;
    padding: 1.5rem;
    border: 1px solid #007bff;
    border-radius: 8px;
    background-color: #e6f3ff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .strategy-details-container h3 {
    color: #0056b3;
    margin-top: 0;
    margin-bottom: 1rem;
    text-align: center;
  }

  .detail-item {
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
    color: #333;
  }

  .detail-item strong {
    color: #003366;
  }

  .probability-badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 6px;
    font-size: 0.85rem;
    background-color: #007bff;
    color: white;
    border-radius: 4px;
  }
</style>
