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
  import "../global.css";
  import { createEventDispatcher } from "svelte";
  import { Birthdate } from "../lib/birthday";

  const dispatch = createEventDispatcher();
  function confirm() {
    dispatch("submit", { birthdate: new Birthdate(parsedDate) });
  }

  function parseDateInputValue(dateInputValue: string): Date {
    // Svelte binds the value of the input to a string, so we need to parse it
    let out = new Date(dateInputValue);
    // Javascript parses dates in UTC, but converts to local time.
    // This can cause dates to add/subract a day from what's entered because
    // of daylight savings. This line normalizes that. Fun times.
    out = new Date(
      out.getTime() + Math.abs(out.getTimezoneOffset() * 60 * 1000)
    );

    return out;
  }

  // Svelte binds the value of the input to a string, so we need to parse it
  // and store it in a Date object. If the date is invalid, we disable the
  // button.
  let parsedDate: Date;
  let birthdateString = "";
  let disabled = true;
  $: disabled = (() => {
    if (!birthdateString) return true;
    parsedDate = parseDateInputValue(birthdateString);

    // Date is in the future, can't be valid:
    if (parsedDate > new Date()) return true;
    // Date is too far in the past, can't be valid:
    if (parsedDate < new Date(1900, 0, 1)) return true;

    return false;
  })();
</script>

<div class="confirmation">
  <div class="text">
    <h3>Step 3 of 3: Select Birthdate</h3>
    <p>
      Birthdate is used to calculate when you can collect Social Security
      benefits, as well as to determine the amount of your benefit.
    </p>
  </div>

  <input
    type="date"
    class="birthdate-input"
    placeholder="YYYY-MM-DD"
    bind:value={birthdateString}
  />

  <button on:click={confirm} {disabled}>
    <ico>&#10003;</ico> Next
  </button>
</div>

<style>
  .confirmation {
    text-align: center;
    font-size: 18px;
  }
  .text {
    margin-bottom: 20px;
    max-width: calc(min(700px, 100% - 20px));
    margin: auto;
  }
  input {
    font-size: 26px;
    vertical-align: middle;
  }
  button {
    background: #4ac15a;
    border: 0 none;
    border-radius: 36px;
    color: #fff;
    font-size: 18px;
    padding: 8px 26px;
    margin: 4px 10px;
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
