<script lang="ts">
  import "../global.css";
  import horizCurlyImg from "../../static/horiz-curly.png?url";

  import { Money } from "../lib/money";

  import { Recipient } from "../lib/recipient";
  import Expando from "./Expando.svelte";
  import RName from "./RecipientName.svelte";

  export let recipient: Recipient = new Recipient();
  export let spouse: Recipient = new Recipient();
  let r: Recipient = $recipient;
  let s: Recipient = $spouse;

  let higherEarner: Recipient;
  let lowerEarner: Recipient;
  $: higherEarner = $r.higherEarningsThan($s) ? $r : $s;
  $: lowerEarner = $r.higherEarningsThan($s) ? $s : $r;

  function spousalBenefit(): Money {
    let maxSpousal = higherEarner.pia().primaryInsuranceAmount().div(2);
    let spousal = maxSpousal.sub(lowerEarner.pia().primaryInsuranceAmount());
    if (spousal.value() > 0) {
      return spousal;
    } else {
      return Money.from(0);
    }
  }

  /**
   * Returns the personal benefit as a percentage of personal + spousal
   * benefits. Used for the spousal benefit percentage diagram.
   */
  function spousalBenefitFraction(): number {
    let maxSpousal: Money = higherEarner.pia().primaryInsuranceAmount().div(2);
    let myPia: Money = lowerEarner.pia().primaryInsuranceAmount();
    var actualFraction = myPia.div$(maxSpousal) * 100.0;
    // If the actual number is > 0, return at least 1%.
    if (actualFraction > 0 || myPia.value() == 0) {
      return actualFraction;
    }
    return 1;
  }

  // TODO: We may want to consider zero'ing out PIA in this section if
  // the user isn't eligible for benefits, even if they have a record.
  // Unclear what the best approach for this is.
</script>

