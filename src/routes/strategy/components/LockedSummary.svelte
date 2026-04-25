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
  </div>
  <button type="button" class="edit-btn" on:click={onedit}>
    <svg
      class="edit-arrow"
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
    Edit recipient info
  </button>
</div>

<div class="cards" class:single={isSingle}>
  {#each recipients as recipient, i}
    {#if !isSingle || i === 0}
      <div class="card">
        {#if !recipient.only}
          <div class="name"><RecipientName r={recipient} /></div>
        {/if}
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
  .edit-btn {
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
  .edit-btn:hover,
  .edit-btn:focus-visible {
    border-color: #081d88;
    color: #081d88;
    background-color: #f7f8fd;
    outline: none;
  }
  .edit-arrow {
    display: block;
    transition: transform 0.15s ease;
  }
  .edit-btn:hover .edit-arrow,
  .edit-btn:focus-visible .edit-arrow {
    transform: translateX(-2px);
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
