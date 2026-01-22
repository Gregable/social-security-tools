<script lang="ts">
import { createEventDispatcher } from 'svelte';
import type { EarningRecord } from '$lib/earning-record';

export let earningsRecords: Array<EarningRecord> = [];

/**
 * When true, earnings cells become editable inputs.
 */
export let editable: boolean = false;

const dispatch = createEventDispatcher<{
  earningsChange: { index: number; year: number; wage: number };
}>();

function handleEarningsInput(index: number, year: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const rawValue = input.value.replace(/[^0-9]/g, '');
  let value = parseInt(rawValue, 10);
  if (isNaN(value)) value = 0;
  dispatch('earningsChange', { index, year, wage: value });
}
</script>

<div>
  {#if earningsRecords.length > 0}
    <table class="earnings-table">
      <thead>
        <tr>
          <th class="workyear">Year</th>
          <th class="age onlyDisplayLarge">Age</th>
          <th class="taxedearnings">Taxed Earnings</th>
        </tr>
      </thead>
      <tbody>
        {#each earningsRecords as earningRecord, index}
          <tr>
            <td class="workyear">{earningRecord.year}</td>
            <td class="age onlyDisplayLarge">
              {earningRecord.age}
            </td>
            {#if earningRecord.incomplete}
              <td class="taxedearnings">Not yet recorded </td>
            {:else}
              <td class="taxedearnings">
                {#if editable}
                  <input
                    type="text"
                    inputmode="numeric"
                    class="earnings-input"
                    value={earningRecord.taxedEarnings.value().toLocaleString()}
                    on:change={(e) => handleEarningsInput(index, earningRecord.year, e)}
                    on:focus={(e) => e.currentTarget.select()}
                  />
                {:else}
                  {earningRecord.taxedEarnings.wholeDollars()}
                {/if}
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  /** The earnings calc table displays similar information as from SSA.gov, but
   * in a nicer form and with some computed fields. We also reuse this fancy
   * table format for the age-based benefit table.
   */
  .earnings-table {
    border-collapse: collapse;
    width: calc(min(100% - 1em, 220px));
    margin: 10px auto 10px auto;
    font-size: 14px;
  }
  tr:not(:last-child) {
    border-bottom: 2px solid #ccc;
  }
  tbody tr:nth-child(odd) {
    background-color: #e9e9ff;
  }
  .workyear {
    text-align: left;
    padding-left: 6px;
    padding-right: 10px;
  }
  .age {
    width: 2em;
    padding-left: 6px;
    padding-right: 10px;
    text-align: center;
  }
  .taxedearnings {
    text-align: right;
    min-width: 67px;
    white-space: nowrap;
  }
  td.taxedearnings {
    padding-right: 8px;
  }
  .earnings-input {
    width: 80px;
    padding: 2px 6px;
    border: 1px solid #a8c7f5;
    border-radius: 3px;
    font-size: 14px;
    text-align: right;
    background: #fff;
  }
  .earnings-input:focus {
    outline: none;
    border-color: #4a90d9;
    box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.2);
  }
</style>
