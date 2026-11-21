<!--
  @component
  A small button that copies a value to the clipboard and briefly shows
  "Copied", or "Not copied" if the browser refuses. Used beside values that
  users paste into another tool. Hidden where the Clipboard API is
  unavailable (for example, pages not served over HTTPS).
-->
<script lang="ts">
import { onDestroy, onMount } from 'svelte';

/** The text to copy. */
export let value: string;
/** Accessible name and tooltip, e.g. "Copy amount for Social Security". */
export let label: string;

type CopyStatus = 'idle' | 'copied' | 'failed';

let canCopy = false;
let status: CopyStatus = 'idle';
let timer: ReturnType<typeof setTimeout> | undefined;

onMount(() => {
  canCopy = typeof navigator.clipboard?.writeText === 'function';
});

function resetStatus(_value: string) {
  clearTimeout(timer);
  status = 'idle';
}

// A new value means any earlier "Copied" no longer describes it.
$: resetStatus(value);

async function copy() {
  try {
    await navigator.clipboard.writeText(value);
    status = 'copied';
  } catch (err) {
    console.error('Clipboard write failed:', err);
    status = 'failed';
  }
  clearTimeout(timer);
  timer = setTimeout(() => {
    status = 'idle';
  }, 1500);
}

onDestroy(() => clearTimeout(timer));

const STATUS_TEXT: Record<CopyStatus, string> = {
  idle: '',
  copied: 'Copied',
  failed: 'Not copied',
};
</script>

{#if canCopy}
  <button
    type="button"
    class="copy-btn"
    class:failed={status === 'failed'}
    title={label}
    aria-label={label}
    on:click={copy}
  >
    {#if status === 'idle'}
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
    {:else}
      <span class="status" aria-hidden="true">{STATUS_TEXT[status]}</span>
    {/if}
  </button>
  <span class="visually-hidden" aria-live="polite">{STATUS_TEXT[status]}</span>
{/if}

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

  .copy-btn.failed {
    border-color: #c92a2a;
    color: #c92a2a;
  }

  .copy-btn svg {
    width: 1em;
    height: 1em;
  }

  .status {
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
