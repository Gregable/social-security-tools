<!--
  @component
  @name ClipboardPasteButton
  @description
    "Paste from clipboard" button for the earnings record paste step, with an
    "or paste into the box below" line. Hands non-blank clipboard text to
    ontext; explains an empty clipboard or a failed read in its own message.
    Sends "Paste Flow: Clipboard Read" for every completed read (see
    $lib/analytics/paste-flow).

    The button stays enabled while a read waits on the browser's prompt, so a
    prompt that never settles cannot lock it; each click starts a new read and
    only the newest one is used. A read that finishes after the component is
    gone (the user pasted by hand meanwhile) is ignored.

    Prerendered pages have no navigator, so the button holds its space hidden
    until mount, then shows if the clipboard can be read and is removed if
    not.

  @example
    <ClipboardPasteButton ontext={(text) => (pasteContents = text)} />

  @prop ontext - Called with the clipboard's text when it is non-blank.
  @prop isSpouse - Tags the analytics event with is_spouse_entry.
  @prop clipboard - Stand-in clipboard for stories; defaults to
    navigator.clipboard.
-->

<script lang="ts">
import posthog from 'posthog-js';
import { onDestroy, onMount } from 'svelte';
import {
  clipboardReadProperties,
  PASTE_FLOW_EVENTS,
} from '$lib/analytics/paste-flow';
import {
  type ClipboardReadResult,
  type ClipboardTextReader,
  canReadClipboard,
  readClipboardText,
} from '$lib/clipboard-paste';

interface Props {
  ontext: (text: string) => void;
  isSpouse?: boolean;
  clipboard?: ClipboardTextReader;
}

let { ontext, isSpouse = false, clipboard = undefined }: Props = $props();

// 'pending' until mount, since only the browser knows whether reading works.
let support: 'pending' | 'supported' | 'unsupported' = $state('pending');
let reader: ClipboardTextReader | undefined;
// Counts clicks, so only the newest read's result is used.
let latestRead = 0;
let destroyed = false;
let failure: Exclude<ClipboardReadResult['kind'], 'text'> | null =
  $state(null);

onMount(() => {
  const candidate = clipboard ?? navigator.clipboard;
  if (canReadClipboard(candidate)) {
    reader = candidate;
    support = 'supported';
  } else {
    support = 'unsupported';
  }
});

onDestroy(() => {
  destroyed = true;
});

async function pasteFromClipboard() {
  if (!reader) return;
  const thisRead = ++latestRead;
  failure = null;
  const result = await readClipboardText(reader);
  if (destroyed || thisRead !== latestRead) return;
  // Hand over the text before reporting, so an analytics failure cannot
  // lose the paste.
  if (result.kind === 'text') {
    ontext(result.text);
  } else {
    failure = result.kind;
  }
  posthog.capture(
    PASTE_FLOW_EVENTS.clipboardRead,
    clipboardReadProperties(result, isSpouse)
  );
}
</script>

{#if support !== 'unsupported'}
  <div class="clipboardPaste" class:pending={support === 'pending'}>
    <button
      class="clipboardButton"
      disabled={support !== 'supported'}
      onclick={pasteFromClipboard}>Paste from clipboard</button
    >
    <!-- Always present, since screen readers only announce changes to a
         live region that already exists. -->
    <div class="clipboardStatus" class:shown={failure !== null} role="status">
      {#if failure === 'empty'}
        There's no text on your clipboard. Copy the earnings table on ssa.gov
        first, then try again.
      {:else if failure === 'unavailable'}
        We couldn't read your clipboard. Paste into the box below instead.
      {/if}
    </div>
    <p class="orLine">or paste into the box below</p>
  </div>
{/if}

<style>
  .clipboardPaste {
    text-align: center;
    margin-bottom: 8px;
  }

  /* Holds the space on first paint so the paste box does not jump. */
  .pending {
    visibility: hidden;
  }

  .clipboardButton {
    width: 100%;
    min-height: 44px;
    background: #4ac15a;
    border: 0 none;
    border-radius: 36px;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
  }

  .clipboardButton:hover {
    background: #2aa13a;
  }

  .clipboardStatus.shown {
    margin-top: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    background: #fffbeb;
    border: 1px solid #d97706;
    font-size: 15px;
  }

  .orLine {
    margin: 8px 0 0 0;
    color: #555;
    font-size: 0.9em;
  }
</style>
