<script lang="ts">
  import InfoTip from "$lib/components/InfoTip.svelte";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { Money } from "$lib/money";
  import type { MonthDate, MonthDuration } from "$lib/month-time";
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
    showInfoTip?: boolean;
    /**
     * Per recipient: false once filing immediately is their only remaining
     * option. Such a recipient gets a "file now" card rather than a filing
     * date, because the optimizer's answer for them is the most retroactive
     * month SSA allows — a month that has already passed, which under a
     * "File in" label reads as a bug rather than as advice.
     *
     * Required rather than defaulted: defaulting it to [true, true] would
     * silently reinstate that already-passed date for any caller that forgot
     * to pass it.
     */
    hasFilingChoice: [boolean, boolean];
    /**
     * The month the recommendation was computed for. Used to tell a filing
     * date that is still ahead from one that has already passed.
     */
    currentDate: MonthDate;
  }

  let {
    isSingle,
    singleResult,
    coupleResult,
    recipients,
    showInfoTip = true,
    hasFilingChoice,
    currentDate,
  }: Props = $props();

  /**
   * Whether the recommended filing month has already passed.
   *
   * SSA lets anyone past full retirement age file up to six months
   * retroactively, so the optimizer legitimately returns a month in the past
   * whenever filing sooner beats waiting — always once a recipient is past
   * 70, but also for a younger recipient at a high discount rate. Rendering
   * such a month under a "File in" label reads as a bug, so those cases get a
   * "File now" card naming the month to backdate to instead.
   */
  function isAlreadyPast(index: number, filingAge: MonthDuration): boolean {
    const filingDate = recipients[index].birthdate.dateAtSsaAge(filingAge);
    // Strictly before: a recommendation for the current month is "file this
    // month", with nothing to backdate, and reads correctly as a date.
    return filingDate.lessThan(currentDate);
  }

  function formatAge(age: MonthDuration): string {
    return age.toFullAgeString();
  }

  function formatFilingDateFull(
    recipient: Recipient,
    age: MonthDuration
  ): string {
    const date = recipient.birthdate.dateAtSsaAge(age);
    return `${date.monthFullName()} ${date.year()}`;
  }

  function formatFilingDateShort(
    recipient: Recipient,
    age: MonthDuration
  ): string {
    const date = recipient.birthdate.dateAtSsaAge(age);
    return `${date.monthName()} ${date.year()}`;
  }

  function formatMoney(cents: number): string {
    return Money.fromCents(Math.round(cents)).wholeDollars();
  }
</script>

{#snippet filingCard(index: number, filingAge: MonthDuration)}
  {#if isAlreadyPast(index, filingAge)}
    <div class="prefix">File</div>
    <div class="date-big">now</div>
    <div class="age-sub">
      {#if !hasFilingChoice[index]}
        Past 70, so the benefit has stopped growing.
      {/if}
      Ask SSA to backdate the claim to {formatFilingDateFull(
        recipients[index],
        filingAge
      )}; they can pay up to six months retroactively.
    </div>
  {:else}
    <div class="prefix">File in</div>
    <div class="date-big">
      <span class="date-full"
        >{formatFilingDateFull(recipients[index], filingAge)}</span
      >
      <span class="date-short"
        >{formatFilingDateShort(recipients[index], filingAge)}</span
      >
    </div>
    <div class="age-sub">at age {formatAge(filingAge)}</div>
  {/if}
{/snippet}

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
        {@render filingCard(0, singleResult.filingAge)}
      </div>
    {:else if coupleResult}
      <div class="couple-results">
        <div class="result">
          <div class="person-name">
            <RecipientName r={recipients[0]} />
          </div>
          {@render filingCard(0, coupleResult.filingAges[0])}
        </div>
        <div class="divider" aria-hidden="true"></div>
        <div class="result">
          <div class="person-name">
            <RecipientName r={recipients[1]} />
          </div>
          {@render filingCard(1, coupleResult.filingAges[1])}
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
        {#if showInfoTip}
          <InfoTip label="About expected NPV">
            The recommended strategy's expected lifetime benefits, weighted by
            each person's survival probability at every age and discounted to
            today's dollars at the rate set above. It updates as you tune
            health and discount rate.
          </InfoTip>
        {/if}
      </div>
      <p class="explanation">
        {#if isSingle && !hasFilingChoice[0]}
          Delayed retirement credits stop at 70, so the monthly amount is
          already at its maximum. Every further month of waiting is a payment
          forgone.
        {:else if isSingle}
          Maximizes your expected lifetime benefits, weighted by the
          probability of surviving to each age and adjusted for the discount
          rate.
        {:else}
          Maximizes your expected combined lifetime benefits, weighted by
          each person's probability of surviving to each age and adjusted for
          the discount rate.
        {/if}
        {#if !showInfoTip}
          Based on default assumptions — a 2.5% discount rate and blended life
          expectancy. Open the optimizer to adjust.
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

  @container (max-width: 440px) {
    .couple-results .date-full {
      display: none;
    }
    .couple-results .date-short {
      display: inline;
    }
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
