<!--
  @component
  @name ModeIcon
  @description
    The line drawing for a strategy mode, shared so a choice looks the same
    wherever the page names it. Drawn in currentColor, so it takes the text
    color of whatever contains it.
-->
<script lang="ts">
  import type { StrategyMode } from "$lib/strategy/ui";

  export let mode: StrategyMode;
  /** Width and height in CSS pixels. */
  export let size: number = 24;
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if mode === "single"}
    <circle cx="12" cy="8" r="4" />
    <path d="M5 21a7 7 0 0 1 14 0" />
  {:else if mode === "couple"}
    <circle cx="8" cy="9" r="3" />
    <circle cx="16" cy="9" r="3" />
    <path d="M2 20a5 5 0 0 1 10 0" />
    <path d="M12 20a5 5 0 0 1 10 0" />
  {:else}
    <!-- The late spouse is drawn in a dashed outline beside the survivor. -->
    <circle cx="8" cy="9" r="3" />
    <path d="M2 20a5 5 0 0 1 10 0" />
    <g class="late" stroke-dasharray="1.6 1.9">
      <circle cx="16" cy="9" r="3" />
      <path d="M12 20a5 5 0 0 1 10 0" />
    </g>
  {/if}
</svg>

<style>
  svg {
    display: block;
    flex-shrink: 0;
  }
  .late {
    opacity: 0.6;
  }
</style>
