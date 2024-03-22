<script lang="ts">
  import { Money } from "$lib/money";

  import { Recipient } from "$lib/recipient";
  import Expando from "./Expando.svelte";
  import RName from "./RecipientName.svelte";

  import HorizCurlyImg from "$lib/images/horiz-curly.png";
  import RecipientName from "./RecipientName.svelte";

  export let recipient: Recipient = new Recipient();
  export let spouse: Recipient = new Recipient();
  const r: Recipient = recipient;
  const s: Recipient = spouse;

  let higherEarner: Recipient;
  let lowerEarner: Recipient;
  $: higherEarner = $recipient.higherEarningsThan($spouse)
    ? $recipient
    : $spouse;
  $: lowerEarner = $recipient.higherEarningsThan($spouse)
    ? $spouse
    : $recipient;

  function spousalBenefitCalc(higher: Recipient, lower: Recipient): Money {
    let maxSpousal = higher.pia().primaryInsuranceAmount().div(2);
    let spousal = maxSpousal.sub(lower.pia().primaryInsuranceAmount());
    if (spousal.value() > 0) {
      return spousal;
    } else {
      return Money.from(0);
    }
  }
  let spousalBenefit: Money = Money.from(0);
  $: spousalBenefit = spousalBenefitCalc(higherEarner, lowerEarner);

  /**
   * Returns the personal benefit as a percentage of personal + spousal
   * benefits. Used for the spousal benefit percentage diagram.
   */
  function spousalBenefitFractionCalc(
    higher: Recipient,
    lower: Recipient
  ): number {
    let maxSpousal: Money = higher.pia().primaryInsuranceAmount().div(2);
    if (maxSpousal.value() == 0) {
      return 0;
    }
    let myPia: Money = lower.pia().primaryInsuranceAmount();
    var actualFraction = myPia.div$(maxSpousal) * 100.0;
    // If the actual number is > 0, return at least 1%.
    if (actualFraction > 0 || myPia.value() == 0) {
      return actualFraction;
    }
    return 1;
  }
  let spousalBenefitFraction: number = 0;
  $: spousalBenefitFraction = spousalBenefitFractionCalc(
    higherEarner,
    lowerEarner
  );

  // TODO: We may want to consider zero'ing out PIA in this section if
  // the user isn't eligible for benefits, even if they have a record.
  // Unclear what the best approach for this is.
</script>

