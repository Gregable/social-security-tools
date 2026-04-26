<script lang="ts">
  import InfoTip from "$lib/components/InfoTip.svelte";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import type { Recipient } from "$lib/recipient";
  import DiscountRateInput from "./DiscountRateInput.svelte";

  export let recipients: [Recipient, Recipient];
  export let isSingle: boolean;
  export let discountRatePercent: number;
  export let onRecipientUpdate: () => void;
  export let onDiscountRateValidityChange: (valid: boolean) => void;
  /** Parent signals when the sticky wrapper has pinned to the viewport. */
  export let isStuck: boolean = false;

  function handleHealthChange(index: number, sliderValue: number) {
    // Slider [0.7, 2.5] maps to health [2.5, 0.7] — inverted so right = better.
    recipients[index].healthMultiplier = 3.2 - sliderValue;
    recipients = [...recipients];
    onRecipientUpdate();
  }

  function healthMultiplierToSliderValue(m: number): number {
    return 3.2 - m;
  }

  function getHealthCategory(multiplier: number): string {
    const anchors: { value: number; label: string }[] = [
      { value: 0.7, label: "Exceptional Health" },
      { value: 0.8, label: "Excellent Health" },
      { value: 0.9, label: "Good Health" },
      { value: 1.0, label: "Average Health" },
      { value: 1.3, label: "Fair Health" },
      { value: 1.7, label: "Poor Health" },
      { value: 2.5, label: "Very Poor Health" },
    ];
    let best = anchors[0];
    for (const a of anchors) {
      if (Math.abs(a.value - multiplier) < Math.abs(best.value - multiplier)) {
        best = a;
      }
    }
    return best.label;
  }

  function getShortHealthCategory(multiplier: number): string {
    return getHealthCategory(multiplier).replace(/\s*Health$/, "");
  }
</script>

<div class="tunable-wrapper" class:is-compact={isStuck}>
  <header class="section-header">
    <p class="section-kicker">Tunable assumptions</p>
  </header>

  <div class="health-cards" class:single={isSingle}>
  {#each recipients as recipient, i}
    {#if !isSingle || i === 0}
      <div class="health-card">
        <div class="row">
          <span>
            <RecipientName r={recipient} apos>Your</RecipientName> health
            <InfoTip label="About mortality and health assumptions">
              Mortality assumptions use SSA cohort life tables. Adjust
              relative health using this slider. Learn more in the <a
                href="/guides/mortality"
                target="_blank"
                rel="noopener">mortality &amp; health adjustment guide</a
              >.
            </InfoTip>
          </span>
          <span class="value">
            <span class="value-full"
              >{getHealthCategory(recipient.healthMultiplier)}</span
            >
            <span class="value-short"
              >{getShortHealthCategory(recipient.healthMultiplier)}</span
            >
            ({recipient.healthMultiplier.toFixed(1)}x)
          </span>
        </div>
        <div class="endlabels">
          <span>worse</span>
          <span>better</span>
        </div>
        <input
          id={`health${i}`}
          type="range"
          min="0.7"
          max="2.5"
          step="0.1"
          value={healthMultiplierToSliderValue(recipient.healthMultiplier)}
          on:input={(event) =>
            handleHealthChange(i, parseFloat(event.currentTarget.value))}
        />
      </div>
    {/if}
  {/each}
</div>

<div class="discount-row">
    <DiscountRateInput
      bind:discountRatePercent
      {isStuck}
      onValidityChange={onDiscountRateValidityChange}
    />
  </div>
</div>

<style>
  .tunable-wrapper {
    margin: 0.75rem 0 0.75rem;
    transition: padding 0.15s ease;
  }

  .section-header {
    padding-bottom: 0.5rem;
    margin-bottom: 0.6rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-kicker {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .value-short {
    display: none;
  }

  /* Compact (sticky) layout: fit health sliders + discount controls on one row. */
  .tunable-wrapper.is-compact {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .tunable-wrapper.is-compact .section-header {
    display: none;
  }

  .tunable-wrapper.is-compact .health-cards,
  .tunable-wrapper.is-compact .health-cards.single {
    display: flex;
    flex: 1 1 auto;
    margin: 0;
    padding-bottom: 0;
    gap: 0.5rem;
    grid-template-columns: none;
    max-width: none;
    border-bottom: none;
  }

  .tunable-wrapper.is-compact .health-card {
    display: flex;
    align-items: center;
    flex: 1 1 280px;
    min-width: 0;
    padding: 0.35rem 0.6rem;
    gap: 0.6rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
  }

  .tunable-wrapper.is-compact .row {
    flex: 0 0 auto;
    justify-content: flex-start;
    gap: 0.4rem;
    font-size: 0.85rem;
  }

  .tunable-wrapper.is-compact .value-full {
    display: none;
  }

  .tunable-wrapper.is-compact .value-short {
    display: inline;
  }

  .tunable-wrapper.is-compact .endlabels {
    display: none;
  }

  .tunable-wrapper.is-compact .health-card input[type="range"] {
    flex: 1 1 auto;
    min-width: 80px;
    height: 1em;
    margin: 0;
  }

  .tunable-wrapper.is-compact .discount-row {
    padding: 0.35rem 0.6rem;
    flex: 0 1 auto;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
  }
  .health-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem 2rem;
    padding-bottom: 0.85rem;
    margin-bottom: 0.85rem;
    border-bottom: 1px solid #f3f4f6;
  }
  .health-cards.single {
    grid-template-columns: 1fr;
    max-width: 720px;
  }
  .health-card {
    padding: 0.4rem 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.95rem;
    font-weight: 600;
    color: #1f2937;
  }
  .value {
    color: #005ea5;
    font-weight: 700;
  }
  .endlabels {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: #888;
    margin-top: 4px;
  }
  .health-card input[type="range"] {
    width: 100%;
    height: 1.5em;
    padding: 0;
    margin-top: 2px;
  }
  .discount-row {
    padding: 0.4rem 0;
  }
  @media (max-width: 768px) {
    .health-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
