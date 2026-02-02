<script lang="ts">
import posthog from 'posthog-js';
import { onDestroy, onMount } from 'svelte';
import { browser } from '$app/environment';

const DISMISS_KEY = 'mobileDesktopPromptDismissed';
const SITE_URL = 'https://ssa.tools/calculator';

let visible = false;
let canShare = false;
let copied = false;
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const subject = encodeURIComponent('Try SSA.tools on your computer');
const body = encodeURIComponent(
  `Here's the link to calculate your Social Security benefits:\n\n${SITE_URL}\n\nCopying your earnings record from ssa.gov is much easier on a desktop or laptop.`
);
const mailtoHref = `mailto:?subject=${subject}&body=${body}`;

function handleEmailClick() {
  posthog.capture('Mobile: Desktop Reminder Clicked', { method: 'email' });
}

async function handleCopyLink() {
  try {
    await navigator.clipboard.writeText(SITE_URL);
    copied = true;
    posthog.capture('Mobile: Desktop Reminder Clicked', { method: 'copy_link' });
    copiedTimer = setTimeout(() => { copied = false; }, 2000);
  } catch {
    // Fallback: clipboard may not be available
  }
}

async function handleShare() {
  try {
    await navigator.share({
      title: 'SSA.tools - Social Security Calculator',
      text: 'Calculate your Social Security benefits (works best on a computer)',
      url: SITE_URL,
    });
    posthog.capture('Mobile: Desktop Reminder Clicked', { method: 'share' });
  } catch {
    // User cancelled or share failed
  }
}

function dismiss() {
  visible = false;
  posthog.capture('Mobile: Desktop Reminder Dismissed');
  if (browser) {
    sessionStorage.setItem(DISMISS_KEY, 'true');
  }
}

onDestroy(() => {
  if (copiedTimer !== null) {
    clearTimeout(copiedTimer);
  }
});

onMount(() => {
  if (!browser) return;

  const dismissed = sessionStorage.getItem(DISMISS_KEY) === 'true';
  if (dismissed) return;

  const mq = window.matchMedia('(max-width: 768px)');
  if (!mq.matches) return;

  visible = true;
  canShare = typeof navigator.share === 'function';
  posthog.capture('Mobile: Desktop Reminder Shown');
});
</script>

{#if visible}
  <div class="prompt">
    <button class="dismiss" on:click={dismiss} aria-label="Dismiss">&times;</button>
    <div class="heading">Easier on a computer</div>
    <p>
      Copying your earnings record works best on a desktop or laptop.
      Save this link to visit later.
    </p>
    <div class="actions">
      <a class="cta" href={mailtoHref} on:click={handleEmailClick}>
        Email myself
      </a>
      <button class="cta secondary" on:click={handleCopyLink}>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      {#if canShare}
        <button class="cta secondary" on:click={handleShare}>
          Share
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .prompt {
    position: relative;
    max-width: min(480px, 90%);
    margin: 1em auto;
    padding: 1em 1.25em;
    background: #eef6fb;
    border: 1px solid #c8dce8;
    border-radius: 8px;
    text-align: center;
    font-size: 0.9em;
  }

  .dismiss {
    position: absolute;
    top: 4px;
    right: 8px;
    background: none;
    border: none;
    font-size: 1.4em;
    color: #888;
    cursor: pointer;
    padding: 0;
    min-width: auto;
    line-height: 1;
  }

  .dismiss:hover {
    color: #555;
    background: none;
  }

  .heading {
    font-weight: 600;
    color: #2c5f72;
    margin-bottom: 0.4em;
    font-size: 1.05em;
  }

  p {
    margin: 0 0 0.8em 0;
    color: #555;
    line-height: 1.4;
  }

  .actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .cta {
    display: inline-block;
    padding: 8px 16px;
    background: #4a90a4;
    color: #fff;
    border-radius: 20px;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9em;
    border: none;
    cursor: pointer;
    min-width: auto;
  }

  .cta:hover {
    background: #2c5f72;
  }

  .secondary {
    background: #fff;
    color: #4a90a4;
    border: 1px solid #4a90a4;
  }

  .secondary:hover {
    background: #f0f7fa;
    color: #2c5f72;
    border-color: #2c5f72;
  }
</style>
