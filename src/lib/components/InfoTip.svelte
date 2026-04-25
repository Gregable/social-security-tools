<script lang="ts">
  export let label: string = "More info";

  let open = false;
  let tipEl: HTMLSpanElement;

  function toggle(event: MouseEvent) {
    // preventDefault stops the surrounding <label> from redirecting focus
    // to its associated input when the InfoTip button is clicked.
    event.preventDefault();
    event.stopPropagation();
    open = !open;
  }

  function handleDocClick(event: MouseEvent) {
    if (tipEl && !tipEl.contains(event.target as Node)) {
      open = false;
    }
  }

  function handlePointerEnter(event: PointerEvent) {
    if (event.pointerType === "mouse") open = true;
  }

  function handlePointerLeave(event: PointerEvent) {
    if (event.pointerType === "mouse") open = false;
  }
</script>

<svelte:window on:click={handleDocClick} />

<span
  class="info-tip"
  bind:this={tipEl}
  role="presentation"
  on:pointerenter={handlePointerEnter}
  on:pointerleave={handlePointerLeave}
>
  <button
    type="button"
    class="info-trigger"
    tabindex="-1"
    aria-label={label}
    aria-expanded={open}
    on:click={toggle}
  >
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <circle cx="8" cy="4.8" r="0.9" fill="currentColor" />
      <path
        d="M6.5 7.5h1.8v4.7"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
  {#if open}
    <span class="info-bubble" role="tooltip">
      <slot />
    </span>
  {/if}
</span>

<style>
  .info-tip {
    position: relative;
    display: inline-flex;
    align-items: center;
    margin-left: 0.35rem;
    vertical-align: baseline;
  }
  .info-trigger {
    background: none;
    border: none;
    padding: 0;
    color: #9ca3af;
    cursor: help;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    border-radius: 50%;
    transition: color 0.15s ease;
  }
  .info-trigger:hover,
  .info-trigger:focus-visible {
    color: #081d88;
    outline: none;
  }
  .info-bubble {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    background: #0b1130;
    color: #f3f4f6;
    padding: 0.6rem 0.8rem;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 400;
    line-height: 1.45;
    width: max-content;
    max-width: 260px;
    box-shadow: 0 4px 14px rgba(11, 17, 48, 0.18);
    z-index: 20;
    text-align: left;
  }
  /* Invisible bridge across the gap between icon and bubble so the
     pointer can travel up to the bubble (e.g. to click a link) without
     leaving the .info-tip hover region. */
  .info-bubble::before {
    content: "";
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 12px;
  }
  .info-bubble::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #0b1130;
  }
  .info-bubble :global(a) {
    color: #a5b4fc;
    text-decoration: underline;
  }
  .info-bubble :global(a:hover),
  .info-bubble :global(a:focus-visible) {
    color: #c7d2fe;
  }
  @media (max-width: 500px) {
    .info-bubble {
      max-width: 220px;
    }
  }
</style>
