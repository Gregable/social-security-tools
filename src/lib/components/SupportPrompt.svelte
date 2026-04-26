<script lang="ts">
  import { browser } from "$app/environment";
  import KoFiImg from "$lib/images/kofi.png";
  import posthog from "posthog-js";
  import { onMount } from "svelte";

  const KOFI_URL = "https://ko-fi.com/ssatools";

  let shownTracked = false;

  function handleClick() {
    if (browser) {
      posthog.capture("Support Prompt: Clicked");
    }
  }

  onMount(() => {
    if (browser && !shownTracked) {
      shownTracked = true;
      posthog.capture("Support Prompt: Shown");
    }
  });
</script>

<aside class="support-prompt">
  <header class="header">
    <p class="kicker">Support this work</p>
  </header>
  <p class="copy">
    Free, with no account or email, and your data never leaves your browser.
    By comparison, Quicken's Social Security Optimizer is $50/year. Tips
    keep ssa.tools free.
  </p>
  <p class="cta">
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      on:click={handleClick}
    >
      <img
        src={KoFiImg}
        alt="Buy me a coffee on Ko-fi"
        height="55"
        width="214"
      />
    </a>
  </p>
</aside>

<style>
  .support-prompt {
    margin: 1.5rem 0;
  }

  .header {
    padding-bottom: 0.5rem;
    margin-bottom: 0.6rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .kicker {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    color: #6b7280;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .copy {
    margin: 0 0 1.4rem;
    color: #1f2937;
    line-height: 1.65;
    font-size: 1.12rem;
  }

  .cta {
    margin: 0;
    text-align: center;
  }

  .cta a {
    display: inline-block;
    border-radius: 8px;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  .cta a:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(11, 17, 48, 0.12);
  }

  .cta a:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 4px;
  }

  .cta img {
    display: block;
    border: 0;
  }
</style>
