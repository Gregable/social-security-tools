<script lang="ts">
  import { slide } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  export let label: string = "How to read this chart";
  let open = false;
</script>

<div class="how-to-read">
  <button
    type="button"
    class="toggle"
    aria-expanded={open}
    on:click={() => (open = !open)}
  >
    <svg
      class="help-icon"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" />
      <path d="M6 6a2 2 0 0 1 4 0c0 1.2-1 1.7-2 2.3v0.7" />
      <circle cx="8" cy="11.3" r="0.7" fill="currentColor" stroke="none" />
    </svg>
    <span>{label}</span>
    <svg
      class="chevron"
      class:open
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M5 3l5 5-5 5" />
    </svg>
  </button>
  {#if open}
    <div
      class="content"
      transition:slide={{ duration: 220, easing: cubicOut }}
    >
      <slot />
    </div>
  {/if}
</div>

<style>
  .how-to-read {
    margin-top: 0.5rem;
  }
  .toggle {
    background: transparent;
    border: none;
    color: #4b5563;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0.35rem 0;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: color 0.15s ease;
  }
  .toggle:hover,
  .toggle:focus-visible {
    color: #081d88;
    outline: none;
  }
  .help-icon {
    display: block;
    flex-shrink: 0;
  }
  .chevron {
    display: block;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }
  .chevron.open {
    transform: rotate(90deg);
  }
  .content {
    margin-top: 0.45rem;
    padding: 0.85rem 1rem;
    background: #f7f8fd;
    border: 1px solid #dcdef5;
    border-radius: 8px;
    font-size: 0.88rem;
    color: #374151;
    line-height: 1.55;
  }
  .content :global(ul) {
    margin: 0;
    padding-left: 1.2rem;
  }
  .content :global(li) {
    margin-bottom: 0.3rem;
  }
  .content :global(li:last-child) {
    margin-bottom: 0;
  }
  .content :global(p) {
    margin: 0.6rem 0 0;
  }
  .content :global(p:first-child) {
    margin-top: 0;
  }
  .content :global(strong) {
    color: #081d88;
    font-weight: 700;
  }
</style>
