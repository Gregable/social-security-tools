<script lang="ts">
  import { Money } from "$lib/money";
  import type { MonthDuration } from "$lib/month-time";
  import type {
    FilingAgeResult,
    CoupleFilingAgeResult,
  } from "$lib/strategy/calculations/expected-npv";

  interface Props {
    isSingle: boolean;
    singleResult?: FilingAgeResult;
    coupleResult?: CoupleFilingAgeResult;
    recipientNames: [string, string];
  }

  let { isSingle, singleResult, coupleResult, recipientNames }: Props =
    $props();

  function formatAge(age: MonthDuration): string {
    const years = age.years();
    const months = age.modMonths();
    if (months === 0) return `${years}`;
    return `${years}y ${months}m`;
  }

  function formatMoney(cents: number): string {
    return Money.fromCents(Math.round(cents)).string();
  }
</script>

{#if isSingle && singleResult}
  <div class="headline">
    <h3>Recommended Filing Age</h3>
    <p class="recommendation">
      File at age <strong>{formatAge(singleResult.filingAge)}</strong>
    </p>
    <p class="npv">
      Expected lifetime benefit (NPV):
      <strong>{formatMoney(singleResult.expectedNPVCents)}</strong>
    </p>
  </div>
{:else if !isSingle && coupleResult}
  <div class="headline">
    <h3>Recommended Filing Ages</h3>
    <p class="recommendation">
      {recipientNames[0]}: file at age
      <strong>{formatAge(coupleResult.filingAges[0])}</strong>
      &nbsp;/&nbsp;
      {recipientNames[1]}: file at age
      <strong>{formatAge(coupleResult.filingAges[1])}</strong>
    </p>
    <p class="npv">
      Expected combined lifetime benefit (NPV):
      <strong>{formatMoney(coupleResult.expectedNPVCents)}</strong>
    </p>
  </div>
{/if}

<style>
  .headline {
    margin: 1rem auto;
    padding: 1rem 1.5rem;
    border: 2px solid #2a7ae2;
    border-radius: 8px;
    background: #f0f7ff;
    max-width: 600px;
    text-align: center;
  }

  .headline h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    color: #333;
  }

  .recommendation {
    font-size: 1.25rem;
    margin: 0.25rem 0;
  }

  .npv {
    font-size: 0.95rem;
    color: #555;
    margin: 0.25rem 0 0 0;
  }
</style>
