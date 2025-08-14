<!--
  @component
  @name PasteConfirm
  @description
    A component that prompts the user to paste their earnings record or select
    from a list of demo records.

  @example
    <PasteConfirm on:confirm={handleConfirm} on:decline={handleDecline} />

  @events
    confirm: Fired if user confirms the earnings record correctly parsed.
    decline: Fired if user denies the earnings record correctly parsed.
-->

<script lang="ts">
  import type { EarningRecord } from '$lib/earning-record';

  // Callback props for events
  export let onconfirm: (() => void) | undefined = undefined;
  export let ondecline: (() => void) | undefined = undefined;

  export let earningsRecords: EarningRecord[] = [];
  // Display the records in the same order as the SSA website: reverse
  // chronological.
  $: ssaSortedEarningsRecords = earningsRecords.sort((a, b) => b.year - a.year);

  function earningsRecordsIncludeMedicare() {
    for (let i = 0; i < earningsRecords.length; ++i) {
      if (earningsRecords[i].taxedMedicareEarnings.value() > 0) return true;
    }
    return false;
  }

  function confirm() {
    onconfirm?.();
  }
  function decline() {
    ondecline?.();
  }
</script>

<div>
  <div class="confirmation">
    <h3>Step 1 of 2: Confirm Earnings Record</h3>
    <p>Is this the same table you copied from ssa.gov?</p>

    <button on:click={confirm} class="success">
      <ico>&#10003;</ico> Yes
    </button>
    <button on:click={decline} class="failure">
      <ico>&#128078;</ico> No
    </button>
  </div>

  <table>
    <thead>
      <tr>
        <th>Work Year</th>
        <th>Taxed Social Security Earnings</th>
        {#if earningsRecordsIncludeMedicare()}
          <th> Taxed Medicare Earnings </th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each ssaSortedEarningsRecords as earningRecord}
        <tr>
          <td>{earningRecord.year}</td>
          <td>
            {#if earningRecord.taxedEarnings.value() >= 0}
              <span>{earningRecord.taxedEarnings.wholeDollars()}</span>
            {:else}
              <span> Not yet recorded </span>
            {/if}
          </td>
          {#if earningsRecordsIncludeMedicare()}
            <td>
              {#if earningRecord.taxedMedicareEarnings.value() >= 0}
                <span>{earningRecord.taxedMedicareEarnings.wholeDollars()}</span
                >
              {:else}
                <span> Not yet recorded </span>
              {/if}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .confirmation {
    text-align: center;
    font-size: 18px;
  }
  button {
    border: 0 none;
    border-radius: 36px;
    color: #fff;
    font-size: 18px;
    padding: 8px 26px;
    margin: 0 10px;
    min-width: 110px;
    cursor: pointer;
  }
  button.success {
    background: #4ac15a;
  }
  button.failure {
    background: #d9534f;
  }
  button.success:hover {
    background: #2aa13a;
  }
  button.failure:hover {
    background: #b9332f;
  }
  button > ico {
    font-weight: bold;
    font-size: 22px;
  }

  /**
   * earnings-record table styles match the SSA.gov site so that the table looks
   * similar when pasted in. The reason for consistency is that we are asking
   * the user if we have entered the data correctly and making it a similar
   * style may help to visually verify the data.
   */
  table {
    margin: 50px auto;
    max-width: calc(min(600px, 100% - 20px));
    border: 1px solid #ddd;
    border-collapse: collapse;
    font-family: Arimo, sans-serif;
    font-size: 16px;
    line-height: 24px;
    color: #222;
  }

  tr:nth-child(odd) {
    background-color: #f6f6f6;
  }

  th {
    background-color: #fff;
    padding: 4px 10px;
    border-bottom: 3px solid #ccc;
    font-weight: bold;
    line-height: 20px;
    box-sizing: border-box;
  }

  td:not(:last-child) {
    border-right: solid 1px #ddd;
  }

  td {
    padding: 4px 10px;
    vertical-align: top;
    line-height: 20px;
    margin: 0;
    box-sizing: border-box;
  }
</style>
