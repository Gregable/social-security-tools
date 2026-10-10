<script lang="ts">
import posthog from 'posthog-js';
import { onDestroy, onMount } from 'svelte';
import { browser } from '$app/environment';
import { claimOncePerSession } from '$lib/analytics/session-once';

const DISMISS_KEY = 'mobileDesktopPromptDismissed';
// "Shown" is sent when the prompt first scrolls into view, once per tab
// session (sessionStorage), not per mount: the prompt remounts whenever the
// paste step restarts (e.g. after "Try again") and sits below the fold.
const SHOWN_KEY = 'mobileDesktopPromptShownTracked';
// Where the prompt sits on the page, sent with "Shown" so a later move can be
// compared.
const PLACEMENT = 'below_paste';
const SITE_URL = 'https://ssa.tools/calculator';

let isVisible = false;
let promptEl: HTMLDivElement | undefined;
let observer: IntersectionObserver | null = null;
let canShare = false;
let isCopied = false;
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
    isCopied = true;
    posthog.capture('Mobile: Desktop Reminder Clicked', { method: 'copy_link' });
    copiedTimer = setTimeout(() => { isCopied = false; }, 2000);
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
  isVisible = false;
  posthog.capture('Mobile: Desktop Reminder Dismissed');
  if (browser) {
    try {
      sessionStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // Storage blocked: the prompt may reappear on the next visit.
    }
  }
}

onDestroy(() => {
  if (copiedTimer !== null) {
    clearTimeout(copiedTimer);
  }
  observer?.disconnect();
});

function reportShownWhenSeen(node: HTMLElement) {
  if (typeof IntersectionObserver === 'undefined') return;
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer?.disconnect();
      if (claimOncePerSession(sessionStorage, SHOWN_KEY)) {
        posthog.capture('Mobile: Desktop Reminder Shown', { placement: PLACEMENT });
      }
    },
    { threshold: 0.5 }
  );
  observer.observe(node);
}

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
}

onMount(() => {
  if (!browser) return;

  if (wasDismissed()) return;

  const mq = window.matchMedia('(max-width: 768px)');
  if (!mq.matches) return;

  isVisible = true;
  canShare = typeof navigator.share === 'function';
});

// The element exists only after isVisible renders it.
$: if (promptEl && !observer) reportShownWhenSeen(promptEl);
</script>

{#if isVisible}
  <div class="prompt" bind:this={promptEl}>
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
        {isCopied ? 'Copied!' : 'Copy link'}
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
