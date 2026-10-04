<script lang="ts">
  import { benefitAtAge } from "$lib/benefit-calculator";
  import InfoTip from "$lib/components/InfoTip.svelte";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import {
    DEFAULT_DISCOUNT_RATE_ASSUMPTION,
    type DiscountRateAssumption,
    formatDiscountRatePercent,
  } from "$lib/components/recommended-filing-card";
  import { Money } from "$lib/money";
  import type { MonthDate, MonthDuration } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import {
    type AlreadyFiled,
    isEligibleToHaveFiled,
    NOT_FILED,
  } from "$lib/strategy/calculations/already-filed";
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
     * The discount rate the result was computed with. Only shown when the
     * info tip is hidden (the calculator card), where the surrounding page
     * has no rate input to point at.
     */
    discountRateAssumption?: DiscountRateAssumption;
    /**
     * Per recipient: false once filing immediately is their only remaining
     * option. Such a recipient gets a "file now" card rather than a filing
     * date, because the optimizer's answer for them is the most retroactive
     * month SSA allows — a month that has already passed, which under a
     * "File in" label reads as a bug rather than as advice.
     *
     * Also false for a recipient who has already filed. They get the
     * "Started benefits" card instead, because `alreadyFiled` takes
     * precedence in the snippet.
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
    /**
     * Per recipient, the month benefits actually started, or null. A filed
     * recipient's card states that as a fact instead of a recommendation.
     */
    alreadyFiled?: AlreadyFiled;
    /**
     * Called when the viewer clicks "Already receiving benefits?" on the
     * card of an eligible recipient who was not marked as filed. When
     * omitted (the calculator card, and single mode), no hint is shown.
     */
    onAlreadyFiledHint?: () => void;
  }

  let {
    isSingle,
    singleResult,
    coupleResult,
    recipients,
    showInfoTip = true,
    discountRateAssumption = DEFAULT_DISCOUNT_RATE_ASSUMPTION,
    hasFilingChoice,
    currentDate,
    alreadyFiled = NOT_FILED,
    onAlreadyFiledHint,
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

  /**
   * The filed recipient's own monthly benefit at their actual filing age, in
   * today's dollars, so it matches every other amount on the page. Any
   * spousal top-up is not included. Null for a zero-PIA recipient: what
   * they receive is a spousal benefit that this card does not compute, and
   * "about $0 per month" would read as a bug.
   */
  function filedAmount(index: number, filedAt: MonthDate): string | null {
    const age = recipients[index].birthdate.ageAtSsaDate(filedAt);
    const amount = benefitAtAge(recipients[index], age);
    return amount.cents() > 0 ? amount.wholeDollars() : null;
  }

  function filedAge(index: number, filedAt: MonthDate): string {
    return recipients[index].birthdate.ageAtSsaDate(filedAt).toFullAgeString();
  }

  function showFiledHint(index: number): boolean {
    return (
      onAlreadyFiledHint !== undefined &&
      alreadyFiled[index] === null &&
      isEligibleToHaveFiled(recipients[index].birthdate, currentDate)
    );
  }
</script>

{#snippet filingCard(index: number, filingAge: MonthDuration)}
  {@const filedAt = alreadyFiled[index]}
  {#if filedAt !== null}
    <div class="prefix">Started benefits</div>
    <div class="date-big">
      <span class="date-full">{filedAt.monthFullName()} {filedAt.year()}</span>
      <span class="date-short">{filedAt.monthName()} {filedAt.year()}</span>
    </div>
    {@const amount = filedAmount(index, filedAt)}
    <div class="age-sub">
      at age {filedAge(index, filedAt)}{#if amount !== null}, about {amount} per
        month from your own record, in today's dollars{/if}
    </div>
  {:else if isAlreadyPast(index, filingAge)}
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
  {#if showFiledHint(index)}
    <button type="button" class="filed-hint" onclick={onAlreadyFiledHint}>
      Already receiving benefits? Update your details
    </button>
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
        {:else if alreadyFiled[0] !== null && alreadyFiled[1] !== null}
          You are both already receiving benefits, so there is no filing
          decision left here. The figure is the expected value of what is
          still to come.
        {:else if alreadyFiled[0] !== null || alreadyFiled[1] !== null}
          Maximizes your expected combined lifetime benefits, taking
          <RecipientName r={recipients[alreadyFiled[0] !== null ? 0 : 1]} />'s
          filing date as given and weighting by each person's probability of
          surviving to each age, adjusted for the discount rate.
        {:else}
          Maximizes your expected combined lifetime benefits, weighted by
          each person's probability of surviving to each age and adjusted for
          the discount rate.
        {/if}
        {#if !showInfoTip}
          {#if discountRateAssumption.source === "treasury"}
            Based on the current 20-year Treasury rate ({formatDiscountRatePercent(
              discountRateAssumption.rate
            )}) as the discount rate and blended life expectancy. Open the
            optimizer to adjust.
          {:else}
            Based on default assumptions — a {formatDiscountRatePercent(
              discountRateAssumption.rate
            )} discount rate and blended life expectancy. Open the optimizer
            to adjust.
          {/if}
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

  .filed-hint {
    margin-top: 0.5rem;
    padding: 0;
    border: none;
    background: none;
    color: #3b4a9f;
    font: inherit;
    font-size: 0.85rem;
    text-decoration: underline;
    cursor: pointer;
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
