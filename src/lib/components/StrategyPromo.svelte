<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import { buildStrategyHash } from "$lib/url-params";
  import RecipientName from "$lib/components/RecipientName.svelte";

  export let recipient: Recipient;
  export let spouse: Recipient | null = null;

  function formatDob(r: Recipient): string {
    const bd = r.birthdate;
    const y = bd.layBirthYear();
    const m = (bd.layBirthMonth() + 1).toString().padStart(2, "0");
    const d = bd.layBirthDayOfMonth().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatPia(r: Recipient): string {
    return r.pia().primaryInsuranceAmount().roundToDollar().wholeDollars();
  }

  $: strategyUrl = buildStrategyUrl(recipient, spouse);

  function buildStrategyUrl(r: Recipient, s: Recipient | null): string {
    const isSingle = !s;
    const name1 =
      r.name && r.name !== "Self" ? r.name : undefined;
    const name2 =
      s && s.name && s.name !== "Spouse" ? s.name : undefined;
    const hash = buildStrategyHash({
      isSingle,
      pia1: r.pia().primaryInsuranceAmount().roundToDollar().value(),
      dob1: formatDob(r),
      name1,
      gender1: r.gender === "male" || r.gender === "female" ? r.gender : "blended",
      pia2: s
        ? s.pia().primaryInsuranceAmount().roundToDollar().value()
        : undefined,
      dob2: s ? formatDob(s) : undefined,
      name2,
      gender2:
        s && (s.gender === "male" || s.gender === "female")
          ? s.gender
          : "blended",
    });
    return `/strategy${hash}`;
  }
</script>

<div class="pageBreakAvoid">
  <h3 class="subheading">Strategy Optimizer</h3>
  {#if spouse}
    <p class="pia-summary">
      Your PIAs are <strong>{formatPia(recipient)}</strong> for
      <RecipientName r={recipient} /> and
      <strong>{formatPia(spouse)}</strong> for
      <RecipientName r={spouse} /> — already pre-filled in the optimizer.
    </p>
  {:else}
    <p class="pia-summary">
      Your PIA is <strong>{formatPia(recipient)}</strong> — already
      pre-filled in the optimizer.
    </p>
  {/if}
  <a class="cta-btn" href={strategyUrl}>
    Open Strategy Optimizer
    <svg
      class="arrow-icon"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  </a>
</div>

<style>
  .subheading {
    margin: 0.75rem 0.5rem 0.4rem;
    font-size: 1rem;
    font-weight: 600;
    color: #0b0c0c;
  }

  .pia-summary {
    margin: 0 0.5rem 1rem;
    line-height: 1.5;
    color: #4b5563;
    font-size: 0.95rem;
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0 0.5rem;
    background: #081d88;
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 0.55rem 1rem;
    border-radius: 5px;
    transition: background 0.15s ease;
  }

  .cta-btn:hover,
  .cta-btn:focus-visible {
    background: #0a23a8;
    outline: none;
  }

  .cta-btn:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 3px;
  }

  .arrow-icon {
    flex-shrink: 0;
  }
</style>
