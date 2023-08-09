<script lang="ts">
  import "$lib/global.css";
  import * as constants from "$lib/constants";
  import EarningsTable from "./EarningsTable.svelte";
  import FutureEarningsSliders from "./FutureEarningsSliders.svelte";
  import { MonthDate } from "$lib/month-time";
  import RecipientName from "./RecipientName.svelte";
  import { Recipient } from "$lib/recipient";
  import Expando from "./Expando.svelte";

  export let recipient: Recipient = new Recipient();

  /**
   * Returns true if the recipient has 35 or more years of earnings.
   */
  function has35Years(): boolean {
    return $recipient.earningsRecords.length >= 35;
  }

  /**
   * Returns true if the recipient is over 60 years old this year.
   */
  function isOver60(): boolean {
    return (
      $recipient.birthdate
        .ageAtSsaDate(
          MonthDate.initFromYearsMonths({
            years: constants.CURRENT_YEAR,
            months: 0,
          })
        )
        .years() > 60
    );
  }
</script>

<div class="main">
  <h2>Indexed Earnings</h2>

  <div class="text">
    <p>
      Social Security Benefits are based on the <u
        >Averaged Indexed Monthly Earnings</u
      >
      (AIME). This is the average monthly income <RecipientName
        r={$recipient}
      /> earned over the top 35 years of wage income, indexed for wage growth (similar
      to an inflation adjustment).
    </p>

    <div class="aime-banner">
      Averaged Indexed Monthly Earnings (AIME): <b
        >{$recipient.monthlyIndexedEarnings().wholeDollars()}</b
      >
    </div>

    <p>
      To understand how <RecipientName r={$recipient} apos>your</RecipientName> AIME
      is calculated, expand the box below:
    </p>

    <Expando
      collapsedText="Expand to read an explanation of Averaged Indexed Monthly Earnings"
      expandedText="Show Less"
      initiallyExpanded={false}
    >
      <div class="expando">
        <p>
          <RecipientName r={$recipient} suffix=" has">You have</RecipientName>
          <b>{$recipient.earningsRecords.length}</b> total years of lifetime Social
          Security earnings, shown in the table below.
        </p>

        <p>
          <RecipientName r={$recipient} apos>Your</RecipientName> social security
          benefit is based on the <u>Averaged Indexed Monthly Earnings</u>
          (AIME), a straightforward calculation from <RecipientName
            r={$recipient}
            apos>your</RecipientName
          >
          {$recipient.earningsRecords.length} years of earnings.
        </p>

        <p>
          Only the top 35 years of <u>indexed earnings</u> values are used in
          the calculation of <RecipientName r={$recipient} apos
            >your</RecipientName
          > AIME. Indexed earnings are simply the capped payroll wages you earned
          in a year multiplied by a number that adjusts for wage growth.
        </p>

        {#if has35Years()}
          <p>
            In
            <RecipientName r={$recipient} apos>your</RecipientName> case, this means
            that years where the indexed earnings value falls below
            <b>{$recipient.cutoffIndexedEarnings().wholeDollars()}</b>
            do not affect the benefit calculation because they are not among the
            top 35. If <RecipientName r={$recipient} suffix=" was"
              >you were</RecipientName
            >
            to earn additional years of wages in the future, those years would only
            affect Social Security benefits if <RecipientName r={$recipient}
              >you</RecipientName
            > earned more than
            <b>{$recipient.cutoffIndexedEarnings().wholeDollars()}</b> in those years.
          </p>
        {:else}
          <p>
            As you don't have 35 years of earnings yet, every additional year
            you work will increase the benefit a little more. Once you reach 35
            years of earnings values, increasing the AIME requires earning more
            than previous years' indexed values.
          </p>
        {/if}

        {#if isOver60()}
          <p>
            The multipliers in the earnings record table below will increase
            every year until <RecipientName r={$recipient} suffix=" reaches"
              >you reach</RecipientName
            > reach age 60, at which point they are fixed at 1.0. The increase in
            the multipliers through age 60 is determined by US wage growth. Thus,
            your indexed earnings in a given year are scaled to be equivalent a wage
            in the year you turn 60.
          </p>
        {/if}

        <p>
          To calculate <RecipientName r={$recipient} apos>your</RecipientName>
          total indexed earnings, simply sum the top 35 values in the indexed earnings
          column in the earnings record table below.
        </p>

        <p class="indent">
          <RecipientName r={$recipient} apos>Your</RecipientName>
          total indexed earnings:
          <b>{$recipient.totalIndexedEarnings().wholeDollars()}</b>
        </p>

        {#if has35Years()}
          <p>
            <RecipientName r={$recipient} apos>Your</RecipientName>
            <u>Averaged Indexed Monthly Earnings</u> (AIME) is simply the total indexed
            earnings divided by 35 years divided by 12 months, as follows:
          </p>
        {:else}
          <p>
            Your <u>Averaged Indexed Monthly Earnings</u> (AIME) is simply your total
            indexed earnings divided by 35 years divided by 12 months. As you have
            fewer than 35 years of earnings, this average is calculated using zeroes
            for the additional years, as follows:
          </p>
        {/if}

        <p class="indent">
          Average Indexed Monthly Earnings:
          <span class="nowrap">
            <b>{$recipient.totalIndexedEarnings().wholeDollars()}</b> / 35 / 12
            =
            <b>{$recipient.monthlyIndexedEarnings().wholeDollars()}</b>
          </span>
        </p>
      </div>
    </Expando>
  </div>

  <EarningsTable earningsRecords={$recipient.earningsRecords} />

  <p>
    You can simulate how your future earnings will affect <RecipientName
      r={$recipient}
      apos>your</RecipientName
    > Social Security benefits. Every number and chart in this report will recalculate
    as you adjust these sliders:
  </p>

  <FutureEarningsSliders recipient={$recipient} />
  <EarningsTable earningsRecords={$recipient.futureEarningsRecords} />
</div>

<style>
  /**
   * This ensures that the <div> does not become a scrollable container which
   * prevents the earnings sliders from being sticky at a higher level element.
   * I'm a bit confused about why this is necessary, but it works.
   */
  div.main {
    display: unset;
  }
  .expando {
    margin: 1em 0 1em 1em;
  }
  .text {
    margin: 0 0.5em;
  }
  p.indent {
    margin-left: 2em;
  }
  @media screen and (max-width: 400px) {
    p.indent {
      margin-left: 0.6em;
    }
    .text {
      margin: 0 0.2em;
    }
  }
  .aime-banner {
    margin: 1em 0;
    /* Shrink the font as the window gets smaller so it doesn't wrap */
    font-size: calc(min(3.8vw, 20px));
    font-weight: 700;
    letter-spacing: 0.04rem;
    color: #443378;
  }
  .nowrap {
    white-space: nowrap;
  }
</style>
