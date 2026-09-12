<!--
  @component
  @name FiledMonthInput
  @description
    The "already receives benefits" control for one recipient: a checkbox
    that reveals a month select and a year input for the month benefits
    started. Publishes a validated MonthDate (or null) through `bind:value`,
    and reports through `onvaliditychange` whether the answer is complete,
    so the parent can hold Continue while the box is ticked with no valid
    month. The parent renders this only for someone old enough to have filed.
-->

<script lang="ts">
  import type { Birthdate } from "$lib/birthday";
  import InfoTip from "$lib/components/InfoTip.svelte";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { ALL_MONTHS_FULL } from "$lib/constants";
  import { MonthDate } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import {
    earliestFilingDate,
    validateFiledMonth,
  } from "$lib/strategy/calculations/already-filed";
  import { onMount } from "svelte";

  /** Whose benefits these are; names the checkbox label. */
  export let recipient: Recipient;
  /** Non-null: the parent only renders this control for an eligible person. */
  export let birthdate: Birthdate;
  /** The month the form is being filled in; a filed month cannot be later. */
  export let currentDate: MonthDate;
  /** Prefix for the element ids, so two instances on a page stay distinct. */
  export let inputId: string;
  /** Bounds for the year field; shared with the birthdate field's check. */
  export let yearRange: { min: number; max: number };
  /** The validated filed month, or null when unticked, incomplete, or invalid. */
  export let value: MonthDate | null = null;
  /** Fires on any change, so the parent can refresh derived state. */
  export let onchange: (() => void) | undefined = undefined;
  /** False while the box is ticked but no valid month has been entered. */
  export let onvaliditychange: ((isValid: boolean) => void) | undefined =
    undefined;

  let checked = false;
  let monthIndex: number | null = null;
  let year: number | null = null;
  let error = "";

  $: errorId = `${inputId}-error`;
  $: yearMin = earliestFilingDate(birthdate).year();
  $: onvaliditychange?.(!checked || (value !== null && error === ""));

  // The birthdate can change while this stays mounted (an edit that keeps
  // the person eligible). A filed month that the new birthdate rules out
  // must not reach the optimizer, so re-validate and publish null with the
  // error. Only `birthdate` is tracked here; the function reads the rest.
  $: revalidateForBirthdate(birthdate);

  function revalidateForBirthdate(_birthdate: Birthdate) {
    if (checked) sync();
  }

  // Seed from the bound value. This covers a restored share URL and the
  // Edit button, which remounts the form with the values already entered.
  // The value is re-validated rather than trusted: a hash can carry a month
  // that parses but is out of range for the birthdate.
  onMount(() => {
    if (value === null) return;
    checked = true;
    monthIndex = value.monthIndex();
    year = value.year();
    sync();
  });

  function handleToggle(event: Event) {
    checked = (event.target as HTMLInputElement).checked;
    if (!checked) {
      monthIndex = null;
      year = null;
    }
    sync();
  }

  function handleMonthChange(event: Event) {
    const raw = (event.target as HTMLSelectElement).value;
    monthIndex = raw === "" ? null : Number(raw);
    sync();
  }

  function handleYearChange(event: Event) {
    const n = Number.parseInt((event.target as HTMLInputElement).value, 10);
    year = Number.isNaN(n) ? null : n;
    sync();
  }

  /**
   * Recomputes the filed month from the inputs, validates it against the
   * birthdate, and publishes it. An unticked, incomplete, or invalid entry
   * publishes null so the parent never sees a month the calculation would
   * reject.
   */
  function sync() {
    if (!checked || monthIndex === null || year === null) {
      error = "";
      value = null;
    } else if (year < yearRange.min || year > yearRange.max) {
      error = "Enter a four-digit year";
      value = null;
    } else {
      const filedAt = MonthDate.initFromYearsMonths({
        years: year,
        months: monthIndex,
      });
      const problem = validateFiledMonth(birthdate, filedAt, currentDate);
      error = problem ?? "";
      value = problem === null ? filedAt : null;
    }
    onchange?.();
  }
