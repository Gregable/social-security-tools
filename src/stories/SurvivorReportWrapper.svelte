<script lang="ts">
  import { Recipient } from '$lib/recipient';
  import SurvivorReport from '$lib/components/SurvivorReport.svelte';

  export let recipient: Recipient;
  export let spouse: Recipient;

  function formatRecipientInfo(r: Recipient): string {
    const pia = r.pia().primaryInsuranceAmount();
    return `${r.name}: Born ${r.birthdate.layBirthdateString()}, PIA: ${pia.string()}`;
  }

  $: higherEarner = $recipient.higherEarningsThan($spouse) ? $recipient : $spouse;
  $: lowerEarner = $recipient.higherEarningsThan($spouse) ? $spouse : $recipient;
</script>

<div class="scenario-info">
  <strong>Scenario Info:</strong>
  <div class="recipient-row higher">
    Higher Earner: {formatRecipientInfo(higherEarner)}
  </div>
  <div class="recipient-row lower">
    Lower Earner: {formatRecipientInfo(lowerEarner)}
  </div>
</div>

<SurvivorReport {recipient} {spouse} />

<style>
  .scenario-info {
    padding: 1em;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    font-family: monospace;
    font-size: 14px;
    margin-bottom: 1em;
  }
  .recipient-row {
    margin-top: 0.5em;
  }
  .higher {
    color: #c75300;
  }
  .lower {
    color: #2e7d32;
  }
</style>
