<script lang="ts">
  import { Birthdate } from "$lib/birthday";
  import BirthdateInput from "$lib/components/BirthdateInput.svelte";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { Money } from "$lib/money";
  import type { Recipient } from "$lib/recipient";
  import { onMount } from "svelte";

  export let recipients: [Recipient, Recipient];
  export let piaValues: [number, number];
  export let birthdateInputs: [string, string];
  export let isSingle: boolean = false;
  export let continueDisabled: boolean = true;
  export let errorMessage: string | null = null;

  export let onUpdate: (() => void) | undefined = undefined;
  export let onValidityChange: ((isValid: boolean) => void) | undefined =
    undefined;
  export let oncontinue: (() => void) | undefined = undefined;
  export let onstartover: (() => void) | undefined = undefined;

  let birthdates: [Birthdate | null, Birthdate | null] = [null, null];
  export let birthdateValidity: boolean[] = [false, false];

  let piaValidity: boolean[] = [false, false];
  let piaErrors: string[] = ["", ""];

  $: isValid = isSingle
    ? birthdateValidity[0] && piaValidity[0]
    : birthdateValidity[0] &&
      birthdateValidity[1] &&
      piaValidity[0] &&
      piaValidity[1];

  $: onValidityChange?.(isValid);

  onMount(() => {
    birthdateInputs.forEach((dateStr, index) => {
      if (dateStr) {
        const date = new Date(dateStr);
        if (!Number.isNaN(date.getTime())) {
          birthdates[index] = Birthdate.FromYMD(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          );
        }
      }
    });
    // Seed PIA validity from the current values so Continue's disabled state
    // is correct on first render.
    for (let i = 0; i < 2; i++) validatePia(i, piaValues[i]);
  });

  function handleBirthdateChange(index: number, newBirthdate: Birthdate) {
    if (newBirthdate) {
      const newDateStr = formatDateForInput(newBirthdate);
      birthdateInputs[index] = newDateStr;
      birthdateInputs = [...birthdateInputs];
      recipients[index].birthdate = newBirthdate;
      recipients = [...recipients];
      onUpdate?.();
    }
  }

  function handlePiaChange(index: number, value: number) {
    validatePia(index, value);
    piaValues[index] = value;
    piaValues = [...piaValues];
    recipients[index].setPia(Money.from(value));
    recipients = [...recipients];
    onUpdate?.();
  }

  function validatePia(index: number, value: number) {
    if (Number.isNaN(value) || value <= 0) {
      piaValidity[index] = false;
      piaErrors[index] = "Enter a PIA greater than $0";
    } else if (value > 10000) {
      piaValidity[index] = false;
      piaErrors[index] =
        "PIA seems unusually high (max typical value is around $4,000)";
    } else {
      piaValidity[index] = true;
      piaErrors[index] = "";
    }
    piaValidity = [...piaValidity];
    piaErrors = [...piaErrors];
  }

  function handleNameChange(index: number, event: Event) {
    const name = (event.target as HTMLInputElement).value;
    recipients[index].name = name;
    recipients = [...recipients];
    onUpdate?.();
  }

  function handleGenderChange(index: number, event: Event) {
    const gender = (event.target as HTMLSelectElement).value;
    recipients[index].gender = gender as "male" | "female" | "blended";
    recipients = [...recipients];
    onUpdate?.();
  }

  function formatDateForInput(birthdate: Birthdate | null): string {
    if (!birthdate) return "";
    const year = birthdate.layBirthYear();
    const month = (birthdate.layBirthMonth() + 1).toString().padStart(2, "0");
    const day = birthdate.layBirthDayOfMonth().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
</script>

<div class="form-header">
  <h2>Recipient information</h2>
  <button type="button" class="startover-link" on:click={() => onstartover?.()}>
    ← Start over
  </button>
</div>

<div class="input-grid" class:single={isSingle}>
  {#each recipients as recipient, i}
    {#if !isSingle || i === 0}
      <div class="recipient-column">
        <div class="input-group">
          <label for="name{i}">Name:</label>
          <input
            id="name{i}"
            type="text"
            value={recipient.name}
            on:input={(event) => handleNameChange(i, event)}
          />
        </div>
        <div class="input-group">
          <label for="pia{i}">
            <RecipientName r={recipient} apos /> Primary Insurance Amount (PIA):
          </label>
          <input
            id="pia{i}"
            type="number"
            step="100"
            min="0"
            value={piaValues[i]}
            class:invalid={!piaValidity[i]}
            on:input={(event) =>
              handlePiaChange(i, parseFloat(event.currentTarget.value) || 0)}
          />
          {#if !piaValidity[i] && piaErrors[i]}
            <span class="error-message">{piaErrors[i]}</span>
          {/if}
        </div>
        <div class="input-group">
          <label for="birthdate{i}">
            <RecipientName r={recipient} apos /> Birthdate:
          </label>
          <BirthdateInput
            bind:birthdate={birthdates[i]}
            bind:isValid={birthdateValidity[i]}
            onchange={(event) => handleBirthdateChange(i, event.birthdate)}
            inputId={`birthdate${i}`}
          />
        </div>
        <div class="input-group">
          <label for="gender{i}">
            <RecipientName r={recipient} apos /> Gender (for mortality calculation):
          </label>
          <select
            id="gender{i}"
            value={recipient.gender}
            on:change={(event) => handleGenderChange(i, event)}
            class="select-input"
          >
            <option value="blended">Unspecified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>
    {/if}
  {/each}
</div>

{#if errorMessage}
  <div class="error-banner" role="alert">{errorMessage}</div>
{/if}

<div class="actions">
  <button
    type="button"
    class="continue-button"
    disabled={continueDisabled}
    on:click={() => oncontinue?.()}
    title={continueDisabled ? "Fill in all required fields to continue" : ""}
  >
    Continue →
  </button>
</div>

<style>
  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .form-header h2 {
    margin: 0;
  }
  .startover-link {
    background: transparent;
    border: none;
    color: #0074d9;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0.2rem 0.3rem;
    font-family: inherit;
  }
  .startover-link:hover,
  .startover-link:focus {
    text-decoration: underline;
    outline: none;
  }

  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  .input-grid.single {
    grid-template-columns: 1fr;
    max-width: 600px;
    margin: 0 auto;
  }
  .recipient-column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .input-group label {
    font-weight: bold;
  }
  .input-group input:not([type="range"]) {
    font-size: 1.2em;
    line-height: 1.3;
    height: 2.5em;
    padding: 5px;
    border: 2px solid #0b0c0c;
    border-radius: 0;
    appearance: none;
  }
  .input-group input:not([type="range"]):focus,
  .input-group select:focus {
    outline: 3px solid #fd0;
    outline-offset: 0;
    box-shadow: inset 0 0 0 2px;
  }
  .input-group input.invalid {
    border-color: #d4351c;
    background-color: #fee;
  }
  .error-message {
    color: #d4351c;
    font-size: 0.9em;
    margin-top: 0.25rem;
  }
  .select-input {
    font-size: 1.2em;
    line-height: 1.3;
    height: 2.5em;
    padding: 5px;
    border: 2px solid #0b0c0c;
    border-radius: 0;
    appearance: none;
    background-color: white;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000000' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 30px;
  }

  .error-banner {
    margin-top: 1rem;
    padding: 0.6rem 0.9rem;
    background: #fee;
    border: 1px solid #d4351c;
    color: #a1241a;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .actions {
    margin-top: 1.25rem;
    display: flex;
    justify-content: flex-end;
  }
  .continue-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  .continue-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .input-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
