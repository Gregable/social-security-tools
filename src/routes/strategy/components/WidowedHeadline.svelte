<!--
  @component
  @name WidowedHeadline
  @description
    The widowed-mode recommendation: when to start the survivor benefit and
    when to start the survivor's own retirement benefit, in the order they
    start, with the expected lifetime benefit of the plan.
-->

<script lang="ts">
  import InfoTip from "$lib/components/InfoTip.svelte";
  import { Money } from "$lib/money";
  import {
    isClaimToMake,
    type OwnClaimAdvice,
    type WidowedRecommendation,
  } from "$lib/strategy/ui/widowed-advice";

  interface Props {
    recommendation: WidowedRecommendation;
  }

  let { recommendation }: Props = $props();

  interface Card {
    readonly title: string;
    readonly advice: OwnClaimAdvice;
    readonly otherIsLarger: string;
  }

  const survivorCard: Card = $derived({
    title: "Survivor benefit",
    advice: recommendation.survivor,
    otherIsLarger: "Your own retirement benefit is always the larger one.",
  });
  const ownCard: Card = $derived({
    title: "Your retirement benefit",
    advice: recommendation.own,
    otherIsLarger: "Your survivor benefit is always the larger one.",
  });
  // In the order they start, so "then" reads left to right.
  const cards: Card[] = $derived(
    recommendation.first === "own"
      ? [ownCard, survivorCard]
      : [survivorCard, ownCard]
  );
  const switches = $derived(
    recommendation.first === "survivor" || recommendation.first === "own"
  );
  // Nothing left to decide: each benefit has started, is not needed, or
  // does not exist.
  const decided = $derived(
    !isClaimToMake(recommendation.survivor) &&
      !isClaimToMake(recommendation.own)
  );

  function formatMonthFull(card: Card): string {
    const a = card.advice;
    if (a.kind !== "file-in" && a.kind !== "started") return "";
    return `${a.month.monthFullName()} ${a.month.year()}`;
  }

  function formatMonthShort(card: Card): string {
    const a = card.advice;
    if (a.kind !== "file-in" && a.kind !== "started") return "";
    return `${a.month.monthName()} ${a.month.year()}`;
  }

  function formatMoney(cents: number): string {
    return Money.fromCents(Math.round(cents)).wholeDollars();
  }
</script>

