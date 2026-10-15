<!--
  @component
  @name ScenarioDetailWidowed
  @description
    The widowed-mode scenario card for one death age: the best plan for it,
    the payment timeline that plan produces, and what the common approaches
    are worth in comparison.
-->

<script lang="ts">
  import InfoTip from "$lib/components/InfoTip.svelte";
  import { Money } from "$lib/money";
  import type { MonthDuration } from "$lib/month-time";
  import { BenefitType } from "$lib/strategy/calculations/benefit-period";
  import { strategySumPeriodsWidowed } from "$lib/strategy/calculations/widowed-benefits";
  import type { WidowedContext } from "$lib/strategy/calculations/widowed-optimizer";
  import type { WidowedStrategyResult } from "$lib/strategy/ui";
  import { widowedAlternatives } from "$lib/strategy/ui/widowed-advice";

  export let context: WidowedContext;
  export let result: WidowedStrategyResult;
  export let displayAsAges: boolean = false;
  export let onBack: () => void;

  function formatProbability(prob: number | null | undefined): string {
    if (prob === null || prob === undefined) return "";
    return `${(prob * 100).toFixed(1)}%`;
  }

  $: survivor = context.survivor;
  $: expectedAge = result.bucket1.expectedAge;
  // The bucket's death age as a month: the death date the optimizer chose
  // and valued this plan for, so the timeline matches totalBenefit.
  $: deathDate = survivor.birthdate.dateAtLayAge(expectedAge);
  $: strategy = result.widowed.strategy;
  $: use = result.widowed.use;
  $: hasOwnRecord = survivor.pia().primaryInsuranceAmount().cents() > 0;

  $: periods = strategySumPeriodsWidowed(
    survivor,
    context.lateSpouse,
    deathDate,
    strategy
  ).map((period) => ({
    type:
      period.benefitType === BenefitType.Survivor
        ? "Survivor benefit"
        : "Your retirement benefit",
    survivorPaid: period.benefitType === BenefitType.Survivor,
    startFormatted: period.startDate.toString(),
    endFormatted: period.endDate.toString(),
    amount: period.amount.string(),
    annualAmount: period.amount.times(12).string(),
  }));

  $: alternatives = widowedAlternatives(context, deathDate).map((a) => ({
    ...a,
    delta: Money.fromCents(a.npvCents - result.totalBenefit.cents()),
  }));

  function formatStart(age: MonthDuration): string {
    if (displayAsAges) return `Age ${age.toFullAgeString()}`;
    const date = survivor.birthdate.dateAtSsaAge(age);
    return `${date.monthName()} ${date.year()}`;
  }

  /**
   * How a plan treats one benefit, in a few words. A benefit already
   * started is pinned to its real start age, so `age` is when it started.
   */
  function describe(
    used: boolean,
    age: MonthDuration,
    started: boolean,
    isOwn: boolean
  ): string {
    if (started) {
      return displayAsAges
        ? `Started at ${age.toFullAgeString()}`
        : `Started ${formatStart(age)}`;
    }
    if (isOwn && !hasOwnRecord) return "None on your record";
    if (survivor.birthdate.dateAtSsaAge(age).greaterThan(deathDate)) {
      return `${formatStart(age)}, not reached`;
    }
    return used ? formatStart(age) : "Not needed";
  }

  function formatDelta(delta: Money): string {
    const cents = delta.cents();
    if (Math.abs(cents) < 100) return "Same as best";
    return cents > 0 ? `+${delta.wholeDollars()}` : delta.wholeDollars();
  }
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
    Modeling: you die in
    <strong>{deathDate.monthName()} {deathDate.year()}</strong>
    (age {expectedAge.toAgeString()}{#if result.deathProb1 !== undefined},
      <span class="prob">{formatProbability(result.deathProb1)} chance</span
      >{/if})
  </p>

  <section class="filing-section">
    <h3 class="section-title">Best plan in this scenario</h3>
    <div class="filing-grid">
      <dl class="filing-summary">
        <div class="filing-row">
          <dt>Survivor benefit</dt>
          <dd>
            {describe(
              use.survivor,
              strategy.survivorStart,
              context.filed.survivor !== null,
              false
            )}
          </dd>
        </div>
        <div class="filing-row">
          <dt>Your retirement benefit</dt>
          <dd>
            {describe(
              use.own,
              strategy.ownStart,
              context.filed.own !== null,
              true
            )}
          </dd>
        </div>
      </dl>
      <div class="npv-card">
        <span class="npv-label">
          Net Present Value
          <InfoTip label="About net present value">
            This scenario's lifetime benefits expressed in today's dollars,
            using the discount rate above. A dollar in 10 years is worth less
            than a dollar today, and the discount rate captures that gap.
          </InfoTip>
        </span>
        <span class="npv-amount">{result.totalBenefit.string()}</span>
      </div>
    </div>

    <h4 class="subsection-title">Payment timeline</h4>
    {#if periods.length === 0}
      <div class="no-benefits">No benefits</div>
    {:else}
      <div class="payment-periods">
        {#each periods as period}
          <div class="payment-period" class:survivor={period.survivorPaid}>
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
      <p class="timeline-note">
        While both benefits are being paid, SSA pays your retirement benefit
        plus the amount by which the survivor benefit exceeds it, so you
        receive whichever is larger.
      </p>
    {/if}
  </section>

  {#if alternatives.length > 0}
    <section class="alternatives-section">
      <h3 class="section-title">Common approaches in this scenario</h3>
      <p class="section-lede">
        What other ways of starting the two benefits are worth if you die at
        this age, compared with the best plan above.
      </p>
      <table class="alternatives">
        <thead>
          <tr>
            <th scope="col">Survivor benefit</th>
            <th scope="col">Your retirement benefit</th>
            <th scope="col">Net present value</th>
            <th scope="col">vs best</th>
          </tr>
        </thead>
        <tbody>
          {#each alternatives as alternative}
            <tr>
              <td>
                {describe(
                  alternative.use.survivor,
                  alternative.strategy.survivorStart,
                  context.filed.survivor !== null,
                  false
                )}
              </td>
              <td>
                {describe(
                  alternative.use.own,
                  alternative.strategy.ownStart,
                  context.filed.own !== null,
                  true
                )}
              </td>
              <td>{Money.fromCents(alternative.npvCents).wholeDollars()}</td>
              <td class:loss={alternative.delta.cents() <= -100}>
                {formatDelta(alternative.delta)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}
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
    gap: 0.4rem;
    margin: 0;
  }

  .filing-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.75rem;
    align-items: baseline;
  }

  .filing-row dt {
    font-size: 0.85rem;
    color: #6b7280;
    min-width: 12rem;
  }

  .filing-row dd {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: #060606;
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
    border-left: 3px solid #005ea5;
    background: #f0f8ff;
    font-size: 0.88rem;
  }

  /* Matches the survivor-benefit line on the chart. */
  .payment-period.survivor {
    border-left-color: #0f8a63;
    background: #effaf5;
  }

  .period-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .benefit-type {
    font-weight: 600;
    color: #1f2937;
  }

  .period-dates {
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
    color: #1f2937;
  }

  .annual-amount {
    font-size: 0.78rem;
    color: #6c757d;
  }

  .timeline-note {
    margin: 0.6rem 0 0;
    font-size: 0.82rem;
    color: #6b7280;
    line-height: 1.45;
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

  .alternatives {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .alternatives th {
    text-align: left;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #6b7280;
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .alternatives td {
    padding: 0.5rem;
    border-bottom: 1px solid #f0f1f4;
    color: #1f2937;
  }

  .alternatives td.loss {
    color: #a1241a;
    font-weight: 600;
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

    .alternatives th,
    .alternatives td {
      padding: 0.4rem 0.3rem;
    }
  }
</style>