<div>
  <h3><RName r={$r} noColor /></h3>
  <div class="text">
    {#if $r.higherEarningsThan($s)}
      <p>
        Because <RName r={$r} /> has higher earnings than <RName r={$s} />, <RName
          r={$r}
        /> is not eligible to receive a spousal benefit.
      </p>
    {:else if spousalBenefit().value() == 0}
      <p>
        <RName r={$r} /> has lower earnings than <RName r={$s} />. However <RName
          r={$r}
          apos
        /> Primary Insurance Amount is greater than half of
        <RName r={s} apos /> Primary Insurance Amount, so there is no spousal benefit
        payable.
      </p>
    {:else}
      {#if $r.pia().primaryInsuranceAmount().value() == 0}
        <RName r={$r} /> is eligible to receive a <u>spousal benefit</u> on <RName
          r={$s}
          apos
        /> record equal to half of <RName r={$s} apos /> Primary Insurance Amount.
      {:else}
        <RName r={$r} /> is eligible to receive a <u>spousal benefit</u> on <RName
          r={$s}
          apos
        /> record. A spousal benefit is the amount at normal retirement age that
        <RName r={$r} /> recieves in addition to <RName r={$r} apos />
        own benefit of
        <b>{$r.pia().primaryInsuranceAmount().string()}</b>
        / month.
      {/if}
      <div class="banner">
        Spousal Benefit: <b>{spousalBenefit().string()}</b> / month
      </div>

      {#if $r.pia().primaryInsuranceAmount().value() > 0}
        <Expando
          collapsedText="Expand for a detailed look at the Spousal Benefit"
          expandedText="Show Less"
          label_max_width="600px"
          initiallyExpanded={false}
        >
          <div class="expando">
            <p>
              <RName r={$r} apos /> spousal benefit at normal retirement age is calculated
              as 50% of <RName r={$s} apos /> Primary Insurance Amount minus <RName
                r={$r}
                apos
              /> own Primary Insurance Amount.
            </p>
            <ul>
              <li>
                <RName r={$s} apos /> Primary Insurance Amount:
                <b>{$s.pia().primaryInsuranceAmount().string()}</b>
                / month.
              </li>
              <li>
                <RName r={$r} apos /> Primary Insurance Amount:
                <b>{$r.pia().primaryInsuranceAmount().string()}</b>
                / month.
              </li>
            </ul>
            <p>
              <RName r={$r} apos /> Spousal Benefit: (
              <b>{$s.pia().primaryInsuranceAmount().string()}</b> x 50% ) -
              <b>{$r.pia().primaryInsuranceAmount().string()}</b> =
              <b>{spousalBenefit().string()}</b>
            </p>

            <div>
              <div style="width: 100%">
                <div
                  class="curlyText"
                  style="width: {spousalBenefitFraction()}%"
                >
                  Personal (<b>{$r.pia().primaryInsuranceAmount().string()}</b>)
                </div>
                <div
                  class="curlyText"
                  style="width: {100 - spousalBenefitFraction()}%"
                >
                  Spousal (<b>{spousalBenefit().string()}</b>)
                </div>
              </div>
              <br style="clear: both" />
              <div class="fullCurlyBar">
                <div
                  class="leftCurlyBar"
                  style="width: {spousalBenefitFraction()}%"
                />
              </div>
              <img
                class="horiz-curly"
                src={horizCurlyImg}
                alt="Horizontal curly brace indicating to sum the personal and
              spousal benefit amounts."
              />
              <div style="width: 100%; text-align: center;">
                Total: <b
                  >{$r
                    .pia()
                    .primaryInsuranceAmount()
                    .plus(spousalBenefit())
                    .string()}</b
                >
              </div>
            </div>

            <p>
              Note that <RName r={$r} apos /> <i>total</i> benefit is capped at
              50% of <RName r={$s} apos /> Primary Insurance Amount, regardless of
              <RName r={$r} apos /> own personal Primary Insurance Amount.
            </p>
          </div>
        </Expando>
      {/if}
      <h4>Filing Date</h4>
      {#if $r.pia().primaryInsuranceAmount().value() == 0}
        <p>
          <RName r={$r} /> can choose the filing date to begin receiving spousal
          benefits. However,
          <RName r={$r} /> is not eligible to begin spousal benefits until
          <RName r={$s} /> begins primary benefits. (If applicable, see
          <a
            href="https://www.ssa.gov/benefits/retirement/planner/applying7.html#h4"
            target="_blank">divorced spouses</a
          >.)
        </p>
      {:else}
        <p>
          <RName r={$r} /> can choose the filing date to begin receiving spousal
          benefits. However, there are some considerations:
        </p>

        <ul>
          <li>
            <RName r={$r} /> is not eligible to begin spousal benefits until
            <RName r={$s} /> begins primary benefits. (If applicable, see
            <a
              href="https://www.ssa.gov/benefits/retirement/planner/applying7.html#h4"
              target="_blank">divorced spouses</a
            >.)
          </li>
          <li>
            <RName r={$r} /> must elect to collect all or none of the benefits
            <RName r={$r} /> is eligible for. This is known as the
            <u>deeming</u> rule; you are deemed to be filing for all benefits
            you are eligible for. Examples:
            <ul>
              <li>
                <RName r={$r} /> cannot choose to delay personal benefits while collecting
                spousal benefits.
              </li>
              <li>
                Once <RName r={$r} />
                begins personal benefits, <RName r={$r} /> cannot delay spousal benefits
                beyond when <RName r={$s} /> begins primary benefits.
              </li>
            </ul>
          </li>
        </ul>
        <p>
          Stated another way, the date that <RName r={$r} apos /> spousal benefits
          begin is the latter of either the date that <RName r={$r} /> or <RName
            r={$s}
          /> begins personal benefits.
        </p>
        <p>
          This can lead to different reduction multipliers for <RName
            r={$r}
            apos
          /> personal and spousal benefits.
        </p>
      {/if}
      <h4>Early Filing for Spousal Benefits</h4>
      <p>
        If <RName {r} /> chooses to file for spousal benefits
        <i>earlier</i>
        than <RName {r} apos /> normal retirement age (<b
          >{$r.normalRetirementDate().monthFullName()}
          {$r.normalRetirementDate().year()}</b
        >), the spousal benefit amount will be
        <u>permanently</u> <i>reduced</i>:
      </p>
      <ul>
        <li>
          <b>25 / 36</b> of one percent per month (<b>8.33%</b> per year) for each
          month before normal retirement age, up to 36 months.
        </li>
        <li>
          &nbsp;&nbsp;<b>5 / 12</b> of one percent per month (<b>5.00%</b> per year)
          for each month before normal retirement age, exceeding 36 months.
        </li>
      </ul>
      <p>
        The 36 month mark before normal retirement age is age
        <b
          >{$recipient.earlyRetirementInflectionAge().years()} years
          {#if $recipient.earlyRetirementInflectionAge().modMonths() != 0}
            and
            {$recipient.earlyRetirementInflectionAge().modMonths()} months >
          {/if}</b
        >
        (<b
          >{$recipient.earlyRetirementInflectionDate().monthName()}
          {$recipient.earlyRetirementInflectionDate().year()}</b
        >).
      </p>
      <h4>Delayed Filing for Spousal Benefits</h4>
      <p>
        If <RName {r} /> chooses to file for spousal benefits
        <i>later</i>
        than <RName {r} apos /> normal retirement age, unlike personal benefits,
        there are no additional delayed retirement credits to increase spousal benefits.
      </p>
    {/if}
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }
  .banner {
    margin: 1em 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.04rem;
    color: #443378;
  }
  .expando {
    margin: 1em 0 1em 1em;
  }
  .curlyText {
    text-align: center;
    float: left;
    white-space: nowrap;
  }
  .fullCurlyBar {
    background-color: #0db9f0;
    height: 20px;
    border: 1px solid #666;
  }
  .leftCurlyBar {
    background-color: #5cb85c;
    height: 100%;
    border-right: 1px solid #666;
  }
  img.horiz-curly {
    width: 100%;
    max-height: 30px;
    padding-top: 2px;
  }
</style>
