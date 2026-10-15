<!--
  @component
  @name MonthYearInput
  @description
    A month select and a four-digit year input for one calendar month, with a
    legend and an inline error. Publishes the month through `bind:value` only
    when it is complete and passes `validate`; anything else publishes null,
    so the parent never sees a month the calculation would reject, and can
    tell whether the entry is complete and valid from `value !== null`.
    (A validity callback fired from a reactive statement here would go stale
    whenever a later statement re-validated.)

    Re-validation is keyed on `revalidateKey`, a primitive the parent changes
    whenever the rule behind `validate` changes (a new birthdate, say).
    Keying on the function itself would re-run on every parent render, since
    an inline arrow is a new function each time.
-->

<script lang="ts">
  import { ALL_MONTHS_FULL } from "$lib/constants";
  import { MonthDate } from "$lib/month-time";
  import { onMount } from "svelte";

  /** Prefix for the element ids, so two instances on a page stay distinct. */
  export let inputId: string;
  /** Visible label for the pair of inputs. */
  export let legend: string;
  /**
   * Label the inputs like a top-level field rather than as a detail under a
   * checkbox or option.
   */
  export let prominent: boolean = false;
  /** Bounds for any four-digit year typed into the form. */
  export let yearRange: { min: number; max: number };
  /** Hint bounds for the year field's spinner; not enforced. */
  export let yearMin: number | undefined = undefined;
  export let yearMax: number | undefined = undefined;
  /** The validated month, or null when incomplete or invalid. */
  export let value: MonthDate | null = null;
  /** Returns null when the month is acceptable, otherwise a message. */
  export let validate: (month: MonthDate) => string | null = () => null;
  /** Changing this re-runs `validate` against the month already entered. */
  export let revalidateKey: string | number = "";
  /** Fires on any change, so the parent can refresh derived state. */
  export let onchange: (() => void) | undefined = undefined;

  let monthIndex: number | null = null;
  let year: number | null = null;
  let error = "";
  let mounted = false;

  $: errorId = `${inputId}-error`;
  $: revalidate(revalidateKey);

  function revalidate(_key: string | number) {
    // Before mount the seeded value has not been unpacked into the inputs
    // yet; onMount validates it.
    if (mounted) sync();
  }

  // Seed from the bound value. This covers a restored share URL and the Edit
  // button, which remounts the form with the values already entered. The
  // value is re-validated rather than trusted.
  onMount(() => {
    mounted = true;
    if (value === null) return;
    monthIndex = value.monthIndex();
    year = value.year();
    sync();
  });

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
   * Recomputes the month from the inputs, validates it, and publishes it.
   * An incomplete or invalid entry publishes null.
   */
  function sync() {
    if (monthIndex === null || year === null) {
      error = "";
      value = null;
    } else if (year < yearRange.min || year > yearRange.max) {
      error = "Enter a four-digit year";
      value = null;
    } else {
      const month = MonthDate.initFromYearsMonths({
        years: year,
        months: monthIndex,
      });
      const problem = validate(month);
      error = problem ?? "";
      value = problem === null ? month : null;
    }
    onchange?.();
  }
</script>

<fieldset class="month-year">
  <legend class="month-year-label" class:prominent>{legend}</legend>
  <div class="month-year-inputs">
    <select
      id="{inputId}-month"
      class="month-select"
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
      class="year-input"
      class:invalid={error !== ""}
      type="number"
      inputmode="numeric"
      placeholder="Year"
      aria-label="Year"
      aria-invalid={error !== ""}
      aria-describedby={error !== "" ? errorId : undefined}
      min={yearMin}
      max={yearMax}
      value={year ?? ""}
      on:input={handleYearChange}
    />
  </div>
  {#if error}
    <span class="error-message" id={errorId} role="alert">{error}</span>
  {/if}
</fieldset>

<style>
  /* A fieldset for the accessibility grouping only; its default border and
     padding would break the form's layout. */
  .month-year {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    border: none;
    min-width: 0;
  }
  .month-year-label {
    padding: 0;
    font-weight: 600;
    font-size: 0.9rem;
    color: #1f2937;
  }
  .month-year-label.prominent {
    font-size: 0.95rem;
  }
  .month-year-inputs {
    display: flex;
    gap: 0.5rem;
  }
  /* Both controls match the form's other inputs so it reads as one set. */
  .month-select,
  .year-input {
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
  .month-select {
    flex: 1 1 auto;
    min-width: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
  .year-input {
    flex: 0 0 6rem;
    width: 6rem;
  }
  .month-select:focus,
  .year-input:focus {
    outline: none;
    border-color: #081d88;
    box-shadow: 0 0 0 3px rgba(8, 29, 136, 0.15);
  }
  .month-select.invalid,
  .year-input.invalid {
    border-color: #d4351c;
    background-color: #fef5f5;
  }
  .month-select.invalid:focus,
  .year-input.invalid:focus {
    box-shadow: 0 0 0 3px rgba(212, 53, 28, 0.15);
  }
  .error-message {
    color: #d4351c;
    font-size: 0.85rem;
    margin-top: 0.15rem;
  }
</style>
