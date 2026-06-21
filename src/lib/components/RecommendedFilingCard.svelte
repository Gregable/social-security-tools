<script lang="ts">
  import { onDestroy } from "svelte";
  import OptimalStrategyHeadline from "$lib/components/OptimalStrategyHeadline.svelte";
  import {
    buildStrategyUrl,
    currentMonthDate,
    loadDeathDistributions,
    recommendedFromDistributions,
    type RecommendedFiling,
  } from "$lib/components/recommended-filing-card";
  import type { DeathProbability } from "$lib/life-tables";
  import type { Recipient } from "$lib/recipient";

  export let recipient: Recipient;
  export let spouse: Recipient | null = null;

  const RECOMPUTE_DEBOUNCE_MS = 250;

  let dist1: DeathProbability[] | null = null;
  let dist2: DeathProbability[] | null = null;
  let result: RecommendedFiling | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  // Key the loaded distributions to gender+birthYear so that PIA changes
  // (earnings sliders) do not trigger a life-table refetch.
  let distKey = "";

  function mortalityKey(r: Recipient): string {
    return `${r.gender}:${r.birthdate.layBirthYear()}`;
  }

  // Recipient/spouse are store-backed object props; Svelte re-runs these
  // reactive blocks on every store notification.
  $: void maybeLoadDistributions(recipient, spouse);
  $: scheduleRecompute(recipient, spouse, dist1, dist2);
  $: strategyUrl = buildStrategyUrl(recipient, spouse);

  async function maybeLoadDistributions(
    r: Recipient,
    s: Recipient | null
  ): Promise<void> {
    const key = `${mortalityKey(r)}|${s ? mortalityKey(s) : "none"}`;
    if (key === distKey) return;
    distKey = key;
    try {
      const loaded = await loadDeathDistributions(r, s);
      dist1 = loaded.dist1;
      dist2 = loaded.dist2;
    } catch (e) {
      console.warn("RecommendedFilingCard: failed to load mortality data", e);
      // Reset the key so an identical recipient retries on the next update,
      // rather than staying blank after a transient load failure.
      distKey = "";
      dist1 = null;
      dist2 = null;
      result = null;
    }
  }

  function scheduleRecompute(
    _r: Recipient,
    _s: Recipient | null,
    d1: DeathProbability[] | null,
    d2: DeathProbability[] | null
  ): void {
    // _r/_s are unused by name: they only register recipient/spouse as reactive
    // dependencies so this block re-runs on store updates (e.g. PIA changes).
    // The debounced callback intentionally reads the latest module-level
    // recipient/spouse when it fires, not these scheduled-time values.
    if (!d1) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      try {
        result = recommendedFromDistributions(
          recipient,
          spouse,
          d1,
          d2,
          currentMonthDate()
        );
      } catch (e) {
        console.warn("RecommendedFilingCard: compute failed", e);
        result = null;
      }
    }, RECOMPUTE_DEBOUNCE_MS);
  }

  onDestroy(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  // OptimalStrategyHeadline always takes a [Recipient, Recipient] tuple; for a
  // single recipient it only reads index 0, so duplicate the recipient.
  $: recipientsTuple = (
    spouse ? [recipient, spouse] : [recipient, recipient]
  ) as [Recipient, Recipient];
</script>

{#if result}
  <a
    class="card-link pageBreakAvoid"
    href={strategyUrl}
    aria-label="Open the strategy optimizer to explore filing dates"
  >
    <OptimalStrategyHeadline
      isSingle={result.isSingle}
      singleResult={result.single}
      coupleResult={result.couple}
      recipients={recipientsTuple}
      showInfoTip={false}
    />
  </a>
{/if}

<style>
  .card-link {
    display: block;
    text-decoration: none;
    color: inherit;
    border-radius: 14px;
    transition: transform 0.12s ease;
  }
  .card-link:hover,
  .card-link:focus-visible {
    transform: translateY(-2px);
    outline: none;
  }
  .card-link:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 3px;
  }
</style>
