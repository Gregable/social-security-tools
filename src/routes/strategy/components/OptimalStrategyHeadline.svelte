<script lang="ts">
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { Money } from "$lib/money";
  import { MonthDuration } from "$lib/month-time";
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
    const years = age.years();
    const months = age.modMonths();
    if (months === 0) return `${years}`;
    return `${years}y ${months}m`;
  }

  function formatFilingDateFull(
    recipient: Recipient,
    age: MonthDuration
  ): string {
    const date = recipient.birthdate.dateAtLayAge(age);
    return `${date.monthFullName()} ${date.year()}`;
  }

  function formatMoney(cents: number): string {
    return Money.fromCents(Math.round(cents)).string();
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
    margin: 0.5rem auto 1.5rem;
    padding: 1.25rem 2rem 1.1rem;
    border-radius: 14px;
    background: #ffffff;
    color: #060606;
    max-width: 720px;
    text-align: center;
    border: 1px solid #e5e7eb;
    box-shadow:
      0 2px 6px rgba(11, 17, 48, 0.06),
      0 18px 36px -16px rgba(11, 17, 48, 0.22);
  }

  .kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: #081d88;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14rem;
    text-transform: uppercase;
    margin-bottom: 1.1rem;
  }

  .kicker-icon {
    display: block;
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
    font-size: 2.25rem;
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
    font-size: 0.9rem;
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
    .headline {
      padding: 1.5rem 1.25rem 1.25rem;
    }
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
