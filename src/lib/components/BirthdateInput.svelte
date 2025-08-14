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
  import { Birthdate } from '../birthday';
  import { ALL_MONTHS_FULL } from '../constants';

  // Props
  export let birthdate: Birthdate = null;
  export let inputId = 'birthdate';
  export let autoFocus = false;
  export let isValid = false;

  export let onchange: ((event: { birthdate: Birthdate }) => void) | undefined =
    undefined;

  let bday_day;
  let bday_year;

  function parseNumberString(input: string): number {
    const parsed = parseInt(input);
    if (isNaN(parsed)) return 0;
    return parsed;
  }

  function parseDateInputValue(
    day: string,
    month: string,
    year: string
  ): { date: Date | null; errors: string[] } {
    const errors = [];
    let birthdateDay = parseNumberString(day);
    let birthdateMonth = parseNumberString(month);
    let birthdateYear = parseNumberString(year);

    // Only validate fields that have content
    // Validate month (1-12) - only if month field has content
    if (month && (birthdateMonth < 1 || birthdateMonth > 12)) {
      errors.push('Month must be between 1 and 12');
    }

    // Validate year (not in future, not more than 125 years ago) - only if year field has content
    if (year) {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 125;
      if (birthdateYear > currentYear) {
        errors.push('Year cannot be in the future');
      } else if (birthdateYear < minYear) {
        errors.push(`Year cannot be more than 125 years ago (${minYear})`);
      }
    }

    // Validate day (basic range first) - only if day field has content
    if (day && (birthdateDay < 1 || birthdateDay > 31)) {
      errors.push('Day must be between 1 and 31');
    }

    // Only do advanced validation if all fields have content and basic validation passed
    if (month && day && year && errors.length === 0) {
      const testDate = new Date(
        birthdateYear,
        birthdateMonth - 1,
        birthdateDay
      );

      // Check if the date rolled over (invalid day for month)
      if (
        testDate.getFullYear() !== birthdateYear ||
        testDate.getMonth() !== birthdateMonth - 1 ||
        testDate.getDate() !== birthdateDay
      ) {
        errors.push(
          `Invalid day for ${ALL_MONTHS_FULL[birthdateMonth - 1]} ${birthdateYear}`
        );
      } else {
        // Check if date is not in the future
        if (testDate > new Date()) {
          errors.push('Date cannot be in the future');
        }

        return {
          date: new Date(
            Date.UTC(birthdateYear, birthdateMonth - 1, birthdateDay)
          ),
          errors: [],
        };
      }
    }

    return { date: null, errors };
  }

  // Svelte binds the value of the input to a string, so we need to parse it
  // and store it in a Date object.
  let parsedDate: Date;
  let birthdateDayStr = '';
  let birthdateMonthStr = '';
  let birthdateYearStr = '';
  let validationErrors: string[] = [];

  // One-way initializing of string values from birthdate prop
  function initializeFromBirthdate() {
    if (birthdate) {
      birthdateMonthStr = (birthdate.layBirthMonth() + 1)
        .toString()
        .padStart(2, '0');
      birthdateDayStr = birthdate
        .layBirthDayOfMonth()
        .toString()
        .padStart(2, '0');
      birthdateYearStr = birthdate.layBirthYear().toString();
    }
  }

  // Initialize values when component mounts
  $: if (birthdate && !birthdateYearStr) {
    initializeFromBirthdate();
  }

  // Update parsed date and validity when inputs change
  $: {
    const result = parseDateInputValue(
      birthdateDayStr,
      birthdateMonthStr,
      birthdateYearStr
    );

    parsedDate = result.date;
    validationErrors = result.errors;
    isValid = !!parsedDate && validationErrors.length === 0;
  }

  // Create Birthdate object and emit change event when valid
  $: if (isValid && parsedDate) {
    const newBirthdate = Birthdate.FromYMD(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate()
    );
    if (
      !birthdate ||
      birthdate.layBirthYear() !== newBirthdate.layBirthYear() ||
      birthdate.layBirthMonth() !== newBirthdate.layBirthMonth() ||
      birthdate.layBirthDayOfMonth() !== newBirthdate.layBirthDayOfMonth()
    ) {
      birthdate = newBirthdate;
      onchange?.({ birthdate: newBirthdate });
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
      class:invalid={!isValid && birthdateMonthStr}
      id="{inputId}-month"
      name="{inputId}-month"
      type="text"
      inputmode="numeric"
      placeholder="MM"
      maxlength="2"
      on:keyup={(event) => handleKeyUp(event, bday_day)}
      bind:value={birthdateMonthStr}
      use:init
    />
  </div>
  <div class="date-input-item">
    <label class="date-input-label" for="{inputId}-day">Day</label>
    <input
      class="input input-width-2"
      class:invalid={!isValid && birthdateDayStr}
      id="{inputId}-day"
      name="{inputId}-day"
      type="text"
      inputmode="numeric"
      placeholder="DD"
      maxlength="2"
      on:keyup={(event) => handleKeyUp(event, bday_year)}
      bind:value={birthdateDayStr}
      bind:this={bday_day}
    />
  </div>
  <div class="date-input-item">
    <label class="date-input-label" for="{inputId}-year">Year</label>
    <input
      class="input input-width-4"
      class:invalid={!isValid && birthdateYearStr}
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

{#if validationErrors.length > 0 && (birthdateMonthStr || birthdateDayStr || birthdateYearStr)}
  <div class="error-messages">
    {#each validationErrors as error}
      <span class="error-message">{error}</span>
    {/each}
  </div>
{/if}

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

  .input.invalid {
    border-color: #d4351c;
    background-color: #fee;
  }

  .error-messages {
    margin-top: 0.5rem;
  }

  .error-message {
    display: block;
    color: #d4351c;
    font-size: 0.9em;
    margin-bottom: 0.25rem;
  }
</style>
