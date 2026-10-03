<!--
  @component
  @name WidowedInputs
  @description
    The widowed-mode form: the survivor's own details on the left, the late
    spouse's on the right. Survivor benefits depend on what the late spouse
    had claimed and when they died, so this asks for both, along with which
    of the survivor's two benefits have already started.
-->

<script lang="ts">
  import { Birthdate } from "$lib/birthday";
  import BirthdateInput from "$lib/components/BirthdateInput.svelte";
  import InfoTip from "$lib/components/InfoTip.svelte";
  import { currentMonthDate } from "$lib/components/recommended-filing-card";
  import { Money } from "$lib/money";
  import type { Recipient } from "$lib/recipient";
  import {
    earliestFilingDate,
    isEligibleToHaveFiled,
    validateFiledMonth,
  } from "$lib/strategy/calculations/already-filed";
  import {
    earliestSurvivorBenefitDate,
    isEligibleToHaveFiledForSurvivor,
    type LateSpouseClaimKind,
    validateDeathMonth,
    validateLateSpouseFiledMonth,
    validateSurvivorFiledMonth,
    type WidowedInput,
  } from "$lib/strategy/calculations/late-spouse";
  import { onMount } from "svelte";
  import MonthYearInput from "./MonthYearInput.svelte";
  import ReceivingSinceInput from "./ReceivingSinceInput.svelte";

  /** Bounds for any four-digit year typed into this form. */
  const YEAR_INPUT_RANGE = { min: 1900, max: 2100 };
  /** Above this a PIA is almost certainly a typo. */
  const MAX_PIA = 10000;

  /** [the survivor, the late spouse] */
  export let recipients: [Recipient, Recipient];
  export let piaValues: [number | null, number | null];
  export let birthdateInputs: [string, string];
  export let widowedInput: WidowedInput;
  export let continueDisabled: boolean = true;
  export let errorMessage: string | null = null;

  export let onUpdate: (() => void) | undefined = undefined;
  export let onValidityChange: ((isValid: boolean) => void) | undefined =
    undefined;
  export let oncontinue: (() => void) | undefined = undefined;
  export let onstartover: (() => void) | undefined = undefined;

  const currentDate = currentMonthDate();

  let birthdates: [Birthdate | null, Birthdate | null] = [null, null];
  let birthdateValidity: [boolean, boolean] = [false, false];
  let piaValidity: [boolean, boolean] = [false, false];
  let piaErrors: [string, string] = ["", ""];

  // Reported by the month inputs. The optional ones are valid while hidden.
  let deathMonthValid = false;
  let retirementValid = false;
  let survivorFiledValid = true;
  let ownFiledValid = true;

  $: survivorBirthdate = birthdates[0];
  $: spouseBirthdate = birthdates[1];
  $: deathMonth = widowedInput.deathMonth;

  // The optional controls appear only once they could apply: survivor
  // benefits from 60 (and not before the death), own benefits from 62.
  $: showSurvivorFiled =
    survivorBirthdate !== null &&
    deathMonth !== null &&
    isEligibleToHaveFiledForSurvivor(survivorBirthdate, deathMonth, currentDate);
  $: showOwnFiled =
    survivorBirthdate !== null &&
    isEligibleToHaveFiled(survivorBirthdate, currentDate);
  $: showRetirementStart =
    widowedInput.claimKind === "retirement" && spouseBirthdate !== null;

  // A control that unmounts can no longer report, and its last month must
  // not reach the optimizer, so reset both here.
  $: if (!showSurvivorFiled) clearSurvivorFiled();
  $: if (!showOwnFiled) clearOwnFiled();

  function clearSurvivorFiled() {
    survivorFiledValid = true;
    if (widowedInput.survivorFiledAt !== null) {
      widowedInput.survivorFiledAt = null;
    }
  }

  function clearOwnFiled() {
    ownFiledValid = true;
    if (widowedInput.ownFiledAt !== null) widowedInput.ownFiledAt = null;
  }

  $: isValid =
    birthdateValidity[0] &&
    birthdateValidity[1] &&
    piaValidity[0] &&
    piaValidity[1] &&
    deathMonthValid &&
    (widowedInput.claimKind !== "retirement" || retirementValid) &&
    survivorFiledValid &&
    ownFiledValid;

  $: onValidityChange?.(isValid);

  // Keys that tell the month inputs to re-validate when a rule they depend
  // on changes. See MonthYearInput.
  $: survivorKey = birthdateKey(survivorBirthdate);
  $: spouseKey = birthdateKey(spouseBirthdate);
  $: deathKey = deathMonth?.monthsSinceEpoch() ?? "";

  function birthdateKey(birthdate: Birthdate | null): string {
    if (birthdate === null) return "";
    return `${birthdate.layBirthYear()}-${birthdate.layBirthMonth()}-${birthdate.layBirthDayOfMonth()}`;
  }

  onMount(() => {
    birthdateInputs.forEach((dateStr, index) => {
      if (!dateStr) return;
      const [yearStr, monthStr, dayStr] = dateStr.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      // Range-check before constructing Birthdate: FromYMD throws on
      // out-of-range values, which would otherwise surface as an unhandled
      // exception inside onMount.
      if (
        year >= YEAR_INPUT_RANGE.min &&
        year <= YEAR_INPUT_RANGE.max &&
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
    validatePia(0, piaValues[0]);
    validatePia(1, piaValues[1]);
  });

  function formatDateForInput(birthdate: Birthdate): string {
    const year = birthdate.layBirthYear();
    const month = (birthdate.layBirthMonth() + 1).toString().padStart(2, "0");
    const day = birthdate.layBirthDayOfMonth().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function handleBirthdateChange(index: 0 | 1, birthdate: Birthdate) {
    if (!birthdate) return;
    birthdateInputs[index] = formatDateForInput(birthdate);
    birthdateInputs = [...birthdateInputs];
    recipients[index].birthdate = birthdate;
    recipients = [...recipients];
    onUpdate?.();
  }

  function handleGenderChange(event: Event) {
    const gender = (event.target as HTMLSelectElement).value;
    recipients[0].gender = gender as "male" | "female" | "blended";
    recipients = [...recipients];
    onUpdate?.();
  }

  function handleClaimKindChange(kind: LateSpouseClaimKind) {
    widowedInput.claimKind = kind;
    if (kind !== "retirement") {
      widowedInput.retirementStartedAt = null;
      retirementValid = false;
    }
    onUpdate?.();
  }

  function parsePiaInput(raw: string): number | null {
    if (raw.trim() === "") return null;
    const n = parseFloat(raw);
    return Number.isNaN(n) ? null : n;
  }

  function handlePiaChange(index: 0 | 1, value: number | null) {
    validatePia(index, value);
    piaValues[index] = value;
    piaValues = [...piaValues];
    if (value !== null && !Number.isNaN(value)) {
      recipients[index].setPia(Money.from(value));
      recipients = [...recipients];
    }
    onUpdate?.();
  }

  /**
   * The survivor may have no retirement benefit of their own, so $0 is
   * fine for them. The late spouse needs a PIA above $0, or there is no
   * survivor benefit to plan around.
   */
  function validatePia(index: 0 | 1, value: number | null) {
    let error = "";
    if (value === null) {
      error = index === 0 ? "Enter your PIA, or 0" : "Enter their PIA";
    } else if (Number.isNaN(value) || value < 0) {
      error = "PIA cannot be negative";
    } else if (index === 1 && value === 0) {
      error = "A survivor benefit needs their PIA to be more than $0";
    } else if (value > MAX_PIA) {
      error = "PIA seems unusually high (max typical value is around $4,000)";
    }
    piaValidity[index] = error === "";
    piaErrors[index] = error;
    piaValidity = [...piaValidity];
    piaErrors = [...piaErrors];
  }

  function handleSubmit() {
    if (!continueDisabled) oncontinue?.();
  }
</script>

<form class="form-wrapper" on:submit|preventDefault={handleSubmit}>
  <header class="form-header">
    <div class="form-title-block">
      <h2>Tell us about you and your late spouse</h2>
      <p class="form-hint">
        For widows and widowers, including surviving divorced spouses who were
        married at least 10 years.
      </p>
    </div>
    <button type="button" class="back-btn" on:click={() => onstartover?.()}>
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

  <div class="input-grid">
    <div class="person-column">
      <h3 class="column-title">You</h3>
      <div class="input-group">
        <label for="gender0">
          Your gender
          <InfoTip label="Why we ask for gender">
            SSA mortality tables differ by sex, so we use this to estimate life
            expectancy. Leave as <em>Unspecified</em> for a blended estimate.
          </InfoTip>
        </label>
        <select
          id="gender0"
          value={recipients[0].gender}
          on:change={handleGenderChange}
          class="select-input"
        >
          <option value="blended">Unspecified</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div class="input-group">
        <label for="birthdate0">Your birthdate</label>
        <BirthdateInput
          bind:birthdate={birthdates[0]}
          bind:isValid={birthdateValidity[0]}
          onchange={(event) => handleBirthdateChange(0, event.birthdate)}
          inputId="birthdate0"
        />
      </div>
      {#if showSurvivorFiled && survivorBirthdate !== null && deathMonth !== null}
        <ReceivingSinceInput
          inputId="survivor-filed"
          yearRange={YEAR_INPUT_RANGE}
          yearMin={earliestSurvivorBenefitDate(survivorBirthdate, deathMonth).year()}
          yearMax={currentDate.year()}
          bind:value={widowedInput.survivorFiledAt}
          validate={(month) =>
            validateSurvivorFiledMonth(
              survivorBirthdate,
              month,
              deathMonth,
              currentDate
            )}
          revalidateKey={`${survivorKey}|${deathKey}`}
          onchange={() => onUpdate?.()}
          onvaliditychange={(valid) => (survivorFiledValid = valid)}
        >
          You already receive survivor benefits
          <InfoTip label="Why we ask">
            Once survivor benefits have started, that date is fixed, so we
            plan only around your own benefit. If you were receiving spousal
            benefits when your spouse died, SSA usually switched them to
            survivor benefits that month.
          </InfoTip>
        </ReceivingSinceInput>
      {/if}
      {#if showOwnFiled && survivorBirthdate !== null}
        <ReceivingSinceInput
          inputId="own-filed"
          yearRange={YEAR_INPUT_RANGE}
          yearMin={earliestFilingDate(survivorBirthdate).year()}
          yearMax={currentDate.year()}
          bind:value={widowedInput.ownFiledAt}
          validate={(month) =>
            validateFiledMonth(survivorBirthdate, month, currentDate)}
          revalidateKey={survivorKey}
          onchange={() => onUpdate?.()}
          onvaliditychange={(valid) => (ownFiledValid = valid)}
        >
          You already receive your own retirement benefits
        </ReceivingSinceInput>
      {/if}
      <div class="input-group">
        <label for="pia0">Your Primary Insurance Amount (PIA)</label>
        <div class="currency-input">
          <span class="currency-prefix" aria-hidden="true">$</span>
          <input
            id="pia0"
            class="pia-input"
            type="number"
            step="any"
            min="0"
            inputmode="decimal"
            value={piaValues[0] ?? ""}
            class:invalid={piaValues[0] !== null && !piaValidity[0]}
            on:input={(event) =>
              handlePiaChange(0, parsePiaInput(event.currentTarget.value))}
          />
        </div>
        {#if piaValues[0] !== null && !piaValidity[0] && piaErrors[0]}
          <span class="error-message">{piaErrors[0]}</span>
        {/if}
        <p class="field-note">
          Your own benefit at full retirement age, from your Social Security
          statement. Enter 0 if you have no work record of your own.
        </p>
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

    <div class="person-column">
      <h3 class="column-title">Your late spouse</h3>
      <div class="input-group">
        <label for="birthdate1">Their birthdate</label>
        <BirthdateInput
          bind:birthdate={birthdates[1]}
          bind:isValid={birthdateValidity[1]}
          onchange={(event) => handleBirthdateChange(1, event.birthdate)}
          inputId="birthdate1"
        />
      </div>
      <MonthYearInput
        inputId="death-month"
        legend="Month they died"
        prominent
        yearRange={YEAR_INPUT_RANGE}
        yearMax={currentDate.year()}
        bind:value={widowedInput.deathMonth}
        validate={(month) =>
          spouseBirthdate !== null
            ? validateDeathMonth(spouseBirthdate, month, currentDate)
            : month.greaterThan(currentDate)
              ? "The month of death cannot be in the future."
              : null}
        revalidateKey={spouseKey}
        onchange={() => onUpdate?.()}
        onvaliditychange={(valid) => (deathMonthValid = valid)}
      />
      <fieldset class="claim-choice">
        <legend class="claim-legend">
          When they died, they were receiving
          <InfoTip label="Why this matters">
            A spouse who started retirement benefits early limits the survivor
            benefit to the larger of what they were receiving and 82.5% of
            their PIA. One who waited past full retirement age raises it.
          </InfoTip>
        </legend>
        <label class="radio-option">
          <input
            type="radio"
            name="claim-kind"
            value="none"
            checked={widowedInput.claimKind === "none"}
            on:change={() => handleClaimKindChange("none")}
          />
          No Social Security benefits yet
        </label>
        <label class="radio-option">
          <input
            type="radio"
            name="claim-kind"
            value="retirement"
            checked={widowedInput.claimKind === "retirement"}
            on:change={() => handleClaimKindChange("retirement")}
          />
          Retirement benefits
        </label>
        {#if showRetirementStart && spouseBirthdate !== null}
          <div class="claim-start">
            <MonthYearInput
              inputId="spouse-filed"
              legend="Month their retirement benefits started"
              yearRange={YEAR_INPUT_RANGE}
              yearMin={earliestFilingDate(spouseBirthdate).year()}
              yearMax={currentDate.year()}
              bind:value={widowedInput.retirementStartedAt}
              validate={(month) =>
                deathMonth === null
                  ? "Enter the month they died first."
                  : validateLateSpouseFiledMonth(
                      spouseBirthdate,
                      month,
                      deathMonth
                    )}
              revalidateKey={`${spouseKey}|${deathKey}`}
              onchange={() => onUpdate?.()}
              onvaliditychange={(valid) => (retirementValid = valid)}
            />
          </div>
        {/if}
        <label class="radio-option">
          <input
            type="radio"
            name="claim-kind"
            value="disability"
            checked={widowedInput.claimKind === "disability"}
            on:change={() => handleClaimKindChange("disability")}
          />
          Disability benefits
        </label>
      </fieldset>
      <div class="input-group">
        <label for="pia1">Their Primary Insurance Amount (PIA)</label>
        <div class="currency-input">
          <span class="currency-prefix" aria-hidden="true">$</span>
          <input
            id="pia1"
            class="pia-input"
            type="number"
            step="any"
            min="0"
            inputmode="decimal"
            value={piaValues[1] ?? ""}
            class:invalid={piaValues[1] !== null && !piaValidity[1]}
            on:input={(event) =>
              handlePiaChange(1, parsePiaInput(event.currentTarget.value))}
          />
        </div>
        {#if piaValues[1] !== null && !piaValidity[1] && piaErrors[1]}
          <span class="error-message">{piaErrors[1]}</span>
        {/if}
        <p class="field-note">
          Their benefit at full retirement age, not the amount they were paid.
          SSA can tell you; it is also on their Social Security statement. If
          they died before 62, use the figure SSA gives you, which can be
          higher.
        </p>
      </div>
    </div>
  </div>

  <p class="scope-note">
    This assumes you did not remarry before age 60 and are not caring for
    their child under 16; either changes which benefits you can get.
  </p>

  {#if errorMessage}
    <div class="error-banner" role="alert">
      <p class="error-text">{errorMessage}</p>
      <p class="error-help">
        Reloading the page and trying again often clears it. If it keeps
        happening, <a href="/contact">let us know</a>.
      </p>
    </div>
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
  .person-column {
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
    min-width: 0;
  }
  .column-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid #e5e7eb;
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
  .error-message {
    color: #d4351c;
    font-size: 0.85rem;
    margin-top: 0.15rem;
  }
  .select-input {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
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
  .field-note {
    margin: 0.2rem 0 0;
    font-size: 0.85rem;
    line-height: 1.4;
    color: #4b5563;
  }
  .pia-helper {
    margin-top: 0.3rem;
    font-size: 0.85rem;
    color: #081d88;
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    width: fit-content;
  }
  .pia-helper:hover span,
  .pia-helper:focus-visible span {
    text-decoration: underline;
  }
  .pia-helper-arrow {
    display: block;
  }

  .claim-choice {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin: 0;
    padding: 0;
    border: none;
    min-width: 0;
  }
  .claim-legend {
    padding: 0;
    margin-bottom: 0.2rem;
    font-weight: 600;
    font-size: 0.95rem;
    color: #1f2937;
  }
  .radio-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    color: #1f2937;
    cursor: pointer;
  }
  .claim-start {
    margin: 0 0 0.25rem 1.6rem;
    padding: 0 0 0 0.75rem;
    border-left: 2px solid #d8dbe6;
  }

  .scope-note {
    margin: 1.5rem 0 0;
    font-size: 0.85rem;
    line-height: 1.45;
    color: #6b7280;
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
  .error-text {
    margin: 0;
  }
  .error-help {
    margin: 0.4rem 0 0;
    font-size: 0.85rem;
    opacity: 0.85;
  }
  .error-help a {
    color: inherit;
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
  .continue-button:disabled {
    background-color: #c7ccd6;
    cursor: not-allowed;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    .input-grid {
      grid-template-columns: 1fr;
      gap: 1.75rem;
    }
  }
</style>