</script>

<div class="filed-block reveal">
  <label class="filed-check" for="{inputId}-check">
    <input
      id="{inputId}-check"
      type="checkbox"
      {checked}
      on:change={handleToggle}
    />
    <span>
      <RecipientName r={recipient} /> already receives benefits
      <InfoTip label="Why we ask">
        If benefits have already started, that filing date is fixed. We will
        show it as a fact and optimize only the other person's filing date.
      </InfoTip>
    </span>
  </label>
  {#if checked}
    <fieldset class="filed-when reveal">
      <legend class="filed-when-label">Month benefits started</legend>
      <div class="filed-when-inputs">
        <select
          id="{inputId}-month"
          class="filed-select"
          class:invalid={error !== ""}
          aria-label="Month"
          aria-invalid={error !== ""}
          aria-describedby={error !== "" ? errorId : undefined}
          value={monthIndex ?? ""}
          on:change={handleMonthChange}
        >
          <option value="">Month</option>
          {#each ALL_MONTHS_FULL as name, m}
            <option value={m}>{name}</option>
          {/each}
        </select>
        <input
          id="{inputId}-year"
          class="filed-year"
          class:invalid={error !== ""}
          type="number"
          inputmode="numeric"
          placeholder="Year"
          aria-label="Year"
          aria-invalid={error !== ""}
          aria-describedby={error !== "" ? errorId : undefined}
          min={yearMin}
          max={currentDate.year()}
          value={year ?? ""}
          on:input={handleYearChange}
        />
      </div>
      {#if error}
        <span class="error-message" id={errorId}>{error}</span>
      {/if}
    </fieldset>
  {/if}
</div>

<style>
  .filed-block {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  .filed-check {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;
    color: #1f2937;
    cursor: pointer;
  }
  .filed-check input {
    margin-top: 0.2rem;
    flex: 0 0 auto;
  }
  /* A fieldset for the accessibility grouping only; its default border and
     padding would break the indented layout. */
  .filed-when {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin: 0 0 0 1.6rem;
    padding: 0 0 0 0.75rem;
    border: none;
    border-left: 2px solid #d8dbe6;
    min-width: 0;
  }
  .filed-when-label {
    padding: 0;
    font-weight: 600;
    font-size: 0.9rem;
    color: #1f2937;
  }
  .filed-when-inputs {
    display: flex;
    gap: 0.5rem;
  }
  /* Both controls match the PIA field's box so the form reads as one set of
     inputs. */
  .filed-select,
  .filed-year {
    font-size: 1rem;
    line-height: 1.4;
    padding: 0.65rem 0.85rem;
    border: 1.5px solid #d1d5db;
    border-radius: 6px;
    background-color: white;
    color: #0b0c0c;
    font-family: inherit;
    appearance: none;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }
  .filed-select {
    flex: 1 1 auto;
    min-width: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
  .filed-year {
    flex: 0 0 6rem;
    width: 6rem;
  }
  .filed-select:focus,
  .filed-year:focus {
    outline: none;
    border-color: #081d88;
    box-shadow: 0 0 0 3px rgba(8, 29, 136, 0.15);
  }
  .filed-select.invalid,
  .filed-year.invalid {
    border-color: #d4351c;
    background-color: #fef5f5;
  }
  .filed-select.invalid:focus,
  .filed-year.invalid:focus {
    box-shadow: 0 0 0 3px rgba(212, 53, 28, 0.15);
  }
  .error-message {
    color: #d4351c;
    font-size: 0.85rem;
    margin-top: 0.15rem;
  }

  /* Draws the eye whenever the control appears: when a birthdate first makes
     the person eligible, when the box is ticked, and when the form remounts
     via Edit. A re-render while it stays mounted does not replay it. */
  .reveal {
    animation: filed-reveal 320ms ease-out both;
  }
  @keyframes filed-reveal {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .reveal {
      animation: none;
    }
  }
</style>
