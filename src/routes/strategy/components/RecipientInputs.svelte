<script lang="ts">
  import { Birthdate } from "$lib/birthday";
  import BirthdateInput from "$lib/components/BirthdateInput.svelte";
  import InfoTip from "$lib/components/InfoTip.svelte";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { Money } from "$lib/money";
  import type { Recipient } from "$lib/recipient";
  import { onMount } from "svelte";

  export let recipients: [Recipient, Recipient];
  export let piaValues: [number | null, number | null];
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
  let birthdateValidity: boolean[] = [false, false];

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
      if (!dateStr) return;
      const [yearStr, monthStr, dayStr] = dateStr.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      // Range-check before constructing Birthdate: FromYMD throws on
      // out-of-range values (e.g. year < 1900), which would otherwise
      // surface as an unhandled exception inside onMount.
      if (
        year >= 1900 &&
        year <= 2100 &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
      ) {
        birthdates[index] = Birthdate.FromYMD(year, month - 1, day);
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

  function handlePiaChange(index: number, value: number | null) {
    validatePia(index, value);
    piaValues[index] = value;
    piaValues = [...piaValues];
    if (value !== null && !Number.isNaN(value)) {
      recipients[index].setPia(Money.from(value));
      recipients = [...recipients];
    }
    onUpdate?.();
  }

  function validatePia(index: number, value: number | null) {
    if (value === null) {
      piaValidity[index] = false;
      piaErrors[index] = "Enter a PIA";
    } else if (Number.isNaN(value) || value < 0) {
      piaValidity[index] = false;
      piaErrors[index] = "PIA cannot be negative";
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

  function parsePiaInput(raw: string): number | null {
    if (raw.trim() === "") return null;
    const n = parseFloat(raw);
    return Number.isNaN(n) ? null : n;
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

  function handleSubmit() {
    if (!continueDisabled) oncontinue?.();
  }

  function formatDateForInput(birthdate: Birthdate | null): string {
    if (!birthdate) return "";
    const year = birthdate.layBirthYear();
    const month = (birthdate.layBirthMonth() + 1).toString().padStart(2, "0");
    const day = birthdate.layBirthDayOfMonth().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
</script>

<form
  class="form-wrapper"
  class:single={isSingle}
  on:submit|preventDefault={handleSubmit}
>
  <header class="form-header">
    <div class="form-title-block">
      <h2>Tell us about {isSingle ? "you" : "you and your spouse"}</h2>
      <p class="form-hint">
        A few quick details to find your optimal filing strategy.
      </p>
    </div>
    <button
      type="button"
      class="back-btn"
      on:click={() => onstartover?.()}
    >
      <svg
        class="back-arrow"
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M10 3 5 8l5 5" />
      </svg>
      Start over
    </button>
  </header>

  <div class="input-grid" class:single={isSingle}>
    {#each recipients as recipient, i}
      {#if !isSingle || i === 0}
        <div class="recipient-column">
        {#if !isSingle}
          <div class="input-pair">
            <div class="input-group">
              <label for="name{i}">
                Name
                <InfoTip label="Why we ask for a name">
                  Shown throughout the results so you can tell strategies
                  apart, especially when comparing options for a couple.
                </InfoTip>
              </label>
              <input
                id="name{i}"
                type="text"
                value={recipient.name}
                on:input={(event) => handleNameChange(i, event)}
              />
            </div>
            <div class="input-group">
              <label for="gender{i}">
                <RecipientName r={recipient} apos>Your</RecipientName> gender
                <InfoTip label="Why we ask for gender">
                  SSA mortality tables differ by sex, so we use this to
                  estimate life expectancy. Leave as <em>Unspecified</em> for
                  a blended estimate.
                </InfoTip>
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
        {:else}
          <div class="input-group">
            <label for="gender{i}">
              <RecipientName r={recipient} apos>Your</RecipientName> gender
              <InfoTip label="Why we ask for gender">
                SSA mortality tables differ by sex, so we use this to estimate
                life expectancy. Leave as <em>Unspecified</em> for a blended
                estimate.
              </InfoTip>
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
        {/if}
        <div class="input-group">
          <label for="birthdate{i}">
            <RecipientName r={recipient} apos>Your</RecipientName> birthdate
          </label>
          <BirthdateInput
            bind:birthdate={birthdates[i]}
            bind:isValid={birthdateValidity[i]}
            onchange={(event) => handleBirthdateChange(i, event.birthdate)}
            inputId={`birthdate${i}`}
          />
        </div>
        <div class="input-group">
          <label for="pia{i}">
            <RecipientName r={recipient} apos>Your</RecipientName> Primary Insurance
            Amount (PIA)
          </label>
          <div class="currency-input">
            <span class="currency-prefix" aria-hidden="true">$</span>
            <input
              id="pia{i}"
              class="pia-input"
              type="number"
              step="100"
              min="0"
              inputmode="numeric"
              value={piaValues[i] ?? ""}
              class:invalid={piaValues[i] !== null && !piaValidity[i]}
              on:input={(event) =>
                handlePiaChange(i, parsePiaInput(event.currentTarget.value))}
            />
          </div>
          {#if piaValues[i] !== null && !piaValidity[i] && piaErrors[i]}
            <span class="error-message">{piaErrors[i]}</span>
          {/if}
          <a class="pia-helper" href="/calculator" tabindex="-1">
            <span>Don't know your PIA? Start here first</span>
            <svg
              class="pia-helper-arrow"
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M6 3l5 5-5 5" />
            </svg>
          </a>
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
    type="submit"
    class="continue-button"
    disabled={continueDisabled}
    title={continueDisabled ? "Fill in all required fields to continue" : ""}
  >
    Continue →
  </button>
</div>
</form>

<style>
  .form-wrapper.single {
    max-width: 560px;
    margin: 0 auto;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.75rem;
  }
  .form-title-block {
    flex: 1 1 auto;
    min-width: 0;
  }
  .form-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #060606;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  .form-hint {
    margin: 0.4rem 0 0;
    font-size: 0.95rem;
    color: #6b7280;
    line-height: 1.45;
  }
  .back-btn {
    flex: 0 0 auto;
    background: white;
    border: 1px solid #d1d5db;
    color: #4b5563;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition:
      border-color 0.15s ease,
      color 0.15s ease,
      background-color 0.15s ease;
  }
  .back-btn:hover,
  .back-btn:focus-visible {
    border-color: #081d88;
    color: #081d88;
    background-color: #f7f8fd;
    outline: none;
  }
  .back-arrow {
    display: block;
    transition: transform 0.15s ease;
  }
  .back-btn:hover .back-arrow,
  .back-btn:focus-visible .back-arrow {
    transform: translateX(-2px);
  }

  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2.5rem;
  }
  .input-grid.single {
    grid-template-columns: 1fr;
  }
  .recipient-column {
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
  }
  .input-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .input-group label {
    font-weight: 600;
    font-size: 0.95rem;
    color: #1f2937;
  }
  .input-group input:not([type="range"]),
  .select-input {
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
  .input-group input:not([type="range"]):focus,
  .select-input:focus {
    outline: none;
    border-color: #081d88;
    box-shadow: 0 0 0 3px rgba(8, 29, 136, 0.15);
  }
  .input-group input.invalid {
    border-color: #d4351c;
    background-color: #fef5f5;
  }
  .input-group input.invalid:focus {
    box-shadow: 0 0 0 3px rgba(212, 53, 28, 0.15);
  }
  .error-message {
    color: #d4351c;
    font-size: 0.85rem;
    margin-top: 0.15rem;
  }
  .currency-input {
    position: relative;
    max-width: 180px;
  }
  .currency-prefix {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    font-weight: 500;
    pointer-events: none;
    user-select: none;
  }
  .input-group input.pia-input {
    width: 100%;
    padding-left: 1.75rem;
  }
  .pia-helper {
    margin-top: 0.45rem;
    font-size: 0.85rem;
    color: #081d88;
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    width: fit-content;
    transition: color 0.15s ease;
  }
  .pia-helper:hover span,
  .pia-helper:focus-visible span {
    text-decoration: underline;
  }
  .pia-helper:hover,
  .pia-helper:focus-visible {
    color: #05126b;
    outline: none;
  }
  .pia-helper-arrow {
    display: block;
    transition: transform 0.15s ease;
  }
  .pia-helper:hover .pia-helper-arrow,
  .pia-helper:focus-visible .pia-helper-arrow {
    transform: translateX(2px);
  }
  .select-input {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }

  .error-banner {
    margin-top: 1.25rem;
    padding: 0.7rem 0.95rem;
    background: #fef5f5;
    border: 1px solid #f0c5c0;
    color: #a1241a;
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .actions {
    margin-top: 1.75rem;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  .continue-button {
    background-color: #081d88;
    color: white;
    border: none;
    padding: 0.75rem 1.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    font-family: inherit;
    box-shadow: 0 1px 2px rgba(11, 17, 48, 0.18);
    transition:
      background-color 0.15s ease,
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }
  .continue-button:hover:not(:disabled) {
    background-color: #05126b;
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(11, 17, 48, 0.28);
  }
  .continue-button:focus-visible:not(:disabled) {
    background-color: #05126b;
    box-shadow:
      0 0 0 3px rgba(8, 29, 136, 0.3),
      0 4px 12px rgba(11, 17, 48, 0.25);
    outline: none;
  }
  .continue-button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(11, 17, 48, 0.25);
  }
  .continue-button:disabled {
    background-color: #c7ccd6;
    cursor: not-allowed;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    .input-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    .input-pair {
      grid-template-columns: 1fr;
    }
  }
</style>
