<!--
  @component
  @name ReceivingSinceInput
  @description
    A checkbox for "already receives this benefit" that reveals a month and
    year for when it started. The checkbox label is the default slot.
    Publishes a validated MonthDate (or null) through `bind:value`, and
    reports through `onvaliditychange` whether the answer is complete
    (unticked, or ticked with a valid month), so the parent can hold Continue
    while the box is ticked with no valid month.
-->

<script lang="ts">
  import type { MonthDate } from "$lib/month-time";
  import { onMount } from "svelte";
  import MonthYearInput from "./MonthYearInput.svelte";

  /** Prefix for the element ids, so two instances on a page stay distinct. */
  export let inputId: string;
  /** Visible label for the month inputs. */
  export let legend: string = "Month benefits started";
  /** Bounds for any four-digit year typed into the form. */
  export let yearRange: { min: number; max: number };
  /** Hint bounds for the year field's spinner. */
  export let yearMin: number | undefined = undefined;
  export let yearMax: number | undefined = undefined;
  /** The validated month, or null when unticked, incomplete, or invalid. */
  export let value: MonthDate | null = null;
  /** Returns null when the month is acceptable, otherwise a message. */
  export let validate: (month: MonthDate) => string | null;
  /** Changing this re-runs `validate` against the month already entered. */
  export let revalidateKey: string | number = "";
  /** Fires on any change, so the parent can refresh derived state. */
  export let onchange: (() => void) | undefined = undefined;
  /** False while the box is ticked but no valid month has been entered. */
  export let onvaliditychange: ((isValid: boolean) => void) | undefined =
    undefined;

  let checked = false;

  // The month inputs publish null for anything incomplete or invalid, so the
  // bound value alone says whether a ticked box has a usable month.
  $: onvaliditychange?.(!checked || value !== null);

  // A restored share URL or the Edit button remounts this with a month
  // already entered; show it ticked so the month inputs re-validate it.
  onMount(() => {
    if (value !== null) checked = true;
  });

  function handleToggle(event: Event) {
    checked = (event.target as HTMLInputElement).checked;
    if (!checked) value = null;
    onchange?.();
  }
</script>

<div class="receiving-block reveal">
  <label class="receiving-check" for="{inputId}-check">
    <input
      id="{inputId}-check"
      type="checkbox"
      {checked}
      on:change={handleToggle}
    />
    <span><slot /></span>
  </label>
  {#if checked}
    <div class="receiving-when reveal">
      <MonthYearInput
        {inputId}
        {legend}
        {yearRange}
        {yearMin}
        {yearMax}
        bind:value
        {validate}
        {revalidateKey}
        {onchange}
      />
    </div>
  {/if}
</div>

<style>
  .receiving-block {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  .receiving-check {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;
    color: #1f2937;
    cursor: pointer;
  }
  .receiving-check input {
    margin-top: 0.2rem;
    flex: 0 0 auto;
  }
  .receiving-when {
    margin: 0 0 0 1.6rem;
    min-width: 0;
  }
  /* The rule goes on the month inputs' fieldset, as it did before they were
     shared, so it starts level with the middle of their legend. */
  .receiving-when :global(.month-year) {
    padding-left: 0.75rem;
    border-left: 2px solid #d8dbe6;
  }

  /* Draws the eye whenever the control appears: when it first becomes
     relevant, when the box is ticked, and when the form remounts via Edit.
     A re-render while it stays mounted does not replay it. */
  .reveal {
    animation: receiving-reveal 320ms ease-out both;
  }
  @keyframes receiving-reveal {
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
