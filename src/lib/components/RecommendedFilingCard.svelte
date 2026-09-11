<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import OptimalStrategyHeadline from "$lib/components/OptimalStrategyHeadline.svelte";
  import {
    buildStrategyUrl,
    currentMonthDate,
    DEFAULT_DISCOUNT_RATE_ASSUMPTION,
    type DiscountRateAssumption,
    filingChoices,
    loadDeathDistributions,
    loadDiscountRateAssumption,
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
  // Starts at the default so the card can render as soon as mortality data
  // loads; swapped for the live 20-year Treasury rate once that arrives, the
  // same way the strategy page's rate input behaves.
  let discountRate: DiscountRateAssumption = DEFAULT_DISCOUNT_RATE_ASSUMPTION;
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
  $: scheduleRecompute(recipient, spouse, dist1, dist2, discountRate);
  $: strategyUrl = buildStrategyUrl(recipient, spouse);

  onMount(async () => {
    discountRate = await loadDiscountRateAssumption();
  });

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

  function compute(
    d1: DeathProbability[],
    d2: DeathProbability[] | null
  ): void {
    try {
      // Reads the latest component-scope recipient/spouse. d1/d2 are passed in:
      // they are keyed to recipient identity via distKey and stay valid across
      // the PIA changes that trigger a recompute.
      const now = currentMonthDate();
      result = recommendedFromDistributions(
        recipient,
        spouse,
        d1,
        d2,
        now,
        discountRate.rate
      );
      hasFilingChoice = filingChoices(recipient, spouse, now);
      computedDiscountRate = discountRate;
    } catch (e) {
      // The optimizer returns an empty array for edge cases rather than
      // throwing, so a throw here signals a real bug, not expected input.
      console.error("RecommendedFilingCard: compute failed", e);
      result = null;
    }
  }

  function scheduleRecompute(
    _r: Recipient,
    _s: Recipient | null,
    d1: DeathProbability[] | null,
    d2: DeathProbability[] | null,
    _rate: DiscountRateAssumption
  ): void {
    // _r/_s/_rate are unused by name: they only register recipient, spouse,
    // and the discount rate as reactive dependencies so this block re-runs on
    // store updates (e.g. PIA changes) and when the Treasury rate arrives.
    if (!d1) return;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    // Compute the first result immediately so the card appears as soon as the
    // distributions load (also makes it deterministic for Chromatic, which
    // would otherwise snapshot before the debounce fires). Debounce only
    // subsequent recomputes so rapid PIA edits don't thrash the optimizer.
    if (result === null) {
      compute(d1, d2);
      return;
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      compute(d1, d2);
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

  // Assigned inside compute(), alongside `result`, so the flag and the
  // figures it re-skins always come from the same inputs: deriving it
  // reactively here would let it change during the debounce window while
  // `result` still belongs to the previous inputs.
  let hasFilingChoice: [boolean, boolean] = [true, true];
  // Likewise: the rate the displayed `result` was actually computed with, so
  // the card's copy never names the Treasury rate while the figures above it
  // still reflect the default from before that rate arrived.
  let computedDiscountRate: DiscountRateAssumption =
    DEFAULT_DISCOUNT_RATE_ASSUMPTION;
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
      discountRateAssumption={computedDiscountRate}
      {hasFilingChoice}
      currentDate={currentMonthDate()}
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
