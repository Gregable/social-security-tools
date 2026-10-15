<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import {
    anyFilingChoice,
    buildStrategyUrl,
    filingChoices,
  } from "$lib/components/recommended-filing-card";
  import { nothingToPlanProblem } from "$lib/strategy/ui/nothing-to-plan";
  import RecommendedFilingCard from "$lib/components/RecommendedFilingCard.svelte";

  export let recipient: Recipient;
  export let spouse: Recipient | null = null;

  $: strategyUrl = buildStrategyUrl(recipient, spouse);
  // The optimizer only shows health and discount-rate controls while someone
  // still has a filing age to choose, so the promo only offers them then.
  $: hasChoice = anyFilingChoice(spouse === null, filingChoices(recipient, spouse));
  // With no benefit at all the optimizer only says there is nothing to plan,
  // so the calculator does not send anyone there.
  $: nothingToPlan =
    nothingToPlanProblem(spouse ? "couple" : "single", [
      recipient.pia().primaryInsuranceAmount().value(),
      spouse ? spouse.pia().primaryInsuranceAmount().value() : null,
    ]) !== null;
</script>

{#if !nothingToPlan}
<div class="pageBreakAvoid">
  <h3 class="subheading">Strategy Optimizer</h3>
  <p class="promo-intro">
    {#if !hasChoice}
      The Strategy Optimizer shows when to file, and why.
    {:else if spouse}
      The Strategy Optimizer finds the filing ages with the highest expected
      combined lifetime benefit, and lets you explore how the answer shifts as
      you adjust each person's health and your discount-rate assumptions.
    {:else}
      The Strategy Optimizer finds the filing age with the highest expected
      lifetime benefit, and lets you explore how the answer shifts as you adjust
      your health and discount-rate assumptions.
    {/if}
  </p>
  <RecommendedFilingCard {recipient} {spouse} />
  <a class="cta-btn" href={strategyUrl}>
    Open Strategy Optimizer
    <svg
      class="arrow-icon"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  </a>
</div>
{/if}

<style>
  .subheading {
    margin: 0.75rem 0.5rem 0.4rem;
    font-size: 1rem;
    font-weight: 600;
    color: #0b0c0c;
  }

  .promo-intro {
    margin: 0 0.5rem 1rem;
    line-height: 1.5;
    color: #4b5563;
    font-size: 0.95rem;
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0 0.5rem;
    background: #081d88;
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 0.55rem 1rem;
    border-radius: 5px;
    transition: background 0.15s ease;
  }

  .cta-btn:hover,
  .cta-btn:focus-visible {
    background: #0a23a8;
    outline: none;
  }

  .cta-btn:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 3px;
  }

  .arrow-icon {
    flex-shrink: 0;
  }
</style>
