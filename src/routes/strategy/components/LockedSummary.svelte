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

<section class="locked">
  <header class="section-header">
    <p class="section-kicker">Recipient information</p>
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
  </header>

  <div class="rows" class:single={isSingle}>
    {#each recipients as recipient, i}
      {#if !isSingle || i === 0}
        <div class="row">
          {#if !recipient.only}
            <span class="name"><RecipientName r={recipient} /></span>
          {/if}
          <span class="details">
            Born {formatBirthdate(recipient)} · {formatGender(recipient)} · PIA {formatPia(
              recipient
            )}
          </span>
        </div>
      {/if}
    {/each}
  </div>
</section>

<style>
  .locked {
    margin: 0.5rem 0 1.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding-bottom: 0.5rem;
    margin-bottom: 0.6rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-kicker {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .edit-btn {
    flex: 0 0 auto;
    background: transparent;
    border: none;
    color: #4b5563;
    padding: 0.25rem 0.4rem;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    transition: color 0.15s ease;
  }
  .edit-btn:hover,
  .edit-btn:focus-visible {
    color: #081d88;
    outline: none;
  }
  .edit-btn:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 2px;
  }
  .edit-arrow {
    display: block;
    transition: transform 0.15s ease;
  }
  .edit-btn:hover .edit-arrow,
  .edit-btn:focus-visible .edit-arrow {
    transform: translateX(-2px);
  }

  .rows {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem 1.5rem;
  }
  .rows.single {
    grid-template-columns: 1fr;
  }
  .row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.92rem;
    line-height: 1.4;
  }
  .name {
    font-weight: 700;
    color: #0b0c0c;
  }
  .details {
    color: #4b5563;
  }

  @media (max-width: 768px) {
    .rows {
      grid-template-columns: 1fr;
    }
  }
</style>
