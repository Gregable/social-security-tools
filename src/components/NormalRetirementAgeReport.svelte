<script lang="ts">
  import "../global.css";
  import * as constants from "../lib/constants";
  import { Recipient } from "../lib/recipient";
  import RName from "./RecipientName.svelte";
  import { Money } from "../lib/money";

  export let recipient: Recipient = new Recipient();
  let r: Recipient = $recipient;

  let exampleAge: { age: number; day: number; month: string; year: number };
  $: exampleAge = $recipient.birthdate.exampleSsaAge(constants.CURRENT_YEAR);

  /**
   * The benefit amount at normal retirement age.
   */
  let benefit: Money = $recipient
    .pia()
    .primaryInsuranceAmount()
    .floorToDollar();
</script>

<div>
  <h2>Normal Retirement Age</h2>
  <div class="text">
    <p>
      The primary insurance amount rounded down to the next lower whole dollar (<b
        >{benefit.wholeDollars()}</b
      >
      / month) is the benefit you will earn if you begin collecting your benefit
      at your <u>normal retirement age</u> (NRA). Normal Retirement Age is
      between 65 and 67, depending on when you were born. You may also see this
      referred to as the <u>full retirement age</u> (FRA).
    </p>

    <p>
      For <RName {r} suffix=" who was">those</RName>
      born in <b>{$recipient.birthdate.ssaBirthYear()}</b>, normal retirement
      age is
      {#if $recipient.normalRetirementAge().modMonths() == 0}
        <b>{$recipient.normalRetirementAge().years()}</b> years.
      {:else}
        <b
          >{$recipient.normalRetirementAge().years()} years and {$recipient
            .normalRetirementAge()
            .modMonths()} months</b
        >.
      {/if}
      This is in
      <b
        >{$recipient.normalRetirementDate().monthFullName()},
        {$recipient.normalRetirementDate().year()}</b
      >.
    </p>

    {#if $recipient.birthdate.isFirstOfMonth()}
      <div class="insetTextBox pageBreakAvoid">
        <h4>Special Rule</h4>
        <p>
          The month you reach specific ages may seem "off by one" from what you
          entered. Social Security follows English common law that finds that a
          person "attains" an age on the day before their birthdate. Because
          <RName {r} suffix=" was">you were</RName>
          born on the first of the month, this means that <RName
            {r}
            suffix=" attains">you attain</RName
          > age
          <b>{exampleAge.age}</b> on
          <b>{exampleAge.month} {exampleAge.day}, {exampleAge.year}</b>.
        </p>
      </div>
    {/if}

    <p>
      If <RName {r} suffix=" starts">you start</RName> collecting benefits at your
      normal retirement age, <RName {r} apos>your</RName>
      benefit will be the primary insurance amount, rounded down:
    </p>
    <ul>
      <li>
        <b>{benefit.wholeDollars()}</b> / month
      </li>
      <li>
        <b>{benefit.times(12).wholeDollars()}</b>
        / year
      </li>
    </ul>
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }
  .pageBreakAvoid {
    page-break-inside: avoid;
  }
  .insetTextBox {
    box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
    -webkit-box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
    -moz-box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
    -o-box-shadow: inset 0px 0px 10px 0px #ababab, 5px 5px 5px 1px #dddddd;
    margin: 1em;
    padding: 10px;
  }
  .insetTextBox h4 {
    margin: 5px 0 10px 0;
  }
  .insetTextBox p {
    margin: 0 20px;
  }
</style>
