<script lang="ts">
  import "../global.css";
  import EligibilityTable from "./EligibilityTable.svelte";
  import Expando from "./Expando.svelte";
  import { Recipient } from "../lib/recipient";

  export let recipient: Recipient = new Recipient();
</script>

<div>
  <a id="nav-eligibility" class="nav" />

  <h2>Retirement Benefits Eligibility</h2>

  <div class="text">
    {#if $recipient.earnedCredits() >= 40}
      <div class="eligibility eligible">Eligible</div>
      <p>
        You have already earned the <b>40</b> credits required
        <a href="https://www.ssa.gov/planners/credits.html" target="_blank"
          >Social Security credits</a
        > to be eligible for a normal retirement benefit. Additional credits will
        not affect your eligibility or benefit amount.
      </p>
    {:else if $recipient.totalCredits() >= 40}
      <div class="eligibility eligible">Eligible</div>
      <p>
        You have already earned <b>{$recipient.earnedCredits()}</b> credits and
        with your projected earnings you will earn the <b>40</b> credits
        required
        <a href="https://www.ssa.gov/planners/credits.html" target="_blank"
          >Social Security credits</a
        > to be eligible for a normal retirement benefit.
      </p>
    {:else}
      <div class="eligibility ineligible">Ineligible</div>
      <p>
        You have not yet earned the <b>40</b> credits required
        <a href="https://www.ssa.gov/planners/credits.html" target="_blank"
          >Social Security credits</a
        > to be eligible for a normal retirement benefit. You may still be eligible
        to receive spousal benefits. The rest of this report will continue to show
        you what your benefit would be if you were eligible.
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
        <p class="expando">
          To be eligible for a normal retirement benefit from your own work
          history you must earn 40 <a
            href="https://www.ssa.gov/planners/credits.html"
            target="_blank">Social Security credits</a
          >. You can earn a <u>maximum of 4 credits each year</u>. Each year,
          you must earn a certain amount of money to get one Social Security
          credit. The amount of money needed for a credit changes from year to
          year. The table below shows the amounts needed to earn one credit and
          the number of credits you have earned each year:
        </p>

        {#if $recipient.hasEarningsBefore1978()}
          <!--
          Warn the user of a potential error if they have earnings before 1978.
        -->
          <div class="insetTextBox">
            <h4>Special Rule</h4>
            <p class="expando">
              Earnings before 1978 were reported <i>quarterly</i>, and one could
              earn only one credit per quarter. Because the SSA earnings record
              only reports <i>yearly</i> earnings, credits may not be calculated
              correctly for years before 1978 if in those years your earnings were
              not evenly spread throughout the year.
            </p>
          </div>
        {/if}

        <EligibilityTable earningsRecords={$recipient.earningsRecords} />

        {#if $recipient.earnedCredits() < 40 && $recipient.futureEarningsRecords.length > 0}
          <p>
            You have worked for <b>{recipient.earningsRecords.length}</b> years,
            earning <b>{recipient.earnedCredits()}</b> credits so far.
          </p>
          <p>
            If you work <b>{recipient.futureEarningsRecords.length}</b>
            additional estimated years, you will earn
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
          In total, you will have earned <b>{$recipient.totalCredits()}</b>
          credits. {#if $recipient.earnedCredits() == 40}This is the maximum
            number of credits, and it makes you fully eligible for a benefit on
            your own earnings record.{/if}
        </p>

        {#if $recipient.totalCredits() < 40}
          <p>
            You can earn enough credits to become eligible for social security
            retirement benefits even after age 70. You will not be able to apply
            for and receive retirement benefits on your own work record until
            you become eligible.
          </p>

          <div class="insetTextBox">
            <h4>Special Rule</h4>
            <div class="grid">
              <img
                src="/static/handshake.svg"
                alt="Handshake icon"
                width="100px"
                height="100px"
              />
              <p>
                In some cases, people with fewer than 40 credits may still be
                eligible. If you have worked in another country that has a legal
                agreement with the US, you may earn credits from your foreign
                work history. This tool does not cover all such cases. <a
                  href="/guide/international-agreements.html"
                  target="_blank">Learn More</a
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
  a.nav {
    position: relative;
    visibility: hidden;
    display: block;
  }
  .text {
    margin: 0 0.5em;
  }
  .grid {
    display: grid;
    grid-template-columns: 100px 1fr;
    grid-gap: 1em;
  }
  .eligibility {
    margin: 1em 0 1em 0;
    font-size: 18px;
    font-weight: 700;
  }
  .eligible {
    color: green;
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
