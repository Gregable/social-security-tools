<script lang="ts">
  import posthog from 'posthog-js';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { recipient, spouse } from '$lib/context';
  import { UrlParams } from '$lib/url-params';
  import {
    parseRecipient,
    parseRecipientFromEarnings,
  } from '$lib/url-hydrate';
  import {
    describeRequires,
    validateRequires,
    type EmbedRequires,
  } from './embed-root-validate';
  import type { Recipient } from '$lib/recipient';

  export let widget: string;
  export let requires: EmbedRequires;

  let valid = false;
  let missingDescription = '';

  function parseReferrerHost(): string {
    if (!browser || !document.referrer) return '';
    try {
      return new URL(document.referrer).host;
    } catch {
      return '';
    }
  }

  function hydrateRecipient(params: UrlParams): Recipient | null {
    // Earnings takes precedence when both are present (matches PasteFlow).
    if (params.hasValidRecipientEarnings()) {
      const r = parseRecipientFromEarnings(
        params.getRecipientEarnings(),
        params.getRecipientDob(),
        params.getRecipientName()
      );
      if (r) return r;
    }
    if (params.hasValidRecipientParams()) {
      const r = parseRecipient(
        params.getRecipientPia(),
        params.getRecipientDob(),
        params.getRecipientName()
      );
      if (r) return r;
    }
    return null;
  }

  function hydrateSpouse(params: UrlParams): Recipient | null {
    if (params.hasValidSpouseEarnings()) {
      const s = parseRecipientFromEarnings(
        params.getSpouseEarnings(),
        params.getSpouseDob(),
        params.getSpouseName()
      );
      if (s) return s;
    }
    if (params.hasValidSpouseParams()) {
      const s = parseRecipient(
        params.getSpousePia(),
        params.getSpouseDob(),
        params.getSpouseName()
      );
      if (s) return s;
    }
    return null;
  }

  onMount(() => {
    recipient.set(null);
    spouse.set(null);

    const params = new UrlParams();
    valid = validateRequires(requires, params);
    missingDescription = describeRequires(requires);

    if (valid) {
      const r1 = hydrateRecipient(params);
      if (r1 && requires === 'couple-pia-and-dob') {
        const r2 = hydrateSpouse(params);
        if (r2) {
          r1.markFirst();
          r2.markSecond();
          spouse.set(r2);
        }
      }
      if (r1) {
        recipient.set(r1);
      } else {
        // Hydration failed despite param validation passing (e.g. malformed DOB).
        valid = false;
      }
    }

    if (browser) {
      posthog.capture('Embed Loaded', {
        widget,
        referrer_host: parseReferrerHost(),
        has_required_params: valid,
      });
    }
  });
</script>

{#if valid}
  <slot />
{:else}
  <div class="embed-error">
    <p>
      This ssa.tools embed needs URL parameters:
      <code>{missingDescription}</code>.
    </p>
    <p>
      See
      <a
        href="https://ssa.tools/guides/url-parameters"
        target="_blank"
        rel="noopener">URL parameters guide</a>.
    </p>
  </div>
{/if}

<style>
  .embed-error {
    padding: 20px;
    font-family: system-ui, sans-serif;
    color: #4b5563;
    font-size: 14px;
  }
  .embed-error code {
    background: #f3f4f6;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 13px;
  }
  .embed-error a {
    color: #2563eb;
  }
</style>
