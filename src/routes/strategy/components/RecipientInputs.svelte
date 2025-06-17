<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import RecipientName from "$lib/components/RecipientName.svelte";

  // Props
  export let recipients: [Recipient, Recipient];
  export let piaValues: [number, number];
  export let birthdateInputs: [string, string];
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
          <RecipientName r={recipient} /> PIA:
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
          <RecipientName r={recipient} /> Birthdate:
        </label>
        <input id="birthdate{i}" type="date" bind:value={birthdateInputs[i]} />
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
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    .input-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
