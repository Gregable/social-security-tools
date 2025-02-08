<!--
  @component
  @name AgeRequest
  @description
    A component that prompts the user to enter their age.

  @example
    <AgeRequest on:submit={handleAge} />

  @events
    submit: Fired when the user clicks the submit button. The event object
      contains the user's birthdate.
-->

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Birthdate } from "../birthday";

  let bday_day
  let bday_year

  const dispatch = createEventDispatcher();
  function confirm() {
    dispatch("submit", {
      birthdate: Birthdate.FromYMD(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate()
      ),
    });
  }

  function parseNumberString(input: string): number {
    const parsed = parseInt(input);
    if (isNaN(parsed)) return 0;
    return parsed;
  }

  function parseDateInputValue(
    day: string,
    month: string,
    year: string
  ): Date | null {
    let birthdateDay = parseNumberString(day);
    let birthdateMonth = parseNumberString(month) - 1;
    let birthdateYear = parseNumberString(year);

    if (birthdateDay < 1 || birthdateDay > 31) return null;
    if (birthdateMonth < 0 || birthdateMonth > 11) return null;
    if (birthdateYear < 1900 || birthdateYear > 2100) return null;

    // Svelte binds the value of the input to a string, so we need to parse it
    return new Date(
      new Date(Date.UTC(birthdateYear, birthdateMonth, birthdateDay))
    );
  }

  // Svelte binds the value of the input to a string, so we need to parse it
  // and store it in a Date object. If the date is invalid, we disable the
  // button.
  let parsedDate: Date;
  let birthdateDayStr = "";
  let birthdateMonthStr = "";
  let birthdateYearStr = "";
  let disabled = true;
  $: disabled = (() => {
    parsedDate = parseDateInputValue(
      birthdateDayStr,
      birthdateMonthStr,
      birthdateYearStr
    );
    if (parsedDate == null) return true;
    // Date is in the future, can't be valid:
    if (parsedDate > new Date()) return true;
    // Date is too far in the past, can't be valid:
    if (parsedDate < new Date(1900, 0, 1)) return true;

    return false;
  })();

  function isTouchscreen(): boolean {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  function handleKeyUp(event, nextEl) {
    if (/^[a-zA-Z0-9]$/.test(event.key) && event.target.value.length == 2) {
      nextEl.focus();
    }
  }

  function checkEnter(event) {
    if (event.key == 'Enter' && !disabled) {
      confirm();
    }
  }

  function init(el) {
    el.focus();
  }
</script>

<svelte:window on:keydown={checkEnter} />

<div class="confirmation">
  <!-- Inspired by
https://design-system.service.gov.uk/patterns/dates/#asking-for-memorable-dates
-->
  <fieldset>
    <legend>
      <h3>Step 2 of 2: When were you born?</h3>
      <p>
        Birthdate is used to calculate when you can collect Social Security
        benefits, as well as to determine the amount of your benefit.
      </p>
    </legend>
    <div class="hint">For example, 09 22 1975</div>
    <div class="date-input-item">
      <label class="date-input-label" for="bday-month">Month</label>
      <input
        class="input input-width-2"
        id="bday-month"
        name="bday-month"
        type="text"
        inputmode="numeric"
        placeholder="MM"
        maxlength="2"
        on:keyup={event => handleKeyUp(event, bday_day)}
        bind:value={birthdateMonthStr}
        use:init
      />
    </div>
    <div class="date-input-item">
      <label class="date-input-label" for="bday-day">Day</label>
      <input
        class="input input-width-2"
        id="bday-day"
        name="bday-day"
        type="text"
        inputmode="numeric"
        placeholder="DD"
        maxlength="2"
        on:keyup={event => handleKeyUp(event, bday_year)}
        bind:value={birthdateDayStr}
        bind:this={bday_day}
      />
    </div>
    <div class="date-input-item">
      <label class="date-input-label" for="bday-year">Year</label>
      <input
        class="input input-width-4"
        id="bday-year"
        name="bday-year"
        type="text"
        inputmode="numeric"
        placeholder="YYYY"
        maxlength="4"
        bind:value={birthdateYearStr}
        bind:this={bday_year}
      />
    </div>
    <button on:click={confirm} {disabled}>
      <ico>&#10003;</ico> Next
    </button>
  </fieldset>
</div>

<style>
  .confirmation {
    font-size: 1.2em;
    line-height: 1.3;
  }
  fieldset {
    margin-bottom: 20px;
    max-width: calc(min(600px, 100% - 20px));
    margin: auto;
    border: 0;
  }
  .hint {
    margin: -5px 0 15px 0;
    font-weight: 400;
    color: #505a5f;
  }
  .date-input-item {
    display: inline-block;
    margin-right: 20px;
  }
  .date-input-label {
    display: block;
    margin-bottom: 5px;
    font-weight: 400;
    color: #0b0c0c;
  }
  @media (max-width: 640px) {
    fieldset {
      font-size: 16px;
    }
  }
  @media (min-width: 641px) {
    fieldset {
      font-size: 19px;
    }
  }
  .input {
    font-size: 1.2em;
    line-height: 1.3;
    height: 2.5em;
    padding: 5px;
    border: 2px solid #0b0c0c;
    border-radius: 0;
    appearance: none;
  }
  .input:focus {
    outline: 3px solid #fd0;
    outline-offset: 0;
    box-shadow: inset 0 0 0 2px;
  }
  .input-width-2 {
    max-width: 2.75em;
  }
  .input-width-4 {
    max-width: 4.5em;
  }
  button {
    background: #4ac15a;
    border: 0 none;
    border-radius: 36px;
    color: #fff;
    font-size: 18px;
    padding: 8px 26px;
    margin: 20px 0px;
    min-width: 110px;
    cursor: pointer;
  }
  button:disabled,
  button:disabled:hover {
    background: #ccc;
    cursor: not-allowed;
  }
  button:hover {
    background: #2aa13a;
  }
  button ico {
    font-weight: bold;
    font-size: 22px;
    vertical-align: middle;
  }
</style>
