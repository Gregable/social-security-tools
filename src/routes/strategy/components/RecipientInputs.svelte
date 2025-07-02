<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import BirthdateInput from "$lib/components/BirthdateInput.svelte";
  import { Birthdate } from "$lib/birthday";

  // Props
  export let recipients: [Recipient, Recipient];
  export let piaValues: [number, number];
  export let birthdateInputs: [string, string];

  // Convert string dates to Birthdate objects for the BirthdateInput component
  let birthdates: [Birthdate | null, Birthdate | null] = [null, null];
  let birthdateValidity: boolean[] = [false, false];

  // Initialize birthdates from birthdateInputs
  $: {
    birthdateInputs.forEach((dateStr, index) => {
      if (
        dateStr &&
        (!birthdates[index] ||
          birthdateInputs[index] !== formatDateForInput(birthdates[index]))
      ) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          birthdates[index] = Birthdate.FromYMD(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          );
        }
      }
    });
  }

  // Update birthdateInputs when birthdates change
  function updateBirthdateInput(index: number) {
    if (birthdates[index]) {
      birthdateInputs[index] = formatDateForInput(birthdates[index]);
    }
  }

  // Format Birthdate object to YYYY-MM-DD string for input
  function formatDateForInput(birthdate: Birthdate | null): string {
    if (!birthdate) return "";
    const year = birthdate.layBirthYear();
    const month = (birthdate.layBirthMonth() + 1).toString().padStart(2, "0");
    const day = birthdate.layBirthDayOfMonth().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
</script>

<div class="input-grid">
  {#each recipients as recipient, i}
    <div class="recipient-column">
      <div class="input-group">
        <label for="name{i}">Name:</label>
        <input id="name{i}" type="text" bind:value={recipient.name} />
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
          bind:value={piaValues[i]}
        />
      </div>
      <div class="input-group">
        <label for="birthdate{i}">
          <RecipientName r={recipient} apos /> Birthdate:
        </label>
        <BirthdateInput
          bind:birthdate={birthdates[i]}
          bind:isValid={birthdateValidity[i]}
          on:change={() => updateBirthdateInput(i)}
          inputId={`birthdate${i}`}
        />
      </div>
      <div class="input-group">
        <label for="gender{i}">
          <RecipientName r={recipient} apos /> Gender (for mortality calculation):
        </label>
        <select
          id="gender{i}"
          bind:value={recipient.gender}
          class="select-input"
        >
          <option value="blended">Unspecified</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
    </div>
  {/each}
</div>

<style>
  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
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

  .input-group input {
    font-size: 1.2em;
    line-height: 1.3;
    height: 2.5em;
    padding: 5px;
    border: 2px solid #0b0c0c;
    border-radius: 0;
    appearance: none;
  }

  .input-group input:focus,
  .input-group select:focus {
    outline: 3px solid #fd0;
    outline-offset: 0;
    box-shadow: inset 0 0 0 2px;
  }

  .select-input {
    font-size: 1.2em;
    line-height: 1.3;
    height: 2.5em;
    padding: 5px;
    border: 2px solid #0b0c0c;
    border-radius: 0;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000000' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 30px;
  }

  @media (max-width: 768px) {
    .input-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
