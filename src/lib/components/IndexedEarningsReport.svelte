<script lang="ts">
  import "$lib/global.css";
  import IndexedEarningsTable from "./IndexedEarningsTable.svelte";
  import FutureEarningsSliders from "./FutureEarningsSliders.svelte";
  import RecipientName from "./RecipientName.svelte";
  import { Recipient } from "$lib/recipient";
  import Expando from "./Expando.svelte";

  export let recipient: Recipient = new Recipient();

  function records(recipient: Recipient): number {
    return (
      recipient.earningsRecords.length + recipient.futureEarningsRecords.length
    );
  }
  let totalRecords: number = 0;
  $: totalRecords = records($recipient);
</script>

<div class="main">
  <h2>Indexed Earnings</h2>

  <div class="text">
    <p>
      Social Security Benefits are based on the <u
        >Averaged Indexed Monthly Earnings</u
      >
      (AIME). This is the monthly average of <RecipientName r={$recipient} apos
        >your</RecipientName
      > highest 35 years of earnings, indexed for wage growth (similar to an inflation
      adjustment).
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
          <b>{totalRecords}</b> total years of lifetime Social Security earnings,
          shown in the table below.
        </p>

        <p>
          The multipliers and indexed earnings in the table below will increase
          every year until <RecipientName r={$recipient} suffix=" reaches"
            >you reach</RecipientName
          > age 60, after which point they are fixed. Years after age 60 will be
          a 1.0 multiplier. The increase in the multipliers is determined by US wage
          growth. Thus, your indexed earnings in a given year are scaled to be equivalent
          to a wage in the year you turn 60.
        </p>

        {#if totalRecords >= 35}
          <p>
            For
            <RecipientName r={$recipient}>you</RecipientName>, this means that
            years where the indexed earnings value falls below
            <b>{$recipient.cutoffIndexedEarnings().wholeDollars()}</b>
            do not affect the benefit calculation because they are not among the
            top 35.
          </p>
        {:else}
          <p>
            As you don't have 35 years of earnings yet, every additional year
            you work will increase the benefit a little more. Once you reach 35
            years of earnings values, increasing the AIME requires earning more
            than previous years' indexed values.
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

        {#if totalRecords >= 35}
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
        <p>
          Here is a table of <RecipientName r={$recipient} apos
            >your</RecipientName
          >
          earnings, with wage indexing multipliers applied:
        </p>
        <IndexedEarningsTable recipient={$recipient} />
      </div>
    </Expando>
  </div>
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
