<script lang="ts">
  import RecipientName from "$lib/components/RecipientName.svelte";
  import type { Recipient } from "$lib/recipient";
  import DiscountRateInput from "./DiscountRateInput.svelte";

  export let recipients: [Recipient, Recipient];
  export let isSingle: boolean;
  export let discountRatePercent: number;
  export let onRecipientUpdate: () => void;
  export let onDiscountRateValidityChange: (valid: boolean) => void;

  function handleHealthChange(index: number, sliderValue: number) {
    // Slider 0.7..2.5 maps to health 2.5..0.7 (reversed so "right = better")
    const healthMultiplier = 3.2 - sliderValue;
    const clamped = Math.max(0.7, Math.min(2.5, healthMultiplier));
    recipients[index].healthMultiplier = clamped;
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
</script>

<div class="tunable-title"><strong>Tunable assumptions</strong></div>

<div class="health-cards" class:single={isSingle}>
  {#each recipients as recipient, i}
    {#if !isSingle || i === 0}
      <div class="health-card">
        <div class="row">
          <span>
            <RecipientName r={recipient} apos /> health
          </span>
          <span class="value">
            {getHealthCategory(recipient.healthMultiplier)} ({recipient.healthMultiplier.toFixed(
              1
            )}x)
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
    onValidityChange={onDiscountRateValidityChange}
  />
</div>

<p class="mortality-guide-note">
  Mortality assumptions use SSA cohort life tables. Adjust relative health using
  the sliders above. Learn more in the <a
    href="/guides/mortality"
    target="_blank"
    rel="noopener">mortality &amp; health adjustment guide</a
  >.
</p>

<style>
  .tunable-title {
    font-size: 0.95rem;
    color: #333;
    margin: 1rem 0 0.5rem;
  }
  .health-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  .health-cards.single {
    grid-template-columns: 1fr;
    max-width: 600px;
  }
  .health-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 0.7rem 0.9rem;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.9rem;
    color: #333;
  }
  .value {
    color: #005ea5;
    font-weight: bold;
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
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 0.5rem 0.9rem;
  }
  .mortality-guide-note {
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #444;
  }
  .mortality-guide-note a {
    color: #0074d9;
    text-decoration: none;
  }
  .mortality-guide-note a:hover {
    text-decoration: underline;
  }
  @media (max-width: 768px) {
    .health-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
