<script lang="ts">
  import { onDestroy } from "svelte";
  import posthog from "posthog-js";
  import type { Recipient } from "$lib/recipient";
  import { buildCalculatorExport, localIsoDate } from "$lib/components/copy-for-ai";

  export let recipient: Recipient;
  export let spouse: Recipient | null = null;

  let dialogEl: HTMLDialogElement;
  let markdown = "";
  let copied = false;
  let copyError = false;
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  // Clear the pending "Copied!" reset timer if the component is destroyed
  // before it fires, so the callback can't assign to state on a torn-down
  // component (matches the timer cleanup in Sidebar / MobileDesktopPrompt).
  onDestroy(() => {
    if (copyTimer) clearTimeout(copyTimer);
  });

  function openPreview() {
    // Build lazily, only when the user asks to see it, so editing earnings
    // doesn't rebuild the full export on every store update.
    markdown = buildCalculatorExport(recipient, spouse, {
      generatedDate: localIsoDate(new Date()),
    });
    copied = false;
    copyError = false;
    dialogEl.showModal();
  }

  function closePreview() {
    dialogEl.close();
  }

  function onDialogClick(event: MouseEvent) {
    // Native <dialog> doesn't close on backdrop click; emulate it by closing
    // only when the click lands on the dialog element itself (the backdrop),
    // not on its content.
    if (event.target === dialogEl) closePreview();
  }

  async function handleCopy() {
    if (!markdown) return;
    copyError = false;
    try {
      await navigator.clipboard.writeText(markdown);
      copied = true;
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copied = false;
        copyTimer = null;
      }, 2000);
    } catch {
      copyError = true;
      return;
    }
    try {
      posthog.capture("Calculator: AI Export Copied", {
        mode: spouse ? "couple" : "single",
      });
    } catch {
      // analytics must not affect copy UX
    }
  }
</script>

<div class="copy-for-ai">
  <button type="button" class="trigger-btn" on:click={openPreview}>
    <svg
      viewBox="0 0 16 16"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M8 1.5l1.4 3.6L13 6.5 9.4 7.9 8 11.5 6.6 7.9 3 6.5l3.6-1.4z" />
      <path d="M12.6 10.4l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" />
    </svg>
    Copy for AI assistant
  </button>

  <dialog bind:this={dialogEl} class="preview" on:click={onDialogClick}>
    <div class="panel">
      <header class="panel-header">
        <h2>Copy for AI assistant</h2>
        <button
          type="button"
          class="close-btn"
          aria-label="Close"
          on:click={closePreview}
        >
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </header>

      <p class="intro">
        A self-contained summary of this benefit calculation, formatted as
        markdown. Paste it into ChatGPT, Claude, or another AI assistant to ask
        follow-up questions about your Social Security benefits.
      </p>

      <p class="disclosure">
        This includes your birthdate, earnings, and PIA. It stays on your device
        until you paste it somewhere — only share it with tools you trust.
      </p>

      <pre class="markdown" aria-label="AI export preview">{markdown}</pre>

      <div class="actions">
        <button type="button" class="copy-btn" on:click={handleCopy}>
          {#if copied}
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M2 8l4 4 8-8" />
            </svg>
            Copied!
          {:else}
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="5" y="2" width="9" height="11" rx="1.5" />
              <path d="M11 2V1a1 1 0 00-1-1H2a1 1 0 00-1 1v11a1 1 0 001 1h1" />
            </svg>
            Copy to clipboard
          {/if}
        </button>
        <button type="button" class="dismiss-btn" on:click={closePreview}>
          Close
        </button>
        {#if copyError}
          <p class="copy-error">
            Could not copy — select the text above and copy it manually.
          </p>
        {/if}
      </div>
    </div>
  </dialog>
</div>

<style>
  .copy-for-ai {
    margin: 0.5rem 0 1rem;
  }

  /* Matches the report's primary CTA style (see StrategyPromo). */
  .trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #081d88;
    color: #fff;
    border: none;
    padding: 0.55rem 1rem;
    border-radius: 5px;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .trigger-btn:hover,
  .trigger-btn:focus-visible {
    background: #0a23a8;
    outline: none;
  }
  .trigger-btn:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 3px;
  }

  .preview {
    border: none;
    border-radius: 8px;
    padding: 0;
    max-width: min(720px, 92vw);
    width: 100%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  }
  .preview::backdrop {
    background: rgba(0, 0, 0, 0.45);
  }

  .panel {
    display: flex;
    flex-direction: column;
    max-height: min(80vh, 720px);
    padding: 1.25rem 1.4rem 1.4rem;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }
  .panel-header h2 {
    margin: 0;
    font-size: 1.15rem;
    color: #0b0c0c;
  }

  .close-btn {
    flex: 0 0 auto;
    background: transparent;
    border: none;
    color: #6b7280;
    padding: 0.25rem;
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex;
    transition: color 0.15s ease;
  }
  .close-btn:hover,
  .close-btn:focus-visible {
    color: #081d88;
    outline: none;
  }
  .close-btn:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 2px;
  }

  .intro {
    margin: 0 0 0.6rem;
    font-size: 0.9rem;
    color: #4b5563;
    line-height: 1.5;
  }

  .disclosure {
    margin: 0 0 0.8rem;
    font-size: 0.82rem;
    color: #6b7280;
    line-height: 1.45;
  }

  .markdown {
    flex: 1 1 auto;
    overflow: auto;
    margin: 0 0 0.9rem;
    padding: 0.8rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.78rem;
    line-height: 1.45;
    white-space: pre;
    color: #0b0c0c;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .copy-btn {
    background: #081d88;
    border: 1px solid #081d88;
    color: #fff;
    padding: 0.4rem 0.85rem;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: background 0.15s ease;
  }
  .copy-btn:hover,
  .copy-btn:focus-visible {
    background: #0a25ad;
    outline: none;
  }
  .copy-btn:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 2px;
  }

  .dismiss-btn {
    background: transparent;
    border: 1px solid #d1d5db;
    color: #4b5563;
    padding: 0.4rem 0.85rem;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .dismiss-btn:hover,
  .dismiss-btn:focus-visible {
    color: #081d88;
    border-color: #081d88;
    outline: none;
  }

  .copy-error {
    margin: 0;
    font-size: 0.8rem;
    color: #d4351c;
    line-height: 1.4;
  }

  /* The button is interactive-only; omit it from printouts / PDFs. */
  @media print {
    .copy-for-ai {
      display: none;
    }
  }
</style>