<div>
  <h3><RName {r} noColor /></h3>
  <div class="text">
    {#if $recipient.higherEarningsThan($spouse)}
      <p>
        Because <RName {r} /> has higher earnings than <RName r={s} />, <RName
          {r}
        /> is not eligible to receive a spousal benefit.
      </p>
    {:else if $recipient.pia().primaryInsuranceAmount().value() === $spouse
        .pia()
        .primaryInsuranceAmount()
        .value()}
      <p>
        <RName {r} /> and <RName r={s} /> have the same Primary Insurance Amount.
        Therefore, <RName {r} /> is not eligible to receive a spousal benefit.
      </p>
    {:else if spousalBenefit.value() == 0}
      <p>
        <RName {r} /> has lower earnings than <RName r={s} />. However <RName
          {r}
          apos
        /> Primary Insurance Amount is greater than half of
        <RName r={s} apos /> Primary Insurance Amount, so there is no spousal benefit
        payable.
      </p>
    {:else}
      {#if $recipient.pia().primaryInsuranceAmount().value() == 0}
        <RName {r} /> is eligible to receive a <u>spousal benefit</u> on <RName
          r={s}
          apos
        /> record equal to half of <RName r={s} apos /> Primary Insurance Amount.
      {:else}
        <RName {r} /> is eligible to receive a <u>spousal benefit</u> on <RName
          r={s}
          apos
        /> record. A spousal benefit is the amount at normal retirement age that
        <RName {r} /> receives in addition to <RName {r} apos />
        own benefit of
        <b>{$recipient.pia().primaryInsuranceAmount().string()}</b>
        / month.
      {/if}
      <div class="banner">
        Spousal Benefit: <b>{spousalBenefit.string()}</b> / month
      </div>

      {#if $recipient.pia().primaryInsuranceAmount().value() > 0}
        <Expando
          collapsedText="Expand for a detailed look at the Spousal Benefit"
          expandedText="Show Less"
          initiallyExpanded={false}
        >
          <div class="expando">
            <p>
              <RName {r} apos /> spousal benefit at normal retirement age is calculated
              as 50% of <RName r={s} apos /> Primary Insurance Amount minus <RName
                {r}
                apos
              /> own Primary Insurance Amount.
            </p>
            <ul class="pialist">
              <li>
                <RName r={s} apos /> Primary Insurance Amount:
                <span class="nowrap">
                  <b>{$spouse.pia().primaryInsuranceAmount().string()}</b>
                  / month.</span
                >
              </li>
              <li>
                <RName {r} apos /> Primary Insurance Amount:
                <span class="nowrap">
                  <b>{$recipient.pia().primaryInsuranceAmount().string()}</b>
                  / month.</span
                >
              </li>
            </ul>
            <p>
              <RName {r} apos /> Spousal Benefit:
              <span class="nowrap"
                >(
                <b>{$spouse.pia().primaryInsuranceAmount().string()}</b> x 50% )
                -
                <b>{$recipient.pia().primaryInsuranceAmount().string()}</b> =
                <b>{spousalBenefit.string()}</b></span
              >
            </p>

            <div class="curlyvisualization">
              <div style="width: 100%">
                <div class="curlyText" style="width: {spousalBenefitFraction}%">
                  Personal (<b
                    >{$recipient.pia().primaryInsuranceAmount().string()}</b
                  >)
                </div>
                <div
                  class="curlyText"
                  style="width: {100 - spousalBenefitFraction}%"
                >
                  Spousal (<b>{spousalBenefit.string()}</b>)
                </div>
              </div>
              <br style="clear: both" />
              <div
                class="fullCurlyBar"
                class:firstRecipient={r.first}
                class:secondRecipient={!r.first}
              >
                <div
                  class="leftCurlyBar"
                  class:firstRecipient={!r.first}
                  class:secondRecipient={r.first}
                  style="width: {spousalBenefitFraction}%"
                />
              </div>
              <img
                class="horiz-curly"
                src={HorizCurlyImg}
                alt="Horizontal curly brace indicating to sum the personal and
              spousal benefit amounts."
              />
              <div style="width: 100%; text-align: center;">
                Total: <b
                  >{$recipient
                    .pia()
                    .primaryInsuranceAmount()
                    .plus(spousalBenefit)
                    .string()}</b
                >
              </div>
            </div>
          </div>
        </Expando>
      {/if}
      <h4>Filing Date</h4>
      <p>
        <RName {r} /> will begin receiving spousal benefits at the latter of either
        the date that <RName {r} /> or <RName r={s} /> files for benefits.
      </p>
      <Expando
        collapsedText="Expand for detail about the effect of Filing Date on Spousal Benefits"
        expandedText="Show Less"
      >
        <div class="expando">
          {#if $recipient.pia().primaryInsuranceAmount().value() == 0}
            <p>
              <RName {r} /> can choose the filing date to begin receiving spousal
              benefits. However,
              <RName {r} /> is not eligible to begin spousal benefits until
              <RName r={s} /> begins primary benefits. (If applicable, see
              <a
                href="https://www.ssa.gov/benefits/retirement/planner/applying7.html#h4"
                target="_blank">divorced spouses</a
              >.)
            </p>
          {:else}
            <p>
              There are a couple rules regarding the filing date selection for
              spousal benefits:
            </p>

            <ul>
              <li>
                <RName {r} /> is not eligible to begin spousal benefits until
                <RName r={s} /> begins primary benefits. (If applicable, see
                <a
                  href="https://www.ssa.gov/benefits/retirement/planner/applying7.html#h4"
                  target="_blank">divorced spouses</a
                >.)
              </li>
              <li>
                <RName {r} /> must elect to collect all or none of the benefits
                <RName {r} /> is eligible for. This is known as the
                <u>deeming</u> rule; you are deemed to be filing for all
                benefits you are eligible for. Examples:
                <ul>
                  <li>
                    <RName {r} /> cannot choose to delay personal benefits while
                    collecting spousal benefits.
                  </li>
                  <li>
                    Once <RName {r} />
                    begins personal benefits, <RName {r} /> cannot delay spousal
                    benefits beyond when <RName r={s} /> begins primary benefits.
                  </li>
                </ul>
              </li>
            </ul>
            <p>
              Since <RName {r} apos /> personal and spousal benefits may begin on
              different dates, the reduction factors for early filing may apply from
              different starting dates for each of the two benefits.
            </p>
          {/if}
          <h4>Early Filing for Spousal Benefits</h4>
          <p>
            If <RName {r} /> chooses to file for spousal benefits
            <i>earlier</i>
            than <RName {r} apos /> normal retirement age (<b
              >{recipient.normalRetirementDate().monthFullName()}
              {recipient.normalRetirementDate().year()}</b
            >), the spousal benefit amount will be
            <u>permanently</u> <i>reduced</i>:
          </p>
          <ul>
            <li>
              <b>25 / 36</b> of one percent per month (<b>8.33%</b> per year) for
              each month before normal retirement age, up to 36 months.
            </li>
            <li>
              &nbsp;&nbsp;<b>5 / 12</b> of one percent per month (<b>5.00%</b> per
              year) for each month before normal retirement age, exceeding 36 months.
            </li>
          </ul>
          <p>
            The 36 month mark before normal retirement age is age
            <b
              >{recipient.earlyRetirementInflectionAge().years()} years
              {#if recipient.earlyRetirementInflectionAge().modMonths() != 0}
                and
                {recipient.earlyRetirementInflectionAge().modMonths()} months >
              {/if}</b
            >
            (<b
              >{recipient.earlyRetirementInflectionDate().monthName()}
              {recipient.earlyRetirementInflectionDate().year()}</b
            >).
          </p>
          <h4>Delayed Filing for Spousal Benefits</h4>
          <p>
            If <RName {r} /> chooses to file for spousal benefits
            <i>later</i>
            than <RName {r} apos /> normal retirement age, unlike personal benefits,
            there are no additional delayed retirement credits to increase spousal
            benefits.
          </p>
          <p>
            Furthermore, the spousal benefit amount cannot increase the combined
            benefit for <RName {r} /> to an amount greater than half of <RName
              r={s}
              apos
            /> Primary Insurance Amount. Therefore, <RName {r} apos /> delayed credits
            can potentially reduce the spousal benefit by same amount.
          </p>
          <h4>Spousal Benefit Filing Date Examples</h4>
          <p>
            Both the personal and spousal benefits are independently reduced or
            increased by choice of filing dates. See <a
              href="/guides/spousal-benefit-filing-date"
              target="_blank">this guide</a
            > for some examples.
          </p>
        </div>
      </Expando>
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
  div.curlyvisualization {
    margin: 2em 0;
  }
  .curlyText {
    text-align: center;
    float: left;
    white-space: nowrap;
  }
  .fullCurlyBar {
    height: 20px;
    border: 1px solid #666;
  }
  .leftCurlyBar {
    height: 100%;
    border-right: 1px solid #666;
  }
  .curlyvisualization .firstRecipient {
    background-color: #669966;
  }
  .curlyvisualization .secondRecipient {
    background-color: #ee8800;
  }
  img.horiz-curly {
    width: 100%;
    max-height: 30px;
    padding-top: 2px;
  }
  .nowrap {
    white-space: nowrap;
  }
  ul.pialist {
    padding-inline-start: 0px;
    list-style-type: none;
  }
</style>
