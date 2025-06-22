<!--
  @component
  @name BirthdateInput
  @description
    A component that allows users to enter a birthdate using separate month, day, and year inputs.

  @example
    <BirthdateInput bind:birthdate={someDateValue} />

  @events
    change: Fired when the user changes any of the date inputs and a valid date is created.
-->

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Birthdate } from "../birthday";

  // Props
  export let birthdate: Birthdate = null;
  export let inputId = "birthdate";
  export let autoFocus = false;
  export let isValid = false;

  let bday_day;
  let bday_year;

  const dispatch = createEventDispatcher();

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

    return new Date(
      new Date(Date.UTC(birthdateYear, birthdateMonth, birthdateDay))
    );
  }

  // Svelte binds the value of the input to a string, so we need to parse it
  // and store it in a Date object.
  let parsedDate: Date;
  let birthdateDayStr = "";
  let birthdateMonthStr = "";
  let birthdateYearStr = "";

  // One-way initializing of string values from birthdate prop
  function initializeFromBirthdate() {
    if (birthdate) {
      birthdateMonthStr = (birthdate.layBirthMonth() + 1).toString().padStart(2, '0');
      birthdateDayStr = birthdate.layBirthDayOfMonth().toString().padStart(2, '0');
      birthdateYearStr = birthdate.layBirthYear().toString();
    }
  }
  
  // Initialize values when component mounts
  $: if (birthdate && !birthdateYearStr) {
    initializeFromBirthdate();
  }

  // Update parsed date and validity when inputs change
  $: {
    parsedDate = parseDateInputValue(
      birthdateDayStr,
      birthdateMonthStr,
      birthdateYearStr
    );
    
    isValid = !!parsedDate && 
              parsedDate <= new Date() && 
              parsedDate >= new Date(1900, 0, 1);
  }
  
  // Create Birthdate object and emit change event when valid
  $: if (isValid && parsedDate) {
    const newBirthdate = Birthdate.FromYMD(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate()
    );
    if (!birthdate || 
        birthdate.layBirthYear() !== newBirthdate.layBirthYear() ||
        birthdate.layBirthMonth() !== newBirthdate.layBirthMonth() ||
        birthdate.layBirthDayOfMonth() !== newBirthdate.layBirthDayOfMonth()) {
      birthdate = newBirthdate;
      dispatch("change", { birthdate });
    }
  }

  function handleKeyUp(event, nextEl) {
    if (/^[a-zA-Z0-9]$/.test(event.key) && event.target.value.length == 2) {
      nextEl.focus();
    }
  }

  function init(el) {
    if (autoFocus) {
      el.focus();
    }
  }
</script>

<div class="date-input-container">
  <div class="date-input-item">
    <label class="date-input-label" for="{inputId}-month">Month</label>
    <input
      class="input input-width-2"
      id="{inputId}-month"
      name="{inputId}-month"
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
    <label class="date-input-label" for="{inputId}-day">Day</label>
    <input
      class="input input-width-2"
      id="{inputId}-day"
      name="{inputId}-day"
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
    <label class="date-input-label" for="{inputId}-year">Year</label>
    <input
      class="input input-width-4"
      id="{inputId}-year"
      name="{inputId}-year"
      type="text"
      inputmode="numeric"
      placeholder="YYYY"
      maxlength="4"
      bind:value={birthdateYearStr}
      bind:this={bday_year}
    />
  </div>
</div>

<style>
  .date-input-container {
    margin-bottom: 10px;
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
</style>
