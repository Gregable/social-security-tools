<!--
  @component
  A small button that copies a value to the clipboard and briefly shows
  "Copied". Used beside values that users type into another tool.
-->
<script lang="ts">
import { onDestroy } from 'svelte';

/** The text to copy. */
export let value: string;
/** Accessible name, e.g. "Copy amount". */
export let label: string;

let copied = false;
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy() {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch (err) {
    console.error('Failed to copy:', err);
    return;
  }
  copied = true;
  clearTimeout(timer);
  timer = setTimeout(() => {
    copied = false;
  }, 1500);
}

onDestroy(() => clearTimeout(timer));
</script>

<button
  type="button"
  class="copy-btn"
  title={label}
  aria-label={label}
  on:click={copy}
>
  {#if copied}
    <span class="copied">Copied</span>
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  {/if}
</button>
<span class="visually-hidden" aria-live="polite">{copied ? 'Copied' : ''}</span>

<style>
  .copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2em;
    height: 1.75em;
    padding: 0 0.35em;
    border: 1px solid #ced4da;
    border-radius: 4px;
    background: white;
    color: #495057;
    cursor: pointer;
    vertical-align: middle;
  }

  .copy-btn:hover {
    background: #f1f3f5;
  }

  .copy-btn svg {
    width: 1em;
    height: 1em;
  }

  .copied {
    font-size: 0.8em;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
