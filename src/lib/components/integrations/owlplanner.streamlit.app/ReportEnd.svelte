<script lang="ts">
  import RecipientName from "$lib/components/RecipientName.svelte";
  import type { Recipient } from "$lib/recipient";

  export let recipient: Recipient;
  export let spouse: Recipient | null = null;

  const TARGET_ORIGIN = "https://owlplanner.streamlit.app";
  let status: "idle" | "sent" | "noOpener" | "error" = "idle";
  let recipientPia;
  let spousePia;
  let recipientPiaDollars: number | null = null;
  let userIdx = "";
  let payload: { userIdx: string; pia: number } | null = null;
  let fallbackUrl = `${TARGET_ORIGIN}/`;
  let hasOpener = false;

  // Get PIA values for recipient and spouse
  $: recipientPia = $recipient?.pia()?.primaryInsuranceAmount();
  $: spousePia = $spouse?.pia()?.primaryInsuranceAmount();
  $: recipientPiaDollars = recipientPia.roundToDollar().value();
  $: userIdx = ($recipient?.name ?? "") || "0";
  $: payload =
    recipientPiaDollars !== null ? { userIdx, pia: recipientPiaDollars } : null;
  $: fallbackUrl = payload
    ? `${TARGET_ORIGIN}/#from=ssa.tools&useridx=${encodeURIComponent(
        payload.userIdx
      )}&pia=${encodeURIComponent(payload.pia.toString())}`
    : `${TARGET_ORIGIN}/`;
  $: hasOpener =
    typeof window !== "undefined" &&
    Boolean(window.opener && !window.opener.closed);

  function sendToOwl() {
    if (!payload || !hasOpener) return;
    try {
      opener.postMessage({ type: "ssa:pias", payload }, TARGET_ORIGIN);
      status = "sent";
    } catch (err) {
      console.error("Failed to post message to Owl Retirement Planner", err);
      status = "error";
    }
  }
</script>

<div class="pageBreakAvoid">
  <h2>Owl Retirement Planner</h2>

  <div class="text">
    <p>
      Now that you have calculated your Social Security benefits, you can use
      this information with Owl Retirement Planner to optimize your retirement
      strategy.
    </p>

    <div class="pia-display">
      <h3>Primary Insurance Amount{spouse ? "s" : ""}</h3>

      <div class="pia-values">
        {#if recipientPia}
          <div class="pia-row">
            <span class="pia-label">
              <RecipientName r={$recipient} apos /> PIA:
            </span>
            <span class="pia-value">
              {recipientPia.wholeDollars()}
            </span>
          </div>
        {/if}

        {#if spouse !== null && spousePia}
          <div class="pia-row">
            <span class="pia-label">
              <RecipientName r={$spouse} apos /> PIA:
            </span>
            <span class="pia-value">
              {spousePia.wholeDollars()}
            </span>
          </div>
        {/if}
      </div>

      <p class="pia-note">
        The Primary Insurance Amount is your monthly benefit at full retirement
        age, before any early or delayed filing adjustments.
      </p>
    </div>

    {#if payload}
      <div class="send-card">
        {#if hasOpener}
          <button class="cta" type="button" on:click={sendToOwl}>
            Send PIA to Owl Planner automatically
          </button>
          {#if status === "sent"}
            <p class="status success">Sent to Owl in your previous tab.</p>
          {:else if status === "noOpener" || status === "error"}
            <p class="status error">
              Something went wrong sending to Owl. Use the link below instead.
            </p>
          {/if}
        {/if}
        <p class="fallback">
          {#if hasOpener}If the automatic send does not work,{/if} Return to Owl
          Planner with your data prefilled:<br />
          <a href={fallbackUrl} target="_blank" rel="noopener">
            {fallbackUrl}
          </a>
        </p>
      </div>
    {/if}
  </div>
</div>

<style>
  .pageBreakAvoid {
    page-break-inside: avoid;
  }

  .text {
    margin: 1rem 0;
  }

  .pia-display {
    background-color: #f5f5f5;
    border-left: 4px solid #007acc;
    padding: 1rem;
    margin: 1.5rem 0;
    border-radius: 4px;
  }

  .pia-display h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    color: #333;
  }

  .pia-values {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .pia-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.1rem;
  }

  .pia-label {
    font-weight: 500;
  }

  .pia-value {
    font-size: 1.3rem;
    font-weight: 600;
    color: #007acc;
    font-family: "Courier New", monospace;
  }

  .pia-note {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
    font-style: italic;
    border-top: 1px solid #ddd;
    padding-top: 0.75rem;
  }

  .send-card {
    background: #f8f9ff;
    border: 1px solid #c5d6ff;
    border-radius: 6px;
    padding: 1rem;
    margin-top: 1.5rem;
  }

  .cta {
    background: #1d4f91;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.25rem;
    font-weight: 600;
    cursor: pointer;
  }

  .cta:hover {
    background: #163c72;
  }

  .status {
    margin: 0.75rem 0 0;
    font-weight: 500;
  }

  .status.success {
    color: #1b7a30;
  }

  .status.warning {
    color: #ad5a00;
  }

  .status.error {
    color: #a11212;
  }

  .fallback {
    margin: 0.5rem 0 0;
    font-size: 0.95rem;
  }

  a {
    color: #007acc;
    text-decoration: none;
    font-weight: 500;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
