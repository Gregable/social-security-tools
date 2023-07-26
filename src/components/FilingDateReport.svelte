<script lang="ts">
  import "../global.css";
  import { Recipient } from "../lib/recipient";
  import * as constants from "../lib/constants";
  import { MonthDate, MonthDuration } from "../lib/month-time";
  import FilingDateChart from "./FilingDateChart.svelte";

  export let recipient: Recipient = new Recipient();

  let exampleAge: { age: number; day: number; month: string; year: number };
  $: exampleAge = $recipient.birthdate.exampleSsaAge(constants.CURRENT_YEAR);

  let followingMonth: MonthDate;
  $: followingMonth = MonthDate.initFromYearsMonths({
    years: constants.CURRENT_YEAR,
    months: $recipient.birthdate.ssaBirthMonthDate().monthIndex(),
  }).addDuration(new MonthDuration(1));

  function twoSignificantDigits(n: number) {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
</script>

<div>
  <h2>Filing Date Selection</h2>
  <div class="text">
    <p>
      {#if $recipient.birthdate.layBirthDayOfMonth() <= 2}
        You can begin taking benefits as early as 62 years old (<b
          >{$recipient.birthdate
            .dateAtLayAge(
              MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
            )
            .monthFullName()}
          {$recipient.birthdate
            .dateAtLayAge(
              MonthDuration.initFromYearsMonths({ years: 62, months: 0 })
            )
            .year()}</b
        >), or wait until as late as 70 years old (<b
          >{$recipient.birthdate
            .dateAtSsaAge(
              MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
            )
            .monthFullName()}
          {$recipient.birthdate
            .dateAtSsaAge(
              MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
            )
            .year()}</b
        >), or start any month in between. The longer you wait, the higher your
        benefit will be.
      {:else}
        You can begin taking benefits as early as 62 years and 1 month old (<b
          >{$recipient.birthdate
            .dateAtLayAge(
              MonthDuration.initFromYearsMonths({ years: 62, months: 1 })
            )
            .monthFullName()}
          {$recipient.birthdate
            .dateAtLayAge(
              MonthDuration.initFromYearsMonths({ years: 62, months: 1 })
            )
            .year()}</b
        >), or wait until as late as 70 years old (<b
          >{$recipient.birthdate
            .dateAtSsaAge(
              MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
            )
            .monthFullName()}
          {$recipient.birthdate
            .dateAtSsaAge(
              MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
            )
            .year()}</b
        >), or start any month in between. The longer you wait, the higher your
        benefit will be.
      {/if}
    </p>

    {#if $recipient.birthdate.layBirthDayOfMonth() > 2}
      <div class="insetTextBox">
        <h4>Special Rule</h4>
        <p>
          You may find it oddly specific that the start date is offset by 1
          month from your birthdate. Benefit eligibility is calculated based on
          the first month that you are a particular age throughout the <u
            >entire</u
          >
          month. For most, this is the month <i>after</i> their birthdate.
        </p>
        <p>
          For example, the first month that you are
          <b>{exampleAge.age}</b>
          throughout the <u>entire</u> month is
          <b
            >{followingMonth.monthFullName()}
            {followingMonth.year()}</b
          >.
        </p>
      </div>
    {/if}

    <h3>Early Filing</h3>
    <div class="text">
      <p>
        If you choose to take benefits <i>earlier</i> than normal retirement age
        (<b
          >{$recipient.normalRetirementDate().monthFullName()}
          {$recipient.normalRetirementDate().year()}</b
        >), your benefit amount will be <u>permanently</u> <i>reduced</i>:
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
    </div>

    <h3>Delayed Filing</h3>
    <div class="text">
      <p>
        If you choose to delay until <i>later</i> than normal retirement age (<b
          >{$recipient.normalRetirementDate().monthFullName()}
          {$recipient.normalRetirementDate().year()}</b
        >) to start your benefits, your amount will be <u>permanently</u>
        <i>increased</i>:
      </p>
      <ul>
        {#if $recipient.delayedRetirementIncrease() == 0.8}
          <li>
            <b>2 / 3</b> of one percent per month (<b>8%</b> per year) for each month
            after normal retirement age, up age 70.
          </li>
        {:else}
          <li>
            <b
              >{twoSignificantDigits(
                ($recipient.delayedRetirementIncrease() * 100) / 12
              )}%</b
            >
            per month (<b>{$recipient.delayedRetirementIncrease() * 100}%</b>
            per year) for each month after normal retirement age, up age 70.
          </li>
        {/if}
      </ul>
      <p>
        Increases due to delaying your benefit do not take affect until January,
        except at the full age of 70. <a
          href="https://ssa.tools/guide/delayed-january-bump.html"
          target="_blank">Learn more</a
        >.
      </p>
    </div>
    <h3>Explore Filing Dates</h3>
    <p>
      The following <i>interactive</i> tool visualizes how different filing dates
      affect your benefit amount.
    </p>
    <FilingDateChart recipient={$recipient} />
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
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
    margin: 1em;
  }
</style>
