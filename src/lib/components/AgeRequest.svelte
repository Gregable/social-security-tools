<!--
  @component
  @name AgeRequest
  @description
    A component that prompts the user to enter their age.

  @example
    <AgeRequest on:submit={handleAge} />

  @props
    {Birthdate} [birthdate=null] - The birthdate value (bindable)
    {string} [inputId="birthdate"] - The ID prefix to use for the date input fields

  @events
    submit: Fired when the user clicks the submit button. The event object
      contains the user's birthdate.
-->

<script lang="ts">
import { Birthdate } from '../birthday';
import BirthdateInput from './BirthdateInput.svelte';

// Props
export let birthdate: Birthdate = null;
export let inputId = 'birthdate';

// Callback prop for submit event
export let onsubmit: ((detail: { birthdate: Birthdate }) => void) | undefined =
  undefined;
let isValid = false;

function confirm() {
  if (birthdate) {
    onsubmit?.({ birthdate });
  }
}

function handleChange(detail: { birthdate: Birthdate }) {
  birthdate = detail.birthdate;
}

function checkEnter(event) {
  if (event.key === 'Enter' && isValid) {
    confirm();
  }
}
</script>

<svelte:window on:keydown={checkEnter} />

<div class="confirmation">
  <fieldset>
    <legend>
      <h3>Step 2 of 2: When were you born?</h3>
      <p>
        Birthdate is used to calculate when you can collect Social Security
        benefits, as well as to determine the amount of your benefit.
      </p>
    </legend>
    <div class="hint">For example, 09 22 1975</div>

    <BirthdateInput
      bind:birthdate
      bind:isValid
      onchange={handleChange}
      {inputId}
      autoFocus
    />

    <button on:click={confirm} disabled={!isValid}>
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
  .hint {
    margin: -5px 0 15px 0;
    font-weight: 400;
    color: #505a5f;
  }
</style>
