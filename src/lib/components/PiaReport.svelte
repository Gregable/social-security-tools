<script lang="ts">
  import * as constants from "$lib/constants";
  import { Recipient } from "$lib/recipient";
  import BendpointChart from "./BendpointChart.svelte";
  import Expando from "./Expando.svelte";
  import RName from "./RecipientName.svelte";

  export let recipient: Recipient = new Recipient();
  const r: Recipient = recipient;

  function oneSignificantDigit(n: number) {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }
</script>

<div>
  <div class="pageBreakAvoid">
    <h2>Primary Insurance Amount</h2>
    <div class="text">
      <p>
        Social Security benefits are best thought of in terms of
        <u>primary insurance amount</u> (PIA). This is the dollar amount that
        Social Security will pay <RName {r}>you</RName> every month starting at <RName
          {r}
          apos>your</RName
        >
        <u>normal retirement age</u> (NRA).
      </p>

      <div class="pia-banner">
        Primary Insurance Amount (PIA): <b
          >{$recipient.pia().primaryInsuranceAmount().string()}</b
        > / month
      </div>

      {#if recipient.isPiaOnly}
        <p>The amount above is the value you provided.</p>
      {:else if !$recipient.isEligible()}
        <p>
          Since <RName {r} suffix=" has">you have</RName> not yet earned 40 Social
          Security credits, <RName {r} suffix=" is">you are</RName> not eligible
          for benefits.
        </p>
      {:else}
        <p class="noprint">
          To understand how <RName {r} apos>your</RName> PIA is calculated, expand
          the box below:
        </p>

        <Expando
          collapsedText="Expand for a detailed look at the Primary Insurance Amount"
          expandedText="Show Less"
          initiallyExpanded={false}
        >
          <div class="expando">
            <p>
              <RName {r} apos>Your</RName> Average Indexed Monthly Earnings:
              <b>{$recipient.monthlyIndexedEarnings().wholeDollars()}</b>
              (see above).
            </p>

            <p>
              Your primary insurance amount is based on your Average Indexed
              Monthly Earnings using
              <a
                href="https://www.ssa.gov/oact/cola/piaformula.html"
                target="_blank">a formula</a
              >
              that increases your Primary Insurance Amount as your earnings increase,
              but increases more slowly for higher total earnings. <RName
                {r}
                apos>Your</RName
              > Primary Insurance Amount is calculated from Average Indexed Monthly
              Earnings as follows:
            </p>

            <table class="benefitBrackets pageBreakAvoid">
              <tr>
                <td>
                  Any amount less than
                  {recipient.pia().firstBendPoint().wholeDollars()}
                  is multiplied by 90%:
                </td>
                <td>
                  <b
                    >{recipient
                      .pia()
                      .primaryInsuranceAmountByBracket(0)
                      .string()}</b
                  >
                </td>
                <td />
              </tr>
              <tr>
                <td>
                  The amount more than
                  {recipient.pia().firstBendPoint().wholeDollars()}
                  and less than
                  {recipient.pia().secondBendPoint().wholeDollars()}
                  is multiplied by 32%:
                </td>
                <td>
                  <b
                    >{$recipient
                      .pia()
                      .primaryInsuranceAmountByBracket(1)
                      .string()}</b
                  >
                </td>
                <td />
              </tr>
              <tr>
                <td>
                  Any <span class="onlydisplay600">remaining</span> amount more
                  than
                  {recipient.pia().secondBendPoint().wholeDollars()}
                  is multiplied by 15%:
                </td>
                <td>
                  <b>
                    {$recipient
                      .pia()
                      .primaryInsuranceAmountByBracket(2)
                      .string()}
                  </b>
                </td>
                <td />
              </tr>
              <tr>
                <td>Total:</td>
                <td>
                  <b
                    >{$recipient
                      .pia()
                      .primaryInsuranceAmountUnadjusted()
                      .string()}</b
                  >
                </td>
                <td class="nowrap">&nbsp;/ month</td>
              </tr>
            </table>

            <div class="insetTextBox">
              <h4>Special Rule</h4>
              <p>
                You may notice that some of these numbers are short a few
                pennies. Social Security rounds the Primary Insurance Amount
                down to the dime, while benefits are rounded down to the dollar.
              </p>
            </div>

            {#if $recipient.pia().shouldAdjustForCOLA()}
              <div class="pageBreakAvoid">
                <p>
                  After attaining age 62, your primary insurance amount will
                  increase annually in proportion to the consumer price index
                  (CPI-W), a measure of inflation. This will continue every
                  year, even after beginning to collect your benefit. These
                  adjustments are called
                  <u>Cost of Living Adjustments</u> (COLA). Here are the
                  adjustments in past years which affect <RName {r} apos
                    >your</RName
                  > current Primary Insurance Amount.
                </p>
                <ul class="cola">
                  {#each $recipient.pia().colaAdjustments() as adjustment}
                    <li>
                      {#if adjustment.year === constants.CURRENT_YEAR}
                        <!-- Not yet applied, so special case the text: -->
                        {adjustment.year}: At the <b>end</b> of the year,
                        <b>{adjustment.start.string()}</b>
                        will be increased by {oneSignificantDigit(
                          adjustment.cola
                        )}% =
                        <b>{adjustment.end.string()}</b>
                      {:else}
                        {adjustment.year}: <b>{adjustment.start.string()}</b>
                        increased by {oneSignificantDigit(adjustment.cola)}% =
                        <b>{adjustment.end.string()}</b>
                      {/if}
                    </li>
                  {/each}
                </ul>
                <p>
                  The adjustments are applied at the <b>end</b> of the
                  adjustment year. For example, the {constants.CURRENT_YEAR} adjustment
                  will only affect <RName {r} apos>your</RName>
                  benefit starting in January {constants.CURRENT_YEAR + 1}.
                </p>
              </div>
            {/if}

            <p>
              The final value is <RName {r} apos>your</RName>
              current <u>primary insurance amount (PIA)</u>. It will continue to
              increase every year.
            </p>
          </div>
        </Expando>
      {/if}
    </div>
  </div>

  {#if !recipient.isPiaOnly && $recipient.isEligible()}
    <div class="text pageBreakAvoid">
      <p style="margin-top: 1em">
        In the following chart, you can see what <RName {r} apos>your</RName>
        PIA would be if <RName {r} apos>your</RName> AIME changed.
        <span class="noprint"
          >Move your mouse over the chart to see how the Primary Insurance
          Amount changes.</span
        >
      </p>
      <BendpointChart {recipient} />
    </div>
  {/if}
</div>

<style>
  .text {
    margin: 0 0.5em;
  }

  .expando {
    margin: 1em 0 1em 1em;
  }

  /* Benefit breakpoint brackets calculation table */
  table.benefitBrackets {
    margin-left: 2em;
  }
  table.benefitBrackets tr:last-child td:nth-child(2) {
    text-align: left;
    border-top: 1px solid;
  }
  @media (min-width: 600px) {
    table.benefitBrackets tr td {
      text-align: right;
      padding-right: 6px;
    }
  }
  @media (max-width: 599px) {
    table.benefitBrackets tr td {
      padding: 8px;
    }
    table.benefitBrackets td:first-child {
      text-align: left;
      max-width: 200px;
    }
    table.benefitBrackets tr:first-child td:first-child,
    table.benefitBrackets tr:nth-child(2) td:first-child,
    table.benefitBrackets tr:first-child td:nth-child(2),
    table.benefitBrackets tr:nth-child(2) td:nth-child(2) {
      border-bottom: 1px solid #d0d0d0;
    }
    table.benefitBrackets tr td:nth-child(2) {
      text-align: right;
      padding-right: 0;
    }
    table.benefitBrackets tr:last-child td:first-child {
      text-align: right;
      padding-right: 14px;
    }
    table.benefitBrackets tr:last-child td:nth-child(2) {
      text-align: right;
    }
    table.benefitBrackets tr:last-child td:nth-child(3) {
      text-align: left;
      padding-left: 0;
    }
  }

  .insetTextBox {
    box-shadow:
      inset 0px 0px 10px 0px #ababab,
      5px 5px 5px 1px #dddddd;
    -webkit-box-shadow:
      inset 0px 0px 10px 0px #ababab,
      5px 5px 5px 1px #dddddd;
    -moz-box-shadow:
      inset 0px 0px 10px 0px #ababab,
      5px 5px 5px 1px #dddddd;
    -o-box-shadow:
      inset 0px 0px 10px 0px #ababab,
      5px 5px 5px 1px #dddddd;
    margin: 6px 1em 15px 1em;
    padding: 10px;
  }
  .insetTextBox h4 {
    margin: 5px 0 10px 0;
  }
  .insetTextBox p {
    margin: 0 20px;
  }

  .pia-banner {
    margin: 1em 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.04rem;
    color: #443378;
  }
  .nowrap {
    white-space: nowrap;
  }
  ul.cola {
    padding-inline-start: 0px;
    list-style-type: none;
  }
</style>
