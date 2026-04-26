<script lang="ts">
  import InfoTip from "$lib/components/InfoTip.svelte";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { Money } from "$lib/money";
  import type { MonthDuration } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import type {
    FilingAgeResult,
    CoupleFilingAgeResult,
  } from "$lib/strategy/calculations/expected-npv";

  interface Props {
    isSingle: boolean;
    singleResult?: FilingAgeResult;
    coupleResult?: CoupleFilingAgeResult;
    recipients: [Recipient, Recipient];
  }

  let { isSingle, singleResult, coupleResult, recipients }: Props = $props();

  function formatAge(age: MonthDuration): string {
    return age.toFullAgeString();
  }

  function formatFilingDateFull(
    recipient: Recipient,
    age: MonthDuration
  ): string {
    const date = recipient.birthdate.dateAtLayAge(age);
    return `${date.monthFullName()} ${date.year()}`;
  }

  function formatMoney(cents: number): string {
    return Money.fromCents(Math.round(cents)).wholeDollars();
  }
</script>

{#if (isSingle && singleResult) || (!isSingle && coupleResult)}
  <div class="headline" class:couple={!isSingle}>
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
      <span>Recommended filing{isSingle ? "" : " ages"}</span>
    </div>

    {#if isSingle && singleResult}
      <div class="result">
        <div class="prefix">File in</div>
        <div class="date-big">
          {formatFilingDateFull(recipients[0], singleResult.filingAge)}
        </div>
        <div class="age-sub">
          at age {formatAge(singleResult.filingAge)}
        </div>
      </div>
    {:else if coupleResult}
      <div class="couple-results">
        <div class="result">
          <div class="person-name">
            <RecipientName r={recipients[0]} />
          </div>
          <div class="prefix">File in</div>
          <div class="date-big">
            {formatFilingDateFull(recipients[0], coupleResult.filingAges[0])}
          </div>
          <div class="age-sub">
            at age {formatAge(coupleResult.filingAges[0])}
          </div>
        </div>
        <div class="divider" aria-hidden="true"></div>
        <div class="result">
          <div class="person-name">
            <RecipientName r={recipients[1]} />
          </div>
          <div class="prefix">File in</div>
          <div class="date-big">
            {formatFilingDateFull(recipients[1], coupleResult.filingAges[1])}
          </div>
          <div class="age-sub">
            at age {formatAge(coupleResult.filingAges[1])}
          </div>
        </div>
      </div>
    {/if}

    <div class="footer">
      <div class="npv-line">
        <span class="npv-label">
          Expected {isSingle ? "" : "combined "}lifetime benefit (NPV):
        </span>
        <strong class="npv-value">
          {#if isSingle && singleResult}
            {formatMoney(singleResult.expectedNPVCents)}
          {:else if coupleResult}
            {formatMoney(coupleResult.expectedNPVCents)}
          {/if}
        </strong>
        <InfoTip label="About expected NPV">
          The recommended strategy's expected lifetime benefits, weighted by
          each person's survival probability at every age and discounted to
          today's dollars at the rate set above. It updates as you tune
          health and discount rate.
        </InfoTip>
      </div>
      <p class="explanation">
        {#if isSingle}
          Maximizes your expected lifetime benefits, weighted by the
          probability of surviving to each age and adjusted for the discount
          rate.
        {:else}
          Maximizes your expected combined lifetime benefits, weighted by
          each person's probability of surviving to each age and adjusted for
          the discount rate.
        {/if}
      </p>
    </div>
  </div>
{/if}

<style>
  .headline {
    margin: 1.5rem auto 1.75rem;
    padding: 1.5rem 2rem 1.75rem;
    color: #060606;
    max-width: 720px;
    text-align: center;
    background: #f7f8fd;
    border-radius: 14px;
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

  .result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .prefix {
    font-size: 0.95rem;
    color: #6b7280;
    font-weight: 500;
  }

  .date-big {
    font-size: 3rem;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: #060606;
    margin: 0.15rem 0 0.35rem;
  }

  .age-sub {
    font-size: 1rem;
    color: #4b5563;
    font-weight: 500;
  }

  .couple-results {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1.25rem;
    margin-top: 0.3rem;
  }

  .couple-results .result {
    min-width: 0;
  }

  .couple-results .date-big {
    font-size: 1.85rem;
    white-space: nowrap;
  }

  .divider {
    width: 1px;
    height: 70%;
    background: #e5e7eb;
  }

  .person-name {
    font-size: 0.95rem;
    font-weight: 700;
    margin-bottom: 0.3rem;
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

  .npv-label {
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
    max-width: 52ch;
  }

  @media (max-width: 640px) {
    .date-big {
      font-size: 2.5rem;
    }
    .couple-results {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    .couple-results .date-big {
      font-size: 2rem;
    }
    .divider {
      width: 70%;
      height: 1px;
    }
  }
</style>
