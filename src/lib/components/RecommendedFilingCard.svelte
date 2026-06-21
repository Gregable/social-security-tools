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
  // Key the loaded distributions to the inputs that actually affect mortality
  // (gender, birth year, health multiplier) so that PIA changes (earnings
  // sliders) do not trigger a life-table refetch. healthMultiplier is keyed for
  // correctness even though the calculator does not currently expose it.
  let distKey = "";

  function mortalityKey(r: Recipient): string {
    return `${r.gender}:${r.birthdate.layBirthYear()}:${r.healthMultiplier}`;
  }

  // Recipient/spouse implement the Svelte store contract; the parent re-passes
  // them on each store update, which invalidates these reactive blocks (e.g. on
  // a PIA, gender, or health change).
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
      // A newer load may have started while this one was in flight; if so, let
      // the latest win rather than applying out-of-order (stale) data.
      if (distKey !== key) return;
      dist1 = loaded.dist1;
      dist2 = loaded.dist2;
    } catch (e) {
      if (distKey !== key) return;
      console.warn("RecommendedFilingCard: failed to load mortality data", e);
      // Reset the key so the next store update retries the fetch rather than
      // treating the failed state as current.
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
    // The debounced callback intentionally reads the latest component-scope
    // recipient/spouse when it fires, not these scheduled-time values. d1/d2 are
    // safe to close over: they are keyed to recipient identity via distKey and
    // are stable across the PIA changes that trigger a recompute.
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
        // The optimizer returns an empty array for edge cases rather than
        // throwing, so a throw here signals a real bug, not expected input.
        console.error("RecommendedFilingCard: compute failed", e);
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
