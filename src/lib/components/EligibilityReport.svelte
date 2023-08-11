<script lang="ts">
  import "$lib/global.css";
  import EligibilityTable from "./EligibilityTable.svelte";
  import Expando from "./Expando.svelte";
  import { Recipient } from "$lib/recipient";
  import RName from "./RecipientName.svelte";

  export let recipient: Recipient = new Recipient();
  let r = $recipient;
</script>

<div>
  <h2>Retirement Benefits Eligibility</h2>

  <div class="text">
    {#if $recipient.earnedCredits() >= 40}
      <div class="eligibility eligible">Eligible</div>
      <p>
        <RName {r} suffix=" has">You have</RName>
        already earned the <b>40</b>
        <a href="https://www.ssa.gov/planners/credits.html" target="_blank"
          >Social Security credits</a
        >
        required to be eligible for a retirement benefit. Additional credits will
        not affect <RName {r} apos>your</RName> eligibility or benefit amount.
      </p>
    {:else if $recipient.totalCredits() >= 40}
      <div class="eligibility eligible">Eligible</div>
      <p>
        <RName {r} suffix=" has">You have</RName> already earned
        <b>{$recipient.earnedCredits()}</b>
        credits and with your projected earnings <RName {r}>you</RName> will earn
        the <b>40</b>
        <a href="https://www.ssa.gov/planners/credits.html" target="_blank"
          >Social Security credits</a
        > required to be eligible for a normal retirement benefit.
      </p>
    {:else}
      <div class="eligibility ineligible">Ineligible</div>
      <p>
        <RName {r} suffix=" has">You have</RName> not yet earned the <b>40</b>
        <a href="https://www.ssa.gov/planners/credits.html" target="_blank"
          >Social Security credits</a
        >
        required to be eligible for a normal retirement benefit. <RName {r}
          >You</RName
        > may still be eligible to receive spousal benefits (see spousal benefits
        section below). The rest of this report will continue to show you what <RName
          {r}
          apos>your</RName
        > benefit would be if <RName {r}>you</RName> were eligible.
      </p>
    {/if}

    <!--
      If the user's total credits are less than 40, we expand the expando by
      default to show the table of credits earned per year.
    -->
    <Expando
      collapsedText="Expand for a detailed look at eligibility credits"
      expandedText="Show Less"
      initiallyExpanded={$recipient.totalCredits() < 40}
    >
      <div class="expando">
        <p>
          To be eligible for Social Security retirement benefits, you must earn
          40 <a href="https://www.ssa.gov/planners/credits.html" target="_blank"
            >Social Security credits</a
          >. You can earn <u>up to</u> 4 credits per year. Each year, you must
          earn a certain amount of money to get one Social Security credit. The
          amount of money you need to earn per credit changes each year. The
          table below shows the amount needed per credit and the number of
          credits <RName {r} suffix=" has">you have</RName> earned:
        </p>

        {#if $recipient.hasEarningsBefore1978()}
          <!--
          Warn the user of a potential error if they have earnings before 1978.
        -->
          <div class="insetTextBox">
            <h4>Special Rule</h4>
            <p>
              Before 1978, Social Security credits were earned <i>quarterly</i>.
              The SSA earnings record only reports <i>yearly</i> earnings,so
              credits may not be calculated correctly for years before 1978, if
              <RName {r} apos>your</RName> earnings were not evenly spread throughout
              the year.
            </p>
          </div>
        {/if}

        <EligibilityTable earningsRecords={$recipient.earningsRecords} />

        {#if $recipient.earnedCredits() < 40 && $recipient.futureEarningsRecords.length > 0}
          <p>
            <RName {r} suffix=" has">You have</RName>
            worked for <b>{recipient.earningsRecords.length}</b> years, earning
            <b>{recipient.earnedCredits()}</b> credits so far.
          </p>
          <p>
            If <RName {r} suffix=" works">you work</RName>
            <b>{recipient.futureEarningsRecords.length}</b>
            additional estimated years, <RName {r}>you</RName> will earn
            <b>{recipient.totalCredits() - recipient.earnedCredits()}</b> additional
            credits:
          </p>
          <!--
          Only display future earnings if the user has not yet earned 40
          credits. It's just additional clutter otherwise.
        -->
          <EligibilityTable
            earningsRecords={$recipient.futureEarningsRecords}
          />
        {/if}

        <p>
          In total, <RName {r}>you</RName> will have earned
          <b>{$recipient.totalCredits()}</b>
          credits. {#if $recipient.earnedCredits() == 40}This is the maximum
            number of credits, and it makes <RName {r}>you</RName> fully eligible
            for a benefit on
            <RName {r} apos>your</RName> own earnings record.{/if}
        </p>

        {#if $recipient.totalCredits() < 40}
          <p>
            <RName {r}>You</RName> can earn enough credits to become eligible for
            social security retirement benefits even after age 70. However,
            <RName {r}>You</RName> will not be able to apply for and receive retirement
            benefits on <RName {r} apos>your</RName> own work record until <RName
              {r}
              suffix=" becomes">you become</RName
            > eligible.
          </p>

          <div class="insetTextBox">
            <h4>Special Rule</h4>
            <div class="grid">
              <img
                src="handshake.svg"
                alt="Handshake icon"
                width="100px"
                height="100px"
              />
              <p>
                In some cases, people with fewer than 40 credits may still be
                eligible. If <RName {r} suffix=" has">you have</RName> worked in
                another country that has a legal agreement with the US,
                <RName {r}>you</RName> may have earned credits from a foreign work
                history. This tool does not cover these cases.
                <a href="/guide/international-agreements.html" target="_blank"
                  >Learn More</a
                >.
              </p>
            </div>
          </div>
        {/if}
      </div>
    </Expando>
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }
  .grid {
    display: grid;
    grid-template-columns: 100px 1fr;
    grid-gap: 1em;
  }
  .eligibility {
    margin: 1em 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.04rem;
  }
  .eligible {
    color: #443378;
  }
  .ineligible {
    color: red;
  }
  .expando p {
    padding: 1em 0 1em 1em;
  }
  .insetTextBox {
    box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
    -webkit-box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
    -moz-box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
    -o-box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
    margin: 6px 1em;
    padding: 10px;
  }
  .insetTextBox h4 {
    margin: 5px 0 10px 0;
  }
  .insetTextBox p {
    margin: 0 20px;
  }
  @media print {
    .insetTextBox {
      page-break-inside: avoid;
    }
  }
</style>
