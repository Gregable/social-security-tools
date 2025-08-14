<script lang="ts">
  import { Recipient } from '$lib/recipient';
  import * as constants from '$lib/constants';
  import { MonthDate, MonthDuration } from '$lib/month-time';
  import FilingDateChart from './FilingDateChart.svelte';
  import RName from './RecipientName.svelte';
  import Expando from './Expando.svelte';

  export let recipient: Recipient = new Recipient();
  let r: Recipient = recipient;

  let exampleAge = recipient.birthdate.exampleSsaAge(constants.CURRENT_YEAR);

  let followingMonth = MonthDate.initFromYearsMonths({
    years: constants.CURRENT_YEAR,
    months: recipient.birthdate.ssaBirthMonthDate().monthIndex(),
  }).addDuration(new MonthDuration(1));

  function twoSignificantDigits(n: number) {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
</script>

<div>
  <div class="pageBreakAvoid">
    <h2>Filing Date Selection</h2>
    <div class="h2text">
      {#if $recipient.pia().primaryInsuranceAmount().value() == 0}
        <p>
          Since <RName {r} suffix=" has">you have</RName> a $0 Primary Insurance
          Amount,
          <RName {r} suffix=" will">you will</RName> not receive any benefits on
          <RName {r} apos>your</RName> own record. Filing Date Selection for your
          personal benefit has no effect. <RName {r} suffix=" may"
            >You may</RName
          > still be eligible for benefits on <RName {r} apos>your</RName> spouse's
          record.
        </p>
      {:else}
        <p>
          <RName {r}>You</RName> can begin taking benefits as early as
          {#if recipient.birthdate.layBirthDayOfMonth() == 2}
            62 years old (<b
              >{recipient.birthdate
                .dateAtSsaAge(
                  MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
                )
                .monthFullName()}
              {recipient.birthdate
                .dateAtSsaAge(
                  MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
                )
                .year()}</b
            >),
          {:else}
            62 years and 1 month old (<b
              >{recipient.birthdate
                .dateAtSsaAge(
                  MonthDuration.initFromYearsMonths({ years: 62, months: 1 })
                )
                .monthFullName()}
              {recipient.birthdate
                .dateAtSsaAge(
                  MonthDuration.initFromYearsMonths({ years: 62, months: 1 })
                )
                .year()}</b
            >),
          {/if}
          wait until as late as 70 years old (<b
            >{recipient.birthdate
              .dateAtSsaAge(
                MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
              )
              .monthFullName()}
            {recipient.birthdate
              .dateAtSsaAge(
                MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
              )
              .year()}</b
          >), or start any month in between. The longer <RName
            r={recipient}
            suffix=" waits">you wait</RName
          >, the higher the benefit.
        </p>
      {/if}
    </div>
  </div>

  {#if $recipient.pia().primaryInsuranceAmount().value() > 0}
    <Expando
      collapsedText="Expand to learn about the effect of Filing before or after Normal Retirement Age"
      expandedText="Show Less"
    >
      {#if recipient.birthdate.layBirthDayOfMonth() != 2}
        <div class="insetTextBox">
          <h4>Special Rule</h4>
          <p>
            You may find it oddly specific that the earliest start date is
            offset by 1 month from one's birthdate (62 years and 1 month). You
            first become eligible for benefits in the month that you are 62
            years old throughout the <u>entire</u>
            month. For most, this is the month
            <i>after</i>
            attaining age 62.
          </p>
          <p>
            {#if recipient.birthdate.layBirthDayOfMonth() == 1}
              For example, <RName {r} suffix=" was">you were</RName> born on
              <b>{recipient.birthdate.layBirthdateString()}</b>. <RName
                {r}
                suffix=" attains">You attain</RName
              > age <b>{exampleAge.age}</b>
              on <b>{exampleAge.month} {exampleAge.day}, {exampleAge.year}</b>
              so the first month that <RName {r} suffix=" is">you are</RName>
              <b>{exampleAge.age}</b>
              throughout the <u>entire</u> month is
              <b
                >{followingMonth.monthFullName()}
                {followingMonth.year()}</b
              >.
            {:else}
              For example, <RName {r} suffix=" was">you were</RName> born on
              <b>{recipient.birthdate.layBirthdateString()}</b>, so the first
              month that <RName {r} suffix=" is">you are</RName>
              <b>{exampleAge.age}</b>
              throughout the <u>entire</u> month is
              <b
                >{followingMonth.monthFullName()}
                {followingMonth.year()}</b
              >.
            {/if}
            <a
              href="/guides/1st-and-2nd-of-month"
              target="_blank"
              class="noprint">Learn More</a
            >
          </p>
        </div>
      {/if}

      <h3>Early Filing</h3>
      <div class="h3text pageBreakAvoid">
        <p>
          If <RName {r} suffix=" chooses">you choose</RName> to take benefits
          <i>earlier</i>
          than normal retirement age (<b
            >{recipient.normalRetirementDate().monthFullName()}
            {recipient.normalRetirementDate().year()}</b
          >), <RName {r} apos>your</RName> benefit amount will be
          <u>permanently</u> <i>reduced</i>:
        </p>
        <ul>
          <li>
            <b>5 / 9</b> of one percent per month (<b>6.67%</b> per year) for each
            month before normal retirement age, up to 36 months.
          </li>
          <li>
            <b>5 / 12</b> of one percent per month (<b>5.0%</b> per year) for each
            month before normal retirement age, exceeding 36 months.
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
      </div>

      <h3>Delayed Filing</h3>
      <div class="h3text pageBreakAvoid">
        <p>
          If <RName {r} suffix=" chooses">you choose</RName> to delay until
          <i>later</i>
          than normal retirement age (<b
            >{recipient.normalRetirementDate().monthFullName()}
            {recipient.normalRetirementDate().year()}</b
          >) to start <RName {r} apos>your</RName> benefit, the amount will be
          <u>permanently</u>
          <i>increased</i>:
        </p>
        <ul>
          {#if recipient.delayedRetirementIncrease() == 0.08}
            <li>
              <b>2 / 3</b> of one percent per month (<b>8%</b> per year) for each
              month after normal retirement age, up age 70.
            </li>
          {:else}
            <li>
              <b
                >{twoSignificantDigits(
                  (recipient.delayedRetirementIncrease() * 100) / 12
                )}%</b
              >
              per month (<b>{recipient.delayedRetirementIncrease() * 100}%</b>
              per year) for each month after normal retirement age, up age 70.
            </li>
          {/if}
        </ul>
        <p>
          Increases due to delaying your benefit do not take effect until
          January, except at the full age of 70. <a
            href="/guides/delayed-january-bump"
            target="_blank"
            class="noprint">Learn more</a
          >.
        </p>
      </div>
    </Expando>

    <div class="pageBreakAvoid">
      <h3>Explore Filing Dates</h3>
      <div class="h3text">
        <p>
          The following <i>interactive</i> tool visualizes how different filing
          dates affect <RName {r} suffix="'s personal">your</RName> benefit.
          <span class="noprint"
            >Move the slider to select a filing date and hover over the chart to
            see the benefit amount for that date.
            <a href="/guides/filing-date-chart" target="_blank"
              >Click for more help.</a
            ></span
          >
        </p>
      </div>
      <FilingDateChart {recipient} />
    </div>
  {/if}
</div>

<style>
  .h2text {
    margin: 0 0.5em;
  }
  .h3text {
    margin: 0 1.2em;
  }
  h3 {
    margin-left: 0.5em;
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
    margin: 1em;
  }
</style>
