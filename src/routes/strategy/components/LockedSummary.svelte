<script lang="ts">
  import RecipientName from "$lib/components/RecipientName.svelte";
  import type { Recipient } from "$lib/recipient";

  export let recipients: [Recipient, Recipient];
  export let isSingle: boolean;
  export let onedit: () => void;

  function formatBirthdate(recipient: Recipient): string {
    const bd = recipient.birthdate;
    const y = bd.layBirthYear();
    const m = (bd.layBirthMonth() + 1).toString().padStart(2, "0");
    const d = bd.layBirthDayOfMonth().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatGender(recipient: Recipient): string {
    switch (recipient.gender) {
      case "male":
        return "Male";
      case "female":
        return "Female";
      default:
        return "Unspecified";
    }
  }

  function formatPia(recipient: Recipient): string {
    return recipient.pia().primaryInsuranceAmount().wholeDollars();
  }
</script>

<div class="locked-header">
  <div class="locked-title">
    <strong>Recipient information</strong>
    <span class="muted">· locked</span>
  </div>
  <button type="button" class="edit-btn" on:click={onedit}>
    Edit recipient info
  </button>
</div>

<div class="cards" class:single={isSingle}>
  {#each recipients as recipient, i}
    {#if !isSingle || i === 0}
      <div class="card">
        <div class="name"><RecipientName r={recipient} /></div>
        <div class="details">
          Born {formatBirthdate(recipient)} · {formatGender(recipient)} · PIA {formatPia(
            recipient
          )}
        </div>
      </div>
    {/if}
  {/each}
</div>

<style>
  .locked-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  .locked-title {
    font-size: 0.95rem;
    color: #333;
  }
  .muted {
    color: #888;
    font-weight: normal;
  }
  .edit-btn {
    font-size: 0.85rem;
    background: white;
    border: 1px solid #bbb;
    color: #333;
    padding: 0.3rem 0.7rem;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
  }
  .edit-btn:hover,
  .edit-btn:focus {
    border-color: #005ea5;
    color: #005ea5;
    outline: none;
  }
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .cards.single {
    grid-template-columns: 1fr;
    max-width: 600px;
  }
  .card {
    background: #eef1f5;
    border: 1px solid #d5dae2;
    border-radius: 6px;
    padding: 0.7rem 0.9rem;
  }
  .name {
    font-weight: bold;
    font-size: 1rem;
    color: #0b0c0c;
    margin-bottom: 0.2rem;
  }
  .details {
    font-size: 0.9rem;
    color: #555;
    line-height: 1.45;
  }
  @media (max-width: 768px) {
    .cards {
      grid-template-columns: 1fr;
    }
  }
</style>
