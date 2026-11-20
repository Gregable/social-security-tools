<script lang="ts">
  import {
    STRATEGY_MODE_LABELS,
    STRATEGY_MODES,
    type StrategyMode,
  } from "$lib/strategy/ui";
  import ModeIcon from "./ModeIcon.svelte";

  export let onselect: (mode: StrategyMode) => void;
</script>

<section class="mode-picker">
  <h2>Who are we calculating for?</h2>
  <p class="hint">Pick one to continue.</p>
  <div class="choices">
    {#each STRATEGY_MODES as mode}
      <button type="button" class="choice" on:click={() => onselect(mode)}>
        <span class="icon"><ModeIcon {mode} size={44} /></span>
        <span class="title">{STRATEGY_MODE_LABELS[mode].title}</span>
        <span class="sub">{STRATEGY_MODE_LABELS[mode].subtitle}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .mode-picker {
    max-width: 860px;
    margin: 0 auto;
    padding: 1.5rem;
    text-align: center;
  }
  .mode-picker h2 {
    margin: 0 0 0.25rem;
    font-size: 1.4rem;
  }
  .hint {
    color: #555;
    margin: 0 0 1.25rem;
  }
  .choices {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .choice {
    flex: 1 1 200px;
    min-height: 160px;
    padding: 1.5rem 1rem 1.25rem;
    background: white;
    border: 2px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    color: #081d88;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease,
      color 0.15s ease,
      transform 0.15s ease;
  }
  .choice:hover,
  .choice:focus {
    border-color: #005ea5;
    background: #f0f7fc;
    color: #05126b;
    outline: none;
    transform: translateY(-1px);
  }
  .icon {
    margin-bottom: 0.5rem;
    flex-shrink: 0;
  }
  .title {
    font-weight: bold;
    font-size: 1.1rem;
    color: #0b0c0c;
  }
  .sub {
    font-size: 0.85rem;
    color: #555;
  }
  @media (max-width: 500px) {
    .choices {
      flex-direction: column;
    }
  }
</style>
