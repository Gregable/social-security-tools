<script lang="ts">
  import "../global.css";
  import * as constants from "../lib/constants";
  import { MonthDate } from "../lib/month-time";
  import { Recipient } from "../lib/recipient";
  import BendpointChart from "./BendpointChart.svelte";
  import Expando from "./Expando.svelte";

  export let recipient: Recipient = new Recipient();

  /**
   * Returns true if the recipient is over 60 years old this year.
   */
  function isOver60(): boolean {
    return (
      recipient.birthdate
        .ageAtSsaDate(
          MonthDate.initFromYearsMonths({
            years: constants.CURRENT_YEAR,
            months: 0,
          })
        )
        .years() > 60
    );
  }

  /**
   * Returns true if the recipient has 35 or more years of earnings.
   */
  function has35Years(): boolean {
    return $recipient.earningsRecords.length >= 35;
  }

  function oneSignificantDigit(n: number) {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }
</script>

<div>
  <h2>Primary Insurance Amount</h2>
  <div class="text">
    <p>
      Your Social Security benefits are best thought of in terms of your
      <u>primary insurance amount</u> (PIA). This is the dollar amount that
      Social Security will pay you every month starting at your
      <u>normal retirement age</u> (NRA).
    </p>

    <div class="pia-banner">
      Primary Insurance Amount (PIA): <b
        >{recipient.pia().primaryInsuranceAmount().string()}</b
      > / month
    </div>

    <p>
      Don't let the government mandated acronyms confuse you. Think of the
      primary insurance amount like a salary: it's the amount of money you can
      expect to earn in retirement every month starting at your normal
      retirement age.
    </p>

    <p>To understand how your PIA is calculated, expand the box below:</p>

    <Expando
      collapsedText="Expand for a detailed look at your Primary Insurance Amount"
      expandedText="Show Less"
      label_max_width="600px"
      initiallyExpanded={false}
    >
      <div class="expando">
        <p>
          You have Social Security earnings recorded for
          <b>{$recipient.earningsRecords.length}</b> total years. Your PIA is
          based on your <u>Averaged Indexed Monthly Earnings</u> (AIME), a straightforward
          calculation from your lifetime earnings record. So, that's our first step.
        </p>

        {#if has35Years()}
          <p>
            Only the top 35 years of <u>indexed earnings</u> values are used in
            the calculation of your Averaged Indexed Monthly Earnings (and thus,
            your Primary Insurance Amount). Indexed earnings are simply the
            payroll wages you earned in a year multiplied by a number that
            adjusts for wage growth (similar to an inflation adjustment). In
            your case, this means that years where the indexed earnings value
            falls below
            <b>{$recipient.cutoffIndexedEarnings().wholeDollars()}</b>
            do not affect your benefit calculation because they are not among the
            top 35. If you were to earn additional years of wages in the future,
            they would only affect your Social Security if you earned more than
            <b>{$recipient.cutoffIndexedEarnings().wholeDollars()}</b> in those years.
          </p>
        {:else}
          <p>
            The top 35 <u>indexed earnings</u> values are used in the calculation
            of your Averaged Indexed Monthly Earnings (and thus, your Primary Insurance
            Amount). Indexed earnings are simply the capped payroll wages you earned
            in a year multiplied by a number that adjusts for wage growth (similar
            to an inflation adjustment). As you don't have 35 years of earnings yet,
            every additional year you work will increase your benefit a little more.
            Once you reach 35 years of earnings values, increasing your Averaged
            Indexed Monthly Earnings amount requires earning more than previous years'
            indexed values.
          </p>
        {/if}

        {#if isOver60()}
          <p>
            The multipliers in the earnings record table above will increase
            every year through age 60, at which point they are fixed at 1.0 for
            everyone. The increase in the multipliers through age 60 is
            determined by US wage growth. Thus, your indexed earnings in a given
            year are scaled to be equivalent to modern wages.
          </p>
        {/if}

        <p class="indent">
          Your total indexed earnings:
          <b>{$recipient.totalIndexedEarnings().wholeDollars()}</b>
        </p>

        <p>
          This is simply the sum of the highest 35 values in the indexed
          earnings column in the earnings record table above.
        </p>

        {#if has35Years()}
          <p>
            Your Averaged Indexed Monthly Earnings is simply your total indexed
            earnings divided by 35 years divided by 12 months, as follows:
          </p>
        {:else}
          <p>
            Your Averaged Indexed Monthly Earnings (AIME) is simply your total
            indexed earnings divided by 35 years divided by 12 months. As you
            have fewer than 35 years of earnings, this average is calculated
            using zeroes for the additional years, as follows:
          </p>
        {/if}

        <p class="indent">
          Average Indexed Monthly Earnings:
          <b>{$recipient.totalIndexedEarnings().wholeDollars()}</b> / 35 / 12 =
          <b>{$recipient.monthlyIndexedEarnings().wholeDollars()}</b>
        </p>

        <p>
          Your primary insurance amount is based on your Average Indexed Monthly
          Earnings using
          <a
            href="https://www.ssa.gov/oact/cola/piaformula.html"
            target="_blank">a formula</a
          >
          that increases your Primary Insurance Amount as your earnings increase,
          but increases more slowly for higher total earnings. Your Primary Insurance
          Amount is calculated from your Average Indexed Monthly Earnings as follows:
        </p>

        <table class="benefitBrackets pageBreakAvoid">
          <tr>
            <td>
              Any amount less than
              {$recipient.pia().firstBendPoint().wholeDollars()}
              is multiplied by 90%:
            </td>
            <td>
              <b
                >{$recipient
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
              {$recipient.pia().firstBendPoint().wholeDollars()}
              and less than
              {$recipient.pia().secondBendPoint().wholeDollars()}
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
              Any <span class="onlydisplay600">remaining</span> amount more than
              {$recipient.pia().secondBendPoint().wholeDollars()}
              is multiplied by 15%:
            </td>
            <td>
              <b>
                {$recipient.pia().primaryInsuranceAmountByBracket(2).string()}
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
            <td>&nbsp;/ month</td>
          </tr>
        </table>

        <div class="insetTextBox">
          <h4>Special Rule</h4>
          <p>
            You may notice that some of these numbers are short a few pennies.
            Social Security rounds the Primary Insurance Amount down to the
            dime, while benefits are rounded down to the dollar.
          </p>
        </div>

        {#if $recipient.pia().shouldAdjustForCOLA()}
          <div class="pageBreakAvoid">
            <p>
              After attaining age 62, your primary insurance amount will
              increase annually in proportion to the consumer price index
              (CPI-W), a measure of inflation. This will continue every year,
              even after beginning to collect your benefit. These adjustments
              are called
              <u>Cost of Living Adjustments</u> (COLA). Here are the adjustments
              in past years which affect your current Primary Insurance Amount.
            </p>
            <ul>
              {#each recipient.pia().colaAdjustments() as adjustment}
                <li>
                  {#if adjustment.year === constants.CURRENT_YEAR}
                    <!-- Not yet applied, so special case the text: -->
                    {adjustment.year}: At the <b>end</b> of the year,
                    <b>{adjustment.start.string()}</b>
                    will be increased by {oneSignificantDigit(adjustment.cola)}%
                    =
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
              The adjustments are applied at the <b>end</b> of the year. For
              example, the {constants.CURRENT_YEAR} adjustment will only affect your
              benefit starting in January {constants.CURRENT_YEAR + 1}.
            </p>
          </div>
        {/if}

        <p>
          The final value is your current <u>primary insurance amount (PIA)</u>.
          It will continue to increase every year.
        </p>
      </div>
    </Expando>

    <p style="margin-top: 1em">
      In the chart below, you can see what your current Primary Insurance Amount
      would be if your Average Indexed Monthly Earnings were to increase. Move
      your mouse over the chart to see how the Primary Insurance Amount changes.
    </p>

    <BendpointChart recipient={$recipient} />
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }

  p.indent {
    margin-left: 2em;
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
  @media screen and (min-width: 600px) {
    table.benefitBrackets tr td {
      text-align: right;
      padding-right: 6px;
    }
  }
  @media screen and (max-width: 599px) {
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
    box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
    -webkit-box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
    -moz-box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
    -o-box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
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
</style>