{#snippet card(c: Card)}
  {@const a = c.advice}
  <div class="person-name">{c.title}</div>
  {#if a.kind === "started"}
    <div class="prefix">Started</div>
    <div class="date-big">
      <span class="date-full">{formatMonthFull(c)}</span>
      <span class="date-short">{formatMonthShort(c)}</span>
    </div>
    <div class="age-sub">
      at age {a.age.toFullAgeString()}, about {a.amount.wholeDollars()} per month
      in today's dollars
    </div>
  {:else if a.kind === "file-now"}
    <div class="prefix">File</div>
    <div class="date-big">now</div>
    <div class="age-sub">
      Ask SSA to backdate the claim to {a.backdateTo.monthFullName()}
      {a.backdateTo.year()}; they can pay up to six months retroactively.
      About {a.amount.wholeDollars()} per month.
    </div>
  {:else if a.kind === "file-in"}
    <div class="prefix">File in</div>
    <div class="date-big">
      <span class="date-full">{formatMonthFull(c)}</span>
      <span class="date-short">{formatMonthShort(c)}</span>
    </div>
    <div class="age-sub">
      at age {a.age.toFullAgeString()}, about {a.amount.wholeDollars()} per month
      in today's dollars
    </div>
  {:else if a.kind === "not-needed"}
    <div class="date-big quiet">Not needed</div>
    <div class="age-sub">{c.otherIsLarger}</div>
  {:else if a.kind === "no-benefit"}
    <div class="date-big quiet">None</div>
    <div class="age-sub">There is no retirement benefit on your own record.</div>
  {/if}
{/snippet}

<div class="headline">
  <div class="kicker">
    <svg
      class="kicker-icon"
      viewBox="0 0 20 20"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      stroke-width="2.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="4 10 8 14 16 6" />
    </svg>
    <span>Recommended filing</span>
  </div>

  <div class="cards">
    <div class="result">
      {@render card(cards[0])}
    </div>
    <div class="divider" class:then={switches} aria-hidden={!switches}>
      {#if switches}<span class="then-label">then</span>{/if}
    </div>
    <div class="result">
      {@render card(cards[1])}
    </div>
  </div>

  <div class="footer">
    <div class="npv-line">
      <span class="npv-label">Expected lifetime benefit (NPV):</span>
      <strong class="npv-value"
        >{formatMoney(recommendation.expectedNPVCents)}</strong
      >
      <InfoTip label="About expected NPV">
        The recommended plan's expected lifetime benefits, weighted by your
        survival probability at every age and discounted to today's dollars at
        the rate set above. It updates as you tune health and discount rate.
      </InfoTip>
    </div>
    <p class="explanation">
      {#if decided}
        There is no start date left to decide: each benefit has either started
        or would not change your payments. The figure is the expected value of
        what is still to come.
      {:else if switches}
        Survivor benefits are exempt from deemed filing, so you can take one
        benefit first and switch to the other later. When you apply for the first
        one, ask SSA to restrict the application to that benefit, or it may be
        treated as an application for both. Once both are being paid, SSA pays
        whichever is larger.
      {:else}
        Maximizes your expected lifetime benefits, weighted by the probability
        of surviving to each age and adjusted for the discount rate.
      {/if}
    </p>
  </div>
</div>

<style>
  .headline {
    margin: 1.5rem auto 1.75rem;
    padding: 1.5rem 2rem 1.75rem;
    color: #060606;
    max-width: 720px;
    text-align: center;
    background: #f7f8fd;
    border-radius: 14px;
    container-type: inline-size;
  }

  .date-short {
    display: none;
  }

  .kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    color: #081d88;
    font-size: 0.92rem;
    font-weight: 800;
    letter-spacing: 0.16rem;
    text-transform: uppercase;
    margin-bottom: 1.4rem;
  }

  .kicker-icon {
    display: block;
    width: 16px;
    height: 16px;
    color: #081d88;
  }

  /* Top-aligned so the two titles line up when one card wraps further. */
  .cards {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: start;
    gap: 1.25rem;
    margin-top: 0.3rem;
  }

  .result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    min-width: 0;
  }

  .person-name {
    font-size: 0.95rem;
    font-weight: 700;
    margin-bottom: 0.3rem;
  }

  .prefix {
    font-size: 0.95rem;
    color: #6b7280;
    font-weight: 500;
  }

  .date-big {
    font-size: 1.85rem;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: #060606;
    margin: 0.15rem 0 0.35rem;
    white-space: nowrap;
  }

  .date-big.quiet {
    color: #4b5563;
  }

  .age-sub {
    font-size: 0.95rem;
    color: #4b5563;
    font-weight: 500;
  }

  .divider {
    align-self: stretch;
    width: 1px;
    background: #e5e7eb;
  }

  /* A plan that switches benefits reads as a sequence, not two choices. */
  .divider.then {
    align-self: center;
    width: auto;
    background: none;
  }

  .then-label {
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .footer {
    margin-top: 1.4rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .npv-line {
    display: inline-flex;
    align-items: baseline;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
    font-size: 0.95rem;
    color: #4b5563;
  }

  .npv-value {
    color: #060606;
    font-weight: 700;
  }

  .explanation {
    font-size: 0.78rem;
    color: #6b7280;
    margin: 0.5rem auto 0;
    line-height: 1.45;
    max-width: 56ch;
  }

  @container (max-width: 440px) {
    .date-full {
      display: none;
    }
    .date-short {
      display: inline;
    }
  }

  @media (max-width: 640px) {
    .cards {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    .date-big {
      font-size: 2rem;
    }
    .divider {
      width: 70%;
      height: 1px;
      justify-self: center;
    }
    .divider.then {
      width: auto;
    }
  }
</style>
